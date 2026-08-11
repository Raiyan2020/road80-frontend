import React, { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppImage } from "@/components/AppImage";
import { ChevronRightIcon } from "@/components/Icons";
import { useTranslation } from "@/i18n";
import { useProfile } from "@/features/account/hooks/useProfile";
import { useMessages, useSendMessage, groupByDay } from "@/features/chat/hooks/useChat";
import type { Message } from "@/features/chat/services/chat.service";

export const Route = createFileRoute("/conversations/$id")({
  component: ChatPage,
});

function ChatPage() {
  const { t: tr, dir } = useTranslation();
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const { profile } = useProfile();

  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useMessages(id);
  const { sendMessage, isSending } = useSendMessage(id);

  const messages: Message[] = (data as any)?.data ?? [];
  const groups = groupByDay(messages);

  // Jump to the newest message whenever the transcript grows.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || isSending) return;

    // `navigator.onLine === false` is a reliable negative; `true` proves nothing
    // (see the `offline-connectivity` skill), so we still handle the failure.
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      toast.error(tr("hotels.chat.offline"));
      return;
    }

    // Clear optimistically so typing feels immediate, but keep the text so it
    // can be restored — losing a typed message on a flaky link is unacceptable.
    setDraft("");
    try {
      await sendMessage(body);
    } catch (err) {
      setDraft(body);
      toast.error((err as any)?.data?.message ?? tr("hotels.chat.sendError"));
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-bg dark:bg-slate-950" dir={dir}>
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-pale bg-white px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => navigate({ to: "/conversations" })}
          aria-label={tr("common.back")}
          className="flex h-9 w-9 items-center justify-center rounded-full text-navy dark:text-slate-200"
        >
          <ChevronRightIcon className="h-5 w-5 rtl:rotate-0 ltr:rotate-180" />
        </button>
        <h1 className="truncate text-sm font-black text-navy dark:text-slate-100">
          {tr("hotels.chat.title")}
        </h1>
      </div>

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-4 py-4">
        {isLoading && (
          <div className="flex flex-col gap-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 w-2/3 animate-pulse rounded-2xl bg-pale/40 dark:bg-slate-800" />
            ))}
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <p className="py-12 text-center text-sm font-medium text-gray-500 dark:text-slate-400">
            {tr("hotels.chat.noMessages")}
          </p>
        )}

        {groups.map((group) => (
          <div key={group.day} className="flex flex-col gap-2">
            {group.day ? (
              <div className="my-2 flex justify-center">
                <span className="rounded-full bg-pale/60 px-3 py-1 text-[11px] font-bold text-gray-500 dark:bg-slate-800 dark:text-slate-400">
                  {group.day}
                </span>
              </div>
            ) : null}

            {group.items.map((m) => {
              const isMine = m.sender?.id === profile?.id;
              return (
                <div
                  key={m.id}
                  className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}
                >
                  {!isMine && (
                    <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-pale/40 dark:bg-slate-800">
                      <AppImage src={m.sender?.image} alt="" className="h-full w-full" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm font-medium leading-relaxed ${
                      isMine
                        ? "bg-blue text-white"
                        : "bg-white text-navy dark:bg-slate-900 dark:text-slate-100"
                    }`}
                  >
                    {m.body}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSend}
        className="flex shrink-0 items-end gap-2 border-t border-pale bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-slate-800 dark:bg-slate-900"
      >
        <textarea
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends; Shift+Enter inserts a newline.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(e as unknown as React.FormEvent);
            }
          }}
          placeholder={tr("hotels.chat.messagePlaceholder")}
          aria-label={tr("hotels.chat.messagePlaceholder")}
          className="max-h-28 flex-1 resize-none rounded-2xl border border-pale bg-gray-50 px-4 py-3 text-sm font-medium text-navy outline-none focus:border-blue dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200"
        />
        <button
          type="submit"
          disabled={!draft.trim() || isSending}
          className="h-12 shrink-0 rounded-2xl bg-blue px-5 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
        >
          {isSending ? tr("hotels.chat.sending") : tr("hotels.chat.send")}
        </button>
      </form>
    </div>
  );
}
