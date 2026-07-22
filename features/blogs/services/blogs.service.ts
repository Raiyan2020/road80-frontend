import api from '@/lib/api-client';

/**
 * Blog copy is localized server-side. The active language ships as an
 * `Accept-Language` header on every request, set centrally in
 * `lib/api-client.ts` and read at call time — so no per-request header here.
 * The `lang` in these query keys is what makes a switch refetch.
 */
export interface BlogsResponse {
  data: any;
  status: boolean;
}

export interface BlogDetailResponse {
  data: any;
  status: boolean;
}

/**
 * Fetch all blogs.
 */
export async function fetchBlogs(page: number = 1): Promise<BlogsResponse> {
  return api.get<BlogsResponse>('/blogs', { query: { page } });
}


/**
 * Fetch a single blog by ID.
 * @param id The blog ID
 */
export async function fetchBlogById(id: number | string): Promise<BlogDetailResponse> {
  return api.get<BlogDetailResponse>(`/blog/${id}`);
}
