 import rulesData from "../../models/rulesData";

const RuleDetailModal = ({ id, onClose }) => {
  const data = rulesData[id];
  if (!data) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-lg rounded-t-2xl max-h-[85vh] overflow-y-auto pb-8">

        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-5 pt-3">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{data.icon}</span>
            <div>
              <div className="font-semibold text-gray-900 text-lg">{data.title}</div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${data.badgeColor}`}>
                {data.badge}
              </span>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap mb-5">
            {data.stats.map((s, i) => (
              <div key={i} className="bg-gray-50 rounded-xl px-3 py-2 text-center min-w-[80px]">
                <div className="font-semibold text-gray-900 text-sm">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>

          {data.sections.map((sec, si) => (
            <div key={si} className="mb-5">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 pb-1 border-b border-gray-100">
                {sec.title}
              </div>
              {sec.items.map((item, ii) => (
                <div key={ii} className="flex gap-2 py-2 border-b border-gray-50 last:border-b-0">
                  <span className="text-xs font-medium text-gray-400 min-w-[20px] pt-0.5">
                    {ii + 1}.
                  </span>
                  <span className="text-sm text-gray-800 leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          ))}

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-sm font-medium active:bg-gray-100 mt-1"
          >
            বন্ধ করো
          </button>
        </div>
      </div>
    </div>
  );
};

export default RuleDetailModal;