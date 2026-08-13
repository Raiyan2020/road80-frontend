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
  CloseIcon,
  ShareIcon,
  ChevronRightIcon,
} from "./Icons";
import { useIsHotel } from "@/features/account/hooks/useHotelProfile";
import type { TranslationKey } from "@/i18n";
import { Listing } from "../types";
import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  useUserAds,
  useUserFavorites,
  useProfile,
  useDeleteAd,
  useUpdateAd,
} from "../features/account/hooks/useProfile";
import { useStartCompanyConversation } from "@/features/chat/hooks/useChat";
import { UpdateProfileDialog } from "./UpdateProfileDialog";
import { SocialLinksDialog } from "./SocialLinksDialog";
import { SocialLinksRow } from "./SocialLinksRow";
import type { UserSocials } from "@/shared/services/social-platforms.service";
import { useOffice } from "../features/companies/hooks/useOffices";
import { useOfficeAds } from "../features/companies/hooks/useOfficeAds";
import { listingHasVideo } from "../features/explore/services/explore.service";
import { AppImage } from "./AppImage";
import { resolveListingImageUrl } from "@/shared/utils/listing-image";
import { PlayIcon } from "./Icons";
import { APP_LOGO_URL } from "@/shared/constants/images";
import { useTranslation } from "../i18n";
import { buildShareUrl, shareContent } from "@/shared/utils/share";
import { toast } from "sonner";

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

const ListingCard: React.FC<{
  listing: Listing;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}> = ({
  listing,
  onClick,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const hasVideo = listingHasVideo(listing);

  return (
    <div
      onClick={onClick}
      className={`flex flex-col h-full min-h-[290px] bg-white dark:bg-slate-900 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-pale/50 dark:border-slate-800 overflow-hidden active:scale-98 transition-all duration-300 cursor-pointer ${listing.status === 0 ? "opacity-60" : ""}`}
    >
      <div className="relative w-full aspect-[4/3] bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
        <AppImage
          src={resolveListingImageUrl(listing)}
          alt={listing.title}
          className="w-full h-full"
        />
        <span className="absolute top-2 left-2 bg-navy/80 dark:bg-blue/80 text-white text-[13px] px-2 py-0.5 rounded-full z-10 font-bold">
          {t("profile.page.newBadge")}
        </span>

        {hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="w-10 h-10 rounded-full bg-black/35 backdrop-blur-md flex items-center justify-center border border-white/30">
              <PlayIcon className="w-5 h-5 text-white ml-0.5" />
            </div>
          </div>
        )}

      </div>
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <span className="text-blue dark:text-blue/80 font-bold text-sm rtl:text-right ltr:text-left font-sans leading-tight min-h-[1.25rem]">
          {listing.price}
        </span>
        <h4 className="text-navy dark:text-slate-200 font-semibold text-xs rtl:text-right ltr:text-left font-sans leading-[1.4] line-clamp-2 min-h-[2.2rem]">
          {listing.title}
        </h4>
        <div className="flex items-center rtl:justify-end ltr:justify-start gap-1 opacity-60 min-h-[1.25rem]">
          <span className="text-[13px] text-navy dark:text-slate-400 font-medium font-sans truncate max-w-full">
            {listing.area}
          </span>
          <div className="w-1 h-1 rounded-full bg-navy dark:bg-slate-500"></div>
        </div>
        {(onEdit || onDelete) && (
          <div className="mt-auto flex gap-2 pt-2">
            {onEdit && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit();
                }}
                className="flex-1 rounded-lg bg-pale/60 px-2 py-2 text-xs font-bold text-navy dark:bg-slate-800 dark:text-slate-100"
              >
                {t("profile.page.editAd")}
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete();
                }}
                className="flex-1 rounded-lg bg-red-50 px-2 py-2 text-xs font-bold text-red-600 dark:bg-red-950/30 dark:text-red-300"
              >
                {t("profile.page.deleteAd")}
              </button>
            )}
          </div>
        )}
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
  const { t, dir } = useTranslation();
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
  // Gates the hotel profile entry point (use case 1.2). Server truth, not the
  // persisted store — see useIsHotel.
  const { isHotel, isLoading: isAccountTypeLoading } = useIsHotel();

  const [activeSubTab, setActiveSubTab] = useState<"ads" | "favorites">(
    activeTabParam === "favorites" && isMe ? "favorites" : "ads",
  );
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isSocialLinksOpen, setIsSocialLinksOpen] = useState(false);
  const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Listing | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const deleteAd = useDeleteAd();
  const updateAd = useUpdateAd();
  const { startCompanyConversation, isStartingCompanyConversation } =
    useStartCompanyConversation();

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

  const { data: myAdsData = [], isLoading: myAdsLoading } = useUserAds({
    enabled: isMe && !isAccountTypeLoading && !isHotel,
  });
  const { data: myFavsData = [], isLoading: myFavsLoading } =
    useUserFavorites();
  const { profile, isLoading: profileLoading } = useProfile();
  console.log("profile", profile);

  const { data: officeData, isLoading: officeLoading } = useOffice(
    viewedUserId || "",
  );
  const { data: officeAdsData = [], isLoading: officeAdsLoading } =
    useOfficeAds(viewedUserId || "");
  const isLoading = isMe
    ? (!isHotel && myAdsLoading) || myFavsLoading || profileLoading || isAccountTypeLoading
    : officeLoading || officeAdsLoading;

  let profileName = t("profile.page.defaultUserName");
  let profileBio = "";
  let profileAvatar: string | null = APP_LOGO_URL;
  let isVerified = false;
  let stats = { ads: "0", likes: "0", views: "0" };
  let displayList: Listing[] = [];
  let socials: UserSocials = {};

  if (isMe) {
    const myAds = myAdsData;
    const myFavs = myFavsData;
    displayList = (isHotel ? myFavs : activeSubTab === "ads" ? myAds : myFavs) as Listing[];
    stats = {
      ads: myAds.length.toString(),
      likes: myFavs.length.toString() || "0",
      views: profile?.total_ads_watch?.toString() || "0",
    };
    profileName = profile?.name || profile?.country_code || t("profile.page.defaultUserName");
    profileBio = profile?.caption || "";
    profileAvatar = profile?.image || APP_LOGO_URL;
    isVerified = false;
    socials = profile?.socials || {};
  } else {
    if (officeData) {
      profileName = officeData.officeName || t("profile.page.defaultCompanyName");
      profileAvatar = officeData.logo || APP_LOGO_URL;
      profileBio = officeData.bio || "";
      isVerified = false;
      stats = {
        ads: officeData.activeListingsCount?.toString() || "0",
        likes: officeData.totalLikes?.toString() || "0",
        views: officeData.totalViews?.toString() || "0",
      };
      displayList = officeAdsData as Listing[];
      socials = (officeData.socials || {}) as UserSocials;
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

  const openAvatarPreview = () => {
    setIsAvatarPreviewOpen(true);
  };

  // A shareable profile link needs a concrete user id — "current_user" only
  // resolves for the signed-in viewer, so hide the button until we have one.
  const shareableUserId = isMe ? profile?.id?.toString() : viewedUserId;

  const handleShare = () => {
    if (!shareableUserId) return;
    shareContent({
      title: profileName,
      text: profileBio || profileName,
      url: buildShareUrl(`/profile?user=${shareableUserId}`),
    });
  };

  const openEditAd = (listing: Listing) => {
    setEditingAd(listing);
    setEditTitle(listing.title);
    setEditDescription(listing.description ?? "");
    setEditPrice(listing.price.replace(/[^\d.]/g, ""));
  };

  const handleDeleteAd = async (listing: Listing) => {
    if (!window.confirm(t("profile.page.deleteAdConfirm"))) return;

    try {
      await deleteAd.mutateAsync(listing.id);
      toast.success(t("profile.page.deleteAdSuccess"));
    } catch {
      toast.error(t("profile.page.deleteAdError"));
    }
  };

  const handleUpdateAd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingAd) return;

    const numericPrice = Number(editPrice);
    if (
      !editTitle.trim() ||
      editDescription.trim().length < 5 ||
      editDescription.trim().length > 400 ||
      !Number.isFinite(numericPrice) ||
      numericPrice < 0 ||
      numericPrice > 99_999_999_999.99
    ) {
      toast.error(t("profile.page.updateAdError"));
      return;
    }

    try {
      await updateAd.mutateAsync({
        id: editingAd.id,
        title: editTitle.trim(),
        description: editDescription.trim(),
        price: numericPrice,
      });
      setEditingAd(null);
      toast.success(t("profile.page.updateAdSuccess"));
    } catch {
      toast.error(t("profile.page.updateAdError"));
    }
  };

  const handleStartCompanyChat = async () => {
    if (!viewedUserId) return;

    try {
      const response = await startCompanyConversation(viewedUserId);
      const conversationId = (response as any)?.data?.id;
      if (conversationId) {
        navigate({
          to: "/conversations/$id",
          params: { id: String(conversationId) },
        });
      }
    } catch (error: any) {
      toast.error(error?.data?.message || t("hotels.chat.startError"));
    }
  };

  // A company that is hidden, suspended, or not yet accepted now 404s
  // (`visibleCompanies()` scope). Without this the shell rendered with a
  // placeholder name and zeroed stats, which reads as a real but empty profile.
  if (!isMe && !officeLoading && !officeData) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-10 text-center animate-fade-in">
        <p className="text-lg font-black text-navy dark:text-slate-100">
          {t("profile.page.unavailable.title")}
        </p>
        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
          {t("profile.page.unavailable.hint")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 gap-6 animate-fade-in transition-colors duration-300">
      <div className="flex items-center gap-4">
        <div className="relative z-20 w-20 h-20 shrink-0">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-pale to-white dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-navy dark:text-slate-200 border-2 border-white dark:border-slate-800 shadow-md overflow-hidden">
            <AppImage
              src={profileAvatar}
              alt={profileName}
              className="pointer-events-none !w-full !h-full !object-cover !p-0"
              coverClassName="!object-cover !p-0"
              containOnFallback={false}
              fallback={APP_LOGO_URL}
            />
          </div>
          <button
            type="button"
            onClick={openAvatarPreview}
            onPointerDown={openAvatarPreview}
            onTouchStart={openAvatarPreview}
            className="absolute inset-0 z-30 rounded-full cursor-pointer touch-manipulation bg-transparent active:scale-95 transition-transform"
            aria-label={t("profile.editDialog.avatarAlt")}
          />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h2 className="text-xl font-bold text-navy dark:text-slate-200 font-sans line-clamp-1">
              {profileName}
            </h2>
            {isVerified && (
              <VerifiedIcon className="w-5 h-5 text-blue shrink-0" />
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 leading-snug font-sans font-normal whitespace-pre-line">
            {profileBio}
          </p>
        </div>

        {/* Pinned so they stay reachable no matter how many social links exist */}
        <div className="flex items-center gap-2 shrink-0">
          {isMe && (
            <>
              <button
                onClick={() => setIsSocialLinksOpen(true)}
                title={t("profile.page.socialLinksTitle")}
                aria-label={t("profile.page.socialLinksAria")}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-navy dark:text-slate-300 active:scale-90 transition-all"
              >
                <LinkIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsEditProfileOpen(true)}
                title={t("profile.page.editProfileTitle")}
                aria-label={t("profile.page.editProfileAria")}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-navy dark:text-slate-300 active:scale-90 transition-all"
              >
                <EditIcon className="w-4 h-4" />
              </button>
            </>
          )}
          {shareableUserId && (
            <button
              onClick={handleShare}
              title={t("common.share")}
              aria-label={t("common.share")}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-navy dark:text-slate-300 active:scale-95 transition-transform"
            >
              <ShareIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <SocialLinksRow socials={socials} className="-mt-2 flex-wrap" />

      {!isMe && officeData && (officeData.phone || officeData.whatsapp) && (
        <div className="flex gap-3">
          {officeData.whatsapp && (
            <a
              href={`https://wa.me/${officeData.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-2xl border border-navy/20 bg-white px-4 py-3 text-center text-sm font-bold text-navy dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {t("profile.page.sendWhatsapp")}
            </a>
          )}
          {officeData.phone && (
            <a
              href={`tel:${officeData.phone}`}
              className="flex-1 rounded-2xl bg-navy px-4 py-3 text-center text-sm font-bold text-white dark:bg-blue"
            >
              {t("profile.page.call")}
            </a>
          )}
        </div>
      )}

      {!isMe && officeData?.website && (
        <a
          href={officeData.website}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full rounded-2xl border border-pale bg-white px-4 py-3 text-center text-sm font-bold text-navy dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        >
          {t("profile.hotel.websiteLabel")}
        </a>
      )}

      {!isMe && profile?.type === "user" && (
        <button
          type="button"
          onClick={handleStartCompanyChat}
          disabled={isStartingCompanyConversation}
          className="w-full rounded-2xl bg-blue px-4 py-3.5 text-sm font-bold text-white shadow-sm disabled:opacity-60"
        >
          {t("profile.page.startChat")}
        </button>
      )}

      {/* Hotel feature entry points. Browsing and messaging are open to every
          signed-in account; the two management screens are hotel-only. */}
      {isMe && (
        <div className="flex flex-col gap-2">
          {[
            { to: "/hotels", label: "hotels.title", show: true },
            { to: "/conversations", label: "hotels.chat.title", show: true },
            { to: "/profile/hotel", label: "profile.hotel.manageCta", show: isHotel },
            {
              to: "/profile/hotel-contents",
              label: "hotels.content.manageCta",
              show: isHotel,
            },
          ]
            .filter((item) => item.show)
            .map((item) => (
              <button
                key={item.to}
                type="button"
                onClick={() => navigate({ to: item.to as "/hotels" })}
                className="flex w-full items-center justify-between rounded-2xl border border-pale bg-white px-4 py-4 text-start shadow-sm transition-all active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="text-sm font-bold text-navy dark:text-slate-100">
                  {t(item.label as TranslationKey)}
                </span>
                <ChevronRightIcon className="h-5 w-5 text-gray-400 rtl:rotate-180 ltr:rotate-0" />
              </button>
            ))}
        </div>
      )}

      {!isHotel && <div className="flex justify-between items-center px-4 py-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-pale dark:border-slate-800 transition-colors duration-300">
        <StatItem label={t("profile.page.statAds")} value={stats.ads} />
        <div className="w-px h-8 bg-gray-100 dark:bg-slate-800"></div>
        <StatItem label={t("profile.page.statLikes")} value={stats.likes} />
        <div className="w-px h-8 bg-gray-100 dark:bg-slate-800"></div>
        <StatItem label={t("profile.page.statViews")} value={stats.views} />
      </div>}

      {/* <div className="flex gap-3">
        <a
          href="https://wa.me/96598812020"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-navy/20 dark:border-slate-700 bg-white dark:bg-slate-900 text-navy dark:text-slate-200 font-semibold text-sm transition-all active:scale-98"
        >
          <WhatsappIcon className="w-6 h-6" />
          <span>{t("profile.page.sendWhatsapp")}</span>
        </a>
        <a
          href="tel:+96598812020"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-navy dark:bg-blue text-white font-semibold text-sm shadow-lg shadow-navy/20 dark:shadow-blue/20 transition-all active:scale-98"
        >
          <PhoneIcon className="w-5 h-5" />
          <span>{t("profile.page.call")}</span>
        </a>
      </div> */}

      {/* Social and Action Icons Row */}
      {/* <div className="flex justify-center gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar py-2 mt-1 mb-2">
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
      </div> */}

      <div className="flex flex-col gap-4 mt-2">
        <h3 className="text-lg font-bold text-navy dark:text-slate-200 font-sans px-1">
          {isMe && isHotel
            ? t("profile.page.tabFavorites")
            : isMe
            ? t("profile.page.myAdsHeading")
            : t("profile.page.userAdsHeading", { name: profileName })}
        </h3>
        {isMe && !isHotel && (
          <div className="flex p-1 bg-gray-100/80 dark:bg-slate-800 rounded-xl relative transition-colors duration-300">
            <button
              onClick={() => handleTabChange("ads")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 font-sans ${activeSubTab === "ads" ? "bg-white dark:bg-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.05)] text-navy dark:text-slate-200" : "text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"}`}
            >
              {t("profile.page.tabMyAds")}
            </button>
            <button
              onClick={() => handleTabChange("favorites")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 font-sans ${activeSubTab === "favorites" ? "bg-white dark:bg-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.05)] text-navy dark:text-slate-200" : "text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"}`}
            >
              {t("profile.page.tabFavorites")}
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
                onEdit={isMe && !isHotel && activeSubTab === "ads" ? () => openEditAd(item) : undefined}
                onDelete={isMe && !isHotel && activeSubTab === "ads" ? () => handleDeleteAd(item) : undefined}
              />
            ))
          )}
          {!isLoading && displayList.length === 0 && (
            <div className="col-span-2 py-10 text-center text-gray-400 dark:text-slate-600 text-sm font-medium">
              {t(isMe && isHotel ? "profile.page.emptyFavorites" : "profile.page.emptyAds")}
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

      {isMe && (
        <SocialLinksDialog
          isOpen={isSocialLinksOpen}
          onClose={() => setIsSocialLinksOpen(false)}
          socials={socials}
        />
      )}

      {isAvatarPreviewOpen && (
        <div className="fixed inset-0 z-[260] flex items-center justify-center p-6" dir="rtl">
          <button
            type="button"
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setIsAvatarPreviewOpen(false)}
            aria-label={t("profile.editDialog.avatarAlt")}
          />
          <div className="relative w-full max-w-sm rounded-[28px] bg-white dark:bg-slate-900 p-5 shadow-2xl animate-fade-in">
            <button
              type="button"
              onClick={() => setIsAvatarPreviewOpen(false)}
              className="absolute left-4 top-4 z-10 w-9 h-9 rounded-full bg-white/90 dark:bg-slate-800/90 text-navy dark:text-slate-200 flex items-center justify-center shadow-md active:scale-95 transition-transform"
              aria-label={t("common.close")}
            >
              <CloseIcon className="w-5 h-5" />
            </button>
            <div className="aspect-square w-full overflow-hidden rounded-[24px] bg-slate-100 dark:bg-slate-800">
              <AppImage
                src={profileAvatar}
                alt={profileName}
                className="!w-full !h-full !object-cover !p-0"
                coverClassName="!object-cover !p-0"
                containOnFallback={false}
                fallback={APP_LOGO_URL}
              />
            </div>
            <div className="mt-4 text-center text-navy dark:text-slate-200 text-lg font-bold font-sans truncate">
              {profileName}
            </div>
          </div>
        </div>
      )}

      {editingAd && (
        <div className="fixed inset-0 z-[270] flex items-center justify-center p-4" dir={dir}>
          <button
            type="button"
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={() => setEditingAd(null)}
            aria-label={t("common.close")}
          />
          <form
            onSubmit={handleUpdateAd}
            className="relative z-10 flex w-full max-w-md flex-col gap-4 rounded-[28px] bg-white p-5 shadow-2xl dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-navy dark:text-slate-100">
                {t("profile.page.editAdTitle")}
              </h2>
              <button
                type="button"
                onClick={() => setEditingAd(null)}
                className="rounded-full p-2 text-gray-500"
                aria-label={t("common.close")}
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <label className="flex flex-col gap-1 text-sm font-bold text-navy dark:text-slate-200">
              {t("profile.page.adTitleLabel")}
              <input
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                maxLength={255}
                required
                className="h-12 rounded-xl border border-pale bg-white px-3 outline-none focus:border-blue dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-bold text-navy dark:text-slate-200">
              {t("profile.page.adDescriptionLabel")}
              <textarea
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                minLength={5}
                maxLength={400}
                required
                rows={5}
                className="rounded-xl border border-pale bg-white p-3 outline-none focus:border-blue dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-bold text-navy dark:text-slate-200">
              {t("profile.page.adPriceLabel")}
              <input
                type="number"
                min="0"
                max="99999999999.99"
                step="0.01"
                value={editPrice}
                onChange={(event) => setEditPrice(event.target.value)}
                required
                className="h-12 rounded-xl border border-pale bg-white px-3 outline-none focus:border-blue dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
            <button
              type="submit"
              disabled={updateAd.isPending}
              className="h-12 rounded-xl bg-blue font-bold text-white disabled:opacity-60"
            >
              {t("profile.saveChanges")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
