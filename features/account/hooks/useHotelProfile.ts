import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService, type HotelProfileInput, type ProfileResponse } from '../services/profile.service';
import { useProfile } from './useProfile';

/**
 * Whether the signed-in account is a hotel (use case 1.1 → 1.2).
 *
 * Read from the `/profile` response rather than the persisted user store: the
 * store is written at login and can lag behind an admin changing the account,
 * whereas the query is server truth. `isLoading` matters — treat "not yet known"
 * as distinct from "not a hotel", or the hotel section flashes hidden on load.
 */
export function useIsHotel() {
  const { profile, isLoading, isError } = useProfile();
  return {
    isHotel: profile?.type === 'hotel',
    accountType: profile?.type,
    isLoading,
    isError,
  };
}

/**
 * Update the hotel-owned profile fields (use case 1.2).
 *
 * `hideToast` is set because the form renders field-level errors inline; the
 * global mutation toast in lib/query-client.ts would otherwise double up.
 */
export function useUpdateHotelProfile() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: HotelProfileInput) => profileService.updateHotelProfile(input),
    meta: { hideToast: true },
    onSuccess: (response: ProfileResponse) => {
      // The public hotel profile reads the same record, so invalidate both.
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      if (response.data?.id) {
        queryClient.invalidateQueries({ queryKey: ['hotel', response.data.id] });
      }
    },
  });

  return {
    updateHotelProfile: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}
