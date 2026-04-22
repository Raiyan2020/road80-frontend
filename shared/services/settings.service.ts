import api from '@/lib/api-client';

export interface SiteSettings {
  site_name: string;
  site_logo: string | null;
  site_favicon: string | null;
  site_description: string;
  site_email: string;
  site_phone: string;
  site_address: string;
  social_media: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    tiktok?: string;
    telegram?: string;
  };
  publish_ad_fees: string;
  payment_live: number;
}

export interface SettingsResponse {
  status: boolean;
  message: string;
  data: SiteSettings;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any[];
}

export const settingsService = {
  getSettings: () => api.get<SettingsResponse>('/settings'),
};
