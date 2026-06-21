// src/utils/versionCheck.js
// ─────────────────────────────────────────────────────────────────────────────
// নতুন deploy এর সময় শুধু APP_VERSION বদলান → সব user auto logout হবে
// ─────────────────────────────────────────────────────────────────────────────

const APP_VERSION = "1.0.0"; // ← নতুন deploy এ এটা বদলান, যেমন "1.0.1", "1.1.0"
const VERSION_KEY = "app_version";

export const checkAppVersion = () => {
  const savedVersion = localStorage.getItem(VERSION_KEY);

  if (savedVersion !== APP_VERSION) {
    // ✅ Version মেলেনি — সব clear করো
    localStorage.clear();
    sessionStorage.clear();

    // নতুন version save করো
    localStorage.setItem(VERSION_KEY, APP_VERSION);

    // Page reload — login page এ যাবে
    window.location.href = "/login";
  }
};