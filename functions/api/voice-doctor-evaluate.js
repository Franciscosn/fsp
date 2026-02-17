const DEFAULT_CHAT_MODEL = "@cf/openai/gpt-oss-20b";
const ALLOWED_CHAT_MODELS = new Set([
  "@cf/openai/gpt-oss-20b",
  "@cf/qwen/qwen3-30b-a3b-fp8",
  "@cf/zai-org/glm-4.7-flash",
  "@cf/openai/gpt-oss-120b"
]);

const MAX_CASE_LENGTH = 8_000;
const MAX_HISTORY_TURNS = 60;
const MAX_TEXT_FIELD = 1_100;
const MAX_SYSTEM_PROMPT_LENGTH = 60_000;

const DOCTOR_CONVERSATION_CRITERIA_NAMES = [
  "Fallvorstellung: fluessig und situationsangemessen",
  "Grammatik und Verstaendlichkeit",
  "Fachwortgebrauch: korrekt und angemessen",
  "Klare Aussagen zu wesentlichen Befunden und Behandlungsschritten",
  "Rueckfragen sprachlich sicher beantworten",
  "Faehigkeit zur Fachdiskussion ueber den Fall",
  "Uebersetzung von 5 Fachbegriffen in verstaendliches Deutsch",
  "2 Abkuerzungen vervollstaendigen + 3 Laborwerte mit Zahlen/Einheiten korrekt vorlesen"
];

const EVALUATION_SCHEMA = {
  type: "json_schema",
  json_schema: {
    name: "fsp_doctor_doctor_evaluation",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        criteria: {
          type: "array",
          minItems: 8,
          maxItems: 8,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              name: { type: "string" },
              score: { type: "number" },
              justification: { type: "string" }
            },
            required: ["name", "score", "justification"]
          }
        },
        total_score: { type: "number" },
        pass_assessment: { type: "string" },
        recommendation: { type: "string" },
        summary_feedback: { type: "string" }
      },
      required: ["criteria", "total_score", "pass_assessment", "recommendation", "summary_feedback"]
    }
  }
};

const SYSTEM_PROMPT = [
  "Du bewertest den Pruefungsbereich 'Aerztliches Gespraech' der Fachsprachpruefung fuer auslaendische Aerztinnen und Aerzte in Berlin (Aerztekammer Berlin).",
  "Grundlage ist die vorliegende Arzt-Arzt-Gespraechsdokumentation zum selben klinischen Fall.",
  "Bewerte streng am Berliner Bewertungsbogen.",
  "",
  "Vergib fuer jedes Kriterium eine Punktzahl auf der Skala 0 / 0,5 / 1 / 1,5 / 2 / 2,5 (0 = gaenzlich verfehlt, 2,5 = sehr gut).",
  "Begründe jede Einzelbewertung kurz und praezise.",
  "",
  "Kriterien (in dieser Reihenfolge):",
  "1) Fallvorstellung fluessig und situationsangemessen",
  "2) Grammatik korrekt und gut verstaendlich",
  "3) Fremdsprachliche Fachwoerter korrekt und angemessen",
  "4) Klare Aussagen zu wesentlichen Befunden und Behandlungsschritten",
  "5) Rueckfragen ohne sprachliche Probleme beantworten",
  "6) An einer Diskussion ueber den Fall teilnehmen koennen",
  "7) 5 medizinische Fachbegriffe ins verstaendliche Deutsch uebersetzen",
  "8) 2 medizinische Abkuerzungen vervollstaendigen und 3 Laborwerte mit Zahlen und Masseinheiten korrekt vorlesen",
  "",
  "Wichtig: Beurteile nur anhand der uebergebenen Inhalte. Wenn ein Kriterium nicht ausreichend demonstriert wurde, bewerte entsprechend niedriger und benenne den fehlenden Nachweis knapp.",
  "",
  "Gib danach die Gesamtpunktzahl an (max 20 Punkte) und eine implizite Bestehenseinschaetzung (Bestehensgrenze 12 Punkte).",
  "Formuliere abschliessend eine kurze, konkrete Empfehlung zur sprachlichen Nachbesserung.",
  "",
  "Antworte ausschliesslich auf Deutsch und ausschliesslich als valides JSON gemaess Schema.",
  "criteria muss exakt 8 Eintraege in der vorgegebenen Reihenfolge enthalten."
].join("\n");

