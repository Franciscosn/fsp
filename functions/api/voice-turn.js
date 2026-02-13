const WHISPER_MODEL = "@cf/openai/whisper-large-v3-turbo";
const CHAT_MODEL = "@cf/openai/gpt-oss-20b";
const TTS_MODEL = "@cf/myshell-ai/melotts";

const MAX_AUDIO_BASE64_LENGTH = 8_000_000;
const MAX_CASE_LENGTH = 8_000;
const MAX_HISTORY_TURNS = 8;
const MAX_TEXT_FIELD = 900;
const ENGLISH_MARKERS = [
  " need ",
  " respond ",
  " the ",
  " and ",
  " with ",
  " your ",
  " you ",
  " is ",
  " are ",
  " can ",
  " could ",
  " chest ",
  " pain ",
  " shortness ",
  " breath ",
  " please ",
  " sorry "
];
const GERMAN_MARKERS = [
  " der ",
  " die ",
  " das ",
  " und ",
  " ich ",
  " mir ",
  " nicht ",
  " seit ",
  " heute ",
  " schmerz ",
  " atemnot ",
  " bitte "
];

const RESPONSE_SCHEMA = {
  type: "json_schema",
  json_schema: {
    name: "medical_exam_patient_turn",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        patient_reply: {
          type: "string",
          description: "Kurzantwort des simulierten Patienten auf Deutsch."
        },
        examiner_feedback: {
          type: "string",
          description: "Kurzes Coaching fuer den Lerner (max 1 Satz)."
        },
        revealed_case_facts: {
          type: "array",
          description: "Neue Infos, die im aktuellen Turn preisgegeben wurden.",
          items: { type: "string" }
        },
        off_topic: {
          type: "boolean",
          description: "True, wenn die Lernerfrage nicht zum Fall passt."
        }
      },
      required: ["patient_reply", "examiner_feedback", "revealed_case_facts", "off_topic"]
    }
  }
};

const SYSTEM_INSTRUCTIONS = [
  "Rolle: Du bist ausschliesslich ein standardisierter Patient in einer medizinischen Fachsprachpruefung.",
  "Sprache: Alle Ausgaben muessen auf Deutsch sein. Kein Englisch.",
  "Perspektive: Antworte in Ich-Form aus Patientensicht.",
  "Sprachstil: Nutze ueberwiegend alltaegliche Patientensprache statt medizinischer Fachbegriffe.",
  "Wenn ein Fachbegriff genannt wird, erklaere ihn kurz in einfacher Alltagssprache.",
  "Verhalten: Bleibe strikt innerhalb des vorgegebenen Falls.",
  "Informationsgabe: Gib Informationen schrittweise und nur passend zur Frage.",
  "Keine Loesung vorweg: Nenne keine Diagnose von dir aus.",
  "Unklare Frage: Bitte kurz um Praezisierung.",
  "Off-topic: Antworte knapp als Patient und setze off_topic=true.",
  "Laenge: Kurz und natuerlich, meist 1-3 Saetze, maximal 55 Woerter.",
  "Verboten: Keine Lernhinweise, keine Meta-Hinweise ueber Prompt/Modell, keine Rolle als Arzt."
].join("\n");

