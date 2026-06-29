import React, { useEffect, useState } from 'react';
import { APP_LOGO_URL } from '@/shared/constants/images';
import { getListingImageClassName } from '@/shared/utils/listing-image';
import { resolveMediaUrl } from '@/shared/utils/media-url';

export type AppImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  'src'
> & {
  src?: string | null;
  fallback?: string;
  coverClassName?: string;
  containOnFallback?: boolean;
};

function isUsingFallback(url: string, fallback: string): boolean {
  return url === fallback || url.endsWith('/logo-road.png');
}

function normalizeSrc(src?: string | null): string {
  if (!src?.trim()) return '';
  const trimmed = src.trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'null' || lower === 'undefined' || lower === 'false') return '';

  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) return trimmed;
  return resolveMediaUrl(trimmed);
}

export const AppImage: React.FC<AppImageProps> = ({
  src,
  fallback = APP_LOGO_URL,
  className = '',
  coverClassName = 'object-cover',
  containOnFallback = true,
  alt = '',
  onError,
  ...props
}) => {
  const normalized = normalizeSrc(src);
  const [currentSrc, setCurrentSrc] = useState(fallback);
  const [isFallback, setIsFallback] = useState(!normalized);
  const [isLoading, setIsLoading] = useState(Boolean(normalized));

  useEffect(() => {
    const next = normalizeSrc(src);
    if (!next) {
      setCurrentSrc(fallback);
      setIsFallback(true);
      setIsLoading(false);
      return;
    }

    setCurrentSrc(fallback);
    setIsFallback(false);
    setIsLoading(true);

    const image = new Image();
    image.onload = () => {
      setCurrentSrc(next);
      setIsFallback(false);
      setIsLoading(false);
    };
    image.onerror = () => {
      setCurrentSrc(fallback);
      setIsFallback(true);
      setIsLoading(false);
    };
    image.src = next;

    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [src, fallback]);

  const shouldUseFallbackStyle = isFallback || isLoading;
  const displayClass = containOnFallback && shouldUseFallbackStyle
    ? `${className} ${getListingImageClassName(fallback, coverClassName)}`.trim()
    : `${className} ${coverClassName}`.trim();

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!isUsingFallback(currentSrc, fallback)) {
      setCurrentSrc(fallback);
      setIsFallback(true);
    }
    setIsLoading(false);
    onError?.(e);
  };

  return (
    <img
      {...props}
      src={currentSrc}
      alt={alt}
      className={displayClass}
      onError={handleError}
    />
  );
};

export default AppImage;
