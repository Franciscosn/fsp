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
const MAX_HISTORY_TURNS = 20;
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
        likely_diagnosis: {
          type: "string",
          description: "Wahrscheinlichste Diagnose anhand des Falls."
        },
        question_review_text: {
          type: "string",
          description:
            "Prosa-Abschnitt zur Qualitaet der gestellten Arztfragen. Muss konkrete Fragen aus dem Verlauf referenzieren."
        },
        diagnosis_review_text: {
          type: "string",
          description:
            "Prosa-Abschnitt zur finalen Diagnose: was passt, was passt nicht, was wurde uebersehen."
        },
        teacher_feedback_text: {
          type: "string",
          description:
            "Didaktischer Prosa-Abschnitt in Rolle Pruefer/Lehrer mit klaren Verbesserungsimpulsen fuer den naechsten Durchlauf."
        },
        summary_feedback: {
          type: "string",
          description: "Kurze Zusammenfassung in 1-2 Saetzen fuer Audio-Wiedergabe."
        }
      },
      required: [
        "overall_score",
        "anamnesis_score",
        "diagnosis_score",
        "likely_diagnosis",
        "question_review_text",
        "diagnosis_review_text",
        "teacher_feedback_text",
        "summary_feedback"
      ]
    }
  }
};

const SYSTEM_INSTRUCTIONS = [
  "Rolle: Du bist ein fairer, strenger Pruefer UND Lehrer fuer die medizinische Fachsprachpruefung.",
  "Sprache: Alle Ausgaben strikt auf Deutsch.",
  "Input: Fallprofil, Gespraechsverlauf und finale Diagnose des Lernenden.",
  "Bewerte getrennt Anamnesequalitaet und Diagnosequalitaet auf 0-100.",
  "Nutze nur Informationen aus Fallprofil und Verlauf, keine frei erfundenen Fakten.",
  "question_review_text: schreibe einen zusammenhaengenden Prosa-Abschnitt und beziehe dich explizit auf konkrete Fragen des Lernenden aus dem Verlauf.",
  "question_review_text: nenne mindestens drei konkrete Fragen/Formulierungen des Lernenden (wo moeglich in indirekter Rede oder kurzen Zitaten) und bewerte Praezision, Reihenfolge und medizinische Relevanz.",
  "diagnosis_review_text: pruefe die finale Diagnose fachlich und erklaere klar, was richtig war, was ungenau/falsch war und welche Informationen uebersehen wurden.",
  "teacher_feedback_text: gib als Lehrer klare naechste Schritte fuer den naechsten Durchlauf, in Prosa (keine Listen).",
  "Vermeide Standardsaetze wie 'Guten Tag, ich beantworte...' oder wiederholte Floskeln.",
  "Wenn die Diagnose teilweise richtig ist, erklaere genau was passt und was nicht.",
  "summary_feedback: maximal 2 kurze Saetze mit der wichtigsten Lernbotschaft.",
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
        learner_questions: extractLearnerQuestions(payload.history),
        final_diagnosis_submission: diagnosisTranscript
      },
      null,
      2
    );

    const raw = await runEvaluationRequest(context.env.AI, promptInput, payload.chatModel);
    const candidate = buildCandidateEvaluation(raw, {
      caseText: payload.caseText,
      history: payload.history,
      diagnosisTranscript
    });
    const evaluation = normalizeEvaluation(candidate, {
      caseText: payload.caseText,
      history: payload.history,
      diagnosisTranscript
    });

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
  const rawChatModel = typeof body?.chatModel === "string" ? body.chatModel.trim() : "";

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

