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

  // Server: `['sometimes','string','min:4','max:255']`. Without the min, a
  // 1-3 character caption passed here and came back as a 422.
  caption: z
    .string()
    .trim()
    .min(4, { error: () => t('validation.descriptionMin10') })
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

  // Server: `['sometimes','numeric','digits_between:8,20']`.
  whatsapp_phone: z
    .string()
    .trim()
    .regex(/^\d*$/, { error: () => t('auth.validation.whatsappDigitsOnly') })
    .refine((v) => !v || (v.length >= 8 && v.length <= 20), {
      error: () => t('auth.validation.whatsappExactDigits', { digits: '8-20' }),
    })
    .optional()
    .or(z.literal('')),

  // Hotel-only. Optional — the profile saves fine without it.
  // Server: `['sometimes','nullable','url','max:500']`. The `url` rule requires
  // a scheme, which `normalizeWebsite()` adds before sending.
  website: z
    .string()
    .trim()
    .max(500, { error: () => t('validation.maxLength', { max: 500 }) })
    .refine((v) => !v || WEBSITE_PATTERN.test(v), {
      error: () => t('profile.hotel.validation.websiteInvalid'),
    })
    .optional()
    .or(z.literal('')),
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
