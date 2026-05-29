 import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const ClickableSlider = ({ slides }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const navigate = useNavigate();
  const sliderRef = useRef(null);

  // Auto Slide
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDragging) {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [slides.length, isDragging]);

  // Touch/Swipe Handlers
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setTranslateX(0);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    setTranslateX(currentX - startX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (translateX > 80 && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else if (translateX < -80 && currentIndex < slides.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
    setTranslateX(0);
  };

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
    <div className="relative w-full h-[200px] md:h-[220px] overflow-hidden rounded-3xl shadow-2xl border-4 border-white mx-auto select-none">
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
            className="min-w-full h-full relative cursor-pointer"
            onClick={() => handleClick(slide)}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {slide.title && (
              <div className="absolute bottom-5 left-5 right-5">
                <div className="bg-black/70 backdrop-blur-md text-white px-5 py-2.5 rounded-2xl text-base font-bold shadow-lg inline-block">
                  {slide.title}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progress Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
        {slides.map((_, idx) => (
          <div
            key={idx}
            onClick={() => goToSlide(idx)}
            className={`h-2.5 rounded-full transition-all cursor-pointer ${
              currentIndex === idx 
                ? "w-8 bg-white shadow-md" 
                : "w-2.5 bg-white/60 hover:bg-white/90"
            }`}
          />
        ))}
      </div>

      {/* Optional Arrows (Desktop) */}
      <button
        onClick={() => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)}
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white w-9 h-9 rounded-full items-center justify-center text-2xl z-30 transition"
      >
        ←
      </button>
      <button
        onClick={() => setCurrentIndex((prev) => (prev + 1) % slides.length)}
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white w-9 h-9 rounded-full items-center justify-center text-2xl z-30 transition"
      >
        →
      </button>
    </div>
  );
};

export default ClickableSlider;