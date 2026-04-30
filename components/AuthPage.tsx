import React, { useState, useEffect, useRef } from "react";
import { SpinnerIcon, ChevronRightIcon, PhoneIcon } from "./Icons";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useLogin } from "@/shared/hooks/useLogin";
import { authService } from "@/shared/services/auth.service";
import { useUserStore } from "@/stores/user.store";

import { useCountries } from "@/shared/hooks/useCountries";
import { getDeviceId } from "@/shared/utils/notifications";
import { User } from "@/shared/types/auth";

// Number of local phone digits (without country code) per country_code
const PHONE_DIGITS: Record<string, number> = {
  KW: 8,  // Kuwait       e.g. 60071234
  SA: 9,  // Saudi Arabia e.g. 501234567
  AE: 9,  // UAE          e.g. 501234567
  QA: 8,  // Qatar        e.g. 33123456
  BH: 8,  // Bahrain      e.g. 33123456
  OM: 8,  // Oman         e.g. 91234567
  JO: 9,  // Jordan       e.g. 791234567
  EG: 10, // Egypt        e.g. 1001234567
  IQ: 10, // Iraq         e.g. 7701234567
};
const DEFAULT_DIGITS = 10;

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [phone, setPhone] = useState("");
  const [countryId, setCountryId] = useState<number>(1);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(30);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Real API hooks
  const loginMutation = useLogin();
  const loginUser = useUserStore((s) => s.login);
  const { data: countries = [] } = useCountries();

  const selectedCountry = countries.find((c) => c.id === countryId);
  const maxPhoneDigits = PHONE_DIGITS[selectedCountry?.country_code ?? 'KW'] ?? DEFAULT_DIGITS;

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
      setError(`يرجى إدخال رقم الهاتف كاملاً (${maxPhoneDigits} أرقام)`);
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
            setError(response.message || "فشل إرسال الرمز");
          }
        },
        onError: (err: any) => {
          setLoading(false);
          setError(err?.data?.message || "حدث خطأ، يرجى المحاولة مجدداً");
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
      const device_id = getDeviceId();
      // Sending OTP Verification payload

      const response = await authService.verifyOtp({
        phone,
        code,
        country_id: countryId,
        device_id: device_id,
        device_type: "web",
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
          name: user.name || "مستخدم",
          avatar: user.image,
          token,
        });
        onLoginSuccess(user);
      } else {
        setError(response.message || "رمز التفعيل غير صحيح");
        setLoading(false);
        setOtp(["", "", "", ""]);
        inputs.current[0]?.focus();
      }
    } catch (err: any) {
      setError(err?.data?.message || "رمز التفعيل غير صحيح");
      setLoading(false);
      setOtp(["", "", "", ""]);
      inputs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setTimer(30);
    try {
      const response = await authService.resendOtp({
        phone,
        country_id: countryId,
      });
      if (!response.status) {
        setError(response.message || "فشل إعادة الإرسال");
      }
    } catch {
      setError("فشل إعادة الإرسال، حاول مرة أخرى");
    }
  };

  return (
    <div className="min-h-full w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden animate-fade-in p-6">
      {/* Soft Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-blue/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-navy/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content Container */}
      <div className="w-full max-w-[340px] flex flex-col items-center z-10">
        {/* Logo */}
        <div className="mb-8">
          <img
            src="https://raiyansoft.com/wp-content/uploads/2026/02/sg54.png"
            className="w-32 h-auto drop-shadow-sm"
            alt="Logo"
          />
        </div>

        {/* Floating Sheet Card */}
        <div className="w-full bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none p-8 border border-white/60 dark:border-slate-800">
          {/* Header Text */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-navy dark:text-white mb-2">
              {step === "PHONE" ? "تسجيل الدخول" : "التحقق"}
            </h1>
            <p className="text-gray-400 dark:text-slate-400 text-xs font-medium">
              {step === "PHONE"
                ? "أهلاً بك في منصة 80road العقارية"
                : `تم إرسال رمز التفعيل إلى ${phone}`}
            </p>
          </div>

          {step === "PHONE" ? (
            <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-6">
              {/* Phone Input Group */}
              <div className="flex flex-col gap-3 mb-2">
                <label className="text-sm font-bold text-gray-500 dark:text-slate-400 text-right px-2">
                  رقم الهاتف
                </label>

                {/* Unified Pill Container */}
                <div
                  dir="ltr"
                  className="flex items-center w-full h-[60px] bg-[#F8FAFC] dark:bg-slate-800 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-navy/10 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] border border-gray-100 dark:border-slate-700"
                >
                  {/* Iso + Phone Code Left Side */}
                  <div className="relative shrink-0 flex items-center h-full px-5 border-r border-gray-200 dark:border-slate-700">
                    <select
                      value={countryId}
                      onChange={(e) => setCountryId(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      disabled={loading || countries.length === 0}
                    >
                      {countries.length > 0 ? (
                        countries.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.country_code || "KW"} {c.phone_code}
                          </option>
                        ))
                      ) : (
                        <option value={1}>KW +965</option>
                      )}
                    </select>
                    <div className="pointer-events-none flex items-center gap-1 text-navy dark:text-blue font-semibold text-[11px] tracking-wide">
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
                  <div className="flex-1 h-full relative">
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        setPhone(raw.slice(0, maxPhoneDigits));
                      }}
                      maxLength={maxPhoneDigits}
                      disabled={loading}
                      className="w-full h-full bg-transparent px-4 text-center font-black text-[28px] text-navy dark:text-slate-100 tracking-[0.18em] focus:outline-none placeholder-gray-300 dark:placeholder-slate-600"
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
                  "إرسال رمز التفعيل"
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
                  "تأكيد"
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
                    ? `إعادة الإرسال بعد ${timer} ثانية`
                    : "إعادة إرسال الرمز"}
                </button>

                <button
                  onClick={() => navigate({ to: "/auth", replace: true })}
                  className="text-xs text-gray-400 hover:text-navy transition-colors py-2 px-4 hover:bg-slate-50 rounded-lg"
                >
                  تغيير رقم الهاتف
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-500 text-xs font-bold text-center rounded-xl animate-fade-in border border-red-100">
              {error}
            </div>
          )}
        </div>

        {/* Footer Text & Register Company Link */}
        <div className="mt-8 text-center px-4 flex flex-col items-center gap-4">
          {/* Register Company Button/Link */}
          <button
            onClick={() => navigate({ to: "/auth/register-company" })}
            className="text-sm font-bold text-navy dark:text-blue hover:text-blue dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-1.5 active:scale-95"
          >
            إنشاء حساب مكتب عقاري / شركة
            <ChevronRightIcon className="w-4 h-4 rotate-180" />
          </button>

           <p className="text-[13px] text-gray-500 dark:text-slate-400 leading-relaxed opacity-60 hover:opacity-100 transition-opacity relative z-20">
              بتسجيل الدخول فإنك توافق على
              <span 
                onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   navigate({ to: '/terms' as any });
                }}
                className="underline cursor-pointer hover:text-navy dark:hover:text-blue mx-1 relative z-30 pointer-events-auto"
              >
                الشروط والأحكام
              </span>
              و
              <span 
                onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   navigate({ to: '/privacy' as any });
                }}
                className="underline cursor-pointer hover:text-navy dark:hover:text-blue mx-1 relative z-30 pointer-events-auto"
              >
                سياسة الخصوصية
              </span>
           </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
