 // ClickableSlider.jsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const ClickableSlider = ({ slides }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);

  const navigate = useNavigate();
  const autoSlideRef = useRef(null);

  const resetAutoSlide = useCallback(() => {
    if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    autoSlideRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
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

  const handleTouchMove = useCallback(
    (e) => {
      if (!isDragging) return;
      setTranslateX(e.touches[0].clientX - startX);
    },
    [isDragging, startX]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    if (translateX > 60) {
      setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    } else if (translateX < -60) {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }
    setIsDragging(false);
    setTranslateX(0);
    resetAutoSlide();
  }, [translateX, isDragging, slides.length, resetAutoSlide]);

  const handleClick = (slide) => {
    if (Math.abs(translateX) > 10) return;
    if (slide.link) {
      slide.link.startsWith("http")
        ? window.open(slide.link, "_blank")
        : navigate(slide.link);
    }
  };

  const goToSlide = (idx) => {
    setCurrentIndex(idx);
    resetAutoSlide();
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-xl bg-black">
      {/* Slider Track */}
      <div
        className="flex"
        style={{
          transform: `translateX(calc(-${currentIndex * 100}% + ${translateX}px))`,
          transition: isDragging
            ? "none"
            : "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
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
              alt={slide.title || `Slide ${index + 1}`}
              className="w-full block"
              style={{
                aspectRatio: "16/7",
                objectFit: "cover",
                objectPosition: "center",
              }}
              draggable={false}
              loading={index === 0 ? "eager" : "lazy"}
            />

            {/* Text overlay — শুধু text থাকলে দেখাবে */}
            {(slide.title || slide.subtitle || slide.description || slide.buttonText) && (
              <>
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black/90" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10">
                  {slide.subtitle && (
                    <p className="text-yellow-300 text-sm sm:text-base font-medium tracking-widest mb-1">
                      {slide.subtitle}
                    </p>
                  )}
                  {slide.title && (
                    <h2 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-3 drop-shadow-2xl">
                      {slide.title}
                    </h2>
                  )}
                  {slide.description && (
                    <p className="text-white/90 text-sm sm:text-base max-w-xs mb-4 leading-snug">
                      {slide.description}
                    </p>
                  )}
                  {slide.buttonText && (
                    <button className="bg-white hover:bg-yellow-400 text-black font-bold px-8 py-3 rounded-2xl text-base shadow-xl transition-all active:scale-95">
                      {slide.buttonText}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Dot Indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-30">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              currentIndex === idx ? "w-8 bg-white" : "w-2 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ClickableSlider;