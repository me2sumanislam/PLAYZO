 // ClickableSlider.jsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const ClickableSlider = () => {
  const navigate = useNavigate();

  // ================== Beautiful YouTube Slides ==================
  const slides = [
    {
      image: "/image/slider/facebook1.png",
      title: "",
      subtitle: "",
      description: "",
      buttonText: "",
      link: "https://www.facebook.com/share/p/1B4qzJjBJR/"
    },
    {
      image: "/image/slider/ludo.png",
      // title: "Rank Push Tips 2026",
      // subtitle: "PRO GUIDE", 
      // description: "হিরোইক থেকে গ্র্যান্ড মাস্টারে যাওয়ার সেরা টেকনিক",
      // buttonText: "টিপস শিখুন",
      link: "#"
    },
    {
      image: "/image/slider/telegram.png",
      // title: "Grand Final Booyah Moments",
      // subtitle: "EPIC HIGHLIGHTS",
      // description: "গতকালের ফাইনাল ম্যাচের সেরা ক্লিপস",
      // buttonText: "হাইলাইটস দেখুন",
      link: ""
    },
    {
      image: "/image/slider/youtube.png",
      // title: "Funny Fails & Best Kills",
      // subtitle: "ENTERTAINMENT",
      // description: "মজার মুহূর্ত ও ওয়ান ট্যাপ কিল কম্পাইলেশন",
      // buttonText: "মজা দেখুন",
      link: "https://www.youtube.com/@Uthiyo-i5l"
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);

  const autoSlideRef = useRef(null);

  const resetAutoSlide = useCallback(() => {
    if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    autoSlideRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 4500); // 4.5 সেকেন্ড পর পর স্লাইড
  }, [slides.length]);

  useEffect(() => {
    resetAutoSlide();
    return () => clearInterval(autoSlideRef.current);
  }, [resetAutoSlide]);

  const handleTouchStart = useCallback((e) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setTranslateX(0);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    setTranslateX(e.touches[0].clientX - startX);
  }, [isDragging, startX]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;

    if (translateX > 70) {
      setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    } else if (translateX < -70) {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }

    setIsDragging(false);
    setTranslateX(0);
    resetAutoSlide();
  }, [translateX, isDragging, slides.length, resetAutoSlide]);

  const handleClick = (slide) => {
    if (Math.abs(translateX) > 15) return; // drag হলে ক্লিক হবে না
    if (slide.link) {
      window.open(slide.link, "_blank");
    }
  };

  const goToSlide = (idx) => {
    setCurrentIndex(idx);
    resetAutoSlide();
  };

  return (
    <div className="relative w-full overflow-hidden rounded-3xl shadow-2xl bg-black">
      {/* Slider Track */}
      <div
        className="flex"
        style={{
          transform: `translateX(calc(-${currentIndex * 100}% + ${translateX}px))`,
          transition: isDragging
            ? "none"
            : "transform 0.6s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className="min-w-full relative cursor-pointer select-none"
            onClick={() => handleClick(slide)}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full block"
              style={{
                aspectRatio: "16/7",
                objectFit: "cover",
                objectPosition: "center",
              }}
              draggable={false}
              loading={index === 0 ? "eager" : "lazy"}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/70 to-black/90" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10">
              {slide.subtitle && (
                <p className="text-orange-400 text-sm sm:text-base font-bold tracking-[2px] mb-2">
                  {slide.subtitle}
                </p>
              )}
              {slide.title && (
                <h2 className="text-white text-2xl sm:text-3xl md:text-4xl font-black leading-tight mb-4 drop-shadow-2xl">
                  {slide.title}
                </h2>
              )}
              {slide.description && (
                <p className="text-white/90 text-base sm:text-lg max-w-lg mb-6 leading-relaxed">
                  {slide.description}
                </p>
              )}
              {slide.buttonText && (
                <button className="bg-white hover:bg-orange-500 hover:text-white text-black font-bold px-10 py-3.5 rounded-2xl text-lg shadow-xl transition-all active:scale-95">
                  {slide.buttonText}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dot Indicators */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-3 z-30">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            className={`h-3 rounded-full transition-all duration-300 ${
              currentIndex === idx 
                ? "w-10 bg-white shadow-md" 
                : "w-3 bg-white/50 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ClickableSlider;