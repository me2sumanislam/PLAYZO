 import React, { useState } from 'react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  // লিঙ্কগুলো আইডি অনুযায়ী আপডেট করা হয়েছে
  const menuItems = [
    { name: 'হোম', href: '#home' },
    { name: 'ফিচার', href: '#features' },
    { name: 'টুর্নামেন্ট', href: '#tournaments' },
    { name: 'ডাউনলোড', href: '#home' },
  ];

  return (
    <nav className="bg-[#0f172a] border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* uthiYO Logo Section */}
          <div className="relative flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-[#ff8a00] blur-md opacity-20 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative bg-[#0f172a] border-2 border-[#ff8a00] px-3 py-1 rounded-tr-2xl rounded-bl-2xl rotate-[-2deg] shadow-lg">
                <span className="text-white font-black text-2xl tracking-tight">
                  uthi<span className="text-[#ff8a00]">YO</span>
                </span>
              </div>
            </div>
          </div>
          
          {/* Membership Section (ক্লিক করলে মেম্বারশিপ সেকশনে যাবে) */}
          <a href="#membership" className="flex-shrink-0 flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 bg-[#ff8a00] rounded-lg flex items-center justify-center font-bold text-white shadow-lg transition-transform group-active:scale-90">
              MS
            </div>
            <span className="text-white font-bold text-xl tracking-tight hidden sm:block">
              MemberShip
            </span>
          </a>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {menuItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-300 hover:text-[#ff8a00] px-3 py-2 font-medium transition-colors"
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white/10 focus:outline-none"
            >
              {isOpen ? (
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
      </div>

      {/* Mobile Menu Content (Centered) */}
      <div 
        className={`${
          isOpen ? 'max-h-80 opacity-100 py-6' : 'max-h-0 opacity-0'
        } md:hidden overflow-hidden transition-all duration-300 ease-in-out bg-[#1e293b]`}
      >
        <div className="flex flex-col items-center space-y-4">
          {menuItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="text-white text-lg font-bold hover:text-[#ff8a00] transition-colors w-full text-center py-2"
            >
              {item.name}
            </a>
          ))}
          {/* Mobile Membership Link */}
          <a
            href="#membership"
            onClick={() => setIsOpen(false)}
            className="text-[#ff8a00] text-lg font-black w-full text-center py-2 border-t border-white/5"
          >
            MemberShip
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;