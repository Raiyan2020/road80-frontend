import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { BedIcon } from "../../../components/Icons";
import { useCategories } from "../hooks/useCategories";
import { useTranslation } from "../../../i18n";
import type { TranslationKey } from "../../../i18n";
import {
  categoryValueKey,
  localizeCategoryValue,
} from "../../../shared/utils/category-localization";

// Fallback actions when the API returns nothing. Labels are translation keys —
// resolved at render time so they follow the language. No artwork here: icons
// are owned by the backend (`values[].icon`), so a tile without one falls back
// to the initial badge rather than to a bundled image.
const FALLBACK_ACTIONS: Array<{ id: number; labelKey: TranslationKey }> = [
  { id: 3, labelKey: "categories.values.rent" },
  { id: 4, labelKey: "categories.values.sale" },
];

/** Soft blue tile: backend illustration on top, label underneath. */
const ActionCard: React.FC<{
  label: string;
  icon?: string | null;
  fallbackIcon?: React.ReactNode;
  onClick: () => void;
}> = ({ label, icon, fallbackIcon, onClick }) => {
  // A broken/404 icon URL degrades to the initial badge instead of a torn image.
  const [failed, setFailed] = React.useState(false);
  const showIcon = Boolean(icon) && !failed;

  React.useEffect(() => setFailed(false), [icon]);

  return (
    <button
      onClick={onClick}
      className="group min-w-0 flex flex-col items-center justify-start gap-1 rounded-[1.35rem] px-1.5 py-2.5 sm:px-2 sm:py-3 bg-gradient-to-b from-[#eef4fd] to-[#dce8f9] dark:from-slate-800 dark:to-slate-800/50 border border-white/80 dark:border-slate-700 shadow-sm shadow-navy/5 active:scale-95 transition-transform duration-200"
    >
      <div className="w-12 h-12 sm:w-20 sm:h-20 flex items-center justify-center">
        {showIcon ? (
          <img
            src={icon as string}
            alt=""
            aria-hidden="true"
            loading="lazy"
            onError={() => setFailed(true)}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="w-12 h-12 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-xl font-bold text-[#2166d9] dark:text-blue-300 shadow-sm">
            {fallbackIcon ?? label.charAt(0)}
          </span>
        )}
      </div>

      <h3 className="text-xs sm:text-sm font-bold text-[#2166d9] dark:text-blue-300 leading-tight text-center line-clamp-1 w-full px-1">
        {label}
      </h3>
    </button>
  );
};

/**
 * QuickActionsRow
 *
 * Fetches /categories and renders every value flagged `appear_in_home` as a
 * soft blue icon tile in a single-row grid card. The flag spans categories — the
 * backend decides what belongs on home, so we no longer hardcode a category id.
 * Ad-value tiles navigate to /explore; destination-backed tiles such as Hotels
 * navigate to their dedicated directory and filter screen.
 */
export const QuickActionsRow: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: categories, isLoading } = useCategories();

  // Collect home values plus destination-backed entity categories. Hotels are
  // a directory destination, not an ad filter value, so the category-level
  // `/hotels` metadata becomes its own tile.
  const actions = React.useMemo(() => {
    const seen = new Set<number>();
    const flagged = (categories ?? [])
      .flatMap((category) =>
        (category.values ?? [])
          .filter((value) => value.appear_in_home === true)
          .map((value) => ({
            key: `value-${value.id}`,
            id: value.id,
            label: localizeCategoryValue(value.value, value.id),
            icon: value.icon ?? null,
            destination: value.destination ?? category.destination ?? null,
            entityType: value.entity_type ?? category.entity_type ?? null,
            semanticKey: categoryValueKey(value.value, value.id) ?? null,
          })),
      )
      .filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)));

    const entityDestinations = (categories ?? [])
      .filter((category) => Boolean(category.destination))
      .map((category) => ({
        key: `category-${category.id}`,
        id: category.id,
        label: category.name,
        icon: null,
        destination: category.destination ?? null,
        entityType: category.entity_type ?? null,
        semanticKey:
          category.entity_type === "hotel" || category.slug === "hotels"
            ? "categories.values.hotels"
            : null,
      }));

    // Prefer the flagged value tile when it already represents an entity
    // destination. It carries the backend artwork, while the category-level
    // fallback only has a text initial and would otherwise duplicate it.
    const missingEntityDestinations = entityDestinations.filter(
      (entity) =>
        !flagged.some(
          (item) =>
            (entity.destination && entity.destination === item.destination) ||
            (entity.entityType && entity.entityType === item.entityType) ||
            (entity.semanticKey && entity.semanticKey === item.semanticKey),
        ),
    );

    if (flagged.length > 0 || missingEntityDestinations.length > 0) {
      return [...flagged, ...missingEntityDestinations];
    }

    // Payload predates the flag: keep the old behaviour — "نوع التعاقد" (id=2),
    // else the first category that has any values.
    const contractCategory =
      categories?.find((c) => c.id === 2) ||
      categories?.find((c) => c.values.length > 0);
    return (contractCategory?.values ?? []).map((value) => ({
      key: `value-${value.id}`,
      id: value.id,
      label: localizeCategoryValue(value.value, value.id),
      icon: value.icon ?? null,
      destination: value.destination ?? null,
      entityType: value.entity_type ?? null,
      semanticKey: categoryValueKey(value.value, value.id) ?? null,
    }));
  }, [categories]);

  const handleClick = (item: { id: number; destination?: string | null }) => {
    if (item.destination) {
      navigate({ to: item.destination as "/hotels" });
      return;
    }
    navigate({
      to: "/explore",
      search: { category_value_id: item.id } as any,
    });
  };

  const cardClass =
    "bg-white dark:bg-slate-900 rounded-[1.75rem] p-2.5 shadow-lg shadow-navy/5 dark:shadow-black/20 border border-navy/10 dark:border-slate-800";
  const gridClass = "grid grid-flow-col auto-cols-fr gap-1.5 sm:gap-2.5";

  // ── Skeleton ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={cardClass}>
        <div className={gridClass}>
          {[1, 2, 3].map((i) => (
            <div
              key={`skeleton-${i}`}
              className="h-[5.75rem] sm:h-[9rem] rounded-[1.35rem] bg-pale/50 dark:bg-slate-800 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const apiItems =
    actions.length > 0
      ? actions
      : FALLBACK_ACTIONS.map((action) => ({
          key: `fallback-${action.id}`,
          label: t(action.labelKey),
          icon: null,
          id: action.id,
          destination: null,
          entityType: null,
          semanticKey: null,
        }));

  // Hotels is frontend-owned for now. Remove any stale API hotel tile, then
  // append exactly one card with the Explore hotel-filter route.
  const items = apiItems.filter(
    (item) =>
      item.semanticKey !== "categories.values.hotels" &&
      item.entityType !== "hotel" &&
      item.destination !== "/hotels",
  );

  return (
    <div className={cardClass}>
      <div className={gridClass}>
        {items.map((item) => (
          <ActionCard
            key={item.key}
            label={item.label}
            icon={item.icon}
            onClick={() => handleClick(item)}
          />
        ))}
        <ActionCard
          label={t("categories.values.hotels")}
          fallbackIcon={<BedIcon className="w-7 h-7" />}
          onClick={() =>
            navigate({ to: "/explore", search: { hotel: "1" } as any })
          }
        />
      </div>
    </div>
  );
};

export default QuickActionsRow;
