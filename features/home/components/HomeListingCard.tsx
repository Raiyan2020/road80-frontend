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
      className="flex h-full min-h-[250px] flex-col bg-white dark:bg-slate-900 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-pale/50 dark:border-slate-800 overflow-hidden active:scale-95 transition-all duration-300 cursor-pointer"
    >
      <div className="relative h-[170px] w-full shrink-0 bg-gray-100 dark:bg-slate-800 sm:h-[190px]">
        <AppImage
          src={resolveListingImageUrl(listing)}
          alt={listing.title}
          className="w-full h-full"
        />
      </div>
      <div className="flex min-h-[80px] flex-1 flex-col justify-between gap-1 p-3">
        <span className="line-clamp-1 rtl:text-right ltr:text-left font-sans text-sm font-bold text-blue dark:text-blue/80">{listing.price}</span>
        <h4 className="line-clamp-2 min-h-[2rem] rtl:text-right ltr:text-left font-sans text-xs font-semibold leading-4 text-navy dark:text-slate-200">{listing.title}</h4>
        <div className="flex items-center rtl:justify-end ltr:justify-start gap-1 opacity-60">
          <span className="line-clamp-1 font-sans text-[13px] font-medium text-navy dark:text-slate-400">{listing.area}</span>
          <div className="w-1 h-1 rounded-full bg-navy dark:bg-slate-400"></div>
        </div>
      </div>
    </div>
  );
};
