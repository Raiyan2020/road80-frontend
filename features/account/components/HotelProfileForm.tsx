import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppImage } from "@/components/AppImage";
import { useTranslation } from "@/i18n";
import { useCountries, useStates } from "@/shared/hooks/useLocation";
import {
  compressImage,
  AVATAR_OPTIONS,
  COVER_OPTIONS,
} from "@/shared/utils/media-compression";
import { isWithinImageSizeLimit } from "@/shared/utils/media-validation";
import { useProfile } from "../hooks/useProfile";
import { useUpdateHotelProfile } from "../hooks/useHotelProfile";
import {
  hotelProfileSchema,
  normalizeWebsite,
} from "../schemas/hotel-profile.schema";

type FieldName =
  | "name"
  | "caption"
  | "email"
  | "whatsapp_phone"
  | "country_id"
  | "state_id"
  | "website"
  | "star_rating";

type Errors = Partial<Record<FieldName, string>>;

const STAR_CHOICES = [1, 2, 3, 4, 5] as const;

/**
 * Hotel profile editor — use case 1.2.
 *
 * Reuses the shared profile endpoint; `cover_image`, `website` and `star_rating`
 * are the hotel-only additions. The backend rejects those three for `user` and
 * `company` accounts, so this form is only rendered behind an `isHotel` guard.
 */
