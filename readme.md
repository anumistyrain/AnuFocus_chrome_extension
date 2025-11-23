# Website Time Limiter (Chrome Extension)

Version **1.7**

A personal Chrome extension that tracks time spent on selected websites and blocks them for the rest of the day once a daily limit is reached. This tool is designed for private, personal use and is not intended for the Chrome Web Store.

---

## ✨ Features

* **Track specific websites** and limit time spent on them per day
* **Daily timer auto-resets** at midnight (12:01 AM–11:59 PM cycle)
* **Auto-start each day** when the new daily cycle begins
* **Start** and **Pause** controls for manual control
* **Enable/Disable toggle** to freeze all extension activity without losing data
* **Blocks tracked sites** for the rest of the day once the timer hits 0
* **Live countdown display** (HH:MM:SS)
* **Dark mode popup UI**
* **Custom block page** when a tracked site is blocked
* **Notification** when the time limit is reached
* **Adding new sites while blocked** automatically blocks them

---

## 📦 Installation

1. Clone or download this repository.
2. Open Chrome and go to:
   **chrome://extensions/**
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select folder 'WebTimeLimiter'.

The extension will now appear in your Chrome toolbar.

---

## 🧠 How It Works

### 1. **Daily Timer Logic**

* At **midnight**, the timer resets to the full daily limit (`initialTime`).
* If the extension is **enabled**, it auto-starts.
* Time only counts down when:

  * The extension is enabled
  * The timer is in **running** state
  * You are visiting a **tracked website**
  * You are not already blocked for the day

### 2. **When Time Runs Out**

* All tracked sites are immediately redirected to the block page.
* A notification appears:
  **"Stop with the brainrot Anu"**
* The extension remains blocked until the next day.

### 3. **Enable/Disable Toggle**

* Disabling the extension freezes everything.
* Re-enabling restores all previous state.
* No data is lost.

### 4. **Manual Controls**

* **Start** → begins or resumes the countdown
* **Pause** → freezes the timer

---

## 🛠 Customizing the Block Message (IMPORTANT)

When the timer limit is reached, the extension displays a notification and redirects blocked sites to `blocked.html`.

### 🔔 **To change the notification message**

Edit this section in `background.js`:

```js
chrome.notifications.create({
  type: "basic",
  title: "Website Blocked",
  message: "Stop with the brainrot Anu"   // <- Update this line
});
```

Replace the message text with anything you like.

### 🚫 **To change the text on the blocked page**

Modify the HTML inside `blocked.html`.
You can fully customize:

* Message text
* Colors
* Layout
* Any encouragement (or scolding 😄)


## 📜 License

This extension is intended for **personal use only** and is not licensed for distribution on any extension store.

---
