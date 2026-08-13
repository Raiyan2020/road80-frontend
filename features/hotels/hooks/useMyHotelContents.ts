import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hotelContentsService,
  type HotelContentInput,
} from '../services/hotel-contents.service';

const MY_CONTENTS = ['hotel-contents', 'mine'] as const;

/** The signed-in hotel's own content, including admin-hidden items. */
export function useMyHotelContents(page = 1) {
  return useQuery({
    queryKey: [...MY_CONTENTS, page],
    queryFn: () => hotelContentsService.mine(page),
  });
}

export function useInfiniteMyHotelContents() {
  return useInfiniteQuery({
    queryKey: [...MY_CONTENTS, 'infinite'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => hotelContentsService.mine(pageParam),
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.pagination;
      return pagination && pagination.current_page < pagination.last_page
        ? pagination.current_page + 1
        : undefined;
    },
  });
}

/**
 * Invalidates both the owner's list and the public hotel view, since a publish
 * is immediately visible — «يتم نشره وعرضه مباشرة ... دون الحاجة إلى انتظار موافقة».
 */
function useContentMutation<TArgs>(
  mutationFn: (args: TArgs) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    meta: { hideToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_CONTENTS });
      queryClient.invalidateQueries({ queryKey: ['hotel'] });
    },
  });
}

export function useCreateHotelContent() {
  const m = useContentMutation((input: HotelContentInput) =>
    hotelContentsService.create(input),
  );
  return { createContent: m.mutateAsync, isCreating: m.isPending };
}

export function useUpdateHotelContent() {
  const m = useContentMutation(
    ({ id, input }: { id: number | string; input: HotelContentInput }) =>
      hotelContentsService.update(id, input),
  );
  return { updateContent: m.mutateAsync, isUpdating: m.isPending };
}

export function useDeleteHotelContent() {
  const m = useContentMutation((id: number | string) =>
    hotelContentsService.remove(id),
  );
  return { deleteContent: m.mutateAsync, isDeleting: m.isPending };
}
