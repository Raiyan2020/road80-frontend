import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { useUserStore } from '@/stores/user.store';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { getFcmToken } from '../utils/notifications';

export const useLogout = () => {
  const queryClient = useQueryClient();
  const clearStore = useUserStore((s) => s.logout);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      const device_id = getFcmToken();
      return authService.logout(device_id || '');
    },
    // We don't clear the store in onMutate anymore to ensure the 
    // Authorization header is sent with the logout request.
    onSuccess: () => {
      toast.success('تم تسجيل الخروج بنجاح');
    },
    onSettled: () => {
      // Always clear store and redirect, even if API fails
      clearStore();
      queryClient.clear();
      navigate({ to: '/auth', replace: true });
    },
    meta: {
      hideToast: true, // Custom flag to tell global QueryClient to be quiet
    },
  });
};
