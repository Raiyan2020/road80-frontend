
import React, { useState, useEffect, useMemo } from 'react';
import { useExploreListings } from '../features/explore/hooks/useExploreListings';
import { Listing } from '../types';
import { SpinnerIcon, SlidersIcon, SearchIcon } from './Icons';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { ExploreFilterDrawer, ExploreFilters } from './ExploreFilterDrawer';
import { AppImage } from './AppImage';
import { resolveListingImageUrl } from '@/shared/utils/listing-image';
import { useCountries, useStates, useCities } from '@/shared/hooks/useLocation';
import { useFilterOptions } from '@/features/home/hooks/useFilterOptions';
import { useTranslation } from '../i18n';

const ExplorePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const getFiltersFromUrl = (search: any) => {
    let sp: URLSearchParams;
    if (typeof search === 'string') {
      sp = new URLSearchParams(search);
    } else {
      const record: Record<string, string> = {};
      if (search) {
        Object.entries(search).forEach(([key, val]) => {
          if (val !== undefined && val !== null) {
            record[key] = String(val);
          }
        });
      }
      sp = new URLSearchParams(record);
    }
    const categoryParam = sp.get('category_value_id') || '';
    const categoryIds = categoryParam
      ? categoryParam
          .split(',')
          .flatMap((v) => v.split('|'))
          .map((v) => Number(v))
          .filter((v) => !Number.isNaN(v))
      : [];
    return {
      name: sp.get('name') || '',
      country_id: sp.get('country_id') || '',
      state_id: sp.get('state_id') || '',
      city_id: sp.get('city_id') || '',
      min_price: Number(sp.get('min_price')) || undefined,
      max_price: Number(sp.get('max_price')) || undefined,
      category_value_id: categoryIds
    };
  };

  const [filters, setFilters] = useState<ExploreFilters>(() => getFiltersFromUrl(location.search));
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchText, setSearchText] = useState(filters.name || '');
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const { data: filterOptionsRes } = useFilterOptions();
  const filterOptions = (filterOptionsRes as any)?.data || filterOptionsRes || [];
  const { data: countriesRes } = useCountries();
  const countries = (countriesRes as any)?.data || countriesRes || [];
  const { data: statesRes } = useStates(filters.country_id);
  const states = (statesRes as any)?.data || statesRes || [];
  const { data: citiesRes } = useCities(filters.state_id);
  const cities = (citiesRes as any)?.data || citiesRes || [];

  // Re-sync filters when the URL changes (e.g. navigating from home page with a pre-selected category)
  // Re-sync filters when the URL changes (e.g. navigating from home page with a pre-selected category)
  useEffect(() => {
    const newFilters = getFiltersFromUrl(location.search);
    setFilters(newFilters);
    // Only update search text if it differs from current filters to avoid cursor jumping
    if (newFilters.name !== searchText) {
      setSearchText(newFilters.name || '');
    }
  }, [location.search]);

  useEffect(() => {
    sessionStorage.setItem('explore-filters', JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    if (!location.search) {
      const saved = sessionStorage.getItem('explore-filters');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFilters(parsed);
          setSearchText(parsed.name || '');
        } catch {}
      }
    }
  }, []);

  const { data: listings = [], isLoading: loading } = useExploreListings(filters);

  const filteredListings = useMemo(() => {
    const countryId = String(filters.country_id || '').replace(/^"|"$/g, '');
    const stateId = String(filters.state_id || '').replace(/^"|"$/g, '');
    const cityId = String(filters.city_id || '').replace(/^"|"$/g, '');

    const selectedCountry = countries.find((c: any) => String(c.id) === countryId);
    const selectedState = states.find((s: any) => String(s.id) === stateId);
    const selectedCity = cities.find((c: any) => String(c.id) === cityId);
    const selectedCategoryIds = new Set((filters.category_value_id || []).map((v) => Number(v)));
    const selectedCategoryLabels = filterOptions.flatMap((cat: any) =>
      (cat.values || [])
        .filter((v: any) => selectedCategoryIds.has(Number(v.id)))
        .map((v: any) => String(v.value ?? '').trim().toLowerCase())
    );

    const normalize = (value: any) => String(value ?? '').trim().toLowerCase();

    return listings.filter((item: any) => {
      const itemCountry = normalize(item.country_name || item.country || item.country_code);
      const itemState = normalize(item.governorate || item.state_name || item.state);
      const itemCity = normalize(item.area || item.city_name || item.city);
      const itemListingType = normalize(item.listingType);
      const itemPropertyType = normalize(item.propertyType);
      const itemText = normalize(
        [item.title, item.listingType, item.propertyType, item.description]
          .filter(Boolean)
          .join(' ')
      );

      if (selectedCountry && itemCountry && itemCountry !== normalize(selectedCountry.name)) {
        return false;
      }
      if (selectedState && itemState && itemState !== normalize(selectedState.name)) {
        return false;
      }
      if (selectedCity && itemCity && itemCity !== normalize(selectedCity.name)) {
        return false;
      }
      if (selectedCategoryLabels.length > 0) {
        const matched = selectedCategoryLabels.some((label) =>
          itemText.includes(label) || [itemListingType, itemPropertyType].some((field) => field && (field.includes(label) || label.includes(field)))
        );
        if (!matched) return false;
      }
      return true;
    });
  }, [listings, filters.country_id, filters.state_id, filters.city_id, filters.category_value_id, countries, states, cities, filterOptions]);

  // Restore scroll position after listings load
  useEffect(() => {
    if (!loading && listings.length > 0 && scrollRef.current) {
      const savedScroll = sessionStorage.getItem('explore-scroll');
      if (savedScroll) {
        // Small delay to ensure DOM has completely rendered the images/grid
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = Number(savedScroll);
          }
        }, 50);
      }
    }
  }, [loading, listings.length]);

  const applyFilters = (newFilters: ExploreFilters) => {
    setFilters(newFilters);
    sessionStorage.setItem('explore-filters', JSON.stringify(newFilters));
    // Sync to URL
    const params = new URLSearchParams();
    if (newFilters.name) params.set('name', newFilters.name);
    if (newFilters.country_id) params.set('country_id', String(newFilters.country_id));
    if (newFilters.state_id) params.set('state_id', String(newFilters.state_id));
    if (newFilters.city_id) params.set('city_id', String(newFilters.city_id));
    if (newFilters.min_price) params.set('min_price', String(newFilters.min_price));
    if (newFilters.max_price && newFilters.max_price !== 50000) params.set('max_price', String(newFilters.max_price));
    if (newFilters.category_value_id && newFilters.category_value_id.length > 0) {
      params.set('category_value_id', newFilters.category_value_id.map(String).join(','));
    }
    
    navigate({ search: Object.fromEntries(params) as any });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText !== (filters.name || '')) {
        applyFilters({ ...filters, name: searchText });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ ...filters, name: searchText });
  };

  const handleClick = (id: number) => {
    sessionStorage.setItem('explore-filters', JSON.stringify(filters));
    navigate({ to: `/ad/${id}` });
  };

  const getPoster = (l: Listing) => resolveListingImageUrl(l);

  return (
    <div className="w-full h-full bg-bg dark:bg-slate-950 overflow-hidden flex flex-col animate-fade-in transition-colors duration-300 relative">
      
      {/* Sticky Header */}
      <div className="bg-white dark:bg-slate-900 shadow-sm z-30 pt-2 pb-3 px-4 border-b border-pale dark:border-slate-800 shrink-0 transition-colors duration-300">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
          <div className="flex-1 relative">
             <input 
               type="text" 
               placeholder={t('explore.search.placeholder')}
               value={searchText}
               onChange={e => setSearchText(e.target.value)}
               className="w-full h-12 rtl:pl-4 rtl:pr-11 ltr:pr-4 ltr:pl-11 rounded-2xl bg-gray-50 dark:bg-slate-800 text-navy dark:text-slate-200 border border-pale dark:border-slate-700 outline-none focus:border-blue transition-colors font-bold text-sm"
             />
             <SearchIcon className="absolute top-1/2 -translate-y-1/2 rtl:right-4 ltr:left-4 w-5 h-5 text-gray-400" />
          </div>
          <button
             type="button"
             onClick={() => setIsDrawerOpen(true)}
             aria-label={t('explore.search.openFilters')}
             className="w-12 h-12 rounded-2xl bg-navy dark:bg-blue flex items-center justify-center shadow-lg shadow-navy/20 dark:shadow-blue/20 active:scale-95 transition-all text-white shrink-0"
          >
             <SlidersIcon className="w-5 h-5" />
          </button>
        </form>
      </div>

      <div 
         id="explore-scroll-container" 
         className="flex-1 overflow-y-auto no-scrollbar"
         ref={scrollRef}
         onScroll={(e) => sessionStorage.setItem('explore-scroll', e.currentTarget.scrollTop.toString())}
      >
         {loading ? (
           <div className="flex justify-center items-center h-full">
              <SpinnerIcon className="w-8 h-8 text-navy dark:text-blue animate-spin" />
           </div>
         ) : (
           <>
             {/* Grid */}
             <div className="grid grid-cols-2 gap-0.5">
             {filteredListings.map(item => {
           const poster = getPoster(item);
           return (
           <div 
             key={item.id}
             onClick={() => handleClick(item.id)}
             className="relative aspect-square bg-gray-200 cursor-pointer overflow-hidden group"
           >
             {/* Thumbnail */}
             <AppImage
               src={poster}
               alt={item.title}
               className="w-full h-full transition-transform duration-500 group-hover:scale-105"
             />

             {/* Dark Gradient Overlay */}
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

             {/* Meta Info (Bottom) */}
             <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col justify-end text-white">
                <span className="font-bold text-sm drop-shadow-md truncate">{item.price}</span>
                <div className="flex items-center justify-between mt-0.5">
                   <span className="text-[13px] opacity-90 truncate max-w-[70%]">{item.area}</span>
                   <span className="text-[13px] opacity-75">{item.propertyType}</span>
                </div>
             </div>
           </div>
         );
         })}
      </div>

      {filteredListings.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-slate-500">
             <SearchIcon className="w-12 h-12 mb-2 opacity-20" />
             <p className="text-sm font-bold">{t('explore.feed.noMatches')}</p>
          </div>
      )}
           </>
         )}
      </div>

      <ExploreFilterDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        onApply={applyFilters} 
        initialFilters={filters}
      />
    </div>
  );
};

export default ExplorePage;
