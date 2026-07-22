import * as z from 'zod';
import { t } from '../../../i18n';

export const phoneSchema = z.object({
  phone: z.string().min(5, { error: () => t('validation.phoneInvalid') }),
  country_id: z.union([z.string(), z.number()]),
});

export const otpSchema = z.object({
  otp: z.string()
    .min(4, { error: () => t('validation.otpLength') })
    .max(4)
    .regex(/^\d+$/, { error: () => t('validation.digitsOnly') }),
});

// The company-registration schema lives in routes/auth.register-company.tsx —
// it needs the country's phone-digit count to build its rules, so it is a
// factory rather than a constant. A stale duplicate here (missing the now-required
// `email`, among other drift) was shadowed by that local one and never ran.

export type PhoneValues = z.infer<typeof phoneSchema>;
export type OtpValues = z.infer<typeof otpSchema>;
