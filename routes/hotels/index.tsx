import React, { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "@/i18n";
import { useCountries, useStates } from "@/shared/hooks/useLocation";
import { useHotelsList } from "@/features/hotels/hooks/useHotels";
import { HotelCard } from "@/features/hotels/components/HotelCard";
import type { Hotel } from "@/features/hotels/types";

/**
 * Hotel list with filtering and search (use cases 1.4, 5.2).
 *
 * Filters live in the URL, not a store: they must survive refresh, back/forward
 * and sharing — see the `state-ownership` skill. The hotel category carries the
 * standard filters plus the two hotel-specific ones (stars, guest rating).
 */
type HotelSearch = {
  country_id?: string;
  state_id?: string;
  min_stars?: string;
  min_rating?: string;
  search?: string;
  page?: number;
};

const asString = (v: unknown) => (v === undefined || v === null || v === "" ? undefined : String(v));

export const Route = createFileRoute("/hotels/")({
  validateSearch: (search: Record<string, unknown>): HotelSearch => ({
    country_id: asString(search.country_id),
    state_id: asString(search.state_id),
    min_stars: asString(search.min_stars),
    min_rating: asString(search.min_rating),
    search: asString(search.search),
    page: search.page ? Number(search.page) : undefined,
  }),
  component: HotelsListPage,
});

function HotelsListPage() {
  const { t: tr, dir, isRTL } = useTranslation();
  const navigate = useNavigate();
  const params = Route.useSearch();

  const [searchDraft, setSearchDraft] = useState(params.search ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useHotelsList({
    country_id: params.country_id,
    state_id: params.state_id,
    min_stars: params.min_stars,
    min_rating: params.min_rating,
    search: params.search,
    page: params.page,
  });

  const { data: countriesResponse } = useCountries();
  const countries = (countriesResponse as any)?.data || countriesResponse || [];
  const { data: statesResponse } = useStates(params.country_id ?? "");
  const states = (statesResponse as any)?.data || statesResponse || [];

  const hotels: Hotel[] = (data as any)?.data ?? [];
  const pagination = (data as any)?.pagination;

  const setParam = (patch: Partial<HotelSearch>) => {
    navigate({
      to: "/hotels",
      search: (prev: HotelSearch) => {
        const next = { ...prev, ...patch };
        // Changing country invalidates the chosen governorate.
        if ("country_id" in patch) next.state_id = undefined;
        // Any filter change resets pagination — page 3 of the old result set is
        // meaningless against the new one.
        if (!("page" in patch)) next.page = undefined;
        return next;
      },
      replace: true,
    });
  };

  const activeFilters = [
    params.country_id,
    params.state_id,
    params.min_stars,
    params.min_rating,
  ].filter(Boolean).length;

  const selectChevronStyle: React.CSSProperties = {
    backgroundPosition: isRTL ? "left 1rem center" : "right 1rem center",
    backgroundRepeat: "no-repeat",
    backgroundImage:
      'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a9c2e0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
    backgroundSize: "0.65rem auto",
  };
  const selectClass =
    "h-12 w-full appearance-none rounded-2xl border border-pale bg-gray-50 px-4 rtl:pr-10 ltr:pl-10 text-sm font-bold text-navy outline-none focus:border-blue dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200";

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-bg no-scrollbar dark:bg-slate-950" dir={dir}>
      <div className="mx-auto max-w-lg p-4 pb-28">
        <h1 className="mb-4 text-2xl font-black tracking-tight text-navy dark:text-slate-100">
          {tr("hotels.title")}
        </h1>

        {/* Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParam({ search: searchDraft.trim() || undefined });
          }}
          className="mb-3 flex gap-2"
        >
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder={tr("hotels.searchPlaceholder")}
            aria-label={tr("hotels.searchPlaceholder")}
            className="h-12 flex-1 rounded-2xl border border-pale bg-gray-50 px-4 text-sm font-bold text-navy outline-none focus:border-blue dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200"
          />
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            className="relative h-12 shrink-0 rounded-2xl border border-pale bg-white px-4 text-sm font-bold text-navy dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {tr("hotels.filters.title")}
            {activeFilters > 0 && (
              <span className="absolute -top-1 rtl:-left-1 ltr:-right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue text-[10px] font-black text-white">
                {activeFilters}
              </span>
            )}
          </button>
        </form>

        {/* Filters */}
        {filtersOpen && (
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-pale bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <select
              value={params.country_id ?? ""}
              onChange={(e) => setParam({ country_id: e.target.value || undefined })}
              aria-label={tr("hotels.filters.country")}
              style={selectChevronStyle}
              className={selectClass}
            >
              <option value="">{tr("hotels.filters.anyCountry")}</option>
              {countries.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={params.state_id ?? ""}
              disabled={!params.country_id}
              onChange={(e) => setParam({ state_id: e.target.value || undefined })}
              aria-label={tr("hotels.filters.state")}
              style={selectChevronStyle}
              className={`${selectClass} disabled:opacity-60`}
            >
              <option value="">{tr("hotels.filters.anyState")}</option>
              {states.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <select
              value={params.min_stars ?? ""}
              onChange={(e) => setParam({ min_stars: e.target.value || undefined })}
              aria-label={tr("hotels.filters.minStars")}
              style={selectChevronStyle}
              className={selectClass}
            >
              <option value="">{tr("hotels.filters.anyStars")}</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {tr("hotels.filters.starsAndAbove", { count: n })}
                </option>
              ))}
            </select>

            <select
              value={params.min_rating ?? ""}
              onChange={(e) => setParam({ min_rating: e.target.value || undefined })}
              aria-label={tr("hotels.filters.minRating")}
              style={selectChevronStyle}
              className={selectClass}
            >
              <option value="">{tr("hotels.filters.anyRating")}</option>
              {[4.5, 4, 3.5, 3, 2].map((n) => (
                <option key={n} value={n}>
                  {tr("hotels.filters.ratingAndAbove", { count: n })}
                </option>
              ))}
            </select>

            {activeFilters > 0 && (
              <button
                type="button"
                onClick={() =>
                  setParam({
                    country_id: undefined,
                    state_id: undefined,
                    min_stars: undefined,
                    min_rating: undefined,
                  })
                }
                className="h-11 rounded-2xl border border-pale text-sm font-bold text-navy dark:border-slate-700 dark:text-slate-200"
              >
                {tr("hotels.filters.clear")}
              </button>
            )}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col gap-3" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 w-full animate-pulse rounded-2xl bg-pale/40 dark:bg-slate-800" />
            ))}
          </div>
        )}

        {/* Error — always offer a way forward, never a dead end */}
        {isError && !isLoading && (
          <div className="rounded-2xl border border-pale bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="mb-3 text-sm font-bold text-navy dark:text-slate-100">
              {tr("hotels.loadError")}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="h-11 rounded-2xl bg-blue px-6 text-sm font-bold text-white"
            >
              {tr("hotels.retry")}
            </button>
          </div>
        )}

        {/* Empty — `data: []` is a normal response from this API */}
        {!isLoading && !isError && hotels.length === 0 && (
          <div className="rounded-2xl border border-pale bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-bold text-navy dark:text-slate-100">{tr("hotels.empty")}</p>
            <p className="mt-1 text-xs font-medium text-gray-500 dark:text-slate-400">
              {tr("hotels.emptyHint")}
            </p>
          </div>
        )}

        {/* Results */}
        {!isLoading && !isError && hotels.length > 0 && (
          <div className="flex flex-col gap-3">
            {hotels.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                onClick={(h) => navigate({ to: "/hotels/$id", params: { id: String(h.id) } })}
              />
            ))}

            {pagination && pagination.current_page < pagination.last_page && (
              <button
                type="button"
                onClick={() => setParam({ page: (params.page ?? 1) + 1 })}
                className="h-12 rounded-2xl border border-pale bg-white text-sm font-bold text-navy dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
                {tr("hotels.loadMore")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
