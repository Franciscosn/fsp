const DEFAULT_CHAT_MODEL = "@cf/openai/gpt-oss-20b";
const ALLOWED_CHAT_MODELS = new Set([
  "@cf/openai/gpt-oss-20b",
  "@cf/qwen/qwen3-30b-a3b-fp8",
  "@cf/zai-org/glm-4.7-flash",
  "@cf/openai/gpt-oss-120b"
]);

const MAX_CASE_LENGTH = 8_000;
const MAX_HISTORY_TURNS = 20;
const MAX_TEXT_FIELD = 900;
const MAX_DOCTOR_LETTER_TEXT = 12_000;
const MAX_SYSTEM_PROMPT_LENGTH = 60_000;

const DOCTOR_LETTER_SCHEMA = {
  type: "json_schema",
  json_schema: {
    name: "doctor_letter_evaluation",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        criteria: {
          type: "array",
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
        recommendation: { type: "string" }
      },
      required: ["criteria", "total_score", "recommendation"]
    }
  }
};

const SYSTEM_PROMPT = [
  "Du bewertest eine schriftliche ärztliche Dokumentation (Arztbrief) im Rahmen der Fachsprachprüfung für ausländische Ärztinnen und Ärzte in Deutschland (Ärztekammer Berlin). Grundlage ist ein zuvor geführtes Arzt-Patient-Gespräch mit einem Simulationspatienten. Ziel der Bewertung ist die Beurteilung der schriftlichen medizinisch-sprachlichen Kompetenz im klinischen Alltag. Bewerte das vorliegende Dokument anhand der folgenden Kriterien. Vergib für jedes Kriterium eine Punktzahl auf der Skala 0 / 0,5 / 1 / 1,5 / 2 / 2,5 Punkte (0 = gänzlich verfehlt, 0,5 = mangelhaft, 1 = nicht befriedigend, 1,5 = befriedigend, 2 = gut, 2,5 = sehr gut) und begründe jede Bewertung kurz und präzise. Beim ersten Kriterium sind nur die Punktwerte 0, 1,5 oder 2,5 zulässig.",
  "",
  "Bewertungskriterien sind: Erstens, ob das erstellte Dokument der richtigen Patientin bzw. dem richtigen Patienten eindeutig und sicher zuzuordnen ist (z. B. korrekte Identifikationsdaten, keine Verwechslungen). Zweitens, ob der Arztbrief strukturiert und vollständig abgefasst ist, insbesondere mit einer nachvollziehbaren Gliederung (z. B. Anamnese, Befunde, Diagnose, Therapie, weiteres Vorgehen) und ohne relevante inhaltliche Lücken. Drittens, ob der Text grammatisch korrekt ist, also korrekte Satzstrukturen, Zeiten und Bezüge verwendet werden. Viertens, ob der Text orthografisch korrekt ist, insbesondere hinsichtlich Rechtschreibung medizinischer und allgemeinsprachlicher Begriffe. Fünftens, ob die notwendige medizinische Detailtiefe erreicht wird, das heißt weder oberflächlich noch übermäßig ausschweifend dokumentiert wird. Sechstens, ob fremdsprachliche medizinische Fachwörter korrekt und in angemessenem Umfang angewendet werden, ohne Fehlgebrauch oder unnötige Häufung. Siebtens, ob die wesentlichen Anamnesebefunde semantisch korrekt wiedergegeben werden, also inhaltlich richtig, vollständig und ohne Sinnentstellungen. Achtens, ob klare Aussagen zu den wesentlichen Behandlungsschritten getroffen werden, einschließlich Diagnostik, Therapie und gegebenenfalls Empfehlungen oder weiterem Vorgehen.",
  "",
  "Gib anschließend die Gesamtpunktzahl an (Maximalpunktzahl 20 Punkte) und bewerte implizit, ob das Leistungsniveau dem Bestehen der schriftlichen Dokumentation entspricht (Bestehensgrenze 12 Punkte). Abschließend formuliere eine kurze, konkrete Empfehlung zur sprachlichen Nachbesserung, die sich auf die größten sprachlichen oder strukturellen Schwächen des Arztbriefs bezieht (z. B. Strukturierung, Präzision der Fachsprache, grammatische Sicherheit, semantische Genauigkeit).",
  "",
  "Antworte ausschliesslich als valides JSON gemaess Schema. Verwende fuer criteria exakt 8 Eintraege in der vorgegebenen Reihenfolge."
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
              conversation_history: payload.history,
              doctor_letter: payload.doctorLetterText
            },
            null,
            2
          )
        }
      ],
      response_format: DOCTOR_LETTER_SCHEMA,
      max_tokens: 1800,
      temperature: 0.1
    });

    const candidate = parseAiJson(modelResponse);
    const evaluation = normalizeEvaluation(candidate);
    return json({ evaluation });
  } catch (error) {
    console.error("doctor-letter-evaluate error", error);
    return json({ error: "Arztbrief-Bewertung fehlgeschlagen." }, 500);
  }
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
            // ignore
          }
        }
      }
    }
    return response;
  }
  return null;
}

function normalizeEvaluation(candidate) {
  const defaultNames = [
    "Zuordnung zur richtigen Patientin / zum richtigen Patienten",
    "Struktur und Vollstaendigkeit",
    "Grammatik",
    "Orthografie",
    "Medizinische Detailtiefe",
    "Fachwortgebrauch",
    "Semantische Korrektheit der Anamnese",
    "Behandlungsschritte / weiteres Vorgehen"
  ];

  const rawCriteria = Array.isArray(candidate?.criteria) ? candidate.criteria.slice(0, 8) : [];
  const criteria = defaultNames.map((name, index) => {
    const source = rawCriteria[index] || {};
    const score = normalizeScore(source.score, index === 0);
    return {
      name,
      score,
      justification: safeText(source.justification, 400) || "Keine Begruendung geliefert."
    };
  });

  const totalFromCriteria = Number(criteria.reduce((sum, entry) => sum + entry.score, 0).toFixed(1));
  const totalScore = clamp(totalFromCriteria, 0, 20);

  return {
    criteria,
    total_score: totalScore,
    recommendation:
      safeText(candidate?.recommendation, 500) ||
      "Bitte verbessere Struktur, sprachliche Praezision und Vollstaendigkeit des Arztbriefs."
  };
}

function normalizeScore(value, restrictedFirst) {
  const numeric = Number(value);
  const allowed = restrictedFirst ? [0, 1.5, 2.5] : [0, 0.5, 1, 1.5, 2, 2.5];
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

function safeText(value, maxLen) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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

  const doctorLetterText = safeText(body?.doctorLetterText, MAX_DOCTOR_LETTER_TEXT);
  const caseText = safeText(body?.caseText, MAX_CASE_LENGTH);
  const rawChatModel = safeText(body?.chatModel, 120);
  const rawSystemPrompt =
    typeof body?.systemPromptOverride === "string" ? body.systemPromptOverride : "";

  if (!doctorLetterText) {
    return { ok: false, error: "Bitte zuerst einen Arztbrief eingeben." };
  }
  if (!caseText) {
    return { ok: false, error: "Bitte zuerst einen medizinischen Fall auswaehlen." };
  }

  return {
    ok: true,
    doctorLetterText,
    caseText,
    history: sanitizeHistory(body?.history),
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

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
