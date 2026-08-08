 // ClickableSlider.jsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ✅ কোনো slides prop না পাঠালে এই default গুলো ব্যবহার হবে
const DEFAULT_SLIDES = [
  {
    image: "/frontend/public/image/slider/facebook.png",
    // title: "",
    // subtitle: "",
    // description: "",
    // buttonText: "",
    link: "https://www.facebook.com/profile.php?id=61588947116893"
  },
  {
    image: "/frontend/public/image/slider/telegramjoin.png",
    link: "https://t.me/uthiyocommunity"
  },
  {
    image: "/frontend/public/image/slider/youtubejoin.png",
    link: "https://www.youtube.com/@Uthiyo-i5l"
  }
];

const ClickableSlider = ({ slides: slidesProp }) => {
  const navigate = useNavigate();

  // ✅ FIX: প্রপ হিসেবে slides পাঠালে সেটাই ব্যবহার হবে,
  // না পাঠালে default hardcoded slides ব্যবহার হবে
  const slides =
    Array.isArray(slidesProp) && slidesProp.length > 0
      ? slidesProp
      : DEFAULT_SLIDES;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  // ✅ কোন কোন ছবি লোড করতে fail করেছে সেটা ট্র্যাক করার জন্য
  const [failedImages, setFailedImages] = useState({});

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
    if (slide.link && slide.link !== "#") {
      window.open(slide.link, "_blank");
    }
  };

  const goToSlide = (idx) => {
    setCurrentIndex(idx);
    resetAutoSlide();
  };

  // ✅ কোনো ছবি লোড fail করলে exact URL সহ console এ error দেখাবে
  // (Live সাইটে F12 > Console খুলে দেখুন কোন path fail করছে —
  // সাধারণত case-sensitivity mismatch এর কারণে এটা হয়)
  const handleImageError = (index, src) => {
    console.error(`❌ Slider image failed to load: ${src}`);
    setFailedImages((prev) => ({ ...prev, [index]: true }));
  };

  return (
    <div className="relative w-full overflow-hidden rounded-3xl shadow-lg bg-white border border-gray-200">
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
            className="min-w-full relative cursor-pointer select-none bg-gray-50"
            onClick={() => handleClick(slide)}
          >
            {failedImages[index] ? (
              // ✅ ছবি fail করলে blank না দেখিয়ে একটা visible placeholder দেখাবে
              <div
                className="w-full flex items-center justify-center text-gray-400 text-sm"
                style={{ height: "clamp(180px, 25vw, 260px)" }}
              >
                ছবি লোড হয়নি: {slide.image}
              </div>
            ) : (
              <img
                src={slide.image}
                alt={slide.title || "slide"}
                className="w-full block"
                style={{
                  width: "100%",
                  height: "clamp(180px, 25vw, 260px)",
                  objectFit: "cover",
                  objectPosition: "center",
                }}
                draggable={false}
                loading={index === 0 ? "eager" : "lazy"}
                onError={() => handleImageError(index, slide.image)}
              />
            )}

            {/* ✅ Light theme overlay — শুধু নিচের দিকে হালকা সাদা আভা,
                যাতে টেক্সট থাকলে পড়া যায় কিন্তু ছবি অন্ধকার না দেখায় */}
            {(slide.title || slide.description || slide.buttonText) && (
              <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/10 to-transparent" />
            )}

            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10">
              {slide.subtitle && (
                <p className="text-orange-500 text-sm sm:text-base font-bold tracking-[2px] mb-2">
                  {slide.subtitle}
                </p>
              )}
              {slide.title && (
                <h2 className="text-gray-900 text-2xl sm:text-3xl md:text-4xl font-black leading-tight mb-4 drop-shadow-sm">
                  {slide.title}
                </h2>
              )}
              {slide.description && (
                <p className="text-gray-700 text-base sm:text-lg max-w-lg mb-6 leading-relaxed">
                  {slide.description}
                </p>
              )}
              {slide.buttonText && (
                <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 py-3.5 rounded-2xl text-lg shadow-md transition-all active:scale-95">
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
                ? "w-10 bg-orange-500 shadow-md"
                : "w-3 bg-gray-300 hover:bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ClickableSlider;