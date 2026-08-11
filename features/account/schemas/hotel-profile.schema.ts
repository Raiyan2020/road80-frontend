import { z } from 'zod';
import { t } from '@/i18n';

/**
 * Validation for the hotel profile editor (use case 1.2).
 *
 * Mirrors the backend rules in flutter-hotel-feature-api.md §6.2. Every field is
 * optional on the wire — the endpoint is a partial update — but anything the
 * hotel *does* fill in must be well-formed before we spend a request on it:
 * «في حال إدخال رابط أو بيانات بصيغة غير صحيحة، يطلب النظام تصحيح البيانات قبل الحفظ».
 *
 * `cover_image` and `website` are deliberately optional so the rest of the
 * profile can be saved without them.
 */

/** Accepts a bare domain too — hotels rarely type the scheme. */
const WEBSITE_PATTERN =
  /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/[^\s]*)?$/i;

export const hotelProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, { error: () => t('validation.nameMin3') }),

  caption: z
    .string()
    .trim()
    .max(255, { error: () => t('validation.maxLength', { max: 255 }) })
    .optional()
    .or(z.literal('')),

  email: z
    .string()
    .trim()
    .email({ error: () => t('auth.validation.emailInvalid') })
    .optional()
    .or(z.literal('')),

  country_id: z
    .union([z.string(), z.number()])
    .refine((v) => !!v, { error: () => t('validation.selectCountry') }),

  state_id: z
    .union([z.string(), z.number()])
    .refine((v) => !!v, { error: () => t('validation.selectGovernorate') }),

  whatsapp_phone: z
    .string()
    .trim()
    .regex(/^\d*$/, { error: () => t('auth.validation.whatsappDigitsOnly') })
    .optional()
    .or(z.literal('')),

  // Hotel-only. Optional — the profile saves fine without it.
  website: z
    .string()
    .trim()
    .refine((v) => !v || WEBSITE_PATTERN.test(v), {
      error: () => t('profile.hotel.validation.websiteInvalid'),
    })
    .optional()
    .or(z.literal('')),

  // Hotel-only. 1–5, or empty for "not declared".
  star_rating: z
    .union([z.string(), z.number()])
    .refine(
      (v) => {
        if (v === '' || v === undefined || v === null) return true;
        const n = Number(v);
        return Number.isInteger(n) && n >= 1 && n <= 5;
      },
      { error: () => t('profile.hotel.validation.starRatingRange') },
    )
    .optional(),
});

export type HotelProfileFormValues = z.infer<typeof hotelProfileSchema>;

/**
 * Normalises a website into something the backend will accept as a URL.
 * `hotel.com` → `https://hotel.com`; an already-qualified URL is left alone.
 */
export function normalizeWebsite(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
