import { useQuery } from '@tanstack/react-query';
import { useLangStore } from '@/i18n';
import { postAdService } from '../services/post-ad.service';

export function useCategories() {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    queryKey: ['post-ad-categories', lang],
    queryFn: () => postAdService.getCategories(),
  });
}
