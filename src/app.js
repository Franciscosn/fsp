import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STORAGE_PROGRESS_KEY = "fsp_heart_progress_v1";
const STORAGE_DAILY_KEY = "fsp_heart_daily_v1";
const DAILY_GOAL = 20;
const APP_STATE_CARD_ID = "__app_state__";

const SUPABASE_URL = "https://nitmxiasxwgwsaygumls.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_frshj6OvLDHGioVXbVwsrg_dbzyFajQ";
const supabaseReady = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const supabase = supabaseReady ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const SWEET_EMOJIS = ["💖", "💕", "💘", "💝", "🥰", "😍", "😘", "🫶", "🍑", "🌸", "✨"];
let emojiHideTimer = null;
let activeCelebration = null;
let remoteStateRowId = null;
let syncTimer = null;

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

const FOLDERS = [
  { id: "regular", label: "Regulaer" },
  { id: "new", label: "Neu" },
  { id: "one_right", label: "1x richtig" },
  { id: "unsure", label: "Unsicher" },
  { id: "streak_2", label: "2x richtig" },
  { id: "streak_3", label: "3x richtig" },
  { id: "streak_4", label: "4x richtig" },
  { id: "streak_5", label: "5x richtig" },
  { id: "streak_6", label: "6x richtig" },
  { id: "diamonds", label: "Diamonds (7x)" },
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
  user: null
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
  sessionText: document.getElementById("sessionText"),
  authPortrait: document.getElementById("authPortrait"),
  dedicationPhoto: document.getElementById("dedicationPhoto"),
  categoryFilters: document.getElementById("categoryFilters"),
  folderFilters: document.getElementById("folderFilters"),
  queueInfo: document.getElementById("queueInfo"),
  startImmersiveBtn: document.getElementById("startImmersiveBtn"),
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

  refs.nextBtn.addEventListener("click", nextCard);
  refs.shuffleBtn.addEventListener("click", () => rebuildQueue(true));
  refs.startImmersiveBtn.addEventListener("click", enterImmersiveMode);
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
  initAuthUi();
  initAuthPortrait();
  initDedicationPhoto();
  try {
    const url = new URL("../data/cards.json", import.meta.url);
    const response = await fetch(url);
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

function initDedicationPhoto() {
  const photo = refs.dedicationPhoto;
  if (!photo) return;

  const preferredPath = "assets/kat-photo.jpg";
  const fallbackPath = "assets/kat-photo-placeholder.svg";
  const probe = new Image();

  probe.onload = () => {
    photo.src = preferredPath;
  };
  probe.onerror = () => {
    photo.src = fallbackPath;
  };
  probe.src = preferredPath;
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
  const total = state.queue.length;
  if (total === 0) {
    refs.startImmersiveBtn.disabled = true;
    refs.startImmersiveBtn.textContent = "los geht's";
    return;
  }
  refs.startImmersiveBtn.disabled = false;
  refs.startImmersiveBtn.textContent = "los geht's";
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
