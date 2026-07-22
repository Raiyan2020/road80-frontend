import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  CheckIcon,
  AppleIcon,
  ChevronRightIcon,
  SpinnerIcon,
  PlusIcon,
  PlayIcon,
} from "./Icons";
import { useCategories } from "../features/post-ad/hooks/useCategories";
import { useChunkedVideoUpload } from "../features/post-ad/hooks/useChunkedVideoUpload";
import { useCountries } from "../shared/hooks/useCountries";
import {
  useExploreStates,
  useExploreCities,
} from "../features/explore/hooks/useExploreLocations";
import { useSettings } from "../shared/hooks/useSettings";
import { postAdService } from "../features/post-ad/services/post-ad.service";
import { Category } from "../features/post-ad/services/post-ad.service";
import { Country } from "../shared/types/country";
import { toast } from "sonner";
import { checkMediaPermissions } from "../shared/utils/media-permissions";
import {
  isAllowedAdImage,
  isAllowedAdVideo,
  isWithinImageSizeLimit,
  isWithinVideoSizeLimit,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
} from "../shared/utils/media-validation";
import {
  compressImages,
  formatBytes,
} from "../shared/utils/media-compression";
import { useTranslation, pickLocalized } from "../i18n";
import MyFatoorahPayment from "./MyFatoorahPayment";
import { AppImage } from "./AppImage";
import { dismissKeyboard, useKeyboardOpen } from "@/shared/hooks/useKeyboardOpen";
import { paymentService } from "../shared/services/payment.service";

interface AddWizardProps {
  onComplete: () => void;
}

type WizardStep =
  | { type: "category"; data: Category; key: string }
  | { type: "country"; key: string }
  | { type: "state"; key: string }
  | { type: "city"; key: string }
  | { type: "video"; key: string }
  | { type: "images"; key: string }
  | { type: "details"; key: string }
  | { type: "summary"; key: string };

const KNET_LOGO =
  "https://media.licdn.com/dms/image/v2/D4D0BAQFazp_I3lLeQg/company-logo_200_200/company-logo_200_200/0/1715599858189/the_shared_electronic_banking_services_co_knet_logo?e=2147483647&v=beta&t=FfjCLbNIUGrTCTi-tI5nXSNP9B4AcOJbWsFqV0bSWcM";

