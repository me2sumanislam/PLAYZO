 // src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

const APP_VERSION = "1.0.0";
const STORAGE_KEY = "uthiyo_app_version";

function checkAppVersion() {
  try {
    const savedVersion = localStorage.getItem(STORAGE_KEY);
    if (savedVersion && savedVersion !== APP_VERSION) {
      console.log(`🔄 App updated: ${savedVersion} → ${APP_VERSION}`);
      // ✅ Version mismatch হলে পুরনো data clear করে login এ পাঠাও
      localStorage.clear();
      sessionStorage.clear();
    }
    localStorage.setItem(STORAGE_KEY, APP_VERSION);
  } catch (err) {
    console.warn("checkAppVersion failed:", err);
  }
}

function listenForSWUpdate() {
  if (!("serviceWorker" in navigator)) return;

  let refreshing = false;

  // ✅ SW এর activate event থেকে APP_UPDATED message আসলে
  // localStorage clear করে login page এ পাঠাও
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "APP_UPDATED") {
      console.log("🔄 App updated — clearing old data, going to login");
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (err) {
        console.warn("Storage clear failed:", err);
      }
      // token নেই তাই /app এ গেলে App.jsx নিজেই login দেখাবে
      window.location.href = "/app";
    }
  });

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
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            console.log("✅ New version available, activating...");
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