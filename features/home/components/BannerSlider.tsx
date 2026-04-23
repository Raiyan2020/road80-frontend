import React, { useState, useEffect, useRef } from 'react';

export const BannerSlider: React.FC<{ images?: string[], isLoading?: boolean }> = ({ images, isLoading }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!images || images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [images]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || !images) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff < 0) {
        setCurrentIndex(prev => (prev + 1) % images.length);
      } else {
        setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
      }
    }
    touchStartX.current = null;
  };

  if (isLoading) {
    return (
      <div className="w-full aspect-[2.5/1] bg-pale/30 dark:bg-slate-800 rounded-2xl animate-pulse" />
    );
  }

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div
      className="w-full aspect-[2.5/1] relative overflow-hidden rounded-2xl touch-pan-y shadow-sm"
      dir="rtl"
    >
      <div
        className="flex w-full h-full transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(${currentIndex * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {images.map((src, index) => (
          <img
            key={index}
            src={src}
            alt="Banner"
            className="w-full h-full object-cover flex-shrink-0 select-none pointer-events-none"
          />
        ))}
      </div>
      {images.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
          {images.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                currentIndex === i ? 'bg-blue w-4' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
