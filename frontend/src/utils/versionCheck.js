 // src/utils/versionCheck.js

const APP_VERSION = "1.0.6"
const VERSION_KEY = "app_version"

export const checkAppVersion = () => {
  const savedVersion = localStorage.getItem(VERSION_KEY)

  if (savedVersion === null) {
    localStorage.setItem(VERSION_KEY, APP_VERSION)
    return
  }

  if (savedVersion !== APP_VERSION) {
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem(VERSION_KEY, APP_VERSION)

    // ✅ FIX: /admin এ থাকলে redirect করবে না
    const isAdmin = window.location.pathname.startsWith("/admin")
    if (!isAdmin) {
      window.location.replace("/app")
    }
  }
}

// ✅ একবারের বেশি listener add হবে না
let swListenerAdded = false

export const listenForSWUpdate = () => {
  if (!("serviceWorker" in navigator)) return
  if (swListenerAdded) return
  swListenerAdded = true

  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "APP_UPDATED") {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem(VERSION_KEY, APP_VERSION)

      // ✅ FIX: /admin এ থাকলে redirect করবে না
      const isAdmin = window.location.pathname.startsWith("/admin")
      if (!isAdmin) {
        window.location.replace("/app")
      }
    }
  })
}