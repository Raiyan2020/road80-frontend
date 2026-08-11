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
  device_id?: string;
  device_type?: string;
  name?: string;
}

export interface RegisterCompanyPayload {
  name: string;
  /** Required by the backend's RegisterCompanyRequest. */
  email: string;
  caption: string;
  state_id: number | string;
  country_id: number | string;
  phone: string;
  whatsapp_phone: string;
  phone_country_id?: number | string;
  whatsapp_country_id?: number | string;
  image: File | null;
  /**
   * Required when `account_type` is `company`; the backend treats it as optional
   * for hotels. Omit it entirely (rather than sending an empty string) for a
   * hotel — `authService.registerCompany` skips undefined values.
   */
  company_department_id?: number | string;
  /**
   * `company` (the backend default when the field is absent) or `hotel`.
   * See flutter-hotel-feature-api.md §5.1.
   */
  account_type?: AccountType;
}

/** Account type chosen at registration. */
export type AccountType = 'company' | 'hotel';

/** `user.type` after login — drives which experience the app shows. */
export type UserType = 'user' | 'company' | 'hotel';

/** Approval state for company/hotel accounts. */
export type UserStatus = 'pending' | 'accept' | 'reject';

export type LoginData = Record<string, never>; // Empty object

export interface VerifyOtpData {
  user: User;
  token: string;
}
