import React, { useMemo } from "react";
import {
  SlidersIcon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon,
  SpinnerIcon,
} from "../../../components/Icons";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useHomeListings } from "../hooks/useHomeListings";
import { useHomeData } from "../hooks/useHomeData";
import { BannerSlider } from "./BannerSlider";
import { StaticBanner } from "./StaticBanner";
import { HomeListingCard } from "./HomeListingCard";
import { QuickActionsRow } from "./QuickActionsRow";
import { useTranslation } from "../../../i18n";
import { useCountries } from "../../../shared/hooks/useCountries";
import { useCategoriesAppearInFilter } from "../../../shared/hooks/useHome";
import { useExploreCities } from "../../explore/hooks/useExploreLocations";
import {
  isListingTypeCategory,
  isPropertyTypeCategory,
} from "../../../shared/utils/category-match";

/**
 * `road80_preferences` is written by QuickWizard. It stores stable ids
 * (`countryId`, `stateId`, `cityId`) *and* the display names that were current
 * when the wizard ran. The names are frozen in whatever language the user was
 * using at the time, so they are only ever a fallback — the id is the source of
 * truth and the label gets resolved against the (localized) countries payload.
 */
function readStoredCountryPref(): { id?: number; staleName?: string } {
  try {
    const prefs = localStorage.getItem("road80_preferences");
    if (!prefs) return {};
    const parsed = JSON.parse(prefs);
    return {
      id: typeof parsed?.countryId === "number" ? parsed.countryId : undefined,
      staleName:
        typeof parsed?.countryName === "string" && parsed.countryName
          ? parsed.countryName
          : undefined,
    };
  } catch {
    // ignore invalid preferences
    return {};
  }
}

