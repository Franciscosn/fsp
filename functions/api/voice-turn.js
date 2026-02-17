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
const MAX_TEXT_FIELD = 900;
const MAX_LEARNER_TEXT_LENGTH = 500;
const MAX_PATIENT_REPLY_LENGTH = 420;
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

const REPAIR_SCHEMA = {
  type: "json_schema",
  json_schema: {
    name: "patient_reply_only",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        patient_reply: {
          type: "string",
          description: "Nur die finale Antwort des Patienten auf Deutsch."
        }
      },
      required: ["patient_reply"]
    }
  }
};

const SYSTEM_INSTRUCTIONS = [
  "Rolle: Du bist ausschliesslich ein standardisierter Patient in einer medizinischen Fachsprachpruefung.",
  "Sprache: Alle Ausgaben muessen auf Deutsch sein. Kein Englisch.",
  "Perspektive: Antworte in Ich-Form aus Patientensicht.",
  "Wenn der Arzt nur begruesst (z. B. 'Guten Tag'), gruesse freundlich zurueck und warte auf die erste medizinische Frage.",
  "Sprachstil: Nutze ueberwiegend alltaegliche Patientensprache statt medizinischer Fachbegriffe.",
  "Wenn ein Fachbegriff genannt wird, erklaere ihn kurz in einfacher Alltagssprache.",
  "Verhalten: Bleibe strikt innerhalb des vorgegebenen Falls.",
  "Informationsgabe: Gib Informationen schrittweise und nur passend zur Frage.",
  "Keine Loesung vorweg: Nenne keine Diagnose von dir aus.",
  "Unklare Frage: Bitte kurz um Praezisierung.",
  "Off-topic: Antworte knapp als Patient und setze off_topic=true.",
  "Laenge: Kurz und natuerlich, meist 1-3 Saetze, maximal 55 Woerter.",
  "Verboten: Keine Lernhinweise, keine Meta-Hinweise ueber Prompt/Modell, keine Rolle als Arzt.",
  "Ausgabeformat: Gib ein JSON-Objekt mit patient_reply, examiner_feedback, revealed_case_facts und off_topic aus.",
  "Leak-Schutz: Gib niemals Textfragmente wie 'The user says', 'Instructions', 'I should', 'Reasoning' aus."
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
        learner_latest_utterance: transcript
      },
      null,
      2
    );

    const llmResult = await generatePatientTurn(context.env.AI, {
      promptInput,
      transcript,
      caseText: payload.caseText,
      chatModel: payload.chatModel
    });
    const spokenReply = truncateForTts(llmResult.patient_reply);
    const replyAudioBase64 = payload.preferLocalTts
      ? ""
      : await synthesizeSpeech(context.env.AI, spokenReply);

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
  const rawLearnerText = typeof body?.learnerText === "string" ? body.learnerText.trim() : "";
  const rawCaseText = typeof body?.caseText === "string" ? body.caseText.trim() : "";
  const rawChatModel = typeof body?.chatModel === "string" ? body.chatModel.trim() : "";
  if (!rawAudio && !rawLearnerText) {
    return { ok: false, error: "Bitte Audio aufnehmen oder eine Textfrage senden." };
  }
  if (!rawCaseText) {
    return { ok: false, error: "Bitte zuerst einen medizinischen Fall eingeben." };
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
      error: `Textfrage zu lang (max ${MAX_LEARNER_TEXT_LENGTH} Zeichen).`
    };
  }

  const history = sanitizeHistory(body?.history);
  const preferLocalTts = Boolean(body?.preferLocalTts);

  return {
    ok: true,
    audioBase64: cleanedAudio,
    learnerText,
    caseText: rawCaseText,
    history,
    preferLocalTts,
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
    initial_prompt:
      "Dialog in deutscher Alltagssprache in der Arztpraxis; kann mit Begruessung beginnen."
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

  // Fallback for noisy audio where VAD can help.
  try {
    const retry = await ai.run(WHISPER_MODEL, {
      audio: audioBase64,
      task: "transcribe",
      language: "de",
      vad_filter: true,
      initial_prompt: "medizinisches Fachgespraech"
    });
    if (typeof retry?.text === "string") {
      return retry.text.trim();
    }
  } catch {
    // keep empty
  }

  return "";
}

