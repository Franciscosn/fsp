import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STORAGE_PROGRESS_KEY = "fsp_heart_progress_v1";
const STORAGE_DAILY_KEY = "fsp_heart_daily_v1";
const STORAGE_VOICE_CASE_KEY = "fsp_voice_case_v1";
const STORAGE_VOICE_CASE_SELECTION_KEY = "fsp_voice_case_selection_v1";
const DAILY_GOAL = 20;
const APP_STATE_CARD_ID = "__app_state__";
const APP_VERSION = "20260213e";
const BUILD_UPDATED_AT = "2026-02-13 18:05 UTC";
const MAX_VOICE_RECORD_MS = 25_000;
const MAX_VOICE_CASE_LENGTH = 8_000;
const MIN_VOICE_BLOB_BYTES = 450;
const VOICE_CASE_LIBRARY_PATH = "data/patientengespraeche_ai_cases_de.txt";
const VOICE_CASE_DEFAULT = "default";
const VOICE_CASE_CUSTOM = "custom";
const VOICE_CASE_LIBRARY_PREFIX = "lib:";
const DEFAULT_VOICE_CASE = [
  "CASE_ID: default_thoraxschmerz_001",
  "Rolle: Standardisierte Patientin fuer muendliche Fachsprachpruefung.",
  "Persona: 58 Jahre, Grundschullehrerin, spricht ruhig, zeitweise besorgt.",
  "",
  "Leitsymptom:",
  "- Seit gestern Abend dumpfer Druck hinter dem Brustbein.",
  "- Heute Morgen bei Treppensteigen staerker geworden.",
  "",
  "Begleitsymptome (nur bei gezielter Nachfrage offenlegen):",
  "- leichte Atemnot bei Belastung",
  "- Uebelkeit ohne Erbrechen",
  "- kalter Schweiss waehrend einer Episode",
  "- Ausstrahlung in linken Arm und Unterkiefer bei starker Episode",
  "",
  "Negativanamnese (nur bei Nachfrage):",
  "- kein Fieber",
  "- kein produktiver Husten",
  "- kein Trauma",
  "- kein stechender atemabhaengiger Schmerz",
  "",
  "Vorerkrankungen:",
  "- arterielle Hypertonie seit 10 Jahren",
  "- Dyslipidaemie",
  "- Vater hatte Herzinfarkt mit 62",
  "",
  "Medikation:",
  "- Ramipril 5 mg 1-0-0",
  "- Atorvastatin 20 mg 0-0-1",
  "",
  "Allergien:",
  "- keine bekannt",
  "",
  "Sozialanamnese:",
  "- Nichtraucherin seit 5 Jahren, davor 20 Packyears",
  "- gelegentlich Alkohol",
  "",
  "Pruefungslogik:",
  "- Bleibe als Patientin in der Rolle.",
  "- Gib Informationen schrittweise, nur auf passende Fragen.",
  "- Keine eigenstaendige Diagnose nennen, ausser explizit gefragt.",
  "- Wenn gefragt 'Was befuerchten Sie?', antworte: 'Ich habe Angst, dass es das Herz sein koennte.'"
].join("\n");

const SUPABASE_URL = "https://nitmxiasxwgwsaygumls.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_frshj6OvLDHGioVXbVwsrg_dbzyFajQ";
const supabaseReady = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const supabase = supabaseReady
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: createSupabaseStorage(),
        storageKey: "fsp_auth_v1"
      }
    })
  : null;

const SWEET_EMOJIS = ["💖", "💕", "💘", "💝", "🥰", "😍", "😘", "🫶", "🍑", "🌸", "✨"];
let emojiHideTimer = null;
let activeCelebration = null;
let remoteStateRowId = null;
let syncTimer = null;
let activeMediaRecorder = null;
let activeMediaStream = null;
let voiceChunkBuffer = [];
let voiceAutoStopTimer = null;
let shouldSendVoiceAfterStop = false;

const CATEGORY_MAP = {
  adipositas: "Gewicht",
  angina_pectoris: "Kardio/Pneumo",
  angststoerung: "Psychiatrie",
  aphasie: "Neurologie",
  arrhythmie: "Kardio/Pneumo",
  arthralgie: "Muskuloskeletal",
  depressive_episode: "Psychiatrie",
  diarrhoe: "Gastro",
  dysphagie: "Gastro",
  dyspnoe: "Kardio/Pneumo",
  dysurie: "Urologie",
  emesis: "Gastro",
  exanthem: "Dermatologie",
  exsikkose: "Infekt/Allgemein",
  fatigue: "Infekt/Allgemein",
  fieber: "Infekt/Allgemein",
  haematemesis: "Gastro",
  haematochezie: "Gastro",
  haematurie: "Urologie",
  haemoptyse: "Kardio/Pneumo",
  harnverhalt: "Urologie",
  hemiparese: "Neurologie",
  hyperglykaemie: "Diabetes",
  hyperthyreose: "Schilddruese",
  hypertonie: "Kardio/Pneumo",
  hypoglykaemie: "Diabetes",
  hypothyreose: "Schilddruese",
  kopfschmerz: "Neurologie",
  krampfanfall: "Neurologie",
  melaena: "Gastro",
  meteorismus: "Gastro",
  myalgie: "Muskuloskeletal",
  nachtschweiss: "Infekt/Allgemein",
  nausea: "Gastro",
  nykturie: "Urologie",
  obstipation: "Gastro",
  oedem: "Kardio/Pneumo",
  orthopnoe: "Kardio/Pneumo",
  palpitationen: "Kardio/Pneumo",
  paraesthesie: "Neurologie",
  pollakisurie: "Urologie",
  pruritus: "Dermatologie",
  pyrosis: "Gastro",
  schlafstoerung: "Psychiatrie",
  schuettelfrost: "Infekt/Allgemein",
  schwindel: "Neurologie",
  synkope: "Kardio/Pneumo",
  tachykardie: "Kardio/Pneumo",
  tremor: "Neurologie",
  urtikaria: "Dermatologie",
};

const MODE_LABELS = {
  patient_to_fachbegriff: "Patientensprache -> Fachbegriff",
  fachbegriff_to_patient: "Fachbegriff -> Patientensprache",
  interesting_patient: "Interessante Frage (Patientensprache)",
  interesting_fach: "Interessante Frage (Fachsprache)",
  story_text: "Klinik-Textkarte",
  differenzial_text: "Differenzialdiagnose"
};

const NEW_CARDS_PER_DAY = 12;
const REGULAR_PATTERN = [
  "unsure",
  "new",
  "one_right",
  "unsure",
  "streak_2",
  "unsure",
  "streak_3",
  "new",
  "one_right",
  "streak_4",
  "unsure",
  "streak_5",
  "streak_2",
  "streak_6"
];
const LEVEL_TITLES = [
  "Starter",
  "Kittel",
  "Namensschild",
  "Stethoskop",
  "Handschuhe",
  "Klemmbrett",
  "Praxis-Set",
  "OP-Haube",
  "Fachaerztin",
  "Diamond Doctor"
];
const LEVEL_THRESHOLDS = [0, 0.07, 0.15, 0.24, 0.34, 0.45, 0.57, 0.7, 0.84, 1];
const LEVEL_DEFINITIONS = LEVEL_TITLES.map((title, index) => ({
  level: index + 1,
  title,
  minRatio: LEVEL_THRESHOLDS[index],
  assetCandidates: buildLevelAssetCandidates(index + 1)
}));

const FOLDERS = [
  { id: "regular", label: "Ueben" },
  { id: "new", label: "Neu" },
  { id: "unsure", label: "Unsicher" },
  { id: "one_right", label: "1x richtig" },
  { id: "streak_2", label: "2x richtig" },
  { id: "streak_3", label: "3x richtig" },
  { id: "streak_4", label: "4x richtig" },
  { id: "streak_5", label: "5x richtig" },
  { id: "streak_6", label: "6x richtig" },
  { id: "diamonds", label: "7x richtig (Diamonds)" },
  { id: "all", label: "Alle Karten" }
];

const state = {
  cards: [],
  categories: [],
  selectedCategory: "all",
  selectedFolder: "regular",
  queue: [],
  currentIndex: 0,
  answered: false,
  isImmersive: false,
  revealPhase: null,
  currentChoices: [],
  currentCorrectIndex: -1,
  progress: migrateStoredProgress(loadFromStorage(STORAGE_PROGRESS_KEY, {})),
  dailyStats: loadFromStorage(STORAGE_DAILY_KEY, {}),
  user: null,
  voiceHistory: [],
  voiceBusy: false,
  voiceRecording: false,
  voiceCaseLibrary: [],
  voiceCaseIndex: -1,
  voiceCaseLibraryLoaded: false,
  voiceCaseSelection: VOICE_CASE_DEFAULT
};

