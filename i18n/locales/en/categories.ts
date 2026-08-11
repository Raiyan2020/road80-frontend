/**
 * Display copy for the category groups and category values the API returns.
 *
 * The backend is supposed to localize `category_name` / `value` via the
 * `Accept-Language` header, but it currently answers in Arabic regardless. These
 * keys let the UI render a category in the active language; the mapping from an
 * API row to a key lives in `shared/utils/category-localization.ts`.
 *
 * This is the counterpart to `shared/utils/category-match.ts` — that file matches
 * categories and must NOT be routed through i18n; this file only displays them.
 */
export const categories = {
  // Category group names (the `name` field on /categories rows)
  names: {
    propertyType: 'Property type',
    listingType: 'Ad type',
  },

  values: {
    // Contract / ad types
    rent: 'For rent',
    sale: 'For sale',
    hotels: 'Hotels',

    // Property types
    apartment: 'Apartment',
    villa: 'Villa',
    house: 'House',
    floor: 'Floor',
    building: 'Building',
    duplex: 'Duplex',
    chalet: 'Chalet',
    office: 'Office',
    land: 'Land',
    complex: 'Complex',
    shop: 'Shop',
    warehouse: 'Warehouse',
  },
};
