import React, { useState, useEffect, useRef } from "react";
import { SpinnerIcon, ChevronRightIcon, PhoneIcon, CloseIcon } from "./Icons";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useLogin } from "@/shared/hooks/useLogin";
import { authService } from "@/shared/services/auth.service";
import { useUserStore } from "@/stores/user.store";

import { useCountries } from "@/shared/hooks/useCountries";
import { usePrivacy, useTerms } from "@/features/pages/hooks/usePages";
import {
  getDevicePushToken,
  getDeviceType,
  registerCurrentDeviceWithRetry,
} from "@/shared/utils/notifications";
import { User } from "@/shared/types/auth";
import { AppImage } from "./AppImage";
import { LANG_LABELS, useTranslation } from "@/i18n";

// Number of local phone digits (without country code) per country_code
const PHONE_DIGITS: Record<string, number> = {
  KW: 8, // Kuwait       e.g. 60071234
  SA: 9, // Saudi Arabia e.g. 501234567
  AE: 9, // UAE          e.g. 501234567
  QA: 8, // Qatar        e.g. 33123456
  BH: 8, // Bahrain      e.g. 33123456
  OM: 8, // Oman         e.g. 91234567
  JO: 9, // Jordan       e.g. 791234567
  EG: 10, // Egypt        e.g. 1001234567
  IQ: 10, // Iraq         e.g. 7701234567
};
const DEFAULT_DIGITS = 10;

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const { t, dir, lang, toggleLang } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [phone, setPhone] = useState("");
  const [countryId, setCountryId] = useState<number>(1);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(30);
  const [pageDialog, setPageDialog] = useState<"terms" | "privacy" | null>(
    null,
  );
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Real API hooks
  const loginMutation = useLogin();
  const loginUser = useUserStore((s) => s.login);
  const { data: countries = [] } = useCountries();
  const { data: termsData, isLoading: isTermsLoading } = useTerms();
  const { data: privacyData, isLoading: isPrivacyLoading } = usePrivacy();

  const selectedCountry = countries.find((c) => c.id === countryId);
  const maxPhoneDigits =
    PHONE_DIGITS[selectedCountry?.country_code ?? "KW"] ?? DEFAULT_DIGITS;

  const routeApprovalError = (payload: any): boolean => {
    const key = payload?.key ?? payload?.data?.key;
    if (key === "hotel_pending_approval" || key === "company_pending_approval") {
      navigate({ to: "/auth/pending-approval", search: { state: "pending" } });
      return true;
    }
    if (key === "hotel_rejected" || key === "company_rejected") {
      navigate({ to: "/auth/pending-approval", search: { state: "reject" } });
      return true;
    }
    return false;
  };

  // Sync route with internal step on mount/route change
  useEffect(() => {
    const handleRoute = () => {
      if (location.pathname === "/verify") {
        const storedPhone = sessionStorage.getItem("temp_auth_phone");
        const storedCountryId = sessionStorage.getItem("temp_auth_country_id");
        if (!storedPhone) {
          navigate({ to: "/auth", replace: true });
          setStep("PHONE");
        } else {
          setStep("OTP");
          setPhone(storedPhone);
          if (storedCountryId) setCountryId(Number(storedCountryId));
        }
      } else {
        setStep("PHONE");
      }
    };

    handleRoute();
  }, [location.pathname, navigate]);

  // Timer logic for OTP
  useEffect(() => {
    let interval: any;
    if (step === "OTP" && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic Validation — must match the country's exact digit count
    if (!phone || phone.length < maxPhoneDigits || isNaN(Number(phone))) {
      setError(t("auth.login.phoneIncomplete", { digits: maxPhoneDigits }));
      return;
    }

    setLoading(true);
    loginMutation.mutate(
      { phone, country_id: countryId },
      {
        onSuccess: (response) => {
          setLoading(false);
          if (response.status) {
            sessionStorage.setItem("temp_auth_phone", phone);
            sessionStorage.setItem("temp_auth_country_id", String(countryId));
            navigate({ to: "/verify", replace: true });
          } else {
            if (routeApprovalError(response)) return;
            setError(response.message || t("auth.login.sendCodeFailed"));
          }
        },
        onError: (err: any) => {
          setLoading(false);
          if (routeApprovalError(err?.data)) return;
          setError(err?.data?.message || t("common.tryAgain"));
        },
      },
    );
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next
    if (value && index < 3) {
      inputs.current[index + 1]?.focus();
    }

    // Clear error on change
    if (error) setError("");
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 4) return;

    setLoading(true);
    setError("");

    try {
      const device_id = getDevicePushToken();
      // Sending OTP Verification payload

      const response = await authService.verifyOtp({
        phone,
        code,
        country_id: countryId,
        device_id: device_id ?? undefined,
        device_type: device_id ? getDeviceType() : undefined,
      });

      if (response.status && response.data) {
        const { user, token } = response.data;
        // Clean up temporary auth data
        sessionStorage.removeItem("temp_auth_phone");
        sessionStorage.removeItem("temp_auth_country_id");
        // Save real token + user to the Zustand store (persisted to localStorage as road80_user)
        loginUser({
          id: user.id,
          phone: user.country_code,
          name: user.name || t("auth.defaultUserName"),
          avatar: user.image,
          token,
        });
        void registerCurrentDeviceWithRetry(token).catch((error) => {
          console.warn("Failed to register push device after login.", error);
        });
        onLoginSuccess(user);
      } else {
        if (routeApprovalError(response)) {
          setLoading(false);
          return;
        }
        setError(response.message || t("auth.verify.invalidCode"));
        setLoading(false);
        setOtp(["", "", "", ""]);
        inputs.current[0]?.focus();
      }
    } catch (err: any) {
      if (routeApprovalError(err?.data)) {
        setLoading(false);
        return;
      }
      setError(err?.data?.message || t("auth.verify.invalidCode"));
      setLoading(false);
      setOtp(["", "", "", ""]);
      inputs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setTimer(30);
    setError("");
    try {
      const response = await authService.resendOtp({
        phone,
        country_id: countryId,
      });
      if (response.status) {
        toast.success(t("auth.verify.resendSuccess"), { closeButton: true });
      } else {
        const message = response.message || t("auth.verify.resendFailed");
        setError(message);
        toast.error(message, { closeButton: true });
      }
    } catch {
      const message = t("auth.verify.resendFailedRetry");
      setError(message);
      toast.error(message, { closeButton: true });
    }
  };

  const closeDialog = () => setPageDialog(null);
  const dialogTitle =
    pageDialog === "terms" ? t("nav.terms") : t("nav.privacy");
  const dialogData = pageDialog === "terms" ? termsData : privacyData;
  const dialogLoading =
    pageDialog === "terms" ? isTermsLoading : isPrivacyLoading;

  return (
    <div className="min-h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-start sm:justify-center relative overflow-y-auto overflow-x-hidden animate-fade-in p-6" dir={dir}>
      <button
        type="button"
        onClick={toggleLang}
        aria-label={t("common.language")}
        className="absolute top-[max(1rem,env(safe-area-inset-top))] rtl:left-4 ltr:right-4 z-20 rounded-full border border-pale dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 px-4 py-2 text-sm font-bold text-navy dark:text-slate-100 shadow-sm backdrop-blur active:scale-95 transition-all"
      >
        {LANG_LABELS[lang === "ar" ? "en" : "ar"]}
      </button>
      {/* Soft Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-blue/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-navy/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content Container */}
      <div className="w-full max-w-[340px] flex flex-col items-center z-10 py-6 sm:py-0">
        {/* Logo */}
        <div className="mb-8">
          <AppImage
            src="/road-logo.png"
            alt="80road"
            className="w-36 h-auto drop-shadow-sm"
            coverClassName="object-contain"
          />
        </div>

        {/* Floating Sheet Card */}
        <div className="w-full bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none p-8 border border-white/60 dark:border-slate-800">
          {/* Header Text */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-navy dark:text-white mb-2">
              {step === "PHONE" ? t("auth.login.title") : t("auth.verify.title")}
            </h1>
            <p className="text-gray-400 dark:text-slate-400 text-xs font-medium">
              {step === "PHONE"
                ? t("auth.login.subtitle")
                : t("auth.verify.codeSentTo", { phone })}
            </p>
          </div>

          {step === "PHONE" ? (
            <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-6">
              {/* Phone Input Group */}
              <div className="flex flex-col gap-3 mb-2">
                <label className="text-sm font-bold text-gray-500 dark:text-slate-400 rtl:text-right ltr:text-left px-2">
                  {t("auth.login.phoneLabel")}
                </label>

                {/* Unified Pill Container */}
                <div
                  dir="ltr"
                  className="flex items-center w-full h-[60px] bg-[#F8FAFC] dark:bg-slate-800 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-navy/10 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] border border-gray-100 dark:border-slate-700"
                >
                  {/* Iso + Phone Code Left Side */}
                  <div className="relative shrink-0 flex items-center h-full px-1 border-r border-gray-200 dark:border-slate-700">
                    <select
                      value={countryId}
                      onChange={(e) => setCountryId(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 text-navy dark:text-slate-200 bg-white dark:bg-slate-900"
                      disabled={loading || countries.length === 0}
                    >
                      {countries.length > 0 ? (
                        countries.map((c) => (
                          <option
                            key={c.id}
                            value={c.id}
                            className="text-navy dark:text-slate-200 bg-white dark:bg-slate-900 font-bold"
                          >
                            {c.country_code || "KW"} {c.phone_code}
                          </option>
                        ))
                      ) : (
                        <option
                          value={1}
                          className="text-navy dark:text-slate-200 bg-white dark:bg-slate-900 font-bold"
                        >
                          KW +965
                        </option>
                      )}
                    </select>
                    <div className="pointer-events-none flex items-center gap-1 text-navy dark:text-blue font-semibold text-sm tracking-wide">
                      <span>
                        {countries.find((c) => c.id === countryId)
                          ?.country_code || "KW"}
                      </span>
                      <span>
                        {countries.find((c) => c.id === countryId)
                          ?.phone_code || "+965"}
                      </span>
                    </div>
                  </div>

                  {/* Phone Input Right Side */}
                  <div className="flex-1 h-full relative text-[9px]">
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        setPhone(raw.slice(0, maxPhoneDigits));
                      }}
                      maxLength={maxPhoneDigits}
                      disabled={loading}
                      className="w-full h-full bg-transparent px-1 text-center font-black text-sm text-navy dark:text-slate-100 tracking-[0.18em] focus:outline-none placeholder-gray-300 dark:placeholder-slate-600"
                      placeholder=""
                      dir="ltr"
                      autoFocus
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-navy text-white rounded-2xl font-bold text-lg shadow-lg shadow-navy/20 hover:bg-blue active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <SpinnerIcon className="w-6 h-6 animate-spin text-white" />
                ) : (
                  t("auth.login.submit")
                )}
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-8">
              {/* OTP Inputs */}
              <div className="flex justify-between items-center px-1" dir="ltr">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className={`w-14 h-16 rounded-2xl border-2 text-center text-2xl font-bold transition-all focus:outline-none focus:ring-4 focus:ring-navy/10 ${
                      digit
                        ? "border-navy bg-white text-navy dark:bg-slate-800 dark:text-blue dark:border-blue"
                        : "border-gray-100 bg-slate-50 text-gray-800 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200"
                    } ${error ? "border-red-500 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50" : ""}`}
                  />
                ))}
              </div>

              <button
                onClick={handleVerify}
                disabled={loading || otp.join("").length !== 4}
                className={`w-full h-14 rounded-2xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                  otp.join("").length === 4
                    ? "bg-navy text-white shadow-navy/20 active:scale-95 hover:bg-blue"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <SpinnerIcon className="w-6 h-6 animate-spin" />
                ) : (
                  t("auth.verify.confirm")
                )}
              </button>

              {/* Resend & Back */}
              <div className="flex flex-col items-center gap-4 -mt-2">
                <button
                  onClick={handleResend}
                  disabled={timer > 0}
                  className={`text-xs font-bold transition-colors ${timer > 0 ? "text-gray-400" : "text-blue hover:text-navy"}`}
                >
                  {timer > 0
                    ? t("auth.verify.resendIn", { seconds: timer })
                    : t("auth.verify.resend")}
                </button>

                <button
                  onClick={() => navigate({ to: "/auth", replace: true })}
                  className="text-xs text-gray-400 hover:text-navy transition-colors py-2 px-4 hover:bg-slate-50 rounded-lg"
                >
                  {t("auth.verify.changePhone")}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-2 p-1 bg-red-50 text-red-500 text-xs font-bold text-center rounded-xl animate-fade-in border border-red-100">
              {error}
            </div>
          )}
        </div>

        {/* Footer Text & Register Company Link */}
        <div className="mt-8 text-center px-4 flex flex-col items-center gap-4 pb-4">
          {/* Register Company Button/Link */}
          <button
            onClick={() => navigate({ to: "/auth/register-company" })}
            className="text-sm font-bold text-navy dark:text-blue hover:text-blue dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-1.5 active:scale-95"
          >
            {t("auth.footer.registerCompanyCta")}
            <ChevronRightIcon className="w-4 h-4 rtl:rotate-180 ltr:rotate-0" />
          </button>

          <p className="text-[13px] text-gray-500 dark:text-slate-400 leading-relaxed opacity-60 hover:opacity-100 transition-opacity relative z-20 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span>{t("auth.footer.consentPrefix")}</span>
            <span
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPageDialog("terms");
              }}
              className="underline cursor-pointer hover:text-navy dark:hover:text-blue relative z-30 pointer-events-auto"
            >
              {t("nav.terms")}
            </span>
            <span>{t("auth.footer.and")}</span>
            <span
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPageDialog("privacy");
              }}
              className="underline cursor-pointer hover:text-navy dark:hover:text-blue relative z-30 pointer-events-auto"
            >
              {t("nav.privacy")}
            </span>
          </p>
        </div>
      </div>

      {pageDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          dir={dir}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeDialog}
          />
          <div className="relative w-full max-w-[420px] max-h-[85dvh] bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl border border-white/60 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-navy dark:text-slate-200">
                {dialogTitle}
              </h2>
              <button
                onClick={closeDialog}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-navy dark:hover:text-white transition-all active:scale-90"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 bg-gray-50/60 dark:bg-slate-950/40">
              {dialogLoading ? (
                <div className="flex justify-center items-center h-48">
                  <SpinnerIcon className="w-8 h-8 animate-spin text-navy dark:text-blue" />
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-pale dark:border-slate-800 rtl:text-right ltr:text-left">
                  <h3 className="text-xl font-bold text-navy dark:text-slate-200 mb-4">
                    {dialogData?.title || dialogTitle}
                  </h3>
                  <div
                    className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed font-medium whitespace-pre-line Prose"
                    dangerouslySetInnerHTML={{
                      __html: dialogData?.description || "",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
