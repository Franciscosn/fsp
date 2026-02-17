const WHISPER_MODEL = "@cf/openai/whisper-large-v3-turbo";
const DEFAULT_CHAT_MODEL = "@cf/openai/gpt-oss-20b";
const ALLOWED_CHAT_MODELS = new Set([
  "@cf/openai/gpt-oss-20b",
  "@cf/qwen/qwen3-30b-a3b-fp8",
  "@cf/zai-org/glm-4.7-flash",
  "@cf/openai/gpt-oss-120b"
]);
const TTS_MODEL = "@cf/myshell-ai/melotts";

const MAX_AUDIO_BASE64_LENGTH = 8_000_000;
const MAX_CASE_LENGTH = 8_000;
const MAX_HISTORY_TURNS = 60;
const MAX_TEXT_FIELD = 1_100;
const MAX_LEARNER_TEXT_LENGTH = 500;
const MAX_EXAMINER_REPLY_LENGTH = 600;

const RESPONSE_SCHEMA = {
  type: "json_schema",
  json_schema: {
    name: "fsp_doctor_doctor_turn",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        examiner_reply: {
          type: "string",
          description:
            "Antwort der pruefenden Aerztin/des pruefenden Arztes im Arzt-Arzt-Gespraech."
        },
        off_topic: {
          type: "boolean",
          description: "True, wenn der Beitrag deutlich am Fall oder an der Aufgabe vorbeigeht."
        }
      },
      required: ["examiner_reply", "off_topic"]
    }
  }
};

