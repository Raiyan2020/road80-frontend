import React, { useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCategories } from "../hooks/useCategories";
import { KeyIcon, TagIcon, BedIcon } from "../../../components/Icons";

// Fallback static actions when API returns nothing
const FALLBACK_ACTIONS = [
  { id: 3, label: "إيجار", icon: KeyIcon },
  { id: 4, label: "بيع", icon: TagIcon },
  { id: 5, label: "فنادق", icon: BedIcon },
];

// Emoji icons for contract type values (matched by Arabic name)
const CONTRACT_ICONS: Record<string, string> = {
  إيجار: "🏠",
  بيع: "🏷️",
  فنادق: "🏨",
  بيت: "🏡",
  شقه: "🏢",
  دور: "🏗️",
  عمارة: "🏬",
};

/**
 * QuickActionsRow
 *
 * Fetches /categories, finds "نوع التعاقد" (contract type, id=2),
 * renders ALL its values as a horizontally-swipeable carousel.
 * Clicking any card navigates to /explore filtered by that value id.
 */
export const QuickActionsRow: React.FC = () => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: categories, isLoading } = useCategories();

  // Find the "نوع التعاقد" category, fallback to first category with values
  const contractCategory =
    categories?.find((c) => c.id === 2) ||
    categories?.find((c) => c.values.length > 0);

  const actions = contractCategory?.values ?? [];

  const handleClick = (valueId: number) => {
    // Build URL manually with category_values_ids[] to match ExplorePage's URLSearchParams.getAll()
    const params = new URLSearchParams();
    params.append("category_values_ids[]", String(valueId));
    navigate({ to: `/explore/?${params.toString()}` as any });
  };

  // ── Skeleton ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto no-scrollbar">
        {[1, 2, 3].map((i) => (
          <div
            key={`skeleton-${i}`}
            className="flex-shrink-0 w-20 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 py-5 rounded-2xl shadow-sm border border-pale dark:border-slate-800 animate-pulse"
          >
            <div className="w-12 h-12 rounded-full bg-pale/30 dark:bg-slate-800" />
            <div className="h-4 w-12 bg-pale/30 dark:bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // ── API data ───────────────────────────────────────────────────────────────
  if (actions.length > 0) {
    return (
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto no-scrollbar -mx-1 px-1"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleClick(action.id)}
            className="flex-shrink-0 flex flex-col items-center justify-center gap-2 bg-white dark:bg-slate-900 py-4 px-3 rounded-2xl shadow-sm border border-pale dark:border-slate-800 active:scale-95 transition-all duration-200 group hover:border-navy/30 dark:hover:border-slate-700 min-w-[72px]"
          >
            <div className="w-12 h-12 rounded-full bg-navy/5 dark:bg-slate-800 flex items-center justify-center group-hover:bg-navy dark:group-hover:bg-blue transition-colors duration-300">
              {CONTRACT_ICONS[action.value] ? (
                <span className="text-xl">{CONTRACT_ICONS[action.value]}</span>
              ) : (
                <span className="text-base font-bold text-navy dark:text-blue group-hover:text-white transition-colors">
                  {action.value.charAt(0)}
                </span>
              )}
            </div>
            <span className="text-xs font-semibold text-navy dark:text-slate-200 group-hover:text-navy dark:group-hover:text-blue transition-colors text-center leading-tight whitespace-nowrap">
              {action.value}
            </span>
          </button>
        ))}
      </div>
    );
  }

  // ── Fallback static actions ────────────────────────────────────────────────
  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar">
      {FALLBACK_ACTIONS.map((action) => (
        <button
          key={action.id}
          onClick={() => handleClick(action.id)}
          className="flex-shrink-0 flex flex-col items-center justify-center gap-2 bg-white dark:bg-slate-900 py-4 px-3 rounded-2xl shadow-sm border border-pale dark:border-slate-800 active:scale-95 transition-all duration-200 group hover:border-navy/30 dark:hover:border-slate-700 min-w-[72px]"
        >
          <div className="w-12 h-12 rounded-full bg-navy/5 dark:bg-slate-800 flex items-center justify-center group-hover:bg-navy dark:group-hover:bg-blue transition-colors duration-300">
            <action.icon className="w-6 h-6 text-navy dark:text-blue group-hover:text-white transition-colors duration-300" />
          </div>
          <span className="text-xs font-semibold text-navy dark:text-slate-200 group-hover:text-navy dark:group-hover:text-blue transition-colors text-center">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default QuickActionsRow;
