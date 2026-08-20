import React, { useState, useEffect } from "react";
import { Listing } from "../types";
import {
  SlidersIcon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon,
  KeyIcon,
  TagIcon,
  BedIcon,
  SpinnerIcon,
} from "./Icons";
import { useNavigate } from "@tanstack/react-router";
import { useHomeListings } from "../features/home/hooks/useHomeListings";
import { StaticBanner } from "../features/home/components/StaticBanner";
import { BannerSlider } from "../features/home/components/BannerSlider";
import { HomeListingCard } from "../features/home/components/HomeListingCard";
import { AppImage } from "./AppImage";
import { useTranslation, type TranslationKey } from "../i18n";

const QUICK_ACTIONS = [
  { id: "rent", labelKey: "home.quickActions.rent", icon: KeyIcon },
  { id: "sale", labelKey: "home.quickActions.sale", icon: TagIcon },
  { id: "hotels", labelKey: "home.quickActions.hotels", icon: BedIcon },
];

import { useHomeData } from "../features/home/hooks/useHomeData";

const HomePage: React.FC<{
  theme: "light" | "dark";
  onToggleTheme: () => void;
}> = ({ theme, onToggleTheme }) => {
  const { t, dir } = useTranslation();
  const navigate = useNavigate();
  const { data: homeListings = [], isLoading: isListingsLoading } =
    useHomeListings();
  const { data: homeData, isLoading: isHomeDataLoading } = useHomeData();

  // homeData loaded

  const displayAds = homeListings.slice(0, 6);

  const [searchText, setSearchText] = useState("");
  const [currentCountryName, setCurrentCountryName] = useState("");

  useEffect(() => {
    const prefs = localStorage.getItem("road80_preferences");
    if (prefs) {
      try {
        const p = JSON.parse(prefs);
        if (p.countryName) setCurrentCountryName(p.countryName);
        if (p.propertyType && p.purpose && p.area) {
          setSearchText(`${p.propertyType} / ${p.purpose} / ${p.area}`);
        }
      } catch (e) {
        // Failed to parse preferences
      }
    }
  }, []);

  return (
    <div className="flex flex-col p-4 gap-6 animate-fade-in pt-2">
      {/* Country Switcher Header with Theme Toggle */}
      <div className="flex items-center justify-between -mb-2">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 font-bold mb-0.5">{t("home.country.label")}</span>
          <button
            onClick={() =>
              navigate({
                to: "/quick-start",
                search: { mode: "location" } as any,
              })
            }
            className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-pale dark:border-slate-800 rounded-full pl-3 pr-2 py-1 shadow-sm active:scale-95 transition-all duration-300"
          >
            <span className="text-sm font-bold text-navy dark:text-slate-200">
              {currentCountryName || t("home.country.fallbackName")}
            </span>
            <ChevronDownIcon className="w-3 h-3 text-blue" />
          </button>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="w-10 h-10 rounded-full bg-pale/30 dark:bg-slate-800 flex items-center justify-center transition-all duration-300 active:scale-95 text-navy dark:text-slate-200 border border-transparent dark:border-slate-700"
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
        banners={homeData?.header || []}
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
        <div className="flex flex-col gap-1 z-10 flex-1 min-w-0 text-right pr-2">
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
      <div className="flex gap-3">
        {isHomeDataLoading
          ? [1, 2, 3].map((i) => (
              <div
                key={`skeleton-${i}`}
                className="flex-1 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 py-5 rounded-2xl shadow-sm border border-pale dark:border-slate-800 animate-pulse"
              >
                <div className="w-12 h-12 rounded-full bg-pale/30 dark:bg-slate-800" />
                <div className="h-4 w-12 bg-pale/30 dark:bg-slate-800 rounded" />
              </div>
            ))
          : (homeData?.categories || []).length > 0
            ? homeData!.categories.slice(0, 3).map((action) => (
                <button
                  key={action.id}
                  onClick={() =>
                    navigate({
                      to: "/explore",
                      search: { category_values_ids: [action.id] } as any,
                    })
                  }
                  className="flex-1 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 py-5 rounded-2xl shadow-sm border border-pale dark:border-slate-800 active:scale-95 transition-all duration-200 group hover:border-navy/20 dark:hover:border-slate-700"
                >
                  <div className="w-12 h-12 rounded-full bg-navy/5 dark:bg-slate-800 flex items-center justify-center group-hover:bg-navy dark:group-hover:bg-blue transition-colors duration-300">
                    <AppImage
                      src={action.icon}
                      alt={action.value}
                      className="w-6 h-6 filter group-hover:brightness-0 group-hover:invert transition-all duration-300"
                      coverClassName="object-contain"
                    />
                  </div>
                  <span className="text-sm font-medium text-navy dark:text-slate-200 group-hover:text-navy dark:group-hover:text-blue transition-colors">
                    {action.value}
                  </span>
                </button>
              ))
            : QUICK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => navigate({ to: "/explore" })} // Demo link
                  className="flex-1 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 py-5 rounded-2xl shadow-sm border border-pale dark:border-slate-800 active:scale-95 transition-all duration-200 group hover:border-navy/20 dark:hover:border-slate-700"
                >
                  <div className="w-12 h-12 rounded-full bg-navy/5 dark:bg-slate-800 flex items-center justify-center group-hover:bg-navy dark:group-hover:bg-blue transition-colors duration-300">
                    <action.icon className="w-6 h-6 text-navy dark:text-blue group-hover:text-white transition-colors duration-300" />
                  </div>
                  <span className="text-sm font-medium text-navy dark:text-slate-200 group-hover:text-navy dark:group-hover:text-blue transition-colors">
                    {t(action.labelKey as TranslationKey)}
                  </span>
                </button>
              ))}
      </div>

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
        banners={homeData?.footer || []}
        images={homeData?.footer?.map((h) => h.image) || []}
        isLoading={isHomeDataLoading}
      />
    </div>
  );
};

export default HomePage;
