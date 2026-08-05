 import React, { useState } from "react";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  const links = [
    { name: "হোম", href: "#home" },
    { name: "ফিচার", href: "#features" },
    { name: "টুর্নামেন্ট", href: "#tournaments" },
    { name: "ডাউনলোড", href: "#home" },
  ];

  return (
    <nav className="bg-[#0b0b14] border-b border-[#ff7a1a]/10 sticky top-0 z-50">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&display=swap');
          .font-arena { font-family: 'Rajdhani', sans-serif; }
        `}
      </style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Brand */}
          <a href="#home" className="flex items-center gap-2 group flex-shrink-0">
            <div
              className="w-9 h-9 md:w-10 md:h-10 bg-[#ff7a1a] flex items-center justify-center font-black text-[#0b0b14] text-lg md:text-xl"
              style={{ clipPath: "polygon(0 0, 100% 0, 100% 75%, 85% 100%, 0 100%)" }}
            >
              U
            </div>
            <span className="font-arena text-white font-bold text-xl md:text-2xl tracking-wide">
              uthi<span className="text-[#ff7a1a]">YO</span>
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <a
                key={l.name}
                href={l.href}
                className="font-arena text-gray-300 hover:text-[#ff7a1a] text-sm font-bold tracking-widest uppercase transition-colors"
              >
                {l.name}
              </a>
            ))}
            <a
              href="#membership"
              className="font-arena bg-[#ff7a1a] text-white font-bold text-sm tracking-widest uppercase px-5 py-2 hover:bg-[#f0700f] transition-colors"
              style={{ clipPath: "polygon(0 0, 100% 0, 100% 75%, 88% 100%, 0 100%)" }}
            >
              মেম্বারশিপ
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            className="md:hidden inline-flex items-center justify-center w-10 h-10 text-white hover:text-[#ff7a1a] transition-colors"
          >
            {open ? (
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      <div
        className={`${
          open ? "max-h-96 opacity-100 py-5" : "max-h-0 opacity-0"
        } md:hidden overflow-hidden transition-all duration-300 ease-in-out bg-[#0b0b14] border-t border-[#ff7a1a]/10`}
      >
        <div className="flex flex-col items-center gap-1 px-4">
          {links.map((l) => (
            <a
              key={l.name}
              href={l.href}
              onClick={() => setOpen(false)}
              className="font-arena w-full text-center text-white text-base font-bold tracking-widest uppercase py-3 hover:text-[#ff7a1a] transition-colors"
            >
              {l.name}
            </a>
          ))}
          <a
            href="#membership"
            onClick={() => setOpen(false)}
            className="font-arena mt-2 w-full text-center bg-[#ff7a1a] text-white font-bold text-sm tracking-widest uppercase py-3"
          >
            মেম্বারশিপ
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;