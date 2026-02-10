const quotes = [
  {
    author: "William Shakespeare",
    work: "Hamlet",
    quote: "To be, or not to be: that is the question:",
    theme: {
      accent: "#8c3b2f",
      glow: "rgba(140, 59, 47, 0.35)",
      videoBg: "#f2d3c2",
      skin: "#f0c2a0",
      hair: "#2f1f1a",
    },
  },
  {
    author: "Jane Austen",
    work: "Emma",
    quote: "There is no charm equal to tenderness of heart.",
    theme: {
      accent: "#c26b4a",
      glow: "rgba(194, 107, 74, 0.35)",
      videoBg: "#f7ddcd",
      skin: "#f5c8a8",
      hair: "#6b3e2b",
    },
  },
  {
    author: "Mark Twain",
    work: "Quoted",
    quote: "The secret of getting ahead is getting started.",
    theme: {
      accent: "#3b6b6f",
      glow: "rgba(59, 107, 111, 0.35)",
      videoBg: "#d8ecea",
      skin: "#edc39f",
      hair: "#3a2a23",
    },
  },
  {
    author: "Oscar Wilde",
    work: "Quoted",
    quote: "Be yourself; everyone else is already taken.",
    theme: {
      accent: "#6b3c64",
      glow: "rgba(107, 60, 100, 0.35)",
      videoBg: "#efdff0",
      skin: "#f2c7ab",
      hair: "#2d1d2a",
    },
  },
  {
    author: "Mary Shelley",
    work: "Frankenstein",
    quote: "Beware; for I am fearless, and therefore powerful.",
    theme: {
      accent: "#46614b",
      glow: "rgba(70, 97, 75, 0.35)",
      videoBg: "#dde8df",
      skin: "#efc3a1",
      hair: "#2f3b31",
    },
  },
  {
    author: "Edgar Allan Poe",
    work: "A Dream Within a Dream",
    quote: "All that we see or seem is but a dream within a dream.",
    theme: {
      accent: "#304d6d",
      glow: "rgba(48, 77, 109, 0.35)",
      videoBg: "#d8e2ef",
      skin: "#eec2a6",
      hair: "#212e3a",
    },
  },
  {
    author: "Emily Bronte",
    work: "Wuthering Heights",
    quote: "Whatever our souls are made of, his and mine are the same.",
    theme: {
      accent: "#7a4a3a",
      glow: "rgba(122, 74, 58, 0.35)",
      videoBg: "#f1ddd2",
      skin: "#f1c7a8",
      hair: "#3a2a24",
    },
  },
  {
    author: "F. Scott Fitzgerald",
    work: "The Great Gatsby",
    quote: "So we beat on, boats against the current, borne back ceaselessly into the past.",
    theme: {
      accent: "#7c4d2e",
      glow: "rgba(124, 77, 46, 0.35)",
      videoBg: "#f3dcc7",
      skin: "#f2c8a4",
      hair: "#3a2a1f",
    },
  },
  {
    author: "Virginia Woolf",
    work: "A Room of One's Own",
    quote: "A woman must have money and a room of her own if she is to write fiction.",
    theme: {
      accent: "#5b5f87",
      glow: "rgba(91, 95, 135, 0.35)",
      videoBg: "#e2e3f1",
      skin: "#f0c5a4",
      hair: "#3a364d",
    },
  },
  {
    author: "Charles Dickens",
    work: "A Tale of Two Cities",
    quote: "It was the best of times, it was the worst of times.",
    theme: {
      accent: "#8c4a33",
      glow: "rgba(140, 74, 51, 0.35)",
      videoBg: "#f4dbce",
      skin: "#f2c6a2",
      hair: "#39251c",
    },
  },
];

const quoteText = document.getElementById("quoteText");
const authorName = document.getElementById("authorName");
const authorMeta = document.getElementById("authorMeta");
const workMeta = document.getElementById("workMeta");
const videoCard = document.getElementById("videoCard");
const audioIndicator = document.getElementById("audioIndicator");
const replayButton = document.getElementById("replay");
const newQuoteButton = document.getElementById("newQuote");
const page = document.getElementById("page");
const unlock = document.getElementById("unlock");
const unlockBtn = document.getElementById("unlockBtn");

let currentQuote = null;
let lastIndex = -1;
let hasSpokenOnce = false;
let speakGuardTimer = null;
let pendingVoiceRetry = null;
let voiceRetryCount = 0;

