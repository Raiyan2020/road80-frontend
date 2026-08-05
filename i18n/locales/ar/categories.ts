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
    propertyType: 'نوع العقار',
    listingType: 'نوع التعاقد',
  },

  values: {
    // Contract / ad types
    rent: 'إيجار',
    sale: 'بيع',
    hotels: 'فنادق',

    // Property types
    apartment: 'شقة',
    villa: 'فيلا',
    house: 'بيت',
    floor: 'دور',
    building: 'عمارة',
    duplex: 'دوبلكس',
    chalet: 'شاليه',
    office: 'مكتب',
    land: 'أرض',
    complex: 'مجمع',
    shop: 'محل',
    warehouse: 'مخزن',
  },
};
