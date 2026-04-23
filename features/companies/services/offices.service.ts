import api from '@/lib/api-client';
import { Office, OfficeSchema, Listing, ListingSchema } from '@/lib/types';
import { CompanyDepartment, DepartmentsResponse } from '../types';

// ── Service functions ─────────────────────────────────────────

/**
 * Fetch all company departments.
 */
export async function fetchDepartments(): Promise<CompanyDepartment[]> {
  try {
    const response = await api.get<DepartmentsResponse>('/companies/departments');
    if (response.status) return response.data;
    return [];
  } catch (error) {
    console.error('[Offices Service] Error fetching departments:', error);
    return [];
  }
}

interface RawOfficeResponse {
  id: number;
  name?: string;
  image?: string | { file?: string } | null;
  state: string | { name?: string } | null;
  ads_count: number;
  rate: number;
}

/**
 * Fetch offices, optionally filtered by category name/id.
 */
export async function fetchOffices(category?: string | number): Promise<Office[]> {
  try {
    const url = category ? `/companies/departments/${category}` : '/explore';
    const resp = await api.get<{ status: boolean; data: RawOfficeResponse[] }>(url);
    
    if (resp.status && resp.data) {
      if (!Array.isArray(resp.data)) {
         console.error('[Offices Service] Expected array but got:', resp.data);
         return [];
      }
      return resp.data.map((raw) => {
        try {
          const logoUrl = typeof raw.image === 'string'
            ? raw.image
            : (raw.image?.file ?? undefined);
          const governorate = typeof raw.state === 'object' && raw.state !== null ? raw.state?.name : (raw.state ?? undefined);
          
          return OfficeSchema.parse({
            id: raw.id,
            officeName: raw.name ?? "مكتب عقاري",
            logo: logoUrl,
            governorate,
            activeListingsCount: raw.ads_count,
            rating: raw.rate,
            sampleListings: [],
          });
        } catch (e) {
          console.error('[Offices Service] Validation error for office:', raw, e);
          return null;
        }
      }).filter(Boolean) as Office[];
    }
    return [];
  } catch (error) {
    console.error('[Offices Service] Error fetching offices:', error);
    return [];
  }
}

interface RawOfficeAd {
  id: number;
  title: string;
  description: string | null;
  price: string;
  likes_count: number;
  is_liked: boolean;
  watch_count: number;
  state_name: string;
  city_name: string;
  categories: Array<{
    category_name: string;
    category_value_name: string;
  }>;
  image?: {
    file: string;
    type: string;
  } | null;
}

/**
 * Fetch ads for a specific company.
 */
export async function fetchOfficeAds(id: string | number): Promise<Listing[]> {
  try {
    const resp = await api.get<{ status: boolean; data: RawOfficeAd[] }>(`/company/${id}/ads`);
    if (resp.status && resp.data) {
       
       return resp.data.map((raw) => {
          const propertyType = raw.categories.find(c => c.category_name === 'نوع العقار')?.category_value_name;
          const listingType = raw.categories.find(c => c.category_name === 'نوع الإعلان')?.category_value_name;
          
          return {
             id: raw.id,
             title: raw.title,
             description: raw.description ?? undefined,
             price: raw.price,
             governorate: raw.state_name,
             area: raw.city_name,
             propertyType,
             listingType,
             images: raw.image?.file ? [raw.image.file] : [],
             views: raw.watch_count,
          };
       }).map(item => ListingSchema.parse(item));
    }
    return [];
  } catch (error) {
    console.error(`[Offices Service] Error fetching ads for company ${id}:`, error);
    return [];
  }
}

interface RawCompanyProfile {
  id: number | string;
  name?: string;
  caption?: string;
  image?: string | { file?: string };
  total_active_ads?: number;
  total_ads_watch?: number;
  total_ads_likes?: number;
  rate?: number;
  [key: string]: unknown;
}

export async function fetchOfficeById(id: string | number): Promise<Office | null> {
  try {
    const response = await api.get<{ status: boolean; data: RawCompanyProfile }>(`/company/${id}`);
    if (response.status && response.data) {
      const raw = response.data;

      const logo = typeof raw.image === 'string'
        ? raw.image
        : (raw.image?.file ?? undefined);

      return OfficeSchema.parse({
        id: raw.id,
        officeName: raw.name ?? 'شركة',
        bio: raw.caption ?? undefined,
        logo,
        activeListingsCount: raw.total_active_ads ?? 0,
        totalViews: raw.total_ads_watch ?? 0,
        totalLikes: raw.total_ads_likes ?? 0,
        rating: raw.rate ?? 0,
        sampleListings: [],
      });
    }
    return null;
  } catch (err) {
    console.error(`[Offices Service] Error fetching company ${id}:`, err);
    return null;
  }
}

