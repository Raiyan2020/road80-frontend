export interface User {
  id: number;
  name: string | null;
  country_code: string;
  caption: string | null;
  image: string | null;
  total_ads_likes: number;
  total_ads_watch: number;
  total_active_ads: number;
  first_login: number;
}

export interface AuthResponse<T = unknown> {
  status: boolean;
  message: string;
  data: T;
  errors: string[];
}

export interface LoginPayload {
  phone: string; // Combined if needed, but we'll use separate IDs for the API
  country_id: string | number;
}

export interface VerifyOtpPayload {
  phone: string;
  code: string; // 4-digit code
  country_id: string | number;
  device_id: string;
  device_type: string;
}

export interface RegisterCompanyPayload {
  name: string;
  email?: string;
  caption: string;
  state_id: number | string;
  country_id: number | string;
  phone: string;
  whatsapp_phone: string;
  image: File | null;
  company_department_id: number | string;
}

export type LoginData = Record<string, never>; // Empty object

export interface VerifyOtpData {
  user: User;
  token: string;
}
