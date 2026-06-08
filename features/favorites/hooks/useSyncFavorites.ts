import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/features/account/services/profile.service';
import { useFavoritesStore } from '@/stores/favorites.store';
import { useUserStore } from '@/stores/user.store';

/**
 * Keeps the persisted local favorites store in sync with server-side favorites.
 */
export function useSyncFavorites() {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const mergeIds = useFavoritesStore((state) => state.mergeIds);

  const { data: favorites } = useQuery({
    queryKey: ['profile', 'my-favorites'],
    queryFn: profileService.getMyFavorites,
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!favorites?.length) return;
    mergeIds(favorites.map((listing) => listing.id));
  }, [favorites, mergeIds]);
}
