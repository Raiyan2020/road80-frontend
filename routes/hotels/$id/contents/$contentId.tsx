import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronRightIcon, ShareIcon } from "@/components/Icons";
import { useTranslation } from "@/i18n";
import { shareContent } from "@/shared/utils/share";
import { useHotelContent } from "@/features/hotels/hooks/useHotels";
import { MediaGallery } from "@/features/hotels/components/MediaGallery";
import type { HotelContent } from "@/features/hotels/types";

/**
 * Single content item (use cases 1.4, 1.5).
 *
 * This is the deep-link target for a shared content link
 * (`/hotels/{id}/contents/{contentId}`). If an admin has since hidden or
 * deleted it the API answers 404, which must read as "no longer available"
 * rather than a transient error.
 */
export const Route = createFileRoute("/hotels/$id/contents/$contentId")({
  component: ContentDetailPage,
});

function ContentDetailPage() {
  const { t: tr, dir } = useTranslation();
  const navigate = useNavigate();
  const { id, contentId } = Route.useParams();

  const { data, isLoading, isError } = useHotelContent(id, contentId);
  const content: HotelContent | undefined = (data as any)?.data;

  const back = () => navigate({ to: "/hotels/$id", params: { id }, search: { tab: "contents" } });

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-bg no-scrollbar dark:bg-slate-950" dir={dir}>
      <div className="mx-auto max-w-lg p-4 pb-28">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={back}
            className="flex items-center gap-1 text-sm font-bold text-gray-500 dark:text-slate-400"
          >
            <ChevronRightIcon className="h-5 w-5 rtl:rotate-0 ltr:rotate-180" />
            {tr("common.back")}
          </button>

          {content && (
            <button
              type="button"
              onClick={() =>
                shareContent({
                  title: content.description.slice(0, 60),
                  text: content.description.slice(0, 120),
                  url: content.share_url,
                })
              }
              aria-label={tr("hotels.profile.actions.share")}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-navy dark:bg-slate-800 dark:text-slate-300"
            >
              <ShareIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {isLoading && (
          <div className="flex flex-col gap-3" aria-busy="true">
            <div className="aspect-[4/3] w-full animate-pulse rounded-2xl bg-pale/40 dark:bg-slate-800" />
            <div className="h-4 w-3/4 animate-pulse rounded-full bg-pale/40 dark:bg-slate-800" />
          </div>
        )}

        {isError && !isLoading && (
          <div className="rounded-2xl border border-pale bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-bold text-navy dark:text-slate-100">
              {tr("hotels.content.notFound")}
            </p>
            <p className="mt-1 text-xs font-medium text-gray-500 dark:text-slate-400">
              {tr("hotels.content.notFoundHint")}
            </p>
            <button
              type="button"
              onClick={back}
              className="mt-4 h-11 rounded-2xl bg-blue px-6 text-sm font-bold text-white"
            >
              {tr("hotels.profile.backToHotels")}
            </button>
          </div>
        )}

        {content && (
          <div className="flex flex-col gap-4">
            {/* Owner-only: an admin-hidden item explains why it is not public */}
            {content.status === "hidden" && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                  {tr("hotels.content.hiddenNotice")}
                </p>
                {content.hidden_reason ? (
                  <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                    {tr("hotels.content.hiddenReason", { reason: content.hidden_reason })}
                  </p>
                ) : null}
              </div>
            )}

            <MediaGallery attachments={content.attachments} />

            <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-gray-700 dark:text-slate-300">
              {content.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
