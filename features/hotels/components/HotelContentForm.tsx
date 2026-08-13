import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { AppImage } from "@/components/AppImage";
import { useTranslation } from "@/i18n";
import { compressImage } from "@/shared/utils/media-compression";
import { isWithinImageSizeLimit } from "@/shared/utils/media-validation";
import {
  useChunkedVideoUpload,
  isVideoUploadCancelled,
} from "@/features/post-ad/hooks/useChunkedVideoUpload";
import {
  useCreateHotelContent,
  useUpdateHotelContent,
} from "../hooks/useMyHotelContents";
import { isHotelContentUploadActive } from "../utils/hotel-content-upload";
import { youtubeId, normalizeYoutubeUrl } from "./MediaGallery";
import type { HotelContent } from "../types";

interface HotelContentFormProps {
  /** Present when editing; absent when creating. */
  existing?: HotelContent;
  onDone: () => void;
}

const MAX_DESCRIPTION = 5000;

/** Server rule: `images.* => max:8192` (kilobytes). */
const MAX_SERVER_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEOS = 2;
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);
const ALLOWED_VIDEO_EXTENSIONS = /\.(mp4|webm)$/i;

/**
 * Create or edit one content item (use case 1.3).
 *
 * Content may be images only, video only, YouTube only, or any combination —
 * the only rule is that at least one attachment exists alongside a description.
 * Publishing is immediate; there is no approval step.
 */
