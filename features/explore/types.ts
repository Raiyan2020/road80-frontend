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
    category_name: string;
    category_value_name: string;
    range: unknown;
  }>;
  categories: Array<{
    id: number;
    name: string;
    value: string;
  }>;
  image: {
    file: string;
    type: string;
  };
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
