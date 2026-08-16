import api from '@/lib/api-client';
import type { Listing } from '@/types';

export interface ListingSource {
  name: string;
  external_id: number;
  url: string;
  published_at: string | null;
  imported_at: string | null;
}

export interface ListingDetail extends Omit<Partial<Listing>, 'id' | 'price' | 'title'> {
  id: number;
  title: string;
  price: string | number | null;
  owner_phone?: string | null;
  owner_whatsapp?: string | null;
  city_name?: string | null;
  state_name?: string | null;
  watch_count?: number;
  created_at?: string | null;
  is_liked?: boolean;
  is_paid?: number | boolean;
  safety_tips?: string | null;
  video_url?: string | null;
  video_urls?: string[];
  source?: ListingSource | string | null;
  property_category?: {
    id: number | null;
    external_id: number | null;
    name: string | null;
    slug: string | null;
    parent: string | null;
  } | null;
  attachments?: Array<{ file: string; type?: string | null }>;
  categories?: Array<{
    category_name?: string | null;
    category_value_name?: string | number | null;
    range?: string | number | null;
  }>;
  user?: {
    id?: number | null;
    name?: string | null;
    image?: string | null;
    caption?: string | null;
  } | null;
}

interface ListingDetailResponse {
  status: boolean | string;
  message: string;
  data: ListingDetail | unknown[];
  errors: unknown[] | Record<string, string[]>;
}

/**
 * Fetch a single listing by id from the real API.
 * Returns the full raw API data so the UI can access attachments, categories, user, safety_tips etc.
 */
export async function fetchListingById(id: number): Promise<ListingDetail | null> {
  try {
    const response = await api.get<ListingDetailResponse>(`/ad/${id}`);
    if (response.status !== true || !response.data || Array.isArray(response.data)) return null;
    
    // Return raw data directly — the UI handles field mapping itself
    return response.data;
  } catch {
    return null;
  }
}

export interface CallResponse {
  status: boolean;
  message: string;
  /** An embedded payment session — see shared/services/payment.service. */
  data: {
    session_id: string;
    encryption_key: string;
    transaction_id: number;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any[];
}

/**
 * Open a payment session to unlock an ad's contact details.
 *
 * Moved under the `payments` prefix backend-side. The bare `/call` this used to
 * post to only survived as a duplicate route registration and has been removed.
 */
export async function initiateCall(adId: number): Promise<CallResponse> {
  const formData = new FormData();
  formData.append('ad_id', adId.toString());

  return api.post<CallResponse>('/payments/call', formData);
}
