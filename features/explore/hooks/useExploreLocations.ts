import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api-client';

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
  return useQuery({
    queryKey: ['states', countryId],
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
  return useQuery({
    queryKey: ['cities', stateId],
    queryFn: () => stateId ? fetchCities(stateId) : Promise.resolve([]),
    enabled: !!stateId,
    staleTime: 24 * 60 * 60 * 1000,
  });
}
