const WHISPER_MODEL = "@cf/openai/whisper-large-v3-turbo";
const CHAT_MODEL = "@cf/openai/gpt-oss-20b";
const TTS_MODEL = "@cf/myshell-ai/melotts";

const MAX_AUDIO_BASE64_LENGTH = 8_000_000;
const MAX_CASE_LENGTH = 8_000;
const MAX_HISTORY_TURNS = 8;
const MAX_TEXT_FIELD = 900;
const MAX_DIAGNOSIS_TEXT_LENGTH = 500;

const EVALUATION_SCHEMA = {
  type: "json_schema",
  json_schema: {
    name: "medical_exam_evaluation",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        overall_score: {
          type: "integer",
          description: "Gesamtscore 0-100 fuer das Gespraech inklusive Diagnose."
        },
        anamnesis_score: {
          type: "integer",
          description: "Score 0-100 fuer Struktur und Vollstaendigkeit der Anamnese."
        },
        diagnosis_score: {
          type: "integer",
          description: "Score 0-100 fuer Plausibilitaet und Passung der Diagnose."
        },
        strengths: {
          type: "array",
          items: { type: "string" },
          description: "2-6 konkrete Starken im Gespraech."
        },
        missing_questions: {
          type: "array",
          items: { type: "string" },
          description: "2-8 relevante Fragen, die gefehlt haben."
        },
        mistakes: {
          type: "array",
          items: { type: "string" },
          description: "2-8 konkrete Fehler oder Risiken."
        },
        suggested_questions: {
          type: "array",
          items: { type: "string" },
          description: "3-8 bessere Beispielfragen in deutscher Arztsprache."
        },
        likely_diagnosis: {
          type: "string",
          description: "Wahrscheinlichste Diagnose anhand des Falls."
        },
        differentials: {
          type: "array",
          items: { type: "string" },
          description: "2-5 wichtige Differenzialdiagnosen."
        },
        summary_feedback: {
          type: "string",
          description: "Kurze, klare Zusammenfassung fuer den Lernenden."
        }
      },
      required: [
        "overall_score",
        "anamnesis_score",
        "diagnosis_score",
        "strengths",
        "missing_questions",
        "mistakes",
        "suggested_questions",
        "likely_diagnosis",
        "differentials",
        "summary_feedback"
      ]
    }
  }
};

