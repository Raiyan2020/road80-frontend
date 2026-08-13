import type {
  FilterCategory,
  FilterOptionValue,
} from '@/features/home/services/home.service';

const normalize = (value: unknown) => String(value ?? '').trim().toLowerCase();

const matchesCategory = (
  category: FilterCategory,
  slugs: string[],
  names: string[],
) => {
  const slug = normalize(category.slug);
  const name = normalize(category.name);
  return slugs.includes(slug) || names.includes(name);
};

export const isPropertyTypeCategory = (category: FilterCategory) =>
  matchesCategory(category, ['property-type'], ['نوع العقار', 'property type']);

export const isContractTypeCategory = (category: FilterCategory) =>
  matchesCategory(
    category,
    ['ad-type'],
    ['نوع التعاقد', 'نوع الإعلان', 'contract type', 'ad type'],
  );

export const isDedicatedHotelCategory = (category: FilterCategory) => {
  const destination = normalize(category.destination).replace(/\/+$/, '');
  return (
    normalize(category.slug) === 'hotels' ||
    normalize(category.entity_type) === 'hotel' ||
    destination === '/hotels'
  );
};

export const isHotelValue = (value: FilterOptionValue) => {
  const marker = normalize(value.value);
  const destination = normalize(value.destination).replace(/\/+$/, '');
  return (
    ['hotel', 'hotels', 'فندق', 'فنادق'].includes(marker) ||
    normalize(value.entity_type) === 'hotel' ||
    destination === '/hotels'
  );
};

/** Mirrors the backend exclusions while old/stale API payloads are deployed. */
export const realEstatePropertyValues = (category?: FilterCategory) =>
  (category?.values ?? []).filter((value) => !isHotelValue(value));

/** `test` and hotel values are never valid real-estate contract types. */
export const realEstateContractValues = (category?: FilterCategory) =>
  (category?.values ?? []).filter(
    (value) => normalize(value.value) !== 'test' && !isHotelValue(value),
  );
