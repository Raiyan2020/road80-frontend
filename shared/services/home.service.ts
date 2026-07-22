import api from '@/lib/api-client';
export interface Blog {
  id: number;
  title: string;
  image: string;
  content: string;
  short_description: string;
}
import { Listing } from '@/lib/types';

export interface FilterHistoryPayload {
  name?: string;
  category_values_ids: number[];
  state_id: number;
  city_id: number;
}

export interface FilterHistoryResponse {
  status: boolean;
  message: string;
  data: unknown[];
  errors: unknown[];
}

export interface CategoryValue {
  id: number;
  value: string;
}

export interface CategoryFilter {
  id: number;
  name: string;
  type: string;
  values: CategoryValue[];
}

export interface CategoryFilterResponse {
  status: boolean;
  message: string;
  data: CategoryFilter[];
  errors: unknown[];
}

export interface HomeHeader {
  id: number;
  title: string;
  caption: string;
  image: string;
}

export interface HomeCategory {
  id: number;
  value: string;
  icon: string;
}

export interface HomeFooter {
  id: number;
  title: string;
  button_action: string;
  description: string;
  image: string;
  url: string | null;
}

/** Lean ad shape returned inline on /home — not the full explore/detail payload. */
export interface HomeAd {
  id: number;
  title: string;
  price: string | number;
  is_liked: boolean | number;
  country_name: string | null;
  state_name: string | null;
  city_name: string | null;
  image: { file: string; type: string } | null;
}

/** The ids behind `filter_histories`, for re-running the user's last search. */
export interface FilterHistoryDetails {
  category_value_id: number[] | null;
  country_id: number | null;
  state_id: number | null;
  city_id: number | null;
}

export interface HomeDataResponse {
  status: boolean;
  message: string;
  data: {
    header: HomeHeader[];
    categories: HomeCategory[];
    footer: HomeFooter[];
    /**
     * Up to 8 ads matching the user's most recent filter. Serves the same purpose
     * as /home/ads-by-history but arrives with the page, so prefer it — that
     * endpoint 500s for users who have no filter history yet.
     */
    ads?: HomeAd[];
    /** Pre-joined summary string like "Apartment/Rent/Kuwait", or null. */
    filter_histories?: string | null;
    filter_histories_details?: FilterHistoryDetails | null;
  };
  errors: unknown[];
}

export const homeService = {
  saveFilterHistory: async (payload: FilterHistoryPayload): Promise<FilterHistoryResponse> => {
    return api.post<FilterHistoryResponse>('/home/filter-history', payload);
  },

  getCategoriesAppearInFilter: async (): Promise<CategoryFilter[]> => {
    const response = await api.get<CategoryFilterResponse>('/home/categories-appear-in-filter');
    return response.data;
  },

  getHomeData: async (): Promise<HomeDataResponse['data']> => {
    const response = await api.get<HomeDataResponse>('/home');
    return response.data;
  },

  /**
   * Ads matching the user's saved filter.
   *
   * Swallows failures on purpose: the endpoint 500s for any user who has not
   * saved a filter yet (the service returns null and the controller hands that
   * to AdResource::collection()), which is exactly the first-run case. An empty
   * list is the right answer there, and this is a personalisation strip — not
   * worth failing the whole home screen over.
   *
   * `/home` now also returns an `ads` array covering the same ground; prefer it
   * once the home screen is wired to read from there.
   */
  getAdsByHistory: async (): Promise<Listing[]> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await api.get<{ status: boolean; data: any[] }>('/home/ads-by-history');
      return response.status && response.data ? response.data : [];
    } catch {
      return [];
    }
  },
};
