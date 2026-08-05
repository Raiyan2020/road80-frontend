import React from 'react';
import type { UserSocial, UserSocials } from '@/shared/services/social-platforms.service';
import { SocialPlatformIcon } from './SocialPlatformIcon';

interface SocialLinksRowProps {
  socials?: UserSocials;
  className?: string;
}

/**
 * Renders the user's saved social links as tappable icons.
 * Platforms without a link are already filtered out by normalizeSocials().
 */
export const SocialLinksRow: React.FC<SocialLinksRowProps> = ({
  socials,
  className = '',
}) => {
  const entries = Object.entries<UserSocial>(socials || {});
  if (entries.length === 0) return null;

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
    >
      {entries.map(([slug, social]) => (
        <a
          key={slug}
          href={social.link}
          target="_blank"
          rel="noopener noreferrer"
          title={social.name}
          aria-label={social.name}
          className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-pale dark:border-slate-800 text-navy dark:text-blue shadow-sm overflow-hidden hover:border-navy/30 dark:hover:border-blue/30 active:scale-95 transition-all duration-300"
        >
          <SocialPlatformIcon
            slug={slug}
            image={social.image}
            name={social.name}
            className="w-[18px] h-[18px]"
          />
        </a>
      ))}
    </div>
  );
};

export default SocialLinksRow;
