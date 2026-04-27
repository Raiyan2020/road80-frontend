import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFilterOptions } from '../features/home/hooks/useFilterOptions';
import { useCountries, useStates, useCities } from '../shared/hooks/useLocation';
import { CloseIcon } from './Icons';

export interface ExploreFilters {
  name?: string;
  country_id?: number | string;
  state_id?: number | string;
  city_id?: number | string;
  category_value_id?: (number | string)[];
  min_price?: number;
  max_price?: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: ExploreFilters) => void;
  initialFilters?: ExploreFilters;
}

export const ExploreFilterDrawer: React.FC<Props> = ({ isOpen, onClose, onApply, initialFilters }) => {
  const { data: filterOptionsRes, isLoading: loadingFilters } = useFilterOptions();
  const filterOptions = (filterOptionsRes as any)?.data || filterOptionsRes || [];

  const [filters, setFilters] = useState<ExploreFilters>({
    category_value_id: [],
    min_price: 0,
    max_price: undefined,
    ...initialFilters
  });

  const { data: countriesRes } = useCountries();
  const countries = (countriesRes as any)?.data || countriesRes || [];

  const { data: statesRes } = useStates(filters.country_id);
  const states = (statesRes as any)?.data || statesRes || [];

  const { data: citiesRes } = useCities(filters.state_id);
  const cities = (citiesRes as any)?.data || citiesRes || [];

  // Reset states/cities when parents change
  useEffect(() => {
    setFilters(prev => ({ ...prev, state_id: '', city_id: '' }));
  }, [filters.country_id]);

  useEffect(() => {
    setFilters(prev => ({ ...prev, city_id: '' }));
  }, [filters.state_id]);

  if (!isOpen) return null;

  const toggleCategory = (id: number) => {
    setFilters(prev => {
      const current = prev.category_value_id || [];
      const numId = Number(id);
      if (current.includes(numId)) {
        return { ...prev, category_value_id: current.filter(x => x !== numId) };
      }
      return { ...prev, category_value_id: [...current, numId] };
    });
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    const empty = { category_value_id: [], min_price: 0, max_price: undefined, country_id: '', state_id: '', city_id: '' };
    setFilters(empty);
    onApply(empty);
    onClose();
  };

  const drawerContent = (
    <div className="fixed inset-0 z-[99999] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[430px] mx-auto bg-bg dark:bg-slate-950 rounded-t-[40px] shadow-2xl flex flex-col h-[85vh] animate-slide-up" dir="rtl">
        {/* Handle */}
        <div className="w-full flex justify-center py-4">
          <div className="w-16 h-1.5 bg-gray-300 dark:bg-slate-700 rounded-full" />
        </div>
        
        <div className="flex items-center justify-between px-6 pb-2 border-b border-pale dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-navy dark:text-slate-300 active:scale-95 transition-all"
              aria-label="Close"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-black text-navy dark:text-slate-100">تصفية البحث</h2>
          </div>
          <button onClick={handleClear} className="text-sm font-bold text-red-500 hover:text-red-600 transition-colors">مسح الكل</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6 no-scrollbar pb-24">
           {/* Dynamic Categories */}
           {!loadingFilters && filterOptions.map((cat: any) => (
             <div key={cat.id} className="flex flex-col gap-3">
               <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400">{cat.name}</h3>
               <div className="flex flex-wrap gap-2">
                 {cat.values?.map((v: any) => {
                   const isSelected = (filters.category_value_id || []).includes(v.id);
                   return (
                     <button
                       key={v.id}
                       onClick={() => toggleCategory(v.id)}
                       className={`px-4 py-2.5 rounded-2xl text-sm font-bold transition-all border ${
                         isSelected 
                         ? 'border-navy bg-navy/5 text-navy dark:border-blue dark:bg-blue/10 dark:text-blue' 
                         : 'border-pale dark:border-slate-700 text-navy dark:text-slate-300 bg-white dark:bg-slate-900 active:bg-gray-50'
                       }`}
                     >
                       {v.value}
                     </button>
                   );
                 })}
               </div>
             </div>
           ))}

           {/* Location */}
           <div className="flex flex-col gap-3">
               <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400">الموقع</h3>
               
               <select 
                 value={filters.country_id || ''} 
                 onChange={e => setFilters(p => ({ ...p, country_id: e.target.value }))}
                 className="h-14 px-4 pr-10 rounded-2xl bg-white dark:bg-slate-900 border border-pale dark:border-slate-800 text-navy dark:text-slate-200 font-bold outline-none appearance-none"
                 style={{ backgroundPosition: 'left 1rem center', backgroundRepeat: 'no-repeat', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a9c2e0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundSize: '0.65rem auto' }}
               >
                 <option value="">كل الدول</option>
                 {countries.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>

               <select 
                 value={filters.state_id || ''} 
                 onChange={e => setFilters(p => ({ ...p, state_id: e.target.value }))}
                 disabled={!filters.country_id}
                 className="h-14 px-4 pr-10 rounded-2xl bg-white dark:bg-slate-900 border border-pale dark:border-slate-800 text-navy dark:text-slate-200 font-bold outline-none disabled:opacity-50 appearance-none"
                 style={{ backgroundPosition: 'left 1rem center', backgroundRepeat: 'no-repeat', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a9c2e0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundSize: '0.65rem auto' }}
               >
                 <option value="">كل المحافظات</option>
                 {states.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
               </select>

               <select 
                 value={filters.city_id || ''} 
                 onChange={e => setFilters(p => ({ ...p, city_id: e.target.value }))}
                 disabled={!filters.state_id}
                 className="h-14 px-4 pr-10 rounded-2xl bg-white dark:bg-slate-900 border border-pale dark:border-slate-800 text-navy dark:text-slate-200 font-bold outline-none disabled:opacity-50 appearance-none"
                 style={{ backgroundPosition: 'left 1rem center', backgroundRepeat: 'no-repeat', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a9c2e0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundSize: '0.65rem auto' }}
               >
                 <option value="">كل المناطق</option>
                 {cities.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
           </div>

           {/* Price Range */}
           <div className="flex flex-col gap-3">
               <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400">السعر</h3>
               <div className="flex gap-4 items-center">
                 <input 
                   type="number" 
                   value={filters.min_price} 
                   onChange={e => setFilters(p => ({ ...p, min_price: Number(e.target.value) }))}
                   className="flex-1 w-0 min-w-0 h-12 px-2 text-center rounded-2xl bg-white dark:bg-slate-900 border border-pale dark:border-slate-800 text-navy dark:text-slate-200 font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                   placeholder="من"
                 />
                 <div className="flex items-center text-gray-400 font-bold shrink-0">-</div>
                 <input 
                   type="number" 
                   value={filters.max_price ?? ''} 
                   onChange={e => setFilters(p => ({ ...p, max_price: e.target.value ? Number(e.target.value) : undefined }))}
                   className="flex-1 w-0 min-w-0 h-12 px-2 text-center rounded-2xl bg-white dark:bg-slate-900 border border-pale dark:border-slate-800 text-navy dark:text-slate-200 font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                   placeholder="إلى"
                 />
               </div>
           </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-bg dark:bg-slate-950 border-t border-pale dark:border-slate-800 mb-[env(safe-area-inset-bottom)] z-[10]">
          <button 
            onClick={handleApply}
            className="w-full h-[56px] rounded-2xl bg-navy dark:bg-blue text-white font-black text-lg active:scale-95 transition-all shadow-lg"
          >
            تطبيق الفلاتر
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(drawerContent, document.body) : drawerContent;
};
