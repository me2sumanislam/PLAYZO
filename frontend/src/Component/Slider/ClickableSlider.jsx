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
      }, 5000);
    };

    startAutoSlide();

    return () => clearInterval(autoSlideRef.current);
  }, [slides.length, isDragging]);

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
    <div className="relative w-full h-[320px] sm:h-[380px] md:h-[420px] overflow-hidden rounded-3xl shadow-2xl">
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
            {/* Full Banner Image */}
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />

            {/* Very Strong Gradient Overlay (Text স্পষ্ট করার জন্য) */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/70 to-black/90" />

            {/* Main Content - Full Banner Style */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10">
              {slide.subtitle && (
                <p className="text-yellow-300 text-lg sm:text-xl font-medium tracking-widest mb-2">
                  {slide.subtitle}
                </p>
              )}

              <h2 className="text-white text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.1] mb-4 drop-shadow-2xl">
                {slide.title}
              </h2>

              {slide.description && (
                <p className="text-white/95 text-lg sm:text-xl font-medium max-w-[320px] mb-6 leading-tight">
                  {slide.description}
                </p>
              )}

              {slide.buttonText && (
                <button className="bg-white hover:bg-yellow-400 text-black font-bold px-10 py-4 rounded-2xl text-lg shadow-2xl transition-all active:scale-95">
                  {slide.buttonText}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-30">
        {slides.map((_, idx) => (
          <div
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-3 rounded-full cursor-pointer transition-all ${
              currentIndex === idx ? "w-11 bg-white" : "w-3 bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ClickableSlider;