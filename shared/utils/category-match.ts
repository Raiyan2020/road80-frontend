/**
 * Classifying API categories by language-independent key.
 *
 * The backend localizes `category_name` via the `Accept-Language` header we now
 * send, so any code that classifies a category by its NAME breaks as soon as the
 * UI is not Arabic. Categories carry a stable `slug` (`property-type`,
 * `ad-type`) — that is what we match on.
 *
 * The name lists are a COMPATIBILITY FALLBACK for responses from a backend that
 * predates `category_slug` in its ad resources. They deliberately cover both
 * languages so the fallback is not itself language-dependent. These are NOT UI
 * copy and must not be routed through i18n.
 */

export const PROPERTY_TYPE_SLUG = 'property-type';
export const LISTING_TYPE_SLUG = 'ad-type';

export const PROPERTY_TYPE_NAMES = ['نوع العقار', 'Property Type'];
export const LISTING_TYPE_NAMES = [
  'نوع الإعلان',
  'نوع التعاقد',
  'Ad Type',
  'Listing Type',
  'Contract Type',
];

const normalize = (value?: string | null) => (value ?? '').trim().toLowerCase();

/** Slug match when a slug is present; otherwise a bilingual name match. */
export function matchesCategory(
  slug: string | null | undefined,
  name: string | null | undefined,
  wantSlug: string,
  wantNames: string[],
): boolean {
  const knownCoreNames = [...PROPERTY_TYPE_NAMES, ...LISTING_TYPE_NAMES];
  const hasKnownCoreName = knownCoreNames.some(
    (candidate) => normalize(candidate) === normalize(name),
  );

  // A recognized label is stronger evidence than the slug. Some production
  // records historically had the two core slugs assigned to the opposite
  // categories; trusting those slugs swaps property/contract throughout the UI.
  if (hasKnownCoreName) {
    return wantNames.some((candidate) => normalize(candidate) === normalize(name));
  }

  if (slug) return normalize(slug) === wantSlug;
  return wantNames.some((candidate) => normalize(candidate) === normalize(name));
}

export const isPropertyTypeCategory = (
  slug: string | null | undefined,
  name: string | null | undefined,
) => matchesCategory(slug, name, PROPERTY_TYPE_SLUG, PROPERTY_TYPE_NAMES);

export const isListingTypeCategory = (
  slug: string | null | undefined,
  name: string | null | undefined,
) => matchesCategory(slug, name, LISTING_TYPE_SLUG, LISTING_TYPE_NAMES);

type CategoryIdentity = {
  slug?: string | null;
  name?: string | null;
};

/**
 * Resolve the two core filters by their human label first. Production data has
 * the `property-type` and `ad-type` slugs assigned to the opposite categories,
 * so treating those slugs as authoritative swaps property and contract values.
 * The slug remains a compatibility fallback for payloads without a known name.
 */
function findCategoryByNameThenSlug<T extends CategoryIdentity>(
  categories: T[],
  names: string[],
  slug: string,
): T | undefined {
  return categories.find((category) =>
    names.some((candidate) => normalize(candidate) === normalize(category.name)),
  ) ?? categories.find((category) => normalize(category.slug) === slug);
}

export const findPropertyTypeCategory = <T extends CategoryIdentity>(categories: T[]) =>
  findCategoryByNameThenSlug(categories, PROPERTY_TYPE_NAMES, PROPERTY_TYPE_SLUG);

export const findListingTypeCategory = <T extends CategoryIdentity>(categories: T[]) =>
  findCategoryByNameThenSlug(categories, LISTING_TYPE_NAMES, LISTING_TYPE_SLUG);
