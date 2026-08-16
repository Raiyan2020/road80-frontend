import React, { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppImage } from "@/components/AppImage";
import { SocialLinksRow } from "@/components/SocialLinksRow";
import {
  ChevronRightIcon,
  GlobeIcon,
  MapPinIcon,
  PhoneIcon,
  ShareIcon,
  WhatsappIcon,
} from "@/components/Icons";
import { useTranslation } from "@/i18n";
import { shareContent } from "@/shared/utils/share";
import { useProfile } from "@/features/account/hooks/useProfile";
import { useStartConversation } from "@/features/chat/hooks/useChat";
import {
  useHotel,
  useHotelContents,
  useHotelRatings,
} from "@/features/hotels/hooks/useHotels";
import { StarRating } from "@/features/hotels/components/StarRating";
import { MediaGallery } from "@/features/hotels/components/MediaGallery";
import { RatingSheet } from "@/features/hotels/components/RatingSheet";
import type { Hotel, HotelContent, HotelRating } from "@/features/hotels/types";
import { useUserStore } from "@/stores/user.store";

type Tab = "contents" | "ratings";

export const Route = createFileRoute("/hotels/$id/")({
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } => ({
    tab: search.tab === "ratings" ? "ratings" : "contents",
  }),
  component: HotelProfilePage,
});

