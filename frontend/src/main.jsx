 // src/main.jsx
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

const APP_VERSION = "1.0.6";
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
      // এখানে ইচ্ছাকৃতভাবে token/user clear করা হচ্ছে না।
      // যদি সত্যিই backend contract বদলে যাওয়ায় user/token invalid করতে হয়,
      // তাহলে শুধু নির্দিষ্ট key remove করুন, পুরো localStorage নয়:
      // localStorage.removeItem("someOldCacheKey");
    } else if (!savedVersion) {
      // ✅ fresh visit — কিছু touch করো না, শুধু version save করো
      localStorage.setItem(STORAGE_KEY, APP_VERSION);
    }
    // same version — কিছুই করো না, token/user অক্ষত থাকবে
  } catch (err) {
    console.warn("checkAppVersion failed:", err);
  }
}

// একবার reload করার পর, ঠিক তার পরপরই যেন আরেকটা reload আবার trigger না হয়
// (SW বারবার install/activate হতে থাকলেও) — সেটা আটকানোর জন্য sessionStorage
// ব্যবহার করা হচ্ছে, কারণ page-level ভ্যারিয়েবল প্রতি reload-এ রিসেট হয়ে যায়।
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
    // sessionStorage না থাকলে (private mode ইত্যাদি) reload allow করি,
    // কিন্তু in-memory guard দিয়ে অন্তত একবারের বেশি এই session-এ আটকাই
    return true;
  }
}

function listenForSWUpdate() {
  if (!("serviceWorker" in navigator)) return;

  let refreshing = false;

  // ✅ SW থেকে APP_UPDATED আসলে reload করো — কিন্তু auth data মুছবে না
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "APP_UPDATED") {
      if (!canReloadNow()) return;
      console.log("🔄 SW updated — reloading (auth data preserved)");
      try {
        localStorage.setItem(STORAGE_KEY, APP_VERSION);
      } catch (err) {
        console.warn("Storage update failed:", err);
      }
      window.location.reload();
    }
  });

  // ✅ নতুন SW active হলে reload — কিন্তু cooldown-এর মধ্যে দ্বিতীয়বার না
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    if (!canReloadNow()) return;
    refreshing = true;
    window.location.reload();
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