import api from '@/lib/api-client';


interface ListingDetailResponse {
  status: boolean;
  message: string;
  data: any;
}

/**
 * Fetch a single listing by id from the real API.
 * Returns the full raw API data so the UI can access attachments, categories, user, safety_tips etc.
 */
export async function fetchListingById(id: number): Promise<any | null> {
  try {
    const response = await api.get<ListingDetailResponse>(`/ad/${id}`);
    if (!response.status || !response.data) return null;
    
    // Return raw data directly — the UI handles field mapping itself
    return response.data;
  } catch (error) {
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
