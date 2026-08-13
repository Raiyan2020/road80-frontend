import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isContractTypeCategory,
  isDedicatedHotelCategory,
  isPropertyTypeCategory,
  realEstateContractValues,
  realEstatePropertyValues,
} from './hotel-filter.ts';

const property = {
  id: 1,
  name: 'نوع العقار',
  slug: 'property-type',
  type: 'select',
  values: [
    { id: 11, value: 'بيت' },
    { id: 12, value: 'فندق' },
  ],
};

const contract = {
  id: 2,
  name: 'نوع التعاقد',
  slug: 'ad-type',
  type: 'select',
  values: [
    { id: 21, value: 'إيجار' },
    { id: 22, value: 'بيع' },
    { id: 23, value: 'test' },
    { id: 24, value: 'فنادق' },
  ],
};

test('identifies the two general filter rows by stable slug', () => {
  assert.equal(isPropertyTypeCategory(property), true);
  assert.equal(isContractTypeCategory(contract), true);
});

test('removes stale hotel and test values from real-estate filters', () => {
  assert.deepEqual(realEstatePropertyValues(property).map((v) => v.value), ['بيت']);
  assert.deepEqual(realEstateContractValues(contract).map((v) => v.value), ['إيجار', 'بيع']);
});

test('recognizes the backend hotel destination as a separate category', () => {
  assert.equal(
    isDedicatedHotelCategory({
      id: 9,
      name: 'الفنادق',
      slug: 'hotels',
      type: 'select',
      destination: '/hotels',
      values: [],
    }),
    true,
  );
});
