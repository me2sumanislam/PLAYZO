 import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const ClickableSlider = ({ slides }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  
  const navigate = useNavigate();
  const sliderRef = useRef(null);
  const autoSlideRef = useRef(null);

  // Auto Slide with Pause on Hover/Drag
  useEffect(() => {
    const startAutoSlide = () => {
      if (autoSlideRef.current) clearInterval(autoSlideRef.current);

      autoSlideRef.current = setInterval(() => {
        if (!isDragging) {
          setCurrentIndex((prev) => (prev + 1) % slides.length);
        }
      }, 4000);
    };

    startAutoSlide();

    return () => {
      if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    };
  }, [slides.length, isDragging]);

  // Touch Handlers
  const handleTouchStart = useCallback((e) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setTranslateX(0);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    setTranslateX(diff);
  }, [isDragging, startX]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;

    let newIndex = currentIndex;

    if (translateX > 80 && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (translateX < -80 && currentIndex < slides.length - 1) {
      newIndex = currentIndex + 1;
    }

    setCurrentIndex(newIndex);
    setIsDragging(false);
    setTranslateX(0);
  }, [translateX, currentIndex, slides.length]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const handleClick = (slide) => {
    if (slide.link) {
      if (slide.link.startsWith("http")) {
        window.open(slide.link, "_blank");
      } else {
        navigate(slide.link);
      }
    }
  };

  return (
    <div 
      className="relative w-full h-[280px] md:h-[320px] overflow-hidden rounded-3xl"
      onMouseEnter={() => setIsDragging(true)}   // Pause on hover
      onMouseLeave={() => setIsDragging(false)}
    >
      <div
        ref={sliderRef}
        className="flex h-full transition-transform duration-500 ease-out"
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
            className="min-w-full h-full relative cursor-pointer select-none"
            onClick={() => handleClick(slide)}
          >
            <img
              src={slide.image}
              alt={slide.alt || slide.title}
              className="w-full h-full object-cover bg-[#0a0a0a]"
              loading="lazy"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Title */}
            {slide.title && (
              <div className="absolute bottom-6 left-5 right-5">
                <div className="bg-black/70 backdrop-blur-md text-white px-6 py-3 rounded-2xl text-[17px] font-semibold shadow-xl inline-block">
                  {slide.title}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progress Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-30">
        {slides.map((_, idx) => (
          <div
            key={idx}
            onClick={() => goToSlide(idx)}
            className={`h-2.5 rounded-full transition-all cursor-pointer ${
              currentIndex === idx
                ? "w-9 bg-white"
                : "w-2.5 bg-white/60 hover:bg-white/90"
            }`}
          />
        ))}
      </div>

      {/* Navigation Arrows (Desktop) */}
      <button
        onClick={() => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)}
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white w-10 h-10 rounded-full items-center justify-center text-3xl z-30 transition-all"
      >
        ←
      </button>

      <button
        onClick={() => setCurrentIndex((prev) => (prev + 1) % slides.length)}
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white w-10 h-10 rounded-full items-center justify-center text-3xl z-30 transition-all"
      >
        →
      </button>
    </div>
  );
};

export default ClickableSlider;