export async function onRequestPost(context) {
  try {
    if (!context.env?.AI) {
      return json({ error: "AI binding fehlt." }, 500);
    }

    const payload = await readPayload(context.request);
    if (!payload.ok) {
      return json({ error: payload.error }, 400);
    }

    const effectivePrompt = normalizeSystemPrompt(payload.systemPrompt, SYSTEM_PROMPT);
    const modelResponse = await context.env.AI.run(payload.chatModel, {
      messages: [
        { role: "system", content: effectivePrompt },
        {
          role: "user",
          content: JSON.stringify(
            {
              case_profile: payload.caseText,
              conversation_history: payload.history
            },
            null,
            2
          )
        }
      ],
      response_format: EVALUATION_SCHEMA,
      max_tokens: 2000,
      temperature: 0.1
    });

    const candidate = parseAiJson(modelResponse);
    const evaluation = normalizeEvaluation(candidate);
    return json({ evaluation });
  } catch (error) {
    console.error("voice-doctor-evaluate error", error);
    return json({ error: "Arzt-Arzt-Bewertung fehlgeschlagen." }, 500);
  }
}

async function readPayload(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return { ok: false, error: "Ungueltiger Request-Typ. Erwartet wird JSON." };
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return { ok: false, error: "JSON konnte nicht gelesen werden." };
  }

  const caseText = safeText(body?.caseText, MAX_CASE_LENGTH);
  const rawChatModel = safeText(body?.chatModel, 120);
  const rawSystemPrompt =
    typeof body?.systemPromptOverride === "string" ? body.systemPromptOverride : "";
  const history = sanitizeHistory(body?.history);

  if (!caseText) {
    return { ok: false, error: "Bitte zuerst einen medizinischen Fall auswaehlen." };
  }
  if (!history.length) {
    return { ok: false, error: "Bitte zuerst ein Arzt-Arzt-Gespraech fuehren." };
  }

  return {
    ok: true,
    caseText,
    history,
    chatModel: normalizeChatModel(rawChatModel),
    systemPrompt: normalizeSystemPrompt(rawSystemPrompt, SYSTEM_PROMPT)
  };
}

function sanitizeHistory(value) {
  if (!Array.isArray(value)) return [];
  const trimmed = value.slice(-MAX_HISTORY_TURNS);
  const normalized = [];
  for (const turn of trimmed) {
    if (!turn || typeof turn !== "object") continue;
    const user = safeText(turn.user, MAX_TEXT_FIELD);
    const assistant = safeText(turn.assistant, MAX_TEXT_FIELD);
    if (!user && !assistant) continue;
    normalized.push({ user, assistant });
  }
  return normalized;
}

function normalizeChatModel(value) {
  if (!value) return DEFAULT_CHAT_MODEL;
  return ALLOWED_CHAT_MODELS.has(value) ? value : DEFAULT_CHAT_MODEL;
}

function normalizeSystemPrompt(value, fallback) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, MAX_SYSTEM_PROMPT_LENGTH);
}

function parseAiJson(response) {
  if (!response) return null;
  if (response?.response) return parseAiJson(response.response);
  if (typeof response === "string") {
    try {
      return JSON.parse(response);
    } catch {
      return null;
    }
  }
  if (typeof response === "object") {
    if (Array.isArray(response.output)) {
      for (const item of response.output) {
        if (typeof item?.content === "string") {
          try {
            return JSON.parse(item.content);
          } catch {
            // continue
          }
        }
      }
    }
    return response;
  }
  return null;
}

function normalizeEvaluation(candidate) {
  const rawCriteria = Array.isArray(candidate?.criteria) ? candidate.criteria.slice(0, 8) : [];
  const criteria = DOCTOR_CONVERSATION_CRITERIA_NAMES.map((name, index) => {
    const source = rawCriteria[index] || {};
    return {
      name,
      score: normalizeScore(source.score),
      justification: safeText(source.justification, 420) || "Keine ausreichende Begruendung geliefert."
    };
  });

  const totalFromCriteria = Number(criteria.reduce((sum, item) => sum + item.score, 0).toFixed(1));
  const totalScore = clamp(totalFromCriteria, 0, 20);
  const passAssessment =
    safeText(candidate?.pass_assessment, 420) || inferPassAssessment(totalScore);
  const recommendation =
    safeText(candidate?.recommendation, 520) ||
    "Strukturiere die Fallvorstellung klarer, beantworte Rueckfragen praeziser und trainiere Fachwort-zu-Alltagssprache sowie Abkuerzungen/Laborwerte.";
  const summaryFeedback =
    safeText(candidate?.summary_feedback, 420) ||
    safeText(`${passAssessment} ${recommendation}`, 420);

  return {
    criteria,
    total_score: totalScore,
    pass_assessment: passAssessment,
    recommendation,
    summary_feedback: summaryFeedback
  };
}

function normalizeScore(value) {
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

function parseLocaleNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace(",", ".").trim());
  return Number(value);
}

function inferPassAssessment(totalScore) {
  if (totalScore >= 12) {
    return "Leistungsniveau: voraussichtlich bestanden (>= 12 Punkte).";
  }
  return "Leistungsniveau: voraussichtlich nicht bestanden (< 12 Punkte).";
}

function safeText(value, maxLen) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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
