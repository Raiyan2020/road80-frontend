import api from '@/lib/api-client';
import { Country, State, City } from '../types/location';
import { localizeCities, localizeCountries, localizeStates } from '../utils/location-localization';

export interface LocationResponse<T> {
  status: boolean;
  message: string;
  data: T;
  errors: unknown[];
}

export const locationService = {
  getCountries: async (): Promise<Country[]> => {
    const response = await api.get<LocationResponse<Country[]>>('/countries');
    return localizeCountries(response.data);
  },

  getStates: async (countryId: string | number): Promise<State[]> => {
    const cleanId = typeof countryId === 'string' ? countryId.trim() : countryId;
    const response = await api.get<LocationResponse<State[]>>(`/countries/${cleanId}/states`);
    return localizeStates(response.data);
  },

  getCities: async (stateId: string | number): Promise<City[]> => {
    const cleanId = typeof stateId === 'string' ? stateId.trim() : stateId;
    const response = await api.get<LocationResponse<City[]>>(`/states/${cleanId}/cities`);
    return localizeCities(response.data);
  },
};
