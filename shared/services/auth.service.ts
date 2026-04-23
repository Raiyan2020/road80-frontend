import api from '@/lib/api-client';
import type { AuthResponse, LoginPayload, VerifyOtpPayload, VerifyOtpData, RegisterCompanyPayload } from '../types/auth';

export const authService = {
  /**
   * Send OTP to the user's phone number
   */
  login: async (payload: LoginPayload): Promise<AuthResponse<[]>> => {
    return api.post<AuthResponse<[]>>('/auth/login', {
      country_id: payload.country_id,
      phone: payload.phone,
    });
  },

  /**
   * Resend the OTP to the user's phone number
   */
  resendOtp: async (payload: { phone: string; country_id: string | number }): Promise<AuthResponse<[]>> => {
    return api.post<AuthResponse<[]>>('/auth/resend-otp', {
      country_id: payload.country_id,
      phone: payload.phone,
    });
  },

  /**
   * Verify the OTP and login the user
   */
  verifyOtp: async (payload: VerifyOtpPayload): Promise<AuthResponse<VerifyOtpData>> => {
    const formData = new FormData();
    formData.append('country_id', String(payload.country_id));
    formData.append('phone', payload.phone);
    formData.append('otp', payload.code);
    formData.append('device_id', payload.device_id);
    if (payload.device_type) {
      formData.append('device_type', payload.device_type);
    }
    if (payload.name) {
      formData.append('name', payload.name);
    }

    return api.post<AuthResponse<VerifyOtpData>>('/auth/verify-otp', formData);
  },
  /**
   * Logout the user
   */
  logout: async (device_id: string): Promise<AuthResponse<[]>> => {
    return api.post<AuthResponse<[]>>('/auth/logout', { device_id });
  },

  /**
   * Register a new company
   */
  registerCompany: async (payload: RegisterCompanyPayload): Promise<AuthResponse<[]>> => {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value instanceof File ? value : String(value));
      }
    });

    return api.post<AuthResponse<[]>>('/auth/register-company', formData);
  },
};

