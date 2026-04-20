import api from '@/lib/api-client';

export interface CategoryValue {
  id: number;
  value: string;
}

export interface Category {
  id: number;
  name: string;
  type: 'select' | 'number' | 'range' | 'boolean';
  values: CategoryValue[];
}

export interface CategoriesResponse {
  status: boolean;
  message: string;
  data: Category[];
  errors: unknown[];
}

// ── Chunk upload interfaces ──────────────────────────────────────────────────

export interface UploadChunkResponse {
  status: boolean;
  message: string;
  data: {
    chunk_index: number;
    file_id: string;
  };
  errors: unknown[];
}

export interface MergeChunksResponse {
  status: boolean;
  message: string;
  data: {
    path: string;
  };
  errors: unknown[];
}

export interface CreateAdResponse {
  status: boolean;
  message: string;
  data: unknown[];
  errors: unknown[];
}

// ── Service ──────────────────────────────────────────────────────────────────

export const postAdService = {
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get<CategoriesResponse>('/categories');
    return response.data;
  },

  /**
   * Upload a single chunk of a (video) file.
   * Must be called sequentially or concurrently for each chunk of the same file_id.
   */
  uploadChunk: async (params: {
    fileId: string;
    chunkIndex: number;
    chunk: Blob;
  }): Promise<UploadChunkResponse> => {
    const formData = new FormData();
    formData.append('file_id', params.fileId);
    formData.append('chunk_index', String(params.chunkIndex));
    formData.append('file', params.chunk);
    return api.post<UploadChunkResponse>('/upload-chunk', formData);
  },

  /**
   * Tell the server to merge all uploaded chunks into a single file.
   * Returns the server-side path to use in createAd.
   */
  mergeChunks: async (params: {
    fileId: string;
    totalChunks: number;
    originalExtension: string; // e.g. ".mp4"
  }): Promise<MergeChunksResponse> => {
    const formData = new FormData();
    formData.append('file_id', params.fileId);
    formData.append('total_chunks', String(params.totalChunks));
    formData.append('original_extension', params.originalExtension);
    return api.post<MergeChunksResponse>('/merge-chunks', formData);
  },

  /**
   * Create the ad.
   * - videos: list of server-side paths returned from mergeChunks
   * - images: list of image File objects for direct upload
   */
  createAd: async (params: {
    answers: Array<{ 
      category_id: number; 
      category_value_id?: number | string;
      value?: string | number;
    }>;
    countryId: number | string;
    stateId: number | string;
    cityId: number | string;
    videoPaths: string[];   // from merge-chunks
    images: File[];
    price: number | string;
    title?: string;
    description?: string;
  }): Promise<CreateAdResponse> => {
    const formData = new FormData();

    formData.append('title', params.title ?? '');
    formData.append('description', params.description ?? '');
    formData.append('price', String(params.price));

    formData.append('country_id', String(params.countryId));
    formData.append('state_id', String(params.stateId));
    formData.append('city_id', String(params.cityId));

    // Dynamic category answers
    params.answers.forEach((ans, i) => {
      formData.append(`answers[${i}][category_id]`, String(ans.category_id));
      if (ans.category_value_id !== undefined) {
        formData.append(`answers[${i}][category_value_id]`, String(ans.category_value_id));
      }
      if (ans.value !== undefined) {
        formData.append(`answers[${i}][value]`, String(ans.value));
      }
    });

    // Merged video paths (from chunk upload flow)
    params.videoPaths.forEach((path, i) => {
      formData.append(`video_paths[${i}]`, path);
    });

    // Direct image uploads
    params.images.forEach((img, i) => {
      formData.append(`attachments[${i}][file]`, img);
      formData.append(`attachments[${i}][type]`, 'image');
    });

    return api.post<CreateAdResponse>('/profile/store-ads', formData);
  },
};