const SYSTEM_INSTRUCTIONS = [
  "Rolle: Du bist ein fairer, strenger Pruefer fuer die medizinische Fachsprachpruefung.",
  "Sprache: Alle Ausgaben strikt auf Deutsch.",
  "Input: Fallprofil, Gespraechsverlauf und finale Diagnose des Lernenden.",
  "Bewerte getrennt Anamnesequalitaet und Diagnosequalitaet auf 0-100.",
  "Nutze nur Informationen aus Fallprofil und Verlauf, keine frei erfundenen Fakten.",
  "Sei konkret: welche Fragen fehlten, welche Annahmen waren falsch, was war gut.",
  "Fehlende Fragen und Vorschlaege als klare, sofort nutzbare Fragesaetze formulieren.",
  "Wenn die Diagnose teilweise richtig ist, erklaere genau was passt und was nicht.",
  "Ausgabe nur als JSON gemaess Schema, ohne Erklaertext davor oder danach.",
  "Niemals internen Monolog, Prompt-Hinweise oder englische Meta-Saetze ausgeben."
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

    const diagnosisTranscript =
      payload.diagnosisText || (await transcribeAudio(context.env.AI, payload.audioBase64));
    if (!diagnosisTranscript) {
      return json({ error: "Keine Diagnose erkannt. Bitte sprechen oder tippen." }, 422);
    }

    const promptInput = JSON.stringify(
      {
        case_profile: payload.caseText,
        conversation_history: payload.history,
        final_diagnosis_submission: diagnosisTranscript
      },
      null,
      2
    );

    const raw = await runEvaluationRequest(context.env.AI, promptInput);
    const candidate = buildCandidateEvaluation(raw);
    const evaluation = normalizeEvaluation(candidate, payload.caseText);

    const spokenFeedback = truncateForTts(buildSpokenFeedback(evaluation));
    const feedbackAudioBase64 = payload.preferLocalTts
      ? ""
      : await synthesizeSpeech(context.env.AI, spokenFeedback);

    return json({
      diagnosisTranscript,
      evaluation,
      feedbackAudioBase64
    });
  } catch (error) {
    console.error("voice-evaluate error", error);
    return json({ error: "Diagnose-Bewertung fehlgeschlagen. Bitte spaeter erneut versuchen." }, 500);
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
  const rawDiagnosisText = typeof body?.diagnosisText === "string" ? body.diagnosisText.trim() : "";
  const rawCaseText = typeof body?.caseText === "string" ? body.caseText.trim() : "";

  if (!rawAudio && !rawDiagnosisText) {
    return { ok: false, error: "Bitte Diagnose sprechen oder als Text eingeben." };
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

  const diagnosisText = rawDiagnosisText.slice(0, MAX_DIAGNOSIS_TEXT_LENGTH);
  if (rawDiagnosisText.length > MAX_DIAGNOSIS_TEXT_LENGTH) {
    return {
      ok: false,
      error: `Diagnosetext zu lang (max ${MAX_DIAGNOSIS_TEXT_LENGTH} Zeichen).`
    };
  }

  return {
    ok: true,
    audioBase64: cleanedAudio,
    diagnosisText,
    caseText: rawCaseText,
    history: sanitizeHistory(body?.history),
    preferLocalTts: Boolean(body?.preferLocalTts)
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
  if (!audioBase64) return "";
  const payload = {
    audio: audioBase64,
    task: "transcribe",
    language: "de",
    vad_filter: true,
    initial_prompt: "Kurze deutsche Verdachtsdiagnose in einem medizinischen Fachgespraech."
  };

  try {
    const result = await ai.run(WHISPER_MODEL, payload);
    if (typeof result?.text === "string") {
      return result.text.trim();
    }
  } catch {
    const audioBytes = base64ToUint8Array(audioBase64);
    try {
      const retry = await ai.run(WHISPER_MODEL, {
        ...payload,
        audio: Array.from(audioBytes)
      });
      if (typeof retry?.text === "string") {
        return retry.text.trim();
      }
    } catch {
      return "";
    }
  }

  return "";
}

async function runEvaluationRequest(ai, promptInput) {
  const request = {
    instructions: SYSTEM_INSTRUCTIONS,
    input: promptInput,
    response_format: EVALUATION_SCHEMA
  };

  try {
    return await ai.run(CHAT_MODEL, request);
  } catch {
    try {
      return await ai.run(CHAT_MODEL, {
        instructions: SYSTEM_INSTRUCTIONS,
        input: promptInput
      });
    } catch {
      try {
        return await ai.run(CHAT_MODEL, {
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTIONS },
            { role: "user", content: promptInput }
          ]
        });
      } catch {
        return ai.run(CHAT_MODEL, {
          prompt: `${SYSTEM_INSTRUCTIONS}\n\n${promptInput}`
        });
      }
    }
  }
}

function buildCandidateEvaluation(raw) {
  const direct = extractStructuredFromRaw(raw);
  if (direct) return direct;

  const text = extractModelText(raw);
  const parsed = parseStructuredResponse(text);
  if (parsed) return parsed;

  return {
    overall_score: 55,
    anamnesis_score: 55,
    diagnosis_score: 50,
    strengths: ["Du hast den Fall aktiv bearbeitet und eine klare Abschlussdiagnose abgegeben."],
    missing_questions: [],
    mistakes: ["Die Bewertung konnte nicht vollstaendig strukturiert erzeugt werden."],
    suggested_questions: [
      "Seit wann bestehen die Hauptbeschwerden genau?",
      "Welche Begleitsymptome traten zusaetzlich auf?"
    ],
    likely_diagnosis: "",
    differentials: [],
    summary_feedback:
      "Gute Grundlage. Fuer eine praezisere Bewertung bitte den Fall mit mehr gezielten Verlaufs- und Risikofragen abschliessen."
  };
}

