const API_BASE = import.meta.env.VITE_API_URL || 'https://portal.road-80.com/api';
const STORAGE_BASE = API_BASE.replace(/\/api\/?$/, '/storage');

export function resolveMediaUrl(url?: string | null): string {
  if (!url?.trim()) return '';

  const trimmed = url.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('/')
  ) {
    if (trimmed.startsWith('/storage/')) {
      return `${STORAGE_BASE.replace(/\/storage$/, '')}${trimmed}`;
    }
    return trimmed;
  }

  const normalized = trimmed.replace(/^storage\//, '');
  return `${STORAGE_BASE}/${normalized}`;
}
