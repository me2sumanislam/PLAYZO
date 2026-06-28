 // src/utils/versionCheck.js

const APP_VERSION = "1.0.3"
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
    // ✅ /login নয়, /app এ পাঠাও — Auth component নিজেই login দেখাবে
    window.location.replace("/app")
  }
}

export const listenForSWUpdate = () => {
  if (!("serviceWorker" in navigator)) return

  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "APP_UPDATED") {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem(VERSION_KEY, APP_VERSION)
      // ✅ /login নয়, /app এ পাঠাও
      window.location.replace("/app")
    }
  })
}