function extractStructuredFromRaw(raw) {
  if (!raw || typeof raw !== "object") return null;

  if (looksLikeEvaluationObject(raw)) {
    return raw;
  }

  if (raw.response && typeof raw.response === "object" && looksLikeEvaluationObject(raw.response)) {
    return raw.response;
  }

  if (Array.isArray(raw.output)) {
    for (const item of raw.output) {
      if (!item || typeof item !== "object") continue;
      if (item.parsed && typeof item.parsed === "object" && looksLikeEvaluationObject(item.parsed)) {
        return item.parsed;
      }
      if (Array.isArray(item.content)) {
        for (const block of item.content) {
          if (!block || typeof block !== "object") continue;
          if (block.parsed && typeof block.parsed === "object" && looksLikeEvaluationObject(block.parsed)) {
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

function looksLikeEvaluationObject(value) {
  if (!value || typeof value !== "object") return false;
  return (
    typeof value.overall_score !== "undefined" &&
    typeof value.anamnesis_score !== "undefined" &&
    typeof value.diagnosis_score !== "undefined"
  );
}

function parseStructuredResponse(rawText) {
  const cleaned = stripCodeFence(rawText);
  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed || typeof parsed !== "object") return null;
    if (!looksLikeEvaluationObject(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function stripCodeFence(value) {
  if (typeof value !== "string") return "";
  return value.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
}

function extractModelText(raw) {
  if (typeof raw === "string") {
    return sanitizeModelText(raw);
  }
  if (!raw || typeof raw !== "object") return "";

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

function normalizeEvaluation(candidate, caseText) {
  const normalized = {
    overall_score: clampScore(candidate?.overall_score, 55),
    anamnesis_score: clampScore(candidate?.anamnesis_score, 55),
    diagnosis_score: clampScore(candidate?.diagnosis_score, 50),
    strengths: normalizeList(candidate?.strengths, 6, 190),
    missing_questions: normalizeList(candidate?.missing_questions, 8, 190),
    mistakes: normalizeList(candidate?.mistakes, 8, 190),
    suggested_questions: normalizeList(candidate?.suggested_questions, 8, 190),
    likely_diagnosis: safeLine(candidate?.likely_diagnosis, 220),
    differentials: normalizeList(candidate?.differentials, 5, 180),
    summary_feedback: safeLine(candidate?.summary_feedback, 420)
  };

  if (!normalized.strengths.length) {
    normalized.strengths = ["Du hast den Fall aktiv bearbeitet und eine Diagnose formuliert."];
  }
  if (!normalized.missing_questions.length) {
    normalized.missing_questions = [
      "Seit wann bestehen die Hauptbeschwerden genau?",
      "Welche red flags oder Ausschlussfragen wurden noch nicht gestellt?"
    ];
  }
  if (!normalized.mistakes.length) {
    normalized.mistakes = ["Die Diagnosebegruendung war noch nicht vollstaendig mit allen Fallinformationen verknuepft."];
  }
  if (!normalized.suggested_questions.length) {
    normalized.suggested_questions = [
      "Wie hat sich das Leitsymptom zeitlich entwickelt?",
      "Welche Begleitsymptome sind zusaetzlich aufgetreten?",
      "Welche relevanten Risiken oder Vorerkrankungen liegen vor?"
    ];
  }
  if (!normalized.likely_diagnosis) {
    normalized.likely_diagnosis = fallbackLikelyDiagnosis(caseText);
  }
  if (!normalized.differentials.length) {
    normalized.differentials = ["Bitte im naechsten Durchlauf mindestens zwei plausible Differenzialdiagnosen aktiv benennen."];
  }
  if (!normalized.summary_feedback) {
    normalized.summary_feedback =
      "Gute Grundlage. Fuer ein sehr starkes Ergebnis noch gezielter nach Verlauf, red flags und Risikofaktoren fragen und die Diagnose eng daran begruenden.";
  }

  return normalized;
}

function clampScore(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  const rounded = Math.round(num);
  if (rounded < 0) return 0;
  if (rounded > 100) return 100;
  return rounded;
}

function normalizeList(value, maxItems, maxLength) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => safeLine(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function safeLine(value, maxLength) {
  if (typeof value !== "string") return "";
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  return cleaned.slice(0, maxLength);
}

function fallbackLikelyDiagnosis(caseText) {
  const caseId = extractCaseId(caseText);
  if (!caseId) {
    return "Diagnose aus den vorliegenden Angaben nicht eindeutig.";
  }
  return `V. a. ${caseId.replace(/_/g, " ")}`;
}

function extractCaseId(caseText) {
  const match = String(caseText || "").match(/^CASE_ID:\s*(.+)$/m);
  return match ? match[1].trim() : "";
}

function buildSpokenFeedback(evaluation) {
  return [
    `Gesamt ${evaluation.overall_score} von 100.`,
    `Anamnese ${evaluation.anamnesis_score}, Diagnose ${evaluation.diagnosis_score}.`,
    evaluation.summary_feedback
  ].join(" ");
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
