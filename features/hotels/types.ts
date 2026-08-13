import type { UserSocials } from '@/shared/services/social-platforms.service';

/** Paginated envelope sibling key — see the `laravel-api-contract` skill. */
export interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ApiEnvelope<T> {
  /** `true` | `false` | a string sentinel such as "block" / "needLogin". */
  status: boolean | string;
  message: string;
  data: T;
  errors: Record<string, string[]> | unknown[];
}

export interface PaginatedEnvelope<T> extends ApiEnvelope<T> {
  pagination?: Pagination;
}

/** flutter-hotel-feature-api.md §4.1 */
export interface Hotel {
  id: number;
  name: string;
  caption: string | null;
  image: string | null;
  cover_image: string | null;
  website: string | null;
  phone: string | null;
  whatsapp_phone: string | null;
  email: string | null;
  country_id: number | null;
  country_name: string | null;
  state_id: number | null;
  state_name: string | null;
  /** Admin-set hotel classification, 1-5. Read-only. */
  star_rating: number | null;
  /** Average of user ratings. */
  rate: number;
  ratings_count: number;
  socials: UserSocials;
  share_url: string;
}

export type ContentStatus = 'active' | 'hidden';
export type AttachmentType = 'image' | 'video' | 'youtube';

/** flutter-hotel-feature-api.md §4.5 */
export interface ContentAttachment {
  id: number;
  type: AttachmentType;
  /** URL for `image` and `video`; null for `youtube`. */
  file: string | null;
  /** Only set when `type` is `youtube`. */
  youtube_url: string | null;
  sort_order: number;
}

/** flutter-hotel-feature-api.md §4.4 */
export interface HotelContent {
  id: number;
  description: string;
  status: ContentStatus;
  /**
   * Only present while `status` is `hidden`. The resource uses `$this->when(...)`,
   * so for active content the key is **absent entirely** rather than null.
   */
  hidden_reason?: string | null;
  attachments: ContentAttachment[];
  share_url: string;
  created_at: string | null;
}

/** flutter-hotel-feature-api.md §4.6 */
export interface HotelRating {
  id: number;
  stars: number;
  comment: string | null;
  user: { id: number; name: string; image: string | null };
  created_at: string | null;
}

export interface HotelListFilters {
  country_id?: number | string;
  state_id?: number | string;
  /** Average user rating floor. */
  min_rating?: number | string;
  /** Hotel star classification floor, 1-5. */
  min_stars?: number | string;
  search?: string;
  page?: number;
  per_page?: number;
}
