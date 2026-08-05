 // src/main.jsx
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

const APP_VERSION = "1.0.9";
const STORAGE_KEY = "uthiyo_app_version";
const RELOAD_GUARD_KEY = "sw_last_reload_ts";
const RELOAD_COOLDOWN_MS = 15000; // এই সময়ের মধ্যে দ্বিতীয়বার reload হবে না

function checkAppVersion() {
  try {
    const savedVersion = localStorage.getItem(STORAGE_KEY);
    if (savedVersion && savedVersion !== APP_VERSION) {
      // ✅ version আলাদা — শুধু cache/version key clear করো, token/user রেখে দাও
      localStorage.setItem(STORAGE_KEY, APP_VERSION);
      console.log("🔄 Version updated —", savedVersion, "→", APP_VERSION);
    } else if (!savedVersion) {
      // ✅ fresh visit — কিছু touch করো না, শুধু version save করো
      localStorage.setItem(STORAGE_KEY, APP_VERSION);
    }
  } catch (err) {
    console.warn("checkAppVersion failed:", err);
  }
}

function canReloadNow() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || 0);
    const now = Date.now();
    if (now - last < RELOAD_COOLDOWN_MS) {
      console.warn("⛔ SW reload skipped — cooldown active, avoiding reload loop");
      return false;
    }
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(now));
    return true;
  } catch {
    return true;
  }
}

function clearAllLocalData() {
  try {
    localStorage.clear();
  } catch (err) {
    console.warn("localStorage clear failed:", err);
  }
  try {
    sessionStorage.clear();
  } catch (err) {
    console.warn("sessionStorage clear failed:", err);
  }
  try {
    if (indexedDB?.databases) {
      indexedDB.databases().then((dbs) => {
        dbs.forEach((db) => {
          if (db?.name) indexedDB.deleteDatabase(db.name);
        });
      }).catch(() => {});
    }
  } catch (err) {
    console.warn("indexedDB clear failed:", err);
  }
}

function listenForSWUpdate() {
  if (!("serviceWorker" in navigator)) return;

  let refreshing = false;
  let freshInstallPending = false;

  // ✅ একমাত্র জায়গা যেখান থেকে reload হয় — যেকোনো সংখ্যক trigger থেকে
  // কল হলেও, guard-এর কারণে reload() একবারই কল হবে (race/double-reload আটকায়)
  const doReload = () => {
    if (refreshing) return;
    if (!canReloadNow()) return;
    refreshing = true;
    window.location.reload();
  };

  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "FRESH_INSTALL_RESET") {
      console.log("🆕 Fresh install detected — clearing all local data");
      clearAllLocalData();
      try {
        localStorage.setItem(STORAGE_KEY, APP_VERSION);
      } catch (err) {
        console.warn("Storage update failed:", err);
      }
      // ⚠️ এখানে সরাসরি reload() কল করা হচ্ছে না।
      // self.clients.claim() নিজেই controllerchange event trigger করবে,
      // সেখান থেকেই reload হবে (নিচে দেখুন)। এখানে শুধু fallback হিসেবে
      // একটা timeout রাখা হলো — যদি কোনো কারণে controllerchange না ফায়ার করে।
      freshInstallPending = true;
      setTimeout(() => {
        if (freshInstallPending) doReload();
      }, 800);
      return;
    }

    if (event.data?.type === "APP_UPDATED") {
      try {
        localStorage.setItem(STORAGE_KEY, APP_VERSION);
      } catch (err) {
        console.warn("Storage update failed:", err);
      }
      doReload();
    }
  });

  // ✅ নতুন SW active হলে reload — এখন এটাই মূল reload trigger,
  // message handler-এর সাথে race করবে না
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    freshInstallPending = false;
    doReload();
  });

  navigator.serviceWorker.ready
    .then((registration) => {
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            console.log("✅ New SW ready, activating...");
            newWorker.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
    })
    .catch((err) => console.warn("listenForSWUpdate failed:", err));
}

checkAppVersion();
listenForSWUpdate();

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)