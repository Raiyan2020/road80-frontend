import { useQuery } from '@tanstack/react-query';
import { useLangStore } from '@/i18n';
import { locationService } from '../services/location.service';

export function useCountries() {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    queryKey: ['countries', lang],
    queryFn: () => locationService.getCountries(),
  });
}

export function useStates(countryId?: string | number) {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    queryKey: ['states', countryId, lang],
    queryFn: () => locationService.getStates(countryId!),
    enabled: !!countryId,
  });
}

export function useCities(stateId?: string | number) {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    queryKey: ['cities', stateId, lang],
    queryFn: () => locationService.getCities(stateId!),
    enabled: !!stateId,
  });
}
