import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Route } from '../routes/companies/index';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { SpinnerIcon } from './Icons';
import { AppImage } from './AppImage';
import { useTranslation } from '@/i18n';
import type { TranslationKey } from '@/i18n';

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

// ── Department labels ─────────────────────────────────────────────────────────

/**
 * The API returns department names as the seeded Arabic strings. Map the known
 * ones onto the shared `nav.categories` keys so the label follows the UI
 * language; anything the admin added later falls back to the raw API name.
 */
const DEPARTMENT_NAME_KEYS: Record<string, TranslationKey> = {
  'الشركات العقارية': 'nav.categories.real-estate',
  'الشركات الانشائية': 'nav.categories.construction',
  'شركات المقاولات': 'nav.categories.contracting',
  'قسم الديكور': 'nav.categories.decor',
  'مواد البناء': 'nav.categories.materials',
};

// ── API helpers ───────────────────────────────────────────────────────────────

async function fetchDepartments(): Promise<Department[]> {
  try {
    const res = await api.get<{ status: boolean; data: Department[] }>('/companies/departments');
    if (res.status && Array.isArray(res.data)) return res.data;
    return [];
  } catch (e) {
    return [];
  }
}

async function fetchCompaniesByDept(deptId: string): Promise<Company[]> {
  try {
    const res = await api.get<{ status: boolean; data: Company[] }>(`/companies/departments/${deptId}`);
    if (res.status && Array.isArray(res.data)) return res.data;
    return [];
  } catch (e) {
    return [];
  }
}

// ── Card tints ────────────────────────────────────────────────────────────────

/**
 * The department image is the card background; this flat colour sits on top of
 * it so the white label stays legible whatever the image looks like. Keyed by
 * department id rather than array index, so a department keeps its colour if the
 * API reorders them.
 */
const CARD_TINTS = [
  'bg-[#2f3d7e]/80', // indigo
  'bg-[#2c7d74]/80', // teal
  'bg-[#d98230]/80', // amber
  'bg-navy/80', // brand navy
  'bg-[#6d4a9c]/80', // violet
];

const tintFor = (id: number) => CARD_TINTS[Math.abs(id) % CARD_TINTS.length];

/** Shared by the carousel and its loading skeleton. */
const CARD_SIZE = 'shrink-0 w-[150px] aspect-[4/5] rounded-2xl';

// ── Scroll fade ───────────────────────────────────────────────────────────────

/**
 * True once the page has scrolled past `threshold`.
 *
 * The companies route scrolls inside an ancestor div (routes/companies/index.tsx
 * :14), not the window, so the listener has to go on the nearest scrollable
 * parent of the returned ref — `window.scrollY` never moves here.
 */
function useScrolledPast(threshold: number) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let node = anchorRef.current?.parentElement ?? null;
    while (node && node !== document.body) {
      const { overflowY } = getComputedStyle(node);
      if (overflowY === 'auto' || overflowY === 'scroll') break;
      node = node.parentElement;
    }

    const target: HTMLElement | Window =
      node && node !== document.body ? node : window;
    const readTop = () =>
      target === window ? window.scrollY : (target as HTMLElement).scrollTop;

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setScrolled(readTop() > threshold);
      });
    };

    onScroll();
    target.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      target.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [threshold]);

  return { anchorRef, scrolled };
}

// ── Category Carousel ────────────────────────────────────────────────────────

interface CategoryCarouselProps {
  departments: Department[];
  activeId: string | undefined;
  onSelect: (id: number) => void;
}

