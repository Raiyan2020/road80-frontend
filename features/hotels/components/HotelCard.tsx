import { AppImage } from "@/components/AppImage";
import { useTranslation } from "@/i18n";
import { StarRating } from "./StarRating";
import type { Hotel } from "../types";

interface HotelCardProps {
  hotel: Hotel;
  onClick: (hotel: Hotel) => void;
  /** Declared explicitly — without @types/react, TS does not treat `key` as a
      reserved JSX prop and rejects it at the call site. */
  key?: number | string;
}

/**
 * One row in the hotel list (use case 1.4). Optional fields are omitted rather
 * than rendered empty — «إذا لم يضف الفندق بعض البيانات الاختيارية، يتم عرض
 * البيانات المتاحة فقط».
 */
export function HotelCard({ hotel, onClick }: HotelCardProps) {
  const { t: tr } = useTranslation();

  const location = [hotel.state_name, hotel.country_name]
    .filter(Boolean)
    .join("، ");

  return (
    <button
      type="button"
      onClick={() => onClick(hotel)}
      className="flex w-full gap-3 rounded-2xl border border-pale bg-white p-3 text-start shadow-sm transition-all active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-pale/40 dark:bg-slate-800">
        <AppImage src={hotel.image} alt={hotel.name} className="h-full w-full" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm font-black text-navy dark:text-slate-100">
            {hotel.name}
          </h3>
          {hotel.star_rating ? (
            <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              {tr("hotels.profile.starsLabel", { count: hotel.star_rating })}
            </span>
          ) : null}
        </div>

        {hotel.caption ? (
          <p className="line-clamp-2 text-xs font-medium leading-snug text-gray-500 dark:text-slate-400">
            {hotel.caption}
          </p>
        ) : null}

        {location ? (
          <p className="truncate text-[11px] font-medium text-gray-400 dark:text-slate-500">
            {location}
          </p>
        ) : null}

        <div className="mt-0.5 flex items-center gap-2">
          {hotel.ratings_count > 0 ? (
            <>
              <StarRating value={hotel.rate} size={13} />
              <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400">
                {tr("hotels.profile.ratingSummary", {
                  rate: hotel.rate.toFixed(1),
                  count: hotel.ratings_count,
                })}
              </span>
            </>
          ) : (
            <span className="text-[11px] font-medium text-gray-400 dark:text-slate-500">
              {tr("hotels.profile.noRatingsYet")}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
