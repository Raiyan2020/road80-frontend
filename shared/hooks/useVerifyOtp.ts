import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { useUserStore } from '@/stores/user.store';
import { authStorage } from '../utils/auth-storage';
import { useNavigate, useLocation } from '@tanstack/react-router';
import type { VerifyOtpPayload, AuthResponse, VerifyOtpData } from '../types/auth';

export const useVerifyOtp = () => {
  const login = useUserStore(s => s.login);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(window.location.search);

  return useMutation({
    mutationFn: (payload: VerifyOtpPayload) => authService.verifyOtp(payload),
    meta: {
      hideToast: true,
    },
    onSuccess: async (response: AuthResponse<VerifyOtpData>) => {
      const { user, token } = response.data;
      
      // Persist token in cookie (999 days) + localStorage + Capacitor
      // MUST await this before redirecting — otherwise the middleware
      // cookie check fires before the cookie is actually written in production.
      await authStorage.setToken(token);

      // Update global user state
      login({
        id: user.id,
        phone: user.country_code,
        name: user.name || 'مستخدم',
        avatar: user.image,
        token: token,
      });

      // Redirect to the intended page, or the mandatory quick-start if it's their first time,
      // or just default to quick-start setup as requested.
      const callbackUrl = searchParams.get('callbackUrl');
      
      if (callbackUrl && callbackUrl !== '/') {
        navigate({ to: callbackUrl, replace: true });
      } else {
        // Default destination after login is now the quick-start setup flow
        navigate({ to: '/quick-start', search: { mode: 'edit' }, replace: true });
      }
    },
    onError: (error: Error | unknown) => {
      // Handle error
    },
  });
};
