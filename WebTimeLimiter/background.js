let enabled = true;
let timerActive = false;
let timeLeft = 0;
let initialTime = 0;
let sites = [];
let blockedToday = false;
let intervalId = null;
let currentTrackedActive = false;

// Load saved state
chrome.storage.local.get(
  [
    "enabled",
    "timeLeft",
    "timerActive",
    "sites",
    "blockedToday",
    "lastReset",
    "initialTime"
  ],
  (data) => {
    enabled = data.enabled !== false;
    checkDailyReset(data);
    syncWithActiveTab();
  }
);

// ---- Daily Reset Logic (Option C) ----
function checkDailyReset(data) {
  const today = new Date().toDateString();
  const storedInitial = data.initialTime || 0;

  if (data.lastReset !== today) {
    blockedToday = false;

    initialTime = storedInitial || data.timeLeft || 0;
    timeLeft = initialTime;

    // Auto-start new day if enabled
    timerActive = enabled && initialTime > 0;

    chrome.storage.local.set({
      blockedToday,
      lastReset: today,
      timeLeft,
      timerActive,
      initialTime
    });
  } else {
    blockedToday = data.blockedToday || false;
    initialTime = storedInitial || data.timeLeft || 0;
    timeLeft = data.timeLeft ?? initialTime;
    timerActive = data.timerActive || false;
  }

  sites = data.sites || [];
}

// ---- Sync with the currently active tab ----
function syncWithActiveTab() {
  if (!enabled) {
    stopInterval();
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      checkTab(tabs[0]);
    } else {
      stopInterval();
    }
  });
}

// ---- Update from popup (Version 1.7 fix included) ----
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "update-settings") {
    if (typeof msg.enabled === "boolean") enabled = msg.enabled;
    if (Array.isArray(msg.sites)) sites = msg.sites;
    if (typeof msg.timeLeft === "number") timeLeft = msg.timeLeft;
    if (typeof msg.timerActive === "boolean") timerActive = msg.timerActive;
    if (typeof msg.initialTime === "number") initialTime = msg.initialTime;

    chrome.storage.local.set({
      enabled,
      sites,
      timeLeft,
      timerActive,
      initialTime
    });

    // 🔥 NEW — Immediately check the current tab so Start works instantly
    syncWithActiveTab();

    if (!enabled) {
      stopInterval();
      return sendResponse({ success: true });
    }

    if (blockedToday) {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          const domain = extractDomain(tab.url);
          if (sites.includes(domain)) redirectBlocked(tab.id);
        });
      });
    }

    return sendResponse({ success: true });
  }

  return true;
});

// ---- Track tabs ----
chrome.tabs.onActivated.addListener(({ tabId }) => {
  if (!enabled) return;
  chrome.tabs.get(tabId, checkTab);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!enabled) return;
  if (changeInfo.status === "complete" || changeInfo.url) {
    checkTab(tab);
  }
});

// ---- Helpers ----
function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// ---- Main tab logic ----
function checkTab(tab) {
  if (!enabled) {
    stopInterval();
    return;
  }

  if (!tab || !tab.url) return;

  const domain = extractDomain(tab.url);
  const isTracked = sites.includes(domain);

  currentTrackedActive = isTracked;

  if (blockedToday && isTracked) {
    redirectBlocked(tab.id);
    stopInterval();
    return;
  }

  // Option B rules:
  // Timer runs only if:
  // - enabled
  // - timerActive (Start pressed or auto-start)
  // - currently on tracked site
  // - not blocked today
  if (timerActive && isTracked && timeLeft > 0 && !blockedToday) {
    startInterval();
  } else {
    stopInterval();
  }
}

// ---- Countdown ----
function startInterval() {
  if (intervalId || blockedToday || !enabled) return;

  intervalId = setInterval(() => {
    if (!enabled || !timerActive || blockedToday || !currentTrackedActive) return;

    timeLeft--;
    if (timeLeft < 0) timeLeft = 0;

    chrome.storage.local.set({ timeLeft });

    if (timeLeft <= 0) {
      blockForDay();
      stopTimer();
    }
  }, 1000);
}

function stopInterval() {
  if (!intervalId) return;
  clearInterval(intervalId);
  intervalId = null;
}

function stopTimer() {
  timerActive = false;
  chrome.storage.local.set({ timerActive });
  stopInterval();
}

// ---- Block for the rest of the day ----
function blockForDay() {
  blockedToday = true;
  timerActive = false;
  timeLeft = 0;

  chrome.storage.local.set({
    blockedToday,
    timerActive,
    timeLeft
  });

  chrome.notifications.create({
    type: "basic",
    title: "Website Blocked",
    message: "Stop with the brainrot Anu" // <- Update this line
  });

  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      const domain = extractDomain(tab.url);
      if (sites.includes(domain)) redirectBlocked(tab.id);
    });
  });
}

function redirectBlocked(tabId) {
  chrome.tabs.update(tabId, {
    url: chrome.runtime.getURL("blocked.html")
  });
}