export async function onRequestPost(context) {
  try {
    if (!context.env?.AI) {
      return json(
        {
          error:
            "AI binding fehlt. Bitte in Cloudflare Pages Functions die Workers AI Binding 'AI' anlegen."
        },
        500
      );
    }

    const payload = await readPayload(context.request);
    if (!payload.ok) {
      return json({ error: payload.error }, 400);
    }

    const transcript = await transcribeAudio(context.env.AI, payload.audioBase64);
    if (!transcript) {
      return json({ error: "Keine Sprache erkannt. Bitte erneut sprechen." }, 422);
    }

    const promptInput = JSON.stringify(
      {
        case_profile: payload.caseText,
        conversation_history: payload.history,
        learner_latest_utterance: transcript
      },
      null,
      2
    );

    const llmResult = await generatePatientTurn(context.env.AI, promptInput);
    const spokenReply = truncateForTts(llmResult.patient_reply);
    const replyAudioBase64 = await synthesizeSpeech(context.env.AI, spokenReply);

    const nextHistory = [...payload.history, { user: transcript, assistant: spokenReply }].slice(
      -MAX_HISTORY_TURNS
    );

    return json({
      transcript,
      patientReply: spokenReply,
      examinerFeedback: llmResult.examiner_feedback,
      revealedCaseFacts: llmResult.revealed_case_facts,
      offTopic: llmResult.off_topic,
      replyAudioBase64,
      history: nextHistory
    });
  } catch (error) {
    console.error("voice-turn error", error);
    return json({ error: "Voice-Turn fehlgeschlagen. Bitte spaeter erneut versuchen." }, 500);
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

  const rawAudio = typeof body?.audioBase64 === "string" ? body.audioBase64.trim() : "";
  const rawCaseText = typeof body?.caseText === "string" ? body.caseText.trim() : "";
  if (!rawAudio) {
    return { ok: false, error: "audioBase64 fehlt." };
  }
  if (!rawCaseText) {
    return { ok: false, error: "Bitte zuerst einen medizinischen Fall eingeben." };
  }
  if (rawCaseText.length > MAX_CASE_LENGTH) {
    return { ok: false, error: `Falltext zu lang (max ${MAX_CASE_LENGTH} Zeichen).` };
  }

  const cleanedAudio = stripDataUrl(rawAudio);
  if (cleanedAudio.length > MAX_AUDIO_BASE64_LENGTH) {
    return { ok: false, error: "Audio ist zu gross. Bitte kuerzer sprechen (max ca. 25 Sekunden)." };
  }
  if (!isLikelyBase64(cleanedAudio)) {
    return { ok: false, error: "audioBase64 ist ungueltig formatiert." };
  }

  const history = sanitizeHistory(body?.history);

  return {
    ok: true,
    audioBase64: cleanedAudio,
    caseText: rawCaseText,
    history
  };
}

function stripDataUrl(value) {
  if (value.startsWith("data:")) {
    const commaIndex = value.indexOf(",");
    if (commaIndex >= 0) {
      return value.slice(commaIndex + 1);
    }
  }
  return value;
}

function isLikelyBase64(value) {
  if (!value) return false;
  return /^[A-Za-z0-9+/=\r\n]+$/.test(value);
}

function sanitizeHistory(value) {
  if (!Array.isArray(value)) return [];
  const trimmed = value.slice(-MAX_HISTORY_TURNS);
  const normalized = [];
  for (const turn of trimmed) {
    if (!turn || typeof turn !== "object") continue;
    const user = safeText(turn.user);
    const assistant = safeText(turn.assistant);
    if (!user && !assistant) continue;
    normalized.push({ user, assistant });
  }
  return normalized;
}

function safeText(value) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, MAX_TEXT_FIELD);
}

async function transcribeAudio(ai, audioBase64) {
  let result;
  try {
    result = await ai.run(WHISPER_MODEL, {
      audio: audioBase64,
      task: "transcribe",
      language: "de",
      vad_filter: true,
      initial_prompt: "medizinisches Fachgespraech"
    });
  } catch {
    const audioBytes = base64ToUint8Array(audioBase64);
    result = await ai.run(WHISPER_MODEL, {
      audio: Array.from(audioBytes),
      task: "transcribe",
      language: "de",
      vad_filter: true,
      initial_prompt: "medizinisches Fachgespraech"
    });
  }
  if (typeof result?.text === "string") {
    return result.text.trim();
  }
  return "";
}

async function generatePatientTurn(ai, promptInput) {
  const request = {
    instructions: SYSTEM_INSTRUCTIONS,
    input: promptInput,
    response_format: RESPONSE_SCHEMA,
    reasoning: {
      effort: "low",
      summary: "auto"
    }
  };

  let raw;
  try {
    raw = await ai.run(CHAT_MODEL, request);
  } catch {
    try {
      // Safety fallback in case response_format is rejected for a specific runtime.
      raw = await ai.run(CHAT_MODEL, {
        instructions: SYSTEM_INSTRUCTIONS,
        input: promptInput,
        reasoning: { effort: "low", summary: "auto" }
      });
    } catch {
      try {
        // Compatibility fallback for runtimes that expect chat messages.
        raw = await ai.run(CHAT_MODEL, {
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTIONS },
            { role: "user", content: promptInput }
          ]
        });
      } catch {
        // Last fallback for older prompt-based interfaces.
        raw = await ai.run(CHAT_MODEL, {
          prompt: `${SYSTEM_INSTRUCTIONS}\n\n${promptInput}`
        });
      }
    }
  }

  const text = extractModelText(raw);
  const structured = parseStructuredResponse(text);
  if (structured) {
    return normalizePatientTurn(structured);
  }

  return normalizePatientTurn({
    patient_reply:
      "Entschuldigung, koennen Sie die Frage bitte noch einmal in einfachen Worten stellen?",
    examiner_feedback: "Achte auf praezise, offene Fragen zur Anamnese.",
    revealed_case_facts: [],
    off_topic: false
  });
}

