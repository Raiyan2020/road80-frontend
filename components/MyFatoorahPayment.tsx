import React, { useEffect, useRef, useState } from 'react';
import { SpinnerIcon } from './Icons';
import { useSettings } from '../shared/hooks/useSettings';

interface MyFatoorahPaymentProps {
  sessionId: string;
  countryCode: string;
  encryptionKey?: string;
  // isLive is intentionally removed — environment (demo/live) is controlled server-side via settings.payment_live
  onSuccess: (sessionId: string) => void;
  onError: (error: any) => void;
  onRequestNewSession?: () => void; // called when session is rejected — parent should fetch a new one
}

declare global {
  interface Window {
    myFatoorah?: any;
    myfatoorah?: any;
  }
}

const getSDK = () => window.myFatoorah || window.myfatoorah || null;

const MyFatoorahPayment: React.FC<MyFatoorahPaymentProps> = ({
  sessionId,
  countryCode,
  encryptionKey,
  onSuccess,
  onError,
  onRequestNewSession,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const containerId = "myfatoorah-embedded-container";
  const initializedForSession = useRef<string | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const hasTriggeredRetry = useRef(false); // prevent infinite retry loop
  const { data: settings } = useSettings();

  useEffect(() => {
    if (settings === undefined) return;
    
    const scriptId = 'myfatoorah-sdk';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    const paymentLive = settings?.payment_live === 1;
    const scriptSrc = paymentLive 
      ? 'https://portal.myfatoorah.com/sessions/v1/session.js'
      : 'https://demo.myfatoorah.com/sessions/v1/session.js';

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = scriptSrc;
      document.head.appendChild(script);
    } else if (script.src !== scriptSrc) {
      script.remove();
      script = document.createElement('script');
      script.id = scriptId;
      script.src = scriptSrc;
      document.head.appendChild(script);
    }
  }, [settings]);

  useEffect(() => {
    if (initializedForSession.current === sessionId) {
      return;
    }

    // Reset retry flag whenever session changes
    hasTriggeredRetry.current = false;

    let isCancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    // Watch for "SessionId is not valid" text injected by MF iframe — but only retry ONCE
    const watchForSessionError = () => {
      const container = document.getElementById(containerId);
      if (!container) return;

      observerRef.current?.disconnect();
      observerRef.current = new MutationObserver(() => {
        const text = container.innerText || '';
        if (text.includes('not valid') || text.includes('SessionId') || text.includes('expired')) {
          observerRef.current?.disconnect();
          
          if (!hasTriggeredRetry.current && onRequestNewSession) {
            hasTriggeredRetry.current = true; // never auto-retry more than once
            setIsInitialized(false);
            setError('انتهت صلاحية الجلسة، جاري إنشاء جلسة جديدة...');
            setTimeout(onRequestNewSession, 800);
          } else {
            // If already retried once, just show the error — do NOT loop
            setIsInitialized(false);
            setError('جلسة الدفع غير صالحة. تأكد من تفعيل الدفع المدمج في حسابك على MyFatoorah.');
          }
        }
      });
      observerRef.current.observe(container, { childList: true, subtree: true, characterData: true });
    };

    const initMyFatoorah = () => {
      if (isCancelled) return;

      const sdk = getSDK();
      const container = document.getElementById(containerId);

      if (!sdk) {
        retryTimer = setTimeout(initMyFatoorah, 500);
        return;
      }
      if (!container) {
        retryTimer = setTimeout(initMyFatoorah, 150);
        return;
      }


      // v3 API: SessionId includes country prefix (e.g. "KWT-68814db6-...") — pass it as-is
      // v3 config uses 'containerId' (not 'cardViewId'), and no separate 'countryCode' needed

      try {
        const config: Record<string, any> = {
          sessionId,
          containerId: containerId,
          callback: (response: any) => {
            setIsSubmitting(false);

            // v3 callback structure:
            // { isSuccess, sessionId, paymentCompleted, paymentId, paymentData, paymentType, redirectionUrl }
            const isSuccess = response?.isSuccess === true;
            const paymentCompleted = response?.paymentCompleted === true;
            
            // paymentId is the MF numeric ID needed for /payments/verify
            const mfPaymentId = response?.paymentId;
            
            // Also try extracting from redirectionUrl as fallback
            // e.g. https://demo.MyFatoorah.com/...?paymentId=07076389179322432673
            let fallbackPaymentId = mfPaymentId;
            if (!fallbackPaymentId && response?.redirectionUrl) {
              const match = response.redirectionUrl.match(/[?&]paymentId=([^&]+)/);
              if (match) fallbackPaymentId = match[1];
            }


            if (isSuccess && (paymentCompleted || fallbackPaymentId)) {
              // Pass the MF paymentId to parent — backend needs this for /payments/verify
              onSuccess(fallbackPaymentId || sessionId);
            } else if (response?.Error || response?.error) {
              const msg = response.Error || response.error || 'فشل الدفع';
              setError(msg);
              onError(response);
            }
          },
          style: {
            hideCardIcons: false,
            direction: 'ltr',
            cardHeight: 220,
            input: {
              color: '#3e689b',
              fontSize: '16px',
              fontFamily: 'sans-serif',
              placeholder: { color: '#a9c2e0', fontSize: '14px' },
            },
            label: { display: false, color: '#3e689b', fontSize: '14px', fontWeight: 'bold' },
            error: { borderColor: '#ef4444' },
          },
        };

        // NOTE: encryptionKey is for backend-side verification only.
        // Do NOT pass it to the SDK — it's not a recognized field and may cause validation failure.

        // Log the exact config being sent to MF

        sdk.init(config);
        initializedForSession.current = sessionId;
        setIsInitialized(true);
        setError(null);

        // Start watching for session rejection errors injected by MF
        watchForSessionError();
      } catch (err: any) {
        setError('فشل تهيئة نظام الدفع. يرجى المحاولة لاحقاً.');
      }
    };

    retryTimer = setTimeout(initMyFatoorah, 150);

    return () => {
      isCancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      observerRef.current?.disconnect();
    };
  }, [sessionId, countryCode, encryptionKey]);

  const handlePay = () => {
    const sdk = getSDK();
    if (!sdk || !isInitialized) {
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const submitFn = sdk.submitCardPayment || sdk.submit || sdk.submitCard;
      if (typeof submitFn === 'function') {
        submitFn.call(sdk);
      } else {
        throw new Error('لم يتم العثور على دالة الدفع.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(`خطأ: ${err.message || 'فشل معالجة الدفع'}`);
      onError(err);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full animate-fade-in">
      <div className="bg-pale/30 dark:bg-slate-800/50 p-4 rounded-2xl border border-pale dark:border-slate-700">
        <h4 className="text-[13px] font-bold text-navy dark:text-slate-300 mb-3">تفاصيل الدفع الآمن</h4>

        {error && (
          <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-center flex flex-col gap-2">
            <p className="text-[12px] text-red-600 dark:text-red-400 font-medium">{error}</p>
            {onRequestNewSession && (
              <button
                onClick={() => { setError(null); initializedForSession.current = null; onRequestNewSession(); }}
                className="text-[11px] text-navy dark:text-blue underline font-bold"
              >
                إعادة المحاولة
              </button>
            )}
          </div>
        )}

        {/* MF SDK injects its iframe here */}
        <div
          id={containerId}
          style={{ minHeight: isInitialized ? 220 : 0 }}
          className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-pale dark:border-slate-800 overflow-hidden transition-all"
        />

        {!isInitialized && !error && (
          <div className="flex flex-col items-center gap-2 py-6">
            <SpinnerIcon className="w-7 h-7 text-navy/30 animate-spin" />
            <span className="text-[10px] text-gray-400">جاري تحميل نظام الدفع...</span>
          </div>
        )}
      </div>

      <button
        onClick={handlePay}
        disabled={isSubmitting || !isInitialized}
        className={`w-full py-4 rounded-2xl font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg ${
          isSubmitting || !isInitialized
            ? 'bg-gray-200 dark:bg-slate-800 text-gray-400 cursor-not-allowed shadow-none'
            : 'bg-navy dark:bg-blue text-white shadow-navy/20'
        }`}
      >
        {isSubmitting ? (
          <><SpinnerIcon className="w-5 h-5 animate-spin" /><span>جاري معالجة الدفع...</span></>
        ) : (
          <span>ادفع الآن</span>
        )}
      </button>

      <div className="flex justify-center items-center gap-5 opacity-40">
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" className="h-2.5 object-contain" alt="Visa" />
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" className="h-4 object-contain" alt="Mastercard" />
        <span className="text-[9px] font-black text-gray-400 border-l border-gray-300 pl-4">KNET</span>
      </div>
      <p className="text-[9px] text-center text-gray-400 font-medium tracking-wider uppercase">
        Secure Payment Powered by MyFatoorah
      </p>
    </div>
  );
};

export default MyFatoorahPayment;
