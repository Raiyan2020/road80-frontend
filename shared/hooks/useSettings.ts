import { useQuery } from '@tanstack/react-query';
import { useLangStore, t } from '@/i18n';
import { settingsService } from '../services/settings.service';

export function useSettings() {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    queryKey: ['settings', lang],
    queryFn: async () => {
      const response = await settingsService.getSettings();
      if (!response.status) {
        // The message ends up in a toast title via lib/query-client, which
        // prefers `err.message` over its own localized fallback — so it has to
        // be localized here, at throw time, in the language in use right now.
        throw new Error(response.message || t('common.genericError'));
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
