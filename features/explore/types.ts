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
    category_name: string;
    category_value_name: string;
    range: unknown;
  }>;
  categories: Array<{
    id?: number;
    slug?: string | null;
    category_slug?: string | null;
    name?: string;
    value?: string;
    category_name?: string;
    category_value_name?: string;
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
  pagination: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
  min_price: number;
  max_price: number;
  errors: unknown[];
}
