import React, { useState, useEffect, useRef } from 'react';
import { AppImage } from '@/components/AppImage';
import { useTranslation } from '../../../i18n';

export const BannerSlider: React.FC<{ images?: string[], isLoading?: boolean }> = ({ images, isLoading }) => {
  const { t, dir, isRTL } = useTranslation();
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
      // diff > 0 means the finger travelled leftwards. In RTL the track advances
      // rightwards, so a leftward swipe goes back; in LTR it goes forward.
      const goToNext = isRTL ? diff < 0 : diff > 0;
      if (goToNext) {
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
      dir={dir}
    >
      <div
        className="flex w-full h-full transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(${(isRTL ? 1 : -1) * currentIndex * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {images.map((src, index) => (
          <AppImage
            key={index}
            src={src}
            alt={t('home.banner.headerAlt')}
            className="w-full h-full flex-shrink-0 select-none pointer-events-none"
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
