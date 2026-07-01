 // src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { checkAppVersion } from './utils/versionCheck.js'

function listenForSWUpdate() {
  if (!("serviceWorker" in navigator)) return;

  let refreshing = false;

  // ✅ SW এর activate event থেকে APP_UPDATED message আসলে
  // localStorage clear করবে, কিন্তু force navigate করবে না
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "APP_UPDATED") {
      console.log("🔄 App updated — clearing old data");
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (err) {
        console.warn("Storage clear failed:", err);
      }
      // ✅ /app এ force navigate করা হবে না — ইউজার যেই page এ আছে সেখানেই থাকবে
      // "/" এ থাকলে home page-ই দেখাবে, "/app" এ থাকলে login/dashboard দেখাবে
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