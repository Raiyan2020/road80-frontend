const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const ALLOWED_VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime'];
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.mov'];

const getExtension = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ext ? `.${ext}` : '';
};

export const AD_IMAGE_TYPE_ERROR =
  'يجب أن تكون الصورة بصيغة JPG أو JPEG أو PNG فقط.';

export const AD_VIDEO_TYPE_ERROR =
  'يجب أن يكون الفيديو بصيغة MP4 أو MOV فقط.';

export function isAllowedAdImage(file: File): boolean {
  const ext = getExtension(file.name);
  return (
    ALLOWED_IMAGE_MIME_TYPES.includes(file.type) ||
    ALLOWED_IMAGE_EXTENSIONS.includes(ext)
  );
}

export function isAllowedAdVideo(file: File): boolean {
  const ext = getExtension(file.name);
  return (
    ALLOWED_VIDEO_MIME_TYPES.includes(file.type) ||
    ALLOWED_VIDEO_EXTENSIONS.includes(ext)
  );
}
