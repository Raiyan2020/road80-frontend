'use client';

import { useMutation } from '@tanstack/react-query';
import { initiateCall } from '../services/listing-detail.service';

/**
 * Hook to initiate a call / WhatsApp unlock for an ad.
 * Navigation to payment_url is intentionally left to the consuming component
 * so the hook stays reusable and free of side-effects.
 */
export function useCallAd() {
  return useMutation({
    mutationFn: (adId: number) => initiateCall(adId),
    onError: (error) => {
      // Handle error
    },
  });
}