const SYSTEM_INSTRUCTIONS = [
  "Prompt-Anweisung: Prueferrolle im Arzt-Arzt-Gespraech (FSP)",
  "",
  "Du uebernimmst die Rolle einer pruefenden Aerztin / eines pruefenden Arztes im Rahmen der Fachsprachpruefung fuer auslaendische Aerztinnen und Aerzte in Deutschland. Du fuehrst ein Arzt-Arzt-Gespraech mit der Pruefungskandidatin / dem Pruefungskandidaten. Dein Gegenueber (der User) ist die berichtende Aerztin / der berichtende Arzt.",
  "",
  "Der Fall ist identisch mit dem zuvor gefuehrten Anamnesegespraech und dem dazugehoerigen Arztbrief. Es wird kein neuer Fall eingefuehrt. Du kennst den Fall in groben Zuegen, pruefst jedoch, ob die Kandidatin / der Kandidat in der Lage ist, die relevanten Informationen strukturiert, fachlich korrekt und verstaendlich muendlich zu uebergeben.",
  "",
  "Deine Aufgabe ist es:",
  "- das Arzt-Arzt-Gespraech realistisch zu eroeffnen",
  "- die Kandidatin / den Kandidaten zur strukturierten Fallvorstellung aufzufordern",
  "- gezielte aerztliche Rueckfragen zu stellen, wie sie in der Fachsprachpruefung ueblich sind",
  "- Verstaendnis, Struktur, medizinische Fachsprache und Relevanz der Inhalte zu ueberpruefen",
  "",
  "Stelle Rueckfragen insbesondere zu:",
  "- Anlass der Vorstellung",
  "- relevanten Anamnesebefunden",
  "- wesentlichen Untersuchungsergebnissen",
  "- Haupt- und Nebendiagnosen",
  "- bisheriger Therapie",
  "- geplantem weiteren Vorgehen",
  "",
  "Achte darauf, dass deine Fragen pruefungsnah, sachlich und auf aerztlichem Niveau gestellt werden. Unterbrich nur, wenn Inhalte unklar, unvollstaendig oder widerspruechlich sind. Frage gezielt nach, wenn wichtige Informationen fehlen oder unscharf formuliert werden.",
  "",
  "Verhalte dich professionell, neutral und zurueckhaltend. Gib keine Hilfestellungen, keine Bewertungen, kein Feedback waehrend des Gespraechs. Keine Meta-Kommentare, keine Rollenerklaerungen.",
  "",
  "Du sprichst ausschliesslich als pruefende Aerztin / pruefender Arzt.",
  "",
  "Wenn noch keine sinnvolle Fallvorstellung vorliegt, beginne mit einer typischen pruefungsnahen Aufforderung zur Fallvorstellung.",
  "Antworten ausschliesslich auf Deutsch.",
  "Ausgabe ausschliesslich als valides JSON mit examiner_reply und off_topic.",
  "examiner_reply: kurz und praezise, maximal 80 Woerter."
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

    const transcript = payload.learnerText || (await transcribeAudio(context.env.AI, payload.audioBase64));
    if (!transcript) {
      return json({ error: "Keine Eingabe erkannt. Bitte sprechen oder Text eingeben." }, 422);
    }

    const promptInput = JSON.stringify(
      {
        case_profile: payload.caseText,
        conversation_history: payload.history,
        candidate_latest_utterance: transcript
      },
      null,
      2
    );

    const raw = await runExaminerTurnRequest(context.env.AI, promptInput, payload.chatModel);
    const candidate = buildCandidateTurn(raw);
    const examinerReply = normalizeExaminerReply(candidate.examiner_reply, transcript);
    const offTopic = Boolean(candidate.off_topic);

    const spokenReply = truncateForTts(examinerReply);
    const replyAudioBase64 = payload.preferLocalTts
      ? ""
      : await synthesizeSpeech(context.env.AI, spokenReply);
    const nextHistory = [...payload.history, { user: transcript, assistant: spokenReply }].slice(
      -MAX_HISTORY_TURNS
    );

    return json({
      transcript,
      examinerReply: spokenReply,
      offTopic,
      replyAudioBase64,
      history: nextHistory
    });
  } catch (error) {
    console.error("voice-doctor-turn error", error);
    return json({ error: "Arzt-Arzt-Gespraech fehlgeschlagen. Bitte spaeter erneut versuchen." }, 500);
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
  const rawLearnerText = typeof body?.learnerText === "string" ? body.learnerText.trim() : "";
  const rawCaseText = typeof body?.caseText === "string" ? body.caseText.trim() : "";
  const rawChatModel = typeof body?.chatModel === "string" ? body.chatModel.trim() : "";

  if (!rawAudio && !rawLearnerText) {
    return { ok: false, error: "Bitte Audio aufnehmen oder eine Textantwort senden." };
  }
  if (!rawCaseText) {
    return { ok: false, error: "Bitte zuerst einen medizinischen Fall auswaehlen." };
  }
  if (rawCaseText.length > MAX_CASE_LENGTH) {
    return { ok: false, error: `Falltext zu lang (max ${MAX_CASE_LENGTH} Zeichen).` };
  }

  let cleanedAudio = "";
  if (rawAudio) {
    cleanedAudio = stripDataUrl(rawAudio);
    if (cleanedAudio.length > MAX_AUDIO_BASE64_LENGTH) {
      return { ok: false, error: "Audio ist zu gross. Bitte kuerzer sprechen (max ca. 25 Sekunden)." };
    }
    if (!isLikelyBase64(cleanedAudio)) {
      return { ok: false, error: "audioBase64 ist ungueltig formatiert." };
    }
  }

  const learnerText = rawLearnerText.slice(0, MAX_LEARNER_TEXT_LENGTH);
  if (rawLearnerText.length > MAX_LEARNER_TEXT_LENGTH) {
    return {
      ok: false,
      error: `Text zu lang (max ${MAX_LEARNER_TEXT_LENGTH} Zeichen).`
    };
  }

  return {
    ok: true,
    audioBase64: cleanedAudio,
    learnerText,
    caseText: rawCaseText,
    history: sanitizeHistory(body?.history),
    preferLocalTts: Boolean(body?.preferLocalTts),
    chatModel: normalizeChatModel(rawChatModel)
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

function normalizeChatModel(value) {
  if (typeof value !== "string") return DEFAULT_CHAT_MODEL;
  return ALLOWED_CHAT_MODELS.has(value) ? value : DEFAULT_CHAT_MODEL;
}

async function transcribeAudio(ai, audioBase64) {
  let result = null;
  const primaryPayload = {
    audio: audioBase64,
    task: "transcribe",
    language: "de",
    vad_filter: false,
    initial_prompt: "Arzt-Arzt-Gespraech in der medizinischen Fachsprachpruefung."
  };

  try {
    result = await ai.run(WHISPER_MODEL, primaryPayload);
  } catch {
    let audioBytes = null;
    try {
      audioBytes = base64ToUint8Array(audioBase64);
    } catch {
      result = null;
      audioBytes = null;
    }
    if (audioBytes) {
      try {
        result = await ai.run(WHISPER_MODEL, {
          ...primaryPayload,
          audio: Array.from(audioBytes)
        });
      } catch {
        result = null;
      }
    }
  }

  const text = typeof result?.text === "string" ? result.text.trim() : "";
  if (text) {
    return text;
  }

  try {
    const retry = await ai.run(WHISPER_MODEL, {
      audio: audioBase64,
      task: "transcribe",
      language: "de",
      vad_filter: true,
      initial_prompt: "pruefungsnahes Arzt-Arzt-Gespraech"
    });
    if (typeof retry?.text === "string") {
      return retry.text.trim();
    }
  } catch {
    // keep empty
  }
  return "";
}

async function runExaminerTurnRequest(ai, promptInput, chatModel) {
  const model = normalizeChatModel(chatModel);
  const request = {
    instructions: SYSTEM_INSTRUCTIONS,
    input: promptInput,
    response_format: RESPONSE_SCHEMA
  };

  try {
    return await ai.run(model, request);
  } catch {
    try {
      return await ai.run(model, {
        instructions: SYSTEM_INSTRUCTIONS,
        input: promptInput
      });
    } catch {
      try {
        return await ai.run(model, {
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTIONS },
            { role: "user", content: promptInput }
          ]
        });
      } catch {
        return ai.run(model, {
          prompt: `${SYSTEM_INSTRUCTIONS}\n\n${promptInput}`
        });
      }
    }
  }
}

