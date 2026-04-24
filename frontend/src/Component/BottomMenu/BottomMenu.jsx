 import React from "react";
import {
  Store,
  Gamepad2,
  ClipboardList,
  BarChart3,
  Cat
} from "lucide-react";

const BottomMenu = ({ tab, setTab }) => {
  const menus = [
    {
      id: "shop",
      label: "Shop",
      icon: <Store size={24} className="text-cyan-400" strokeWidth={2.2} />,
    },
    {
      id: "play",
      label: "Play",
      icon: <Gamepad2 size={24} className="text-purple-500" strokeWidth={2.2} />,
    },
    {
      id: "matches",
      label: "My Match...",
      icon: <ClipboardList size={24} className="text-orange-500" strokeWidth={2.2} />,
    },
    {
      id: "results",
      label: "Results",
      icon: <BarChart3 size={24} className="text-green-400" strokeWidth={2.2} />,
    },
    {
      id: "profile",
      label: "Profile",
      icon: <Cat size={24} className="text-purple-500" strokeWidth={2.2} />,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-[450px] mx-auto bg-[#f7f2fb] border-t border-gray-100 z-50">
      <div className="flex justify-between items-end px-2 pt-3 pb-4">
        {menus.map((item) => {
          const active = tab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className="flex flex-col items-center justify-center flex-1"
            >
              <div
                className={`flex items-center justify-center h-12 px-6 rounded-full transition-all duration-200 ${
                  active ? "bg-[#ece2fb]" : ""
                }`}
              >
                {item.icon}
              </div>

              <span
                className={`mt-2 text-[11px] leading-none ${
                  active ? "font-bold text-black" : "font-medium text-black"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomMenu;