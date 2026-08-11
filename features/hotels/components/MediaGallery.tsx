import React, { useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { AppImage } from "@/components/AppImage";
import { useTranslation } from "@/i18n";
import type { ContentAttachment } from "../types";

/**
 * Extracts the YouTube video id from the URL forms the backend accepts.
 * Returns null for anything unrecognised so the caller can fall back to a link.
 */
export function youtubeId(url: string | null): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/(?:embed|shorts|v)\/)([\w-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

/** Native file paths are not usable as a `src` — see the `capacitor-native` skill. */
const toDisplayUrl = (url: string | null): string => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url) || url.startsWith("blob:") || url.startsWith("data:")) {
    return url;
  }
  return Capacitor.convertFileSrc(url);
};

interface MediaGalleryProps {
  attachments: ContentAttachment[];
  className?: string;
}

/**
 * Renders one content item's attachments (use cases 1.3, 1.4).
 *
 * Handles every combination the spec allows: images only, video only, YouTube
 * only, or a mix. A single image renders without swipe affordances —
 * «إذا احتوى المحتوى على صورة واحدة فقط، يتم عرضها دون الحاجة إلى التمرير».
 */
export function MediaGallery({ attachments, className = "" }: MediaGalleryProps) {
  const { t: tr, isRTL } = useTranslation();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const sorted = [...attachments].sort((a, b) => a.sort_order - b.sort_order);
  const images = sorted.filter((a) => a.type === "image");
  const videos = sorted.filter((a) => a.type === "video");
  const youtubes = sorted.filter((a) => a.type === "youtube");

  if (!sorted.length) return null;

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el || !images.length) return;
    // In RTL the scroller's scrollLeft runs negative in most engines; abs()
    // keeps the page indicator correct in both directions.
    const page = Math.round(Math.abs(el.scrollLeft) / el.clientWidth);
    setIndex(Math.min(page, images.length - 1));
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {images.length > 0 && (
        <div className="relative">
          <div
            ref={scrollerRef}
            onScroll={onScroll}
            dir={isRTL ? "rtl" : "ltr"}
            className="flex w-full snap-x snap-mandatory overflow-x-auto rounded-2xl no-scrollbar"
          >
            {images.map((img) => (
              <div
                key={img.id}
                className="aspect-[4/3] w-full shrink-0 snap-center bg-pale/40 dark:bg-slate-800"
              >
                <AppImage
                  src={toDisplayUrl(img.file)}
                  alt=""
                  className="h-full w-full"
                />
              </div>
            ))}
          </div>

          {images.length > 1 && (
            <>
              <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {images.map((img, i) => (
                  <span
                    key={img.id}
                    className={`h-1.5 rounded-full transition-all ${
                      i === index ? "w-4 bg-white" : "w-1.5 bg-white/60"
                    }`}
                  />
                ))}
              </div>
              <span className="pointer-events-none absolute top-3 rtl:left-3 ltr:right-3 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-bold text-white">
                {tr("hotels.content.imageCounter", {
                  current: index + 1,
                  total: images.length,
                })}
              </span>
            </>
          )}
        </div>
      )}

      {videos.map((v) => (
        <video
          key={v.id}
          src={toDisplayUrl(v.file)}
          controls
          playsInline
          preload="metadata"
          className="w-full rounded-2xl bg-black"
        />
      ))}

      {youtubes.map((y) => {
        const id = youtubeId(y.youtube_url);
        // An unparseable link still gets an escape hatch rather than nothing.
        if (!id) {
          return (
            <a
              key={y.id}
              href={y.youtube_url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-pale p-4 text-center text-sm font-bold text-blue dark:border-slate-700"
            >
              {tr("hotels.content.openOnYoutube")}
            </a>
          );
        }
        return (
          <div key={y.id} className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${id}`}
              title="YouTube"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full border-0"
            />
          </div>
        );
      })}
    </div>
  );
}
