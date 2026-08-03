import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCategories } from "../hooks/useCategories";
import { useTranslation } from "../../../i18n";
import type { TranslationKey } from "../../../i18n";
import {
  localizeCategoryValue,
  normalizeCategoryText,
} from "../../../shared/utils/category-localization";

/** Contract types we ship artwork and hand-written copy for. */
type ThemeKey = "rent" | "sale" | "hotels";

// Fallback static actions when API returns nothing.
// Labels are translation keys — resolved at render time so they follow the language.
const FALLBACK_ACTIONS: Array<{
  id: number;
  labelKey: TranslationKey;
  themeKey: ThemeKey;
}> = [
  { id: 3, labelKey: "categories.values.rent", themeKey: "rent" },
  { id: 4, labelKey: "categories.values.sale", themeKey: "sale" },
  { id: 5, labelKey: "categories.values.hotels", themeKey: "hotels" },
];

type CardTheme = {
  /** Illustrated icon for the white circle; null falls back to a letter badge. */
  icon: string | null;
  /** Photographic card background */
  photo: string;
  /** Gradient overlay tinting the photo */
  overlay: string;
  /** Text colour of the CTA pill */
  cta: string;
};

const THEMES: Record<ThemeKey, CardTheme> = {
  rent: {
    icon: "/rent.png",
    photo: "/flat.jpg",
    overlay:
      "bg-gradient-to-b from-[#d98230]/85 via-[#e09443]/78 to-[#b8661d]/90",
    cta: "text-[#b8661d]",
  },
  sale: {
    icon: "/sell.png",
    photo: "/house.jpg",
    overlay:
      "bg-gradient-to-b from-[#2c7d74]/85 via-[#37918a]/78 to-[#1f5f58]/90",
    cta: "text-[#2c7d74]",
  },
  hotels: {
    icon: "/hotel.png",
    photo: "/hotell.jpg",
    overlay:
      "bg-gradient-to-b from-[#2f3d7e]/85 via-[#3b4d94]/80 to-[#28306b]/90",
    cta: "text-[#2f3d7e]",
  },
};

/** Card styling for contract types we have no artwork for. */
const GENERIC_THEME: CardTheme = {
  icon: null,
  photo: "/house.jpg",
  overlay: "bg-gradient-to-b from-navy/85 via-[#3e689b]/78 to-[#27436b]/90",
  cta: "text-navy",
};

const COPY_KEYS: Record<
  ThemeKey,
  { subtitle: TranslationKey; cta: TranslationKey }
> = {
  rent: {
    subtitle: "home.quickActions.subtitle.rent",
    cta: "home.quickActions.cta.rent",
  },
  sale: {
    subtitle: "home.quickActions.subtitle.sale",
    cta: "home.quickActions.cta.sale",
  },
  hotels: {
    subtitle: "home.quickActions.subtitle.hotels",
    cta: "home.quickActions.cta.hotels",
  },
};

/**
 * The backend localizes category values via `Accept-Language`, and values carry
 * no slug — only an `id` and a localized `value`. So the theme is resolved by id
 * first, with a bilingual name match as a compatibility fallback. Those name
 * lists are NOT UI copy and must not be routed through i18n.
 */
const THEME_IDS: Record<number, ThemeKey> = {
  3: "rent",
  4: "sale",
  5: "hotels",
};

const THEME_NAMES: Record<ThemeKey, string[]> = {
  rent: ["إيجار", "ايجار", "for rent", "rent", "rentals"],
  sale: ["بيع", "for sale", "sale", "sales"],
  hotels: ["فنادق", "فندق", "hotels", "hotel"],
};

const themeKeyFor = (id: number, value: string): ThemeKey | null => {
  if (THEME_IDS[id]) return THEME_IDS[id];
  const needle = normalizeCategoryText(value);
  const hit = (Object.keys(THEME_NAMES) as ThemeKey[]).find((key) =>
    THEME_NAMES[key].some(
      (candidate) => normalizeCategoryText(candidate) === needle
    )
  );
  return hit ?? null;
};

const ArrowIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </svg>
);

const ActionCard: React.FC<{
  label: string;
  themeKey: ThemeKey | null;
  onClick: () => void;
}> = ({ label, themeKey, onClick }) => {
  const { t } = useTranslation();
  const theme = themeKey ? THEMES[themeKey] : GENERIC_THEME;

  const subtitle = themeKey
    ? t(COPY_KEYS[themeKey].subtitle)
    : t("home.quickActions.subtitle.generic", { name: label });
  const ctaLabel = themeKey
    ? t(COPY_KEYS[themeKey].cta)
    : t("home.quickActions.cta.generic", { name: label });

  return (
    <button
      onClick={onClick}
      className="relative flex-shrink-0 snap-start w-[70%] sm:w-auto aspect-[4/5] rounded-2xl overflow-hidden shadow-lg shadow-navy/10 dark:shadow-black/30 active:scale-95 transition-transform duration-200 group"
    >
      <img
        src={theme.photo}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className={`absolute inset-0 ${theme.overlay}`} />

      <div className="relative h-full flex flex-col items-center justify-center gap-2.5 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-300">
          {theme.icon ? (
            <img
              src={theme.icon}
              alt=""
              aria-hidden="true"
              className="w-12 h-12 object-contain"
            />
          ) : (
            <span className="text-xl font-bold text-navy">
              {label.charAt(0)}
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-white leading-tight">{label}</h3>

        <p className="text-xs text-white/90 leading-snug line-clamp-2">
          {subtitle}
        </p>

        <span
          className={`mt-1 inline-flex items-center gap-1.5 bg-white rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap ${theme.cta}`}
        >
          {ctaLabel}
          <ArrowIcon className="w-4 h-4 ltr:rotate-180" />
        </span>
      </div>
    </button>
  );
};

/**
 * QuickActionsRow
 *
 * Fetches /categories, finds "نوع التعاقد" (contract type, id=2),
 * renders ALL its values as large photo cards — a swipeable carousel on
 * mobile, a 3-up grid from `sm` upwards.
 * Clicking any card navigates to /explore filtered by that value id.
 */
export const QuickActionsRow: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: categories, isLoading } = useCategories();

  // Find the "نوع التعاقد" category, fallback to first category with values
  const contractCategory =
    categories?.find((c) => c.id === 2) ||
    categories?.find((c) => c.values.length > 0);

  const actions = contractCategory?.values ?? [];

  const handleClick = (valueId: number) => {
    navigate({
      to: "/explore",
      search: { category_value_id: valueId } as any,
    });
  };

  const containerClass =
    "flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 w-[calc(100%+2rem)] sm:grid sm:grid-cols-3 sm:overflow-visible sm:mx-0 sm:px-0 sm:w-full";

  // ── Skeleton ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={containerClass}>
        {[1, 2, 3].map((i) => (
          <div
            key={`skeleton-${i}`}
            className="flex-shrink-0 w-[70%] sm:w-auto aspect-[4/5] rounded-2xl bg-pale/40 dark:bg-slate-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  // ── API data ───────────────────────────────────────────────────────────────
  if (actions.length > 0) {
    return (
      <div
        className={containerClass}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {actions.map((action) => (
          <ActionCard
            key={action.id}
            label={localizeCategoryValue(action.value, action.id)}
            themeKey={themeKeyFor(action.id, action.value)}
            onClick={() => handleClick(action.id)}
          />
        ))}
      </div>
    );
  }

  // ── Fallback static actions ────────────────────────────────────────────────
  return (
    <div className={containerClass} style={{ WebkitOverflowScrolling: "touch" }}>
      {FALLBACK_ACTIONS.map((action) => (
        <ActionCard
          key={action.id}
          label={t(action.labelKey)}
          themeKey={action.themeKey}
          onClick={() => handleClick(action.id)}
        />
      ))}
    </div>
  );
};

export default QuickActionsRow;
