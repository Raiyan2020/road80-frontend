import React, { useState, useEffect } from "react";
import {
  SpinnerIcon,
  InstagramIcon,
  TikTokIcon,
  SnapchatIcon,
  MapPinIcon,
  GlobeIcon,
  LinkIcon,
  UserIcon,
  VerifiedIcon,
  WhatsappIcon,
  PhoneIcon,
} from "./Icons";
import { Listing } from "../types";
import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  useUserAds,
  useUserFavorites,
  useProfile,
  useDeleteAd,
  useToggleAdStatus,
} from "../features/account/hooks/useProfile";
import { UpdateProfileDialog } from "./UpdateProfileDialog";
import { useOffice } from "../features/companies/hooks/useOffices";
import { useOfficeAds } from "../features/companies/hooks/useOfficeAds";

interface ProfilePageProps {
  onListingClick?: (listing: Listing) => void;
}

const EditIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.158 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
    <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
  </svg>
);

const FALLBACK_IMAGE =
  "https://raiyansoft.com/wp-content/uploads/2026/01/1.png";

const ListingCard: React.FC<{
  listing: Listing;
  onClick?: () => void;
  isOwner?: boolean;
  onDelete?: (e: React.MouseEvent) => void;
  onToggleStatus?: (e: React.MouseEvent) => void;
  isDeleting?: boolean;
  isToggling?: boolean;
}> = ({
  listing,
  onClick,
  isOwner,
  onDelete,
  onToggleStatus,
  isDeleting,
  isToggling,
}) => {
  const [imgSrc, setImgSrc] = useState<string>("");

  useEffect(() => {
    if (listing.imageUrl instanceof Blob || listing.imageUrl instanceof File) {
      setImgSrc(URL.createObjectURL(listing.imageUrl));
    } else if (typeof listing.imageUrl === "string") {
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
      onClick={onClick}
      className={`flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-pale/50 dark:border-slate-800 overflow-hidden active:scale-98 transition-all duration-300 cursor-pointer ${listing.status === 0 ? "opacity-60" : ""}`}
    >
      <div className="aspect-square bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative">
        <img
          src={imgSrc}
          alt={listing.title}
          className="w-full h-full object-cover"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
        />
        <span className="absolute top-2 left-2 bg-navy/80 dark:bg-blue/80 text-white text-[13px] px-2 py-0.5 rounded-full z-10 font-bold">
          جديد
        </span>

        {isOwner && (
          <div className="absolute top-2 right-2 flex gap-1 z-20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onDelete) onDelete(e);
              }}
              disabled={isDeleting}
              className="w-8 h-8 rounded-full bg-red-500/90 text-white flex items-center justify-center backdrop-blur-sm active:scale-90 transition-all font-bold disabled:opacity-50"
            >
              {isDeleting ? (
                "..."
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleStatus) onToggleStatus(e);
              }}
              disabled={isToggling}
              className={`w-8 h-8 rounded-full text-white flex items-center justify-center backdrop-blur-sm active:scale-90 transition-all font-bold disabled:opacity-50 ${listing.status === 0 ? "bg-green-500/90" : "bg-gray-800/90"}`}
            >
              {isToggling ? (
                "..."
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  {listing.status === 0 ? (
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  ) : (
                    <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
                  )}
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1">
        <span className="text-blue dark:text-blue/80 font-bold text-sm text-right font-sans">
          {listing.price}
        </span>
        <h4 className="text-navy dark:text-slate-200 font-semibold text-xs truncate text-right font-sans">
          {listing.title}
        </h4>
        <div className="flex items-center justify-end gap-1 opacity-60">
          <span className="text-[13px] text-navy dark:text-slate-400 font-medium font-sans">
            {listing.area}
          </span>
          <div className="w-1 h-1 rounded-full bg-navy dark:bg-slate-500"></div>
        </div>
      </div>
    </div>
  );
};

const StatItem: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="flex flex-col items-center gap-1">
    <span className="text-lg font-bold text-navy dark:text-slate-200 font-sans">
      {value}
    </span>
    <span className="text-xs text-gray-400 dark:text-slate-500 font-medium font-sans">
      {label}
    </span>
  </div>
);

const ProfilePage: React.FC<ProfilePageProps> = ({ onListingClick }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getParams = () => {
    return new URLSearchParams(window.location.search);
  };

  const params = getParams();
  // Strip surrounding quote characters that can appear from serialization bugs (e.g. %2251%22 → "51" → 51)
  const rawUserId = params.get("user");
  const viewedUserId = rawUserId ? rawUserId.replace(/^"|"$/g, "") : null;
  const activeTabParam = params.get("tab");
  const isMe = !viewedUserId || viewedUserId === "current_user";

  const [activeSubTab, setActiveSubTab] = useState<"ads" | "favorites">(
    activeTabParam === "favorites" && isMe ? "favorites" : "ads",
  );
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  useEffect(() => {
    const p = getParams();
    const tab = p.get("tab");
    if (isMe) {
      setActiveSubTab(tab === "favorites" ? "favorites" : "ads");
    }
  }, [location.search, isMe]);

  const handleTabChange = (tab: "ads" | "favorites") => {
    if (!isMe) return;
    navigate({ to: location.pathname, search: { tab } as any, replace: true });
  };

  const { data: myAdsData = [], isLoading: myAdsLoading } = useUserAds();
  const { data: myFavsData = [], isLoading: myFavsLoading } =
    useUserFavorites();
  const { profile, isLoading: profileLoading } = useProfile();
  const { data: officeData, isLoading: officeLoading } = useOffice(
    viewedUserId || "",
  );
  const { data: officeAdsData = [], isLoading: officeAdsLoading } =
    useOfficeAds(viewedUserId || "");
  const deleteAdMutation = useDeleteAd();
  const toggleStatusMutation = useToggleAdStatus();

  const isLoading = isMe
    ? myAdsLoading || myFavsLoading || profileLoading
    : officeLoading || officeAdsLoading;

  let profileName = "مستخدم";
  let profileBio = "";
  let profileAvatar: string | null = null;
  let isVerified = false;
  let stats = { ads: "0", likes: "0", views: "0" };
  let displayList: Listing[] = [];

  if (isMe) {
    const myAds = myAdsData;
    const myFavs = myFavsData;
    displayList = (activeSubTab === "ads" ? myAds : myFavs) as Listing[];
    stats = {
      ads: myAds.length.toString(),
      likes: myFavs.length.toString() || "0",
      views: profile?.total_ads_watch?.toString() || "0",
    };
    profileName = profile?.name || profile?.country_code || "مستخدم";
    profileBio = profile?.caption || "نورت بروفايلي!";
    profileAvatar = profile?.image || null;
    isVerified = false;
  } else {
    if (officeData) {
      profileName = officeData.officeName || "شركة";
      profileAvatar = officeData.logo || null;
      profileBio = officeData.bio || "";
      isVerified = false;
      stats = {
        ads: officeData.activeListingsCount?.toString() || "0",
        likes: officeData.totalLikes?.toString() || "0",
        views: officeData.totalViews?.toString() || "0",
      };
      displayList = officeAdsData as Listing[];
    }
  }

  const socialActions = [
    { id: "instagram", icon: InstagramIcon, url: "https://instagram.com/" },
    { id: "tiktok", icon: TikTokIcon, url: "https://tiktok.com/" },
    { id: "snapchat", icon: SnapchatIcon, url: "https://snapchat.com/" },
    { id: "location", icon: MapPinIcon, url: "https://maps.google.com/" },
    { id: "website", icon: GlobeIcon, url: "https://example.com/" },
    { id: "link", icon: LinkIcon, url: "https://example.com/link" },
  ];

  return (
    <div className="flex flex-col p-4 gap-6 animate-fade-in transition-colors duration-300">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pale to-white dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-navy dark:text-slate-200 shrink-0 border-2 border-white dark:border-slate-800 shadow-md overflow-hidden relative">
          {profileAvatar ? (
            <img
              src={profileAvatar}
              alt={profileName}
              className="w-full h-full object-cover"
            />
          ) : (
            <UserIcon className="w-10 h-10 opacity-80" />
          )}
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-center gap-1">
            <h2 className="text-xl font-bold text-navy dark:text-slate-200 font-sans line-clamp-1">
              {profileName}
            </h2>
            {isVerified && (
              <VerifiedIcon className="w-5 h-5 text-blue shrink-0" />
            )}
            {isMe && (
              <button
                onClick={() => setIsEditProfileOpen(true)}
                className="mr-auto w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-navy dark:text-slate-300"
              >
                <EditIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 leading-snug font-sans font-normal whitespace-pre-line">
            {profileBio}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center px-4 py-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-pale dark:border-slate-800 transition-colors duration-300">
        <StatItem label="الإعلانات" value={stats.ads} />
        <div className="w-px h-8 bg-gray-100 dark:bg-slate-800"></div>
        <StatItem label="الإعجابات" value={stats.likes} />
        <div className="w-px h-8 bg-gray-100 dark:bg-slate-800"></div>
        <StatItem label="المشاهدات" value={stats.views} />
      </div>

      <div className="flex gap-3">
        <a
          href="https://wa.me/96598812020"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-navy/20 dark:border-slate-700 bg-white dark:bg-slate-900 text-navy dark:text-slate-200 font-semibold text-sm transition-all active:scale-98"
        >
          <WhatsappIcon className="w-6 h-6" />
          <span>ارسال واتساب</span>
        </a>
        <a
          href="tel:+96598812020"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-navy dark:bg-blue text-white font-semibold text-sm shadow-lg shadow-navy/20 dark:shadow-blue/20 transition-all active:scale-98"
        >
          <PhoneIcon className="w-5 h-5" />
          <span>اتصال</span>
        </a>
      </div>

      {/* Social and Action Icons Row */}
      <div className="flex justify-center gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar py-2 mt-1 mb-2">
        {socialActions.map((action) => (
          <a
            key={action.id}
            href={action.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-pale dark:border-slate-800 text-navy dark:text-blue shadow-sm hover:shadow-md hover:border-navy/30 dark:hover:border-blue/30 hover:bg-navy/5 dark:hover:bg-slate-800 active:scale-95 transition-all duration-300"
          >
            <action.icon className="w-5 h-5" />
          </a>
        ))}
      </div>

      <div className="flex flex-col gap-4 mt-2">
        <h3 className="text-lg font-bold text-navy dark:text-slate-200 font-sans px-1">
          {isMe ? "اعلاناتي" : `إعلانات ${profileName}`}
        </h3>
        {isMe && (
          <div className="flex p-1 bg-gray-100/80 dark:bg-slate-800 rounded-xl relative transition-colors duration-300">
            <button
              onClick={() => handleTabChange("ads")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 font-sans ${activeSubTab === "ads" ? "bg-white dark:bg-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.05)] text-navy dark:text-slate-200" : "text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"}`}
            >
              اعلاناتي
            </button>
            <button
              onClick={() => handleTabChange("favorites")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 font-sans ${activeSubTab === "favorites" ? "bg-white dark:bg-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.05)] text-navy dark:text-slate-200" : "text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"}`}
            >
              مفضلتي
            </button>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 min-h-[200px]">
          {isLoading ? (
            <div className="col-span-2 py-10 flex justify-center">
              <SpinnerIcon className="w-8 h-8 text-navy dark:text-blue animate-spin" />
            </div>
          ) : (
            displayList.map((item, idx) => (
              <ListingCard
                key={`${item.id}-${idx}`}
                listing={item}
                onClick={() => onListingClick && onListingClick(item)}
                isOwner={isMe && activeSubTab === "ads"}
                onDelete={() => deleteAdMutation.mutate(item.id)}
                onToggleStatus={() => toggleStatusMutation.mutate(item.id)}
                isDeleting={
                  deleteAdMutation.isPending &&
                  deleteAdMutation.variables === item.id
                }
                isToggling={
                  toggleStatusMutation.isPending &&
                  toggleStatusMutation.variables === item.id
                }
              />
            ))
          )}
          {!isLoading && displayList.length === 0 && (
            <div className="col-span-2 py-10 text-center text-gray-400 dark:text-slate-600 text-sm font-medium">
              لا توجد إعلانات
            </div>
          )}
        </div>
      </div>

      {isMe && profile && (
        <UpdateProfileDialog
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          profileData={profile}
        />
      )}
    </div>
  );
};

export default ProfilePage;