const AddWizard: React.FC<AddWizardProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, dir } = useTranslation();

  // ── Backend Data ─────────────────────────────────────────────────────────
  const { data: categories = [], isLoading: catsLoading } = useCategories();
  const { data: countries = [] } = useCountries();
  const { data: settings } = useSettings();
  const {
    uploadState,
    uploadVideo,
    reset: resetVideoUpload,
  } = useChunkedVideoUpload();

  // ── Form State ───────────────────────────────────────────────────────────
  // categoryValues: map of category.id → selected category_value.id
  const [categoryValues, setCategoryValues] = useState<
    Record<number, number | string>
  >({});
  const [countryId, setCountryId] = useState<number | null>(null);
  const [stateId, setStateId] = useState<number | null>(null);
  const [cityId, setCityId] = useState<number | null>(null);
  const [price, setPrice] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [images, setImages] = useState<File[]>([]);
  /** Non-null only while a batch of freshly picked photos is being optimised. */
  const [imageOptimizing, setImageOptimizing] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [published, setPublished] = useState(false);
  const [isRedirectingToPayment, setIsRedirectingToPayment] = useState(false);
  const [showEmbedded, setShowEmbedded] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<{
    id: string;
    country: string;
    originalId?: string;
  } | null>(null);

  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const wizardScrollRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const descriptionScrollTimerRef = useRef<number | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const isKeyboardOpen = useKeyboardOpen();

  // ── Location Data ────────────────────────────────────────────────────────
  const { data: states = [] } = useExploreStates(countryId || undefined);
  const { data: cities = [] } = useExploreCities(stateId);

  // ── Dynamic Step Generation (mirrors Next.js useWizardSteps) ────────────
  const steps = useMemo<WizardStep[]>(() => {
    if (!categories || categories.length === 0) return [];
    const base: WizardStep[] = [];

    // First 2 categories
    if (categories[0])
      base.push({
        type: "category",
        data: categories[0],
        key: `cat_${categories[0].id}`,
      });
    if (categories[1])
      base.push({
        type: "category",
        data: categories[1],
        key: `cat_${categories[1].id}`,
      });

    // Location steps
    base.push({ type: "country", key: "country" });
    base.push({ type: "state", key: "governorate" });
    base.push({ type: "city", key: "area" });

    // Remaining categories
    categories.slice(2).forEach((cat) => {
      base.push({ type: "category", data: cat, key: `cat_${cat.id}` });
    });

    // Media & final steps
    base.push({ type: "video", key: "video" });
    base.push({ type: "images", key: "images" });
    base.push({ type: "details", key: "details" });
    base.push({ type: "summary", key: "summary" });

    return base;
  }, [categories]);

  const totalSteps = steps.length;

  // ── URL-synced Step ──────────────────────────────────────────────────────
  const getStep = () => {
    const params = new URLSearchParams(window.location.search);
    const s = parseInt(params.get("step") || "1");
    return isNaN(s) || s < 1 ? 1 : Math.min(s, totalSteps || 1);
  };

  const [step, setStep] = useState(getStep());

  useEffect(() => {
    const s = getStep();
    if (s !== step) setStep(s);
  }, [location.search, totalSteps]);

  useEffect(() => {
    document
      .getElementById("wizard-scroll-area")
      ?.scrollTo({ top: 0, behavior: "smooth" });
    setShowErrors(false);
  }, [step]);

  const goTo = useCallback(
    (s: number) => {
      navigate({ to: "/post-ad", search: { step: s } as any });
    },
    [navigate],
  );

  const currentStepInfo = steps[step - 1];
  const isDetailsStep = currentStepInfo?.type === "details";
  const descriptionLength = description.trim().length;

  const ensureDescriptionVisible = useCallback(() => {
    if (descriptionScrollTimerRef.current) {
      window.clearTimeout(descriptionScrollTimerRef.current);
    }

    const run = () => {
      const container = wizardScrollRef.current;
      const field = descriptionInputRef.current;
      if (!container || !field) return;

      const section = field.closest(".description-field") as HTMLElement | null;
      const target = section ?? field;

      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const relativeTop =
        targetRect.top - containerRect.top + container.scrollTop;
      const topInset = 12;

      container.scrollTo({
        top: Math.max(0, relativeTop - topInset),
        behavior: "smooth",
      });
    };

    requestAnimationFrame(run);
    descriptionScrollTimerRef.current = window.setTimeout(run, 180);
  }, []);

  useEffect(() => {
    return () => {
      if (descriptionScrollTimerRef.current) {
        window.clearTimeout(descriptionScrollTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isDetailsStep || !descriptionFocused) return;

    const viewport = window.visualViewport;
    if (!viewport) return;

    const onViewportChange = () => ensureDescriptionVisible();
    viewport.addEventListener("resize", onViewportChange);
    return () => viewport.removeEventListener("resize", onViewportChange);
  }, [isDetailsStep, descriptionFocused, ensureDescriptionVisible]);

  const focusDescriptionField = useCallback(() => {
    descriptionInputRef.current?.focus();
    ensureDescriptionVisible();
  }, [ensureDescriptionVisible]);

  const focusNextField = (
    event: React.KeyboardEvent,
    nextRef: React.RefObject<HTMLElement | null>,
  ) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (nextRef === descriptionInputRef) {
      focusDescriptionField();
      return;
    }
    nextRef.current?.focus();
  };

  const handleDescriptionFocus = () => {
    setDescriptionFocused(true);
    ensureDescriptionVisible();
  };

  const handleDescriptionBlur = () => {
    setDescriptionFocused(false);
  };

  // ── Validation ───────────────────────────────────────────────────────────
  const isCurrentStepValid = (): boolean => {
    if (!currentStepInfo) return true;
    if (currentStepInfo.type === "category") {
      const val = categoryValues[currentStepInfo.data.id];
      return val !== undefined && val !== null && val !== "";
    }
    if (currentStepInfo.type === "country") return !!countryId;
    if (currentStepInfo.type === "state")
      return states.length === 0 || !!stateId;
    if (currentStepInfo.type === "city") return cities.length === 0 || !!cityId;
    if (currentStepInfo.type === "details") {
      return (
        !!price &&
        Number(price) > 0 &&
        title.trim().length > 0 &&
        description.trim().length >= 10
      );
    }
    return true;
  };

  const next = () => {
    if (!isCurrentStepValid()) {
      setShowErrors(true);
      if (currentStepInfo?.type === "details") {
        if (!price || Number(price) <= 0) {
          toast.error(t("validation.enterPrice"));
          priceInputRef.current?.focus();
        } else if (title.trim().length === 0) {
          toast.error(t("validation.enterAdTitle"));
          titleInputRef.current?.focus();
        } else if (description.trim().length < 10) {
          toast.error(t("validation.adDescriptionMin10"));
          focusDescriptionField();
        }
      } else {
        toast.error(t("validation.selectRequiredOptions"));
      }
      return;
    }

    if (step < totalSteps) goTo(step + 1);
  };

  const prev = () => {
    if (step > 1) goTo(step - 1);
  };

  const selAndNext = (catId: number, valueId: number | string) => {
    setCategoryValues((prev) => ({ ...prev, [catId]: valueId }));
    // Using requestAnimationFrame to ensure the state update doesn't conflict with immediate navigation
    if (step < totalSteps) {
      setTimeout(() => goTo(step + 1), 100);
    }
  };

  const resetWizardState = useCallback(() => {
    setCategoryValues({});
    setCountryId(null);
    setStateId(null);
    setCityId(null);
    setPrice("");
    setTitle("");
    setDescription("");
    setImages([]);
    setVideoFile(null);
    setIsProcessing(false);
    setPublished(false);
    setIsRedirectingToPayment(false);
    setShowEmbedded(false);
    setSessionInfo(null);
    setTransactionId(null);
    setEncryptionKey(null);
    setShowErrors(false);
    resetVideoUpload();
    setStep(1);
  }, [resetVideoUpload]);

  const resetWizard = useCallback(() => {
    resetWizardState();
    window.location.replace(`/post-ad?step=1&restart=${Date.now()}`);
  }, [resetWizardState]);

  const goToMyAds = useCallback(() => {
    setPublished(false);
    onComplete();
  }, [onComplete]);

  // ── Video Upload ─────────────────────────────────────────────────────────
  const handleVideoSelect = async (file: File) => {
    const clearInput = () => {
      if (videoInputRef.current) videoInputRef.current.value = "";
    };

    if (!isAllowedAdVideo(file)) {
      toast.error(t("postAd.video.typeError"));
      clearInput();
      return;
    }

    // Caught here as well as in the hook so an oversized pick never shows a
    // preview it's going to reject a moment later.
    if (!isWithinVideoSizeLimit(file)) {
      toast.error(
        t("postAd.video.tooLarge", {
          size: formatBytes(file.size),
          max: formatBytes(MAX_VIDEO_BYTES),
        }),
      );
      clearInput();
      return;
    }

    setVideoFile(file);
    try {
      await uploadVideo(file);
    } catch {
      toast.error(t("postAd.video.uploadFailed"));
    }
  };

  const handleImageSelect = async (files: FileList | null) => {
    if (!files?.length) return;

    const validFiles: File[] = [];
    let hasInvalid = false;
    let hasOversized = false;

    Array.from(files).forEach((file) => {
      if (!isAllowedAdImage(file)) {
        hasInvalid = true;
      } else if (!isWithinImageSizeLimit(file)) {
        hasOversized = true;
      } else {
        validFiles.push(file);
      }
    });

    // Always clear: the same file re-picked after an error wouldn't fire
    // `change` again if the input still held it.
    if (imageInputRef.current) imageInputRef.current.value = "";

    if (hasInvalid) toast.error(t("postAd.images.typeError"));
    if (hasOversized) {
      toast.error(
        t("postAd.images.tooLarge", { max: formatBytes(MAX_IMAGE_BYTES) }),
      );
    }
    if (!validFiles.length) return;

    setImageOptimizing({ done: 0, total: validFiles.length });
    try {
      const results = await compressImages(validFiles, setImageOptimizing);
      setImages((prev) => [...prev, ...results.map((r) => r.file)]);

      // Only worth reporting when we actually saved something meaningful —
      // re-picking three already-small photos shouldn't trigger a toast.
      const before = results.reduce((sum, r) => sum + r.originalSize, 0);
      const after = results.reduce((sum, r) => sum + r.compressedSize, 0);
      const saved = before - after;
      if (saved > 0 && saved / before > 0.1) {
        toast.success(
          t("postAd.images.optimized", {
            count: results.length,
            before: formatBytes(before),
            after: formatBytes(after),
            percent: Math.round((saved / before) * 100),
          }),
        );
      }
    } catch {
      // compressImages falls back to the original file per image and never
      // rejects; this only fires on something unforeseen, and dropping the
      // batch silently would be worse than uploading it unoptimised.
      setImages((prev) => [...prev, ...validFiles]);
    } finally {
      setImageOptimizing(null);
    }
  };

  /** "~45s left" / "~2m left" — rounded up, minutes past the one-minute mark. */
  const formatEta = (seconds: number) =>
    seconds >= 60
      ? t("postAd.video.etaMinutes", { minutes: Math.ceil(seconds / 60) })
      : t("postAd.video.etaSeconds", { seconds });

  // ── Publish ──────────────────────────────────────────────────────────────
  const handlePublish = async () => {
    if (
      uploadState &&
      (uploadState.status === "uploading" || uploadState.status === "merging")
    ) {
      toast.warning(t("postAd.video.waitForUpload"));
      return;
    }
    if (uploadState && uploadState.status === "error") {
      toast.error(t("postAd.video.uploadFailedRemove"));
      return;
    }
    if (imageOptimizing) {
      toast.warning(t("postAd.images.waitForOptimize"));
      return;
    }
    if (!price || Number(price) <= 0) {
      toast.error(t("validation.enterPrice"));
      return;
    }

    setIsProcessing(true);
    try {
      const videoPaths: string[] = uploadState?.serverPath
        ? [uploadState.serverPath]
        : [];

      // Build answers array
      const answers = categories
        .map((cat) => {
          const val = categoryValues[cat.id];
          if (val === undefined || val === null || val === "") return null;

          const ans: any = { category_id: cat.id };

          if (cat.type === "range" || cat.type === "number") {
            ans.value = val;
            // For range/number types, the backend often expects a unit/type ID (category_value_id).
            // We use the first predefined value for that category if it exists.
            if (cat.values && cat.values.length > 0) {
              ans.category_value_id = cat.values[0].id;
            }
          } else {
            ans.category_value_id = val;
          }
          return ans;
        })
        .filter(
          (
            ans,
          ): ans is {
            category_id: number;
            category_value_id?: number | string;
            value?: string | number;
          } => ans !== null,
        );

      const countryName = pickLocalized(
        countries.find((c) => c.id === countryId),
        "name",
      );
      const stateName = pickLocalized(
        states.find((s) => s.id === stateId),
        "name",
      );
      const cityName = pickLocalized(
        cities.find((c) => c.id === cityId),
        "name",
      );

      // Always send non-empty title and description — backend requires them
      const finalTitle =
        title.trim() ||
        t("postAd.defaults.adTitle", {
          location:
            cityName ||
            stateName ||
            countryName ||
            t("postAd.defaults.kuwait"),
        });
      const finalDescription = description.trim() || finalTitle;

      const res = await postAdService.createAd({
        answers,
        countryId: countryId ?? 1,
        stateId: stateId ?? 1,
        cityId: cityId ?? 1,
        videoPaths,
        images,
        price: Number(price),
        title: finalTitle,
        description: finalDescription,
      });

      // Post ad success

      const paymentUrl =
        (res as any).data?.payment_url || (res as any).payment_url;
      const sessionId =
        (res as any).data?.session_id || (res as any).session_id;
      const returnedTransactionId =
        (res as any).data?.transaction_id || (res as any).transaction_id;
      const returnedEncryptionKey =
        (res as any).data?.encryption_key || (res as any).encryption_key;

      if (returnedTransactionId) setTransactionId(returnedTransactionId);
      if (returnedEncryptionKey) setEncryptionKey(returnedEncryptionKey);

      if (paymentUrl) {
        setIsRedirectingToPayment(true);
        setPublished(true);
        setTimeout(() => {
          window.location.href = paymentUrl;
        }, 1200);
      } else if (sessionId) {
        // Parse country code from session string (e.g. "KWT-xxxxxxx") — default KWT
        let finalSessionId = sessionId as string;
        let countryCodeStr = "KWT";

        if (typeof sessionId === "string" && sessionId.includes("-")) {
          const parts = sessionId.split("-");
          if (parts[0].length === 3) {
            countryCodeStr = parts[0];
            finalSessionId = parts.slice(1).join("-");
          }
        }

        // Store the original full session_id for use in /payments/verify as payment_id
        const originalSessionId = sessionId as string;
        setSessionInfo({
          id: finalSessionId,
          country: countryCodeStr,
          originalId: originalSessionId,
        });
        setShowEmbedded(true);
      } else if (res.status) {
        setPublished(true);
        // We do not use setTimeout here anymore so the user can read the success message
      } else {
        // Show the backend validation message
        const errMsg =
          res.message ||
          ((res as any).errors &&
            Object.values((res as any).errors)
              .flat()
              .join(" ")) ||
          t("postAd.errors.createFailed");
        toast.error(errMsg);
      }
    } catch (e: any) {
      // ofetch throws FetchError — the parsed response body is at e.data
      const serverMsg =
        e?.data?.message ||
        (e?.data?.errors && Object.values(e.data.errors).flat().join(" ")) ||
        e?.message ||
        t("postAd.errors.unexpected");
      // Failed to publish ad
      toast.error(serverMsg, { id: "create-ad-error" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmbeddedPay = async () => {
    setIsProcessing(true);
    try {
      // 1. In a real scenario, you might call createAd first to get an order ID,
      // or just initiate a session if the backend handles it.
      // For now, let's assume we call our new service.
      const res = await paymentService.initiateSession();
      if (res.status && res.data.SessionId) {
        setSessionInfo({
          id: res.data.SessionId,
          country: res.data.CountryCode || "KWT",
        });
        setShowEmbedded(true);
      } else {
        toast.error(t("postAd.payment.sessionFailed"));
      }
    } catch (e) {
      // Failed to initiate payment session
      toast.error(t("postAd.payment.gatewayError"));
    } finally {
      setIsProcessing(false);
    }
  };

  const onPaymentSuccess = async (_callbackId: string) => {
    setShowEmbedded(false);
    setIsProcessing(true);
    try {
      if (!transactionId) {
        toast.error(t("postAd.payment.transactionNotFound"));
        setIsProcessing(false);
        return;
      }

      // _callbackId is now the MF paymentId (e.g. "07076389179322432673") from the v3 callback
      // The backend's /payments/verify needs this MF paymentId, not the session ID
      const finalPaymentId = _callbackId;

      // Payment verify

      // POST /payments/verify
      const res = await paymentService.verifyPayment({
        transaction_id: transactionId,
        payment_id: finalPaymentId,
      });

      if (res.status) {
        setPublished(true);
        // We do not use setTimeout here anymore so the user can read the success message
      } else {
        toast.error(res.message || t("postAd.payment.verifyFailed"));
      }
    } catch (e) {
      toast.error(t("postAd.payment.confirmError"));
    } finally {
      setIsProcessing(false);
    }
  };

  // ── UI Helpers ───────────────────────────────────────────────────────────
  const renderTitle = (label: string) => (
    <h2 className="text-xl font-bold text-navy mb-6 text-center">{label}</h2>
  );

  const renderOpt = (
    label: React.ReactNode,
    isSelected: boolean,
    onClick: () => void,
  ) => (
    <button
      onClick={onClick}
      className={`w-full p-4 mb-3 rounded-2xl border flex items-center justify-between transition-all duration-200 active:scale-98 ${
        isSelected
          ? "border-navy bg-navy text-white shadow-lg shadow-navy/20"
          : "border-pale bg-white dark:bg-slate-900 dark:border-slate-700 text-navy dark:text-slate-200 hover:border-mid"
      }`}
    >
      <div className="font-bold text-sm">{label}</div>
      {isSelected && <CheckIcon className="w-5 h-5 text-white shrink-0" />}
    </button>
  );

  // ── Loading skeleton while categories load ───────────────────────────────
  if (catsLoading || totalSteps === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-bg dark:bg-slate-950">
        <SpinnerIcon className="w-8 h-8 text-navy animate-spin" />
        <p className="text-sm text-gray-400 font-medium">{t("common.loading")}</p>
      </div>
    );
  }

  // ── Success screen ───────────────────────────────────────────────────────
  if (published) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center gap-6 bg-bg dark:bg-slate-950 animate-fade-in px-4"
        dir={dir}
      >
        <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20">
          <CheckIcon className="w-12 h-12 text-white" />
        </div>
        <h3 className="text-2xl font-black text-navy dark:text-slate-200">
          {t("postAd.success.title")}
        </h3>
        {isRedirectingToPayment ? (
          <p className="text-gray-400 text-sm text-center max-w-xs">
            {t("postAd.success.redirectingToPayment")}
          </p>
        ) : (
          <div className="flex flex-col items-center gap-4 mt-4 w-full max-w-xs">
            <button
              type="button"
              onClick={() => {
                resetWizard();
              }}
              className="w-full py-4 rounded-2xl bg-navy dark:bg-blue text-white font-bold transition-all active:scale-95 shadow-lg shadow-navy/20"
            >
              {t("postAd.success.postAnother")}
            </button>
            <button
              type="button"
              onClick={goToMyAds}
              className="w-full py-4 rounded-2xl border-2 border-pale dark:border-slate-700 text-navy dark:text-slate-200 font-bold transition-all active:scale-95"
            >
              {t("postAd.success.goToMyAds")}
            </button>
            <p className="text-gray-400 text-sm text-center font-medium">
              {t("postAd.success.reviewNote")}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Step Content ─────────────────────────────────────────────────────────
  const renderStep = () => {
    if (!currentStepInfo) return null;

    // CATEGORY step
    if (currentStepInfo.type === "category") {
      const cat = currentStepInfo.data;
      const selectedVal = categoryValues[cat.id];

      if (cat.type === "select" || cat.type === "boolean") {
        return (
          <>
            {renderTitle(pickLocalized(cat, "name"))}
            {cat.values.map((v) =>
              renderOpt(pickLocalized(v, "value"), selectedVal === v.id, () =>
                selAndNext(cat.id, v.id),
              ),
            )}
          </>
        );
      }

      if (cat.type === "number") {
        return (
          <>
            {renderTitle(pickLocalized(cat, "name"))}
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => selAndNext(cat.id, n)}
                  className={`aspect-square rounded-2xl border-2 flex items-center justify-center text-xl font-black transition-all active:scale-95 ${
                    selectedVal === n
                      ? "bg-navy text-white border-navy shadow-lg shadow-navy/20"
                      : "bg-white dark:bg-slate-900 text-navy dark:text-slate-200 border-pale dark:border-slate-700"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </>
        );
      }

      if (cat.type === "range") {
        const val = (selectedVal as number) || 50;
        return (
          <>
            {renderTitle(pickLocalized(cat, "name"))}
            <div className="flex flex-col items-center justify-center gap-8 py-10 bg-white dark:bg-slate-900 rounded-3xl border border-pale dark:border-slate-700 shadow-sm">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-blue">{val}</span>
                <span className="text-lg text-gray-400 font-bold">
                  {t("postAd.category.areaUnit")}
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="2000"
                step="5"
                value={val}
                onChange={(e) =>
                  setCategoryValues((prev) => ({
                    ...prev,
                    [cat.id]: parseInt(e.target.value),
                  }))
                }
                className="w-4/5 accent-navy h-2 bg-pale rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between w-4/5 text-xs text-gray-400 font-bold">
                <span>{t("postAd.category.areaWithUnit", { value: 50 })}</span>
                <span>{t("postAd.category.areaWithUnit", { value: 1000 })}</span>
                <span>{t("postAd.category.areaWithUnit", { value: 2000 })}</span>
              </div>
            </div>
          </>
        );
      }
    }

    // COUNTRY step
    if (currentStepInfo.type === "country") {
      return (
        <>
          {renderTitle(t("postAd.location.countryTitle"))}
          <div className="grid grid-cols-2 gap-3">
            {countries.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setCountryId(c.id);
                  setStateId(null);
                  setCityId(null);
                  setTimeout(() => goTo(step + 1), 150);
                }}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all active:scale-95 ${
                  countryId === c.id
                    ? "border-navy bg-navy/5 dark:bg-navy/20"
                    : "border-pale bg-white dark:bg-slate-900 dark:border-slate-700"
                }`}
              >
                <AppImage
                  src={c.image}
                  alt={pickLocalized(c, "name")}
                  className="w-10 h-10"
                  coverClassName="object-contain"
                />
                <span
                  className={`font-bold text-sm ${countryId === c.id ? "text-navy dark:text-blue" : "text-navy dark:text-slate-200"}`}
                >
                  {pickLocalized(c, "name")}
                </span>
              </button>
            ))}
          </div>
        </>
      );
    }

    // STATE step
    if (currentStepInfo.type === "state") {
      if (states.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-gray-400 font-bold text-center">
              {t("postAd.location.noStates")}
            </p>
          </div>
        );
      }
      return (
        <>
          {renderTitle(t("postAd.location.stateTitle"))}
          {states.map((s) =>
            renderOpt(pickLocalized(s, "name"), stateId === s.id, () => {
              setStateId(s.id);
              setCityId(null);
              setTimeout(() => goTo(step + 1), 150);
            }),
          )}
        </>
      );
    }

    // CITY step
    if (currentStepInfo.type === "city") {
      if (cities.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-gray-400 font-bold text-center">
              {t("postAd.location.noCities")}
            </p>
          </div>
        );
      }
      return (
        <>
          {renderTitle(t("postAd.location.cityTitle"))}
          {cities.map((c) =>
            renderOpt(pickLocalized(c, "name"), cityId === c.id, () => {
              setCityId(c.id);
              setTimeout(() => goTo(step + 1), 150);
            }),
          )}
        </>
      );
    }

    // VIDEO step
    if (currentStepInfo.type === "video") {
      return (
        <>
          {renderTitle(t("postAd.video.title"))}
          {videoFile ? (
            <div className="flex flex-col gap-4">
              <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden">
                <video
                  src={URL.createObjectURL(videoFile)}
                  aria-label={t("postAd.video.previewAlt")}
                  className="w-full h-full object-cover"
                />
                {uploadState &&
                  uploadState.status !== "done" &&
                  uploadState.status !== "error" && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 px-4">
                      <SpinnerIcon className="w-8 h-8 text-white animate-spin" />
                      <div className="w-4/5 h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue transition-all duration-300 rounded-full"
                          style={{ width: `${uploadState.progress}%` }}
                        />
                      </div>
                      <span className="text-white text-sm font-bold">
                        {uploadState.status === "merging"
                          ? t("postAd.video.processing")
                          : t("postAd.video.uploadProgress", {
                              percent: uploadState.progress,
                            })}
                      </span>
                      {uploadState.status === "uploading" && (
                        <span
                          className="text-white/70 text-xs font-medium text-center"
                          dir="ltr"
                        >
                          {t("postAd.video.uploadDetail", {
                            uploaded: formatBytes(uploadState.uploadedBytes),
                            total: formatBytes(uploadState.totalBytes),
                          })}
                          {uploadState.bytesPerSecond
                            ? ` · ${formatBytes(uploadState.bytesPerSecond)}/s`
                            : ""}
                          {uploadState.etaSeconds !== null
                            ? ` · ${formatEta(uploadState.etaSeconds)}`
                            : ""}
                        </span>
                      )}
                    </div>
                  )}
                {uploadState?.status === "done" && (
                  <div className="absolute top-3 rtl:right-3 ltr:left-3 bg-green-500 text-white rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1">
                    <CheckIcon className="w-3 h-3" /> {t("postAd.video.uploaded")}
                  </div>
                )}
                {uploadState?.status === "error" && (
                  <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
                    <p className="text-white font-bold text-sm text-center px-4">
                      {uploadState.error}
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setVideoFile(null);
                  resetVideoUpload();
                }}
                className="w-full py-3 text-red-500 border border-red-200 rounded-xl font-bold text-sm active:scale-95 transition-all"
              >
                {t("postAd.video.remove")}
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-4 border-2 border-dashed border-pale dark:border-slate-700 rounded-3xl py-16 cursor-pointer hover:border-navy transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-navy/5 flex items-center justify-center group-hover:bg-navy/10 transition-all">
                <PlayIcon className="w-8 h-8 text-navy dark:text-blue" />
              </div>
              <div className="text-center">
                <p className="font-bold text-navy dark:text-slate-200">
                  {t("postAd.video.choose")}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {t("postAd.video.formats")}
                </p>
              </div>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/quicktime,.mp4,.mov"
                className="hidden"
                onClick={async (e) => {
                  const granted = await checkMediaPermissions();
                  if (!granted) {
                    e.preventDefault();
                    toast.error(t("common.permissionDenied"));
                  }
                }}
                onChange={(e) => {
                  if (e.target.files?.[0]) handleVideoSelect(e.target.files[0]);
                }}
              />
            </label>
          )}
        </>
      );
    }

    // IMAGES step
    if (currentStepInfo.type === "images") {
      return (
        <>
          {renderTitle(t("postAd.images.title"))}
          <div className="grid grid-cols-3 gap-2">
            {images.map((img, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-xl overflow-hidden bg-slate-100"
              >
                <img
                  src={URL.createObjectURL(img)}
                  alt={t("postAd.images.imageAlt", { index: i + 1 })}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() =>
                    setImages((prev) => prev.filter((_, j) => j !== i))
                  }
                  aria-label={t("postAd.images.removeImage")}
                  title={t("postAd.images.removeImage")}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            ))}
            {/* Placeholder tiles for the batch currently being optimised, so
                the grid grows immediately instead of sitting still. */}
            {imageOptimizing &&
              Array.from({
                length: imageOptimizing.total - imageOptimizing.done,
              }).map((_, i) => (
                <div
                  key={`optimizing-${i}`}
                  className="aspect-square rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
                >
                  <SpinnerIcon className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              ))}
            {!imageOptimizing && (
              <label
                aria-label={t("postAd.images.addImages")}
                title={t("postAd.images.addImages")}
                className="aspect-square rounded-xl border-2 border-dashed border-pale dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-navy transition-all"
              >
                <PlusIcon className="w-8 h-8 text-gray-300" />
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp,.jpg,.jpeg,.png,.webp"
                  multiple
                  className="hidden"
                  onClick={async (e) => {
                    const granted = await checkMediaPermissions();
                    if (!granted) {
                      e.preventDefault();
                      toast.error(t("common.permissionDenied"));
                    }
                  }}
                  onChange={(e) => {
                    handleImageSelect(e.target.files);
                  }}
                />
              </label>
            )}
          </div>
          <p className="text-xs text-gray-400 text-center mt-3">
            {imageOptimizing
              ? t("postAd.images.optimizing", {
                  done: imageOptimizing.done + 1,
                  total: imageOptimizing.total,
                })
              : t("postAd.images.selectedCount", { count: images.length })}
          </p>
        </>
      );
    }

    // DETAILS step
    if (currentStepInfo.type === "details") {
      const isPriceInvalid = showErrors && (!price || Number(price) <= 0);
      const isTitleInvalid = showErrors && title.trim().length === 0;
      const isDescInvalid = showErrors && description.trim().length < 10;

      return (
        <div className="flex flex-col gap-5 pb-2" dir={dir}>
          {renderTitle(t("postAd.details.title"))}
          <p className="text-xs text-gray-400 -mt-2 text-start">
            {t("postAd.details.hint")}
          </p>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="ad-price"
              className="font-bold text-navy dark:text-slate-200 text-sm flex items-center justify-between"
            >
              {t("postAd.details.priceLabel")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              id="ad-price"
              ref={priceInputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              enterKeyHint="next"
              autoComplete="off"
              placeholder={t("postAd.details.pricePlaceholder")}
              value={price ? Number(price).toLocaleString("en") : ""}
              onKeyDown={(e) => focusNextField(e, titleInputRef)}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, "");
                setPrice(raw.slice(0, 9));
              }}
              className={`w-full h-14 rounded-2xl border-2 bg-white dark:bg-slate-900 px-5 text-xl font-black text-blue focus:border-navy focus:outline-none transition-colors text-start scroll-mt-3 ${
                isPriceInvalid
                  ? "border-red-500"
                  : "border-pale dark:border-slate-700"
              }`}
            />
            {isPriceInvalid && (
              <p className="text-xs text-red-500 text-start">
                {t("validation.enterPrice")}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="ad-title"
              className="font-bold text-navy dark:text-slate-200 text-sm flex items-center justify-between"
            >
              {t("postAd.details.titleLabel")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              id="ad-title"
              ref={titleInputRef}
              type="text"
              enterKeyHint="next"
              autoComplete="off"
              placeholder={t("postAd.details.titlePlaceholder")}
              value={title}
              onKeyDown={(e) => focusNextField(e, descriptionInputRef)}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full h-14 rounded-2xl border-2 bg-white dark:bg-slate-900 px-5 text-base font-bold text-navy dark:text-slate-200 focus:border-navy focus:outline-none transition-colors scroll-mt-3 ${
                isTitleInvalid
                  ? "border-red-500"
                  : "border-pale dark:border-slate-700"
              }`}
            />
            {isTitleInvalid && (
              <p className="text-xs text-red-500 text-start">
                {t("validation.enterAdTitle")}
              </p>
            )}
          </div>
          <div className="description-field flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-xs font-bold tabular-nums ${
                  descriptionLength >= 10
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-400"
                }`}
              >
                {descriptionLength}/10
              </span>
              <label
                htmlFor="ad-description"
                className="font-bold text-navy dark:text-slate-200 text-sm flex items-center gap-1"
              >
                {t("postAd.details.descriptionLabel")}{" "}
                <span className="text-red-500">*</span>
              </label>
            </div>
            <textarea
              id="ad-description"
              ref={descriptionInputRef}
              rows={4}
              inputMode="text"
              enterKeyHint="done"
              autoCapitalize="sentences"
              autoCorrect="on"
              placeholder={t("postAd.details.descriptionPlaceholder")}
              value={description}
              onFocus={handleDescriptionFocus}
              onBlur={handleDescriptionBlur}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full rounded-2xl border-2 bg-white dark:bg-slate-900 px-5 py-4 text-base font-medium text-navy dark:text-slate-200 focus:border-navy focus:outline-none transition-colors resize-none scroll-mt-3 ${
                isDescInvalid
                  ? "border-red-500"
                  : "border-pale dark:border-slate-700"
              }`}
            />
            {isDescInvalid ? (
              <p className="text-xs text-red-500 text-start">
                {t("validation.descriptionMin10")}
              </p>
            ) : (
              <p className="text-xs text-gray-400 text-start">
                {descriptionLength >= 10
                  ? t("postAd.details.descriptionOk")
                  : t("postAd.details.descriptionMinHint")}
              </p>
            )}
          </div>
        </div>
      );
    }

    if (showEmbedded && sessionInfo) {
      return (
        <div className="animate-scale-in">
          <MyFatoorahPayment
            sessionId={sessionInfo.originalId || sessionInfo.id}
            countryCode={sessionInfo.country}
            encryptionKey={encryptionKey ?? undefined}
            onSuccess={onPaymentSuccess}
            onError={(err) =>
              toast.error(
                t("postAd.payment.errorWithMessage", {
                  message: err.message || t("postAd.payment.operationFailed"),
                }),
              )
            }
          />
        </div>
      );
    }

    // SUMMARY step
    if (currentStepInfo.type === "summary") {
      const countryName = pickLocalized(
        countries.find((c) => c.id === countryId),
        "name",
      );
      const stateName = pickLocalized(
        states.find((s) => s.id === stateId),
        "name",
      );
      const cityName = pickLocalized(
        cities.find((c) => c.id === cityId),
        "name",
      );
      const publishFee = t("postAd.summary.publishFeeValue");
      const emptyValue = t("postAd.summary.emptyValue");

      return (
        <div dir={dir}>
          {renderTitle(t("postAd.summary.title"))}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-pale dark:border-slate-700 shadow-sm flex flex-col gap-4 mb-6">
            {/* Category answers */}
            {categories.map((cat) => {
              const valId = categoryValues[cat.id];
              let displayVal: string = emptyValue;
              if (cat.values && cat.values.length > 0) {
                const found = cat.values.find(
                  (v) => String(v.id) === String(valId),
                );
                displayVal = found
                  ? pickLocalized(found, "value")
                  : valId !== undefined
                    ? String(valId)
                    : emptyValue;
              } else if (valId !== undefined) {
                displayVal =
                  cat.type === "range"
                    ? t("postAd.category.areaWithUnit", {
                        value: String(valId),
                      })
                    : String(valId);
              }
              return (
                <div
                  key={cat.id}
                  className="flex justify-between items-center border-b border-b-pale dark:border-b-slate-700 pb-3 last:border-0 last:pb-0"
                >
                  <span className="text-gray-400 font-bold text-sm">
                    {pickLocalized(cat, "name")}
                  </span>
                  <span className="font-black text-navy dark:text-slate-200">
                    {displayVal}
                  </span>
                </div>
              );
            })}
            {/* Location */}
            <div className="flex justify-between items-center border-b border-b-pale dark:border-b-slate-700 pb-3">
              <span className="text-gray-400 font-bold text-sm">
                {t("postAd.summary.country")}
              </span>
              <span className="font-black text-navy dark:text-slate-200">
                {countryName || emptyValue}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-b-pale dark:border-b-slate-700 pb-3">
              <span className="text-gray-400 font-bold text-sm">
                {t("postAd.summary.state")}
              </span>
              <span className="font-black text-navy dark:text-slate-200">
                {stateName || emptyValue}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-b-pale dark:border-b-slate-700 pb-3">
              <span className="text-gray-400 font-bold text-sm">
                {t("postAd.summary.city")}
              </span>
              <span className="font-black text-navy dark:text-slate-200">
                {cityName || emptyValue}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-bold text-sm">
                {t("postAd.summary.price")}
              </span>
              <span className="font-black text-navy dark:text-slate-200">
                {price
                  ? t("postAd.summary.priceWithCurrency", {
                      price: Number(price).toLocaleString(),
                    })
                  : emptyValue}
              </span>
            </div>

            {/* Publish fee */}
            <div className="mt-2 pt-4 border-t border-dashed border-pale dark:border-slate-700">
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-pale dark:border-slate-700">
                <span className="font-bold text-navy dark:text-slate-200">
                  {t("postAd.summary.publishFeeLabel")}
                </span>
                <span className="text-lg font-black text-blue">
                  {publishFee}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // ── Footer buttons ───────────────────────────────────────────────────────
  const renderFooter = () => {
    if (showEmbedded) return null;

    const backBtn = (
      <button
        onClick={prev}
        disabled={step === 1}
        className={`w-full py-4 rounded-xl font-bold border border-pale dark:border-slate-700 bg-white dark:bg-slate-900 text-navy dark:text-slate-200 transition-all shadow-sm ${
          step === 1
            ? "opacity-40 cursor-not-allowed"
            : "active:scale-95 hover:bg-pale/30"
        }`}
      >
        {t("common.back")}
      </button>
    );

    // Summary step → payment buttons
    if (currentStepInfo?.type === "summary") {
      return (
        <div className="flex flex-col gap-3">
          {backBtn}
          <button
            onClick={handlePublish}
            disabled={isProcessing}
            className="w-full py-4 bg-navy dark:bg-blue text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-navy/20 dark:shadow-blue/20"
          >
            {isProcessing && !showEmbedded ? (
              <SpinnerIcon className="w-5 h-5 animate-spin" />
            ) : (
              <span>{t("postAd.footer.payAndPublish")}</span>
            )}
          </button>
        </div>
      );
    }

    // Steps that need manual Next (range slider, video, images)
    const needsManualNext =
      currentStepInfo?.type === "video" ||
      currentStepInfo?.type === "images" ||
      currentStepInfo?.type === "details" ||
      (currentStepInfo?.type === "category" &&
        currentStepInfo.data.type === "range");

    if (needsManualNext) {
      if (currentStepInfo?.type === "details" && isKeyboardOpen) {
        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={dismissKeyboard}
              className="shrink-0 px-5 py-3.5 rounded-xl font-bold border border-pale dark:border-slate-700 bg-white dark:bg-slate-900 text-navy dark:text-slate-200 active:scale-95 transition-all"
            >
              {t("common.done")}
            </button>
            <button
              type="button"
              onClick={next}
              className={`flex-1 py-3.5 rounded-xl font-bold shadow-lg transition-all ${
                isCurrentStepValid()
                  ? "bg-navy dark:bg-blue text-white shadow-navy/20 active:scale-95"
                  : "bg-gray-200 dark:bg-slate-800 text-gray-400 cursor-not-allowed"
              }`}
            >
              {t("common.next")}
            </button>
          </div>
        );
      }

      return (
        <div className="flex flex-col gap-3">
          {backBtn}
          <button
            onClick={next}
            className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all ${
              isCurrentStepValid()
                ? "bg-navy dark:bg-blue text-white shadow-navy/20 active:scale-95"
                : "bg-gray-200 dark:bg-slate-800 text-gray-400 cursor-not-allowed"
            }`}
          >
            {t("common.next")}
          </button>
        </div>
      );
    }

    // Default: just back button (auto-advance on selection)
    return <div className="w-full">{backBtn}</div>;
  };

  const footerContent = renderFooter();

  // ── Layout ───────────────────────────────────────────────────────────────
  return (
    <div
      className="w-full h-full bg-bg dark:bg-slate-950 flex flex-col relative overflow-hidden"
      dir={dir}
    >
      {/* Progress bar */}
      <div className="px-5 pt-6 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400 font-bold">
            {t("postAd.progress.stepOf", { current: step, total: totalSteps })}
          </span>
          <button
            onClick={onComplete}
            className="text-xs text-gray-400 font-bold hover:text-navy transition-colors"
          >
            {t("common.skip")}
          </button>
        </div>
        <div className="w-full h-1.5 bg-pale dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-navy dark:bg-blue transition-all duration-500 rounded-full"
            style={{
              width: `${totalSteps > 0 ? (step / totalSteps) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Scrollable content */}
      <div
        id="wizard-scroll-area"
        ref={wizardScrollRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar px-5 py-4"
        style={{
          WebkitOverflowScrolling: "touch",
          touchAction: "manipulation",
          overscrollBehavior: "contain",
          paddingBottom:
            descriptionFocused && isKeyboardOpen ? "140px" : isDetailsStep && isKeyboardOpen ? "12px" : "24px",
          scrollPaddingTop: "12px",
          scrollPaddingBottom: descriptionFocused ? "140px" : "12px",
        }}
      >
        <div>{renderStep()}</div>
      </div>

      {footerContent && (
        <div
          ref={footerRef}
          className={`shrink-0 px-5 pt-3 bg-gradient-to-t from-bg dark:from-slate-950 via-bg/95 dark:via-slate-950/95 to-transparent transition-[padding] duration-200 ${
            isDetailsStep && isKeyboardOpen ? "pb-3" : "pb-8"
          }`}
          style={{
            paddingBottom:
              isDetailsStep && isKeyboardOpen
                ? "max(0.75rem, env(safe-area-inset-bottom))"
                : undefined,
          }}
        >
          {footerContent}
        </div>
      )}
    </div>
  );
};

export default AddWizard;