function pickQuote() {
  let idx = Math.floor(Math.random() * quotes.length);
  if (quotes.length > 1) {
    while (idx === lastIndex) {
      idx = Math.floor(Math.random() * quotes.length);
    }
  }
  lastIndex = idx;
  return quotes[idx];
}

function applyTheme(theme) {
  if (videoCard) {
    videoCard.style.setProperty("--accent", theme.accent);
    videoCard.style.setProperty("--glow", theme.glow);
    videoCard.style.setProperty("--video-bg", theme.videoBg);
    videoCard.style.setProperty("--skin", theme.skin);
    videoCard.style.setProperty("--hair", theme.hair);
  }
  document.documentElement.style.setProperty("--accent", theme.accent);
  document.documentElement.style.setProperty("--glow", theme.glow);
}

function setQuote(quote) {
  currentQuote = quote;
  voiceRetryCount = 0;
  if (quoteText) quoteText.textContent = `"${quote.quote}"`;
  if (authorName) authorName.textContent = quote.author;
  if (authorMeta) authorMeta.textContent = quote.author.toUpperCase();
  if (workMeta) workMeta.textContent = quote.work.toUpperCase();
  applyTheme(quote.theme);
}

function stopSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  if (videoCard) {
    videoCard.classList.remove("speaking");
  }
  if (audioIndicator) {
    audioIndicator.textContent = "Ready to read.";
  }
}

function showPreviewTalk() {
  if (!videoCard) return;
  videoCard.classList.add("speaking");
  window.setTimeout(() => {
    videoCard.classList.remove("speaking");
  }, 1200);
}

function speakQuote() {
  stopSpeaking();
  if (!currentQuote) return;

  if (!("speechSynthesis" in window)) {
    if (audioIndicator) {
      audioIndicator.textContent = "Speech synthesis is not supported in this browser.";
    }
    showPreviewTalk();
    return;
  }

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0 && voiceRetryCount < 6) {
    voiceRetryCount += 1;
    if (pendingVoiceRetry) {
      window.clearTimeout(pendingVoiceRetry);
    }
    pendingVoiceRetry = window.setTimeout(() => {
      speakQuote();
    }, 250);
  }

  const utterance = new SpeechSynthesisUtterance(currentQuote.quote);
  utterance.rate = 0.95;
  utterance.pitch = 0.95;
  utterance.lang = "en-US";

  utterance.onstart = () => {
    hasSpokenOnce = true;
    if (videoCard) {
      videoCard.classList.add("speaking");
    }
    if (audioIndicator) {
      audioIndicator.textContent = "Speaking...";
    }
  };

  utterance.onend = () => {
    if (videoCard) {
      videoCard.classList.remove("speaking");
    }
    if (audioIndicator) {
      audioIndicator.textContent = "Finished.";
    }
  };

  utterance.onerror = () => {
    if (videoCard) {
      videoCard.classList.remove("speaking");
    }
    if (audioIndicator) {
      audioIndicator.textContent = "Tap Replay to try again.";
    }
  };

  const preferred =
    voices.find((voice) => voice.lang.startsWith("en") && voice.name.includes("Female")) ||
    voices.find((voice) => voice.lang.startsWith("en"));
  if (preferred) {
    utterance.voice = preferred;
  }

  window.speechSynthesis.speak(utterance);

  if (speakGuardTimer) {
    window.clearTimeout(speakGuardTimer);
  }
  speakGuardTimer = window.setTimeout(() => {
    if (!window.speechSynthesis.speaking) {
      if (audioIndicator) {
        audioIndicator.textContent = "Tap Replay to allow audio.";
      }
      showPreviewTalk();
    }
  }, 600);
}

function spinQuote({ shouldSpeak } = { shouldSpeak: true }) {
  const next = pickQuote();
  setQuote(next);
  if (shouldSpeak) {
    speakQuote();
  }
}

function handleReplay() {
  speakQuote();
}

function handleNewQuote() {
  spinQuote({ shouldSpeak: true });
}

replayButton?.addEventListener("click", handleReplay);
newQuoteButton?.addEventListener("click", handleNewQuote);
unlockBtn?.addEventListener("click", () => {
  if (page) {
    page.classList.remove("is-locked");
    page.classList.add("is-unlocked");
  }
  if (unlock) {
    unlock.setAttribute("aria-hidden", "true");
  }
  speakQuote();
});

if ("speechSynthesis" in window) {
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    if (!hasSpokenOnce) {
      speakQuote();
    }
  });
}

spinQuote({ shouldSpeak: false });
