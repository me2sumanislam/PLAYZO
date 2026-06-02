 // src/hooks/useOneSignal.js
// App.jsx এ একবার call করলেই হবে

import { useEffect } from "react";

const ONESIGNAL_APP_ID = "ad701a0f-8ef4-4d3c-8967-2a028216da99";

const useOneSignal = () => {
  useEffect(() => {
    // OneSignal SDK load
    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal) => {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          // ✅ PWA / Safari / iOS support
          safari_web_id: "web.onesignal.auto." + ONESIGNAL_APP_ID,
          notifyButton: {
            enable: false, // নিজের bell icon ব্যবহার করব
          },
          allowLocalhostAsSecureOrigin: true, // development এ কাজ করবে
        });

        // ✅ Permission চাওয়া
        const permission = await OneSignal.Notifications.permissionNative;
        if (permission === "default") {
          await OneSignal.Notifications.requestPermission();
        }

        // ✅ User login হলে external user ID set করা
        const user = (() => {
          try { return JSON.parse(localStorage.getItem("user") || "{}"); }
          catch { return {}; }
        })();

        const userId = user?.id || user?._id;
        if (userId) {
          await OneSignal.login(userId);
        }

        console.log("✅ OneSignal initialized");
      });
    };

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);
};

export default useOneSignal;