import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ChevronRightIcon } from "@/components/Icons";
import { useTranslation } from "@/i18n";
import { useIsHotel } from "@/features/account/hooks/useHotelProfile";
import {
  useMyHotelContents,
  useDeleteHotelContent,
} from "@/features/hotels/hooks/useMyHotelContents";
import { MediaGallery } from "@/features/hotels/components/MediaGallery";
import { HotelContentForm } from "@/features/hotels/components/HotelContentForm";
import type { HotelContent } from "@/features/hotels/types";

/**
 * Hotel content management (use case 1.3) — owner only.
 *
 * Lists the hotel's own items, including any an admin has hidden (those show
 * the reason, which only the owner receives).
 */
export const Route = createFileRoute("/profile/hotel-contents")({
  component: HotelContentsPage,
});

function HotelContentsPage() {
  const { t: tr, dir } = useTranslation();
  const navigate = useNavigate();
  const { isHotel, isLoading: loadingAccount } = useIsHotel();

  const { data, isLoading } = useMyHotelContents();
  const { deleteContent } = useDeleteHotelContent();

  const [editing, setEditing] = useState<HotelContent | null>(null);
  const [creating, setCreating] = useState(false);

  const contents: HotelContent[] = (data as any)?.data ?? [];

  const handleDelete = async (item: HotelContent) => {
    if (!window.confirm(tr("hotels.content.deleteConfirm"))) return;
    try {
      await deleteContent(item.id);
      toast.success(tr("hotels.content.deleteSuccess"));
    } catch (err) {
      toast.error((err as any)?.data?.message ?? tr("hotels.content.saveError"));
    }
  };

  const showForm = creating || !!editing;

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-bg no-scrollbar dark:bg-slate-950" dir={dir}>
      <div className="mx-auto max-w-lg p-4 pb-28">
        <button
          type="button"
          onClick={() =>
            showForm
              ? (setCreating(false), setEditing(null))
              : navigate({ to: "/profile" })
          }
          className="mb-6 flex items-center gap-1 text-sm font-bold text-gray-500 dark:text-slate-400"
        >
          <ChevronRightIcon className="h-5 w-5 rtl:rotate-0 ltr:rotate-180" />
          {tr("common.back")}
        </button>

        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-navy dark:text-slate-100">
            {showForm
              ? tr(editing ? "hotels.content.editTitle" : "hotels.content.createTitle")
              : tr("hotels.content.manageTitle")}
          </h1>
          {!showForm && (
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
              {tr("hotels.content.manageSubtitle")}
            </p>
          )}
        </div>

        <div className="rounded-[32px] border border-pale bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          {loadingAccount ? (
            <div className="h-32 w-full animate-pulse rounded-2xl bg-pale/40 dark:bg-slate-800" aria-busy="true" />
          ) : !isHotel ? (
            <p className="py-8 text-center text-sm font-medium text-gray-500 dark:text-slate-400">
              {tr("profile.hotel.onlyHotelAccounts")}
            </p>
          ) : showForm ? (
            <HotelContentForm
              existing={editing ?? undefined}
              onDone={() => {
                setCreating(false);
                setEditing(null);
              }}
            />
          ) : (
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="h-12 rounded-2xl bg-blue text-sm font-bold text-white transition-all active:scale-95"
              >
                {tr("hotels.content.addNew")}
              </button>

              {isLoading && (
                <div className="h-40 w-full animate-pulse rounded-2xl bg-pale/40 dark:bg-slate-800" aria-busy="true" />
              )}

              {!isLoading && contents.length === 0 && (
                <p className="py-8 text-center text-sm font-medium text-gray-500 dark:text-slate-400">
                  {tr("hotels.content.emptyOwner")}
                </p>
              )}

              {contents.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-2xl border border-pale p-3 dark:border-slate-700"
                >
                  {item.status === "hidden" && (
                    <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-500/10">
                      <span className="text-xs font-black text-amber-800 dark:text-amber-300">
                        {tr("hotels.content.hiddenBadge")}
                      </span>
                      {item.hidden_reason ? (
                        <p className="mt-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                          {tr("hotels.content.hiddenReason", { reason: item.hidden_reason })}
                        </p>
                      ) : null}
                    </div>
                  )}

                  <MediaGallery attachments={item.attachments} />

                  <p className="line-clamp-3 text-sm font-medium text-gray-600 dark:text-slate-300">
                    {item.description}
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(item)}
                      className="flex-1 rounded-xl border border-pale py-2.5 text-xs font-bold text-navy dark:border-slate-700 dark:text-slate-200"
                    >
                      {tr("common.edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="flex-1 rounded-xl border border-red-200 py-2.5 text-xs font-bold text-red-500 dark:border-red-500/30"
                    >
                      {tr("common.delete")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
