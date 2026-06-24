 // src/utils/versionCheck.js
const APP_VERSION = "1.0.0"; // নতুন deploy এ শুধু এটা বদলান
const VERSION_KEY = "app_version";

export const checkAppVersion = () => {
  const savedVersion = localStorage.getItem(VERSION_KEY);

  if (savedVersion !== APP_VERSION) {
    // Version মেলেনি — সব clear করো
    localStorage.clear();
    sessionStorage.clear();

    // নতুন version save করো
    localStorage.setItem(VERSION_KEY, APP_VERSION);
  }
};