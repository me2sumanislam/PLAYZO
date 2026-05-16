 import { useState, useEffect } from "react";

const InstallButton = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    console.log("Install Button Mounted");

    const timer = setTimeout(() => {
      setShow(true);   // Force দেখানোর জন্য (টেস্টের জন্য)
    }, 3000);

    const handler = (e) => {
      console.log("🔥 beforeinstallprompt FIRED!");
      e.preventDefault();
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleClick = () => {
    alert("📲 Install Prompt চেক করা হচ্ছে...\n\nConsole খুলে দেখো কী আসছে");
    console.log("Install Button Clicked");
  };

  if (!show) return null;

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] 
                 bg-orange-600 hover:bg-orange-700 text-white 
                 font-bold text-lg py-4 px-10 rounded-2xl shadow-2xl"
    >
      📲 এখনই uthiYO অ্যাপ ইনস্টল করুন
    </button>
  );
};

export default InstallButton;