const MAX_AUDIO_BASE64_LENGTH = 8_000_000;
const MAX_TRANSCRIPT_LENGTH = 500;
const OPENAI_REQUEST_TIMEOUT_MS = 30_000;
const DEFAULT_TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe";
const ALLOWED_TRANSCRIBE_MODELS = new Set(["gpt-4o-mini-transcribe", "gpt-4o-transcribe"]);

export async function onRequestPost(context) {
  try {
    const payload = await readPayload(context.request);
    if (!payload.ok) {
      return json({ error: payload.error }, 400);
    }

    const apiKey = safeLine(context.env?.OPENAI_API_KEY, 300);
    if (!apiKey) {
      return json(
        {
          error: "OPENAI_API_KEY fehlt. Bitte in Cloudflare Pages Functions als Secret setzen."
        },
        500
      );
    }

    const model = normalizeTranscribeModel(context.env?.OPENAI_TRANSCRIBE_MODEL);
    const audioBytes = base64ToUint8Array(payload.audioBase64);
    const audioMimeType = normalizeMimeType(payload.mimeType);
    const audioExtension = mimeTypeToExtension(audioMimeType);
    const audioBlob = new Blob([audioBytes], { type: audioMimeType });
    const formData = new FormData();
    formData.append("model", model);
    formData.append("language", "de");
    formData.append(
      "prompt",
      "Deutsches Arzt-Patient- oder Arzt-Arzt-Gespraech. Medizinische Begriffe korrekt transkribieren."
    );
    formData.append("file", audioBlob, `speech.${audioExtension}`);

    const response = await fetchWithTimeout(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`
        },
        body: formData
      },
      OPENAI_REQUEST_TIMEOUT_MS
    );
    const rawBody = await response.text();
    let parsed = null;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      parsed = null;
    }

    if (!response.ok) {
      return json(
        {
          error: safeParagraph(parsed?.error?.message || "OpenAI-Transkription fehlgeschlagen.", 400),
          details: safeParagraph(rawBody, 1_400)
        },
        502
      );
    }

    const transcript = safeParagraph(parsed?.text || parsed?.transcript || "", MAX_TRANSCRIPT_LENGTH);
    if (!transcript) {
      return json({ error: "Keine Sprache erkannt. Bitte erneut sprechen." }, 422);
    }

    return json({
      transcript,
      model
    });
  } catch (error) {
    console.error("voice-transcribe error", error);
    return json({ error: "Transkription fehlgeschlagen." }, 500);
  }
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

  const rawAudio = safeParagraph(body?.audioBase64, MAX_AUDIO_BASE64_LENGTH + 200);
  if (!rawAudio) {
    return { ok: false, error: "audioBase64 fehlt." };
  }
  const audioBase64 = stripDataUrl(rawAudio);
  if (!audioBase64) {
    return { ok: false, error: "audioBase64 ist leer." };
  }
  if (audioBase64.length > MAX_AUDIO_BASE64_LENGTH) {
    return { ok: false, error: "Audio ist zu gross. Bitte kuerzer sprechen (max ca. 25 Sekunden)." };
  }
  if (!isLikelyBase64(audioBase64)) {
    return { ok: false, error: "audioBase64 ist ungueltig formatiert." };
  }

  const mimeType = safeLine(body?.mimeType, 80);
  return {
    ok: true,
    audioBase64,
    mimeType
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

function base64ToUint8Array(base64Value) {
  const clean = String(base64Value || "").replace(/\s+/g, "");
  const binary = atob(clean);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

function normalizeTranscribeModel(value) {
  const candidate = safeLine(value, 80) || DEFAULT_TRANSCRIBE_MODEL;
  return ALLOWED_TRANSCRIBE_MODELS.has(candidate) ? candidate : DEFAULT_TRANSCRIBE_MODEL;
}

function normalizeMimeType(value) {
  const candidate = safeLine(value, 80).toLowerCase();
  if (candidate.startsWith("audio/webm")) return "audio/webm";
  if (candidate.startsWith("audio/ogg")) return "audio/ogg";
  if (candidate.startsWith("audio/mp4")) return "audio/mp4";
  if (candidate.startsWith("audio/mpeg")) return "audio/mpeg";
  return "audio/webm";
}

function mimeTypeToExtension(mimeType) {
  if (mimeType === "audio/ogg") return "ogg";
  if (mimeType === "audio/mp4") return "m4a";
  if (mimeType === "audio/mpeg") return "mp3";
  return "webm";
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = setTimeout(() => {
    if (!controller) return;
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller ? controller.signal : undefined
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error(`OpenAI-Transkription Timeout nach ${Math.round(timeoutMs / 1000)}s.`);
      timeoutError.code = "OPENAI_TIMEOUT";
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function safeLine(value, maxLength) {
  if (typeof value !== "string") return "";
  return value
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function safeParagraph(value, maxLength) {
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, maxLength);
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
