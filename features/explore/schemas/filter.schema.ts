import * as z from 'zod';

export const exploreFilterSchema = z.object({
  name: z.string().optional().default(''),
  category_value_id: z.array(z.union([z.string(), z.number()])).default([]),
  country_id: z.union([z.string(), z.number()]).optional().default(''),
  state_id: z.union([z.string(), z.number()]).optional().default(''),
  city_id: z.union([z.string(), z.number()]).optional().default(''),
  priceRange: z.array(z.number()).length(2).default([0, 50000]),
});

export type ExploreFilterValues = z.infer<typeof exploreFilterSchema>;
