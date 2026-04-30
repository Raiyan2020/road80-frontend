import React, { useState, useEffect } from "react";
import {
  SlidersIcon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon,
  SpinnerIcon,
} from "../../../components/Icons";
import { useNavigate } from "@tanstack/react-router";
import { useHomeListings } from "../hooks/useHomeListings";
import { useHomeData } from "../hooks/useHomeData";
import { BannerSlider } from "./BannerSlider";
import { StaticBanner } from "./StaticBanner";
import { HomeListingCard } from "./HomeListingCard";
import { QuickActionsRow } from "./QuickActionsRow";

const HomePage: React.FC<{
  theme: "light" | "dark";
  onToggleTheme: () => void;
}> = ({ theme, onToggleTheme }) => {
  const navigate = useNavigate();
  const { data: homeListings = [], isLoading: isListingsLoading } =
    useHomeListings();
  const { data: homeData, isLoading: isHomeDataLoading } = useHomeData();

  // homeData loaded

  const displayAds = homeListings.slice(0, 6);

  const [searchText, setSearchText] = useState("");
  const [currentCountryName, setCurrentCountryName] = useState("الكويت");

  const readPrefs = () => {
    try {
      const prefs = localStorage.getItem("road80_preferences");
      if (!prefs) return;
      const p = JSON.parse(prefs);
      if (p.countryName) setCurrentCountryName(p.countryName);
      const parts = [
        ...((p.categoryValueNames as string[]) || []),
        p.cityName,
        p.stateName,
        p.countryName,
      ].filter(Boolean) as string[];

      if (parts.length > 0) setSearchText(parts.join(" / "));
    } catch (e) {
      // Failed to parse preferences
    }
  };

  useEffect(() => {
    readPrefs();
    // Re-read when user returns from QuickWizard
    window.addEventListener("focus", readPrefs);
    return () => window.removeEventListener("focus", readPrefs);
  }, []);

  return (
    <div className="flex flex-col p-4 gap-6 animate-fade-in pt-2">
      {/* Country Switcher Header with Theme Toggle */}
      <div className="flex items-center justify-between -mb-2">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 font-bold mb-0.5">الدولة</span>
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
          aria-label="تبديل المظهر"
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
        <div className="flex flex-col gap-1 z-10">
          <span className="text-[13px] text-gray-400 font-medium group-hover:text-blue transition-colors">
            عن ماذا تبحث
          </span>
          <h3 className="text-sm font-semibold text-navy dark:text-slate-200 leading-tight truncate pl-4">
            {searchText || "اضغط لتحديد طلبك"}
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
            احدث الاعلانات المضافة تناسب طلبك
          </h2>
        </div>

        {isListingsLoading ? (
          <div className="flex justify-center items-center py-10">
            <SpinnerIcon className="w-8 h-8 text-navy dark:text-blue animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {displayAds.map((ad, index) => (
              <HomeListingCard key={`${ad.id}-${index}`} listing={ad} />
            ))}
          </div>
        )}

        {!isListingsLoading && displayAds.length > 0 && (
          <button
            onClick={() => navigate({ to: "/explore" })}
            className="w-full py-3 bg-white dark:bg-slate-900 border border-pale dark:border-slate-800 text-navy dark:text-slate-200 rounded-xl font-semibold text-sm hover:bg-pale/30 dark:hover:bg-slate-800 active:scale-95 transition-all shadow-sm"
          >
            مشاهدة المزيد
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
