 import React from "react";
import { Gamepad2, ClipboardList, BarChart3, Users, Cat } from "lucide-react";

const BottomMenu = ({ tab, setTab }) => {
  const menus = [
    {
      id: "play",
      label: "Play",
      icon: <Gamepad2 size={24} strokeWidth={2.2} />,
    },
    {
      id: "matches",
      label: "My Match",
      icon: <ClipboardList size={24} strokeWidth={2.2} />,
    },
    {
      id: "results",
      label: "Results",
      icon: <BarChart3 size={24} strokeWidth={2.2} />,
    },
    {
      id: "referral",
      label: "Refer",
      icon: <Users size={24} strokeWidth={2.2} />,
    },
    {
      id: "profile",
      label: "Profile",
      icon: <Cat size={24} strokeWidth={2.2} />,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-[450px] mx-auto z-50 shadow-2xl">
      <div className="flex items-center justify-around py-2">
        {menus.map((item) => {
          const isActive = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex flex-col items-center justify-center py-2 px-3 transition-all flex-1 ${
                isActive ? "text-orange-500 scale-110" : "text-gray-500"
              }`}
            >
              <div className={`transition-all ${isActive ? "scale-110" : ""}`}>
                {item.icon}
              </div>
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomMenu;