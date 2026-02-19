const DEFAULT_SUPABASE_URL = "https://nitmxiasxwgwsaygumls.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_frshj6OvLDHGioVXbVwsrg_dbzyFajQ";

const SUPABASE_REQUEST_TIMEOUT_MS = 15_000;
const MAX_PROMPT_TEXT_LENGTH = 60_000;
const MAX_PROMPT_PROPOSAL_NAME_LENGTH = 120;
const MAX_PROMPT_PROPOSAL_NOTE_LENGTH = 1_200;
const DEFAULT_QUERY_LIMIT = 200;
const MAX_QUERY_LIMIT = 400;
const PROMPT_FEEDBACK_TARGET_ALL = "__all__";
const PROMPT_FIELD_KEYS = new Set([
  "voiceTurn",
  "voiceEvaluate",
  "doctorLetterEvaluate",
  "voiceDoctorTurn",
  "voiceDoctorEvaluate"
]);

export async function onRequestGet(context) {
  try {
    const accessToken = readBearerToken(context.request);
    const envConfig = readSupabaseConfig(context.env);
    const limit = readLimit(context.request.url);

    const [profiles, submissions] = await Promise.all([
      fetchPromptProfiles(envConfig, accessToken),
      fetchPromptSubmissions(envConfig, accessToken, limit)
    ]);

    return json({ profiles, submissions });
  } catch (error) {
    return errorToJsonResponse(error, "Prompt-Auswahl laden");
  }
}

export async function onRequestPost(context) {
  try {
    const accessToken = readBearerToken(context.request);
    const envConfig = readSupabaseConfig(context.env);
    const payload = await readJsonPayload(context.request);
    const validated = validatePromptProposalPayload(payload, accessToken);

    const submission = await insertPromptSubmission(envConfig, accessToken, validated);

    let directAdoptApplied = false;
    if (validated.directAdoptRequested) {
      await applyPromptProposalGlobally(envConfig, accessToken, validated, submission.id);
      await markPromptSubmissionAsAdopted(envConfig, accessToken, submission.id);
      directAdoptApplied = true;
    }

    return json({
      submission: {
        id: submission.id,
        created_at: submission.created_at,
        proposal_name: validated.proposalName,
        target_prompt_key: validated.targetPromptKey,
        prompt_payload_json: validated.promptPayloadJson
      },
      directAdoptApplied
    });
  } catch (error) {
    return errorToJsonResponse(error, "Prompt-Vorschlag speichern");
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

function errorToJsonResponse(error, stageLabel) {
  const normalized = normalizeError(error, stageLabel);
  const status = Number.isFinite(normalized.status) ? normalized.status : 500;
  return json(
    {
      error: normalized.message || "Unbekannter Fehler",
      code: normalized.code || "",
      details: normalized.details || "",
      hint: normalized.hint || ""
    },
    status
  );
}

function normalizeError(error, stageLabel = "") {
  if (!error || typeof error !== "object") {
    return {
      status: 500,
      code: "",
      message: `${stageLabel || "Anfrage"} fehlgeschlagen.`,
      details: "",
      hint: ""
    };
  }

  const code = safeString(error.code, 80);
  const details = safeString(error.details, 1_000);
  const hint = safeString(error.hint, 600);
  const message = safeString(error.message, 1_000) || `${stageLabel || "Anfrage"} fehlgeschlagen.`;
  const status = Number(error.status);

  return {
    status: Number.isFinite(status) ? status : 500,
    code,
    message,
    details,
    hint
  };
}

function readSupabaseConfig(env) {
  const supabaseUrl = safeString(env?.SUPABASE_URL, 500) || DEFAULT_SUPABASE_URL;
  const supabaseAnonKey = safeString(env?.SUPABASE_ANON_KEY, 500) || DEFAULT_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw {
      status: 500,
      code: "SUPABASE_CONFIG_MISSING",
      message: "Supabase-Konfiguration fehlt (SUPABASE_URL / SUPABASE_ANON_KEY)."
    };
  }
  return { supabaseUrl, supabaseAnonKey };
}

function readBearerToken(request) {
  const authHeader = request.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match ? match[1].trim() : "";
  if (!token) {
    throw {
      status: 401,
      code: "MISSING_TOKEN",
      message: "Authorization Bearer Token fehlt."
    };
  }
  return token;
}

function readLimit(requestUrl) {
  let parsedUrl = null;
  try {
    parsedUrl = new URL(requestUrl);
  } catch {
    return DEFAULT_QUERY_LIMIT;
  }
  const raw = Number(parsedUrl.searchParams.get("limit"));
  if (!Number.isFinite(raw)) return DEFAULT_QUERY_LIMIT;
  return Math.max(1, Math.min(MAX_QUERY_LIMIT, Math.floor(raw)));
}

async function readJsonPayload(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw {
      status: 400,
      code: "INVALID_CONTENT_TYPE",
      message: "Ungueltiger Request-Typ. Erwartet wird JSON."
    };
  }
  try {
    return await request.json();
  } catch {
    throw {
      status: 400,
      code: "INVALID_JSON",
      message: "JSON konnte nicht gelesen werden."
    };
  }
}

