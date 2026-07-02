 // src/main.jsx
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

const APP_VERSION = "1.0.2";
const STORAGE_KEY = "uthiyo_app_version";

function checkAppVersion() {
  try {
    const savedVersion = localStorage.getItem(STORAGE_KEY);
    if (savedVersion && savedVersion !== APP_VERSION) {
      // ✅ শুধু version mismatch এ clear — token আলাদা রেখে দাও
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      localStorage.clear();
      sessionStorage.clear();
      // ✅ version save করো — না হলে প্রতিবার clear হবে
      localStorage.setItem(STORAGE_KEY, APP_VERSION);
      console.log("🔄 App updated — old data cleared");
    } else {
      // ✅ version same — শুধু version টা save করো, বাকি কিছু touch করো না
      localStorage.setItem(STORAGE_KEY, APP_VERSION);
    }
  } catch (err) {
    console.warn("checkAppVersion failed:", err);
  }
}

function listenForSWUpdate() {
  if (!("serviceWorker" in navigator)) return;

  let refreshing = false;

  // ✅ SW এর APP_UPDATED message আসলে clear করো
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "APP_UPDATED") {
      console.log("🔄 App updated — clearing old data");
      try {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem(STORAGE_KEY, APP_VERSION);
      } catch (err) {
        console.warn("Storage clear failed:", err);
      }
      window.location.href = "/app";
    }
  });

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