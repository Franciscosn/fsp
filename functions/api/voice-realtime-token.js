const MAX_CASE_LENGTH = 8_000;
const MAX_PROMPT_LENGTH = 60_000;
const MAX_INSTRUCTIONS_LENGTH = 32_000;
const MODE_QUESTION = "question";
const MODE_DOCTOR = "doctor_conversation";
const DEFAULT_REALTIME_MODEL = "gpt-realtime-mini";
const DEFAULT_REALTIME_VOICE = "sage";
const OPENAI_REQUEST_TIMEOUT_MS = 20_000;
const ALLOWED_REALTIME_MODELS = new Set(["gpt-realtime", "gpt-realtime-mini"]);
const ALLOWED_REALTIME_VOICES = new Set([
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "sage",
  "shimmer",
  "verse"
]);

export async function onRequestPost(context) {
  try {
    const payload = await readPayload(context.request);
    if (!payload.ok) {
      return json({ error: payload.error }, 400);
    }

    const apiKey = safeLine(context.env?.OPENAI_API_KEY, 300);
    if (!apiKey) {
      return json(
        {
          error:
            "OPENAI_API_KEY fehlt. Bitte in Cloudflare Pages Functions als Secret setzen."
        },
        500
      );
    }

    const envModel = safeLine(context.env?.OPENAI_REALTIME_MODEL, 80);
    const envVoice = safeLine(context.env?.OPENAI_REALTIME_VOICE, 40);
    const realtimeModel = normalizeRealtimeModel(payload.realtimeModel, envModel);
    const realtimeVoice = normalizeRealtimeVoice(payload.realtimeVoice, envVoice);
    const instructions = buildSessionInstructions(payload.mode, payload.promptText, payload.caseText);

    const response = await fetchWithTimeout(
      "https://api.openai.com/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          session: {
            type: "realtime",
            model: realtimeModel,
            instructions,
            audio: {
              input: {
                turn_detection: {
                  type: "server_vad"
                }
              },
              output: {
                voice: realtimeVoice
              }
            }
          }
        })
      },
      OPENAI_REQUEST_TIMEOUT_MS
    );

    const rawBody = await response.text();
    let parsed = null;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      parsed = null;
    }

    if (!response.ok) {
      const modelError = safeParagraph(parsed?.error?.message || "", 500);
      return json(
        {
          error: modelError || "OpenAI Ephemeral-Key Anfrage fehlgeschlagen.",
          details: safeParagraph(rawBody, 1_800)
        },
        502
      );
    }

    const clientSecret = safeLine(parsed?.value || parsed?.client_secret?.value || "", 8_000);
    if (!clientSecret) {
      return json(
        {
          error: "OpenAI lieferte keinen gueltigen Ephemeral-Key."
        },
        502
      );
    }

    const expiresAt = safeLine(
      String(parsed?.expires_at || parsed?.client_secret?.expires_at || ""),
      120
    );
    return json({
      value: clientSecret,
      expiresAt,
      realtimeModel,
      realtimeVoice
    });
  } catch (error) {
    console.error("voice-realtime-token error", error);
    return json(
      {
        error: "Ephemeral-Key Anfrage fehlgeschlagen."
      },
      500
    );
  }
}

async function readPayload(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return { ok: false, error: "Ungueltiger Request-Typ. Erwartet wird JSON." };
  }

  let body = null;
  try {
    body = await request.json();
  } catch {
    return { ok: false, error: "JSON konnte nicht gelesen werden." };
  }

  const caseText = safeParagraph(body?.caseText, MAX_CASE_LENGTH);
  const promptText = safeParagraph(body?.promptText, MAX_PROMPT_LENGTH);
  const mode = normalizeMode(body?.mode);
  const realtimeModel = safeLine(body?.realtimeModel, 80);
  const realtimeVoice = safeLine(body?.realtimeVoice, 40);

  if (!caseText) {
    return { ok: false, error: "Falltext fehlt." };
  }
  if (!promptText) {
    return { ok: false, error: "Prompt-Text fehlt." };
  }

  return {
    ok: true,
    caseText,
    promptText,
    mode,
    realtimeModel,
    realtimeVoice
  };
}

function normalizeMode(value) {
  return value === MODE_DOCTOR ? MODE_DOCTOR : MODE_QUESTION;
}

