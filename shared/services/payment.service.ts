import api from '@/lib/api-client';

// ─── Session Initiation (for AddWizard post-ad flow) ─────────────────────────

export interface InitiateSessionResponse {
  status: boolean;
  message: string;
  data: {
    SessionId: string;
    CountryCode: string;
  };
}

// ─── Payment Verification (for ListingDetailsPage call/unlock flow) ──────────

export interface VerifyPaymentParams {
  transaction_id: number;
  payment_id: string; // The session_id returned by MyFatoorah callback (response.SessionId)
}

export interface VerifyPaymentResponse {
  status: boolean;
  message: string;
  data?: any;
  errors?: any[];
}

// ─── Execute Payment (legacy / fallback) ────────────────────────────────────

export interface ExecutePaymentParams {
  sessionId: string;
  paymentMethod?: string;
  orderId?: string | number;
}

export interface ExecutePaymentResponse {
  status: boolean;
  message: string;
  data: {
    PaymentId: string;
    IsSuccess: boolean;
    ValidationErrors?: any;
  };
}

export const paymentService = {
  /**
   * Initiates a MyFatoorah Session (used by AddWizard).
   */
  initiateSession: async (): Promise<InitiateSessionResponse> => {
    console.log('[PaymentService] initiateSession → POST /payments/initiate-session');
    return api.post<InitiateSessionResponse>('/payments/initiate-session', {});
  },

  /**
   * Verifies a payment after MyFatoorah embedded form callback.
   * Uses: POST /payments/verify
   * Body: { transaction_id, payment_id }
   *
   * - transaction_id: returned by the /call endpoint
   * - payment_id: the SessionId returned by MyFatoorah's callback (response.SessionId)
   */
  verifyPayment: async (params: VerifyPaymentParams): Promise<VerifyPaymentResponse> => {
    console.log('[PaymentService] verifyPayment → POST /payments/verify', params);
    const formData = new FormData();
    formData.append('transaction_id', params.transaction_id.toString());
    formData.append('payment_id', params.payment_id);
    return api.post<VerifyPaymentResponse>('/payments/verify', formData);
  },

  /**
   * Executes payment (legacy/fallback).
   */
  executePayment: async (params: ExecutePaymentParams): Promise<ExecutePaymentResponse> => {
    console.log('[PaymentService] executePayment → POST /payments/execute-payment', params);
    return api.post<ExecutePaymentResponse>('/payments/execute-payment', params);
  },
};