const refs = {
  authPage: document.getElementById("authPage"),
  appContent: document.getElementById("appContent"),
  authStatus: document.getElementById("authStatus"),
  authForm: document.getElementById("authForm"),
  emailInput: document.getElementById("emailInput"),
  passwordInput: document.getElementById("passwordInput"),
  loginBtn: document.getElementById("loginBtn"),
  signupBtn: document.getElementById("signupBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  quickPracticeBtn: document.getElementById("quickPracticeBtn"),
  sessionText: document.getElementById("sessionText"),
  buildBadge: document.getElementById("buildBadge"),
  voicePanel: document.getElementById("voicePanel"),
  voiceCaseSelect: document.getElementById("voiceCaseSelect"),
  voiceCaseMeta: document.getElementById("voiceCaseMeta"),
  voiceCaseInput: document.getElementById("voiceCaseInput"),
  voiceRecordBtn: document.getElementById("voiceRecordBtn"),
  voiceResetBtn: document.getElementById("voiceResetBtn"),
  voiceNextCaseBtn: document.getElementById("voiceNextCaseBtn"),
  voiceStatus: document.getElementById("voiceStatus"),
  voiceReplyAudio: document.getElementById("voiceReplyAudio"),
  voiceLastTurn: document.getElementById("voiceLastTurn"),
  voiceUserTranscript: document.getElementById("voiceUserTranscript"),
  voiceAssistantReply: document.getElementById("voiceAssistantReply"),
  voiceCoachHint: document.getElementById("voiceCoachHint"),
  authPortrait: document.getElementById("authPortrait"),
  levelAvatar: document.getElementById("levelAvatar"),
  levelBadge: document.getElementById("levelBadge"),
  levelTitle: document.getElementById("levelTitle"),
  levelProgressText: document.getElementById("levelProgressText"),
  levelFill: document.getElementById("levelFill"),
  categoryFilters: document.getElementById("categoryFilters"),
  folderFilters: document.getElementById("folderFilters"),
  queueInfo: document.getElementById("queueInfo"),
  exitImmersiveBtn: document.getElementById("exitImmersiveBtn"),
  quizPanel: document.getElementById("quizPanel"),
  progressText: document.getElementById("progressText"),
  cardBox: document.getElementById("cardBox"),
  emptyState: document.getElementById("emptyState"),
  cardMode: document.getElementById("cardMode"),
  cardCategory: document.getElementById("cardCategory"),
  questionText: document.getElementById("questionText"),
  choices: document.getElementById("choices"),
  feedbackBox: document.getElementById("feedbackBox"),
  resultText: document.getElementById("resultText"),
  explanationText: document.getElementById("explanationText"),
  translationText: document.getElementById("translationText"),
  nextBtn: document.getElementById("nextBtn"),
  shuffleBtn: document.getElementById("shuffleBtn"),
  toggleStatsBtn: document.getElementById("toggleStatsBtn"),
  closeStatsBtn: document.getElementById("closeStatsBtn"),
  statsOverlay: document.getElementById("statsOverlay"),
  statsBackdrop: document.getElementById("statsBackdrop"),
  todayAttempts: document.getElementById("todayAttempts"),
  todayCorrect: document.getElementById("todayCorrect"),
  todayWrong: document.getElementById("todayWrong"),
  todayRate: document.getElementById("todayRate"),
  weekChart: document.getElementById("weekChart"),
  kpiGoal: document.getElementById("kpiGoal"),
  kpiStreak: document.getElementById("kpiStreak"),
  kpiAccuracy: document.getElementById("kpiAccuracy")
};

wireEvents();
init();

function wireEvents() {
  refs.authForm.addEventListener("submit", handleLoginSubmit);
  refs.signupBtn.addEventListener("click", handleSignup);
  refs.logoutBtn.addEventListener("click", handleLogout);
  refs.quickPracticeBtn.addEventListener("click", startQuickPractice);
  refs.levelAvatar.addEventListener("error", handleLevelAvatarError);
  refs.voiceRecordBtn.addEventListener("click", handleVoiceRecordToggle);
  refs.voiceResetBtn.addEventListener("click", handleVoiceReset);
  refs.voiceNextCaseBtn?.addEventListener("click", () => {
    void handleVoiceNextCase();
  });
  refs.voiceCaseSelect?.addEventListener("change", handleVoiceCaseSelectionChange);
  refs.voiceCaseInput.addEventListener("input", handleVoiceCaseInput);

  refs.nextBtn.addEventListener("click", nextCard);
  refs.shuffleBtn.addEventListener("click", () => rebuildQueue(true));
  refs.exitImmersiveBtn.addEventListener("click", exitImmersiveMode);

  refs.toggleStatsBtn.addEventListener("click", () => {
    if (refs.statsOverlay.classList.contains("hidden")) {
      openStatsOverlay();
      return;
    }
    closeStatsOverlay();
  });
  refs.closeStatsBtn.addEventListener("click", closeStatsOverlay);
  refs.statsBackdrop.addEventListener("click", closeStatsOverlay);

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeStatsOverlay();
    }
  });
}

async function init() {
  renderBuildBadge();
  initAuthUi();
  initAuthPortrait();
  initVoiceUi();
  try {
    const url = new URL(`../data/cards.json?v=${APP_VERSION}`, import.meta.url);
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Konnte Kartendaten nicht laden.");
    }

    const deck = await response.json();
    state.cards = flattenCards(deck);
    state.categories = buildCategories(state.cards);

    renderCategoryFilters();
    renderFolderFilters();
    rebuildQueue(false);
    renderStats();
    await initSupabaseSession();
  } catch (error) {
    refs.emptyState.classList.remove("hidden");
    refs.cardBox.classList.add("hidden");
    refs.emptyState.innerHTML =
      "<p>Karten konnten nicht geladen werden. Bitte die Seite ueber einen lokalen Webserver oeffnen.</p>";
    console.error(error);
  }
}

function renderBuildBadge() {
  if (!refs.buildBadge) return;

  const currentUrl = new URL(window.location.href);
  const hasVersionHint = currentUrl.searchParams.get("v") || "";
  const hint = hasVersionHint ? ` | URL-v=${hasVersionHint}` : "";
  refs.buildBadge.textContent = `Version ${APP_VERSION} | Stand ${BUILD_UPDATED_AT}${hint}`;
}

function initAuthUi() {
  document.body.classList.add("auth-only");
  refs.authPage.classList.remove("hidden");
  refs.appContent.classList.add("hidden");
  refs.toggleStatsBtn.classList.add("hidden");
  closeStatsOverlay();

  if (supabaseReady) {
    refs.authStatus.textContent = "Nicht eingeloggt";
    return;
  }
  refs.authStatus.textContent =
    "Supabase ist noch nicht verbunden (Login deaktiviert, nur lokale Speicherung)";
  refs.authForm.classList.add("hidden");
}

function initAuthPortrait() {
  const portrait = refs.authPortrait;
  if (!portrait) return;

  const preferredPath = "assets/hermine-heusler-edenhuizen.jpg";
  const fallbackPath = "assets/kat-photo.jpg";
  const probe = new Image();

  probe.onload = () => {
    portrait.src = preferredPath;
  };
  probe.onerror = () => {
    portrait.src = fallbackPath;
  };
  probe.src = preferredPath;
}

function initVoiceUi() {
  const stored = loadFromStorage(STORAGE_VOICE_CASE_KEY, { caseText: "" });
  if (typeof stored.caseText === "string" && stored.caseText) {
    refs.voiceCaseInput.value = stored.caseText.slice(0, MAX_VOICE_CASE_LENGTH);
  }
  const storedSelection = loadFromStorage(STORAGE_VOICE_CASE_SELECTION_KEY, {
    selection: VOICE_CASE_DEFAULT
  });
  if (typeof storedSelection.selection === "string" && storedSelection.selection) {
    state.voiceCaseSelection = storedSelection.selection;
  }
  renderVoiceCaseSelect();
  applyVoiceCaseSelection(state.voiceCaseSelection, { preserveStatus: true, resetConversation: false });
  void ensureVoiceCaseLibraryLoaded();

  if (!isVoiceCaptureSupported()) {
    refs.voiceRecordBtn.disabled = true;
    setVoiceStatus(
      "Mikrofon-Aufnahme wird auf diesem Geraet/Browser nicht unterstuetzt. Bitte Desktop-Chrome oder aktuelles Safari nutzen.",
      true
    );
    return;
  }

  setVoiceStatus(`${getVoiceCaseStatusLabel()} aktiv. Du kannst jetzt aufnehmen.`);
}

