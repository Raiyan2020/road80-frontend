import { APP_LOGO_URL } from '../constants/images';
import { resolveMediaUrl } from './media-url';

type ListingLike = {
  images?: Array<string | File | Blob>;
  imageUrl?: string | File | Blob | null;
};

function isBlobLike(value: unknown): value is File | Blob {
  return value instanceof Blob || value instanceof File;
}

export function isLogoFallback(src: string): boolean {
  return src === APP_LOGO_URL;
}

export function getListingImageClassName(src: string, coverClass = 'object-cover'): string {
  return isLogoFallback(src)
    ? 'object-contain p-6 bg-pale/30 dark:bg-slate-800'
    : coverClass;
}

export function resolveListingImageSource(listing: ListingLike): string | File | Blob {
  const { imageUrl, images } = listing;

  if (isBlobLike(imageUrl)) {
    return imageUrl;
  }

  if (typeof imageUrl === 'string' && imageUrl.trim()) {
    return imageUrl === APP_LOGO_URL ? imageUrl : resolveMediaUrl(imageUrl);
  }

  if (images?.length) {
    const first = images[0];
    if (isBlobLike(first)) return first;
    if (typeof first === 'string' && first.trim()) {
      return first === APP_LOGO_URL ? first : resolveMediaUrl(first);
    }
  }

  return APP_LOGO_URL;
}

export function resolveListingImageUrl(listing: ListingLike): string {
  const source = resolveListingImageSource(listing);
  if (typeof source === 'string') return source;
  return URL.createObjectURL(source);
}
