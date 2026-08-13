import React, { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppImage } from "@/components/AppImage";
import { ChevronRightIcon } from "@/components/Icons";
import { useTranslation } from "@/i18n";
import {
  useInfiniteMessages,
  useMarkConversationRead,
  useSendMessage,
  groupByDay,
} from "@/features/chat/hooks/useChat";
import type { Message } from "@/features/chat/services/chat.service";
import { compressImage } from "@/shared/utils/media-compression";
import { isWithinImageSizeLimit } from "@/shared/utils/media-validation";

export const Route = createFileRoute("/conversations/$id")({
  component: ChatPage,
});

/** Server rule: images.* => max:8192 (kilobytes), 1-10 files. */
const MAX_SERVER_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGES = 10;

function ChatPage() {
  const { t: tr, dir } = useTranslation();
  const navigate = useNavigate();
  const { id } = Route.useParams();

  const [draft, setDraft] = useState("");
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteMessages(id);
  const { sendMessage, isSending } = useSendMessage(id);
  const { markRead } = useMarkConversationRead(id);

  const messages: Message[] = Array.from(
    new Map(
      [...(data?.pages ?? [])]
        .reverse()
        .flatMap((page) => page.data ?? [])
        .map((message) => [message.id, message]),
    ).values(),
  );
  const groups = groupByDay(messages);

  // Jump to the newest message whenever the transcript grows.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.at(-1)?.id]);

  const newestIncomingId = [...messages].reverse().find((message) => !message.is_mine)?.id;
  useEffect(() => {
    if (newestIncomingId) markRead();
  }, [markRead, newestIncomingId]);

  const addImages = async (files: FileList | null) => {
    if (!files?.length) return;
    if (images.length + files.length > MAX_IMAGES) {
      toast.error(tr("hotels.chat.imagesTooMany"));
      return;
    }
    setIsOptimizing(true);
    try {
      const accepted: { file: File; preview: string }[] = [];
      for (const file of Array.from(files)) {
        if (!isWithinImageSizeLimit(file)) {
          toast.error(tr("validation.imageTooLarge"));
          continue;
        }
        const { file: compressed } = await compressImage(file);
        // compressImage deliberately returns the ORIGINAL if compression fails,
        // so re-check against the server's `max:8192` (8 MB per image) here —
        // otherwise a large photo that failed to compress 422s on upload.
        if (compressed.size > MAX_SERVER_IMAGE_BYTES) {
          toast.error(tr("validation.imageTooLarge"));
          continue;
        }
        accepted.push({ file: compressed, preview: URL.createObjectURL(compressed) });
      }
      setImages((prev) => [...prev, ...accepted]);
    } catch (err) {
      console.error("[chat] image processing failed", err);
      toast.error(tr("hotels.chat.sendError"));
    } finally {
      setIsOptimizing(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if ((!body && images.length === 0) || isSending) return;

    // `navigator.onLine === false` is a reliable negative; `true` proves nothing
    // (see the `offline-connectivity` skill), so we still handle the failure.
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      toast.error(tr("hotels.chat.offline"));
      return;
    }

    // Clear optimistically so typing feels immediate, but keep the text/images so
    // they can be restored — losing a typed message on a flaky link is unacceptable.
    setDraft("");
    const pendingImages = images;
    setImages([]);
    try {
      await sendMessage({
        body: body || undefined,
        images: pendingImages.length ? pendingImages.map((i) => i.file) : undefined,
      });
    } catch (err) {
      setDraft(body);
      setImages(pendingImages);
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
        {hasNextPage && (
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="mb-3 h-10 w-full rounded-2xl border border-pale text-xs font-bold text-navy disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"
          >
            {isFetchingNextPage ? tr("common.loading") : tr("hotels.chat.loadOlder")}
          </button>
        )}
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
              const isMine = m.is_mine;
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
                    className={`flex max-w-[75%] flex-col gap-1.5 rounded-2xl px-3.5 py-2.5 text-sm font-medium leading-relaxed ${
                      isMine
                        ? "bg-blue text-white"
                        : "bg-white text-navy dark:bg-slate-900 dark:text-slate-100"
                    }`}
                  >
                    {m.images && m.images.length > 0 && (
                      <div className="grid grid-cols-2 gap-1.5">
                        {m.images.map((src, i) => (
                          <a
                            key={i}
                            href={src}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block h-28 w-full overflow-hidden rounded-xl"
                          >
                            <AppImage src={src} alt="" className="h-full w-full" />
                          </a>
                        ))}
                      </div>
                    )}
                    {m.body && <span>{m.body}</span>}
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
        className="flex shrink-0 flex-col gap-2 border-t border-pale bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-slate-800 dark:bg-slate-900"
      >
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((img, i) => (
              <div key={img.preview} className="relative h-16 w-16 overflow-hidden rounded-xl">
                <AppImage src={img.preview} alt="" className="h-full w-full" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  aria-label={tr("hotels.chat.removeImage")}
                  className="absolute top-1 rtl:left-1 ltr:right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs font-black text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={isOptimizing || images.length >= MAX_IMAGES}
            aria-label={tr("hotels.chat.attachImage")}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-pale text-lg font-bold text-navy disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
          >
            +
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              addImages(e.target.files);
              e.target.value = "";
            }}
          />
          <textarea
            rows={1}
            value={draft}
            // Server rule: `body => ['required','string','min:1','max:5000']` when present.
            maxLength={5000}
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
            disabled={(!draft.trim() && images.length === 0) || isSending || isOptimizing}
            className="h-12 shrink-0 rounded-2xl bg-blue px-5 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
          >
            {isSending ? tr("hotels.chat.sending") : tr("hotels.chat.send")}
          </button>
        </div>
      </form>
    </div>
  );
}
