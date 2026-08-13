import api from '@/lib/api-client';

export interface FilterOptionValue {
  id: number;
  value: string;
  /** Absolute URL served by the backend; null when no artwork was uploaded. */
  icon?: string | null;
  /**
   * Backend flag marking the values that belong on the home screen's quick
   * actions. Optional because older payloads (and the filter endpoint) omit it.
   */
  appear_in_home?: boolean;
  slug?: string | null;
  entity_type?: string | null;
  destination?: string | null;
}

export interface FilterCategory {
  id: number;
  name: string;
  type: string;
  slug?: string | null;
  appear_in_filters?: boolean;
  entity_type?: string | null;
  destination?: string | null;
  values: FilterOptionValue[];
}

export interface FilterOptionsResponse {
  status: boolean;
  message: string;
  data: FilterCategory[];
}

/**
 * Fetch categories and values that should appear in the filter.
 */
export async function fetchFilterOptions(): Promise<FilterCategory[]> {
  try {
    const response = await api.get<FilterOptionsResponse>('/home/categories-appear-in-filter');
    if (response.status) return response.data;
    return [];
  } catch (error) {
    return [];
  }
}

/**
 * Fetch all categories (with their values) from /categories.
 * Used by the QuickActionsRow on the home screen.
 */
export async function fetchCategories(): Promise<FilterCategory[]> {
  try {
    const response = await api.get<FilterOptionsResponse>('/categories');
    if (response.status) return response.data;
    return [];
  } catch (error) {
    return [];
  }
}