function validatePromptProposalPayload(payload, accessToken) {
  const source = payload && typeof payload === "object" ? payload : {};

  const proposalName = safeString(source.proposalName, MAX_PROMPT_PROPOSAL_NAME_LENGTH).trim();
  if (!proposalName) {
    throw {
      status: 400,
      code: "NAME_REQUIRED",
      message: "Name des Prompt-Vorschlags fehlt."
    };
  }

  const proposalNote = safeString(source.proposalNote, MAX_PROMPT_PROPOSAL_NOTE_LENGTH).trim();
  const targetPromptKey = normalizeTargetPromptKey(source.targetPromptKey);
  const directAdoptRequested = Boolean(source.directAdoptRequested);
  const userId = readUserIdFromToken(accessToken);
  if (!userId) {
    throw {
      status: 401,
      code: "INVALID_TOKEN_SUB",
      message: "Token enthaelt keine gueltige User-ID."
    };
  }

  const promptPayloadJson = validatePromptPayloadJson(source.promptPayloadJson, targetPromptKey);
  const promptText = buildPromptTextForStorage(source.promptText, targetPromptKey, promptPayloadJson);

  return {
    userId,
    proposalName,
    proposalNote,
    targetPromptKey,
    promptText,
    promptPayloadJson,
    directAdoptRequested
  };
}

function validatePromptPayloadJson(rawPayload, targetPromptKey) {
  if (!rawPayload || typeof rawPayload !== "object" || Array.isArray(rawPayload)) {
    throw {
      status: 400,
      code: "INVALID_PROMPT_PAYLOAD",
      message: "promptPayloadJson muss ein Objekt sein."
    };
  }

  const expectedKeys = getTargetPromptKeys(targetPromptKey);
  const validated = {};
  for (const key of expectedKeys) {
    const promptText = safeString(rawPayload[key], MAX_PROMPT_TEXT_LENGTH).trim();
    if (!promptText) {
      throw {
        status: 400,
        code: "EMPTY_PROMPT_TEXT",
        message: `Prompt-Text fuer ${key} fehlt.`
      };
    }
    validated[key] = promptText;
  }
  return validated;
}

function buildPromptTextForStorage(rawPromptText, targetPromptKey, promptPayloadJson) {
  const cleaned = safeString(rawPromptText, MAX_PROMPT_TEXT_LENGTH).trim();
  if (cleaned) return cleaned;

  const keys = getTargetPromptKeys(targetPromptKey);
  if (keys.length === 1) {
    return safeString(promptPayloadJson[keys[0]], MAX_PROMPT_TEXT_LENGTH);
  }
  return JSON.stringify(promptPayloadJson, null, 2).slice(0, MAX_PROMPT_TEXT_LENGTH);
}

function normalizeTargetPromptKey(value) {
  if (value === PROMPT_FEEDBACK_TARGET_ALL) return PROMPT_FEEDBACK_TARGET_ALL;
  return PROMPT_FIELD_KEYS.has(value) ? value : "voiceDoctorTurn";
}

function getTargetPromptKeys(targetPromptKey) {
  if (targetPromptKey === PROMPT_FEEDBACK_TARGET_ALL) {
    return Array.from(PROMPT_FIELD_KEYS);
  }
  return [targetPromptKey];
}

function readUserIdFromToken(accessToken) {
  const parts = String(accessToken || "").split(".");
  if (parts.length < 2) return "";
  const encodedPayload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded =
    encodedPayload + "=".repeat((4 - (encodedPayload.length % 4 || 4)) % 4);

  try {
    const decoded = atob(padded);
    const payload = JSON.parse(decoded);
    const sub = safeString(payload?.sub, 120);
    return sub;
  } catch {
    return "";
  }
}

async function fetchPromptProfiles(envConfig, accessToken) {
  const data = await supabaseRestRequest(
    envConfig,
    accessToken,
    "prompt_profiles?select=prompt_key,prompt_text,version,is_active,updated_at&is_active=eq.true",
    {
      method: "GET",
      stageLabel: "Globale Prompt-Profile laden"
    }
  );
  return Array.isArray(data) ? data : [];
}

async function fetchPromptSubmissions(envConfig, accessToken, limit) {
  const data = await supabaseRestRequest(
    envConfig,
    accessToken,
    `prompt_feedback_submissions?select=id,proposal_name,target_prompt_key,prompt_text,prompt_payload_json,created_at,direct_adopt_applied&order=created_at.desc&limit=${limit}`,
    {
      method: "GET",
      stageLabel: "Prompt-Vorschlaege laden"
    }
  );
  return Array.isArray(data) ? data : [];
}

