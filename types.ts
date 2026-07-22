
import React from 'react';

export enum Tab {
  HOME = 'HOME',
  COMPANIES = 'COMPANIES',
  ADD = 'ADD',
  EXPLORE = 'EXPLORE',
  PROFILE = 'PROFILE'
}

export interface NavItem {
  id: Tab;
  /** i18n key — resolved at render time so the label follows the active language. */
  labelKey?: string;
  icon: React.FC<{ className?: string }>;
  isSpecial?: boolean;
}

export interface Listing {
  id: number;
  listingType?: string;
  propertyType?: string;
  price: string;
  governorate?: string;
  area?: string;
  title: string;
  rooms?: string | number;
  bathrooms?: string | number;
  size?: number;
  balcony?: string;
  parking?: string;
  parkingSystems?: string[];
  electricity?: string;
  water?: string;
  ac?: string;
  description?: string;
  images: (string | File | Blob)[];
  video?: string | File | Blob | null;
  imageUrl?: string | File | Blob; // Legacy support
  createdAt?: Date | string;
  views?: number;
  publisherId?: string;
  publisherName?: string;
  publisherAvatar?: string;
  isLiked?: boolean;
  likesCount?: number;
  watchCount?: number;
  status?: number;
}

export interface Office {
  id: string;
  officeName: string;
  username: string;
  logo: string;
  bio: string;
  governorate: string;
  yearsExperience: number;
  activeListingsCount: number;
  soldOrRentedCount: number;
  totalViews: number;
  rating: number;
  responseTime: string;
  phone: string;
  whatsapp: string;
  verified: boolean;
  specialties: string[];
  sampleListings: Listing[];
}
