import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { useLangStore } from '@/i18n';

export interface State {
  id: number;
  name: string;
}

export async function fetchStates(countryId: number = 1): Promise<State[]> {
  try {
    const response = await api.get<{ status: boolean; data: State[] }>(`/countries/${countryId}/states`);
    if (response.status) return response.data;
    return [];
  } catch (error) {
    return [];
  }
}

export function useExploreStates(countryId: number = 1) {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    // Governorate names are server-translated; without `lang` the 24h staleTime
    // would keep this picker in the previous language for a full day.
    queryKey: ['states', countryId, lang],
    queryFn: () => fetchStates(countryId),
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export interface City {
  id: number;
  name: string;
}

export async function fetchCities(stateId: number): Promise<City[]> {
  try {
    const response = await api.get<{ status: boolean; data: City[] }>(`/states/${stateId}/cities`);
    if (response.status) return response.data;
    return [];
  } catch (error) {
    return [];
  }
}

export function useExploreCities(stateId: number | null) {
  const lang = useLangStore((s) => s.lang);
  return useQuery({
    queryKey: ['cities', stateId, lang],
    queryFn: () => stateId ? fetchCities(stateId) : Promise.resolve([]),
    enabled: !!stateId,
    staleTime: 24 * 60 * 60 * 1000,
  });
}
