import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFilterOptions } from '../features/home/hooks/useFilterOptions';
import { useCountries, useStates, useCities } from '../shared/hooks/useLocation';
import { CloseIcon } from './Icons';
import { useTranslation } from '../i18n';
import type { FilterCategory } from '../features/home/services/home.service';
import {
  isContractTypeCategory,
  isDedicatedHotelCategory,
  isPropertyTypeCategory,
  realEstateContractValues,
  realEstatePropertyValues,
} from '../features/explore/utils/hotel-filter';

const EMPTY_FILTER_OPTIONS: FilterCategory[] = [];
const HOTEL_STAR_OPTIONS = [1, 2, 3, 4, 5] as const;

export interface ExploreFilters {
  name?: string;
  country_id?: number | string;
  state_id?: number | string;
  city_id?: number | string;
  category_value_id?: (number | string)[];
  min_price?: number;
  max_price?: number;
}

export interface ExploreHotelFilters {
  search?: string;
  country_id?: number | string;
  state_id?: number | string;
  min_stars?: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: ExploreFilters) => void;
  onApplyHotel: (filters: ExploreHotelFilters) => void;
  initialFilters?: ExploreFilters;
  initialHotelSelected?: boolean;
}

export const ExploreFilterDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  onApply,
  onApplyHotel,
  initialFilters,
  initialHotelSelected = false,
}) => {
  const { t, dir, isRTL } = useTranslation();
  const { data: filterOptionsRes, isLoading: loadingFilters } = useFilterOptions();
  const filterOptions: FilterCategory[] =
    (filterOptionsRes as any)?.data || filterOptionsRes || EMPTY_FILTER_OPTIONS;

  const [filters, setFilters] = useState<ExploreFilters>({
    category_value_id: [],
    min_price: undefined,
    max_price: undefined,
    ...initialFilters
  });
  const [hotelSelected, setHotelSelected] = useState(false);
  const [hotelStars, setHotelStars] = useState<number | undefined>();
  const didMountRef = React.useRef(false);
  const didMountStateRef = React.useRef(false);

  useEffect(() => {
    setFilters({
      category_value_id: [],
      min_price: undefined,
      max_price: undefined,
      ...initialFilters,
    });
    setHotelSelected(initialHotelSelected);
    setHotelStars(undefined);
  }, [initialFilters, initialHotelSelected, isOpen]);

  const { data: countriesRes } = useCountries();
  const countries = (countriesRes as any)?.data || countriesRes || [];

  const { data: statesRes } = useStates(filters.country_id);
  const states = (statesRes as any)?.data || statesRes || [];

  const { data: citiesRes } = useCities(hotelSelected ? '' : filters.state_id);
  const cities = (citiesRes as any)?.data || citiesRes || [];

  // Reset states/cities when parents change
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    setFilters(prev => ({ ...prev, state_id: '', city_id: '' }));
  }, [filters.country_id]);

  useEffect(() => {
    if (!didMountStateRef.current) {
      didMountStateRef.current = true;
      return;
    }
    setFilters(prev => ({ ...prev, city_id: '' }));
  }, [filters.state_id]);

  if (!isOpen) return null;

  const selectCategory = (category: FilterCategory, id: number) => {
    setFilters(prev => {
      const current = prev.category_value_id || [];
      const numId = Number(id);
      const categoryValueIds = new Set(
        (category.values || []).map((value: any) => Number(value.id)),
      );
      const isAlreadySelected = current.some(value => Number(value) === numId);
      const selectionsOutsideCategory = current.filter(
        value => !categoryValueIds.has(Number(value)),
      );

      return {
        ...prev,
        category_value_id: isAlreadySelected
          ? selectionsOutsideCategory
          : [...selectionsOutsideCategory, numId],
      };
    });
  };

  const selectProperty = (category: FilterCategory, id: number) => {
    setHotelSelected(false);
    setHotelStars(undefined);
    selectCategory(category, id);
  };

  const selectHotel = () => {
    const next = !hotelSelected;
    setHotelSelected(next);
    setHotelStars(undefined);
    if (next) {
      setFilters((prev) => ({
        ...prev,
        category_value_id: [],
        city_id: '',
        min_price: undefined,
        max_price: undefined,
      }));
    }
  };

  const handleApply = () => {
    if (hotelSelected) {
      onApplyHotel({
        search: filters.name?.trim() || undefined,
        country_id: filters.country_id || undefined,
        state_id: filters.state_id || undefined,
        min_stars: hotelStars,
      });
      onClose();
      return;
    }
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    const empty = { category_value_id: [], min_price: undefined, max_price: undefined, country_id: '', state_id: '', city_id: '' };
    setFilters(empty);
    setHotelSelected(false);
    setHotelStars(undefined);
    sessionStorage.removeItem('explore-filters');
    onApply(empty);
    onClose();
  };

  // The chevron sits on the trailing edge of the select, so it has to follow the direction.
  const selectChevronStyle: React.CSSProperties = {
    backgroundPosition: isRTL ? 'left 1rem center' : 'right 1rem center',
    backgroundRepeat: 'no-repeat',
    backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a9c2e0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
    backgroundSize: '0.65rem auto',
  };

  const propertyCategory = filterOptions.find(isPropertyTypeCategory);
  const contractCategory = filterOptions.find(isContractTypeCategory);
  const propertyValues = realEstatePropertyValues(propertyCategory);
  const contractValues = realEstateContractValues(contractCategory);
  const additionalCategories = filterOptions.filter(
    (category) =>
      !isPropertyTypeCategory(category) &&
      !isContractTypeCategory(category) &&
      !isDedicatedHotelCategory(category),
  );

  const choiceClass = (isSelected: boolean) =>
    `px-4 py-2.5 rounded-2xl text-sm font-bold transition-all border ${isSelected
      ? 'border-navy bg-navy/5 text-navy dark:border-blue dark:bg-blue/10 dark:text-blue'
      : 'border-pale dark:border-slate-700 text-navy dark:text-slate-300 bg-white dark:bg-slate-900 active:bg-gray-50'
    }`;

  const drawerContent = (
    <div className="fixed inset-0 z-[99999] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[991px] mx-auto bg-bg dark:bg-slate-950 rounded-t-[40px] shadow-2xl flex flex-col h-[85vh] animate-slide-up" dir={dir}>
        {/* Handle */}
        <div className="w-full flex justify-center py-4">
          <div className="w-16 h-1.5 bg-gray-300 dark:bg-slate-700 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-6 pb-2 border-b border-pale dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-navy dark:text-slate-300 active:scale-95 transition-all"
              aria-label={t('common.close')}
            >
              <CloseIcon className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-black text-navy dark:text-slate-100">{t('explore.filters.title')}</h2>
          </div>
          <button onClick={handleClear} className="text-sm font-bold text-red-500 hover:text-red-600 transition-colors">{t('explore.filters.clearAll')}</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6 no-scrollbar pb-24">
          {/* Property type always includes a frontend-owned Hotels destination. */}
          {!loadingFilters && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400">
                {propertyCategory?.name ?? t('explore.filters.propertyType')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {propertyValues.map((v) => {
                  const isSelected = (filters.category_value_id || []).some(
                    id => Number(id) === Number(v.id),
                  );
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => propertyCategory && selectProperty(propertyCategory, v.id)}
                      className={choiceClass(!hotelSelected && isSelected)}
                    >
                      {v.value}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={selectHotel}
                  className={choiceClass(hotelSelected)}
                >
                  {t('categories.values.hotels')}
                </button>
              </div>
            </div>
          )}

          {/* The second row switches from real-estate contract type to hotel stars. */}
          {!loadingFilters && (hotelSelected ? (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400">
                {t('hotels.filters.minStars')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {HOTEL_STAR_OPTIONS.map((stars) => (
                  <button
                    key={stars}
                    type="button"
                    onClick={() => setHotelStars((current) => current === stars ? undefined : stars)}
                    className={choiceClass(hotelStars === stars)}
                  >
                    {t('hotels.filters.starsAndAbove', { count: stars })}
                  </button>
                ))}
              </div>
            </div>
          ) : contractCategory ? (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400">
                {contractCategory.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {contractValues.map((value) => {
                  const isSelected = (filters.category_value_id || []).some(
                    (id) => Number(id) === Number(value.id),
                  );
                  return (
                    <button
                      key={value.id}
                      type="button"
                      onClick={() => selectCategory(contractCategory, value.id)}
                      className={choiceClass(isSelected)}
                    >
                      {value.value}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null)}

          {!loadingFilters && !hotelSelected && additionalCategories.map((category) => (
            <div key={category.id} className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400">{category.name}</h3>
              <div className="flex flex-wrap gap-2">
                {category.values?.map((value) => {
                  const isSelected = (filters.category_value_id || []).some(
                    (id) => Number(id) === Number(value.id),
                  );
                  return (
                    <button
                      key={value.id}
                      type="button"
                      onClick={() => selectCategory(category, value.id)}
                      className={choiceClass(isSelected)}
                    >
                      {value.value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Location */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400">{t('explore.filters.location')}</h3>

            <select
              value={filters.country_id || ''}
              onChange={e => setFilters(p => ({ ...p, country_id: e.target.value }))}
              className="h-14 px-4 rtl:pr-10 ltr:pl-10 rounded-2xl bg-white dark:bg-slate-900 border border-pale dark:border-slate-800 text-navy dark:text-slate-200 font-bold outline-none appearance-none"
              style={selectChevronStyle}
            >
              <option value="">{t('explore.filters.allCountries')}</option>
              {countries.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select
              value={filters.state_id || ''}
              onChange={e => setFilters(p => ({ ...p, state_id: e.target.value }))}
              disabled={!filters.country_id}
              className="h-14 px-4 rtl:pr-10 ltr:pl-10 rounded-2xl bg-white dark:bg-slate-900 border border-pale dark:border-slate-800 text-navy dark:text-slate-200 font-bold outline-none disabled:opacity-50 appearance-none"
              style={selectChevronStyle}
            >
              <option value="">{t('explore.filters.allGovernorates')}</option>
              {states.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            {!hotelSelected && (
              <select
                value={filters.city_id || ''}
                onChange={e => setFilters(p => ({ ...p, city_id: e.target.value }))}
                disabled={!filters.state_id}
                className="h-14 px-4 rtl:pr-10 ltr:pl-10 rounded-2xl bg-white dark:bg-slate-900 border border-pale dark:border-slate-800 text-navy dark:text-slate-200 font-bold outline-none disabled:opacity-50 appearance-none"
                style={selectChevronStyle}
              >
                <option value="">{t('explore.filters.allAreas')}</option>
                {cities.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>

          {/* Price Range */}
          {!hotelSelected && <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400">{t('explore.filters.price')}</h3>
            <div className="flex gap-4 items-center">
              <input
                type="number"
                value={filters.min_price ?? ''}
                onChange={e => setFilters(p => ({ ...p, min_price: e.target.value ? Number(e.target.value) : undefined }))}
                className="flex-1 w-0 min-w-0 h-12 px-2 text-center rounded-2xl bg-white dark:bg-slate-900 border border-pale dark:border-slate-800 text-navy dark:text-slate-200 font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder={t('explore.filters.priceFrom')}
              />
              <div className="flex items-center text-gray-400 font-bold shrink-0">-</div>
              <input
                type="number"
                value={filters.max_price ?? ''}
                onChange={e => setFilters(p => ({ ...p, max_price: e.target.value ? Number(e.target.value) : undefined }))}
                className="flex-1 w-0 min-w-0 h-12 px-2 text-center rounded-2xl bg-white dark:bg-slate-900 border border-pale dark:border-slate-800 text-navy dark:text-slate-200 font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder={t('explore.filters.priceTo')}
              />
            </div>
          </div>}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-bg dark:bg-slate-950 border-t border-pale dark:border-slate-800 mb-[env(safe-area-inset-bottom)] z-[10]">
          <button
            onClick={handleApply}
            className="w-full h-[56px] rounded-2xl bg-navy dark:bg-blue text-white font-black text-lg active:scale-95 transition-all shadow-lg"
          >
            {t('explore.filters.apply')}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(drawerContent, document.body) : drawerContent;
};
