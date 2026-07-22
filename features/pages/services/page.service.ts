import api from '../../../lib/api-client';

/**
 * Static page copy is localized server-side. The active language ships as an
 * `Accept-Language` header on every request, set centrally in
 * `lib/api-client.ts` and read at call time — so no per-request header here.
 * The `lang` in these query keys is what makes a switch refetch.
 */

export interface StaticPageData {
  title: string | null;
  description: string | null;
  image: string | null;
}

export interface StaticPageResponse {
  status: boolean;
  message: string;
  data: StaticPageData;
  errors: any[];
}

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

export interface FaqResponse {
  status: boolean;
  message: string;
  data: FaqItem[];
  errors: any[];
}

export const staticPageService = {
  getTerms: () => api.get<StaticPageResponse>('/pages/terms-conditions'),
  getPrivacy: () => api.get<StaticPageResponse>('/pages/privacy-policy'),
  getAboutUs: () => api.get<StaticPageResponse>('/pages/about-us'),
  getFaqs: () => api.get<FaqResponse>('/pages/faqs'),
};
