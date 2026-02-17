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
const MAX_SYSTEM_PROMPT_LENGTH = 60_000;

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
  "Gespraechssteuerung (verbindlich):",
  "1) Wenn noch keine strukturierte Fallvorstellung vorliegt, eroeffne pruefungsnah und fordere aktiv zur strukturierten Uebergabe auf.",
  "2) Fuehre das Gespraech aktiv. Stelle pro Turn genau eine fokussierte Rueckfrage.",
  "3) Jede Rueckfrage muss sich auf die letzte Kandidatenaussage beziehen und Unklarheiten, Luecken, Widersprueche oder fehlende Priorisierung pruefen.",
  "4) Frage gezielt nach, wenn Informationen fehlen oder unscharf formuliert sind.",
  "5) Gib keine Hilfestellungen, keine Bewertungen, kein Feedback, keine Musterloesung.",
  "",
  "Fragetypen (nutze sie pruefungsnah und situationsgerecht):",
  "1. Verstaendnis- und Praezisierungsfragen: 'Was meinen Sie genau mit ...?', 'Koennen Sie das bitte praezisieren?', 'Wie haben Sie diesen Befund interpretiert?', 'Was war dabei ausschlaggebend?'",
  "2. Struktur- und Priorisierungsfragen: 'Was war in diesem Fall am wichtigsten?', 'Welche Befunde sind fuer das weitere Vorgehen entscheidend?', 'Was nennen Sie bei der Uebergabe zuerst?'",
  "3. Nachfragen zu Diagnosen (ohne Detail-Fachfragen): 'Warum ist diese Diagnose wahrscheinlich?', 'Gab es Alternativdiagnosen?', 'Was sprach dagegen?'",
  "4. Fragen zur Therapieentscheidung: 'Was wurde bisher therapeutisch gemacht?', 'Warum haben Sie sich dafuer entschieden?', 'Was ist der naechste Schritt?'",
  "5. Sicherheits- und Aufklaerungsaspekte: 'Gab es Risiken, ueber die aufgeklaert wurde?', 'Welche Warnzeichen wurden genannt?'",
  "6. Weiteres Vorgehen / Organisation: 'Was passiert als Naechstes?', 'Wer uebernimmt die Weiterbehandlung?', 'Wie ist die Nachsorge geplant?'",
  "7. Sprachliche Klaerungsfragen: 'Wie genau meinen Sie das?', 'Koennen Sie das anders formulieren?'",
  "",
  "Inhaltliche Priorisierung im Verlauf:",
  "Anlass der Vorstellung -> relevante Anamnese -> wesentliche Befunde -> Haupt-/Nebendiagnosen -> bisherige Therapie -> Sicherheits-/Aufklaerungspunkte -> weiteres Vorgehen/Nachsorge.",
  "",
  "Achte auf professionelle, neutrale, sachliche und pruefungsnahe Sprache.",
  "Unterbrich nur bei Unklarheit, Unvollstaendigkeit oder Widerspruch.",
  "",
  "Du sprichst ausschliesslich als pruefende Aerztin / pruefender Arzt.",
  "",
  "Wenn noch keine sinnvolle Fallvorstellung vorliegt, beginne mit einer typischen Aufforderung zur strukturierten Fallvorstellung.",
  "Antworten ausschliesslich auf Deutsch.",
  "Ausgabe ausschliesslich als valides JSON mit examiner_reply und off_topic.",
  "examiner_reply: 1-2 Saetze, kurz und praezise, maximal 110 Woerter, immer mit mindestens einer konkreten Frage und Fragezeichen.",
  "off_topic: true nur wenn die Kandidatenaussage klar am Fall/Thema vorbeigeht; sonst false."
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

    const firstTurn = payload.history.length === 0;
    const forceOpening = shouldForceOpeningPrompt(payload.history, transcript);

    let candidate = { examiner_reply: "", off_topic: false };
    if (forceOpening) {
      candidate = {
        examiner_reply: buildOpeningExaminerReply(),
        off_topic: false
      };
    } else {
      const promptInput = JSON.stringify(
        {
          case_profile: payload.caseText,
          conversation_history: payload.history,
          candidate_latest_utterance: transcript
        },
        null,
        2
      );
      const raw = await runExaminerTurnRequest(
        context.env.AI,
        promptInput,
        payload.chatModel,
        payload.systemPrompt
      );
      candidate = buildCandidateTurn(raw);
    }

    const examinerReply = normalizeExaminerReply(candidate.examiner_reply, transcript, {
      firstTurn,
      forceOpening
    });
    const offTopic = firstTurn || forceOpening ? false : Boolean(candidate.off_topic);

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
  const rawSystemPrompt =
    typeof body?.systemPromptOverride === "string" ? body.systemPromptOverride : "";

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
    chatModel: normalizeChatModel(rawChatModel),
    systemPrompt: normalizeSystemPrompt(rawSystemPrompt, SYSTEM_INSTRUCTIONS)
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

function normalizeSystemPrompt(value, fallback) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, MAX_SYSTEM_PROMPT_LENGTH);
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