function handleVoiceCaseInput() {
  const normalized = refs.voiceCaseInput.value.slice(0, MAX_VOICE_CASE_LENGTH);
  if (normalized !== refs.voiceCaseInput.value) {
    refs.voiceCaseInput.value = normalized;
  }
  saveToStorage(STORAGE_VOICE_CASE_KEY, { caseText: refs.voiceCaseInput.value });
}

function handleVoiceCaseSelectionChange() {
  if (!refs.voiceCaseSelect) return;
  applyVoiceCaseSelection(refs.voiceCaseSelect.value, { preserveStatus: false, resetConversation: true });
}

async function handleVoiceRecordToggle() {
  if (state.voiceBusy) return;
  if (state.voiceRecording) {
    stopVoiceRecording(true, "manual-stop");
    return;
  }
  await startVoiceRecording();
}

function handleVoiceReset() {
  resetVoiceConversation({ keepCaseText: true, preserveStatus: false });
}

async function handleVoiceNextCase() {
  const loaded = await ensureVoiceCaseLibraryLoaded();
  if (!loaded || state.voiceCaseLibrary.length === 0) {
    setVoiceStatus("Fallbibliothek konnte nicht geladen werden. Bitte spaeter erneut versuchen.", true);
    return;
  }

  const currentSelection = getActiveVoiceCaseSelection();
  const currentIndex = state.voiceCaseLibrary.findIndex(
    (entry) => `${VOICE_CASE_LIBRARY_PREFIX}${entry.id}` === currentSelection
  );
  const nextIndex = (currentIndex + 1) % state.voiceCaseLibrary.length;
  const nextEntry = state.voiceCaseLibrary[nextIndex];
  if (!nextEntry || !nextEntry.id) {
    setVoiceStatus("Ausgewaehlter Fall ist leer. Bitte erneut versuchen.", true);
    return;
  }

  const nextSelection = `${VOICE_CASE_LIBRARY_PREFIX}${nextEntry.id}`;
  applyVoiceCaseSelection(nextSelection, { preserveStatus: false, resetConversation: true });
}

function renderVoiceCaseSelect() {
  if (!refs.voiceCaseSelect) return;

  const currentSelection = getActiveVoiceCaseSelection();
  refs.voiceCaseSelect.innerHTML = "";

  addVoiceCaseOption(VOICE_CASE_DEFAULT, "Interner Standardfall");
  addVoiceCaseOption(VOICE_CASE_CUSTOM, "Eigener Text (unten)");

  for (const [index, entry] of state.voiceCaseLibrary.entries()) {
    const label = entry?.label || `Fall ${index + 1}`;
    addVoiceCaseOption(`${VOICE_CASE_LIBRARY_PREFIX}${entry.id}`, label);
  }

  if (isValidVoiceCaseSelection(currentSelection)) {
    refs.voiceCaseSelect.value = currentSelection;
  } else {
    refs.voiceCaseSelect.value = VOICE_CASE_DEFAULT;
  }
}

function addVoiceCaseOption(value, label) {
  if (!refs.voiceCaseSelect) return;
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  refs.voiceCaseSelect.appendChild(option);
}

function getActiveVoiceCaseSelection() {
  if (refs.voiceCaseSelect && refs.voiceCaseSelect.value) {
    return refs.voiceCaseSelect.value;
  }
  if (typeof state.voiceCaseSelection === "string" && state.voiceCaseSelection) {
    return state.voiceCaseSelection;
  }
  return VOICE_CASE_DEFAULT;
}

function isValidVoiceCaseSelection(selection) {
  if (selection === VOICE_CASE_DEFAULT || selection === VOICE_CASE_CUSTOM) {
    return true;
  }
  if (!selection.startsWith(VOICE_CASE_LIBRARY_PREFIX)) {
    return false;
  }
  if (!state.voiceCaseLibraryLoaded) {
    return true;
  }
  return state.voiceCaseLibrary.some((entry) => `${VOICE_CASE_LIBRARY_PREFIX}${entry.id}` === selection);
}

function applyVoiceCaseSelection(selection, options = {}) {
  const preserveStatus = Boolean(options.preserveStatus);
  const resetConversation = options.resetConversation !== false;

  const normalizedSelection = isValidVoiceCaseSelection(selection)
    ? selection
    : VOICE_CASE_DEFAULT;
  state.voiceCaseSelection = normalizedSelection;

  if (refs.voiceCaseSelect && refs.voiceCaseSelect.value !== normalizedSelection) {
    refs.voiceCaseSelect.value = normalizedSelection;
  }

  saveToStorage(STORAGE_VOICE_CASE_SELECTION_KEY, { selection: normalizedSelection });

  const customMode = normalizedSelection === VOICE_CASE_CUSTOM;
  refs.voiceCaseInput.disabled = !customMode;
  if (!customMode) {
    refs.voiceCaseInput.placeholder =
      "Nicht aktiv. Dieser Text wird erst genutzt, wenn 'Eigener Text (unten)' ausgewaehlt ist.";
  } else {
    refs.voiceCaseInput.placeholder =
      "Nur genutzt, wenn bei Fallauswahl 'Eigener Text (unten)' gewaehlt ist.";
  }

  if (normalizedSelection.startsWith(VOICE_CASE_LIBRARY_PREFIX)) {
    const selectedId = normalizedSelection.slice(VOICE_CASE_LIBRARY_PREFIX.length);
    state.voiceCaseIndex = state.voiceCaseLibrary.findIndex((entry) => entry.id === selectedId);
  } else {
    state.voiceCaseIndex = -1;
  }

  updateVoiceCaseMeta();
  if (resetConversation) {
    resetVoiceConversation({ keepCaseText: true, preserveStatus: true });
  }

  if (!preserveStatus) {
    setVoiceStatus(`${getVoiceCaseStatusLabel()} aktiv. Du kannst jetzt aufnehmen.`);
  }
}

function updateVoiceCaseMeta() {
  if (!refs.voiceCaseMeta) return;
  refs.voiceCaseMeta.textContent = `Aktiv: ${getVoiceCaseStatusLabel()}`;
}

function getVoiceCaseStatusLabel() {
  const selection = getActiveVoiceCaseSelection();
  if (selection === VOICE_CASE_CUSTOM) {
    return "Eigener Text";
  }
  if (selection === VOICE_CASE_DEFAULT) {
    return "Interner Standardfall";
  }

  const selectedId = selection.slice(VOICE_CASE_LIBRARY_PREFIX.length);
  const entry = state.voiceCaseLibrary.find((item) => item.id === selectedId);
  if (!entry) {
    if (!state.voiceCaseLibraryLoaded) {
      return "Fallbibliothek wird geladen";
    }
    return "Interner Standardfall";
  }
  return entry.label;
}

async function startVoiceRecording() {
  if (!isVoiceCaptureSupported()) {
    setVoiceStatus("Mikrofon-Aufnahme ist hier leider nicht verfuegbar.", true);
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = pickRecordingMimeType();
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);

    activeMediaRecorder = recorder;
    activeMediaStream = stream;
    voiceChunkBuffer = [];
    shouldSendVoiceAfterStop = true;

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        voiceChunkBuffer.push(event.data);
      }
    };

    recorder.onerror = () => {
      setVoiceStatus("Aufnahmefehler. Bitte erneut versuchen.", true);
      cleanupVoiceMedia();
      state.voiceRecording = false;
      updateVoiceRecordButton();
    };

    recorder.onstop = () => {
      const sendAfterStop = shouldSendVoiceAfterStop;
      shouldSendVoiceAfterStop = false;
      const finalMimeType = recorder.mimeType || mimeType || "audio/webm";
      cleanupVoiceMedia();
      void finalizeVoiceRecording(sendAfterStop, finalMimeType);
    };

    recorder.start(250);
    state.voiceRecording = true;
    updateVoiceRecordButton();
    setVoiceStatus("Aufnahme laeuft ... tippe erneut, um zu stoppen und an die KI zu senden.");

    if (voiceAutoStopTimer) {
      window.clearTimeout(voiceAutoStopTimer);
    }
    voiceAutoStopTimer = window.setTimeout(() => {
      if (!state.voiceRecording) return;
      stopVoiceRecording(true, "auto-stop");
    }, MAX_VOICE_RECORD_MS);
  } catch (error) {
    setVoiceStatus(
      "Mikrofon konnte nicht gestartet werden. Bitte Browser-Berechtigung pruefen.",
      true
    );
    cleanupVoiceMedia();
    state.voiceRecording = false;
    updateVoiceRecordButton();
    console.error(error);
  }
}

