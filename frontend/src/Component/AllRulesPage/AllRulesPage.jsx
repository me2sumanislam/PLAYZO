 import { useState } from "react";
import rulesData from "../../models/rulesData";
import RuleDetailModal from "../RuleDetailModal/RuleDetailModal";

const cardKeys = ["br", "cs4v4", "lonewolf", "cs2v2", "survival", "free"];

const AllRulesPage = ({ onBack }) => {
  const [activeModal, setActiveModal] = useState(null);

  return (
    <div className="bg-gray-50 min-h-screen">

      <div className="bg-gradient-to-b from-[#56CCF2] to-[#2F80ED] px-4 pt-12 pb-5 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-lg font-bold"
        >
          ‹
        </button>
        <h1 className="text-white font-bold text-lg tracking-tight">All Rules</h1>
      </div>

      <div className="px-4 py-5">
        <p className="text-xs text-gray-500 mb-4 text-center">
          কার্ডে ট্যাপ করো বিস্তারিত দেখতে
        </p>
        <div className="grid grid-cols-2 gap-3">
          {cardKeys.map((key) => {
            const d = rulesData[key];
            if (!d) return null;
            return (
              <div
                key={key}
                onClick={() => setActiveModal(key)}
                className="relative bg-white rounded-2xl border border-gray-100 p-4 cursor-pointer active:scale-95 transition-transform overflow-hidden shadow-sm"
              >
                <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${d.accentColor}`} />
                <div className="text-3xl mb-2">{d.icon}</div>
                <div className="font-semibold text-gray-900 text-sm leading-tight">{d.title}</div>
                <div className="text-xs text-gray-400 mt-0.5 mb-2">{d.badge}</div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${d.badgeColor}`}>
                  {d.badge}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {activeModal && (
        <RuleDetailModal id={activeModal} onClose={() => setActiveModal(null)} />
      )}
    </div>
  );
};

export default AllRulesPage;