const CategoryCarousel: React.FC<CategoryCarouselProps> = ({ departments, activeId, onSelect }) => {
  const { t } = useTranslation();
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
    // py-2 leaves room for the active card's ring and scale-up, which
    // overflow-x-auto would otherwise clip vertically.
    <div
      ref={scrollRef}
      className="flex gap-3 overflow-x-auto no-scrollbar py-2 -mx-4 px-4"
      style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
    >
      {departments.map((dept) => {
        const isActive = activeId === String(dept.id);
        const nameKey = DEPARTMENT_NAME_KEYS[dept.name];
        const label = nameKey ? t(nameKey) : dept.name;
        return (
          <button
            key={dept.id}
            data-dept-id={dept.id}
            onClick={() => onSelect(dept.id)}
            style={{ scrollSnapAlign: 'start' }}
            aria-pressed={isActive}
            className={`
              relative overflow-hidden ${CARD_SIZE}
              transition-all duration-200 active:scale-95
              ${isActive
                ? 'shadow-lg shadow-navy/25 dark:shadow-black/40 ring-2 ring-inset ring-white/70 scale-[1.03]'
                : 'shadow-md shadow-navy/10 dark:shadow-black/30 saturate-50 opacity-75 hover:saturate-100 hover:opacity-100'
              }
            `}
          >
            {/*
              Department image as the background. It is blurred and scaled up so
              it reads as texture rather than a second, stretched copy of the
              logo already shown crisp in the circle below.
            */}
            <AppImage
              src={dept.icon}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full scale-110 blur-[3px]"
              coverClassName="object-cover"
              containOnFallback={false}
            />
            <div className={`absolute inset-0 ${tintFor(dept.id)}`} />

            <div className="relative h-full flex flex-col items-center justify-center gap-2.5 px-3 text-center">
              {/* Icon */}
              <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden">
                {dept.icon ? (
                  <AppImage
                    src={dept.icon}
                    alt={label}
                    className="w-20 h-20"
                    coverClassName="object-contain"
                  />
                ) : (
                  <span className="text-xl">🏢</span>
                )}
              </div>

              {/* Label */}
              <span className="text-sm font-bold text-white leading-tight line-clamp-3">
                {label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const OfficesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const { category } = Route.useSearch();

  const { data: departments = [], isLoading: loadingDepts } = useQuery({
    queryKey: ['companies', 'departments', lang],
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
    queryKey: ['companies', 'by-dept', category, lang],
    queryFn: () => fetchCompaniesByDept(category!),
    enabled: !!category,
    staleTime: 0,
  });

  const sortedCompanies = [...companies].sort((a, b) => {
    const aAds = Number(a.ads_count ?? 0);
    const bAds = Number(b.ads_count ?? 0);
    if (bAds !== aAds) return bAds - aAds;
    return String(a.name ?? '').localeCompare(String(b.name ?? ''), lang);
  });

  const handleCompanyClick = (id: number | string) => {
    // Ensure id is a plain number string — no surrounding quotes
    const cleanId = String(id).replace(/^\"|\"$/g, '');
    navigate({ to: '/profile', search: { user: cleanId } as any });
  };


  const isLoading = loadingCompanies || isFetching;

  // The carousel fades out once the page scrolls, so the company list gets the
  // screen. It keeps its space rather than collapsing — animating the height
  // would move the scroll position, which would then re-trigger this.
  const { anchorRef, scrolled } = useScrolledPast(40);

  return (
    <div
      ref={anchorRef}
      className="w-full min-h-full bg-bg dark:bg-slate-950 p-4 flex flex-col gap-4"
    >

      {/* ── Category Carousel ── */}
      <div
        className={`transition-opacity duration-300 ${
          scrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        aria-hidden={scrolled}
      >
        {loadingDepts ? (
          <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 -mx-4 px-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`${CARD_SIZE} bg-gray-200 dark:bg-slate-800 animate-pulse`}
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
      </div>

      {/* ── Active category label ── */}
      {category && departments.length > 0 && (
        <h2 className="text-base font-bold text-navy dark:text-slate-200 -mb-2">
          {(() => {
            const activeName = departments.find((d) => String(d.id) === category)?.name;
            if (!activeName) return null;
            const nameKey = DEPARTMENT_NAME_KEYS[activeName];
            return nameKey ? t(nameKey) : activeName;
          })()}
        </h2>
      )}

      {/* ── Companies Grid ── */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <SpinnerIcon className="w-8 h-8 text-navy dark:text-blue animate-spin" />
        </div>
      ) : sortedCompanies.length === 0 && category ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <span className="text-3xl">😕</span>
          <p className="text-gray-400 dark:text-slate-500 font-bold">{t('companies.list.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {sortedCompanies.map((company) => (
            <div
              key={company.id}
              onClick={() => handleCompanyClick(company.id)}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-pale dark:border-slate-800 shadow-sm overflow-hidden flex flex-col active:scale-95 transition-transform duration-200 cursor-pointer"
            >
              {/* Logo area — full-bleed square at the top of the card */}
              <div className="relative w-full aspect-square bg-gray-50 dark:bg-slate-800">
                <AppImage
                  src={company.image}
                  alt={company.name}
                  className="absolute inset-0 w-full h-full"
                />
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
                    <span className="text-[12px] font-medium text-gray-600 dark:text-slate-400">{t('companies.list.activeAds')}</span>
                    <span className="text-[15px] font-bold text-blue dark:text-blue">
                      {company.ads_count ?? 0}
                    </span>
                  </div>
                  <button className="w-full h-[42px] rounded-xl bg-navy/5 dark:bg-slate-800 text-navy dark:text-slate-200 text-[14px] font-semibold hover:bg-navy/10 dark:hover:bg-slate-700 transition-colors">
                    {t('companies.list.viewProfile')}
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