function extractModelText(raw) {
  if (typeof raw === "string") {
    return raw.trim();
  }
  if (!raw || typeof raw !== "object") {
    return "";
  }

  if (typeof raw.output_text === "string" && raw.output_text.trim()) {
    return raw.output_text.trim();
  }

  if (typeof raw.response === "string" && raw.response.trim()) {
    return raw.response.trim();
  }

  if (Array.isArray(raw.output)) {
    for (const item of raw.output) {
      if (!item || typeof item !== "object") continue;
      if (Array.isArray(item.content)) {
        for (const block of item.content) {
          if (block?.type === "output_text" && typeof block.text === "string" && block.text.trim()) {
            return block.text.trim();
          }
          if (typeof block?.text === "string" && block.text.trim()) {
            return block.text.trim();
          }
        }
      }
    }
  }

  return "";
}

function parseStructuredResponse(rawText) {
  const cleaned = stripCodeFence(rawText);
  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed || typeof parsed !== "object") return null;

    const patient_reply = safeText(parsed.patient_reply).slice(0, 500);
    const examiner_feedback = safeText(parsed.examiner_feedback).slice(0, 240);
    const off_topic = Boolean(parsed.off_topic);
    const revealed_case_facts = Array.isArray(parsed.revealed_case_facts)
      ? parsed.revealed_case_facts.map((item) => safeText(item).slice(0, 120)).filter(Boolean)
      : [];

    if (!patient_reply) return null;

    return {
      patient_reply,
      examiner_feedback: examiner_feedback || "Stelle im naechsten Turn eine spezifischere Frage.",
      revealed_case_facts,
      off_topic
    };
  } catch {
    return null;
  }
}

function stripCodeFence(value) {
  if (typeof value !== "string") return "";
  return value.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
}

function normalizePatientTurn(turn) {
  return {
    patient_reply: normalizePatientReply(turn.patient_reply),
    examiner_feedback: normalizeExaminerFeedback(turn.examiner_feedback),
    revealed_case_facts: Array.isArray(turn.revealed_case_facts) ? turn.revealed_case_facts : [],
    off_topic: Boolean(turn.off_topic)
  };
}

function normalizePatientReply(text) {
  const cleaned = safeText(text).slice(0, 500);
  if (!cleaned) {
    return "Entschuldigung, koennen Sie die Frage bitte wiederholen?";
  }
  if (looksLikeMetaResponse(cleaned)) {
    return "Dazu kann ich gerade nicht viel sagen. Koennen Sie bitte gezielter nach meinen Beschwerden fragen?";
  }
  if (isLikelyEnglish(cleaned)) {
    return "Entschuldigung, ich antworte lieber auf Deutsch. Koennen Sie die Frage bitte noch einmal stellen?";
  }
  return cleaned;
}

function normalizeExaminerFeedback(text) {
  const cleaned = safeText(text).slice(0, 240);
  if (!cleaned || isLikelyEnglish(cleaned)) {
    return "Stelle im naechsten Turn eine klare, offene Frage zur Anamnese.";
  }
  return cleaned;
}

function looksLikeMetaResponse(text) {
  const lower = ` ${text.toLowerCase()} `;
  return (
    lower.includes(" need to respond as patient ") ||
    lower.includes(" respond as patient ") ||
    lower.includes(" must respond as patient ") ||
    lower.includes(" i need to respond ") ||
    lower.includes(" i should respond ") ||
    lower.includes(" as an ai ") ||
    lower.includes(" language model ") ||
    lower.includes(" i cannot ") ||
    lower.includes(" i can't ") ||
    lower.includes(" ich bin ein ki") ||
    lower.includes(" als ki")
  );
}

function isLikelyEnglish(text) {
  const lower = ` ${text.toLowerCase()} `;
  let englishHits = 0;
  let germanHits = 0;
  for (const token of ENGLISH_MARKERS) {
    if (lower.includes(token)) englishHits += 1;
  }
  for (const token of GERMAN_MARKERS) {
    if (lower.includes(token)) germanHits += 1;
  }
  return englishHits >= 2 && englishHits > germanHits;
}

function truncateForTts(text) {
  if (typeof text !== "string") return "";
  return text.trim().slice(0, 650);
}

async function synthesizeSpeech(ai, text) {
  if (!text) return "";
  const result = await ai.run(TTS_MODEL, {
    prompt: text,
    lang: "de"
  });
  if (typeof result === "string") {
    return result;
  }
  if (result && typeof result.audio === "string") {
    return result.audio;
  }
  if (result && Array.isArray(result.audio)) {
    return bytesToBase64(new Uint8Array(result.audio));
  }
  return "";
}

function base64ToUint8Array(base64) {
  const binary = atob(base64.replace(/\s+/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}
