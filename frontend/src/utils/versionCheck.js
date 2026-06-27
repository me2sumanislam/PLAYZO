 // src/utils/versionCheck.js

// ✅ Update দেওয়ার সময় শুধু এই দুটো বাড়ান
const APP_VERSION = "1.0.1"
const VERSION_KEY = "app_version"

// =============================================================================
// App load হওয়ার সময় version check করো
// =============================================================================
export const checkAppVersion = () => {
  const savedVersion = localStorage.getItem(VERSION_KEY)

  if (savedVersion === null) {
    // প্রথমবার আসছে — শুধু version save করো, logout নয়
    localStorage.setItem(VERSION_KEY, APP_VERSION)
    return
  }

  if (savedVersion !== APP_VERSION) {
    // পুরনো version — সব clear করো, login এ পাঠাও
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem(VERSION_KEY, APP_VERSION)
    window.location.replace("/login")
  }
}

// =============================================================================
// Service Worker থেকে APP_UPDATED message এলেও logout করো
// =============================================================================
export const listenForSWUpdate = () => {
  if (!("serviceWorker" in navigator)) return

  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "APP_UPDATED") {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem(VERSION_KEY, APP_VERSION)
      window.location.replace("/login")
    }
  })
}