import React from 'react';
import { Listing } from '../../../types';
import { useNavigate } from '@tanstack/react-router';
import { AppImage } from '@/components/AppImage';
import { resolveListingImageUrl } from '@/shared/utils/listing-image';

export const HomeListingCard: React.FC<{ listing: Listing }> = ({ listing }) => {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate({ to: `/ad/${listing.id}` });
  };

  return (
    <div
      onClick={handleClick}
      className="flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-pale/50 dark:border-slate-800 overflow-hidden active:scale-95 transition-all duration-300 cursor-pointer"
    >
      <div className="aspect-square bg-gray-100 dark:bg-slate-800 relative">
        <AppImage
          src={resolveListingImageUrl(listing)}
          alt={listing.title}
          className="w-full h-full"
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
