
import React, { useState, useEffect } from 'react';
import { useExploreListings } from '../features/explore/hooks/useExploreListings';
import { Listing } from '../types';
import { PlayIcon, SpinnerIcon, SlidersIcon, SearchIcon } from './Icons';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { ExploreFilterDrawer, ExploreFilters } from './ExploreFilterDrawer';

const FALLBACK_IMAGE = 'https://raiyansoft.com/wp-content/uploads/2026/01/1.png';

const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  const initialFilters: ExploreFilters = {
    name: searchParams.get('name') || '',
    country_id: searchParams.get('country_id') || '',
    state_id: searchParams.get('state_id') || '',
    city_id: searchParams.get('city_id') || '',
    min_price: Number(searchParams.get('min_price')) || 0,
    max_price: Number(searchParams.get('max_price')) || undefined,
    category_values_ids: searchParams.getAll('category_values_ids[]').map(Number).filter(Boolean)
  };

  const [filters, setFilters] = useState<ExploreFilters>(initialFilters);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchText, setSearchText] = useState(filters.name || '');

  const { data: listings = [], isLoading: loading } = useExploreListings(filters);

  const applyFilters = (newFilters: ExploreFilters) => {
    setFilters(newFilters);
    // Sync to URL
    const params = new URLSearchParams();
    if (newFilters.name) params.set('name', newFilters.name);
    if (newFilters.country_id) params.set('country_id', String(newFilters.country_id));
    if (newFilters.state_id) params.set('state_id', String(newFilters.state_id));
    if (newFilters.city_id) params.set('city_id', String(newFilters.city_id));
    if (newFilters.min_price) params.set('min_price', String(newFilters.min_price));
    if (newFilters.max_price && newFilters.max_price !== 50000) params.set('max_price', String(newFilters.max_price));
    if (newFilters.category_values_ids) {
      newFilters.category_values_ids.forEach(id => {
        params.append('category_values_ids[]', String(id));
      });
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
    navigate({ to: `/ad/${id}` });
  };

  const getPoster = (l: Listing) => {
    // Use first image as poster
    if (l.images && l.images.length > 0) {
       const first = l.images[0];
       if (first instanceof File || first instanceof Blob) {
           return URL.createObjectURL(first);
       }
       return first as string;
    }
    if (l.imageUrl) {
        if (l.imageUrl instanceof File || l.imageUrl instanceof Blob) {
           return URL.createObjectURL(l.imageUrl);
        }
        return l.imageUrl as string;
    }
    return FALLBACK_IMAGE;
  };

  return (
    <div className="w-full h-full bg-bg dark:bg-slate-950 overflow-hidden flex flex-col animate-fade-in transition-colors duration-300 relative">
      
      {/* Sticky Header */}
      <div className="bg-white dark:bg-slate-900 shadow-sm z-30 pt-2 pb-3 px-4 border-b border-pale dark:border-slate-800 shrink-0 transition-colors duration-300">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
          <div className="flex-1 relative">
             <input 
               type="text" 
               placeholder="ابحث عن عقارات..." 
               value={searchText}
               onChange={e => setSearchText(e.target.value)}
               className="w-full h-12 pl-4 pr-11 rounded-2xl bg-gray-50 dark:bg-slate-800 text-navy dark:text-slate-200 border border-pale dark:border-slate-700 outline-none focus:border-blue transition-colors font-bold text-sm"
             />
             <SearchIcon className="absolute top-1/2 -translate-y-1/2 right-4 w-5 h-5 text-gray-400" />
          </div>
          <button 
             type="button"
             onClick={() => setIsDrawerOpen(true)}
             className="w-12 h-12 rounded-2xl bg-navy dark:bg-blue flex items-center justify-center shadow-lg shadow-navy/20 dark:shadow-blue/20 active:scale-95 transition-all text-white shrink-0"
          >
             <SlidersIcon className="w-5 h-5" />
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
         {loading ? (
           <div className="flex justify-center items-center h-full">
              <SpinnerIcon className="w-8 h-8 text-navy dark:text-blue animate-spin" />
           </div>
         ) : (
           <>
             {/* Grid */}
             <div className="grid grid-cols-2 gap-0.5">
         {listings.map(item => (
           <div 
             key={item.id}
             onClick={() => handleClick(item.id)}
             className="relative aspect-square bg-gray-200 cursor-pointer overflow-hidden group"
           >
             {/* Thumbnail */}
             <img 
               src={getPoster(item)} 
               alt={item.title}
               className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
               onError={(e) => e.currentTarget.src = FALLBACK_IMAGE}
             />

             {/* Dark Gradient Overlay */}
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

             {/* Play Icon Center */}
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                    <PlayIcon className="w-5 h-5 text-white ml-0.5" />
                </div>
             </div>

             {/* Meta Info (Bottom) */}
             <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col justify-end text-white">
                <span className="font-bold text-sm drop-shadow-md truncate">{item.price}</span>
                <div className="flex items-center justify-between mt-0.5">
                   <span className="text-[13px] opacity-90 truncate max-w-[70%]">{item.area}</span>
                   <span className="text-[13px] opacity-75">{item.propertyType}</span>
                </div>
             </div>
           </div>
         ))}
      </div>

      {listings.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-slate-500">
             <PlayIcon className="w-12 h-12 mb-2 opacity-20" />
             <p className="text-sm font-bold">لا توجد اعلانات تطابق هذا البحث</p>
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
