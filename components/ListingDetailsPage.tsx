import { useNavigate } from "@tanstack/react-router";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useFavoriteToggle } from "../features/favorites/hooks/useFavoriteToggle";
import { useCallAd } from "../features/listing-detail/hooks/useCallAd";
import { useListing } from "../features/listing-detail/hooks/useListing";
import { paymentService } from "../shared/services/payment.service";
import { useFavoritesStore } from "../stores/favorites.store";
import {
  AppleIcon,
  BuildingIcon,
  ChevronRightIcon,
  HeartIcon,
  LockIcon,
  PhoneIcon,
  PlayIcon,
  ShareIcon,
  SpinnerIcon,
  UserIcon,
  WhatsappIcon,
} from "./Icons";
import MyFatoorahPayment, { type MyFatoorahResult } from "./MyFatoorahPayment";
import { FALLBACK_LISTING_IMAGE } from "@/shared/constants/images";
import { resolveMediaUrl } from "@/shared/utils/media-url";
import { buildShareUrl, shareContent } from "@/shared/utils/share";
import { AppImage } from "./AppImage";
import { useTranslation } from "../i18n";

interface ListingDetailsPageProps {
  listingId: number;
  onBack: () => void;
}

const KNET_LOGO =
  "https://media.licdn.com/dms/image/v2/D4D0BAQFazp_I3lLeQg/company-logo_200_200/company-logo_200_200/0/1715599858189/the_shared_electronic_banking_services_co_knet_logo?e=2147483647&v=beta&t=FfjCLbNIUGrTCTi-tI5nXSNP9B4AcOJbWsFqV0bSWcM";

interface MediaItem {
  type: "image" | "video";
  src: string | File | Blob;
  id: string;
}

type PaymentStatus =
  | "IDLE"
  | "STARTING"
  | "VERIFYING"
  | "CONFIRMING"
  | "SUCCESS";

