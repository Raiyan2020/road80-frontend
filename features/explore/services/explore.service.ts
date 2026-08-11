import api from '@/lib/api-client';
import { Listing, ListingSchema } from '@/lib/types';
import { APP_LOGO_URL } from '@/shared/constants/images';
import { resolveMediaUrl } from '@/shared/utils/media-url';
import { ExploreFilters, ExploreResponse, ExploreRawAd } from '../types';
import { t } from '@/i18n';
import { isPropertyTypeCategory, isListingTypeCategory } from '@/shared/utils/category-match';

/**
 * Serialize filters the way the PHP backend expects: array values repeat the
 * key with a `[]` suffix (`category_value_id[]=3&category_value_id[]=1`).
 *
 * ofetch's `query` option emits repeated *bare* keys instead
 * (`category_value_id=3&category_value_id=1`), which PHP collapses to the LAST
 * value — so a multi-select filter silently applied only one id. We build the
 * string here and hand ofetch a finished URL, which also keeps the brackets
 * literal; ofetch would percent-encode them to `%5B%5D`.
 */
function buildQueryString(params: Record<string, unknown>): string {
  const parts: string[] = [];

  const push = (key: string, value: unknown) => {
    if (value === undefined || value === null || value === '') return;
    parts.push(`${key}=${encodeURIComponent(String(value))}`);
  };

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      // Empty array => no params at all, so an unset filter stays unset.
      value.forEach((item) => push(`${encodeURIComponent(key)}[]`, item));
    } else {
      push(encodeURIComponent(key), value);
    }
  }

  return parts.join('&');
}

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
      : {};

    const queryString = buildQueryString(cleanParams);
    const url = queryString ? `/explore?${queryString}` : '/explore';

    const response = await api.get<ExploreResponse>(url);
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
  const categoryName = (category: ExploreRawAd['categories'][number]) =>
    category.name || category.category_name || '';
  const categoryValue = (category: ExploreRawAd['categories'][number]) =>
    category.value || category.category_value_name || '';
  const categorySlug = (category: ExploreRawAd['categories'][number]) =>
    category.slug || category.category_slug;

  const propertyCategory = raw.categories?.find((category) =>
    isPropertyTypeCategory(categorySlug(category), categoryName(category)),
  );
  const listingCategory = raw.categories?.find((category) =>
    isListingTypeCategory(categorySlug(category), categoryName(category)),
  );

  const propertyAnswer = raw.answers?.find((a) =>
    isPropertyTypeCategory(a.category_slug, a.category_name),
  );
  const listingAnswer = raw.answers?.find((a) =>
    isListingTypeCategory(a.category_slug, a.category_name),
  );

  // Broad search for property type in answers or categories
  const propertyType =
    propertyAnswer?.category_value_name ||
    (propertyCategory ? categoryValue(propertyCategory) : '') ||
    (raw.categories?.[0] ? categoryValue(raw.categories[0]) : '') ||
    '';

  const listingType =
    listingAnswer?.category_value_name ||
    (listingCategory ? categoryValue(listingCategory) : '') ||
    '';

  // Format price with regex commas (Source Parity)
  //
  // The currency token is baked into the string here, at map time, so it is
  // only correct as long as the queries feeding this mapper are keyed by
  // language — otherwise a cached listing keeps the previous language's token.
  // Grouping stays a regex rather than Intl.NumberFormat on purpose:
  // Intl.NumberFormat('ar') yields Arabic-Indic digits (١٢٣), which would
  // change existing Arabic rendering. Kuwait uses Western digits.
  const numericPriceStr = raw.price.toString().replace(/[^\d.]/g, '');
  const numericPrice = parseFloat(numericPriceStr) || 0;
  const formattedPrice =
    numericPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ' + t('common.currency');

  const hasVideo =
    raw.image?.type === 'video' || isVideoFile(raw.image?.file);

  const imageFile = raw.image?.file ? resolveMediaUrl(raw.image.file) : '';

  return ListingSchema.parse({
    id: raw.id,
    title: raw.title,
    price: formattedPrice,
    country: raw.country_name,
    governorate: raw.state_name,
    area: raw.city_name,
    images: imageFile ? [imageFile] : [APP_LOGO_URL],
    imageUrl: imageFile || APP_LOGO_URL,
    video: hasVideo && imageFile ? imageFile : undefined,
    listingType: listingType,
    propertyType: propertyType,
    description:
      raw.description || [
        // Both sides are nullable now — interpolating them raw put a literal
        // "null: null" into the searchable description.
        raw.answers
          ?.filter((a) => a.category_name || a.category_value_name)
          .map((a) => `${a.category_name ?? ''}: ${a.category_value_name ?? ''}`)
          .join(' | '),
        raw.categories?.map((c) => `${categoryName(c)}: ${categoryValue(c)}`).join(' | '),
      ]
        .filter(Boolean)
        .join(' || ') || undefined,
    isLiked: Boolean(raw.is_liked),
    likesCount: raw.likes_count || 0,
    watchCount: raw.watch_count || raw.views || 0,
    status: raw.status,
  });
}