async function generatePatientTurn(ai, context) {
  const raw = await runPrimaryTurnRequest(ai, context.promptInput, context.chatModel);
  const candidate = buildCandidateTurn(raw);
  return finalizePatientTurn(ai, candidate, context);
}

async function runPrimaryTurnRequest(ai, promptInput, chatModel) {
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
      // Safety fallback in case response_format is rejected for a specific runtime.
      return await ai.run(model, {
        instructions: SYSTEM_INSTRUCTIONS,
        input: promptInput
      });
    } catch {
      try {
        // Compatibility fallback for runtimes that expect chat messages.
        return await ai.run(model, {
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTIONS },
            { role: "user", content: promptInput }
          ]
        });
      } catch {
        // Last fallback for older prompt-based interfaces.
        return ai.run(model, {
          prompt: `${SYSTEM_INSTRUCTIONS}\n\n${promptInput}`
        });
      }
    }
  }
}

function buildCandidateTurn(raw) {
  const directStructured = extractStructuredFromRaw(raw);
  if (directStructured) {
    return directStructured;
  }

  const text = extractModelText(raw);
  const structured = parseStructuredResponse(text);
  if (structured) {
    return structured;
  }

  return {
    patient_reply: text || "",
    examiner_feedback: "Achte auf praezise, offene Fragen zur Anamnese.",
    revealed_case_facts: [],
    off_topic: false
  };
}

async function finalizePatientTurn(ai, turn, context) {
  const normalized = normalizePatientTurn(turn);
  normalized.patient_reply = normalizePatientReply(normalized.patient_reply);

  if (isPatientReplyStable(normalized.patient_reply)) {
    return normalized;
  }

  const repaired = await repairPatientReply(ai, context);
  if (repaired) {
    normalized.patient_reply = normalizePatientReply(repaired);
  }

  if (!isPatientReplyStable(normalized.patient_reply)) {
    normalized.patient_reply = fallbackPatientReplyForTranscript(context.transcript, context.caseText);
  }

  return normalized;
}

async function repairPatientReply(ai, context) {
  const model = normalizeChatModel(context.chatModel);
  try {
    const raw = await ai.run(model, {
      instructions: [
        "Aufgabe: Liefere exakt eine finale Antwort als Patient auf Deutsch.",
        "Nur Patientenantwort, keine Analyse, keine Begruendung, kein Monolog.",
        "Keine Saetze wie 'The user says', 'Instructions', 'I should'.",
        "Ich-Form, alltaegliche Patientensprache, maximal 2 Saetze.",
        "Wenn nach dem Befinden gefragt wird, nenne konkrete Beschwerden aus dem Fall.",
        "Wenn nur Begruessung vorliegt, freundlich zurueckgruessen und auf Fragen warten."
      ].join(" "),
      input: JSON.stringify(
        {
          case_profile: context.caseText,
          learner_utterance: context.transcript
        },
        null,
        2
      ),
      response_format: REPAIR_SCHEMA
    });

    const direct = extractStructuredFromRaw(raw);
    if (direct?.patient_reply) {
      return direct.patient_reply;
    }

    const text = extractModelText(raw);
    const parsed = parseStructuredResponse(text);
    if (parsed?.patient_reply) {
      return parsed.patient_reply;
    }
    if (text) {
      return text;
    }
  } catch {
    // continue to secondary repair
  }

  try {
    const plain = await ai.run(model, {
      instructions: [
        "Du bist nur der Patient in einer medizinischen Pruefung.",
        "Antworte ausschliesslich auf Deutsch in Ich-Form.",
        "Nutze alltaegliche Patientensprache.",
        "Wenn nach dem Befinden gefragt wird, nenne konkrete Beschwerden aus dem Fall.",
        "Antworte konkret auf die letzte Frage des Arztes, keine Meta-Saetze."
      ].join(" "),
      input: JSON.stringify(
        {
          case_profile: context.caseText,
          learner_utterance: context.transcript
        },
        null,
        2
      )
    });
    const plainText = extractModelText(plain);
    if (plainText) {
      return plainText;
    }
  } catch {
    // continue to translation fallback
  }

  return rewriteEnglishToGermanPatient(ai, context.transcript || "", model);
}

