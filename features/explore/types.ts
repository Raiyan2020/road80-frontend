export interface ExploreFilters {
  name?: string;
  country_id?: number | string;
  state_id?: number | string;
  city_id?: number | string;
  category_value_id?: (number | string)[];
  min_price?: number;
  max_price?: number;
  page?: number;
}

export interface ExploreRawAd {
  id: number;
  title: string;
  price: string;
  is_liked: boolean;
  likes_count?: number;
  watch_count?: number;
  views?: number;
  country_name: string;
  state_id: number;
  state_name: string;
  city_name: string;
  answers: Array<{
    /** Stable, language-independent key (e.g. 'property-type'). Optional
     *  because older backends predate it — always fall back to the name. */
    category_slug?: string | null;
    /**
     * Nullable since the backend switched to `$answer->category?->name`: a
     * soft-deleted or missing category used to 500, and now serializes as null.
     */
    category_name: string | null;
    category_value_name: string | null;
    range: unknown;
  }>;
  categories: Array<{
    id?: number;
    slug?: string | null;
    category_slug?: string | null;
    name?: string | null;
    value?: string | null;
    category_name?: string | null;
    category_value_name?: string | null;
    range?: unknown;
  }>;
  image: {
    file: string;
    type: string;
  };
  status?: number;
}

export interface ExploreResponse {
  status: boolean;
  message: string;
  data: ExploreRawAd[];
  // snake_case to match ApiResponse::paginationResponse — it emits
  // current_page/last_page/per_page/total, never the camelCase spelling.
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  // number_format()'d server-side, so these arrive as strings ("1,250.00").
  // Coerce before comparing or doing arithmetic.
  min_price: string;
  max_price: string;
  errors: unknown[];
}
