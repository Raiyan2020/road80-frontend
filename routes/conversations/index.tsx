import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppImage } from "@/components/AppImage";
import { useTranslation } from "@/i18n";
import { useInfiniteConversations } from "@/features/chat/hooks/useChat";
import type { Conversation } from "@/features/chat/services/chat.service";

/**
 * Conversation list (use case 1.6).
 *
 * Serves both sides: a user sees their hotel threads, a hotel sees incoming
 * user threads. `participant` is always the *other* party, so the same row
 * renders correctly for either account type.
 */
export const Route = createFileRoute("/conversations/")({
  component: ConversationsPage,
});

function ConversationsPage() {
  const { t: tr, dir } = useTranslation();
  const navigate = useNavigate();
  const {
    data,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteConversations();

  const conversations: Conversation[] = Array.from(
    new Map(
      (data?.pages ?? [])
        .flatMap((page) => page.data ?? [])
        .map((conversation) => [conversation.id, conversation]),
    ).values(),
  );

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-bg no-scrollbar dark:bg-slate-950" dir={dir}>
      <div className="mx-auto max-w-lg p-4 pb-28">
        <h1 className="mb-4 text-2xl font-black tracking-tight text-navy dark:text-slate-100">
          {tr("hotels.chat.title")}
        </h1>

        {isLoading && (
          <div className="flex flex-col gap-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 w-full animate-pulse rounded-2xl bg-pale/40 dark:bg-slate-800" />
            ))}
          </div>
        )}

        {isError && !isLoading && (
          <div className="rounded-2xl border border-pale bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="mb-3 text-sm font-bold text-navy dark:text-slate-100">
              {tr("hotels.chat.loadError")}
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

        {!isLoading && !isError && conversations.length === 0 && (
          <div className="rounded-2xl border border-pale bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-bold text-navy dark:text-slate-100">
              {tr("hotels.chat.empty")}
            </p>
            <p className="mt-1 text-xs font-medium text-gray-500 dark:text-slate-400">
              {tr("hotels.chat.emptyHint")}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {conversations.map((c) => {
            const unread = c.unread_count > 0;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => navigate({ to: "/conversations/$id", params: { id: String(c.id) } })}
                className="flex items-center gap-3 rounded-2xl border border-pale bg-white p-3 text-start dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-pale/40 dark:bg-slate-800">
                  <AppImage src={c.participant?.image} alt={c.participant?.name ?? ""} className="h-full w-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-navy dark:text-slate-100">
                    {c.participant?.name}
                  </p>
                  <p className={`truncate text-xs ${unread ? "font-bold text-navy dark:text-slate-200" : "font-medium text-gray-500 dark:text-slate-400"}`}>
                    {c.latest_message?.body ||
                      (c.latest_message?.images?.length
                        ? tr("hotels.chat.imageMessage")
                        : tr("hotels.chat.noMessages"))}
                  </p>
                </div>
                {unread ? <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue" aria-label="unread" /> : null}
              </button>
            );
          })}
        </div>
        {hasNextPage && (
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="mt-4 h-11 w-full rounded-2xl border border-pale text-sm font-bold text-navy disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"
          >
            {isFetchingNextPage
              ? tr("common.loading")
              : tr("hotels.chat.loadMoreConversations")}
          </button>
        )}
      </div>
    </div>
  );
}