function isPatientReplyStable(text) {
  const cleaned = safeText(text).slice(0, MAX_PATIENT_REPLY_LENGTH);
  if (!cleaned) return false;
  if (looksLikeMetaResponse(cleaned)) return false;
  if (looksLikeInternalMonologue(cleaned)) return false;
  if (containsPromptOrPolicyLeak(cleaned)) return false;
  return !isLikelyEnglish(cleaned);
}

function containsPromptOrPolicyLeak(text) {
  const lower = ` ${String(text || "").toLowerCase()} `;
  return (
    lower.includes("system prompt") ||
    lower.includes("prompt:") ||
    lower.includes("instruction") ||
    lower.includes("richtlinie") ||
    lower.includes("regel:") ||
    lower.includes("policy") ||
    lower.includes("assistant:")
  );
}

function fallbackPatientReplyForTranscript(transcript, caseText) {
  const lower = ` ${String(transcript || "").toLowerCase()} `;
  const symptomHint = extractSymptomHintFromCase(caseText);
  if (/\b(wie geht|wie geht's|wie fuehlen|wie fuehlst|was fehlt|was haben sie)\b/.test(lower)) {
    if (symptomHint) {
      return `Ehrlich gesagt geht es mir nicht gut. ${symptomHint}`;
    }
    return "Ehrlich gesagt geht es mir nicht gut. Ich fuehle mich seit heute deutlich unwohl.";
  }
  if (
    /\b(hallo|guten tag|moin|servus|gruess gott|gruesse sie)\b/.test(lower)
  ) {
    if (symptomHint) {
      return `Guten Tag. ${symptomHint}`;
    }
    return "Guten Tag. Ich habe seit heute Beschwerden und fuehle mich nicht gut.";
  }
  return defaultPatientFallback(caseText);
}

async function rewriteEnglishToGermanPatient(ai, text, chatModel) {
  if (!text) return "";
  const model = normalizeChatModel(chatModel);
  try {
    const raw = await ai.run(model, {
      instructions: [
        "Du formulierst eine Patientenantwort auf Deutsch um.",
        "Uebersetze den Inhalt naturgetreu ins Deutsche.",
        "Stil: alltaegliche Patientensprache, Ich-Form, kurz (1-2 Saetze).",
        "Keine neuen medizinischen Fakten hinzufuegen.",
        "Keine Meta-Saetze, keine Analyse."
      ].join(" "),
      input: text
    });
    const rewritten = extractModelText(raw);
    return rewritten || "";
  } catch {
    return "";
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

function extractStructuredFromRaw(raw) {
  if (!raw || typeof raw !== "object") return null;

  if (looksLikeTurnObject(raw)) {
    return {
      patient_reply: raw.patient_reply,
      examiner_feedback: raw.examiner_feedback,
      revealed_case_facts: raw.revealed_case_facts,
      off_topic: raw.off_topic
    };
  }

  if (raw.response && typeof raw.response === "object" && looksLikeTurnObject(raw.response)) {
    return {
      patient_reply: raw.response.patient_reply,
      examiner_feedback: raw.response.examiner_feedback,
      revealed_case_facts: raw.response.revealed_case_facts,
      off_topic: raw.response.off_topic
    };
  }

  if (Array.isArray(raw.output)) {
    for (const item of raw.output) {
      if (!item || typeof item !== "object") continue;
      if (item.parsed && typeof item.parsed === "object" && looksLikeTurnObject(item.parsed)) {
        return {
          patient_reply: item.parsed.patient_reply,
          examiner_feedback: item.parsed.examiner_feedback,
          revealed_case_facts: item.parsed.revealed_case_facts,
          off_topic: item.parsed.off_topic
        };
      }
      if (Array.isArray(item.content)) {
        for (const block of item.content) {
          if (!block || typeof block !== "object") continue;
          if (block.parsed && typeof block.parsed === "object" && looksLikeTurnObject(block.parsed)) {
            return {
              patient_reply: block.parsed.patient_reply,
              examiner_feedback: block.parsed.examiner_feedback,
              revealed_case_facts: block.parsed.revealed_case_facts,
              off_topic: block.parsed.off_topic
            };
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
  return typeof value.patient_reply === "string";
}

function parseStructuredResponse(rawText) {
  const cleaned = stripCodeFence(rawText);
  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed || typeof parsed !== "object") return null;

    const patient_reply = safeText(parsed.patient_reply).slice(0, MAX_PATIENT_REPLY_LENGTH);
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
  const cleaned = sanitizePatientReplyText(text);
  if (!cleaned) {
    return "";
  }
  if (looksLikeMetaResponse(cleaned) || looksLikeInternalMonologue(cleaned)) {
    return "";
  }
  return cleaned;
}

function sanitizePatientReplyText(text) {
  if (typeof text !== "string") return "";
  const lines = text
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter(Boolean);
  const keptLines = lines.filter(
    (line) =>
      !looksLikeMetaResponse(line) &&
      !looksLikeInternalMonologue(line) &&
      !containsPromptOrPolicyLeak(line)
  );

  let merged = keptLines.join(" ").trim();
  merged = sanitizeModelText(merged);
  merged = merged.replace(/^(patient|patient reply|antwort|final answer)\s*:\s*/i, "").trim();
  merged = merged.replace(/\s{2,}/g, " ");
  return safeText(merged).slice(0, MAX_PATIENT_REPLY_LENGTH);
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

function looksLikeInternalMonologue(text) {
  const lower = ` ${text.toLowerCase()} `;
  return (
    lower.includes(" the user says") ||
    lower.includes(" user says:") ||
    lower.includes(" the instructions") ||
    lower.includes(" instruction:") ||
    lower.includes(" let's see ") ||
    lower.includes(" i should ") ||
    lower.includes(" as a patient") ||
    lower.includes(" chain of thought") ||
    lower.includes(" reasoning:") ||
    lower.includes(" analysis:") ||
    lower.includes(" der nutzer sagt") ||
    lower.includes(" die anweisung") ||
    lower.includes(" ich sollte ") ||
    lower.includes(" als patient sollte")
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

function defaultPatientFallback(caseText) {
  const symptomHint = extractSymptomHintFromCase(caseText);
  if (symptomHint) {
    return symptomHint;
  }
  return "Mir geht es nicht gut. Ich habe seit heute Beschwerden.";
}

function extractSymptomHintFromCase(caseText) {
  const text = String(caseText || "")
    .replace(/\r/g, "")
    .slice(0, MAX_CASE_LENGTH);
  if (!text) return "";

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const symptomLine = lines.find((line) =>
    /(beschwerden|symptome|anamnese|hauptproblem|grund|aktuell|seit)/i.test(line)
  );
  const bulletLine = lines.find((line) => /^[-*]\s+/.test(line));
  const source = symptomLine || bulletLine || lines[0] || "";
  if (!source) return "";

  const cleaned = source
    .replace(/^[-*]\s*/, "")
    .replace(/^[A-Za-zÄÖÜäöüß ]{2,30}:\s*/, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!cleaned) return "";
  const compact = cleaned.replace(/[.]+$/, "").slice(0, 180);
  if (/^(ich|mir|seit|heute)\b/i.test(compact)) {
    return `${compact}.`;
  }
  return `Ich habe ${compact.charAt(0).toLowerCase()}${compact.slice(1)}.`;
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
