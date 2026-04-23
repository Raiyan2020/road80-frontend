import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '../services/home.service';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 60 * 60 * 1000, // 1 hour — categories rarely change
  });
}
