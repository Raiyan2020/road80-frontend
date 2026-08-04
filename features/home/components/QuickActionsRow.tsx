import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCategories } from "../hooks/useCategories";
import { useTranslation } from "../../../i18n";
import type { TranslationKey } from "../../../i18n";
import {
  localizeCategoryValue,
  normalizeCategoryText,
} from "../../../shared/utils/category-localization";

/** Contract types we ship artwork for. */
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

/** Illustrated icon per contract type (3D-style artwork on a transparent bg). */
const ICONS: Record<ThemeKey, string> = {
  rent: "/icon-rent.png",
  sale: "/icon-sale.png",
  hotels: "/icon-hotels.png",
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

/** Soft blue tile: illustration on top, label underneath. */
const ActionCard: React.FC<{
  label: string;
  themeKey: ThemeKey | null;
  onClick: () => void;
}> = ({ label, themeKey, onClick }) => {
  const icon = themeKey ? ICONS[themeKey] : null;

  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center justify-start gap-1 rounded-[1.35rem] px-2 pt-3 pb-3 bg-gradient-to-b from-[#eef4fd] to-[#dce8f9] dark:from-slate-800 dark:to-slate-800/50 border border-white/80 dark:border-slate-700 shadow-sm shadow-navy/5 active:scale-95 transition-transform duration-200"
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
        {icon ? (
          <img
            src={icon}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="w-12 h-12 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-xl font-bold text-[#2166d9] dark:text-blue-300 shadow-sm">
            {label.charAt(0)}
          </span>
        )}
      </div>

      <h3 className="text-sm font-bold text-[#2166d9] dark:text-blue-300 leading-tight text-center line-clamp-1 w-full px-1">
        {label}
      </h3>
    </button>
  );
};

/**
 * QuickActionsRow
 *
 * Fetches /categories, finds "نوع التعاقد" (contract type, id=2),
 * renders ALL its values as soft blue icon tiles in a 3-up grid card.
 * Clicking any tile navigates to /explore filtered by that value id.
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

  const cardClass =
    "bg-white dark:bg-slate-900 rounded-[1.75rem] p-2.5 shadow-lg shadow-navy/5 dark:shadow-black/20 border border-navy/10 dark:border-slate-800";
  const gridClass = "grid grid-cols-3 gap-2.5";

  // ── Skeleton ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={cardClass}>
        <div className={gridClass}>
          {[1, 2, 3].map((i) => (
            <div
              key={`skeleton-${i}`}
              className="h-[7.5rem] sm:h-[9rem] rounded-[1.35rem] bg-pale/50 dark:bg-slate-800 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const items =
    actions.length > 0
      ? actions.map((action) => ({
          key: action.id,
          label: localizeCategoryValue(action.value, action.id),
          themeKey: themeKeyFor(action.id, action.value),
          id: action.id,
        }))
      : FALLBACK_ACTIONS.map((action) => ({
          key: action.id,
          label: t(action.labelKey),
          themeKey: action.themeKey as ThemeKey | null,
          id: action.id,
        }));

  return (
    <div className={cardClass}>
      <div className={gridClass}>
        {items.map((item) => (
          <ActionCard
            key={item.key}
            label={item.label}
            themeKey={item.themeKey}
            onClick={() => handleClick(item.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default QuickActionsRow;