function buildCandidateTurn(raw) {
  const direct = extractStructuredFromRaw(raw);
  if (direct) return direct;

  const text = extractModelText(raw);
  const parsed = parseStructuredResponse(text);
  if (parsed) return parsed;

  return {
    examiner_reply: text || "",
    off_topic: false
  };
}

function extractStructuredFromRaw(raw) {
  if (!raw || typeof raw !== "object") return null;

  if (looksLikeTurnObject(raw)) {
    return raw;
  }
  if (raw.response && typeof raw.response === "object" && looksLikeTurnObject(raw.response)) {
    return raw.response;
  }
  if (Array.isArray(raw.output)) {
    for (const item of raw.output) {
      if (!item || typeof item !== "object") continue;
      if (item.parsed && typeof item.parsed === "object" && looksLikeTurnObject(item.parsed)) {
        return item.parsed;
      }
      if (Array.isArray(item.content)) {
        for (const block of item.content) {
          if (!block || typeof block !== "object") continue;
          if (block.parsed && typeof block.parsed === "object" && looksLikeTurnObject(block.parsed)) {
            return block.parsed;
          }
          if (typeof block.text === "string" && block.text.trim()) {
            const parsed = parseStructuredResponse(block.text);
            if (parsed) return parsed;
          }
        }
      }
    }
  }
  return null;
}

function looksLikeTurnObject(value) {
  if (!value || typeof value !== "object") return false;
  return typeof value.examiner_reply === "string";
}

function parseStructuredResponse(rawText) {
  const cleaned = stripCodeFence(rawText);
  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed || typeof parsed !== "object") return null;
    const examiner_reply = safeText(parsed.examiner_reply).slice(0, MAX_EXAMINER_REPLY_LENGTH);
    if (!examiner_reply) return null;
    return {
      examiner_reply,
      off_topic: Boolean(parsed.off_topic)
    };
  } catch {
    return null;
  }
}

function extractModelText(raw) {
  if (typeof raw === "string") {
    return sanitizeModelText(raw);
  }
  if (!raw || typeof raw !== "object") {
    return "";
  }
  if (typeof raw.output_text === "string" && raw.output_text.trim()) {
    return sanitizeModelText(raw.output_text);
  }
  if (typeof raw.response === "string" && raw.response.trim()) {
    return sanitizeModelText(raw.response);
  }
  if (Array.isArray(raw.output)) {
    for (const item of raw.output) {
      if (!item || typeof item !== "object") continue;
      if (Array.isArray(item.content)) {
        for (const block of item.content) {
          if (block?.type === "output_text" && typeof block.text === "string" && block.text.trim()) {
            return sanitizeModelText(block.text);
          }
          if (typeof block?.text === "string" && block.text.trim()) {
            return sanitizeModelText(block.text);
          }
        }
      }
    }
  }
  return "";
}

function sanitizeModelText(text) {
  if (typeof text !== "string") return "";
  let cleaned = text.trim();
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  cleaned = cleaned.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  return cleaned;
}

function stripCodeFence(value) {
  if (typeof value !== "string") return "";
  return value.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
}

function normalizeExaminerReply(text, transcript) {
  let cleaned = sanitizeModelText(String(text || ""));
  cleaned = cleaned.replace(/^(examiner|examiner_reply|antwort)\s*:\s*/i, "").trim();
  cleaned = cleaned.replace(/\s{2,}/g, " ");
  if (looksLikeMetaResponse(cleaned)) {
    cleaned = "";
  }
  cleaned = cleaned.slice(0, MAX_EXAMINER_REPLY_LENGTH);
  if (cleaned) return cleaned;
  return fallbackExaminerReply(transcript);
}

function looksLikeMetaResponse(text) {
  const lower = ` ${String(text || "").toLowerCase()} `;
  return (
    lower.includes("system prompt") ||
    lower.includes("instruction") ||
    lower.includes("the user says") ||
    lower.includes("as an ai") ||
    lower.includes("ich bin ein ki")
  );
}

function fallbackExaminerReply(transcript) {
  const lower = String(transcript || "").toLowerCase();
  if (!lower || /\b(hallo|guten tag|moin|servus)\b/.test(lower)) {
    return "Guten Tag. Bitte stellen Sie den Fall strukturiert vor: Anlass der Vorstellung, relevante Anamnese, Befunde, Diagnose, Therapie und weiteres Vorgehen.";
  }
  return "Bitte bleiben Sie beim selben Fall und berichten Sie strukturiert: relevante Anamnese, zentrale Befunde, Haupt- und Nebendiagnosen, bisherige Therapie und geplantes weiteres Vorgehen.";
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