async function insertPromptSubmission(envConfig, accessToken, payload) {
  const body = [
    {
      user_id: payload.userId,
      proposal_name: payload.proposalName,
      proposal_note: payload.proposalNote,
      target_prompt_key: payload.targetPromptKey,
      prompt_text: payload.promptText,
      prompt_payload_json: payload.promptPayloadJson,
      direct_adopt_requested: payload.directAdoptRequested,
      direct_adopt_applied: false
    }
  ];

  const data = await supabaseRestRequest(
    envConfig,
    accessToken,
    "prompt_feedback_submissions?select=id,created_at",
    {
      method: "POST",
      prefer: "return=representation",
      body,
      stageLabel: "Prompt-Vorschlag speichern"
    }
  );
  const row = Array.isArray(data) ? data[0] : null;
  if (!row?.id) {
    throw {
      status: 500,
      code: "INSERT_EMPTY",
      message: "Prompt-Vorschlag wurde gespeichert, aber ohne Rueckgabe-ID."
    };
  }
  return row;
}

async function applyPromptProposalGlobally(envConfig, accessToken, payload, sourceSubmissionId) {
  const promptKeys = getTargetPromptKeys(payload.targetPromptKey);
  const existingRows = await loadExistingPromptVersions(envConfig, accessToken, promptKeys);

  const versionByKey = new Map();
  for (const row of existingRows) {
    const key = safeString(row?.prompt_key, 80);
    const version = Number(row?.version);
    if (!PROMPT_FIELD_KEYS.has(key)) continue;
    versionByKey.set(key, Number.isFinite(version) ? version : 0);
  }

  const nowIso = new Date().toISOString();
  const upsertRows = promptKeys.map((key) => ({
    prompt_key: key,
    prompt_text: payload.promptPayloadJson[key],
    version: (versionByKey.get(key) || 0) + 1,
    is_active: true,
    updated_at: nowIso,
    updated_by: payload.userId,
    source_submission_id: sourceSubmissionId
  }));

  await supabaseRestRequest(
    envConfig,
    accessToken,
    "prompt_profiles?on_conflict=prompt_key",
    {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: upsertRows,
      stageLabel: "Globale Prompt-Profile speichern"
    }
  );
}

async function markPromptSubmissionAsAdopted(envConfig, accessToken, submissionId) {
  await supabaseRestRequest(
    envConfig,
    accessToken,
    `prompt_feedback_submissions?id=eq.${submissionId}`,
    {
      method: "PATCH",
      prefer: "return=minimal",
      body: {
        direct_adopt_applied: true,
        adoption_note: "Global in Testphase sofort uebernommen."
      },
      stageLabel: "Prompt-Vorschlag als uebernommen markieren"
    }
  );
}

async function loadExistingPromptVersions(envConfig, accessToken, promptKeys) {
  if (!Array.isArray(promptKeys) || !promptKeys.length) return [];
  const inExpr = promptKeys.map((key) => safeString(key, 80)).join(",");
  const path = `prompt_profiles?select=prompt_key,version&prompt_key=in.(${inExpr})`;
  const data = await supabaseRestRequest(envConfig, accessToken, path, {
    method: "GET",
    stageLabel: "Globale Prompt-Versionen laden"
  });
  return Array.isArray(data) ? data : [];
}

async function supabaseRestRequest(envConfig, accessToken, pathWithQuery, options = {}) {
  const method = safeString(options.method, 10).toUpperCase() || "GET";
  const stageLabel = safeString(options.stageLabel, 120) || "Supabase REST";
  const prefer = safeString(options.prefer, 200);
  const body = options.body;
  const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : SUPABASE_REQUEST_TIMEOUT_MS;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = {
      apikey: envConfig.supabaseAnonKey,
      authorization: `Bearer ${accessToken}`
    };
    if (prefer) headers.prefer = prefer;
    if (body !== undefined) headers["content-type"] = "application/json";

    const response = await fetch(`${envConfig.supabaseUrl}/rest/v1/${pathWithQuery}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw {
        status: response.status,
        code: safeString(payload?.code, 80) || `HTTP_${response.status}`,
        message: safeString(payload?.message, 1_000) || response.statusText || `${stageLabel} fehlgeschlagen.`,
        details: safeString(payload?.details, 1_000),
        hint: safeString(payload?.hint, 600)
      };
    }
    return payload;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw {
        status: 504,
        code: "TIMEOUT",
        message: `${stageLabel}: Zeitlimit ueberschritten.`,
        details: `${timeoutMs}ms`
      };
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function safeString(value, maxLength) {
  if (typeof value !== "string") return "";
  if (!Number.isFinite(maxLength) || maxLength <= 0) return value;
  return value.slice(0, maxLength);
}