function extractLearnerQuestions(history) {
  if (!Array.isArray(history)) return [];
  return history
    .map((turn) => safeText(turn?.user))
    .filter(Boolean)
    .slice(-MAX_HISTORY_TURNS);
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
    let audioBytes = null;
    try {
      audioBytes = base64ToUint8Array(audioBase64);
    } catch {
      return "";
    }
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

async function runEvaluationRequest(ai, promptInput, chatModel) {
  const model = normalizeChatModel(chatModel);
  const request = {
    instructions: SYSTEM_INSTRUCTIONS,
    input: promptInput,
    response_format: EVALUATION_SCHEMA
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

function buildCandidateEvaluation(raw, contextData = {}) {
  const direct = extractStructuredFromRaw(raw);
  if (direct) return direct;

  const text = extractModelText(raw);
  const parsed = parseStructuredResponse(text);
  if (parsed) return parsed;

  return {
    overall_score: 58,
    anamnesis_score: 56,
    diagnosis_score: 54,
    likely_diagnosis: fallbackLikelyDiagnosis(contextData.caseText),
    question_review_text: buildFallbackQuestionReview(contextData.history),
    diagnosis_review_text: buildFallbackDiagnosisReview(
      contextData.caseText,
      contextData.diagnosisTranscript
    ),
    teacher_feedback_text: buildFallbackTeacherFeedback(),
    summary_feedback:
      "Solide Grundlage. Im naechsten Durchlauf die Fragen noch strukturierter aufbauen und die Diagnose enger mit den erhobenen Befunden begruenden."
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
    const extracted = extractJsonObjectFromText(cleaned);
    if (!extracted) return null;
    try {
      const parsed = JSON.parse(extracted);
      if (!parsed || typeof parsed !== "object") return null;
      if (!looksLikeEvaluationObject(parsed)) return null;
      return parsed;
    } catch {
      return null;
    }
  }
}

function extractJsonObjectFromText(text) {
  if (typeof text !== "string" || !text) return "";
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace < 0 || lastBrace <= firstBrace) return "";
  return text.slice(firstBrace, lastBrace + 1).trim();
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

function normalizeEvaluation(candidate, contextData = {}) {
  const caseText = contextData.caseText || "";
  const history = Array.isArray(contextData.history) ? contextData.history : [];
  const diagnosisTranscript = safeParagraph(contextData.diagnosisTranscript, 260);
  const normalized = {
    overall_score: clampScore(candidate?.overall_score, 55),
    anamnesis_score: clampScore(candidate?.anamnesis_score, 55),
    diagnosis_score: clampScore(candidate?.diagnosis_score, 50),
    likely_diagnosis: safeLine(candidate?.likely_diagnosis, 220),
    question_review_text: safeParagraph(candidate?.question_review_text, 1600),
    diagnosis_review_text: safeParagraph(candidate?.diagnosis_review_text, 1400),
    teacher_feedback_text: safeParagraph(candidate?.teacher_feedback_text, 1400),
    summary_feedback: safeParagraph(candidate?.summary_feedback, 420)
  };

  if (!normalized.likely_diagnosis) {
    normalized.likely_diagnosis = fallbackLikelyDiagnosis(caseText);
  }
  if (!normalized.question_review_text) {
    normalized.question_review_text = buildQuestionReviewFromLegacy(candidate, history);
  }
  if (!normalized.diagnosis_review_text) {
    normalized.diagnosis_review_text = buildDiagnosisReviewFromLegacy(
      candidate,
      caseText,
      diagnosisTranscript
    );
  }
  if (!normalized.teacher_feedback_text) {
    normalized.teacher_feedback_text = buildTeacherFeedbackFromLegacy(candidate);
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

function safeParagraph(value, maxLength) {
  if (typeof value !== "string") return "";
  const cleaned = value
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  if (!cleaned) return "";
  return cleaned.slice(0, maxLength);
}

function buildQuestionReviewFromLegacy(candidate, history) {
  const strengths = buildLegacyListText(candidate?.strengths, 3);
  const missing = buildLegacyListText(candidate?.missing_questions, 3);
  const suggested = buildLegacyListText(candidate?.suggested_questions, 3);
  const examples = extractLearnerQuestions(history)
    .slice(-4)
    .map((q) => quoteQuestion(q))
    .join(", ");

  if (examples) {
    return safeParagraph(
      `In deiner Anamnese sind mehrere konkrete Fragen erkennbar, zum Beispiel ${examples}. ${strengths ? `Positiv war: ${strengths}. ` : ""}${missing ? `Verbesserungsbedarf: ${missing}. ` : ""}${suggested ? `Naechstes Mal hilfreicher: ${suggested}.` : ""}`,
      1600
    );
  }
  return safeParagraph(
    `${strengths ? `Positiv war: ${strengths}. ` : ""}${missing ? `Es fehlten noch wichtige Punkte: ${missing}. ` : ""}${suggested ? `Hilfreiche Anschlussfragen waeren: ${suggested}.` : "Strukturiere die Anamnese noch klarer nach Beginn, Verlauf, Begleitsymptomen und Risikofaktoren."}`,
    1600
  );
}

function buildDiagnosisReviewFromLegacy(candidate, caseText, diagnosisTranscript) {
  const mistakes = buildLegacyListText(candidate?.mistakes, 3);
  const likely = safeLine(candidate?.likely_diagnosis, 180) || fallbackLikelyDiagnosis(caseText);
  const submitted = diagnosisTranscript ? `Deine abgegebene Diagnose war: ${diagnosisTranscript}. ` : "";
  return safeParagraph(
    `${submitted}Die fallnahe Hauptdiagnose ist am ehesten ${likely}. ${mistakes ? `Kritische Punkte waren: ${mistakes}.` : "Pruefe im naechsten Durchlauf genauer, ob alle erhobenen Befunde wirklich zu deiner Enddiagnose passen."}`,
    1400
  );
}

function buildTeacherFeedbackFromLegacy(candidate) {
  const differentials = buildLegacyListText(candidate?.differentials, 3);
  return safeParagraph(
    `Als Pruefer und Lehrer empfehle ich dir, das Gespraech konsequent in Bloecke zu strukturieren: Leitsymptom, zeitlicher Verlauf, Begleitsymptome, red flags und Risikoprofil. Danach solltest du deine Verdachtsdiagnose explizit mit den erhobenen Informationen verknuepfen und kurz begruenden, warum Alternativen weniger wahrscheinlich sind.${differentials ? ` Denk dabei aktiv an Differenzialdiagnosen wie: ${differentials}.` : ""}`,
    1400
  );
}

function buildFallbackQuestionReview(history) {
  const questions = extractLearnerQuestions(history);
  if (!questions.length) {
    return "Es liegen kaum verwertbare Arztfragen im Verlauf vor. Fuer eine belastbare Bewertung solltest du kuenftig gezielt nach Beginn, Verlauf, Begleitsymptomen, Vorerkrankungen und Risikofaktoren fragen.";
  }
  const examples = questions
    .slice(-4)
    .map((question) => quoteQuestion(question))
    .join(", ");
  return `Im Gespraech waren konkrete Arztfragen erkennbar, zum Beispiel ${examples}. Fuer ein pruefungsstarkes Vorgehen sollten diese Fragen noch klarer geordnet werden: zuerst Leitsymptom und zeitlicher Verlauf, danach Begleitsymptome, red flags und relevante Risiken.`;
}

function buildFallbackDiagnosisReview(caseText, diagnosisTranscript) {
  const likely = fallbackLikelyDiagnosis(caseText);
  const submitted = diagnosisTranscript ? `Deine Diagnose lautete: ${diagnosisTranscript}. ` : "";
  return `${submitted}Im Abgleich mit dem Fall wirkt am ehesten ${likely} plausibel. Pruefe, ob deine Diagnose wirklich alle zentralen Befunde erklaert, und benenne offen, welche Informationen noch fehlen, bevor du dich festlegst.`;
}

function buildFallbackTeacherFeedback() {
  return "Als Pruefer und Lehrer rate ich dir, kuenftig gezielter in diagnostischen Schritten zu arbeiten: zuerst strukturierte Anamnese, dann Verdachtsdiagnose mit Begruendung, danach aktive Abgrenzung gegen wichtige Alternativen. So wird dein Gespraech fachlich klarer und pruefungssicherer.";
}

function buildLegacyListText(value, maxItems) {
  return normalizeList(value, maxItems, 180).join("; ");
}

function quoteQuestion(question) {
  const cleaned = safeLine(question, 140);
  if (!cleaned) return "";
  return `„${cleaned}“`;
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
  const shortTeacher = safeLine(evaluation.teacher_feedback_text, 320);
  return [
    `Gesamt ${evaluation.overall_score} von 100.`,
    `Anamnese ${evaluation.anamnesis_score}, Diagnose ${evaluation.diagnosis_score}.`,
    evaluation.summary_feedback,
    shortTeacher
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