async function runExaminerTurnRequest(ai, promptInput, chatModel, systemPrompt) {
  const model = normalizeChatModel(chatModel);
  const effectivePrompt = normalizeSystemPrompt(systemPrompt, SYSTEM_INSTRUCTIONS);
  const request = {
    instructions: effectivePrompt,
    input: promptInput,
    response_format: RESPONSE_SCHEMA
  };

  try {
    return await ai.run(model, request);
  } catch {
    try {
      return await ai.run(model, {
        instructions: effectivePrompt,
        input: promptInput
      });
    } catch {
      try {
        return await ai.run(model, {
          messages: [
            { role: "system", content: effectivePrompt },
            { role: "user", content: promptInput }
          ]
        });
      } catch {
        return ai.run(model, {
          prompt: `${effectivePrompt}\n\n${promptInput}`
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

function normalizeExaminerReply(text, transcript, options = {}) {
  const firstTurn = Boolean(options.firstTurn);
  const forceOpening = Boolean(options.forceOpening);
  let cleaned = sanitizeModelText(String(text || ""));
  cleaned = cleaned.replace(/^(examiner|examiner_reply|antwort)\s*:\s*/i, "").trim();
  cleaned = cleaned.replace(/\s{2,}/g, " ");
  if (forceOpening) {
    return buildOpeningExaminerReply();
  }
  if (looksLikeMetaResponse(cleaned)) {
    cleaned = "";
  }
  if (firstTurn && !looksLikeOpeningPrompt(cleaned)) {
    cleaned = "";
  }
  cleaned = cleaned.slice(0, MAX_EXAMINER_REPLY_LENGTH);
  cleaned = ensureReplyContainsQuestion(cleaned, transcript, firstTurn);
  cleaned = cleaned.slice(0, MAX_EXAMINER_REPLY_LENGTH);
  if (cleaned) return cleaned;
  return fallbackExaminerReply(transcript, { firstTurn });
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

function fallbackExaminerReply(transcript, options = {}) {
  const firstTurn = Boolean(options.firstTurn);
  const lower = String(transcript || "").toLowerCase();
  if (firstTurn || !lower || /\b(hallo|guten tag|moin|servus)\b/.test(lower)) {
    return buildOpeningExaminerReply();
  }
  return buildTargetedFollowUpQuestion(transcript);
}

function shouldForceOpeningPrompt(history, transcript) {
  if (Array.isArray(history) && history.length > 0) return false;
  return !looksLikeStructuredPresentation(transcript);
}

function looksLikeStructuredPresentation(text) {
  const lower = String(text || "").toLowerCase();
  if (!lower) return false;
  const keywords = [
    "anlass",
    "anamnese",
    "befund",
    "diagnose",
    "therapie",
    "vorgehen",
    "weiteres",
    "aufnahme"
  ];
  let hits = 0;
  for (const keyword of keywords) {
    if (lower.includes(keyword)) {
      hits += 1;
    }
  }
  return lower.length >= 150 && hits >= 3;
}

function looksLikeOpeningPrompt(text) {
  const lower = String(text || "").toLowerCase();
  if (!lower) return false;
  return (
    lower.includes("fall strukturiert vor") ||
    lower.includes("fallvorstellung") ||
    lower.includes("berichten sie strukturiert") ||
    lower.includes("stellen sie den fall")
  );
}

function buildOpeningExaminerReply() {
  return "Guten Tag. Bitte stellen Sie den Fall jetzt strukturiert vor: Anlass der Vorstellung, relevante Anamnese, wesentliche Befunde, Haupt- und Nebendiagnosen, bisherige Therapie sowie geplantes weiteres Vorgehen. Womit beginnen Sie?";
}

function ensureReplyContainsQuestion(reply, transcript, firstTurn) {
  const normalized = String(reply || "").trim();
  if (!normalized) return "";
  if (normalized.includes("?")) return normalized;
  const followUp = firstTurn
    ? "Womit beginnen Sie?"
    : buildTargetedFollowUpQuestion(transcript);
  const sentence = followUp.replace(/\s+/g, " ").trim();
  return `${normalized} ${sentence}`.trim().slice(0, MAX_EXAMINER_REPLY_LENGTH);
}

function buildTargetedFollowUpQuestion(transcript) {
  const lower = String(transcript || "").toLowerCase();
  if (!lower) {
    return "Koennen Sie das bitte praezisieren: Was war in diesem Fall klinisch am wichtigsten?";
  }

  if (
    lower.includes("diagnose") ||
    lower.includes("verdacht") ||
    lower.includes("dd") ||
    lower.includes("differenzial")
  ) {
    return "Warum halten Sie diese Diagnose fuer wahrscheinlich, und welche Alternativdiagnose haben Sie geprueft?";
  }

  if (
    lower.includes("therapie") ||
    lower.includes("behandl") ||
    lower.includes("medik") ||
    lower.includes("gegeben")
  ) {
    return "Was wurde bisher therapeutisch umgesetzt, und was planen Sie als naechsten Schritt?";
  }

  if (
    lower.includes("befund") ||
    lower.includes("labor") ||
    lower.includes("ct") ||
    lower.includes("mrt") ||
    lower.includes("sono") ||
    lower.includes("ekg")
  ) {
    return "Welche dieser Befunde waren fuer Ihre Entscheidung ausschlaggebend?";
  }

  if (
    lower.includes("weiter") ||
    lower.includes("nachsorge") ||
    lower.includes("entlass") ||
    lower.includes("uebernahme") ||
    lower.includes("organisation")
  ) {
    return "Wie ist das weitere Vorgehen organisatorisch geplant, und wer uebernimmt die Weiterbehandlung?";
  }

  if (
    lower.includes("risiko") ||
    lower.includes("aufklaer") ||
    lower.includes("warnzeichen")
  ) {
    return "Welche Risiken oder Warnzeichen wurden angesprochen, und wie wurde darueber aufgeklaert?";
  }

  return "Koennen Sie das bitte praezisieren: Was war in diesem Fall am wichtigsten, und welche Information nennen Sie bei der Uebergabe zuerst?";
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
