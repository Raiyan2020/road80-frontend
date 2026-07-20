import { useQuery } from '@tanstack/react-query';
import { socialPlatformsService } from '../services/social-platforms.service';

export function useSocialPlatforms() {
  return useQuery({
    queryKey: ['social-platforms'],
    queryFn: async () => {
      const response = await socialPlatformsService.getPlatforms();
      if (!response.status) {
        throw new Error(response.message || 'Failed to fetch social platforms');
      }
      return response.data || [];
    },
    staleTime: 1000 * 60 * 60, // 1 hour — admin-managed list, changes rarely
  });
}
