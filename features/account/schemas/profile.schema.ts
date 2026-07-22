import { z } from 'zod';
import { t } from '../../../i18n';

export const updateProfileSchema = z.object({
  name: z.string().min(3, { error: () => t('validation.nameMin3') }).max(255).optional(),
  caption: z.string().min(3, { error: () => t('validation.descriptionMin3') }).max(255).optional(),
  image: z.any().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
