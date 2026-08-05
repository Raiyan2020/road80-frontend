import * as z from 'zod';
import { t } from '../../../i18n';

export const quickStartSchema = z.object({
  name: z
    .string()
    .min(2, { error: () => t('validation.nameMin2') })
    .max(50, { error: () => t('validation.nameTooLong') }),
  purpose: z.string().min(1, { error: () => t('validation.selectPurpose') }),
  propertyType: z.string().min(1, { error: () => t('validation.selectPropertyType') }),
  governorate: z.string().min(1, { error: () => t('validation.selectGovernorate') }),
  area: z.string().min(1, { error: () => t('validation.selectArea') }),
});

export type QuickStartValues = z.infer<typeof quickStartSchema>;
