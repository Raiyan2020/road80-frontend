import React, { useEffect, useState } from 'react';
import {
  InstagramIcon,
  FacebookIcon,
  XIcon,
  LinkedInIcon,
  TikTokIcon,
  SnapchatIcon,
  YoutubeIcon,
  WhatsappIcon,
  LinkIcon,
} from './Icons';

/**
 * Built-in fallbacks for the seeded platform slugs. The admin can upload an
 * icon per platform, but until then `image` comes back null and every platform
 * would otherwise render the same generic link glyph.
 */
const SLUG_ICONS: Record<string, React.FC<{ className?: string }>> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  x: XIcon,
  twitter: XIcon,
  linkedin: LinkedInIcon,
  tiktok: TikTokIcon,
  snapchat: SnapchatIcon,
  youtube: YoutubeIcon,
  whatsapp: WhatsappIcon,
};

interface SocialPlatformIconProps {
  slug: string;
  image?: string | null;
  name?: string;
  className?: string;
}

export const SocialPlatformIcon: React.FC<SocialPlatformIconProps> = ({
  slug,
  image,
  name,
  className = 'w-5 h-5',
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [image]);

  if (image && !imageFailed) {
    return (
      <img
        src={image}
        alt={name || slug}
        className={`${className} object-contain`}
        onError={() => setImageFailed(true)}
      />
    );
  }

  const FallbackIcon = SLUG_ICONS[slug.toLowerCase()] || LinkIcon;
  return <FallbackIcon className={className} />;
};

export default SocialPlatformIcon;
