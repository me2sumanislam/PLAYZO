 // src/main.jsx
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

const APP_VERSION = "1.0.6";
const STORAGE_KEY = "uthiyo_app_version";

function checkAppVersion() {
  try {
    const savedVersion = localStorage.getItem(STORAGE_KEY);
    if (savedVersion && savedVersion !== APP_VERSION) {
      // ✅ version আলাদা — update হয়েছে, clear করো
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(STORAGE_KEY, APP_VERSION);
      console.log("🔄 Version updated — data cleared");
    } else if (!savedVersion) {
      // ✅ fresh visit — কিছু touch করো না, শুধু version save করো
      localStorage.setItem(STORAGE_KEY, APP_VERSION);
    }
    // same version — কিছুই করো না, token/user অক্ষত থাকবে
  } catch (err) {
    console.warn("checkAppVersion failed:", err);
  }
}

function listenForSWUpdate() {
  if (!("serviceWorker" in navigator)) return;

  let refreshing = false;

  // ✅ SW থেকে APP_UPDATED আসলে clear করে reload
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "APP_UPDATED") {
      console.log("🔄 SW updated — clearing data and reloading");
      try {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem(STORAGE_KEY, APP_VERSION);
      } catch (err) {
        console.warn("Storage clear failed:", err);
      }
      window.location.reload();
    }
  });

  // ✅ নতুন SW active হলে reload
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
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