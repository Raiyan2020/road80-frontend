import { useQuery } from '@tanstack/react-query';
import { t } from '@/i18n';
import { socialPlatformsService } from '../services/social-platforms.service';

export function useSocialPlatforms() {
  return useQuery({
    queryKey: ['social-platforms'],
    queryFn: async () => {
      const response = await socialPlatformsService.getPlatforms();
      if (!response.status) {
        // The message ends up in a toast title via lib/query-client, which
        // prefers `err.message` over its own localized fallback — so it has to
        // be localized here, at throw time, in the language in use right now.
        throw new Error(response.message || t('common.genericError'));
      }
      return response.data || [];
    },
    staleTime: 1000 * 60 * 60, // 1 hour — admin-managed list, changes rarely
  });
}
