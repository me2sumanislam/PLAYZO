 import React, { useState } from "react";

const BuildYourApp = ({ onBack }) => {
  const whatsappNumber = "01749684030"; // তোমার WhatsApp number
  const email = "me2sumanislam247@gmail.com";         // তোমার email

  const [form, setForm] = useState({ name: "", phone: "", idea: "" });
  const [sent, setSent] = useState(false);

  const handleWhatsApp = () => {
    window.open(
      `https://wa.me/${whatsappNumber}?text=আমি একটা app বানাতে চাই, আপনার সাথে কথা বলতে চাই।`,
      "_blank"
    );
  };

  const handleEmail = () => {
    window.open(
      `mailto:${email}?subject=App Development Request&body=আমি একটা app বানাতে চাই।`,
      "_blank"
    );
  };

  const handleSubmit = () => {
    if (!form.name || !form.idea) return alert("নাম ও idea লিখুন");
    window.open(
      `mailto:${email}?subject=App Request from ${form.name}&body=নাম: ${form.name}%0APhone: ${form.phone}%0AIdea: ${form.idea}`,
      "_blank"
    );
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Top Bar */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 bg-gray-900">
        <button onClick={onBack} className="text-2xl">‹</button>
        <h1 className="text-lg font-bold">Build Your App</h1>
      </div>

      <div className="px-4 py-6 space-y-5 max-w-lg mx-auto">

        {/* Banner */}
        <div className="bg-gradient-to-br from-purple-700 to-blue-700 rounded-2xl p-5 text-center">
          <div className="text-5xl mb-3">🚀</div>
          <h2 className="text-xl font-black mb-2">আপনার App-এর স্বপ্ন পূরণ করুন</h2>
          <p className="text-purple-200 text-sm leading-relaxed">
            আপনার idea আছে? আমরা সেটাকে বাস্তব App-এ রূপ দেব।
            Android, iOS এবং Web — সবই বানাই।
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: "📱", text: "Android & iOS App" },
            { icon: "🌐", text: "Web Application" },
            { icon: "🔧", text: "Admin Panel সহ" },
            { icon: "💰", text: "সাশ্রয়ী মূল্যে" },
          ].map((f) => (
            <div key={f.text} className="bg-gray-900 rounded-xl p-3 flex items-center gap-2">
              <span className="text-xl">{f.icon}</span>
              <span className="text-sm text-gray-300">{f.text}</span>
            </div>
          ))}
        </div>

        {/* Contact Buttons */}
        <button
          onClick={handleWhatsApp}
          className="w-full flex items-center justify-center gap-3 bg-green-600 active:bg-green-700 rounded-2xl py-4 font-bold text-white text-base"
        >
          <span className="text-2xl">💬</span>
          WhatsApp-এ যোগাযোগ করুন
        </button>

        <button
          onClick={handleEmail}
          className="w-full flex items-center justify-center gap-3 bg-blue-600 active:bg-blue-700 rounded-2xl py-4 font-bold text-white text-base"
        >
          <span className="text-xl">✉️</span>
          Email করুন
        </button>

        {/* Contact Form */}
        <div className="bg-gray-900 rounded-2xl p-5">
          <h3 className="font-bold text-base mb-4">💡 App-এর Idea জানান</h3>

          {sent ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-green-400 font-bold">ধন্যবাদ!</p>
              <p className="text-gray-400 text-sm mt-1">আমরা শীঘ্রই যোগাযোগ করব।</p>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="আপনার নাম *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-gray-800 rounded-xl px-4 py-3 text-sm outline-none border border-gray-700 focus:border-purple-500 text-white"
              />
              <input
                type="tel"
                placeholder="Phone number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-gray-800 rounded-xl px-4 py-3 text-sm outline-none border border-gray-700 focus:border-purple-500 text-white"
              />
              <textarea
                placeholder="আপনার app-এর idea বলুন... *"
                value={form.idea}
                onChange={(e) => setForm({ ...form, idea: e.target.value })}
                rows={4}
                className="w-full bg-gray-800 rounded-xl px-4 py-3 text-sm outline-none border border-gray-700 focus:border-purple-500 resize-none text-white"
              />
              <button
                onClick={handleSubmit}
                className="w-full bg-purple-600 active:bg-purple-700 rounded-xl py-4 font-bold text-white"
              >
                পাঠিয়ে দিন 🚀
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BuildYourApp;