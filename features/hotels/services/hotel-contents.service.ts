import { apiClient } from '@/lib/api-client';
import api from '@/lib/api-client';
import type { ApiEnvelope, HotelContent, PaginatedEnvelope } from '../types';

export interface HotelContentInput {
  description: string;
  /** New image files. */
  images?: File[];
  /** Storage paths returned by /merge-chunks. */
  videoPaths?: string[];
  /** Full YouTube URLs. */
  youtubeUrls?: string[];
}

const buildBody = (input: HotelContentInput): FormData => {
  const formData = new FormData();
  formData.append('description', input.description);

  // Laravel array syntax — `images[]`, not `images`.
  input.images?.forEach((file) => formData.append('images[]', file));
  input.videoPaths?.forEach((path) => formData.append('video_paths[]', path));
  input.youtubeUrls?.forEach((url) => formData.append('youtube_urls[]', url));

  return formData;
};

/**
 * Hotel-owned content management (use case 1.3) — `hotel` accounts only.
 * A `user` or `company` account calling these gets `hotel_only_action` (403).
 *
 * Content publishes immediately with `status: 'active'`; there is no approval
 * step. Admins may later hide it, which surfaces as `status: 'hidden'` plus a
 * `hidden_reason` visible only to the owner.
 */
export const hotelContentsService = {
  /** The owner's own list — includes items an admin has hidden. */
  mine: (page = 1) =>
    api.get<PaginatedEnvelope<HotelContent[]>>('/hotel-contents', {
      query: { page: String(page) },
    }),

  create: (input: HotelContentInput) =>
    apiClient<ApiEnvelope<HotelContent>>('/hotel-contents', {
      method: 'POST',
      body: buildBody(input),
      headers: { Accept: 'application/json' },
    }),

  /**
   * ⚠️ Sending any attachments **replaces every existing attachment** on this
   * content — the backend does not merge. Omit them to edit the description
   * alone. See flutter-hotel-feature-api.md §8.3.
   */
  update: (id: number | string, input: HotelContentInput) =>
    apiClient<ApiEnvelope<HotelContent>>(`/hotel-contents/${id}`, {
      method: 'POST',
      body: buildBody(input),
      headers: { Accept: 'application/json' },
    }),

  remove: (id: number | string) =>
    api.delete<ApiEnvelope<unknown>>(`/hotel-contents/${id}`),
};
