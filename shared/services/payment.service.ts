import api from '@/lib/api-client';

/**
 * Payment is a MyFatoorah *embedded* flow:
 *
 *   1. Ask the backend for a session — either implicitly (creating an ad returns
 *      one) or explicitly via `createSession`.
 *   2. Hand `session_id` + `encryption_key` to the MyFatoorah SDK, which renders
 *      the card form and returns a numeric `paymentId`.
 *   3. Post that back to `verifyPayment`, which is what actually settles the
 *      transaction server-side.
 *
 * There is no `payment_url` and no redirect step — the old gateway flow that
 * returned one was removed backend-side.
 */

// ─── Session creation ────────────────────────────────────────────────────────

export interface CreateSessionParams {
  type: 'call' | 'publish_ad';
  /** Ad id for both types — the ad being published, or the one being unlocked. */
  reference_id: number;
}

export interface PaymentSession {
  session_id: string;
  encryption_key: string;
  transaction_id: number;
}

export interface CreateSessionResponse {
  status: boolean;
  message: string;
  data: PaymentSession;
  errors?: unknown[];
}

// ─── Verification ────────────────────────────────────────────────────────────

export interface VerifyPaymentParams {
  transaction_id: number;
  /**
   * MyFatoorah's numeric `paymentId` from the SDK callback — NOT the SessionId.
   * The backend passes this straight to `GET /payments/{paymentId}`, so a
   * SessionId here makes verification fail every time.
   *
   * In v3 the callback has no top-level paymentId, so this is only ever the value
   * scraped out of `redirectionUrl`. Send `payment_data` whenever it is available.
   */
  payment_id?: string;
  /**
   * The v3 callback's AES-encrypted status document. The backend decrypts it with
   * the EncryptionKey from the session — this is the authoritative result channel
   * and needs no extra round-trip to MyFatoorah.
   */
  payment_data?: string;
}

/** Present for `call` transactions only; null when publishing an ad. */
export interface ContactInfo {
  phone: string | null;
  whatsapp: string | null;
  phone_code: string | null;
}

/**
 * NOTE: the backend builds `contact_info` for call transactions but currently
 * discards it — `PaymentController::verify` responds with a literal `[]`. So
 * treat this as best-effort: on success, refetch the ad and read the contact
 * details from there, which is the path that actually works today. The optional
 * field is kept so this starts working for free if the backend is fixed.
 */
export interface VerifyPaymentResponse {
  status: boolean;
  message: string;
  data?: { contact_info?: ContactInfo | null } | ContactInfo[] | null;
  errors?: unknown[];
}

export const paymentService = {
  /**
   * Create a fresh session for an ad that already exists — used to retry after a
   * declined card or an expired session, without re-submitting the ad.
   */
  createSession: async (params: CreateSessionParams): Promise<CreateSessionResponse> => {
    const formData = new FormData();
    formData.append('type', params.type);
    formData.append('reference_id', String(params.reference_id));
    return api.post<CreateSessionResponse>('/payments/create-session', formData);
  },

  /** Settle a payment. Returns `contact_info` for `call` transactions. */
  verifyPayment: async (params: VerifyPaymentParams): Promise<VerifyPaymentResponse> => {
    const formData = new FormData();
    formData.append('transaction_id', String(params.transaction_id));
    // The backend requires exactly one of the two; sending an empty string for the
    // absent one would satisfy `required_without` while carrying no usable value.
    if (params.payment_data) formData.append('payment_data', params.payment_data);
    if (params.payment_id) formData.append('payment_id', params.payment_id);
    return api.post<VerifyPaymentResponse>('/payments/verify', formData);
  },
};
