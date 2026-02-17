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
const MAX_TEXT_FIELD = 1_400;
const MAX_CONVERSATION_TEXT_LENGTH = 40_000;
const MAX_DIAGNOSIS_TEXT_LENGTH = 500;
const MAX_SYSTEM_PROMPT_LENGTH = 60_000;

const EVALUATION_SCHEMA = {
  type: "json_schema",
  json_schema: {
    name: "fsp_simulationsanamnese_evaluation",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        criteria: {
          type: "array",
          description: "Exakt 7 Kriterien in der vorgegebenen Reihenfolge.",
          minItems: 7,
          maxItems: 7,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              name: {
                type: "string",
                description: "Kriterienname"
              },
              score: {
                type: "number",
                description: "Punktzahl pro Kriterium. Erlaubt: 0 / 0.5 / 1 / 1.5 / 2 / 2.5."
              },
              justification: {
                type: "string",
                description: "Kurze, praezise Begruendung."
              }
            },
            required: ["name", "score", "justification"]
          }
        },
        total_score: {
          type: "number",
          description: "Gesamtpunktzahl als Summe aller 7 Kriterien (max 17.5)."
        },
        pass_assessment: {
          type: "string",
          description: "Implizite Einschaetzung, ob das Niveau einem Bestehen entspricht."
        },
        recommendation: {
          type: "string",
          description: "Kurze, konkrete Empfehlung zur sprachlichen Nachbesserung."
        },
        summary_feedback: {
          type: "string"
        }
      },
      required: ["criteria", "total_score", "pass_assessment", "recommendation", "summary_feedback"]
    }
  }
};

const SYSTEM_PROMPT = [
  "Du bewertest eine ärztliche Simulationsanamnese im Rahmen der Fachsprachprüfung für ausländische Ärztinnen und Ärzte in Deutschland (Ärztekammer Berlin). Grundlage ist ein Arzt-Patient-Gespräch mit dem Ziel, die medizinisch-sprachliche Handlungsfähigkeit im klinischen Alltag zu beurteilen. Bewerte die Leistung anhand der folgenden Kriterien. Vergib für jedes Kriterium eine Punktzahl auf der Skala 0 / 0,5 / 1 / 1,5 / 2 / 2,5 Punkte (0 = gänzlich verfehlt, 0,5 = mangelhaft, 1 = nicht befriedigend, 1,5 = befriedigend, 2 = gut, 2,5 = sehr gut) und begründe jede Bewertung kurz und präzise.",
  "",
  "Bewertungskriterien sind: Erstens, ob eine professionell-persönliche Kommunikation hergestellt wird, also eine angemessene, empathische, respektvolle und rollenklare Arzt-Patient-Interaktion. Zweitens, ob sich die Kandidatin oder der Kandidat klar und ausreichend detailliert ausdrückt, mit strukturierter, präziser und medizinisch korrekter Sprache. Drittens, ob sinnvoll und situationsgerecht von starren Anamneseschemata abgewichen wird, um relevante Informationen gezielt zu erheben. Viertens, ob das Gespräch zielgerichtet und situationsbezogen geführt wird, mit logischer Struktur, Priorisierung relevanter Inhalte und ohne unnötige Abschweifungen. Fünftens, ob medizinische Sachverhalte flüssig, zusammenhängend und für Patientinnen und Patienten verständlich erklärt werden. Sechstens, ob das Gegenüber problemlos verstanden wird, das heißt, ob Patientenaussagen korrekt aufgenommen, inhaltlich richtig interpretiert und angemessen weiterverarbeitet werden. Siebtens, ob das weitere Vorgehen (z. B. Diagnostik, Therapie, nächste Schritte) klar, verständlich und patientengerecht erklärt wird.",
  "",
  "Gib anschließend die Gesamtpunktzahl an (Maximalpunktzahl 17,5 Punkte) und bewerte implizit, ob das Leistungsniveau einem Bestehen der Simulationsanamnese entspricht. Abschließend formuliere eine kurze, konkrete Empfehlung zur sprachlichen Nachbesserung, die sich auf typische Defizite der gezeigten Leistung bezieht (z. B. Strukturierung der Anamnese, Präzision medizinischer Begriffe, Patientenerklärungen, Gesprächsführung).",
  "",
  "Wichtig: Bewerte den gesamten Gesprächsteil UND den final als Diagnose abgeschickten Teil zusammen als eine Gesamtleistung.",
  "Nutze nur die übergebenen Inhalte.",
  "Antworte ausschließlich auf Deutsch und ausschließlich als valides JSON gemäß Schema.",
  "Gib in criteria exakt 7 Einträge in der vorgegebenen Reihenfolge aus.",
  "Verwende für score ausschließlich 0, 0.5, 1, 1.5, 2 oder 2.5.",
  "summary_feedback: 1-2 kurze Sätze mit der wichtigsten Lernbotschaft."
].join("\n");

