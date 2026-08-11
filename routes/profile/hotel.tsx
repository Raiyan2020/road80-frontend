import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronRightIcon } from "@/components/Icons";
import { useTranslation } from "@/i18n";
import { HotelProfileForm } from "@/features/account/components/HotelProfileForm";
import { useIsHotel } from "@/features/account/hooks/useHotelProfile";

/**
 * Hotel profile management — use case 1.2.
 *
 * Only reachable by `type === 'hotel'` accounts: the backend rejects
 * `cover_image`, `website` and `star_rating` for `user` and `company`
 * (flutter-hotel-feature-api.md §6.2), so rendering the form for them would
 * produce guaranteed 422s.
 */
export const Route = createFileRoute("/profile/hotel")({
  component: HotelProfilePage,
});

function HotelProfilePage() {
  const { t: tr, dir } = useTranslation();
  const navigate = useNavigate();
  const { isHotel, isLoading } = useIsHotel();

  return (
    <div
      className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-bg no-scrollbar transition-colors duration-300 dark:bg-slate-950"
      dir={dir}
    >
      <div className="mx-auto max-w-lg p-4 pb-24 sm:p-6">
        <button
          type="button"
          onClick={() => navigate({ to: "/profile" })}
          className="mb-6 flex items-center gap-1 text-sm font-bold text-gray-500 transition-colors hover:text-navy dark:text-slate-400 dark:hover:text-blue"
        >
          <ChevronRightIcon className="h-5 w-5 rtl:rotate-0 ltr:rotate-180" />
          {tr("common.back")}
        </button>

        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-navy dark:text-slate-100">
            {tr("profile.hotel.title")}
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
            {tr("profile.hotel.subtitle")}
          </p>
        </div>

        <div className="rounded-[32px] border border-pale bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
          {/* `isLoading` is handled separately from `!isHotel` — treating
              "not yet known" as "not a hotel" would flash the denial message. */}
          {isLoading ? (
            <div className="flex flex-col gap-4" aria-busy="true">
              <div className="h-36 w-full animate-pulse rounded-2xl bg-pale/40 dark:bg-slate-800" />
              <div className="h-14 w-full animate-pulse rounded-2xl bg-pale/40 dark:bg-slate-800" />
            </div>
          ) : isHotel ? (
            <HotelProfileForm />
          ) : (
            <p className="py-8 text-center text-sm font-medium text-gray-500 dark:text-slate-400">
              {tr("profile.hotel.onlyHotelAccounts")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
