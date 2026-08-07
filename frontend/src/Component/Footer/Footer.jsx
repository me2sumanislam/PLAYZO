 import React from "react";
import { Mail, Youtube, Facebook } from "lucide-react";

// lucide-react has no Telegram brand icon, so it's a small custom SVG
const TelegramIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M21.05 3.38 2.98 10.49c-1.24.5-1.23 1.19-.23 1.5l4.63 1.45 1.79 5.53c.22.6.11.84.75.84.49 0 .71-.22 1-.5l2.35-2.28 4.7 3.47c.87.48 1.49.23 1.71-.8l3.1-14.6c.32-1.28-.48-1.85-1.73-1.72Zm-11.4 10.4-.83 4.02-1.5-4.63 9.6-6.02c.32-.2.15-.34-.13-.15L9.65 13.78Z" />
  </svg>
);

const socialLinks = [
  {
    label: "Gmail",
    value: "support@uthiyo.com",
    href: "mailto:support@uthiyo.com",
    Icon: Mail,
  },
  {
    label: "Telegram",
    value: "uthiYO Community",
    href: "https://t.me/uthiyo", // TODO: replace with the real Telegram link
    Icon: TelegramIcon,
  },
  {
    label: "YouTube",
    value: "uthiYO Official",
    href: "https://www.youtube.com/@Uthiyo-i5l",
    Icon: Youtube,
  },
  {
    label: "Facebook",
    value: "Facebook Page",
    href: "https://www.facebook.com/share/p/1B4qzJjBJR/",
    Icon: Facebook,
  },
];

// label -> section id on the page. Update the ids to match your actual sections.
const quickLinks = [
  { label: "হোম", id: "home" },
  { label: "টুর্নামেন্ট", id: "tournament" },
  { label: "ডাউনলোড", id: "download" }, // scrolls to the install button's wrapper div
  { label: "ফিচার", id: "features" }, // scrolls to "আমাদের বিশেষত্ব" tab/section
  { label: "নিয়মাবলী", id: "rules" },
  { label: "প্রাইভেসি পলিসি", id: "privacy" },
];

const scrollToSection = (id) => (e) => {
  e.preventDefault();
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

const Footer = () => (
  <footer className="bg-[#0b0b14] text-white pt-14 md:pt-16 pb-8 px-4 sm:px-6 border-t border-[#ff7a1a]/10">
    <style>
      {`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&display=swap');
        .font-arena { font-family: 'Rajdhani', sans-serif; }
      `}
    </style>

    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
      {/* Brand + about */}
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 bg-[#ff7a1a] flex items-center justify-center font-black text-[#0b0b14] text-lg"
            style={{ clipPath: "polygon(0 0, 100% 0, 100% 75%, 85% 100%, 0 100%)" }}
          >
            U
          </div>
          <span className="font-arena text-xl font-bold tracking-wide">
            uthi<span className="text-[#ff7a1a]">YO</span>
          </span>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
          uthiYO হলো বাংলাদেশের উদীয়মান ই-স্পোর্টস প্ল্যাটফর্ম। আমরা গেমারদের
          দক্ষতা প্রদর্শনের এবং বড় পুরস্কার জেতার সুযোগ করে দিই। আজই আমাদের
          কমিউনিটিতে যোগ দিন।
        </p>
      </div>

      {/* Contact */}
      <div>
        <h3 className="font-arena text-lg font-bold mb-5 border-l-2 border-[#ff7a1a] pl-3 uppercase tracking-wide">
          যোগাযোগ
        </h3>
        <ul className="space-y-3 text-sm">
          {socialLinks.map(({ label, value, href, Icon }) => (
            <li key={label}>
              <a
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="flex items-center gap-3 text-gray-400 hover:text-[#ff7a1a] transition-colors"
              >
                <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#a78bfa] shrink-0">
                  <Icon className="w-4 h-4" />
                </span>
                <span>
                  <span className="text-[#a78bfa]">{label}</span> {value}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Quick links */}
      <div>
        <h3 className="font-arena text-lg font-bold mb-5 border-l-2 border-[#ff7a1a] pl-3 uppercase tracking-wide">
          কুইক লিংক
        </h3>
        <ul className="grid grid-cols-2 md:grid-cols-1 gap-3 text-sm">
          {quickLinks.map(({ label, id }) => (
            <li key={label}>
              <a
                href={`#${id}`}
                onClick={scrollToSection(id)}
                className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span className="text-[#ff7a1a]">»</span> {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>

    <div className="max-w-7xl mx-auto mt-12 md:mt-16 pt-8 border-t border-white/5 text-center">
      <p className="text-gray-500 text-xs md:text-sm">
        © {new Date().getFullYear()}{" "}
        <span className="text-gray-300 font-bold">uthiYO</span>. All rights
        reserved.
        <br className="md:hidden" /> Developed by{" "}
        <span className="text-[#ff7a1a]">md.suman islam(MERN)</span>
      </p>
    </div>
  </footer>
);

export default Footer;