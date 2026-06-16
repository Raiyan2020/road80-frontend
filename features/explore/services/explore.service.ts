import api from '@/lib/api-client';
import { Listing, ListingSchema } from '@/lib/types';
import { APP_LOGO_URL } from '@/shared/constants/images';
import { resolveMediaUrl } from '@/shared/utils/media-url';
import { ExploreFilters, ExploreResponse, ExploreRawAd } from '../types';

/**
 * Fetch explore/search listings with filters and pagination.
 */
export async function fetchExploreFeed(params?: ExploreFilters): Promise<ExploreResponse | null> {
  try {
    // Strip undefined/empty values so they don't appear in the query string
    const cleanParams = params
      ? Object.fromEntries(
          Object.entries(params).filter(
            ([, v]) => v !== undefined && v !== '' && v !== null
          )
        )
      : undefined;

    const response = await api.get<ExploreResponse>('/explore', { query: cleanParams });
    if (!response.status || !response.data) return null;

    return response;
  } catch (error) {
    return null;
  }
}

/**
 * Maps Raw Explore Ad to our internal Listing schema.
 * Handles both 'answers' (legacy/detailed) and 'categories' (shorthand) response formats.
 */
const isVideoFile = (file?: string) => {
  if (!file) return false;
  const lower = file.toLowerCase();
  return (
    lower.endsWith('.mp4') ||
    lower.endsWith('.mov') ||
    lower.endsWith('.avi') ||
    lower.endsWith('.webm')
  );
};

export function listingHasVideo(
  listing: Pick<Listing, 'video' | 'images'>,
): boolean {
  if (listing.video) return true;

  const firstImage = listing.images?.[0];
  if (typeof firstImage === 'string') {
    return isVideoFile(firstImage);
  }

  return false;
}

export function mapRawExploreToListing(raw: ExploreRawAd): Listing {
  // Broad search for property type in answers or categories
  const propertyType = 
    raw.answers?.find((a) => a.category_name?.trim() === 'نوع العقار')?.category_value_name ||
    raw.categories?.find((c) => c.name?.trim() === 'نوع العقار')?.value ||
    raw.categories?.[0]?.value ||
    '';

  const listingType = 
    raw.answers?.find((a) => a.category_name?.trim() === 'نوع الإعلان')?.category_value_name ||
    raw.categories?.find((c) => c.name?.trim() === 'نوع الإعلان')?.value ||
    '';

  // Format price with regex commas (Source Parity)
  const numericPriceStr = raw.price.toString().replace(/[^\d.]/g, '');
  const numericPrice = parseFloat(numericPriceStr) || 0;
  const formattedPrice = numericPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' د.ك';

  const hasVideo =
    raw.image?.type === 'video' || isVideoFile(raw.image?.file);

  const imageFile = raw.image?.file ? resolveMediaUrl(raw.image.file) : '';

  return ListingSchema.parse({
    id: raw.id,
    title: raw.title,
    price: formattedPrice,
    governorate: raw.state_name,
    area: raw.city_name,
    images: imageFile ? [imageFile] : [APP_LOGO_URL],
    imageUrl: imageFile || APP_LOGO_URL,
    video: hasVideo && imageFile ? imageFile : undefined,
    listingType: listingType,
    propertyType: propertyType,
    isLiked: Boolean(raw.is_liked),
    likesCount: raw.likes_count || 0,
    watchCount: raw.watch_count || raw.views || 0,
    status: raw.status,
  });
}