function HotelProfilePage() {
  const { t: tr, dir } = useTranslation();
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const { tab } = Route.useSearch();

  const [ratingOpen, setRatingOpen] = useState(false);

  // «عرض جميع التقييمات والتعليقات» — both tabs page through rather than
  // showing only the first 10. Accumulated locally so earlier pages stay
  // visible; the query key still carries the page so each is cached.
  const [contentsPage, setContentsPage] = useState(1);
  const [ratingsPage, setRatingsPage] = useState(1);
  const [allContents, setAllContents] = useState<HotelContent[]>([]);
  const [allRatings, setAllRatings] = useState<HotelRating[]>([]);

  const hotelQuery = useHotel(id);
  const contentsQuery = useHotelContents(id, contentsPage);
  const ratingsQuery = useHotelRatings(id, ratingsPage);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  // Hotel reads are public. Do not call the protected /profile endpoint for a
  // signed-out visitor who arrived through a share link.
  const { profile } = useProfile({ enabled: isAuthenticated });
  const { startConversation, isStarting } = useStartConversation();

  const hotel: Hotel | undefined = (hotelQuery.data as any)?.data;

  const contentsPagination = (contentsQuery.data as any)?.pagination;
  const ratingsPagination = (ratingsQuery.data as any)?.pagination;

  // Append each fetched page, de-duplicating by id so a refetch of the same
  // page (focus refetch, invalidation) cannot double-insert rows.
  useEffect(() => {
    const page: HotelContent[] = (contentsQuery.data as any)?.data ?? [];
    if (!page.length) return;
    setAllContents((prev) => {
      const seen = new Set(prev.map((c) => c.id));
      const merged = contentsPage === 1 ? page : [...prev, ...page.filter((c) => !seen.has(c.id))];
      return merged;
    });
  }, [contentsQuery.data, contentsPage]);

  useEffect(() => {
    const page: HotelRating[] = (ratingsQuery.data as any)?.data ?? [];
    if (!page.length) return;
    setAllRatings((prev) => {
      const seen = new Set(prev.map((r) => r.id));
      return ratingsPage === 1 ? page : [...prev, ...page.filter((r) => !seen.has(r.id))];
    });
  }, [ratingsQuery.data, ratingsPage]);

  const contents = allContents;
  const ratings = allRatings;

  // A hotel cannot rate itself, and hotel accounts cannot rate at all (§7.6).
  const isOwnHotel = profile?.id === hotel?.id;
  const canRate = isAuthenticated && !!profile && profile.type !== "hotel" && !isOwnHotel;
  const myRating = ratings.find((r) => r.user?.id === profile?.id);
  // `my_rating` is returned by the hotel resource specifically so an existing
  // rating is still detected when it is not present in the loaded ratings page.
  const myRatingStars = myRating?.stars ?? hotel?.my_rating ?? undefined;
  const hasMyRating = myRatingStars !== undefined && myRatingStars !== null;

  // A hotel account cannot start a chat — it can only reply (§10.1).
  const canChat = isAuthenticated && !!profile && profile.type !== "hotel" && !isOwnHotel;

  const setTab = (next: Tab) =>
    navigate({ to: "/hotels/$id", params: { id }, search: { tab: next }, replace: true });

  const handleShare = () => {
    if (!hotel) return;
    // The backend already provides a canonical public link (§11) — do not
    // reconstruct it locally, or the two will drift.
    shareContent({
      title: hotel.name,
      text: hotel.caption ?? hotel.name,
      url: hotel.share_url,
    });
  };

  const handleChat = async () => {
    if (!hotel) return;
    try {
      const res: any = await startConversation(hotel.id);
      const conversationId = res?.data?.id;
      if (conversationId) {
        navigate({ to: "/conversations/$id", params: { id: String(conversationId) } });
      }
    } catch (err) {
      // `ConversationService` throws `__('api.hotel_cannot_start_chat')` — the
      // message arrives already localized by the backend, so show it verbatim
      // rather than matching key names (which never match) or re-translating.
      const message = (err as any)?.data?.message;
      toast.error(message || tr("hotels.chat.startError"));
    }
  };

  // ── Not found / hidden / suspended ────────────────────────────────────────
  // §11: a hidden or suspended profile 404s. That is the expected answer for a
  // shared link, not an error to retry.
  if (hotelQuery.isError) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-bg p-6 text-center dark:bg-slate-950" dir={dir}>
        <p className="text-lg font-black text-navy dark:text-slate-100">
          {tr("hotels.profile.notFound")}
        </p>
        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
          {tr("hotels.profile.notFoundHint")}
        </p>
        <button
          type="button"
          onClick={() => navigate({ to: "/hotels" })}
          className="h-12 rounded-2xl bg-blue px-6 text-sm font-bold text-white"
        >
          {tr("hotels.profile.backToHotels")}
        </button>
      </div>
    );
  }

  if (hotelQuery.isLoading || !hotel) {
    return (
      <div className="absolute inset-0 overflow-y-auto bg-bg p-4 dark:bg-slate-950" dir={dir} aria-busy="true">
        <div className="mx-auto flex max-w-lg flex-col gap-4">
          <div className="h-40 w-full animate-pulse rounded-2xl bg-pale/40 dark:bg-slate-800" />
          <div className="h-6 w-1/2 animate-pulse rounded-full bg-pale/40 dark:bg-slate-800" />
          <div className="h-20 w-full animate-pulse rounded-2xl bg-pale/40 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  const location = [hotel.state_name, hotel.country_name].filter(Boolean).join("، ");

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-bg no-scrollbar dark:bg-slate-950" dir={dir}>
      <div className="mx-auto max-w-lg pb-28">
        {/* Cover + logo */}
        <div className="relative">
          <div className="h-40 w-full bg-pale/40 dark:bg-slate-800">
            {hotel.cover_image ? (
              <AppImage src={hotel.cover_image} alt="" className="h-full w-full" />
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => navigate({ to: "/hotels" })}
            aria-label={tr("common.back")}
            className="absolute top-[max(0.75rem,env(safe-area-inset-top))] rtl:right-3 ltr:left-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur"
          >
            <ChevronRightIcon className="h-5 w-5 rtl:rotate-0 ltr:rotate-180" />
          </button>
          <div className="absolute -bottom-10 rtl:right-4 ltr:left-4 h-20 w-20 overflow-hidden rounded-2xl border-4 border-white bg-white dark:border-slate-950 dark:bg-slate-900">
            <AppImage src={hotel.image} alt={hotel.name} className="h-full w-full" />
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 px-4">
          {/* Identity */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-black text-navy dark:text-slate-100">
                {hotel.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {hotel.star_rating ? (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                    {tr("hotels.profile.starsLabel", { count: hotel.star_rating })}
                  </span>
                ) : null}
                {hotel.ratings_count > 0 ? (
                  <span className="flex items-center gap-1.5">
                    <StarRating value={hotel.rate} size={14} />
                    <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400">
                      {tr("hotels.profile.ratingSummary", {
                        rate: hotel.rate.toFixed(1),
                        count: hotel.ratings_count,
                      })}
                    </span>
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-gray-400">
                    {tr("hotels.profile.noRatingsYet")}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleShare}
              aria-label={tr("hotels.profile.actions.share")}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-navy dark:bg-slate-800 dark:text-slate-300"
            >
              <ShareIcon className="h-4 w-4" />
            </button>
          </div>

          {hotel.caption ? (
            <p className="text-sm font-medium leading-relaxed text-gray-600 dark:text-slate-300">
              {hotel.caption}
            </p>
          ) : null}

          {location ? (
            <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-slate-400">
              <MapPinIcon className="h-4 w-4 shrink-0" />
              {location}
            </p>
          ) : null}

          {/* Contact actions — only what the hotel actually provided (1.6) */}
          <div className="flex flex-wrap gap-2">
            {hotel.phone ? (
              <a
                href={`tel:${hotel.phone}`}
                className="flex items-center gap-1.5 rounded-2xl border border-pale bg-white px-4 py-2.5 text-xs font-bold text-navy dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <PhoneIcon className="h-4 w-4" />
                {tr("hotels.profile.actions.call")}
              </a>
            ) : null}
            {hotel.whatsapp_phone ? (
              <a
                href={`https://wa.me/${hotel.whatsapp_phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-2xl border border-pale bg-white px-4 py-2.5 text-xs font-bold text-navy dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <WhatsappIcon className="h-4 w-4" />
                {tr("hotels.profile.actions.whatsapp")}
              </a>
            ) : null}
            {hotel.website ? (
              <a
                href={hotel.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-2xl border border-pale bg-white px-4 py-2.5 text-xs font-bold text-navy dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <GlobeIcon className="h-4 w-4" />
                {tr("hotels.profile.actions.website")}
              </a>
            ) : null}
          </div>

          <SocialLinksRow socials={hotel.socials} className="flex-wrap" />

          {/* TEMPORARILY DISABLED: Hide chat entry points until the client
              commercially approves and pays for the messaging feature. Keep
              the implementation wired so it can be re-enabled safely later. */}
          {false && canChat && (
            <button
              type="button"
              onClick={handleChat}
              disabled={isStarting}
              className="h-13 rounded-2xl bg-blue py-3.5 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-60"
            >
              {tr("hotels.profile.actions.chat")}
            </button>
          )}

          {/* Tabs */}
          <div className="flex gap-2 border-b border-pale dark:border-slate-800" role="tablist">
            {(["contents", "ratings"] as const).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`px-4 pb-2 text-sm font-bold transition-colors ${
                  tab === key
                    ? "border-b-2 border-blue text-navy dark:text-slate-100"
                    : "text-gray-400 dark:text-slate-500"
                }`}
              >
                {tr(`hotels.profile.tabs.${key}` as "hotels.profile.tabs.contents")}
              </button>
            ))}
          </div>

          {/* Contents tab */}
          {tab === "contents" && (
            <div className="flex flex-col gap-4">
              {contentsQuery.isLoading && (
                <div className="h-48 w-full animate-pulse rounded-2xl bg-pale/40 dark:bg-slate-800" />
              )}
              {!contentsQuery.isLoading && contents.length === 0 && (
                <p className="py-8 text-center text-sm font-medium text-gray-500 dark:text-slate-400">
                  {tr("hotels.content.empty")}
                </p>
              )}
              {contents.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    navigate({
                      to: "/hotels/$id/contents/$contentId",
                      params: { id, contentId: String(item.id) },
                    })
                  }
                  className="flex flex-col gap-2 rounded-2xl border border-pale bg-white p-3 text-start dark:border-slate-800 dark:bg-slate-900"
                >
                  <MediaGallery attachments={item.attachments} />
                  <p className="line-clamp-3 text-sm font-medium text-gray-600 dark:text-slate-300">
                    {item.description}
                  </p>
                </button>
              ))}

              {contentsPagination &&
                contentsPagination.current_page < contentsPagination.last_page && (
                  <button
                    type="button"
                    disabled={contentsQuery.isFetching}
                    onClick={() => setContentsPage((p) => p + 1)}
                    className="h-12 rounded-2xl border border-pale bg-white text-sm font-bold text-navy disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {contentsQuery.isFetching ? tr("common.loading") : tr("hotels.loadMore")}
                  </button>
                )}
            </div>
          )}

          {/* Ratings tab */}
          {tab === "ratings" && (
            <div className="flex flex-col gap-3">
              {canRate && (
                <button
                  type="button"
                  onClick={() => setRatingOpen(true)}
                  className="h-12 rounded-2xl border-2 border-blue text-sm font-bold text-blue"
                >
                  {tr(hasMyRating ? "hotels.ratings.editCta" : "hotels.ratings.rateCta")}
                </button>
              )}

              {ratingsQuery.isLoading && (
                <div className="h-20 w-full animate-pulse rounded-2xl bg-pale/40 dark:bg-slate-800" />
              )}

              {!ratingsQuery.isLoading && ratings.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-sm font-bold text-navy dark:text-slate-100">
                    {tr("hotels.ratings.empty")}
                  </p>
                  <p className="mt-1 text-xs font-medium text-gray-500 dark:text-slate-400">
                    {tr("hotels.ratings.emptyHint")}
                  </p>
                </div>
              )}

              {ratings.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-2 rounded-2xl border border-pale bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-pale/40 dark:bg-slate-800">
                      <AppImage src={r.user?.image} alt={r.user?.name ?? ""} className="h-full w-full" />
                    </div>
                    <span className="flex-1 truncate text-sm font-bold text-navy dark:text-slate-100">
                      {r.user?.name}
                    </span>
                    <StarRating value={r.stars} size={13} />
                  </div>
                  {r.comment ? (
                    <p className="text-sm font-medium leading-relaxed text-gray-600 dark:text-slate-300">
                      {r.comment}
                    </p>
                  ) : null}
                </div>
              ))}

              {ratingsPagination &&
                ratingsPagination.current_page < ratingsPagination.last_page && (
                  <button
                    type="button"
                    disabled={ratingsQuery.isFetching}
                    onClick={() => setRatingsPage((p) => p + 1)}
                    className="h-12 rounded-2xl border border-pale bg-white text-sm font-bold text-navy disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {ratingsQuery.isFetching ? tr("common.loading") : tr("hotels.loadMore")}
                  </button>
                )}
            </div>
          )}
        </div>
      </div>

      {ratingOpen && (
        <RatingSheet
          hotelId={hotel.id}
          initialStars={myRatingStars}
          initialComment={myRating?.comment ?? hotel.my_rating_comment ?? undefined}
          onClose={() => setRatingOpen(false)}
        />
      )}
    </div>
  );
}