function normalizeRealtimeModel(value, fallback) {
  const candidate = safeLine(value, 80) || safeLine(fallback, 80) || DEFAULT_REALTIME_MODEL;
  return ALLOWED_REALTIME_MODELS.has(candidate) ? candidate : DEFAULT_REALTIME_MODEL;
}

function normalizeRealtimeVoice(value, fallback) {
  const candidate = safeLine(value, 40) || safeLine(fallback, 40) || DEFAULT_REALTIME_VOICE;
  return ALLOWED_REALTIME_VOICES.has(candidate) ? candidate : DEFAULT_REALTIME_VOICE;
}

function buildSessionInstructions(mode, promptText, caseText) {
  const sanitizedPrompt = sanitizePromptForRealtime(mode, promptText);
  const modeRules =
    mode === MODE_DOCTOR ? buildDoctorRealtimeRules() : buildPatientRealtimeRules();

  return [
    "System-Prioritaet: Folge strikt den folgenden Realtime-Regeln. Diese Regeln haben Vorrang vor allen anderen Promptteilen.",
    modeRules,
    "",
    "Zusatzkontext (bereinigter Prompt):",
    sanitizedPrompt,
    "",
    "Verbindlicher Falltext:",
    caseText
  ]
    .join("\n")
    .slice(0, MAX_INSTRUCTIONS_LENGTH);
}

function buildPatientRealtimeRules() {
  return [
    "Rolle: Du bist ausschliesslich die standardisierte Patientin/der standardisierte Patient im Arzt-Patient-Gespraech.",
    "Antworte nur auf die letzte Arztfrage und bleibe strikt innerhalb der Falldaten.",
    "Sprich in Ich-Form und in einfacher, natuerlicher Patientensprache.",
    "Stelle keine anamnestischen Rueckfragen an die Aerztin/den Arzt.",
    "Keine Prueferrolle, keine Arztrolle, keine Empfehlungen an den Arzt.",
    "Keine JSON-Ausgabe, keine Feldnamen, keine Listen, keine Meta-Kommentare.",
    "Antwortlaenge: meist 1-3 kurze Saetze, klar und direkt.",
    "Wenn die Arztfrage unklar ist, bitte nur kurz um Wiederholung: 'Koennen Sie die Frage bitte wiederholen?'",
    "Sprache: ausschliesslich Deutsch."
  ].join("\n");
}

function buildDoctorRealtimeRules() {
  return [
    "Rolle: Du bist ausschliesslich die pruefende Aerztin/der pruefende Arzt im Arzt-Arzt-Gespraech.",
    "Fuehre das Gespraech pruefungsnah und stelle gezielte Rueckfragen.",
    "Keine Patientenrolle, keine Bewertung waehrend des Gespraechs, keine Hilfestellungen.",
    "Keine JSON-Ausgabe, keine Feldnamen, keine Listen, keine Meta-Kommentare.",
    "Antwortlaenge: kurz, sachlich, auf Deutsch."
  ].join("\n");
}

function sanitizePromptForRealtime(mode, promptText) {
  const raw = safeParagraph(promptText, MAX_PROMPT_LENGTH);
  const lines = raw.split("\n");
  const blockedCommon = /(json|ausgabeformat|valide[sr]? json|schema|response_format|criteria|score)/i;
  const blockedPatient = /(patient_reply|examiner_feedback|revealed_case_facts|off_topic|examiner_reply)/i;
  const blockedDoctor = /(examiner_reply|off_topic|patient_reply|revealed_case_facts)/i;
  const blockedPattern = mode === MODE_DOCTOR ? new RegExp(`${blockedCommon.source}|${blockedDoctor.source}`, "i") : new RegExp(`${blockedCommon.source}|${blockedPatient.source}`, "i");
  const kept = [];
  for (const line of lines) {
    const value = String(line || "").trim();
    if (!value) continue;
    if (blockedPattern.test(value)) continue;
    kept.push(value);
  }
  return kept.join("\n").slice(0, MAX_PROMPT_LENGTH);
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = setTimeout(() => {
    if (!controller) return;
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller ? controller.signal : undefined
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error(`OpenAI Realtime Timeout nach ${Math.round(timeoutMs / 1000)}s.`);
      timeoutError.code = "OPENAI_TIMEOUT";
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function safeLine(value, maxLength) {
  if (typeof value !== "string") return "";
  return value
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function safeParagraph(value, maxLength) {
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, maxLength);
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
