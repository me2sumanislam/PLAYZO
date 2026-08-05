 import React from "react";

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
          <li>
            <a href="#" className="flex items-center gap-3 text-gray-400 hover:text-[#ff7a1a] transition-colors">
              <span className="text-[#a78bfa]">WhatsApp</span> +880 1XXX-XXXXXX
            </a>
          </li>
          <li>
            <a href="mailto:support@uthiyo.com" className="flex items-center gap-3 text-gray-400 hover:text-[#ff7a1a] transition-colors">
              <span className="text-[#a78bfa]">Gmail</span> support@uthiyo.com
            </a>
          </li>
          <li>
            <a href="https://www.youtube.com/@Uthiyo-i5l" className="flex items-center gap-3 text-gray-400 hover:text-[#ff7a1a] transition-colors">
              <span className="text-[#a78bfa]">YouTube</span> uthiYO Official
            </a>
          </li>
          <li>
            <a href="https://www.facebook.com/share/p/1B4qzJjBJR/" className="flex items-center gap-3 text-gray-400 hover:text-[#ff7a1a] transition-colors">
              <span className="text-[#a78bfa]">Facebook</span> Facebook Page
            </a>
          </li>
        </ul>
      </div>

      {/* Quick links */}
      <div>
        <h3 className="font-arena text-lg font-bold mb-5 border-l-2 border-[#ff7a1a] pl-3 uppercase tracking-wide">
          কুইক লিংক
        </h3>
        <ul className="grid grid-cols-2 md:grid-cols-1 gap-3 text-sm">
          {["হোম", "টুর্নামেন্ট", "আমাদের সম্পর্কে", "নিয়মাবলী", "প্রাইভেসি পলিসি"].map(
            (t) => (
              <li key={t}>
                <a href="#" className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
                  <span className="text-[#ff7a1a]">»</span> {t}
                </a>
              </li>
            )
          )}
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