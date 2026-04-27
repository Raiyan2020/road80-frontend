import api from '@/lib/api-client';
import { Listing, ListingSchema } from '@/lib/types';
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

  return ListingSchema.parse({
    id: raw.id,
    title: raw.title,
    price: formattedPrice,
    governorate: raw.state_name,
    area: raw.city_name,
    images: raw.image?.file ? [raw.image.file] : [],
    listingType: listingType,
    propertyType: propertyType,
    isLiked: Boolean(raw.is_liked),
    likesCount: raw.likes_count || 0,
    watchCount: raw.watch_count || raw.views || 0,
  });
}