function stopVoiceRecording(sendToAi, reason) {
  shouldSendVoiceAfterStop = Boolean(sendToAi);
  state.voiceRecording = false;
  updateVoiceRecordButton();

  if (voiceAutoStopTimer) {
    window.clearTimeout(voiceAutoStopTimer);
    voiceAutoStopTimer = null;
  }

  if (reason === "auto-stop") {
    setVoiceStatus("Maximale Aufnahmedauer erreicht. Audio wird jetzt verarbeitet ...");
  } else if (sendToAi) {
    setVoiceStatus("Verarbeite Aufnahme ...");
  } else {
    setVoiceStatus("Aufnahme verworfen.");
  }

  if (!activeMediaRecorder) {
    cleanupVoiceMedia();
    return;
  }

  if (activeMediaRecorder.state !== "inactive") {
    activeMediaRecorder.stop();
  } else {
    cleanupVoiceMedia();
  }
}

async function finalizeVoiceRecording(sendToAi, mimeType) {
  const chunks = [...voiceChunkBuffer];
  voiceChunkBuffer = [];
  if (!sendToAi) {
    return;
  }

  if (!chunks.length) {
    setVoiceStatus("Es wurde kein Audio erkannt. Bitte erneut sprechen.", true);
    return;
  }

  const blob = new Blob(chunks, { type: mimeType || "audio/webm" });
  if (blob.size < MIN_VOICE_BLOB_BYTES) {
    setVoiceStatus("Audio war zu kurz. Bitte etwas laenger sprechen.", true);
    return;
  }

  try {
    setVoiceBusy(true);
    setVoiceStatus("Transkribiere und simuliere Patientenantwort ...");
    const audioBase64 = await blobToBase64(blob);
    await runVoiceTurn(audioBase64);
  } catch (error) {
    setVoiceStatus("Voice-Turn fehlgeschlagen. Bitte erneut versuchen.", true);
    console.error(error);
  } finally {
    setVoiceBusy(false);
  }
}

async function runVoiceTurn(audioBase64) {
  const caseText = getActiveVoiceCaseText();

  const response = await fetch("/api/voice-turn", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      audioBase64,
      caseText,
      history: state.voiceHistory,
      preferLocalTts: canUseLocalGermanTts()
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "API Fehler");
  }

  const transcript = typeof payload.transcript === "string" ? payload.transcript.trim() : "";
  const patientReply = typeof payload.patientReply === "string" ? payload.patientReply.trim() : "";
  const offTopic = Boolean(payload.offTopic);

  if (Array.isArray(payload.history)) {
    state.voiceHistory = payload.history.slice(-8);
  } else if (transcript || patientReply) {
    state.voiceHistory = [...state.voiceHistory, { user: transcript, assistant: patientReply }].slice(-8);
  }

  refs.voiceUserTranscript.textContent = transcript || "Keine Transkription.";
  refs.voiceAssistantReply.textContent = patientReply || "Keine Antwort erhalten.";
  refs.voiceLastTurn.classList.remove("hidden");

  // Keep only the patient role visible in v1 voice practice.
  refs.voiceCoachHint.textContent = "";
  refs.voiceCoachHint.classList.add("hidden");

  const localTtsStarted = speakWithLocalGermanVoice(patientReply);
  if (localTtsStarted) {
    refs.voiceReplyAudio.pause();
    refs.voiceReplyAudio.removeAttribute("src");
    refs.voiceReplyAudio.classList.add("hidden");
  } else {
    const audioSrc = buildReplyAudioSrc(payload.replyAudioBase64);
    if (audioSrc) {
      refs.voiceReplyAudio.src = audioSrc;
      refs.voiceReplyAudio.classList.remove("hidden");
      try {
        await refs.voiceReplyAudio.play();
      } catch {
        // autoplay may be blocked; controls are visible as fallback.
      }
    } else {
      refs.voiceReplyAudio.removeAttribute("src");
      refs.voiceReplyAudio.classList.add("hidden");
    }
  }

  if (offTopic) {
    setVoiceStatus("Antwort da. Hinweis: Die letzte Frage war teilweise off-topic.");
    return;
  }
  if (localTtsStarted) {
    setVoiceStatus("Antwort da. Wiedergabe mit lokaler deutscher Stimme. Du kannst direkt weiterfragen.");
    return;
  }
  setVoiceStatus("Antwort da. Du kannst direkt die naechste Frage aufnehmen.");
}

function resetVoiceConversation(options = {}) {
  const keepCaseText = Boolean(options.keepCaseText);
  const preserveStatus = Boolean(options.preserveStatus);

  state.voiceHistory = [];
  setVoiceBusy(false);

  if (state.voiceRecording) {
    stopVoiceRecording(false, "reset");
  } else {
    cleanupVoiceMedia();
  }
  state.voiceRecording = false;
  updateVoiceRecordButton();

  refs.voiceLastTurn.classList.add("hidden");
  refs.voiceUserTranscript.textContent = "";
  refs.voiceAssistantReply.textContent = "";
  refs.voiceCoachHint.textContent = "";
  refs.voiceCoachHint.classList.add("hidden");
  refs.voiceReplyAudio.pause();
  refs.voiceReplyAudio.removeAttribute("src");
  refs.voiceReplyAudio.classList.add("hidden");

  if (!keepCaseText) {
    refs.voiceCaseInput.value = "";
    saveToStorage(STORAGE_VOICE_CASE_KEY, { caseText: "" });
  }

  if (!preserveStatus) {
    setVoiceStatus(`${getVoiceCaseStatusLabel()} aktiv. Du kannst jetzt aufnehmen.`);
  }
}

function setVoiceBusy(isBusy) {
  state.voiceBusy = Boolean(isBusy);
  refs.voiceResetBtn.disabled = state.voiceBusy;
  if (refs.voiceCaseSelect) {
    refs.voiceCaseSelect.disabled = state.voiceBusy;
  }
  if (refs.voiceNextCaseBtn) {
    refs.voiceNextCaseBtn.disabled = state.voiceBusy;
  }
  refs.voiceRecordBtn.disabled = state.voiceBusy || !isVoiceCaptureSupported();
}

function setVoiceStatus(message, isError = false) {
  refs.voiceStatus.textContent = message;
  refs.voiceStatus.classList.toggle("error", Boolean(isError));
}

function updateVoiceRecordButton() {
  refs.voiceRecordBtn.textContent = state.voiceRecording
    ? "⏹ Aufnahme stoppen"
    : "🎤 Aufnahme starten";
  refs.voiceRecordBtn.classList.toggle("recording", state.voiceRecording);
}

function cleanupVoiceMedia() {
  if (voiceAutoStopTimer) {
    window.clearTimeout(voiceAutoStopTimer);
    voiceAutoStopTimer = null;
  }
  if (activeMediaStream) {
    for (const track of activeMediaStream.getTracks()) {
      track.stop();
    }
    activeMediaStream = null;
  }
  activeMediaRecorder = null;
}

function pickRecordingMimeType() {
  if (!window.MediaRecorder || typeof window.MediaRecorder.isTypeSupported !== "function") {
    return "";
  }
  const supported = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg"
  ];
  return supported.find((type) => window.MediaRecorder.isTypeSupported(type)) || "";
}

function isVoiceCaptureSupported() {
  return Boolean(
    window.MediaRecorder &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function"
  );
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Audio konnte nicht gelesen werden."));
    reader.onloadend = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const commaIndex = result.indexOf(",");
      if (commaIndex < 0) {
        reject(new Error("Ungueltiges Audio-Format."));
        return;
      }
      resolve(result.slice(commaIndex + 1));
    };
    reader.readAsDataURL(blob);
  });
}

function buildReplyAudioSrc(audioBase64) {
  if (typeof audioBase64 !== "string" || !audioBase64.trim()) return "";
  if (audioBase64.startsWith("data:audio")) {
    return audioBase64;
  }
  return `data:audio/wav;base64,${audioBase64}`;
}

function canUseLocalGermanTts() {
  if (!("speechSynthesis" in window) || typeof window.SpeechSynthesisUtterance === "undefined") {
    return false;
  }
  const voices = window.speechSynthesis.getVoices();
  return voices.some((voice) => String(voice.lang || "").toLowerCase().startsWith("de"));
}

function speakWithLocalGermanVoice(text) {
  if (!text || !canUseLocalGermanTts()) {
    return false;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickBestGermanVoice(window.speechSynthesis.getVoices());
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || "de-DE";
    } else {
      utterance.lang = "de-DE";
    }
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (error) {
    console.warn("Lokale Sprachausgabe fehlgeschlagen", error);
    return false;
  }
}

function pickBestGermanVoice(voices) {
  if (!Array.isArray(voices) || voices.length === 0) return null;
  const german = voices.filter((voice) =>
    String(voice.lang || "").toLowerCase().startsWith("de")
  );
  if (!german.length) return null;

  const exactDe = german.find((voice) => String(voice.lang || "").toLowerCase() === "de-de");
  if (exactDe) return exactDe;

  const likelyNative = german.find((voice) => {
    const name = String(voice.name || "").toLowerCase();
    return name.includes("deutsch") || name.includes("german");
  });
  if (likelyNative) return likelyNative;

  return german[0];
}