export function HotelProfileForm() {
  const { t: tr, isRTL } = useTranslation();
  const { profile, isLoading } = useProfile();
  const { updateHotelProfile, isUpdating } = useUpdateHotelProfile();

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Errors>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const [form, setForm] = useState({
    name: "",
    caption: "",
    email: "",
    whatsapp_phone: "",
    country_id: "" as string | number,
    state_id: "" as string | number,
    website: "",
    star_rating: "" as string | number,
  });

  // Hydrate once the profile arrives. Keyed on `profile?.id` rather than the
  // whole object so a background refetch doesn't discard in-progress edits.
  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name ?? "",
      caption: profile.caption ?? "",
      email: profile.email ?? "",
      whatsapp_phone: profile.whatsapp_phone ?? "",
      country_id: profile.country_id ?? "",
      state_id: profile.state_id ?? "",
      website: profile.website ?? "",
      star_rating: profile.star_rating ?? "",
    });
    setLogoPreview(profile.image ?? null);
    setCoverPreview(profile.cover_image ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const { data: countriesResponse } = useCountries();
  const countries = (countriesResponse as any)?.data || countriesResponse || [];
  const { data: statesResponse, isLoading: loadingStates } = useStates(
    form.country_id,
  );
  const states = (statesResponse as any)?.data || statesResponse || [];

  const selectChevronStyle: React.CSSProperties = {
    backgroundPosition: isRTL ? "left 1rem center" : "right 1rem center",
    backgroundRepeat: "no-repeat",
    backgroundImage:
      'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a9c2e0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
    backgroundSize: "0.65rem auto",
  };

  const setField = (name: FieldName, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "country_id" ? { state_id: "" } : {}),
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      if (name === "country_id") delete next.state_id;
      return next;
    });
  };

  const handleImage = async (
    file: File | undefined,
    kind: "logo" | "cover",
  ) => {
    if (!file) return;
    if (!isWithinImageSizeLimit(file)) {
      toast.error(tr("validation.imageTooLarge"));
      return;
    }
    setIsOptimizing(true);
    try {
      const { file: compressed } = await compressImage(
        file,
        kind === "logo" ? AVATAR_OPTIONS : COVER_OPTIONS,
      );
      const preview = URL.createObjectURL(compressed);
      if (kind === "logo") {
        setLogoFile(compressed);
        setLogoPreview(preview);
      } else {
        setCoverFile(compressed);
        setCoverPreview(preview);
      }
    } catch (error) {
      // Never silently swallow — see the `observability` skill.
      console.error(`[hotel-profile] ${kind} compression failed`, error);
      toast.error(tr("profile.hotel.saveError"));
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = hotelProfileSchema.safeParse(form);
    if (!result.success) {
      const next: Errors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as FieldName;
        if (field && !next[field]) next[field] = issue.message;
      });
      setErrors(next);
      return;
    }
    setErrors({});

    try {
      await updateHotelProfile({
        name: form.name,
        caption: form.caption,
        email: form.email,
        whatsapp_phone: form.whatsapp_phone,
        country_id: form.country_id,
        state_id: form.state_id,
        // Bare domains are accepted in the field; the backend wants a real URL.
        website: form.website ? normalizeWebsite(form.website) : "",
        star_rating: form.star_rating,
        image: logoFile,
        cover_image: coverFile,
      });
      toast.success(tr("profile.hotel.saveSuccess"));
      setLogoFile(null);
      setCoverFile(null);
    } catch (error) {
      // 422 with field errors → show them on the inputs rather than a toast.
      const fieldErrors = (error as any)?.data?.errors;
      if (fieldErrors && Object.keys(fieldErrors).length) {
        const next: Errors = {};
        Object.entries(fieldErrors).forEach(([key, messages]) => {
          next[key as FieldName] = Array.isArray(messages)
            ? String(messages[0])
            : String(messages);
        });
        setErrors(next);
        return;
      }
      toast.error(
        (error as any)?.data?.message ?? tr("profile.hotel.saveError"),
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <div className="h-36 w-full animate-pulse rounded-2xl bg-pale/40 dark:bg-slate-800" />
        <div className="h-14 w-full animate-pulse rounded-2xl bg-pale/40 dark:bg-slate-800" />
        <div className="h-14 w-full animate-pulse rounded-2xl bg-pale/40 dark:bg-slate-800" />
      </div>
    );
  }

  const fieldError = (name: FieldName) =>
    errors[name] ? (
      <p className="px-1 text-xs font-medium text-red-500">{errors[name]}</p>
    ) : null;

  const inputClass =
    "h-14 px-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-pale dark:border-slate-700 text-navy dark:text-slate-200 font-bold outline-none focus:border-blue transition-colors";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {/* Cover image — optional, per «يمكن حفظ باقي بيانات البروفايل» */}
      <div className="flex flex-col gap-2">
        <label className="px-1 text-sm font-bold text-navy dark:text-slate-200">
          {tr("profile.hotel.coverLabel")}
        </label>
        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          className="relative h-36 w-full overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 transition-all active:scale-[0.99] dark:border-slate-600 dark:bg-slate-800"
        >
          {coverPreview ? (
            <AppImage
              src={coverPreview}
              alt={tr("profile.hotel.coverLabel")}
              className="h-full w-full"
            />
          ) : (
            <span className="text-sm font-bold text-gray-400 dark:text-slate-500">
              {tr("profile.hotel.coverAdd")}
            </span>
          )}
        </button>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImage(e.target.files?.[0], "cover")}
        />
        <p className="px-1 text-[11px] font-medium text-gray-400 dark:text-slate-500">
          {tr("profile.hotel.coverHint")}
        </p>
      </div>

      {/* Logo */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm font-bold text-navy dark:text-slate-200">
          {tr("profile.hotel.logoLabel")}
        </span>
        <button
          type="button"
          onClick={() => logoInputRef.current?.click()}
          className="h-28 w-28 overflow-hidden rounded-3xl border-2 border-dashed border-gray-300 bg-gray-50 transition-all active:scale-95 dark:border-slate-600 dark:bg-slate-800"
        >
          <AppImage
            src={logoPreview}
            alt={tr("profile.hotel.logoLabel")}
            className="h-full w-full"
          />
        </button>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImage(e.target.files?.[0], "logo")}
        />
      </div>

      {/* Name */}
      <div className="flex flex-col gap-2">
        <label htmlFor="hotel-name" className="px-1 text-sm font-bold text-navy dark:text-slate-200">
          {tr("profile.hotel.nameLabel")}
        </label>
        <input
          id="hotel-name"
          name="name"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          placeholder={tr("profile.hotel.namePlaceholder")}
          className={inputClass}
        />
        {fieldError("name")}
      </div>

      {/* Caption */}
      <div className="flex flex-col gap-2">
        <label htmlFor="hotel-caption" className="px-1 text-sm font-bold text-navy dark:text-slate-200">
          {tr("profile.hotel.captionLabel")}
        </label>
        <textarea
          id="hotel-caption"
          name="caption"
          rows={4}
          value={form.caption}
          onChange={(e) => setField("caption", e.target.value)}
          placeholder={tr("profile.hotel.captionPlaceholder")}
          className="rounded-2xl border border-pale bg-gray-50 p-4 font-bold text-navy outline-none transition-colors focus:border-blue dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200"
        />
        {fieldError("caption")}
      </div>

      {/* Star rating — hotel only */}
      <div className="flex flex-col gap-2">
        <label htmlFor="hotel-stars" className="px-1 text-sm font-bold text-navy dark:text-slate-200">
          {tr("profile.hotel.starRatingLabel")}
        </label>
        <select
          id="hotel-stars"
          name="star_rating"
          value={String(form.star_rating ?? "")}
          onChange={(e) => setField("star_rating", e.target.value)}
          style={selectChevronStyle}
          className={`${inputClass} appearance-none rtl:pr-10 ltr:pl-10`}
        >
          <option value="">{tr("profile.hotel.starRatingPlaceholder")}</option>
          {STAR_CHOICES.map((n) => (
            <option key={n} value={n}>
              {/* Arabic needs singular/dual/plural, not one template */}
              {n === 1
                ? tr("profile.hotel.starsOne")
                : n === 2
                  ? tr("profile.hotel.starsTwo")
                  : tr("profile.hotel.starsMany", { count: n })}
            </option>
          ))}
        </select>
        <p className="px-1 text-[11px] font-medium text-gray-400 dark:text-slate-500">
          {tr("profile.hotel.starRatingHint")}
        </p>
        {fieldError("star_rating")}
      </div>

      {/* Website — hotel only, optional */}
      <div className="flex flex-col gap-2">
        <label htmlFor="hotel-website" className="px-1 text-sm font-bold text-navy dark:text-slate-200">
          {tr("profile.hotel.websiteLabel")}
        </label>
        <input
          id="hotel-website"
          name="website"
          inputMode="url"
          dir="ltr"
          value={form.website}
          onChange={(e) => setField("website", e.target.value)}
          placeholder={tr("profile.hotel.websitePlaceholder")}
          className={`${inputClass} text-start`}
        />
        <p className="px-1 text-[11px] font-medium text-gray-400 dark:text-slate-500">
          {tr("profile.hotel.websiteHint")}
        </p>
        {fieldError("website")}
      </div>

      {/* Country / governorate */}
      <div className="flex flex-col gap-2">
        <label htmlFor="hotel-country" className="px-1 text-sm font-bold text-navy dark:text-slate-200">
          {tr("profile.hotel.countryLabel")}
        </label>
        <select
          id="hotel-country"
          name="country_id"
          value={String(form.country_id ?? "")}
          onChange={(e) => setField("country_id", e.target.value)}
          style={selectChevronStyle}
          className={`${inputClass} appearance-none rtl:pr-10 ltr:pl-10`}
        >
          <option value="">{tr("auth.registerCompany.countryPlaceholder")}</option>
          {countries.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {fieldError("country_id")}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="hotel-state" className="px-1 text-sm font-bold text-navy dark:text-slate-200">
          {tr("profile.hotel.stateLabel")}
        </label>
        <select
          id="hotel-state"
          name="state_id"
          value={String(form.state_id ?? "")}
          disabled={!form.country_id || loadingStates}
          onChange={(e) => setField("state_id", e.target.value)}
          style={selectChevronStyle}
          className={`${inputClass} appearance-none rtl:pr-10 ltr:pl-10 disabled:opacity-60`}
        >
          <option value="">
            {form.country_id
              ? tr("auth.registerCompany.statePlaceholder")
              : tr("auth.registerCompany.selectCountryFirst")}
          </option>
          {states.map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {fieldError("state_id")}
      </div>

      {/* Contact */}
      <div className="flex flex-col gap-2">
        <label htmlFor="hotel-email" className="px-1 text-sm font-bold text-navy dark:text-slate-200">
          {tr("profile.hotel.emailLabel")}
        </label>
        <input
          id="hotel-email"
          name="email"
          type="email"
          dir="ltr"
          value={form.email}
          onChange={(e) => setField("email", e.target.value)}
          className={`${inputClass} text-start`}
        />
        {fieldError("email")}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="hotel-whatsapp" className="px-1 text-sm font-bold text-navy dark:text-slate-200">
          {tr("profile.hotel.whatsappLabel")}
        </label>
        <input
          id="hotel-whatsapp"
          name="whatsapp_phone"
          inputMode="numeric"
          dir="ltr"
          value={form.whatsapp_phone}
          onChange={(e) => setField("whatsapp_phone", e.target.value)}
          className={`${inputClass} text-start`}
        />
        {fieldError("whatsapp_phone")}
      </div>

      <button
        type="submit"
        disabled={isUpdating || isOptimizing}
        className="h-14 rounded-2xl bg-blue font-bold text-white shadow-sm transition-all active:scale-95 disabled:opacity-60"
      >
        {isUpdating || isOptimizing
          ? tr("common.saving")
          : tr("profile.hotel.save")}
      </button>
    </form>
  );
}
