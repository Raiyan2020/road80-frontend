import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService, ProfileResponse, type UpdateAdInput } from '../services/profile.service';
import { normalizeSocials } from '@/shared/services/social-platforms.service';
import { useUserStore } from '@/stores/user.store';
import { useLangStore } from '@/i18n';

// Kept at module scope so React Query can memoize the result — an inline select
// would hand out a fresh object on every render and retrigger consumers' effects.
const selectProfile = (res: ProfileResponse) => ({
  ...res.data,
  socials: normalizeSocials(res.data?.socials),
});

export function useProfile(options: { enabled?: boolean } = {}) {
  const queryClient = useQueryClient();
  const user = useUserStore((state) => state.user);
  const login = useUserStore((state) => state.login);

  const profileQuery = useQuery({
    // Deliberately NOT keyed by language: this is the user's own name, avatar,
    // phone and social links — the server returns them verbatim, not translated.
    queryKey: ['profile'],
    queryFn: profileService.getProfile,
    select: selectProfile,
    enabled: options.enabled ?? true,
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

export function useUpdateSocials() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (socials: Record<string, string>) => profileService.updateSocials(socials),
    meta: { hideToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    updateSocials: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}

export function useUserAds() {
    const lang = useLangStore((s) => s.lang);
    return useQuery({
        // The user's ads carry server-translated category/location labels.
        // `lang` last so the `['profile', 'my-ads']` prefix invalidations in
        // useDeleteAd / useToggleAdStatus still match.
        queryKey: ['profile', 'my-ads', lang],
        queryFn: profileService.getMyAds,
        staleTime: 5 * 60 * 1000,
    });
}

export function useUserFavorites() {
    // Deliberately NOT keyed by language: this exact key is shared with
    // useSyncFavorites, which only needs the id set. Splitting it per language
    // would double-fetch the endpoint on the favorites screen. The
    // language-change invalidation in routes/__root.tsx refreshes it instead.
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

export function useUpdateAd() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateAdInput) => profileService.updateMyAd(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'my-ads'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
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