export function HotelContentForm({ existing, onDone }: HotelContentFormProps) {
  const { t: tr } = useTranslation();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const { createContent, isCreating } = useCreateHotelContent();
  const { updateContent, isUpdating } = useUpdateHotelContent();
  const { uploadState, uploadVideo, reset: resetUpload } = useChunkedVideoUpload();

  const [description, setDescription] = useState(existing?.description ?? "");
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [youtubeUrls, setYoutubeUrls] = useState<string[]>([]);
  const [youtubeDraft, setYoutubeDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const isEdit = !!existing;
  const busy =
    isCreating ||
    isUpdating ||
    isOptimizing ||
    isHotelContentUploadActive(uploadState);

  // Any new attachment replaces the whole existing set (§8.3), so the warning
  // only matters while editing something that already has attachments.
  const willReplace =
    isEdit &&
    (existing?.attachments.length ?? 0) > 0 &&
    (images.length > 0 || !!videoFile || youtubeUrls.length > 0);

  const addImages = async (files: FileList | null) => {
    if (!files?.length) return;
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
      setError(null);
    } catch (err) {
      console.error("[hotel-content] image processing failed", err);
      toast.error(tr("hotels.content.saveError"));
    } finally {
      setIsOptimizing(false);
    }
  };

  const addYoutube = () => {
    const url = youtubeDraft.trim();
    if (!url) return;
    if (!youtubeId(url)) {
      setError(tr("hotels.content.validation.youtubeInvalid"));
      return;
    }
    if (youtubeUrls.length + (videoFile ? 1 : 0) >= MAX_VIDEOS) {
      setError(tr("hotels.content.validation.videosTooMany"));
      return;
    }
    // Stored already-normalised so the payload always carries a scheme.
    setYoutubeUrls((prev) => [...prev, normalizeYoutubeUrl(url)]);
    setYoutubeDraft("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = description.trim();
    if (!trimmed) return setError(tr("hotels.content.validation.descriptionRequired"));
    if (trimmed.length < 3) return setError(tr("hotels.content.validation.descriptionMin"));
    if (trimmed.length > MAX_DESCRIPTION)
      return setError(tr("hotels.content.validation.descriptionMax"));
    if (youtubeUrls.length + (videoFile ? 1 : 0) > MAX_VIDEOS)
      return setError(tr("hotels.content.validation.videosTooMany"));

    const hasNewAttachment = images.length > 0 || !!videoFile || youtubeUrls.length > 0;
    const keepsExisting = isEdit && (existing?.attachments.length ?? 0) > 0;
    if (!hasNewAttachment && !keepsExisting) {
      return setError(tr("hotels.content.validation.needsAttachment"));
    }
    setError(null);

    try {
      // Video first: the merged server path is required in the same payload.
      let videoPaths: string[] | undefined;
      if (videoFile) {
        const path = await uploadVideo(videoFile);
        if (path) videoPaths = [path];
      }

      const input = {
        description: trimmed,
        images: images.map((i) => i.file),
        videoPaths,
        youtubeUrls,
      };

      if (isEdit && existing) {
        await updateContent({ id: existing.id, input });
        toast.success(tr("hotels.content.updateSuccess"));
      } else {
        await createContent(input);
        toast.success(tr("hotels.content.createSuccess"));
      }
      resetUpload();
      onDone();
    } catch (err) {
      // A cancelled upload is a user decision, not a failure to report.
      if (isVideoUploadCancelled(err)) return;
      const fieldErrors = (err as any)?.data?.errors;
      const message =
        (fieldErrors && Object.values(fieldErrors)[0]) ??
        (err as any)?.data?.message ??
        tr("hotels.content.saveError");
      setError(Array.isArray(message) ? String(message[0]) : String(message));
    }
  };

  const inputClass =
    "rounded-2xl border border-pale bg-gray-50 p-4 text-sm font-bold text-navy outline-none focus:border-blue dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {willReplace && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          {tr("hotels.content.replaceWarning")}
        </p>
      )}

      {/* Description */}
      <div className="flex flex-col gap-2">
        <label htmlFor="content-description" className="px-1 text-sm font-bold text-navy dark:text-slate-200">
          {tr("hotels.content.descriptionLabel")}
        </label>
        <textarea
          id="content-description"
          rows={5}
          maxLength={MAX_DESCRIPTION}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={tr("hotels.content.descriptionPlaceholder")}
          className={inputClass}
        />
      </div>

      {/* Images */}
      <div className="flex flex-col gap-2">
        <label className="px-1 text-sm font-bold text-navy dark:text-slate-200">
          {tr("hotels.content.imagesLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div key={img.preview} className="relative h-20 w-20 overflow-hidden rounded-xl">
              <AppImage src={img.preview} alt="" className="h-full w-full" />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                aria-label={tr("hotels.content.removeItem")}
                className="absolute top-1 rtl:left-1 ltr:right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs font-black text-white"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="h-20 w-20 rounded-xl border-2 border-dashed border-gray-300 text-xs font-bold text-gray-400 dark:border-slate-600"
          >
            +
          </button>
        </div>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => addImages(e.target.files)}
        />
        <p className="px-1 text-[11px] font-medium text-gray-400">
          {tr("hotels.content.imagesHint")}
        </p>
      </div>

      {/* Video */}
      <div className="flex flex-col gap-2">
        <label className="px-1 text-sm font-bold text-navy dark:text-slate-200">
          {tr("hotels.content.videoLabel")}
        </label>
        {videoFile ? (
          <div className="flex items-center justify-between rounded-2xl border border-pale p-3 dark:border-slate-700">
            <span className="truncate text-xs font-bold text-navy dark:text-slate-200">
              {videoFile.name}
            </span>
            <button
              type="button"
              onClick={() => setVideoFile(null)}
              className="text-xs font-bold text-red-500"
            >
              {tr("hotels.content.removeItem")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="h-12 rounded-2xl border-2 border-dashed border-gray-300 text-sm font-bold text-gray-500 dark:border-slate-600 dark:text-slate-400"
          >
            {tr("hotels.content.addVideo")}
          </button>
        )}
        <input
          ref={videoInputRef}
          type="file"
          accept=".mp4,.webm,video/mp4,video/webm"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            e.target.value = "";
            if (!file) return;
            const hasAllowedType = ALLOWED_VIDEO_TYPES.has(file.type);
            const hasAllowedExtension = ALLOWED_VIDEO_EXTENSIONS.test(file.name);
            if (!hasAllowedType && !hasAllowedExtension) {
              setError(tr("hotels.content.validation.videoInvalidFormat"));
              return;
            }
            if (youtubeUrls.length + 1 > MAX_VIDEOS) {
              setError(tr("hotels.content.validation.videosTooMany"));
              return;
            }
            setVideoFile(file);
            setError(null);
          }}
        />

        {uploadState?.status === "uploading" && (
          <div className="flex flex-col gap-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-pale dark:bg-slate-800">
              <div
                className="h-full bg-blue transition-all"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400">
              {tr("hotels.content.uploadingVideo", { percent: uploadState.progress })}
            </span>
          </div>
        )}

        <p className="px-1 text-[11px] font-medium text-gray-400">
          {tr("hotels.content.videoHint")}
        </p>
      </div>

      {/* YouTube */}
      <div className="flex flex-col gap-2">
        <label htmlFor="youtube-url" className="px-1 text-sm font-bold text-navy dark:text-slate-200">
          {tr("hotels.content.youtubeLabel")}
        </label>
        {youtubeUrls.map((url, i) => (
          <div key={url} className="flex items-center justify-between gap-2 rounded-2xl border border-pale p-3 dark:border-slate-700">
            <span dir="ltr" className="truncate text-xs font-medium text-navy dark:text-slate-200">{url}</span>
            <button
              type="button"
              onClick={() => setYoutubeUrls((prev) => prev.filter((_, idx) => idx !== i))}
              className="shrink-0 text-xs font-bold text-red-500"
            >
              {tr("hotels.content.removeItem")}
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <input
            id="youtube-url"
            dir="ltr"
            value={youtubeDraft}
            onChange={(e) => setYoutubeDraft(e.target.value)}
            placeholder={tr("hotels.content.youtubePlaceholder")}
            className={`${inputClass} h-12 flex-1 py-0 text-start`}
          />
          <button
            type="button"
            onClick={addYoutube}
            className="h-12 shrink-0 rounded-2xl border border-pale px-4 text-sm font-bold text-navy dark:border-slate-700 dark:text-slate-200"
          >
            {tr("hotels.content.addYoutube")}
          </button>
        </div>
      </div>

      {error && <p className="px-1 text-xs font-medium text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="h-13 rounded-2xl bg-blue py-3.5 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-60"
      >
        {busy
          ? tr("common.saving")
          : tr(isEdit ? "hotels.content.saveEdit" : "hotels.content.save")}
      </button>
    </form>
  );
}
