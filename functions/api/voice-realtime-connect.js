const MAX_SDP_LENGTH = 500_000;
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
    const sessionConfig = {
      type: "realtime",
      model: realtimeModel,
      instructions,
      audio: {
        input: {
          turn_detection: null
        }
      },
      output_modalities: payload.textOnly ? ["text"] : ["audio", "text"]
    };
    if (!payload.textOnly) {
      sessionConfig.audio.output = {
        voice: realtimeVoice
      };
    }

    const formData = new FormData();
    formData.set("sdp", payload.sdp);
    formData.set("session", JSON.stringify(sessionConfig));

    const response = await fetchWithTimeout(
      "https://api.openai.com/v1/realtime/calls",
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          accept: "application/sdp"
        },
        body: formData
      },
      OPENAI_REQUEST_TIMEOUT_MS
    );

    const rawBody = await response.text();
    if (!response.ok) {
      const modelError = tryReadOpenAiError(rawBody);
      return json(
        {
          error: modelError || "OpenAI Realtime API Anfrage fehlgeschlagen.",
          details: safeParagraph(rawBody, 1_800)
        },
        502
      );
    }

    const answerSdp = safeSdp(rawBody);
    if (!answerSdp) {
      return json(
        {
          error: "OpenAI Realtime API lieferte keine gueltige SDP-Antwort."
        },
        502
      );
    }

    return json({
      sdp: answerSdp,
      realtimeModel,
      realtimeVoice
    });
  } catch (error) {
    console.error("voice-realtime-connect error", error);
    return json(
      {
        error: "Realtime-Verbindung fehlgeschlagen.",
        details: safeParagraph(String(error?.message || ""), 500)
      },
      500
    );
  }
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

  const sdp = safeSdp(body?.sdp);
  const caseText = safeParagraph(body?.caseText, MAX_CASE_LENGTH);
  const promptText = safeParagraph(body?.promptText, MAX_PROMPT_LENGTH);
  const mode = normalizeMode(body?.mode);
  const textOnly = Boolean(body?.textOnly);
  const realtimeModel = safeLine(body?.realtimeModel, 80);
  const realtimeVoice = safeLine(body?.realtimeVoice, 40);

  if (!sdp) {
    return { ok: false, error: "Keine gueltige SDP im Request." };
  }
  if (!caseText) {
    return { ok: false, error: "Falltext fehlt." };
  }
  if (!promptText) {
    return { ok: false, error: "Prompt-Text fehlt." };
  }

  return {
    ok: true,
    sdp,
    caseText,
    promptText,
    mode,
    textOnly,
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
  const modeHint =
    mode === MODE_DOCTOR
      ? "Realtime-Kontext: Du fuehrst ein Arzt-Arzt-Gespraech. Eroeffne pruefungsnah und leite aktiv mit Rueckfragen."
      : "Realtime-Kontext: Du fuehrst ein Arzt-Patient-Gespraech als standardisierte Patientin/standardisierter Patient.";

  return [
    "Nutze den folgenden Prompt unveraendert als Hauptinstruktion:",
    promptText,
    "",
    "Verbindlicher Falltext:",
    caseText,
    "",
    modeHint,
    "Bleibe strikt beim Fall und antworte ausschliesslich auf Deutsch."
  ]
    .join("\n")
    .slice(0, MAX_INSTRUCTIONS_LENGTH);
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

function safeSdp(value) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, MAX_SDP_LENGTH);
}

function tryReadOpenAiError(rawBody) {
  if (!rawBody) return "";
  try {
    const parsed = JSON.parse(rawBody);
    return safeParagraph(parsed?.error?.message || "", 500);
  } catch {
    return "";
  }
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
