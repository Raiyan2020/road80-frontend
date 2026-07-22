import { useQuery } from '@tanstack/react-query';
import { useLangStore } from '@/i18n';
import { getCountries } from '../services/countries.service';

export const useCountries = () => {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    // Country names come back translated, so each language needs its own entry.
    // Without this the 24h staleTime pins the picker to one language for a day.
    queryKey: ['countries', lang],
    queryFn: getCountries,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - countries don't change often
  });
};
