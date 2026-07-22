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

export const registerCompanySchema = z.object({
  name: z.string().min(3, { error: () => t('validation.nameMin3') }).max(255),
  caption: z.string().min(10, { error: () => t('validation.descriptionMin10') }).max(255),
  country_id: z.union([z.string(), z.number()]).refine(val => !!val, { error: () => t('validation.selectCountry') }),
  state_id: z.union([z.string(), z.number()]).refine(val => !!val, { error: () => t('validation.selectGovernorate') }),
  phone: z.string().regex(/^\d{9,15}$/, { error: () => t('validation.phoneRange') }),
  whatsapp_phone: z.string().regex(/^\d{9,15}$/, { error: () => t('validation.whatsappRange') }),
  company_department_id: z.union([z.string(), z.number()]).refine(val => !!val, { error: () => t('validation.selectDepartment') }),
  image: z.any().refine((file) => file instanceof File, { error: () => t('validation.uploadCompanyImage') }),
});

export type PhoneValues = z.infer<typeof phoneSchema>;
export type OtpValues = z.infer<typeof otpSchema>;
export type RegisterCompanyValues = z.infer<typeof registerCompanySchema>;
