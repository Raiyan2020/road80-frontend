import { useQuery } from '@tanstack/react-query';
import { useLangStore } from '../../../i18n';
import { staticPageService } from '../services/page.service';

export function useTerms() {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    queryKey: ['pages', 'terms', lang],
    queryFn: () => staticPageService.getTerms().then(res => res.data),
  });
}

export function usePrivacy() {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    queryKey: ['pages', 'privacy', lang],
    queryFn: () => staticPageService.getPrivacy().then(res => res.data),
  });
}

export function useAboutUs() {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    queryKey: ['pages', 'about-us', lang],
    queryFn: () => staticPageService.getAboutUs().then(res => res.data),
  });
}

export function useFaqs() {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    queryKey: ['pages', 'faqs', lang],
    queryFn: () => staticPageService.getFaqs().then(res => res.data),
  });
}
