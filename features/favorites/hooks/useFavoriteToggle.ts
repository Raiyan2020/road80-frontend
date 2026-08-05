import { useMutation, useQueryClient } from '@tanstack/react-query';
import { favoritesService, ToggleLikeResponse } from '../services/favorites.service';
import { useFavoritesStore } from '@/stores/favorites.store';
import { toast } from 'sonner';
import { t } from '@/i18n';

export function useFavoriteToggle() {
  const toggleStore = useFavoritesStore((state) => state.toggle);
  const queryClient = useQueryClient();

  // The 4th generic is the onMutate context — without it, `context` in
  // onSuccess widens to `{}` and `wasFavorite` fails to typecheck.
  return useMutation<ToggleLikeResponse, Error, number, { wasFavorite: boolean }>({
    mutationFn: (id: number) => favoritesService.toggleLike(id),
    onMutate: (id) => {
      const wasFavorite = useFavoritesStore.getState().isFavorite(id);
      toggleStore(id);
      return { wasFavorite };
    },
    onSuccess: (response, id, context) => {
      if (response?.status === true) {
        toast.success(
          context?.wasFavorite
            ? t('listing.favorites.removed')
            : t('listing.favorites.added'),
          { closeButton: true }
        );
        queryClient.invalidateQueries({ queryKey: ['profile', 'my-favorites'] });
        return;
      }

      toggleStore(id);
      toast.error(response?.message || t('common.actionFailed'));
    },
    onError: (_error, id) => {
      toggleStore(id);
      toast.error(t('listing.favorites.error'));
    },
  });
}