const ListingDetailsPage: React.FC<ListingDetailsPageProps> = ({
  listingId,
  onBack,
}) => {
  const navigate = useNavigate();
  const { t, isRTL } = useTranslation();
  const {
    data: listingData,
    isLoading: loading,
    refetch: refetchListing,
  } = useListing(Number(listingId));
  const listing = listingData || null;

  // Ad Data

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isMediaFullscreen, setIsMediaFullscreen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showUnlockPopup, setShowUnlockPopup] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("IDLE");
  const [mfSessionId, setMfSessionId] = useState<string | null>(null);
  const [mfCountry, setMfCountry] = useState<string>("KWT");
  const [mfTransactionId, setMfTransactionId] = useState<number | null>(null);
  const [mfEncryptionKey, setMfEncryptionKey] = useState<string | null>(null);
  const [pendingContactType, setPendingContactType] = useState<
    "WHATSAPP" | "CALL" | null
  >(null);
  const [unlockedContact, setUnlockedContact] = useState<{
    phone?: string;
    whatsapp?: string | null;
  } | null>(null);
  const normalizedListingId = Number(listingId);
  const isFavorite = useFavoritesStore((state) =>
    state.ids.includes(normalizedListingId),
  );
  const mergeFavoriteIds = useFavoritesStore((state) => state.mergeIds);
  const { mutate: toggleFavoriteMutation } = useFavoriteToggle();
  const callMutation = useCallAd();

  const toggleFavorite = () => {
    toggleFavoriteMutation(listingId);
  };

  const handleShare = () => {
    const title = listing?.title || t("listing.defaultTitle");
    shareContent({
      title,
      text: listing?.price ? `${title} - ${listing.price}` : title,
      url: buildShareUrl(`/ad/${listingId}`),
    });
  };

  useEffect(() => {
    if (listing) {
      const serverLiked = Boolean(
        (listing as { is_liked?: boolean; isLiked?: boolean }).is_liked ??
          (listing as { is_liked?: boolean; isLiked?: boolean }).isLiked,
      );
      if (serverLiked) {
        mergeFavoriteIds([Number(listing.id)]);
      }

      const userStr = localStorage.getItem("road80_user");
      const user = userStr ? JSON.parse(userStr) : {};
      const userId = user.phone || "guest";
      const unlockKey = `unlock_contact_${userId}_${listing.id}`;
      const isOwner = listing.publisherId === "current_user";
      const isStoredUnlocked = localStorage.getItem(unlockKey) === "true";
      if (isStoredUnlocked) {
        setIsUnlocked(true);
        const savedContact = localStorage.getItem(
          `unlock_contact_phone_${userId}_${listing.id}`,
        );
        if (savedContact) {
          try {
            setUnlockedContact(JSON.parse(savedContact));
          } catch (e) {}
        }
      } else {
        setIsUnlocked(isOwner);
      }
    } else if (!loading) {
      setTimeout(onBack, 100);
    }
  }, [listing, loading, onBack, mergeFavoriteIds]);

  useEffect(() => {
    if (!isMediaFullscreen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        fullscreenVideoRef.current?.pause();
        setIsMediaFullscreen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMediaFullscreen]);

  if (loading || !listing) {
    return (
      <div className="absolute inset-0 bg-bg dark:bg-slate-950 z-50 flex items-center justify-center transition-colors duration-300">
        <SpinnerIcon className="w-8 h-8 text-navy dark:text-blue animate-spin" />
      </div>
    );
  }

  const mediaItems: MediaItem[] = [];

  // Use attachments from API response
  const attachments = (listing as any).attachments || [];
  if (attachments.length > 0) {
    attachments.forEach((att: any, idx: number) => {
      const isVideo =
        att.file.toLowerCase().endsWith(".mp4") ||
        att.file.toLowerCase().endsWith(".mov");
      mediaItems.push({
        type: isVideo ? "video" : "image",
        src: resolveMediaUrl(att.file),
        id: `att-${idx}`,
      });
    });
  } else {
    const rawListing = listing as {
      images?: Array<string | File | Blob>;
      imageUrl?: string;
      image?: { file?: string; type?: string };
      video?: string;
    };

    const primaryImage =
      rawListing.images?.length
        ? rawListing.images
        : rawListing.imageUrl
          ? [rawListing.imageUrl]
          : rawListing.image?.file
            ? [resolveMediaUrl(rawListing.image.file)]
            : [FALLBACK_LISTING_IMAGE];

    primaryImage.forEach((img, idx) => {
      mediaItems.push({ type: "image", src: img, id: `img-${idx}` });
    });

    const videoSrc =
      rawListing.video ||
      (rawListing.image?.type === "video"
        ? resolveMediaUrl(rawListing.image.file)
        : undefined);

    if (videoSrc) {
      mediaItems.push({ type: "video", src: videoSrc, id: "vid-main" });
    }
  }

  // Ensure we have at least one image if no media items
  if (mediaItems.length === 0) {
    mediaItems.push({ type: "image", src: FALLBACK_LISTING_IMAGE, id: "fallback" });
  }

  const getSrc = (src: string | File | Blob) => {
    if (src instanceof File || src instanceof Blob) {
      return URL.createObjectURL(src);
    }
    return resolveMediaUrl(src) || src;
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const width = e.currentTarget.offsetWidth;
    const scrollLeft = Math.abs(e.currentTarget.scrollLeft);
    const index = Math.round(scrollLeft / width);
    setActiveImageIndex(index);
    if (thumbsRef.current) {
      const thumb = thumbsRef.current.children[index] as HTMLElement;
      if (thumb) {
        thumb.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  };

  const scrollToMedia = (index: number) => {
    setActiveImageIndex(index);
    if (scrollRef.current) {
      const child = scrollRef.current.children[index] as HTMLElement;
      if (child) {
        child.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  };

  const openMediaFullscreen = () => {
    setIsMediaFullscreen(true);
  };

  const closeMediaFullscreen = () => {
    fullscreenVideoRef.current?.pause();
    setIsMediaFullscreen(false);
  };

  const showPrevMedia = () => {
    if (mediaItems.length <= 1) return;
    const nextIndex =
      (activeImageIndex - 1 + mediaItems.length) % mediaItems.length;
    scrollToMedia(nextIndex);
  };

  const showNextMedia = () => {
    if (mediaItems.length <= 1) return;
    const nextIndex = (activeImageIndex + 1) % mediaItems.length;
    scrollToMedia(nextIndex);
  };

  const activeMedia = mediaItems[activeImageIndex];
  const isActiveVideo = activeMedia?.type === "video";

  const handlePublisherClick = () => {
    // Prefer raw API user.id, fall back to mapped publisherId
    const rawId = (listing as any).user?.id ?? listing.publisherId;
    if (!rawId) return;
    // Strip any surrounding quotes from serialization bugs
    const cleanId = String(rawId).replace(/^\"|\"$/g, "");
    navigate({ to: "/profile", search: { user: cleanId } as any });
  };

  const handleUnlockPayment = () => {
    if (paymentStatus !== "IDLE") return;
    setPaymentStatus("STARTING");

    callMutation.mutate(listing.id, {
      onSuccess: (response) => {
        const paymentUrl = (response.data as any)?.payment_url;
        if (paymentUrl) {
          window.location.assign(paymentUrl);
          return;
        }

        if (response.data?.session_id) {
          const sessionId = response.data.session_id;
          const transactionId = response.data.transaction_id;
          const country = sessionId.split("-")[0] || "KWT";
          setMfSessionId(sessionId);
          setMfCountry(country);
          setMfTransactionId(transactionId ?? null);
          setMfEncryptionKey(response.data.encryption_key ?? null);
          setPaymentStatus("IDLE");
        } else {
          // No `payment_url` fallback any more — the redirect flow it belonged to
          // was removed backend-side, so a response without a session is a failure.
          setPaymentStatus("IDLE");
          toast.error(t("listing.payment.sessionCreateFailed"));
        }
      },
      onError: (err) => {
        setPaymentStatus("IDLE");
        toast.error(t("listing.payment.sessionCreateFailed"));
      },
    });
  };

  /** Verify the encrypted v3 callback result (with PaymentId as fallback). */
  const onEmbeddedPaymentSuccess = async (result: MyFatoorahResult) => {
    if (!mfTransactionId) {
      toast.error(t("listing.payment.cannotVerify"));
      return;
    }

    setPaymentStatus("VERIFYING");

    try {
      const verifyRes = await paymentService.verifyPayment({
        transaction_id: mfTransactionId,
        payment_data: result.paymentData,
        payment_id: result.paymentId,
      });

      if (verifyRes.status) {
        setPaymentStatus("SUCCESS");
        setIsUnlocked(true);
        const user = JSON.parse(localStorage.getItem("road80_user") || "{}");
        const userId = user.phone || "guest";
        localStorage.setItem(`unlock_contact_${userId}_${listing.id}`, "true");

        // `/payments/verify` builds contact_info server-side but responds with a
        // literal [], so the refetched ad is the only reliable source today. The
        // response is still checked first so this improves automatically if the
        // backend starts returning it.
        const fromVerify = !Array.isArray(verifyRes.data)
          ? verifyRes.data?.contact_info
          : null;

        const fresh = await refetchListing();
        const freshListing = (fresh as any)?.data;

        const contactData = fromVerify ?? {
          phone: freshListing?.owner_phone ?? null,
          whatsapp: freshListing?.owner_whatsapp ?? null,
          phone_code: freshListing?.country?.phone_code ?? null,
        };

        if (contactData && contactData.phone) {
          setUnlockedContact(contactData);
          localStorage.setItem(
            `unlock_contact_phone_${userId}_${listing.id}`,
            JSON.stringify(contactData),
          );
        }

        // If user originally wanted to contact via whatsapp/call, do it now
        if (pendingContactType && contactData?.phone) {
          const phone = contactData.phone.replace(/\D/g, "");
          if (pendingContactType === "WHATSAPP")
            window.open(`https://wa.me/${phone}`, "_blank");
          else window.location.href = `tel:${phone}`;
        }
        // Close it immediately and show toast with copy action
        setTimeout(() => {
          setShowUnlockPopup(false);
          setMfSessionId(null);
          setMfTransactionId(null);
          setPendingContactType(null);
          setPaymentStatus("IDLE");

          if (contactData && contactData.phone) {
            const fullPhone = `${contactData.phone_code || ""}${contactData.phone}`;
            toast.success(t("listing.payment.success"), {
              description: t("listing.contact.numberLabel", { phone: fullPhone }),
              duration: 10000,
              closeButton: true,
              action: {
                label: t("listing.contact.copyNumber"),
                onClick: () => {
                  navigator.clipboard.writeText(fullPhone);
                  toast.success(t("common.copiedToClipboard"), { closeButton: true });
                },
              },
            });
          } else {
            toast.success(t("listing.payment.successUnlocked"), { closeButton: true });
          }
        }, 500);
      } else {
        setPaymentStatus("IDLE");
        toast.error(verifyRes.message || t("listing.payment.verifyFailed"));
      }
    } catch (err) {
      setPaymentStatus("IDLE");
      toast.error(t("listing.payment.verifyError"));
    }
  };

  const handleContactAction = (type: "WHATSAPP" | "CALL") => {
    if (paymentStatus !== "IDLE") return;

    const isPaid = (listing as any).is_paid === 1;
    const phone = (listing as any).owner_phone || (unlockedContact as any)?.phone;
    const whatsapp = (listing as any).owner_whatsapp || (unlockedContact as any)?.whatsapp;

    if (isPaid || isUnlocked) {
      if (phone || whatsapp) {
        const contactInfo: string[] = [];
        if (phone) contactInfo.push(t("listing.contact.phoneLabel", { phone }));
        if (whatsapp)
          contactInfo.push(t("listing.contact.whatsappLabel", { whatsapp }));

        toast.success(t("listing.contact.available"), {
          description: contactInfo.join(" | "),
          duration: 10000,
          closeButton: true,
          action: {
            label: t("listing.contact.copyNumber"),
            onClick: () => {
              const toCopy = phone || whatsapp;
              if (toCopy) {
                navigator.clipboard.writeText(toCopy);
                toast.success(t("listing.contact.numberCopied"), { closeButton: true });
              }
            },
          },
        });
        return;
      }
    }

    setPendingContactType(type);
    setPaymentStatus("STARTING");

    callMutation.mutate(listing.id, {
      onSuccess: (response) => {
        const paymentUrl = (response.data as any)?.payment_url;
        if (paymentUrl) {
          window.location.assign(paymentUrl);
          return;
        }

        // `/payments/call` always opens a fresh session — it never returns a
        // number directly and never short-circuits for an already-paid ad, so
        // the old `phone` and `payment_url` branches here were unreachable.
        if (response.data?.session_id) {
          const sessionId = response.data.session_id;
          const transactionId = response.data.transaction_id;
          const country = sessionId.split("-")[0] || "KWT";

          setMfSessionId(sessionId);
          setMfCountry(country);
          setMfTransactionId(transactionId ?? null);
          setMfEncryptionKey(response.data.encryption_key ?? null);
          setPaymentStatus("IDLE");
          setShowUnlockPopup(true);
        } else {
          setPaymentStatus("IDLE");
          setPendingContactType(null);
          toast.error(t("listing.payment.sessionCreateFailed"));
        }
      },
      onError: (err) => {
        setPaymentStatus("IDLE");
        setPendingContactType(null);
        toast.error(t("listing.contact.callError"));
      },
    });
  };

  const AttrBadge: React.FC<{
    label: string | null | undefined;
    value: string | number | null | undefined;
  }> = ({ label, value }) => {
    // Both are nullable now that the backend serializes soft-deleted categories
    // as null rather than throwing — a badge with a blank label is just noise.
    if (!value || !label) return null;
    return (
      <div className="bg-white dark:bg-slate-900 border border-pale dark:border-slate-800 rounded-xl p-3 flex flex-col gap-1 items-start shadow-sm transition-colors duration-300">
        <span className="text-[13px] text-gray-400 font-medium">{label}</span>
        <span className="text-sm font-semibold text-navy dark:text-slate-200">
          {value}
        </span>
      </div>
    );
  };

  const getPaymentText = () => {
    switch (paymentStatus) {
      case "STARTING":
        return t("listing.payment.starting");
      case "VERIFYING":
        return t("listing.payment.verifying");
      case "CONFIRMING":
        return t("listing.payment.confirming");
      case "SUCCESS":
        return t("listing.payment.succeeded");
      default:
        return t("listing.unlock.title");
    }
  };

  const isStartingContact = paymentStatus === "STARTING" && pendingContactType !== null;
  const isWhatsappStarting = isStartingContact && pendingContactType === "WHATSAPP";
  const isCallStarting = isStartingContact && pendingContactType === "CALL";

  return (
    <div
      className="absolute inset-0 bg-bg dark:bg-slate-950 z-50 flex flex-col h-full overflow-hidden animate-fade-in transition-colors duration-300"
      style={{ overscrollBehavior: "none" }}
    >
      {/* Header */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4"
        style={{
          height: isActiveVideo
            ? "calc(var(--header-h) + env(safe-area-inset-top) + 56px)"
            : "calc(var(--header-h) + env(safe-area-inset-top))",
          paddingTop: isActiveVideo
            ? "calc(env(safe-area-inset-top) + 56px)"
            : "env(safe-area-inset-top)",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)",
        }}
      >
        <button
          onClick={onBack}
          className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-95 transition-all"
        >
          <ChevronRightIcon className="w-6 h-6 rotate-180 rtl:rotate-0" />
        </button>
        <div className="flex gap-3">
          <button
            onClick={handleShare}
            aria-label={t("listing.shareAd")}
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-95 transition-all"
          >
            <ShareIcon className="w-5 h-5" />
          </button>
          <button
            onClick={toggleFavorite}
            aria-label={t(isFavorite ? "listing.removeFromFavorites" : "listing.addToFavorites")}
            className={`w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transition-all active:scale-95 ${isFavorite ? "text-red-500" : "text-red-300"}`}
          >
            <HeartIcon className="w-6 h-6" filled={isFavorite} />
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto overflow-x-hidden pb-24 no-scrollbar bg-bg dark:bg-slate-950 transition-colors duration-300"
        style={{ overscrollBehaviorY: "contain" }}
      >
        <div className="relative bg-white dark:bg-slate-900 shadow-sm transition-colors duration-300">
          {/* Main Carousel - Responsive frame that preserves natural media proportions */}
          <div className="relative w-full min-h-[280px] max-h-[72vh] bg-gray-200 dark:bg-slate-800 overflow-hidden group">
            <div
              ref={scrollRef}
              className="absolute inset-0 w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
              onScroll={handleScroll}
              style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", touchAction: "pan-x" }}
            >
              {mediaItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="relative w-full h-full flex-shrink-0 snap-center bg-black flex items-center justify-center overflow-hidden"
                >
                  {item.type === "video" ? (
                    <video
                      src={getSrc(item.src)}
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                      poster={FALLBACK_LISTING_IMAGE}
                    />
                  ) : (
                    <AppImage
                      src={getSrc(item.src)}
                      className="w-full h-full object-contain"
                      coverClassName="object-contain"
                      alt={t("listing.gallery.slideAlt", { index: idx + 1 })}
                    />
                  )}
                </div>
              ))}
            </div>
            {/* Count Badge */}
            <div className={`absolute ${isRTL ? "right-4" : "left-4"} bg-black/60 backdrop-blur-md text-white text-[13px] font-bold px-2.5 py-1 rounded-full border border-white/10 z-10 pointer-events-none ${isActiveVideo ? "bottom-16" : "bottom-4"}`}>
              {activeImageIndex + 1} / {mediaItems.length}
            </div>
            <button
              type="button"
              onClick={openMediaFullscreen}
              className={`absolute ${isRTL ? "left-4" : "right-4"} z-10 w-10 h-10 bg-black/60 backdrop-blur-md text-white rounded-full border border-white/10 flex items-center justify-center active:scale-95 transition-all ${isActiveVideo ? "bottom-16" : "bottom-4"}`}
              aria-label={t("listing.gallery.fullscreen")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                <path d="M16 3h3a2 2 0 0 1 2 2v3" />
                <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
                <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
              </svg>
            </button>
          </div>

          {/* Thumbnails */}
          {mediaItems.length > 1 && (
            <div
              ref={thumbsRef}
              className="flex gap-2 p-3 overflow-x-auto no-scrollbar border-b border-pale/50 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-300"
            >
              {mediaItems.map((item, idx) => (
                <button
                  key={`thumb-${item.id}`}
                  onClick={() => scrollToMedia(idx)}
                  className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${activeImageIndex === idx ? "border-navy dark:border-blue ring-1 ring-navy dark:ring-blue shadow-md opacity-100" : "border-transparent opacity-60 hover:opacity-100"}`}
                >
                  {item.type === "video" ? (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center relative">
                      <PlayIcon className="w-6 h-6 text-white z-10" />
                      <div className="absolute inset-0 bg-black/20"></div>
                    </div>
                  ) : (
                    <AppImage
                      src={getSrc(item.src)}
                      className="w-full h-full"
                      alt={t("listing.gallery.thumbAlt", { index: idx + 1 })}
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details Wrapper - Reduced top spacing */}
        <div className="flex flex-col gap-6 px-5 pt-3 pb-8">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-lg shadow-navy/5 dark:shadow-black/20 border border-pale dark:border-slate-800 transition-colors duration-300">
            <div className="flex justify-between items-start mb-2">
              <h1 className="text-xl font-bold text-navy dark:text-slate-200 leading-snug max-w-[70%]">
                {listing.title}
              </h1>
              <span className="text-blue dark:text-blue/80 font-bold text-lg">
                {listing.price}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400 text-sm mb-4">
              <BuildingIcon className="w-4 h-4" />
              <span className="font-medium">
                {t("listing.location", {
                  city: (listing as any).city_name || listing.area,
                  state: (listing as any).state_name || listing.governorate,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-800 transition-colors duration-300">
              <div
                className={`flex items-center gap-2 ${(listing as any).user?.id || listing.publisherId ? "cursor-pointer active:scale-95 transition-transform" : ""}`}
                onClick={handlePublisherClick}
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 overflow-hidden shadow-sm border border-pale dark:border-slate-700">
                  <AppImage
                    src={
                      (listing as any).user?.image || listing.publisherAvatar
                    }
                    className="w-full h-full"
                    alt={(listing as any).user?.name || listing.publisherName}
                  />
                </div>
                <div className="flex flex-col">
                  <span
                    className={`text-[13px] font-bold text-navy dark:text-slate-300`}
                  >
                    {(listing as any).user?.name ||
                      listing.publisherName ||
                      t("listing.defaultPublisherName")}
                  </span>
                  {(listing as any).user?.caption && (
                    <span className="text-[10px] text-gray-400 truncate max-w-[120px]">
                      {(listing as any).user.caption}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[13px] text-gray-400 dark:text-slate-500 font-bold">
                  {t("listing.views", {
                    count: (listing as any).watch_count || listing.views || 0,
                  })}
                </span>
                <span className="text-[11px] text-gray-300">
                  {(listing as any).created_at}
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Attributes Grid */}
          {(listing as any).categories?.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-bold text-navy dark:text-slate-200 mb-1 font-sans">
                {t("listing.propertyDetails")}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(listing as any).categories.map((cat: any, idx: number) => (
                  <AttrBadge
                    key={idx}
                    label={cat.category_name}
                    value={cat.range || cat.category_value_name}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold text-navy dark:text-slate-200 mb-3 font-sans">
              {t("listing.description")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed whitespace-pre-line font-medium">
              {listing.description || t("listing.noDescription")}
            </p>
          </div>

          {/* Safety Tips */}
          {(listing as any).safety_tips && (
            <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-6 bg-orange-400 rounded-full" />
                <h3 className="text-sm font-bold text-orange-800 dark:text-orange-400">
                  {t("listing.safetyTips")}
                </h3>
              </div>
              {/* safety_tips is a Filament RichEditor field (see Settings.php), so
                  it arrives as HTML — rendering it as text printed the raw tags.
                  Admin-authored, same as terms/privacy/about. Note the ad's own
                  `description` above is user-written and must stay plain text. */}
              <div
                className="text-[13px] text-orange-700/80 dark:text-orange-300/60 leading-relaxed font-medium Prose"
                dangerouslySetInnerHTML={{ __html: (listing as any).safety_tips }}
              />
            </div>
          )}

          {(listing.listingType ||
            listing.propertyType ||
            listing.size ||
            listing.rooms ||
            listing.bathrooms ||
            listing.balcony ||
            listing.parking ||
            (listing.parkingSystems && listing.parkingSystems.length > 0) ||
            listing.ac ||
            listing.electricity ||
            listing.water) && (
            <div>
              <h3 className="text-lg font-bold text-navy dark:text-slate-200 mb-3 font-sans">
                {t("listing.propertyDetails")}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <AttrBadge
                  label={t("listing.attrs.listingType")}
                  value={listing.listingType}
                />
                <AttrBadge
                  label={t("listing.attrs.propertyType")}
                  value={listing.propertyType}
                />
                <AttrBadge
                  label={t("listing.attrs.size")}
                  value={
                    listing.size
                      ? t("listing.attrs.sizeValue", { size: listing.size })
                      : undefined
                  }
                />
                <AttrBadge label={t("listing.attrs.rooms")} value={listing.rooms} />
                <AttrBadge
                  label={t("listing.attrs.bathrooms")}
                  value={listing.bathrooms}
                />
                <AttrBadge label={t("listing.attrs.balcony")} value={listing.balcony} />
                <AttrBadge label={t("listing.attrs.parking")} value={listing.parking} />
                <AttrBadge
                  label={t("listing.attrs.parkingSystem")}
                  value={listing.parkingSystems?.join(", ")}
                />
                <AttrBadge label={t("listing.attrs.ac")} value={listing.ac} />
                <AttrBadge
                  label={t("listing.attrs.electricity")}
                  value={listing.electricity}
                />
                <AttrBadge label={t("listing.attrs.water")} value={listing.water} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 p-4 pt-4 bg-white dark:bg-slate-900 border-t border-pale dark:border-slate-800 z-20 transition-colors duration-300"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
      >
        <div className="flex gap-2">
          <div className="flex-1 flex gap-1">
            <button
              onClick={() => handleContactAction("WHATSAPP")}
              disabled={isWhatsappStarting}
              aria-disabled={paymentStatus !== "IDLE"}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-navy/20 dark:border-slate-700 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-500 font-semibold text-sm active:scale-95 transition-all disabled:opacity-50"
            >
              {isWhatsappStarting ? (
                <SpinnerIcon className="w-5 h-5 animate-spin" />
              ) : (
                <WhatsappIcon className="w-5 h-5" />
              )}
              <span>{t("listing.contact.whatsapp")}</span>
            </button>
          </div>

          <div className="flex-1 flex gap-1">
            <button
              onClick={() => handleContactAction("CALL")}
              disabled={isCallStarting}
              aria-disabled={paymentStatus !== "IDLE"}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-navy dark:bg-blue text-white font-semibold text-sm shadow-lg shadow-navy/20 dark:shadow-blue/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isCallStarting ? (
                <SpinnerIcon className="w-5 h-5 animate-spin" />
              ) : (
                <PhoneIcon className="w-5 h-5" />
              )}
              <span>{t("listing.contact.call")}</span>
            </button>
          </div>
        </div>
      </div>

      {showUnlockPopup && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => {
              if (paymentStatus === "IDLE" || paymentStatus === "SUCCESS")
                setShowUnlockPopup(false);
            }}
          />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] p-8 shadow-2xl animate-fade-in-up border-t dark:border-slate-800 transition-colors duration-300">
            <div className="w-12 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full mx-auto mb-8 sm:hidden" />
            <div className="flex flex-col items-center text-center gap-6">
              <div className="relative w-24 h-24 mb-2 flex items-center justify-center">
                {paymentStatus === "IDLE" && (
                  <div className="w-20 h-20 bg-pale/50 dark:bg-slate-800 rounded-full flex items-center justify-center text-navy dark:text-slate-200 border border-pale dark:border-slate-700 animate-fade-in">
                    <LockIcon className="w-10 h-10" />
                  </div>
                )}
                {(paymentStatus === "STARTING" ||
                  paymentStatus === "VERIFYING" ||
                  paymentStatus === "CONFIRMING") && (
                  <div className="w-20 h-20 rounded-full border-4 border-pale dark:border-slate-800 flex items-center justify-center relative animate-fade-in">
                    <div className="absolute inset-0 border-4 border-navy dark:border-blue border-t-transparent rounded-full animate-spin"></div>
                    <SpinnerIcon className="w-10 h-10 text-navy/20 dark:text-blue/20" />
                  </div>
                )}
                {paymentStatus === "SUCCESS" && (
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200 dark:shadow-green-900/40 animate-scale-in">
                    <svg className="w-12 h-12 text-white" viewBox="0 0 52 52">
                      <path
                        className="animate-draw"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="100"
                        strokeDashoffset="100"
                        d="M14.1 27.2l7.1 7.2 16.7-16.8"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 min-h-[80px] w-full">
                <h3
                  className={`text-xl font-bold transition-colors duration-300 ${paymentStatus === "SUCCESS" ? "text-green-600 dark:text-green-500" : "text-navy dark:text-slate-200"}`}
                >
                  {mfSessionId
                    ? t("listing.payment.completeTitle")
                    : getPaymentText()}
                </h3>
                {mfSessionId ? (
                  <div className="w-full mt-4">
                    <MyFatoorahPayment
                      sessionId={mfSessionId}
                      countryCode={mfCountry}
                      encryptionKey={mfEncryptionKey ?? undefined}
                      onSuccess={onEmbeddedPaymentSuccess}
                      onError={(err) =>
                        toast.error(err.message || t("listing.payment.failed"))
                      }
                      onRequestNewSession={() => {
                        // MF rejected the session — clear and get a fresh one
                        setMfSessionId(null);
                        setMfTransactionId(null);
                        setMfEncryptionKey(null);
                        handleUnlockPayment();
                      }}
                    />
                    <button
                      onClick={() => setMfSessionId(null)}
                      className="w-full mt-4 text-xs text-gray-400 font-bold hover:text-navy underline"
                    >
                      {t("listing.payment.backToOptions")}
                    </button>
                  </div>
                ) : paymentStatus === "IDLE" ? (
                  <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed max-w-[85%] mx-auto font-sans">
                    {t("listing.unlock.description")}
                  </p>
                ) : paymentStatus === "SUCCESS" ? (
                  <p className="text-sm text-green-600/80 dark:text-green-500/80 font-medium animate-fade-in font-sans">
                    {t("listing.unlock.unlocked")}
                  </p>
                ) : (
                  <div className="flex flex-col gap-4 mt-2">
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-navy dark:bg-blue transition-all duration-700 ease-out`}
                        style={{
                          width:
                            paymentStatus === "STARTING"
                              ? "30%"
                              : paymentStatus === "VERIFYING"
                                ? "70%"
                                : "95%",
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              {paymentStatus === "IDLE" && !mfSessionId && (
                <>
                  <div className="bg-bg dark:bg-slate-800 px-6 py-3 rounded-2xl border border-pale/50 dark:border-slate-700 flex items-center gap-3 animate-fade-in transition-colors duration-300">
                    <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">
                      {t("listing.unlock.feeLabel")}
                    </span>
                    <span className="text-md font-bold text-navy dark:text-slate-200">
                      {t("listing.unlock.fee")}
                    </span>
                  </div>
                  <div className="w-full flex flex-col gap-3 mt-4 animate-fade-in">
                    <button
                      onClick={handleUnlockPayment}
                      className="w-full h-14 bg-black dark:bg-slate-950 text-white rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-black/10"
                    >
                      <AppleIcon className="w-6 h-6 mb-1" />
                      <span>{t("listing.payment.applePay")}</span>
                    </button>
                    <button
                      onClick={handleUnlockPayment}
                      className="w-full h-14 bg-white dark:bg-slate-800 text-navy dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-all shadow-sm"
                    >
                      <img
                        src={KNET_LOGO}
                        className="w-8 h-8 object-contain"
                        alt="KNET"
                      />
                      <span>{t("listing.payment.card")}</span>
                    </button>
                    <button
                      onClick={() => setShowUnlockPopup(false)}
                      className="w-full h-12 text-gray-400 dark:text-slate-500 font-bold text-sm hover:text-navy dark:hover:text-slate-300 transition-colors active:scale-95 mt-1"
                    >
                      {t("common.cancel")}
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="h-[env(safe-area-inset-bottom)] sm:hidden" />
          </div>
        </div>
      )}

      {isMediaFullscreen && activeMedia && (
        <div
          className="fixed inset-0 z-[250] bg-black flex flex-col"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
            overscrollBehavior: "none",
            touchAction: "none",
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <button
              type="button"
              onClick={closeMediaFullscreen}
              className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center active:scale-95 transition-all"
              aria-label={t("common.close")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
            <span className="text-white/80 text-sm font-bold">
              {activeImageIndex + 1} / {mediaItems.length}
            </span>
          </div>

          <div className="relative flex-1 flex items-center justify-center px-4 min-h-0">
            {mediaItems.length > 1 && (
              <button
                type="button"
                onClick={showPrevMedia}
                className={`absolute ${isRTL ? "right-2" : "left-2"} z-10 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center active:scale-95 transition-all`}
                aria-label={t("common.previous")}
              >
                <ChevronRightIcon
                  className={`w-6 h-6 ${isRTL ? "" : "rotate-180"}`}
                />
              </button>
            )}

            <div className="w-full h-full flex items-center justify-center">
              {activeMedia.type === "video" ? (
                <video
                  key={activeMedia.id}
                  ref={fullscreenVideoRef}
                  src={getSrc(activeMedia.src)}
                  controls
                  autoPlay
                  playsInline
                  className="max-w-full max-h-full w-full object-contain"
                  poster={FALLBACK_LISTING_IMAGE}
                />
              ) : (
                <AppImage
                  key={activeMedia.id}
                  src={getSrc(activeMedia.src)}
                  alt={listing.title}
                  className="max-w-full max-h-full"
                  coverClassName="object-contain"
                />
              )}
            </div>

            {mediaItems.length > 1 && (
              <button
                type="button"
                onClick={showNextMedia}
                className={`absolute ${isRTL ? "left-2" : "right-2"} z-10 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center active:scale-95 transition-all`}
                aria-label={t("common.next")}
              >
                <ChevronRightIcon
                  className={`w-6 h-6 ${isRTL ? "rotate-180" : ""}`}
                />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingDetailsPage;
