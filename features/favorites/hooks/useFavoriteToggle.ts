import { useMutation, useQueryClient } from '@tanstack/react-query';
import { favoritesService, ToggleLikeResponse } from '../services/favorites.service';
import { useFavoritesStore } from '@/stores/favorites.store';
import { toast } from 'sonner';

export function useFavoriteToggle() {
  const toggleStore = useFavoritesStore((state) => state.toggle);
  const queryClient = useQueryClient();

  return useMutation<ToggleLikeResponse, Error, number>({
    mutationFn: (id: number) => favoritesService.toggleLike(id),
    onMutate: (id) => {
      const wasFavorite = useFavoritesStore.getState().isFavorite(id);
      toggleStore(id);
      return { wasFavorite };
    },
    onSuccess: (response, id, context) => {
      if (response?.status === true) {
        toast.success(
          context?.wasFavorite ? 'تمت الإزالة من المفضلة' : 'تمت الإضافة إلى المفضلة',
          { closeButton: true }
        );
        queryClient.invalidateQueries({ queryKey: ['profile', 'my-favorites'] });
        return;
      }

      toggleStore(id);
      toast.error(response?.message || 'فشل تنفيذ العملية');
    },
    onError: (_error, id) => {
      toggleStore(id);
      toast.error('حدث خطأ أثناء تعديل المفضلة');
    },
  });
}
