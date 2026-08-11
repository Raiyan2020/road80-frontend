import { apiClient, api } from '@/lib/api-client';
import { Listing } from '@/lib/types';
import { mapRawExploreToListing } from '@/features/explore/services/explore.service';
import type { UserSocials } from '@/shared/services/social-platforms.service';
import type { UserType } from '@/shared/types/auth';

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
  socials?: UserSocials;

  // ── Shared company/hotel fields ───────────────────────────────────────────
  email?: string | null;
  whatsapp_phone?: string | null;
  country_id?: number | null;
  country_name?: string | null;
  state_id?: number | null;
  state_name?: string | null;

  // ── Hotel-only (use case 1.2) ─────────────────────────────────────────────
  /** Drives which experience the app shows. See flutter-hotel-feature-api.md §4.3. */
  type?: UserType;
  /** Profile background image. Hotel accounts only. */
  cover_image?: string | null;
  /** Hotel accounts only. */
  website?: string | null;
  /** Self-declared hotel classification, 1-5. Hotel accounts only. */
  star_rating?: number | null;
  /** Average of user ratings — read-only, computed by the backend. */
  rate?: number;
  /** Number of user ratings — read-only. */
  ratings_count?: number;
  /** Public share link. `null` for non-hotel accounts. */
  share_url?: string | null;
}

/**
 * Fields a hotel may edit on its own profile.
 *
 * `cover_image`, `website` and `star_rating` are rejected by the backend for
 * `user` and `company` accounts — see flutter-hotel-feature-api.md §6.2.
 * `rate` and `ratings_count` are computed and are never sent.
 */
export interface HotelProfileInput {
  name?: string;
  caption?: string;
  email?: string;
  whatsapp_phone?: string;
  country_id?: number | string;
  state_id?: number | string;
  website?: string;
  star_rating?: number | string;
  /** New logo. Omit to keep the current one. */
  image?: File | null;
  /** New cover image. Omit to keep the current one. */
  cover_image?: File | null;
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

  /**
   * Update the hotel-owned fields of the profile (use case 1.2).
   *
   * Only keys the caller actually supplies are sent, so leaving the cover image
   * or website untouched preserves whatever is stored — «يمكن حفظ باقي بيانات
   * البروفايل دون الحاجة إلى استكمالها».
   *
   * Content-Type is deliberately not set: `lib/api-client.ts` strips it for
   * FormData so the browser can add the multipart boundary.
   */
  updateHotelProfile: (input: HotelProfileInput) => {
    const formData = new FormData();

    Object.entries(input).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      formData.append(key, value instanceof File ? value : String(value));
    });

    return apiClient<ProfileResponse>('/profile', {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
      },
    });
  },

  /**
   * Partial update of the user's social links only.
   * Keys are platform slugs; an empty string removes that link. Slugs left out
   * of the payload are kept untouched by the backend.
   */
  updateSocials: (socials: Record<string, string>) => {
    const formData = new FormData();
    Object.entries(socials).forEach(([slug, link]) => {
      formData.append(`socials[${slug}]`, link);
    });
    return apiClient<ProfileResponse>('/profile', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      }
    });
  },

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
