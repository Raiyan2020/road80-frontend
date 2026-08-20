import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { AppImage } from '@/components/AppImage';
import { useTranslation } from '../../../i18n';
import type { HomeFooter } from '@/shared/services/home.service';

export interface StaticBannerItem {
  id?: number;
  image: string;
  url?: string | null;
  link?: string | null;
  title?: string;
  button_action?: string;
  description?: string;
}

interface StaticBannerProps {
  images?: string[];
  banners?: (StaticBannerItem | HomeFooter)[];
  items?: (StaticBannerItem | HomeFooter)[];
  isLoading?: boolean;
  onBannerClick?: (item: StaticBannerItem, index: number) => void;
}

export const StaticBanner: React.FC<StaticBannerProps> = ({
  images,
  banners,
  items,
  isLoading,
  onBannerClick,
}) => {
  const { t, dir, isRTL } = useTranslation();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);

  const bannerItems: StaticBannerItem[] = useMemo(() => {
    const list = items || banners;
    if (list && list.length > 0) {
      return list.map((item) => ({
        id: item.id,
        image: item.image,
        url: item.url ?? (item as StaticBannerItem).link ?? null,
        title: item.title,
        button_action: (item as HomeFooter).button_action,
        description: (item as HomeFooter).description,
      }));
    }
    if (images && images.length > 0) {
      return images.map((img, idx) => ({
        id: idx,
        image: img,
      }));
    }
    return [];
  }, [items, banners, images]);

  useEffect(() => {
    if (bannerItems.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerItems.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [bannerItems.length]);

  const handleBannerClick = (item: StaticBannerItem, index: number) => {
    if (isSwiping.current) {
      return;
    }

    if (onBannerClick) {
      onBannerClick(item, index);
      return;
    }

    const targetUrl = item.url || item.link;
    if (targetUrl) {
      const trimmed = targetUrl.trim();
      if (/^(https?:\/\/|mailto:|tel:|wa\.me|\/\/)/i.test(trimmed)) {
        window.open(
          trimmed.startsWith('//') ? `https:${trimmed}` : trimmed,
          '_blank',
          'noopener,noreferrer'
        );
        return;
      }
      if (trimmed.startsWith('#')) {
        const cleanRoute = trimmed.replace(/^#\/?/, '/');
        navigate({ to: (cleanRoute.startsWith('/') ? cleanRoute : `/${cleanRoute}`) as any });
        return;
      }
      const route = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
      navigate({ to: route as any });
      return;
    }

    // Default fallback: If there is no URL provided, navigate to the explore page
    navigate({ to: '/explore' as any });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    isSwiping.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = Math.abs(touchStartX.current - e.touches[0].clientX);
    const diffY = Math.abs(touchStartY.current - e.touches[0].clientY);
    if (diffX > 8 || diffY > 8) {
      isSwiping.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || bannerItems.length === 0) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX.current - touchEndX;
    const elapsedTime = Date.now() - touchStartTime.current;

    if (Math.abs(diffX) > 40 && elapsedTime < 1000) {
      isSwiping.current = true;
      const goToNext = isRTL ? diffX < 0 : diffX > 0;
      if (goToNext) {
        setCurrentIndex((prev) => (prev + 1) % bannerItems.length);
      } else {
        setCurrentIndex((prev) => (prev - 1 + bannerItems.length) % bannerItems.length);
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;

    setTimeout(() => {
      isSwiping.current = false;
    }, 150);
  };

  if (isLoading) {
    return (
      <div className="w-full aspect-[2.5/1] bg-pale/30 dark:bg-slate-800 rounded-2xl animate-pulse" />
    );
  }

  if (bannerItems.length === 0) {
    return null;
  }

  return (
    <div
      className="w-full aspect-[2.5/1] relative overflow-hidden rounded-2xl shadow-sm touch-pan-y bg-gray-100 dark:bg-slate-800 select-none"
      dir={dir}
    >
      <div
        className="flex w-full h-full transition-transform duration-500 ease-in-out cursor-pointer"
        style={{ transform: `translateX(${(isRTL ? 1 : -1) * currentIndex * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {bannerItems.map((item, index) => (
          <div
            key={item.id ?? index}
            onClick={() => handleBannerClick(item, index)}
            className="w-full h-full flex-shrink-0 relative cursor-pointer group"
            role="button"
            tabIndex={0}
            aria-label={item.title || t('home.banner.footerAlt')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleBannerClick(item, index);
              }
            }}
          >
            <AppImage
              src={item.image}
              alt={item.title || t('home.banner.footerAlt')}
              className="w-full h-full pointer-events-none select-none opacity-90 dark:opacity-80 flex-shrink-0 transition-transform duration-300 group-hover:scale-[1.01]"
            />
          </div>
        ))}
      </div>
      {bannerItems.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
          {bannerItems.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(i);
              }}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentIndex === i ? 'bg-blue w-4' : 'bg-white/50 w-1.5 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
