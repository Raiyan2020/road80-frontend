import React, { useState, useEffect } from 'react';
import { Listing } from '../../../types';
import { useNavigate } from '@tanstack/react-router';

export const HomeListingCard: React.FC<{ listing: Listing }> = ({ listing }) => {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate({ to: `/ad/${listing.id}` });
  };

  const [imgSrc, setImgSrc] = useState<string>('');
  const FALLBACK_IMAGE = 'https://raiyansoft.com/wp-content/uploads/2026/01/1.png';

  useEffect(() => {
    if (listing.imageUrl instanceof Blob || listing.imageUrl instanceof File) {
      setImgSrc(URL.createObjectURL(listing.imageUrl));
    } else if (typeof listing.imageUrl === 'string') {
      setImgSrc(listing.imageUrl);
    } else if (listing.images && listing.images.length > 0) {
      const first = listing.images[0];
      if (first instanceof Blob || first instanceof File) {
        setImgSrc(URL.createObjectURL(first));
      } else {
        setImgSrc(first as string);
      }
    } else {
      setImgSrc(FALLBACK_IMAGE);
    }
  }, [listing]);

  return (
    <div
      onClick={handleClick}
      className="flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-pale/50 dark:border-slate-800 overflow-hidden active:scale-95 transition-all duration-300 cursor-pointer"
    >
      <div className="aspect-square bg-gray-100 dark:bg-slate-800 relative">
        <img
          src={imgSrc}
          alt={listing.title}
          className="w-full h-full object-cover"
          onError={(e) => e.currentTarget.src = FALLBACK_IMAGE}
        />
      </div>
      <div className="p-3 flex flex-col gap-1">
        <span className="text-blue dark:text-blue/80 font-bold text-sm text-right font-sans">{listing.price}</span>
        <h4 className="text-navy dark:text-slate-200 font-semibold text-xs truncate text-right font-sans">{listing.title}</h4>
        <div className="flex items-center justify-end gap-1 opacity-60">
          <span className="text-[13px] text-navy dark:text-slate-400 font-medium font-sans">{listing.area}</span>
          <div className="w-1 h-1 rounded-full bg-navy dark:bg-slate-400"></div>
        </div>
      </div>
    </div>
  );
};
