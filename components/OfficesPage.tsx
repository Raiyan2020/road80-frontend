import React, { useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Route } from '../routes/companies/index';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { StarIcon, SpinnerIcon } from './Icons';

// ── Types ────────────────────────────────────────────────────────────────────

interface Department {
  id: number;
  name: string;
  icon?: string;
}

interface Company {
  id: number;
  name: string;
  image?: string;
  state?: string | null;
  ads_count?: number;
  rate?: string | number;
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function fetchDepartments(): Promise<Department[]> {
  try {
    const res = await api.get<{ status: boolean; data: Department[] }>('/companies/departments');
    if (res.status && Array.isArray(res.data)) return res.data;
    return [];
  } catch (e) {
    console.error('[Companies] fetchDepartments error:', e);
    return [];
  }
}

async function fetchCompaniesByDept(deptId: string): Promise<Company[]> {
  try {
    const res = await api.get<{ status: boolean; data: Company[] }>(`/companies/departments/${deptId}`);
    if (res.status && Array.isArray(res.data)) return res.data;
    return [];
  } catch (e) {
    console.error('[Companies] fetchCompaniesByDept error:', e);
    return [];
  }
}

// ── Category Carousel ────────────────────────────────────────────────────────

interface CategoryCarouselProps {
  departments: Department[];
  activeId: string | undefined;
  onSelect: (id: number) => void;
}

const CategoryCarousel: React.FC<CategoryCarouselProps> = ({ departments, activeId, onSelect }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll active card into center on selection change
  useEffect(() => {
    if (!scrollRef.current || !activeId) return;
    const activeEl = scrollRef.current.querySelector(`[data-dept-id="${activeId}"]`) as HTMLElement | null;
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeId]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4"
      style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
    >
      {departments.map((dept) => {
        const isActive = activeId === String(dept.id);
        return (
          <button
            key={dept.id}
            data-dept-id={dept.id}
            onClick={() => onSelect(dept.id)}
            style={{ scrollSnapAlign: 'start' }}
            className={`
              shrink-0 flex flex-col items-center justify-center gap-2
              w-[100px] h-[90px] rounded-2xl border-2 transition-all duration-200
              ${isActive
                ? 'bg-navy dark:bg-blue border-navy dark:border-blue shadow-lg shadow-navy/20 dark:shadow-blue/20 scale-[1.04]'
                : 'bg-white dark:bg-slate-900 border-pale dark:border-slate-700 hover:border-navy/40 dark:hover:border-blue/40'
              }
            `}
          >
            {/* Icon */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden
              ${isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-slate-800'}`}>
              {dept.icon && dept.icon.startsWith('http') ? (
                <img
                  src={dept.icon}
                  alt={dept.name}
                  className="w-6 h-6 object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <span className="text-xl">🏢</span>
              )}
            </div>

            {/* Label */}
            <span className={`text-[11px] font-bold leading-tight text-center px-1 line-clamp-2
              ${isActive ? 'text-white' : 'text-navy dark:text-slate-200'}`}>
              {dept.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const OfficesPage: React.FC = () => {
  const navigate = useNavigate();
  const { category } = Route.useSearch();

  const { data: departments = [], isLoading: loadingDepts } = useQuery({
    queryKey: ['companies', 'departments'],
    queryFn: fetchDepartments,
    staleTime: 0,
  });

  // Auto-select first department when they load and none is selected
  useEffect(() => {
    if (!category && departments.length > 0) {
      navigate({ to: '/companies', search: { category: String(departments[0].id) } });
    }
  }, [departments, category]);

  const {
    data: companies = [],
    isLoading: loadingCompanies,
    isFetching,
  } = useQuery({
    queryKey: ['companies', 'by-dept', category],
    queryFn: () => fetchCompaniesByDept(category!),
    enabled: !!category,
    staleTime: 0,
  });

  const handleCompanyClick = (id: number | string) => {
    // Ensure id is a plain number string — no surrounding quotes
    const cleanId = String(id).replace(/^\"|\"$/g, '');
    navigate({ to: '/profile', search: { user: cleanId } as any });
  };


  const isLoading = loadingCompanies || isFetching;

  return (
    <div className="w-full min-h-full bg-bg dark:bg-slate-950 p-4 flex flex-col gap-4">

      {/* ── Category Carousel ── */}
      {loadingDepts ? (
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="shrink-0 w-[100px] h-[90px] rounded-2xl bg-gray-200 dark:bg-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : departments.length > 0 && (
        <CategoryCarousel
          departments={departments}
          activeId={category}
          onSelect={(id) => navigate({ to: '/companies', search: { category: String(id) } })}
        />
      )}

      {/* ── Active category label ── */}
      {category && departments.length > 0 && (
        <h2 className="text-base font-bold text-navy dark:text-slate-200 -mb-2">
          {departments.find((d) => String(d.id) === category)?.name}
        </h2>
      )}

      {/* ── Companies Grid ── */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <SpinnerIcon className="w-8 h-8 text-navy dark:text-blue animate-spin" />
        </div>
      ) : companies.length === 0 && category ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <span className="text-3xl">😕</span>
          <p className="text-gray-400 dark:text-slate-500 font-bold">لا توجد شركات في هذا القسم</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {companies.map((company) => (
            <div
              key={company.id}
              onClick={() => handleCompanyClick(company.id)}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-pale dark:border-slate-800 shadow-sm overflow-hidden flex flex-col active:scale-95 transition-transform duration-200 cursor-pointer"
            >
              {/* Logo area */}
              <div className="relative h-28 bg-gray-50 dark:bg-slate-800 flex items-center justify-center p-4">
                <div className="w-[68px] h-[68px] rounded-full border-4 border-white dark:border-slate-700 shadow-md overflow-hidden bg-white dark:bg-slate-900">
                  <img
                    src={company.image || ''}
                    alt={company.name}
                    className="w-full h-full object-cover"
                    onError={(e) =>
                      (e.currentTarget.src = 'https://raiyansoft.com/wp-content/uploads/2026/01/1.png')
                    }
                  />
                </div>

                {/* Rating badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-2.5 py-1 rounded-xl shadow-sm border border-pale/50 dark:border-slate-700">
                  <span className="text-[14px] font-semibold text-navy dark:text-slate-200 leading-none mt-0.5">
                    {company.rate ?? '0.00'}
                  </span>
                  <StarIcon className="w-4 h-4 text-yellow-400" />
                </div>
              </div>

              {/* Info area */}
              <div className="p-4 flex flex-col items-center text-center flex-1">
                <div className="min-h-[3rem] flex items-center justify-center w-full mb-1">
                  <h3 className="text-[16px] font-bold text-navy dark:text-slate-200 leading-[1.35] line-clamp-2">
                    {company.name}
                  </h3>
                </div>

                {company.state && (
                  <span className="text-[13px] font-medium text-gray-500 dark:text-slate-400 mb-2 truncate max-w-full px-1">
                    {typeof company.state === 'string' ? company.state : ''}
                  </span>
                )}

                <div className="w-full mt-auto">
                  <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 rounded-xl px-3 py-2 mb-1.5 border border-pale/30 dark:border-slate-700/50">
                    <span className="text-[12px] font-medium text-gray-600 dark:text-slate-400">إعلانات نشطة</span>
                    <span className="text-[15px] font-bold text-blue dark:text-blue">
                      {company.ads_count ?? 0}
                    </span>
                  </div>
                  <button className="w-full h-[42px] rounded-xl bg-navy/5 dark:bg-slate-800 text-navy dark:text-slate-200 text-[14px] font-semibold hover:bg-navy/10 dark:hover:bg-slate-700 transition-colors">
                    عرض الملف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OfficesPage;
