 import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const ClickableSlider = ({ slides }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);

  const navigate = useNavigate();
  const autoSlideRef = useRef(null);

  // Auto Slide
  useEffect(() => {
    const startAutoSlide = () => {
      if (autoSlideRef.current) clearInterval(autoSlideRef.current);

      autoSlideRef.current = setInterval(() => {
        if (!isDragging) {
          setCurrentIndex((prev) => (prev + 1) % slides.length);
        }
      }, 4500);
    };

    startAutoSlide();

    return () => clearInterval(autoSlideRef.current);
  }, [slides.length, isDragging]);

  // Touch Handlers
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

    if (translateX > 80 && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else if (translateX < -80 && currentIndex < slides.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }

    setIsDragging(false);
    setTranslateX(0);
  }, [translateX, currentIndex, slides.length]);

  const handleClick = (slide) => {
    if (slide.link) {
      slide.link.startsWith("http")
        ? window.open(slide.link, "_blank")
        : navigate(slide.link);
    }
  };

  return (
    <div className="relative w-full h-[260px] sm:h-[300px] md:h-[350px] overflow-hidden rounded-3xl shadow-2xl">
      <div
        className="flex h-full transition-transform duration-700 ease-out"
        style={{
          transform: `translateX(calc(-${currentIndex * 100}% + ${translateX}px))`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className="min-w-full h-full relative cursor-pointer"
            onClick={() => handleClick(slide)}
          >
            {/* Banner Image */}
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />

            {/* Beautiful Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/80" />

            {/* Centered Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-5 z-10">
              {slide.subtitle && (
                <p className="text-white/90 text-sm sm:text-base tracking-widest mb-1">
                  {slide.subtitle}
                </p>
              )}

              <h2 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-3 drop-shadow-xl">
                {slide.title}
              </h2>

              {slide.description && (
                <p className="text-white/80 text-[15px] max-w-[260px] mb-5">
                  {slide.description}
                </p>
              )}

              {slide.buttonText && (
                <button className="mt-2 bg-white hover:bg-yellow-400 text-black font-semibold px-8 py-3 rounded-full text-sm transition-all active:scale-95 shadow-lg">
                  {slide.buttonText}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Progress Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {slides.map((_, idx) => (
          <div
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-[5px] rounded-full cursor-pointer transition-all ${
              currentIndex === idx ? "w-9 bg-white" : "w-[5px] bg-white/60"
            }`}
          />
        ))}
      </div>

      {/* Optional Desktop Arrows */}
      <button
        onClick={() => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)}
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-9 h-9 rounded-full items-center justify-center text-2xl z-30"
      >
        ←
      </button>
      <button
        onClick={() => setCurrentIndex((prev) => (prev + 1) % slides.length)}
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-9 h-9 rounded-full items-center justify-center text-2xl z-30"
      >
        →
      </button>
    </div>
  );
};

export default ClickableSlider;