const HomePage: React.FC<{
  theme: "light" | "dark";
  onToggleTheme: () => void;
}> = ({ theme, onToggleTheme }) => {
  const { t, dir, lang } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: homeListings = [], isLoading: isListingsLoading } =
    useHomeListings();
  const { data: homeData, isLoading: isHomeDataLoading } = useHomeData();

  // homeData loaded

  const displayAds = homeListings.slice(0, 6);
  const firstSuggestedAd = homeListings[0];
  const { data: countries = [] } = useCountries();
  const { data: preferenceFilters = [] } = useCategoriesAppearInFilter();
  const { data: preferenceCities = [] } = useExploreCities(
    homeData?.filter_histories_details?.state_id ?? null
  );

  // Re-read on navigation (the wizard writes localStorage and routes back here).
  const storedCountry = useMemo(
    () => readStoredCountryPref(),
    [location.pathname]
  );

  const currentCountryName = useMemo(() => {
    // The server preference is authoritative. A value cached in localStorage
    // can belong to an older session/device choice and previously made the
    // country pill disagree with the saved search summary returned by /home.
    const preferredCountryId =
      homeData?.filter_histories_details?.country_id ?? storedCountry.id;

    // Preferred: resolve the stable id against the localized countries payload
    // so the pill follows the current language.
    if (preferredCountryId !== undefined && preferredCountryId !== null) {
      const match = countries.find((c) => c.id === preferredCountryId);
      if (match?.name) return match.name;
    }
    // Fallbacks, in order: the name persisted by the wizard (possibly stale, but
    // better than an empty pill while `countries` is still loading, and the only
    // thing available for payloads written before ids were stored), then the
    // first suggested ad, then the static default.
    return (
      (homeData?.filter_histories_details?.country_id == null
        ? storedCountry.staleName
        : undefined) ||
      firstSuggestedAd?.country ||
      t("home.country.fallbackName")
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    homeData?.filter_histories_details?.country_id,
    storedCountry,
    countries,
    firstSuggestedAd?.country,
    lang,
  ]);
  const searchText = useMemo(() => {
    const details = homeData?.filter_histories_details;
    if (details) {
      const selectedIds = details.category_value_id ?? [];
      const propertyFilter = preferenceFilters.find((filter) =>
        isPropertyTypeCategory(filter.slug, filter.name)
      );
      const listingFilter = preferenceFilters.find((filter) =>
        isListingTypeCategory(filter.slug, filter.name)
      );
      const propertyType = propertyFilter?.values.find((value) =>
        selectedIds.includes(value.id)
      )?.value;
      const listingType = listingFilter?.values.find((value) =>
        selectedIds.includes(value.id)
      )?.value;
      const city = preferenceCities.find(
        (item) => item.id === details.city_id
      )?.name;

      const validatedSummary = [propertyType, listingType, city]
        .filter(Boolean)
        .join(" / ");
      if (validatedSummary) return validatedSummary;
    }

    if (homeData?.filter_histories) {
      const rawSummary = Array.isArray(homeData.filter_histories)
        ? homeData.filter_histories.join("/")
        : homeData.filter_histories;
      const parts = rawSummary.split("/").map((part) => part.trim());
      return [parts[0], parts[1], parts.at(-3)].filter(Boolean).join(" / ");
    }
    if (!firstSuggestedAd) return "";

    return [
      firstSuggestedAd.propertyType,
      firstSuggestedAd.listingType,
      firstSuggestedAd.area,
      firstSuggestedAd.governorate,
      firstSuggestedAd.country,
    ]
      .filter(Boolean)
      .join(" / ");
  }, [
    homeData?.filter_histories,
    homeData?.filter_histories_details,
    preferenceFilters,
    preferenceCities,
    firstSuggestedAd,
  ]);

  return (
    <div className="flex flex-col p-4 gap-6 animate-fade-in pt-2">
      {/* Country Switcher Header with Theme Toggle */}
      <div className="flex items-center justify-between -mb-2">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 font-bold mb-0.5">
            {t("home.country.label")}
          </span>
          <button
            onClick={() =>
              navigate({
                to: "/quick-start",
                search: { mode: "location" } as any,
              })
            }
            className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-pale dark:border-slate-600 rounded-full pl-3 pr-2 py-1 shadow-sm active:scale-95 transition-all duration-300"
          >
            <span className="text-sm font-bold text-navy dark:text-slate-200">
              {currentCountryName}
            </span>
            <ChevronDownIcon className="w-3 h-3 text-blue" />
          </button>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="w-10 h-10 rounded-full bg-pale/30 dark:bg-slate-800 flex items-center justify-center transition-all duration-300 active:scale-95 text-navy dark:text-slate-200 border border-pale/80 dark:border-slate-600"
          aria-label={t("home.toggleTheme")}
        >
          {theme === "light" ? (
            <SunIcon className="w-5 h-5" />
          ) : (
            <MoonIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Top Banner (Slider) */}
      <BannerSlider
        images={homeData?.header?.map((h) => h.image) || []}
        isLoading={isHomeDataLoading}
      />

      {/* Interactive Search Card */}
      <div
        onClick={() =>
          navigate({ to: "/quick-start", search: { mode: "edit" } as any })
        }
        className="w-full bg-white dark:bg-slate-900 text-navy dark:text-slate-200 rounded-2xl p-4 shadow-lg shadow-navy/5 dark:shadow-black/20 flex items-center justify-between cursor-pointer active:scale-98 transition-all relative overflow-hidden group border border-navy/10 dark:border-slate-800 hover:border-navy/30 dark:hover:border-slate-700"
      >
        <div className="flex flex-col gap-1 z-10 flex-1 min-w-0 rtl:text-right ltr:text-left rtl:pr-2 ltr:pl-2">
          <span className="text-[13px] text-gray-400 font-medium group-hover:text-blue transition-colors">
            {t("home.search.label")}
          </span>
          <h3 className="text-sm font-semibold text-navy dark:text-slate-200 leading-tight truncate" dir={dir}>
            {searchText || t("home.search.placeholder")}
          </h3>
        </div>

        <div className="w-10 h-10 bg-pale/50 dark:bg-slate-800 rounded-xl flex items-center justify-center backdrop-blur-sm border border-pale dark:border-slate-700 z-10 group-hover:bg-navy dark:group-hover:bg-blue group-hover:text-white transition-all">
          <SlidersIcon className="w-5 h-5" />
        </div>
      </div>

      {/* Quick Actions Row */}
      <QuickActionsRow />

      {/* Latest Ads Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-navy dark:text-slate-200">
            {t("home.listings.title")}
          </h2>
        </div>

        {isListingsLoading ? (
          <div className="flex justify-center items-center py-10">
            <SpinnerIcon className="w-8 h-8 text-navy dark:text-blue animate-spin" />
          </div>
        ) : displayAds.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {displayAds.map((ad, index) => (
              <HomeListingCard key={`${ad.id}-${index}`} listing={ad} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-slate-900 border border-pale/50 dark:border-slate-800 rounded-2xl gap-4">
            <span className="text-gray-500 dark:text-slate-400 text-sm font-medium leading-relaxed font-sans">
              {t("home.listings.empty")}
            </span>
            <button
              onClick={() => navigate({ to: "/explore" })}
              className="px-6 py-2.5 bg-blue text-white rounded-full font-bold text-sm hover:bg-blue/90 active:scale-95 transition-all shadow-md"
            >
              {t("home.listings.startExploring")}
            </button>
          </div>
        )}

        {!isListingsLoading && displayAds.length > 0 && (
          <button
            onClick={() => navigate({ to: "/explore" })}
            className="w-full py-3 bg-white dark:bg-slate-900 border border-pale dark:border-slate-800 text-navy dark:text-slate-200 rounded-xl font-semibold text-sm hover:bg-pale/30 dark:hover:bg-slate-800 active:scale-95 transition-all shadow-sm"
          >
            {t("common.showMore")}
          </button>
        )}
      </div>

      {/* Bottom Banner (Static) */}
      <StaticBanner
        images={homeData?.footer?.map((h) => h.image) || []}
        isLoading={isHomeDataLoading}
      />
    </div>
  );
};

export default HomePage;
