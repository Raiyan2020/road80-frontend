import { useMutation } from '@tanstack/react-query';
import { favoritesService, ToggleLikeResponse } from '../services/favorites.service';
import { useFavoritesStore } from '@/stores/favorites.store';
import { toast } from 'sonner';

export function useFavoriteToggle() {
  const toggleStore = useFavoritesStore((state) => state.toggle);

  return useMutation<ToggleLikeResponse, Error, number>({
    mutationFn: (id: number) => favoritesService.toggleLike(id),
    onMutate: async (id) => {
      // Optimistically update the store immediately when user clicks
      toggleStore(id);
      return { previousId: id }; // optionally pass context
    },
    onError: (error, id) => {
      // Revert optimistic update on failure
      toggleStore(id);
      toast.error('حدث خطأ أثناء تعديل المفضلة');
    },
    onSuccess: () => {
      // toast.success(res.message); // uncomment to show API message
    },
  });
}
