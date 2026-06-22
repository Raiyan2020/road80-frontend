import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService, ProfileResponse } from '../services/profile.service';
import { useUserStore } from '@/stores/user.store';

export function useProfile() {
  const queryClient = useQueryClient();
  const { user, login } = useUserStore();

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: profileService.getProfile,
    select: (res) => res.data,
  });

  const updateProfileMutation = useMutation({
    mutationFn: profileService.updateProfile,
    meta: { hideToast: true },
    onSuccess: (response: ProfileResponse) => {
       queryClient.invalidateQueries({ queryKey: ['profile'] });
       
       // Update user store with new profile data if needed
       if (user && response.data) {
         login({
           ...user,
           name: response.data.name,
           avatar: response.data.image,
         });
       }
    },
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    refetch: profileQuery.refetch,
    
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
  };
}

export function useUserAds() {
    return useQuery({
        queryKey: ['profile', 'my-ads'],
        queryFn: profileService.getMyAds,
        staleTime: 5 * 60 * 1000,
    });
}

export function useUserFavorites() {
    return useQuery({
        queryKey: ['profile', 'my-favorites'],
        queryFn: profileService.getMyFavorites,
        staleTime: 5 * 60 * 1000,
    });
}

export function useDeleteAd() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (adId: number) => profileService.deleteMyAd(adId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'my-ads'] });
    },
  });
}

export function useToggleAdStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (adId: number) => profileService.toggleAdStatus(adId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'my-ads'] });
    },
  });
}