function getActiveVoiceCaseText() {
  const selection = getActiveVoiceCaseSelection();

  if (selection === VOICE_CASE_CUSTOM) {
    const userCaseText = refs.voiceCaseInput.value.trim().slice(0, MAX_VOICE_CASE_LENGTH);
    if (userCaseText) {
      return userCaseText;
    }
    return DEFAULT_VOICE_CASE;
  }

  if (selection.startsWith(VOICE_CASE_LIBRARY_PREFIX)) {
    const selectedId = selection.slice(VOICE_CASE_LIBRARY_PREFIX.length);
    const entry = state.voiceCaseLibrary.find((item) => item.id === selectedId);
    if (entry?.text) {
      return entry.text;
    }
  }

  return DEFAULT_VOICE_CASE;
}

async function ensureVoiceCaseLibraryLoaded() {
  if (state.voiceCaseLibraryLoaded) {
    return true;
  }

  try {
    const url = new URL(`../${VOICE_CASE_LIBRARY_PATH}?v=${APP_VERSION}`, import.meta.url);
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("voice-case-library-fetch-failed");
    }

    const raw = await response.text();
    state.voiceCaseLibrary = parseVoiceCaseLibrary(raw);
    state.voiceCaseLibraryLoaded = true;
    renderVoiceCaseSelect();
    applyVoiceCaseSelection(state.voiceCaseSelection, {
      preserveStatus: true,
      resetConversation: false
    });
    return true;
  } catch (error) {
    console.warn("Fallbibliothek konnte nicht geladen werden", error);
    state.voiceCaseLibrary = [];
    state.voiceCaseLibraryLoaded = false;
    renderVoiceCaseSelect();
    applyVoiceCaseSelection(state.voiceCaseSelection, {
      preserveStatus: true,
      resetConversation: false
    });
    return false;
  }
}

function parseVoiceCaseLibrary(rawText) {
  if (typeof rawText !== "string" || !rawText.trim()) {
    return [];
  }
  return rawText
    .split(/\r?\n---+\r?\n/g)
    .map((block) => block.trim())
    .filter((block) => block.startsWith("CASE_ID:"))
    .map((block, index) => {
      const caseId = extractCaseId(block) || `case_${index + 1}`;
      return {
        id: caseId,
        label: buildVoiceCaseLabel(caseId, block, index),
        text: block
      };
    });
}

function extractCaseId(blockText) {
  if (typeof blockText !== "string") return "";
  const match = blockText.match(/^CASE_ID:\s*(.+)$/m);
  return match ? match[1].trim() : "";
}

function buildVoiceCaseLabel(caseId, blockText, index) {
  const idLabel = caseId.replace(/_/g, " ").trim();
  const symptomMatch = blockText.match(/^- (.+)$/m);
  const symptom = symptomMatch ? symptomMatch[1].trim() : "";
  const shortSymptom = symptom ? ` - ${symptom.slice(0, 52)}` : "";
  return `${index + 1}. ${idLabel}${shortSymptom}`;
}

async function initSupabaseSession() {
  if (!supabase) return;
  const {
    data: { session }
  } = await supabase.auth.getSession();
  await applySession(session);

  supabase.auth.onAuthStateChange(async (_event, newSession) => {
    await applySession(newSession);
  });
}

async function applySession(session) {
  const user = session?.user || null;
  state.user = user;
  if (!user) {
    resetVoiceConversation({ keepCaseText: true, preserveStatus: false });
    remoteStateRowId = null;
    exitImmersiveMode();
    closeStatsOverlay();
  }
  updateAuthUi();
  if (!user) return;
  await pullRemoteState();
}

function updateAuthUi() {
  if (!supabaseReady) {
    document.body.classList.add("auth-only");
    refs.authPage.classList.remove("hidden");
    refs.appContent.classList.add("hidden");
    refs.toggleStatsBtn.classList.add("hidden");
    return;
  }

  if (!state.user) {
    document.body.classList.add("auth-only");
    refs.authStatus.textContent = "Nicht eingeloggt";
    refs.authPage.classList.remove("hidden");
    refs.appContent.classList.add("hidden");
    refs.toggleStatsBtn.classList.add("hidden");
    closeStatsOverlay();
    return;
  }

  document.body.classList.remove("auth-only");
  refs.authStatus.textContent = `Eingeloggt als ${state.user.email}`;
  refs.sessionText.textContent = `Eingeloggt als ${state.user.email}`;
  refs.authPage.classList.add("hidden");
  refs.appContent.classList.remove("hidden");
  refs.toggleStatsBtn.classList.remove("hidden");
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  if (!supabase) return;
  const email = refs.emailInput.value.trim();
  const password = refs.passwordInput.value;
  if (!email || !password) return;
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      refs.authStatus.textContent = `Login fehlgeschlagen: ${error.message}`;
      return;
    }

    refs.emailInput.value = "";
    refs.passwordInput.value = "";
  } catch (networkError) {
    refs.authStatus.textContent =
      "Login fehlgeschlagen: Netzwerkproblem. Bitte Supabase-URL/Key und Internet pruefen.";
    console.error(networkError);
  }
}

async function handleSignup() {
  if (!supabase) return;
  const email = refs.emailInput.value.trim();
  const password = refs.passwordInput.value;
  if (!email || !password) {
    refs.authStatus.textContent = "Bitte E-Mail und Passwort eingeben.";
    return;
  }

  try {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      refs.authStatus.textContent = `Registrierung fehlgeschlagen: ${error.message}`;
      return;
    }

    refs.authStatus.textContent = "Registrierung erfolgreich. Du bist nun eingeloggt.";
    refs.emailInput.value = "";
    refs.passwordInput.value = "";
  } catch (networkError) {
    refs.authStatus.textContent =
      "Registrierung fehlgeschlagen: Netzwerkproblem. Bitte Supabase-URL/Key und Internet pruefen.";
    console.error(networkError);
  }
}

async function handleLogout() {
  if (!supabase) return;
  await supabase.auth.signOut();
  exitImmersiveMode();
  closeStatsOverlay();
  refs.authStatus.textContent = "Ausgeloggt";
}

function startQuickPractice() {
  state.selectedFolder = "regular";
  renderFolderFilters();
  enterImmersiveMode();
}

function flattenCards(deck) {
  const cards = [];
  for (const term of deck.terms || []) {
    const category = CATEGORY_MAP[term.termId] || "Allgemein";
    for (const card of term.cards || []) {
      cards.push({
        ...card,
        termId: term.termId,
        fachbegriff: term.fachbegriff,
        patientensprache: term.patientensprache,
        category
      });
    }
  }
  return cards;
}

function buildCategories(cards) {
  const unique = new Set(cards.map((card) => card.category));
  return ["all", ...Array.from(unique).sort()];
}

