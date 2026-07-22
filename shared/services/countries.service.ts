import api from '@/lib/api-client';
import { Country } from '../types/country';
import { localizeCountries } from '../utils/location-localization';

export const getCountries = async (): Promise<Country[]> => {
  const response = await api.get<{ data: Country[] }>('/countries');
  return localizeCountries(response.data);
};
