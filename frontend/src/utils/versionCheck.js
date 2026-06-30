 // src/utils/versionCheck.js
// ⚠️ bump-version.js স্ক্রিপ্টটা এই ফাইলে APP_VERSION এর প্যাচ নাম্বার অটো বাড়ায়,
// তাই "APP_VERSION = "x.y.z"" এই লাইনের ফরম্যাট বদলাবেন না।

export const APP_VERSION = "1.0.0";

const STORAGE_KEY = "uthiyo_app_version";

/**
 * পেজ লোড হওয়ার সময় চেক করে localStorage তে সেভ করা ভার্সনের সাথে
 * বর্তমান কোডের APP_VERSION মিলছে কিনা। না মিললে মানে নতুন build
 * ডিপ্লয় হয়েছে — পুরোনো cache/localStorage এর কিছু leftover data
 * থেকে সমস্যা যেন না হয় তাই নতুন ভার্সন সেভ করে দেয়।
 */
export function checkAppVersion() {
  try {
    const savedVersion = localStorage.getItem(STORAGE_KEY);

    if (savedVersion && savedVersion !== APP_VERSION) {
      console.log(`🔄 App updated: ${savedVersion} → ${APP_VERSION}`);
      // চাইলে এখানে নির্দিষ্ট কিছু পুরোনো cache key clear করতে পারেন
      // localStorage.removeItem("someOldKey");
    }

    localStorage.setItem(STORAGE_KEY, APP_VERSION);
  } catch (err) {
    console.warn("checkAppVersion failed:", err);
  }
}

/**
 * Service worker আপডেট হলে (নতুন build পাওয়া গেলে) ইউজারকে
 * জানিয়ে/অটোমেটিক রিলোড করিয়ে দেয়, যাতে সবসময় লেটেস্ট ভার্সন চলে।
 */
export function listenForSWUpdate() {
  if (!("serviceWorker" in navigator)) return;

  let refreshing = false;

  // নতুন SW activate হয়ে কন্ট্রোল নিলে এক বার পেজ রিলোড করে
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    console.log("🔄 New service worker activated — reloading page");
    window.location.reload();
  });

  navigator.serviceWorker.ready
    .then((registration) => {
      // নতুন SW ইনস্টল হওয়ার সাথে সাথে activate করতে বলে (skipWaiting flow)
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
    .catch((err) => {
      console.warn("listenForSWUpdate failed:", err);
    });
}