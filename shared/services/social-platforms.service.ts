import api from '@/lib/api-client';

/** A platform as defined by the admin — the source of truth for the edit form. */
export interface SocialPlatform {
  id: number;
  name: string;
  slug: string;
  /** Base URL hint from admin, used as an input placeholder. */
  link: string | null;
  image: string | null;
}

/** A single link the user actually saved, as returned inside `socials`. */
export interface UserSocial {
  platform_id: number;
  name: string;
  image: string | null;
  base_link: string | null;
  link: string;
}

/** `socials` object from profile responses, keyed by platform slug. */
export type UserSocials = Record<string, UserSocial>;

export interface SocialPlatformsResponse {
  status: boolean;
  message: string;
  data: SocialPlatform[];
  errors: Record<string, string[]> | unknown[];
}

/**
 * `socials` is documented as an object keyed by slug, but an empty one
 * serializes to `[]` on the backend. Normalize both shapes, and drop entries
 * with a blank link so callers can treat any key as displayable.
 */
export function normalizeSocials(raw: unknown): UserSocials {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};

  return Object.fromEntries(
    Object.entries(raw as UserSocials).filter(
      ([, value]) => typeof value?.link === 'string' && value.link.trim() !== '',
    ),
  );
}

export const socialPlatformsService = {
  getPlatforms: () => api.get<SocialPlatformsResponse>('/social-platforms'),
};
