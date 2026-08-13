type UploadStateLike = {
  status?: string | null;
} | null | undefined;

/** The chunked uploader has no state until a video upload actually starts. */
export function isHotelContentUploadActive(uploadState: UploadStateLike): boolean {
  return uploadState?.status === 'uploading' || uploadState?.status === 'merging';
}
