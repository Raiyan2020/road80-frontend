import React, { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/i18n";
import { StarRating } from "./StarRating";
import { useRateHotel } from "../hooks/useHotels";

interface RatingSheetProps {
  hotelId: number | string;
  /** The viewer's existing rating, if they have one — re-submitting updates it. */
  initialStars?: number;
  initialComment?: string;
  onClose: () => void;
}

const MAX_COMMENT = 1000;

/**
 * Add or update a hotel rating (use case 5.2).
 *
 * One rating per user per hotel: the endpoint treats a re-submit as an update,
 * so there is no separate "edit" call and no duplicate to guard against.
 */
export function RatingSheet({
  hotelId,
  initialStars,
  initialComment,
  onClose,
}: RatingSheetProps) {
  const { t: tr, dir } = useTranslation();
  const rate = useRateHotel(hotelId);

  const [stars, setStars] = useState(initialStars ?? 0);
  const [comment, setComment] = useState(initialComment ?? "");
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!initialStars;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stars < 1) {
      setError(tr("hotels.ratings.starsRequired"));
      return;
    }
    setError(null);

    try {
      await rate.mutateAsync({
        stars,
        comment: comment.trim() || undefined,
      });
      toast.success(tr("hotels.ratings.submitSuccess"));
      onClose();
    } catch (err) {
      // The backend distinguishes these; surface the specific reason rather
      // than a generic failure.
      const message = (err as any)?.data?.message ?? "";
      if (/cannot_rate_own_hotel/.test(message)) {
        setError(tr("hotels.ratings.cannotRateOwn"));
      } else if (/hotel_only_action|hotel/.test(message) && /rate/.test(message)) {
        setError(tr("hotels.ratings.hotelCannotRate"));
      } else {
        setError(message || tr("hotels.ratings.submitError"));
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label={tr(isEdit ? "hotels.ratings.editTitle" : "hotels.ratings.addTitle")}
      onClick={onClose}
      dir={dir}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-lg flex-col gap-4 rounded-t-[32px] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] dark:bg-slate-900"
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-gray-200 dark:bg-slate-700" />

        <h2 className="text-lg font-black text-navy dark:text-slate-100">
          {tr(isEdit ? "hotels.ratings.editTitle" : "hotels.ratings.addTitle")}
        </h2>

        {isEdit && (
          <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
            {tr("hotels.ratings.updateNote")}
          </p>
        )}

        <div className="flex flex-col items-center gap-2 py-2">
          <span className="text-sm font-bold text-navy dark:text-slate-200">
            {tr("hotels.ratings.starsLabel")}
          </span>
          <StarRating
            value={stars}
            onChange={(n) => {
              setStars(n);
              setError(null);
            }}
            label={tr("hotels.ratings.starsLabel")}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="rating-comment" className="px-1 text-sm font-bold text-navy dark:text-slate-200">
            {tr("hotels.ratings.commentLabel")}{" "}
            <span className="font-medium text-gray-400">
              ({tr("hotels.ratings.commentOptional")})
            </span>
          </label>
          <textarea
            id="rating-comment"
            rows={4}
            maxLength={MAX_COMMENT}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={tr("hotels.ratings.commentPlaceholder")}
            className="rounded-2xl border border-pale bg-gray-50 p-4 text-sm font-bold text-navy outline-none focus:border-blue dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200"
          />
          <span className="px-1 text-[11px] font-medium text-gray-400">
            {comment.length} / {MAX_COMMENT}
          </span>
        </div>

        {error && <p className="px-1 text-xs font-medium text-red-500">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-13 flex-1 rounded-2xl border border-pale py-3 text-sm font-bold text-navy dark:border-slate-700 dark:text-slate-200"
          >
            {tr("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={rate.isPending}
            className="flex-1 rounded-2xl bg-blue py-3 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-60"
          >
            {rate.isPending ? tr("common.saving") : tr("hotels.ratings.submit")}
          </button>
        </div>
      </form>
    </div>
  );
}