function renderCategoryFilters() {
  refs.categoryFilters.innerHTML = "";
  for (const category of state.categories) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chip ${state.selectedCategory === category ? "active" : ""}`;
    button.textContent = category === "all" ? "Alle" : category;
    button.addEventListener("click", () => {
      state.selectedCategory = category;
      state.currentIndex = 0;
      renderCategoryFilters();
      renderFolderFilters();
      rebuildQueue(false);
    });
    refs.categoryFilters.appendChild(button);
  }
}

function renderFolderFilters() {
  refs.folderFilters.innerHTML = "";
  for (const folder of FOLDERS) {
    const count = getFilteredCards(folder.id).length;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `folder ${state.selectedFolder === folder.id ? "active" : ""}`;
    button.innerHTML = `<span class="folder-title">${folder.label}</span><span class="folder-count">${count} Karten</span>`;
    button.addEventListener("click", () => {
      state.selectedFolder = folder.id;
      state.currentIndex = 0;
      renderFolderFilters();
      rebuildQueue(false);
    });
    refs.folderFilters.appendChild(button);
  }
}

function rebuildQueue(isManualShuffle) {
  state.queue = getFilteredCards(state.selectedFolder);
  if (isManualShuffle) {
    shuffleInPlace(state.queue);
  }
  state.currentIndex = 0;
  state.answered = false;
  renderQueueInfo();
  updateStartButtonState();
  if (state.isImmersive) {
    renderCard();
  }
}

function getFilteredCards(folderId) {
  const byCategory = state.cards.filter((card) => {
    if (state.selectedCategory === "all") {
      return true;
    }
    return card.category === state.selectedCategory;
  });

  if (folderId === "regular") {
    return buildRegularQueue(byCategory);
  }

  return byCategory.filter((card) => cardInFolder(card, folderId));
}

function cardInFolder(card, folderId) {
  const progress = getProgress(card.cardId);
  const streak = progress.streak || 0;
  const introduced = Boolean(progress.introduced);
  const isDiamond = streak >= 7;
  const wasLastWrong = progress.lastResult === false;
  const wasLastRight = progress.lastResult === true;

  if (folderId === "all") return true;
  if (folderId === "diamonds") return isDiamond;
  if (folderId === "new") return !introduced;
  if (folderId === "one_right") return !isDiamond && introduced && wasLastRight && streak === 1;
  if (folderId === "unsure") return !isDiamond && introduced && wasLastWrong;
  if (folderId === "streak_2") return !isDiamond && introduced && wasLastRight && streak === 2;
  if (folderId === "streak_3") return !isDiamond && introduced && wasLastRight && streak === 3;
  if (folderId === "streak_4") return !isDiamond && introduced && wasLastRight && streak === 4;
  if (folderId === "streak_5") return !isDiamond && introduced && wasLastRight && streak === 5;
  if (folderId === "streak_6") return !isDiamond && introduced && wasLastRight && streak === 6;
  return true;
}

function buildRegularQueue(cards) {
  const buckets = {
    new: [],
    one_right: [],
    unsure: [],
    streak_2: [],
    streak_3: [],
    streak_4: [],
    streak_5: [],
    streak_6: []
  };

  for (const card of cards) {
    const progress = getProgress(card.cardId);
    const streak = progress.streak || 0;
    const introduced = Boolean(progress.introduced);
    const isDiamond = streak >= 7;
    if (isDiamond) continue;

    if (!introduced) {
      buckets.new.push(card);
      continue;
    }

    if (progress.lastResult === false) {
      buckets.unsure.push(card);
      continue;
    }

    if (streak === 1) buckets.one_right.push(card);
    else if (streak === 2) buckets.streak_2.push(card);
    else if (streak === 3) buckets.streak_3.push(card);
    else if (streak === 4) buckets.streak_4.push(card);
    else if (streak === 5) buckets.streak_5.push(card);
    else if (streak === 6) buckets.streak_6.push(card);
    else buckets.unsure.push(card);
  }

  shuffleInPlace(buckets.new);
  shuffleInPlace(buckets.one_right);
  shuffleInPlace(buckets.unsure);
  shuffleInPlace(buckets.streak_2);
  shuffleInPlace(buckets.streak_3);
  shuffleInPlace(buckets.streak_4);
  shuffleInPlace(buckets.streak_5);
  shuffleInPlace(buckets.streak_6);

  const remainingNewSlots = getRemainingNewSlotsToday();
  if (buckets.new.length > remainingNewSlots) {
    buckets.new = buckets.new.slice(0, remainingNewSlots);
  }

  const queue = [];
  while (true) {
    let added = false;
    for (const bucketId of REGULAR_PATTERN) {
      const bucket = buckets[bucketId];
      if (!bucket || bucket.length === 0) continue;
      queue.push(bucket.pop());
      added = true;
    }
    if (!added) break;
  }

  return queue;
}

function renderQueueInfo() {
  const label = FOLDERS.find((folder) => folder.id === state.selectedFolder)?.label || "Ordner";
  const categoryLabel = state.selectedCategory === "all" ? "Alle Kategorien" : state.selectedCategory;
  if (state.selectedFolder === "regular") {
    refs.queueInfo.textContent = `${label}: ${state.queue.length} Karte(n) in ${categoryLabel} | Neue heute frei: ${getRemainingNewSlotsToday()}`;
    return;
  }
  refs.queueInfo.textContent = `${label}: ${state.queue.length} Karte(n) in ${categoryLabel}`;
}

function updateStartButtonState() {
  // Intentional no-op: practice starts via the dedicated "Üben" action.
}

function enterImmersiveMode() {
  state.isImmersive = true;
  document.body.classList.add("immersive");
  refs.quizPanel.classList.remove("hidden");
  rebuildQueue(false);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function exitImmersiveMode() {
  state.isImmersive = false;
  document.body.classList.remove("immersive");
  refs.quizPanel.classList.add("hidden");
}

function renderCard() {
  const card = state.queue[state.currentIndex];
  refs.progressText.textContent = `Karte ${state.queue.length === 0 ? 0 : state.currentIndex + 1} von ${state.queue.length}`;

  if (!card) {
    refs.cardBox.classList.add("hidden");
    refs.emptyState.classList.remove("hidden");
    refs.feedbackBox.classList.add("hidden");
    refs.questionText.classList.remove("story-text", "differential-answer");
    state.revealPhase = null;
    state.currentChoices = [];
    state.currentCorrectIndex = -1;
    return;
  }

  refs.emptyState.classList.add("hidden");
  refs.cardBox.classList.remove("hidden");
  refs.feedbackBox.classList.add("hidden");
  if (emojiHideTimer) {
    window.clearTimeout(emojiHideTimer);
    emojiHideTimer = null;
  }
  if (activeCelebration) {
    activeCelebration.remove();
    activeCelebration = null;
  }

  const isStoryText = card.type === "story_text";
  const isDifferentialText = card.type === "differenzial_text";

  state.revealPhase = null;
  refs.cardMode.textContent = MODE_LABELS[card.type] || "Modus";
  refs.cardCategory.textContent = card.category;
  refs.questionText.textContent = card.question;
  refs.questionText.classList.remove("differential-answer");
  refs.questionText.classList.toggle("story-text", isStoryText || isDifferentialText);

  state.currentChoices = [];
  state.currentCorrectIndex = -1;

  refs.resultText.textContent = "";
  refs.resultText.className = "result-line";
  refs.translationText.textContent = card.translation_es || "";
  refs.explanationText.textContent = card.explanation_de || "";

  refs.feedbackBox.classList.remove("text-card-nav");
  refs.choices.classList.remove("hidden");
  refs.resultText.classList.remove("hidden");
  refs.explanationText.classList.remove("hidden");
  refs.translationText.classList.remove("hidden");
  refs.nextBtn.textContent = "Naechste Karte";

  refs.choices.innerHTML = "";

  if (isStoryText) {
    refs.choices.classList.add("hidden");
    refs.feedbackBox.classList.remove("hidden");
    refs.feedbackBox.classList.add("text-card-nav");
    refs.resultText.classList.add("hidden");
    refs.explanationText.classList.add("hidden");
    refs.translationText.classList.add("hidden");
    state.answered = true;
    return;
  }

  if (isDifferentialText) {
    refs.choices.classList.add("hidden");
    refs.feedbackBox.classList.remove("hidden");
    refs.feedbackBox.classList.add("text-card-nav");
    refs.resultText.classList.add("hidden");
    refs.explanationText.classList.add("hidden");
    refs.translationText.classList.add("hidden");
    refs.nextBtn.textContent = "Bereit";
    state.revealPhase = "prompt";
    state.answered = true;
    return;
  }

  const hasValidChoices = Array.isArray(card.choices) && card.choices.length >= 2;
  const hasValidCorrectIndex =
    Number.isInteger(card.correctIndex) &&
    card.correctIndex >= 0 &&
    card.correctIndex < (card.choices?.length || 0);
  if (!hasValidChoices || !hasValidCorrectIndex) {
    refs.choices.classList.add("hidden");
    refs.feedbackBox.classList.remove("hidden");
    refs.feedbackBox.classList.add("text-card-nav");
    refs.resultText.classList.remove("hidden");
    refs.resultText.classList.add("bad");
    refs.resultText.textContent = "Karte unvollstaendig. Bitte Deck-Daten pruefen.";
    refs.explanationText.classList.add("hidden");
    refs.translationText.classList.add("hidden");
    state.answered = true;
    return;
  }

  const shuffledChoices = card.choices.map((choice, originalIndex) => ({
    choice,
    originalIndex
  }));
  shuffleInPlace(shuffledChoices);

  state.currentChoices = shuffledChoices.map((entry) => entry.choice);
  state.currentCorrectIndex = shuffledChoices.findIndex(
    (entry) => entry.originalIndex === card.correctIndex
  );

  state.currentChoices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice";
    button.textContent = `${String.fromCharCode(65 + index)}) ${choice}`;
    button.addEventListener("click", () => handleAnswer(index));
    refs.choices.appendChild(button);
  });

  state.answered = false;
}

function handleAnswer(selectedIndex) {
  if (state.answered) return;
  const card = state.queue[state.currentIndex];
  if (!card || card.type === "story_text" || card.type === "differenzial_text") return;

  state.answered = true;
  const correctIndex = state.currentCorrectIndex;
  if (correctIndex < 0) return;

  const isCorrect = selectedIndex === correctIndex;
  const choiceButtons = Array.from(refs.choices.querySelectorAll(".choice"));

  choiceButtons.forEach((button, index) => {
    button.disabled = true;
    if (index === correctIndex) {
      button.classList.add("correct");
    } else if (index === selectedIndex && !isCorrect) {
      button.classList.add("wrong");
    }
  });

  refs.feedbackBox.classList.remove("hidden");
  if (isCorrect) {
    refs.resultText.textContent = "Richtig. Stark gemacht.";
    refs.resultText.classList.add("ok");
    triggerHeartBurst();
  } else {
    refs.resultText.textContent = `Nicht ganz. Richtig ist: ${state.currentChoices[correctIndex]}`;
    refs.resultText.classList.add("bad");
  }

  saveAttempt(card.cardId, isCorrect);
  renderFolderFilters();
  renderQueueInfo();
  updateStartButtonState();
  renderStats();
}

function markPassiveCardAsRead(card) {
  if (!card) return;
  if (card.type !== "story_text" && card.type !== "differenzial_text") return;
  if (card.type === "differenzial_text" && state.revealPhase !== "answer") return;

  saveAttempt(card.cardId, true);
  renderFolderFilters();
  renderQueueInfo();
  updateStartButtonState();
  renderStats();
}

function showDifferentialAnswer(card) {
  if (!card || card.type !== "differenzial_text") return;

  refs.questionText.textContent = card.answer_de || "Keine Antwort hinterlegt.";
  refs.questionText.classList.add("story-text", "differential-answer");
  refs.feedbackBox.classList.remove("hidden");
  refs.feedbackBox.classList.add("text-card-nav");
  refs.nextBtn.textContent = "Naechste Karte";
  state.revealPhase = "answer";
}

function triggerHeartBurst() {
  const emoji = SWEET_EMOJIS[Math.floor(Math.random() * SWEET_EMOJIS.length)];
  const driftX = Math.floor(Math.random() * 61) - 30;
  const rotation = Math.floor(Math.random() * 41) - 20;

  if (activeCelebration) {
    activeCelebration.remove();
    activeCelebration = null;
  }

  const celebration = document.createElement("div");
  celebration.className = "floating-emoji";
  celebration.textContent = emoji;
  celebration.style.setProperty("--emoji-x", `${driftX}px`);
  celebration.style.setProperty("--emoji-rot", `${rotation}deg`);

  document.body.appendChild(celebration);
  activeCelebration = celebration;

  void celebration.offsetWidth;
  celebration.classList.add("show");

  if (emojiHideTimer) {
    window.clearTimeout(emojiHideTimer);
  }

  emojiHideTimer = window.setTimeout(() => {
    celebration.classList.remove("show");
    celebration.classList.add("hide");
    window.setTimeout(() => {
      if (celebration.parentNode) {
        celebration.remove();
      }
      if (activeCelebration === celebration) {
        activeCelebration = null;
      }
    }, 500);
  }, 2400);
}

function nextCard() {
  if (!state.queue.length) return;

  const currentCard = state.queue[state.currentIndex];

  if (currentCard?.type === "differenzial_text" && state.revealPhase === "prompt") {
    showDifferentialAnswer(currentCard);
    return;
  }

  markPassiveCardAsRead(currentCard);

  if (state.currentIndex < state.queue.length - 1) {
    state.currentIndex += 1;
    renderCard();
    return;
  }

  rebuildQueue(true);
}

function saveAttempt(cardId, isCorrect) {
  const progress = getProgress(cardId);
  progress.introduced = true;
  if (!progress.introducedDate) {
    progress.introducedDate = todayKey();
  }

  progress.attempts = (progress.attempts || 0) + 1;
  progress.correct = (progress.correct || 0) + (isCorrect ? 1 : 0);
  progress.lastDate = todayKey();
  progress.lastResult = isCorrect;
  if (isCorrect) {
    progress.streak = Math.min((progress.streak || 0) + 1, 7);
    if (progress.streak >= 7) {
      progress.diamondSince = todayKey();
    }
  } else {
    progress.streak = 0;
    progress.diamondSince = "";
  }

  const day = ensureDayStats(todayKey());
  day.attempts += 1;
  if (isCorrect) day.correct += 1;
  else day.wrong += 1;

  saveToStorage(STORAGE_PROGRESS_KEY, state.progress);
  saveToStorage(STORAGE_DAILY_KEY, state.dailyStats);
  scheduleRemoteSync();
}

function ensureDayStats(dayKey) {
  if (!state.dailyStats[dayKey]) {
    state.dailyStats[dayKey] = { attempts: 0, correct: 0, wrong: 0 };
  }
  return state.dailyStats[dayKey];
}

function renderStats() {
  const day = ensureDayStats(todayKey());
  const rate = day.attempts > 0 ? Math.round((day.correct / day.attempts) * 100) : 0;

  refs.todayAttempts.textContent = String(day.attempts);
  refs.todayCorrect.textContent = String(day.correct);
  refs.todayWrong.textContent = String(day.wrong);
  refs.todayRate.textContent = `${rate}%`;
  refs.kpiGoal.textContent = `${day.attempts} / ${DAILY_GOAL}`;
  refs.kpiAccuracy.textContent = `${rate}%`;
  refs.kpiStreak.textContent = `${computeStreak()} Tage`;

  renderWeekChart();
  renderLevelDisplay();
}

function renderLevelDisplay() {
  const levelState = getLevelState();
  const levelDef = LEVEL_DEFINITIONS[levelState.level - 1] || LEVEL_DEFINITIONS[0];
  const percent = Math.round(levelState.ratio * 100);

  refs.levelBadge.textContent = `Level ${levelState.level}`;
  refs.levelTitle.textContent = levelDef.title;
  refs.levelProgressText.textContent = `${levelState.mastered} / ${levelState.total} Karten in Diamonds`;
  refs.levelFill.style.width = `${percent}%`;

  const track = refs.levelFill.parentElement;
  if (track) {
    track.setAttribute("aria-valuenow", String(percent));
  }

  if (refs.levelAvatar.dataset.level !== String(levelState.level)) {
    refs.levelAvatar.dataset.level = String(levelState.level);
    applyLevelAvatarSources(levelDef.assetCandidates);
  }
}

function getLevelState() {
  const total = state.cards.length;
  if (total === 0) {
    return { level: 1, mastered: 0, total: 0, ratio: 0 };
  }

  let mastered = 0;
  for (const card of state.cards) {
    const progress = getProgress(card.cardId);
    if ((progress.streak || 0) >= 7) {
      mastered += 1;
    }
  }

  const ratio = total > 0 ? mastered / total : 0;
  let level = 1;
  for (const definition of LEVEL_DEFINITIONS) {
    if (ratio >= definition.minRatio) {
      level = definition.level;
    }
  }

  if (mastered === total) {
    level = 10;
  } else if (level >= 10) {
    level = 9;
  }

  return { level, mastered, total, ratio };
}

function renderWeekChart() {
  refs.weekChart.innerHTML = "";
  const lastDays = getLastDays(7);
  const maxAttempts = Math.max(
    1,
    ...lastDays.map((dayKey) => state.dailyStats[dayKey]?.attempts || 0)
  );

  for (const dayKey of lastDays) {
    const item = state.dailyStats[dayKey] || { attempts: 0, correct: 0, wrong: 0 };
    const accuracy =
      item.attempts > 0 ? Math.round((item.correct / item.attempts) * 100) : 0;
    const barHeight = Math.max(6, Math.round((item.attempts / maxAttempts) * 120));

    const wrap = document.createElement("div");
    wrap.className = "bar-wrap";

    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = `${barHeight}px`;
    bar.title = `${dayKey}: ${item.attempts} Karten, ${accuracy}%`;

    const meta = document.createElement("div");
    meta.className = "bar-meta";
    meta.textContent = `${item.attempts} | ${accuracy}%`;

    const label = document.createElement("div");
    label.className = "bar-label";
    label.textContent = shortDay(dayKey);

    wrap.appendChild(bar);
    wrap.appendChild(meta);
    wrap.appendChild(label);
    refs.weekChart.appendChild(wrap);
  }
}

function openStatsOverlay() {
  if (!state.user) return;
  refs.statsOverlay.classList.remove("hidden");
  refs.statsOverlay.setAttribute("aria-hidden", "false");
}

function closeStatsOverlay() {
  refs.statsOverlay.classList.add("hidden");
  refs.statsOverlay.setAttribute("aria-hidden", "true");
}

function computeStreak() {
  const days = getLastDays(30).reverse();
  let streak = 0;
  for (const dayKey of days) {
    if ((state.dailyStats[dayKey]?.attempts || 0) > 0) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

function createSupabaseStorage() {
  const memoryStore = {};
  const localStorageRef = getStorageOrNull("localStorage");
  const sessionStorageRef = getStorageOrNull("sessionStorage");
  const primaryStorage = localStorageRef || sessionStorageRef;

  return {
    getItem(key) {
      try {
        if (primaryStorage) {
          const value = primaryStorage.getItem(key);
          if (value !== null) return value;
        }
      } catch (error) {
        console.warn("Auth storage getItem fehlgeschlagen", error);
      }
      return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null;
    },
    setItem(key, value) {
      try {
        if (primaryStorage) {
          primaryStorage.setItem(key, value);
          return;
        }
      } catch (error) {
        console.warn("Auth storage setItem fehlgeschlagen", error);
      }
      memoryStore[key] = value;
    },
    removeItem(key) {
      try {
        if (localStorageRef) {
          localStorageRef.removeItem(key);
        }
      } catch (error) {
        console.warn("Auth storage removeItem (local) fehlgeschlagen", error);
      }
      try {
        if (sessionStorageRef) {
          sessionStorageRef.removeItem(key);
        }
      } catch (error) {
        console.warn("Auth storage removeItem (session) fehlgeschlagen", error);
      }
      delete memoryStore[key];
    }
  };
}

function getStorageOrNull(storageName) {
  try {
    return window[storageName] || null;
  } catch (error) {
    return null;
  }
}

function applyLevelAvatarSources(sources) {
  if (!Array.isArray(sources) || sources.length === 0) return;
  refs.levelAvatar.dataset.sources = JSON.stringify(sources);
  refs.levelAvatar.dataset.sourceIndex = "0";
  refs.levelAvatar.src = sources[0];
}

function handleLevelAvatarError() {
  let sources = [];
  try {
    sources = JSON.parse(refs.levelAvatar.dataset.sources || "[]");
  } catch (error) {
    sources = [];
  }
  if (!Array.isArray(sources) || sources.length === 0) return;

  const currentIndex = Number(refs.levelAvatar.dataset.sourceIndex || "0");
  const nextIndex = currentIndex + 1;
  if (nextIndex >= sources.length) return;

  refs.levelAvatar.dataset.sourceIndex = String(nextIndex);
  refs.levelAvatar.src = sources[nextIndex];
}

function buildLevelAssetCandidates(level) {
  const candidates = [];
  const levelIndex = Math.max(0, Math.min(9, level - 1));

  // Prefer exact level file (level-0.png ... level-9.png),
  // then gracefully fall back to lower unlocked assets if some files are still missing.
  for (let index = levelIndex; index >= 0; index -= 1) {
    candidates.push(`assets/levels/level-${index}.png`);
    candidates.push(`assets/levels/level-${index}.jpg`);
    candidates.push(`assets/levels/level-${index}.jpeg`);
    candidates.push(`assets/levels/level-${index}.webp`);
    candidates.push(`assets/levels/level-${index}.svg`);
  }
  candidates.push("assets/kat-photo-placeholder.svg");
  return candidates;
}

function getRemainingNewSlotsToday() {
  const today = todayKey();
  let introducedToday = 0;
  for (const entry of Object.values(state.progress)) {
    const progress = normalizeProgressEntry(entry);
    if (progress.introducedDate === today) {
      introducedToday += 1;
    }
  }
  return Math.max(0, NEW_CARDS_PER_DAY - introducedToday);
}

function migrateStoredProgress(rawProgress) {
  if (!rawProgress || typeof rawProgress !== "object") return {};

  const migrated = {};
  for (const [cardId, entry] of Object.entries(rawProgress)) {
    migrated[cardId] = normalizeProgressEntry(entry);
  }
  return migrated;
}

function createDefaultProgressEntry() {
  return {
    attempts: 0,
    correct: 0,
    introduced: false,
    introducedDate: "",
    streak: 0,
    lastDate: "",
    lastResult: null,
    diamondSince: ""
  };
}

function normalizeProgressEntry(entry) {
  const base = createDefaultProgressEntry();
  if (!entry || typeof entry !== "object") {
    return base;
  }

  const attempts = Number(entry.attempts) || 0;
  const correct = Number(entry.correct) || 0;
  const introduced = Boolean(entry.introduced) || attempts > 0;
  const lastResult =
    typeof entry.lastResult === "boolean" ? entry.lastResult : base.lastResult;

  let streak = 0;
  if (typeof entry.streak === "number" && Number.isFinite(entry.streak)) {
    streak = Math.max(0, Math.min(7, Math.floor(entry.streak)));
  } else if (introduced && lastResult === true) {
    const oldInterval = Number(entry.interval) || 0;
    if (oldInterval >= 30) streak = 7;
    else if (oldInterval >= 16) streak = 6;
    else if (oldInterval >= 8) streak = 5;
    else if (oldInterval >= 4) streak = 4;
    else if (oldInterval >= 2) streak = 3;
    else if (oldInterval >= 1) streak = 2;
    else streak = 1;
  }

  if (lastResult === false) {
    streak = 0;
  }

  return {
    attempts,
    correct,
    introduced,
    introducedDate:
      typeof entry.introducedDate === "string" && entry.introducedDate ? entry.introducedDate : "",
    streak,
    lastDate: typeof entry.lastDate === "string" ? entry.lastDate : "",
    lastResult,
    diamondSince:
      typeof entry.diamondSince === "string"
        ? entry.diamondSince
        : streak >= 7
          ? todayKey()
          : ""
  };
}

function getProgress(cardId) {
  if (!state.progress[cardId]) {
    state.progress[cardId] = createDefaultProgressEntry();
    return state.progress[cardId];
  }
  state.progress[cardId] = normalizeProgressEntry(state.progress[cardId]);
  return state.progress[cardId];
}

function loadFromStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return fallback;
    return parsed;
  } catch (error) {
    console.warn("Storage-Lesen fehlgeschlagen", error);
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Storage-Schreiben fehlgeschlagen", error);
  }
}

function scheduleRemoteSync() {
  if (!supabase || !state.user) return;
  if (syncTimer) window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => {
    pushRemoteState();
  }, 800);
}

async function pullRemoteState() {
  if (!supabase || !state.user) return;

  const { data, error } = await supabase
    .from("progress")
    .select("id, status, updated_at")
    .eq("user_id", state.user.id)
    .eq("card_id", APP_STATE_CARD_ID)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) {
    refs.authStatus.textContent = `Cloud-Laden fehlgeschlagen: ${error.message}`;
    return;
  }

  const row = data?.[0] || null;
  if (!row) {
    remoteStateRowId = null;
    if (Object.keys(state.progress).length || Object.keys(state.dailyStats).length) {
      await pushRemoteState();
    }
    return;
  }

  remoteStateRowId = row.id;

  try {
    const payload = JSON.parse(row.status || "{}");
    state.progress = migrateStoredProgress(
      payload && typeof payload.progress === "object" && payload.progress ? payload.progress : {}
    );
    state.dailyStats =
      payload && typeof payload.dailyStats === "object" && payload.dailyStats
        ? payload.dailyStats
        : {};
    saveToStorage(STORAGE_PROGRESS_KEY, state.progress);
    saveToStorage(STORAGE_DAILY_KEY, state.dailyStats);
    renderFolderFilters();
    rebuildQueue(false);
    renderStats();
    refs.authStatus.textContent = `Eingeloggt als ${state.user.email} (Cloud geladen)`;
  } catch (parseError) {
    refs.authStatus.textContent = "Cloud-Daten konnten nicht gelesen werden.";
    console.error(parseError);
  }
}

async function pushRemoteState() {
  if (!supabase || !state.user) return;

  const payload = JSON.stringify({
    progress: state.progress,
    dailyStats: state.dailyStats
  });

  if (remoteStateRowId) {
    const { error } = await supabase
      .from("progress")
      .update({ status: payload, updated_at: new Date().toISOString() })
      .eq("id", remoteStateRowId)
      .eq("user_id", state.user.id);
    if (!error) return;
  }

  const { data, error } = await supabase
    .from("progress")
    .insert({
      user_id: state.user.id,
      card_id: APP_STATE_CARD_ID,
      status: payload
    })
    .select("id")
    .single();

  if (error) {
    refs.authStatus.textContent = `Cloud-Speichern fehlgeschlagen: ${error.message}`;
    return;
  }
  remoteStateRowId = data.id;
}

function todayKey() {
  return dateToKey(new Date());
}

function dateToKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dayKey, daysToAdd) {
  const date = new Date(`${dayKey}T12:00:00`);
  date.setDate(date.getDate() + daysToAdd);
  return dateToKey(date);
}

function getLastDays(count) {
  const days = [];
  const cursor = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(cursor);
    date.setDate(cursor.getDate() - i);
    days.push(dateToKey(date));
  }
  return days;
}

function shortDay(dayKey) {
  const date = new Date(`${dayKey}T12:00:00`);
  return date.toLocaleDateString("de-DE", { weekday: "short" });
}

function shuffleInPlace(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
