import { apiClient, api } from '@/lib/api-client';
import { Listing } from '@/lib/types';
import { mapRawExploreToListing } from '@/features/explore/services/explore.service';

export interface ProfileData {
  id: number;
  name: string;
  country_code: string;
  caption: string | null;
  image: string;
  total_ads_likes?: number;
  total_ads_watch?: number;
  total_active_ads?: number;
  first_login?: number | null;
}

export interface ProfileResponse {
  status: boolean;
  message: string;
  data: ProfileData;
  errors: Record<string, string[]> | unknown[];
}

export interface ProfileListingsResponse {
  status: boolean;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
}

export const profileService = {
  getProfile: () => api.get<ProfileResponse>('/profile'),
  
  updateProfile: (formData: FormData) => 
    apiClient<ProfileResponse>('/profile', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      }
    }),

  getMyAds: async (): Promise<Listing[]> => {
    const response = await api.get<ProfileListingsResponse>('/profile/my-ads');
    return (response.data || []).map(mapRawExploreToListing);
  },

  getMyFavorites: async (): Promise<Listing[]> => {
    const response = await api.get<ProfileListingsResponse>('/profile/my-favorites');
    return (response.data || []).map(mapRawExploreToListing);
  },

  /**
   * Delete one of the authenticated user's ads by ID.
   */
  deleteMyAd: async (adId: number): Promise<{ status: boolean; message: string }> => {
    return api.delete<{ status: boolean; message: string }>(`/profile/delete-ad/${adId}`);
  },

  /**
   * Toggle activation status (active / inactive) for one of the user's ads.
   */
  toggleAdStatus: async (adId: number): Promise<{ status: boolean; message: string }> => {
    const formData = new FormData();
    formData.append('ad_id', String(adId));
    return api.post<{ status: boolean; message: string }>('/profile/toggle-ad-status', formData);
  },
};