const ANAMNESIS_CRITERIA_NAMES = [
  "Professionell-persönliche Kommunikation",
  "Klarheit, Detailtiefe und medizinische Sprachpräzision",
  "Situationsgerechtes Abweichen von starren Anamneseschemata",
  "Zielgerichtete und strukturierte Gesprächsführung",
  "Verständliche Erklärung medizinischer Sachverhalte",
  "Verständnis des Gegenübers und korrekte Weiterverarbeitung",
  "Klare, patientengerechte Erklärung des weiteren Vorgehens"
];

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
    const conversationText = payload.conversationText || buildConversationTranscript(payload.history);
    const combinedSubmissionText = buildCombinedSubmissionText(conversationText, diagnosisTranscript);

    const promptInput = JSON.stringify(
      {
        case_profile: payload.caseText,
        conversation_history: payload.history,
        conversation_transcript: conversationText,
        final_diagnosis_submission: diagnosisTranscript,
        combined_submission_text: combinedSubmissionText
      },
      null,
      2
    );

    const raw = await runEvaluationRequest(
      context.env.AI,
      promptInput,
      payload.chatModel,
      payload.systemPrompt
    );
    const candidate = buildCandidateEvaluation(raw, {
      caseText: payload.caseText,
      history: payload.history,
      diagnosisTranscript,
      conversationText
    });
    const evaluation = normalizeEvaluation(candidate, {
      caseText: payload.caseText,
      history: payload.history,
      diagnosisTranscript,
      conversationText
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
    return json(
      { error: "Anamnese-Bewertung fehlgeschlagen. Bitte spaeter erneut versuchen." },
      500
    );
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
  const rawConversationText =
    typeof body?.conversationText === "string" ? body.conversationText.trim() : "";
  const rawChatModel = typeof body?.chatModel === "string" ? body.chatModel.trim() : "";
  const rawSystemPrompt =
    typeof body?.systemPromptOverride === "string" ? body.systemPromptOverride : "";

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
  const conversationText = rawConversationText.slice(0, MAX_CONVERSATION_TEXT_LENGTH);

  return {
    ok: true,
    audioBase64: cleanedAudio,
    diagnosisText,
    caseText: rawCaseText,
    conversationText,
    history: sanitizeHistory(body?.history),
    preferLocalTts: Boolean(body?.preferLocalTts),
    chatModel: normalizeChatModel(rawChatModel),
    systemPrompt: normalizeSystemPrompt(rawSystemPrompt, SYSTEM_PROMPT)
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

function buildConversationTranscript(history) {
  if (!Array.isArray(history) || !history.length) return "";
  return history
    .map((turn, index) => {
      const user = safeText(turn?.user);
      const assistant = safeText(turn?.assistant);
      const lines = [`Turn ${index + 1}:`];
      if (user) lines.push(`Arzt: ${user}`);
      if (assistant) lines.push(`Patient: ${assistant}`);
      return lines.join("\n");
    })
    .join("\n\n")
    .slice(0, MAX_CONVERSATION_TEXT_LENGTH);
}

function buildCombinedSubmissionText(conversationText, diagnosisText) {
  const parts = [];
  if (conversationText) {
    parts.push("GESPRAECHSVERLAUF:");
    parts.push(conversationText);
  }
  if (diagnosisText) {
    parts.push("FINAL ABGEGEBENE DIAGNOSE:");
    parts.push(diagnosisText);
  }
  return parts.join("\n\n").trim().slice(0, MAX_CONVERSATION_TEXT_LENGTH);
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

async function runEvaluationRequest(ai, promptInput, chatModel, systemPrompt) {
  const model = normalizeChatModel(chatModel);
  const effectivePrompt = normalizeSystemPrompt(systemPrompt, SYSTEM_PROMPT);
  const request = {
    instructions: effectivePrompt,
    input: promptInput,
    response_format: EVALUATION_SCHEMA
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

function buildCandidateEvaluation(raw, contextData = {}) {
  const direct = extractStructuredFromRaw(raw);
  if (direct) return direct;

  const text = extractModelText(raw);
  const parsed = parseStructuredResponse(text);
  if (parsed) return parsed;

  return {
    criteria: ANAMNESIS_CRITERIA_NAMES.map((name, index) => ({
      name,
      score: index < 6 ? 1.5 : 1.0,
      justification:
        index < 6
          ? "Teilweise erfüllt, aber mit erkennbarem sprachlich-strukturellem Verbesserungsbedarf."
          : "Das weitere Vorgehen wurde nur teilweise klar und patientengerecht erläutert."
    })),
    total_score: 10,
    pass_assessment: "Leistungsniveau aktuell eher grenzwertig, ein Bestehen ist noch nicht sicher.",
    recommendation:
      "Strukturiere die Anamnese konsequent, arbeite sprachlich präziser und erkläre das weitere Vorgehen klarer für Patientinnen und Patienten.",
    summary_feedback:
      "Solide Grundlage mit Lücken in Struktur und sprachlicher Präzision. Nächstes Mal Gesprächsführung und patientengerechte Erklärungen klarer aufbauen."
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
  return Array.isArray(value.criteria);
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

function normalizeEvaluation(candidate) {
  const rawCriteria = Array.isArray(candidate?.criteria) ? candidate.criteria.slice(0, 7) : [];
  const criteria = ANAMNESIS_CRITERIA_NAMES.map((name, index) => {
    const source = rawCriteria[index] || {};
    return {
      name,
      score: normalizeCriterionScore(source.score),
      justification:
        safeParagraph(source.justification, 420) || "Keine ausreichende Begründung geliefert."
    };
  });

  const anamnesisScore = Number(
    criteria
      .slice(0, 6)
      .reduce((sum, item) => sum + Number(item.score || 0), 0)
      .toFixed(1)
  );
  const diagnosisScore = Number((criteria[6]?.score || 0).toFixed(1));
  const totalFromCriteria = Number((anamnesisScore + diagnosisScore).toFixed(1));
  const requestedTotal = clampTotalScore(candidate?.total_score, totalFromCriteria);
  const totalScore =
    Math.abs(requestedTotal - totalFromCriteria) <= 0.5 ? requestedTotal : totalFromCriteria;
  const passAssessment = safeParagraph(candidate?.pass_assessment, 420) || inferPassAssessment(totalScore);
  const recommendation =
    safeParagraph(candidate?.recommendation, 520) ||
    "Arbeite mit klarer Gesprächsstruktur, präzisen medizinischen Begriffen und verständlicher Erklärung des weiteren Vorgehens.";
  const summaryFeedback =
    safeParagraph(candidate?.summary_feedback, 420) ||
    safeParagraph(`${passAssessment} ${recommendation}`, 420);

  return {
    criteria,
    total_score: totalScore,
    overall_score: totalScore,
    anamnesis_score: anamnesisScore,
    diagnosis_score: diagnosisScore,
    pass_assessment: passAssessment,
    recommendation,
    summary_feedback: summaryFeedback,
    question_review_text: buildCriteriaReviewText(criteria),
    diagnosis_review_text: passAssessment,
    teacher_feedback_text: recommendation,
    likely_diagnosis: ""
  };
}

function normalizeCriterionScore(value) {
  const allowed = [0, 0.5, 1, 1.5, 2, 2.5];
  const numeric = parseLocaleNumber(value);
  if (!Number.isFinite(numeric)) return 0;
  let best = allowed[0];
  let bestDistance = Math.abs(numeric - best);
  for (const option of allowed) {
    const distance = Math.abs(numeric - option);
    if (distance < bestDistance) {
      best = option;
      bestDistance = distance;
    }
  }
  return best;
}

function clampTotalScore(value, fallback) {
  const numeric = parseLocaleNumber(value);
  if (!Number.isFinite(numeric)) return fallback;
  const clamped = Math.min(17.5, Math.max(0, numeric));
  return Math.round(clamped * 2) / 2;
}

function parseLocaleNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    return Number(value.replace(",", ".").trim());
  }
  return Number(value);
}

function inferPassAssessment(totalScore) {
  if (totalScore >= 10.5) {
    return "Leistungsniveau: tendenziell bestanden, sofern die Leistung in dieser Qualität stabil reproduzierbar ist.";
  }
  return "Leistungsniveau: aktuell eher nicht bestanden; die sprachlich-strukturelle Leistung sollte vor der Prüfung verbessert werden.";
}

function buildCriteriaReviewText(criteria) {
  if (!Array.isArray(criteria) || !criteria.length) return "";
  return criteria
    .map((item, index) => {
      const name = safeLine(item?.name, 180) || `Kriterium ${index + 1}`;
      const score = Number(item?.score ?? 0).toFixed(1);
      const justification = safeParagraph(item?.justification, 240);
      return `${index + 1}. ${name}: ${score} Punkte.${justification ? ` ${justification}` : ""}`;
    })
    .join("\n");
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

function buildSpokenFeedback(evaluation) {
  const shortTeacher = safeLine(evaluation.recommendation || evaluation.teacher_feedback_text, 320);
  const passHint = safeLine(evaluation.pass_assessment, 260);
  return [
    `Gesamt ${Number(evaluation.total_score || 0).toFixed(1)} von 17 Komma 5.`,
    `Gespraechsteil ${Number(evaluation.anamnesis_score || 0).toFixed(1)} von 15, Diagnose und Vorgehen ${Number(evaluation.diagnosis_score || 0).toFixed(1)} von 2 Komma 5.`,
    evaluation.summary_feedback,
    passHint,
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
