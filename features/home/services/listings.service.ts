/**
 * features/home/services/listings.service.ts
 *
 * All data-fetching functions for the home feature.
 * Connects to the real backend API.
 */

import api from '@/lib/api-client';
import { Listing } from '@/lib/types';
import { mapRawExploreToListing } from '@/features/explore/services/explore.service';

/**
 * Fetch the home-page listing feed.
 * Logic: 
 * 1. Tries `ads-by-history` for personalized results.
 * 2. If empty (new user/no history), falls back to general `explore` listings 
 *    to ensure the landing page is never empty.
 */
export async function fetchHomeListings(): Promise<Listing[]> {
  try {
    // Attempt personalized history-based ads
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await api.get<{ status: boolean; data: any[] }>('/home/ads-by-history');
    
    if (response.status && response.data && response.data.length > 0) {
        return response.data.map(raw => mapRawExploreToListing(raw));
    }
    
    // Fallback: Fetch general ads from explore if history is empty
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fallbackResponse = await api.get<{ status: boolean; data: any[] }>('/explore');
    
    if (fallbackResponse.status && fallbackResponse.data) {
        return fallbackResponse.data.map(raw => mapRawExploreToListing(raw));
    }

    return [];
  } catch (error) {
    return [];
  }
}

/**
 * Fetch a single listing by id.
 */
export async function fetchListingById(id: number): Promise<Listing | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await api.get<{ status: boolean; data: any }> (`/ad/${id}`);
    if (response.status && response.data) {
      return mapRawExploreToListing(response.data);
    }
    return null;
  } catch (error) {
    return null;
  }
}
