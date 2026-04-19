 import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-[#0f172a] text-white pt-16 pb-8 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        
        {/* --- Section 1: Logo & About --- */}
        <div className="space-y-6">
          <div className="flex items-center gap-1 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-tr from-[#ff8a00] to-[#ff5f00] rounded-xl flex items-center justify-center shadow-[0_5px_15px_rgba(255,138,0,0.4)]">
              <span className="text-white font-black text-2xl">U</span>
            </div>
            <div className="flex items-baseline">
              <span className="text-white text-2xl font-black tracking-tighter ml-1">uthi</span>
              <span className="text-[#ff8a00] text-3xl font-black italic">YO</span>
            </div>
          </div>
          <p className="text-gray-400 leading-relaxed max-w-sm">
            uthiYO হলো বাংলাদেশের উদীয়মান ই-স্পোর্টস প্ল্যাটফর্ম। আমরা গেমারদের দক্ষতা প্রদর্শনের এবং বড় পুরস্কার জেতার সুযোগ করে দিই। আজই আমাদের কমিউনিটিতে যোগ দিন।
          </p>
        </div>

        {/* --- Section 2: Contact Us --- */}
        <div>
          <h3 className="text-xl font-bold mb-6 border-l-4 border-[#ff8a00] pl-3">Contact Us</h3>
          <ul className="space-y-4">
            <li>
              <a href="#" className="flex items-center gap-3 text-gray-400 hover:text-[#ff8a00] transition-colors group">
                <span className="bg-white/5 p-2 rounded-lg group-hover:bg-[#ff8a00]/10">WhatsApp</span>
                <span className="text-sm">+880 1XXX-XXXXXX</span>
              </a>
            </li>
            <li>
              <a href="mailto:support@uthiyo.com" className="flex items-center gap-3 text-gray-400 hover:text-[#ff8a00] transition-colors group">
                <span className="bg-white/5 p-2 rounded-lg group-hover:bg-[#ff8a00]/10">Gmail</span>
                <span className="text-sm">support@uthiyo.com</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 text-gray-400 hover:text-[#ff8a00] transition-colors group">
                <span className="bg-white/5 p-2 rounded-lg group-hover:bg-[#ff8a00]/10">LinkedIn</span>
                <span className="text-sm">uthiYO Official</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 text-gray-400 hover:text-[#ff8a00] transition-colors group">
                <span className="bg-white/5 p-2 rounded-lg group-hover:bg-[#ff8a00]/10">Facebook</span>
                <span className="text-sm">facebook.com/uthiyo</span>
              </a>
            </li>
          </ul>
        </div>

        {/* --- Section 3: Navigation Links --- */}
        <div>
          <h3 className="text-xl font-bold mb-6 border-l-4 border-[#ff8a00] pl-3">Quick Links</h3>
          <ul className="grid grid-cols-2 md:grid-cols-1 gap-4">
            <li>
              <a href="#" className="text-gray-400 hover:text-white flex items-center gap-2">
                <span className="text-[#ff8a00]">»</span> হোম
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-400 hover:text-white flex items-center gap-2">
                <span className="text-[#ff8a00]">»</span> টুর্নামেন্ট
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-400 hover:text-white flex items-center gap-2">
                <span className="text-[#ff8a00]">»</span> আমাদের সম্পর্কে
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-400 hover:text-white flex items-center gap-2">
                <span className="text-[#ff8a00]">»</span> নিয়মাবলী
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-400 hover:text-white flex items-center gap-2">
                <span className="text-[#ff8a00]">»</span> প্রাইভেসি পলিসি
              </a>
            </li>
          </ul>
        </div>

      </div>

      {/* Copyright Bottom Bar */}
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 text-center">
        <p className="text-gray-500 text-sm">
          © {new Date().getFullYear()} <span className="text-gray-300 font-bold">uthiYO</span>. All rights reserved. 
          <br className="md:hidden" /> Developed by <span className="text-[#ff8a00]">md.suman islam(MERN)</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;