 // src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// ===================================================================
// ✅ versionCheck.js এর কোড এখানে inline করা হয়েছে — আলাদা ফাইল থেকে
// import করলে build এ [UNRESOLVED_IMPORT] এরর আসছিল, তাই সরাসরি এখানেই রাখা হলো
// ===================================================================

const APP_VERSION = "1.0.0";
const STORAGE_KEY = "uthiyo_app_version";

function checkAppVersion() {
  try {
    const savedVersion = localStorage.getItem(STORAGE_KEY);
    if (savedVersion && savedVersion !== APP_VERSION) {
      console.log(`🔄 App updated: ${savedVersion} → ${APP_VERSION}`);
    }
    localStorage.setItem(STORAGE_KEY, APP_VERSION);
  } catch (err) {
    console.warn("checkAppVersion failed:", err);
  }
}

function listenForSWUpdate() {
  if (!("serviceWorker" in navigator)) return;

  let refreshing = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    console.log("🔄 New service worker activated — reloading page");
    window.location.reload();
  });

  navigator.serviceWorker.ready
    .then((registration) => {
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            console.log("✅ New version available, activating...");
            newWorker.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
    })
    .catch((err) => console.warn("listenForSWUpdate failed:", err));
}

checkAppVersion()
listenForSWUpdate()

createRoot(document.getElementById('root')).render(
  // ✅ StrictMode সরানো হয়েছে — production এ double render বন্ধ
  <BrowserRouter>
    <App />
  </BrowserRouter>
)