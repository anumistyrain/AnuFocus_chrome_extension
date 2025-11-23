const toggleEnabled = document.getElementById("toggle-enabled");
const siteList = document.getElementById("site-list");
const newSite = document.getElementById("new-site");
const addSiteBtn = document.getElementById("add-site");
const timeInput = document.getElementById("time-input");
const statusText = document.getElementById("status-text");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");

let enabled = true;
let sites = [];
let timeLeft = 0;
let timerActive = false;
let blockedToday = false;
let initialTime = 0;

// ---- Helpers ----
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function updateStatus() {
  if (!enabled) {
    statusText.innerText = "Disabled";
    startBtn.disabled = true;
    pauseBtn.disabled = true;
    return;
  }

  if (blockedToday) {
    statusText.innerText = "Blocked for the rest of today";
    startBtn.disabled = true;
    pauseBtn.disabled = true;
    return;
  }

  startBtn.disabled = false;
  pauseBtn.disabled = !timerActive;

  if (timerActive) {
    statusText.innerText = `Running · ${formatTime(timeLeft)}`;
  } else {
    statusText.innerText = `Paused · ${formatTime(timeLeft)}`;
  }
}

function renderSites() {
  siteList.innerHTML = "";
  sites.forEach((site, index) => {
    const div = document.createElement("div");
    div.className = "site-item";
    div.innerHTML = `
      <span>${site}</span>
      <span class="remove" data-index="${index}">✖</span>
    `;
    div.querySelector(".remove").onclick = () => {
      sites.splice(index, 1);
      sendUpdate();
      renderSites();
    };
    siteList.appendChild(div);
  });
}

// ---- Load initial state ----
function load() {
  chrome.storage.local.get(
    ["sites", "timeLeft", "timerActive", "blockedToday", "initialTime", "enabled"],
    (data) => {
      sites = data.sites || [];
      timeLeft = data.timeLeft || 0;
      timerActive = data.timerActive || false;
      blockedToday = data.blockedToday || false;
      initialTime = data.initialTime || timeLeft || 0;
      enabled = data.enabled !== false;

      toggleEnabled.checked = enabled;

      if (initialTime > 0) {
        timeInput.value = Math.floor(initialTime / 60);
      }

      renderSites();
      updateStatus();
    }
  );
}

// ---- Send state to background ----
function sendUpdate() {
  chrome.runtime.sendMessage({
    action: "update-settings",
    sites,
    timeLeft,
    timerActive,
    initialTime,
    enabled
  });
}

// ---- Event handlers ----
toggleEnabled.onclick = () => {
  enabled = toggleEnabled.checked;
  sendUpdate();
  updateStatus();
};

addSiteBtn.onclick = () => {
  const domain = newSite.value
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "");

  if (!domain) return;
  if (!sites.includes(domain)) {
    sites.push(domain);
    newSite.value = "";
    renderSites();
    sendUpdate();
  }
};

timeInput.onchange = () => {
  const minutes = Number(timeInput.value || 0);
  if (minutes > 0) {
    initialTime = minutes * 60;

    if (!blockedToday) {
      timeLeft = initialTime;
    }

    sendUpdate();
    updateStatus();
  }
};

startBtn.onclick = () => {
  if (!enabled || blockedToday) return;

  if (initialTime <= 0) {
    const minutes = Number(timeInput.value || 0);
    if (minutes > 0) initialTime = minutes * 60;
  }

  if (timeLeft <= 0 && initialTime > 0) {
    timeLeft = initialTime;
  }

  if (initialTime <= 0) return;

  timerActive = true;
  sendUpdate();
  updateStatus();
};

pauseBtn.onclick = () => {
  if (!enabled || blockedToday) return;
  timerActive = false;
  sendUpdate();
  updateStatus();
};

// ---- Live updates ----
setInterval(() => {
  chrome.storage.local.get(
    ["timeLeft", "timerActive", "blockedToday", "enabled"],
    (data) => {
      enabled = data.enabled !== false;
      timeLeft = data.timeLeft ?? timeLeft;
      timerActive = data.timerActive ?? timerActive;
      blockedToday = data.blockedToday ?? blockedToday;
      toggleEnabled.checked = enabled;
      updateStatus();
    }
  );
}, 1000);

load();



