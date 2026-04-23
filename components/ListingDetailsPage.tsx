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
  SpinnerIcon,
  UserIcon,
  WhatsappIcon,
} from "./Icons";
import MyFatoorahPayment from "./MyFatoorahPayment";

interface ListingDetailsPageProps {
  listingId: number;
  onBack: () => void;
}

const FALLBACK_IMAGE =
  "https://raiyansoft.com/wp-content/uploads/2026/01/1.png";
const UNLOCK_FEE = "١٥٠ فلس";
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
  const { data: listingData, isLoading: loading, refetch: refetchListing } = useListing(
    Number(listingId),
  );
  const listing = listingData || null;
  
  console.log("Ad Data:", listing);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);

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
  const isFavorite = useFavoritesStore((state) => state.isFavorite(listingId));
  const { mutate: toggleFavoriteMutation } = useFavoriteToggle();
  const callMutation = useCallAd();

  const toggleFavorite = () => {
    toggleFavoriteMutation(listingId);
  };

  useEffect(() => {
    if (listing) {
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
  }, [listing, loading, onBack]);

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
        src: att.file,
        id: `att-${idx}`,
      });
    });
  } else {
    // Fallback to images/imageUrl/video
    const rawImages =
      listing.images && listing.images.length > 0
        ? listing.images
        : [listing.imageUrl || FALLBACK_IMAGE];

    rawImages.forEach((img, idx) => {
      mediaItems.push({ type: "image", src: img, id: `img-${idx}` });
    });

    if (listing.video) {
      mediaItems.push({ type: "video", src: listing.video, id: "vid-main" });
    }
  }

  // Ensure we have at least one image if no media items
  if (mediaItems.length === 0) {
    mediaItems.push({ type: "image", src: FALLBACK_IMAGE, id: "fallback" });
  }

  const getSrc = (src: string | File | Blob) => {
    if (src instanceof File || src instanceof Blob) {
      return URL.createObjectURL(src);
    }
    return src;
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

  const handlePublisherClick = () => {
    if (listing.publisherId) {
      navigate({
        to: "/profile",
        search: { user: listing.publisherId as any },
      });
    }
  };

  const handleUnlockPayment = () => {
    if (paymentStatus !== "IDLE") return;
    console.log(
      "[Contact Unlock] handleUnlockPayment triggered for ad:",
      listing.id,
    );
    setPaymentStatus("STARTING");

    callMutation.mutate(listing.id, {
      onSuccess: (response) => {
        console.log("[Contact Unlock] /call response:", response);

        if (response.data?.session_id) {
          const sessionId = response.data.session_id;
          const transactionId = response.data.transaction_id;
          const country = sessionId.split("-")[0] || "KWT";
          setMfSessionId(sessionId);
          setMfCountry(country);
          setMfTransactionId(transactionId ?? null);
          setMfEncryptionKey(response.data.encryption_key ?? null);
          setPaymentStatus("IDLE");
        } else if (response?.data?.payment_url) {
          console.log(
            "[Contact Unlock] Redirect flow. payment_url:",
            response.data.payment_url,
          );
          setPaymentStatus("VERIFYING");
          setTimeout(() => setPaymentStatus("CONFIRMING"), 500);
          setTimeout(() => {
            window.location.href = response.data.payment_url;
          }, 1000);
        } else {
          console.warn("[Contact Unlock] Unexpected response:", response);
          setPaymentStatus("IDLE");
        }
      },
      onError: (err) => {
        console.error("[Contact Unlock] /call error:", err);
        setPaymentStatus("IDLE");
        toast.error("حدث خطأ أثناء إنشاء جلسة الدفع");
      },
    });
  };

  /**
   * Called by MyFatoorahPayment component after the SDK fires its callback.
   * sessionId here = the SessionId from MyFatoorah's callback response.
   * We verify it against our backend using the transaction_id from the /call response.
   */
  const onEmbeddedPaymentSuccess = async (mfCallbackSessionId: string) => {
    console.log(
      "[Contact Unlock] MyFatoorah callback fired. SessionId:",
      mfCallbackSessionId,
    );
    console.log("[Contact Unlock] Stored transaction_id:", mfTransactionId);

    if (!mfTransactionId) {
      console.error(
        "[Contact Unlock] No transaction_id stored — cannot verify payment!",
      );
      toast.error("خطأ: لا يمكن التحقق من الدفع، يرجى المحاولة مجدداً");
      return;
    }

    setPaymentStatus("VERIFYING");

    try {
      console.log("[Contact Unlock] Calling /payments/verify...", {
        transaction_id: mfTransactionId,
        payment_id: mfCallbackSessionId,
      });
      const verifyRes = await paymentService.verifyPayment({
        transaction_id: mfTransactionId,
        payment_id: mfCallbackSessionId,
      });
      console.log("[Contact Unlock] /payments/verify response:", verifyRes);

      if (verifyRes.status) {
        setPaymentStatus("SUCCESS");
        setIsUnlocked(true);
        // Refetch listing so owner_phone/owner_whatsapp are available immediately
        refetchListing();
        const user = JSON.parse(localStorage.getItem("road80_user") || "{}");
        const userId = user.phone || "guest";
        localStorage.setItem(`unlock_contact_${userId}_${listing.id}`, "true");

        // Extract contact from API response (supports data.contact_info.phone or data.phone)
        const contactData = verifyRes.data?.contact_info ||
          verifyRes.contact_info || {
            phone: verifyRes.data?.phone || verifyRes.phone,
            whatsapp: verifyRes.data?.whatsapp || verifyRes.whatsapp,
          };

        if (contactData && contactData.phone) {
          setUnlockedContact(contactData);
          localStorage.setItem(
            `unlock_contact_phone_${userId}_${listing.id}`,
            JSON.stringify(contactData),
          );
        }

        console.log(
          "[Contact Unlock] ✅ Payment verified. Contact unlocked for ad:",
          listing.id,
        );

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
            toast.success("تم الدفع بنجاح!", {
              description: `رقم التواصل: ${fullPhone}`,
              duration: 10000,
              action: {
                label: "نسخ الرقم",
                onClick: () => {
                  navigator.clipboard.writeText(fullPhone);
                  toast.success("تم النسخ للحافظة");
                },
              },
            });
          } else {
            toast.success("تم الدفع بنجاح وتحرير رقم التواصل!");
          }
        }, 500);
      } else {
        console.error(
          "[Contact Unlock] /payments/verify returned status=false:",
          verifyRes,
        );
        setPaymentStatus("IDLE");
        toast.error(verifyRes.message || "فشل التحقق من الدفع");
      }
    } catch (err) {
      console.error("[Contact Unlock] /payments/verify threw an error:", err);
      setPaymentStatus("IDLE");
      toast.error("حدث خطأ أثناء التحقق من الدفع");
    }
  };

  const handleContactAction = (type: "WHATSAPP" | "CALL") => {
    console.log(
      "[Contact Action] Triggered. type:",
      type,
      "| adId:",
      listing.id,
      "| isUnlocked:",
      isUnlocked,
    );

    let directPhone = type === "WHATSAPP" ? (listing as any).owner_whatsapp : (listing as any).owner_phone;
    
    if (!directPhone && unlockedContact) {
      directPhone = type === "WHATSAPP" ? (unlockedContact.whatsapp || unlockedContact.phone) : unlockedContact.phone;
    }

    if (directPhone) {
      const phone = directPhone.replace(/\D/g, "");
      if (type === "WHATSAPP") {
        window.open(`https://wa.me/${phone}`, "_blank");
      } else {
        window.location.href = `tel:${phone}`;
      }
      return;
    }

    setPendingContactType(type);
    setPaymentStatus("STARTING");

    callMutation.mutate(listing.id, {
      onSuccess: (response) => {
        console.log("[Contact Action] /call response:", response);

        if (response.data?.phone) {
          // Already unlocked — backend gave us the number directly
          setPaymentStatus("IDLE");
          const phone = response.data.phone.replace(/\D/g, "");
          console.log(
            "[Contact Action] Phone number received directly:",
            phone,
          );

          setIsUnlocked(true);
          const user = JSON.parse(localStorage.getItem("road80_user") || "{}");
          const userId = user.phone || "guest";
          localStorage.setItem(
            `unlock_contact_${userId}_${listing.id}`,
            "true",
          );

          if (type === "WHATSAPP") {
            console.log(
              "[Contact Action] Opening WhatsApp:",
              `https://wa.me/${phone}`,
            );
            window.open(`https://wa.me/${phone}`, "_blank");
          } else {
            console.log("[Contact Action] Calling:", `tel:${phone}`);
            window.location.href = `tel:${phone}`;
          }
        } else if (response.data?.session_id) {
          // Needs payment — show embedded form
          const sessionId = response.data.session_id;
          const transactionId = response.data.transaction_id;
          const country = sessionId.split("-")[0] || "KWT";

          console.log(
            "[Contact Action] Payment required. session_id:",
            sessionId,
            "| transaction_id:",
            transactionId,
            "| encryption_key:",
            response.data.encryption_key,
          );

          setMfSessionId(sessionId);
          setMfCountry(country);
          setMfTransactionId(transactionId ?? null);
          setMfEncryptionKey(response.data.encryption_key ?? null);
          setPaymentStatus("IDLE");
          setShowUnlockPopup(true);
        } else if (response.data?.payment_url) {
          console.log(
            "[Contact Action] Redirect payment url:",
            response.data.payment_url,
          );
          setPaymentStatus("IDLE");
          setShowUnlockPopup(true);
        } else {
          console.warn(
            "[Contact Action] Unexpected response structure:",
            response,
          );
          setPaymentStatus("IDLE");
          if (response.status || response.message === "success") {
            setShowUnlockPopup(true);
          }
        }
      },
      onError: (err) => {
        setPaymentStatus("IDLE");
        console.error("[Contact Action] /call error:", err);
        toast.error("حدث خطأ أثناء محاولة الاتصال");
      },
    });
  };

  const AttrBadge: React.FC<{
    label: string;
    value: string | number | undefined;
  }> = ({ label, value }) => {
    if (!value) return null;
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
        return "جاري بدء عملية الدفع...";
      case "VERIFYING":
        return "جاري التحقق من الدفع...";
      case "CONFIRMING":
        return "جاري تأكيد العملية...";
      case "SUCCESS":
        return "تم الدفع بنجاح";
      default:
        return "فتح التواصل مع ناشر الإعلان";
    }
  };

  return (
    <div className="absolute inset-0 bg-bg dark:bg-slate-950 z-50 flex flex-col h-full overflow-hidden animate-fade-in transition-colors duration-300">
      {/* Header */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4"
        style={{
          height: "calc(var(--header-h) + env(safe-area-inset-top))",
          paddingTop: "env(safe-area-inset-top)",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)",
        }}
      >
        <button
          onClick={onBack}
          className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-95 transition-all"
        >
          <ChevronRightIcon className="w-6 h-6 rotate-180" />
        </button>
        <div className="flex gap-3">
          <button
            onClick={toggleFavorite}
            className={`w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transition-all active:scale-95 ${isFavorite ? "text-red-500" : "text-red-300"}`}
          >
            <HeartIcon className="w-6 h-6" filled={isFavorite} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-24 no-scrollbar bg-bg dark:bg-slate-950 transition-colors duration-300">
        <div className="relative bg-white dark:bg-slate-900 shadow-sm transition-colors duration-300">
          {/* Main Carousel - Strict 1:1 Aspect Ratio using padding hack for iOS stability */}
          <div className="relative w-full pt-[100%] bg-gray-200 dark:bg-slate-800 overflow-hidden group">
            <div
              ref={scrollRef}
              className="absolute inset-0 w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
              onScroll={handleScroll}
              style={{ WebkitOverflowScrolling: "touch" }}
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
                      poster={FALLBACK_IMAGE}
                    />
                  ) : (
                    <img
                      src={getSrc(item.src)}
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE)}
                      alt={`Slide ${idx}`}
                    />
                  )}
                </div>
              ))}
            </div>
            {/* Count Badge */}
            <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-[13px] font-bold px-2.5 py-1 rounded-full border border-white/10 z-10 pointer-events-none">
              {activeImageIndex + 1} / {mediaItems.length}
            </div>
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
                    <img
                      src={getSrc(item.src)}
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE)}
                      alt={`Thumb ${idx}`}
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
                {(listing as any).city_name || listing.area}،{" "}
                {(listing as any).state_name || listing.governorate}
              </span>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-800 transition-colors duration-300">
              <div
                className={`flex items-center gap-2 ${(listing as any).user?.id || listing.publisherId ? "cursor-pointer active:scale-95 transition-transform" : ""}`}
                onClick={handlePublisherClick}
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 overflow-hidden shadow-sm border border-pale dark:border-slate-700">
                  {(listing as any).user?.image || listing.publisherAvatar ? (
                    <img
                      src={
                        (listing as any).user?.image || listing.publisherAvatar
                      }
                      className="w-full h-full object-cover"
                      alt={(listing as any).user?.name || listing.publisherName}
                    />
                  ) : (
                    <UserIcon className="w-5 h-5" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span
                    className={`text-[13px] font-bold text-navy dark:text-slate-300`}
                  >
                    {(listing as any).user?.name ||
                      listing.publisherName ||
                      "مستخدم"}
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
                  {(listing as any).watch_count || listing.views || 0} مشاهدة
                </span>
                <span className="text-[11px] text-gray-300">
                  {(listing as any).created_at}
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Attributes Grid */}
          {(listing as any).categories?.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(listing as any).categories.map((cat: any, idx: number) => (
                <AttrBadge
                  key={idx}
                  label={cat.category_name}
                  value={cat.range || cat.category_value_name}
                />
              ))}
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold text-navy dark:text-slate-200 mb-3 font-sans">
              الوصف
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed whitespace-pre-line font-medium">
              {listing.description || "لا يوجد وصف متاح لهذا العقار."}
            </p>
          </div>

          {/* Safety Tips */}
          {(listing as any).safety_tips && (
            <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-6 bg-orange-400 rounded-full" />
                <h3 className="text-sm font-bold text-orange-800 dark:text-orange-400">
                  نصائح السلامة
                </h3>
              </div>
              <p className="text-[13px] text-orange-700/80 dark:text-orange-300/60 leading-relaxed whitespace-pre-line font-medium">
                {(listing as any).safety_tips}
              </p>
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold text-navy dark:text-slate-200 mb-3 font-sans">
              تفاصيل العقار
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <AttrBadge label="نوع الإعلان" value={listing.listingType} />
              <AttrBadge label="نوع العقار" value={listing.propertyType} />
              <AttrBadge
                label="المساحة"
                value={listing.size ? `${listing.size} م²` : undefined}
              />
              <AttrBadge label="الغرف" value={listing.rooms} />
              <AttrBadge label="الحمامات" value={listing.bathrooms} />
              <AttrBadge label="بلكونة" value={listing.balcony} />
              <AttrBadge label="المواقف" value={listing.parking} />
              <AttrBadge
                label="نظام المواقف"
                value={listing.parkingSystems?.join(", ")}
              />
              <AttrBadge label="التكييف" value={listing.ac} />
              <AttrBadge label="الكهرباء" value={listing.electricity} />
              <AttrBadge label="الماء" value={listing.water} />
            </div>
          </div>
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
              disabled={paymentStatus !== "IDLE"}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-navy/20 dark:border-slate-700 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-500 font-semibold text-sm active:scale-95 transition-all disabled:opacity-50"
            >
              {paymentStatus === "STARTING" ? (
                <SpinnerIcon className="w-5 h-5 animate-spin" />
              ) : (
                <WhatsappIcon className="w-5 h-5" />
              )}
              <span>واتساب</span>
            </button>
          </div>

          <div className="flex-1 flex gap-1">
            <button
              onClick={() => handleContactAction("CALL")}
              disabled={paymentStatus !== "IDLE"}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-navy dark:bg-blue text-white font-semibold text-sm shadow-lg shadow-navy/20 dark:shadow-blue/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {paymentStatus === "STARTING" ? (
                <SpinnerIcon className="w-5 h-5 animate-spin" />
              ) : (
                <PhoneIcon className="w-5 h-5" />
              )}
              <span>اتصال</span>
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
                  {mfSessionId ? "إكمال عملية الدفع" : getPaymentText()}
                </h3>
                {mfSessionId ? (
                  <div className="w-full mt-4">
                    <MyFatoorahPayment
                      sessionId={mfSessionId}
                      countryCode={mfCountry}
                      encryptionKey={mfEncryptionKey ?? undefined}
                      onSuccess={onEmbeddedPaymentSuccess}
                      onError={(err) => toast.error(err.message || "فشل الدفع")}
                      onRequestNewSession={() => {
                        // MF rejected the session — clear and get a fresh one
                        console.log(
                          "[Contact Unlock] Session rejected by MF, requesting new session...",
                        );
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
                      العودة لخيارات الدفع
                    </button>
                  </div>
                ) : paymentStatus === "IDLE" ? (
                  <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed max-w-[85%] mx-auto font-sans">
                    لفتح القفل والتواصل مع البائع في هذا الإعلان، يرجى الدفع مرة
                    واحدة فقط.
                  </p>
                ) : paymentStatus === "SUCCESS" ? (
                  <p className="text-sm text-green-600/80 dark:text-green-500/80 font-medium animate-fade-in font-sans">
                    تم فتح التواصل مع ناشر الإعلان
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
                      سعر فتح الاعلان:
                    </span>
                    <span className="text-lg font-bold text-navy dark:text-slate-200">
                      {UNLOCK_FEE}
                    </span>
                  </div>
                  <div className="w-full flex flex-col gap-3 mt-4 animate-fade-in">
                    <button
                      onClick={handleUnlockPayment}
                      className="w-full h-14 bg-black dark:bg-slate-950 text-white rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-black/10"
                    >
                      <AppleIcon className="w-6 h-6 mb-1" />
                      <span>الدفع السريع</span>
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
                      <span>الدفع ببطاقة بنكية</span>
                    </button>
                    <button
                      onClick={() => setShowUnlockPopup(false)}
                      className="w-full h-12 text-gray-400 dark:text-slate-500 font-bold text-sm hover:text-navy dark:hover:text-slate-300 transition-colors active:scale-95 mt-1"
                    >
                      إلغاء
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="h-[env(safe-area-inset-bottom)] sm:hidden" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingDetailsPage;
