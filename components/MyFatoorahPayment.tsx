import React, { useEffect, useRef, useState } from 'react';
import { SpinnerIcon } from './Icons';

interface MyFatoorahPaymentProps {
  sessionId: string;
  countryCode: string;
  encryptionKey?: string;
  isLive?: boolean;
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
  isLive = false,
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

  useEffect(() => {
    if (initializedForSession.current === sessionId) {
      console.log('[MF] Already initialized for session:', sessionId, '— skipping.');
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
            console.error('[MF] ❌ Session rejected. Auto-retrying once...');
            setIsInitialized(false);
            setError('انتهت صلاحية الجلسة، جاري إنشاء جلسة جديدة...');
            setTimeout(onRequestNewSession, 800);
          } else {
            // If already retried once, just show the error — do NOT loop
            console.error('[MF] ❌ Session rejected again after retry. Showing manual error.');
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
        console.warn('[MF] SDK not found, retrying...');
        retryTimer = setTimeout(initMyFatoorah, 500);
        return;
      }
      if (!container) {
        console.warn('[MF] Container not found, retrying...');
        retryTimer = setTimeout(initMyFatoorah, 150);
        return;
      }

      console.log('[MF] SDK methods:', Object.keys(sdk));
      console.log('[MF] raw sessionId from props:', sessionId);
      console.log('[MF] countryCode:', countryCode);
      console.log('[MF] encryptionKey:', encryptionKey ?? '(none)');

      // MyFatoorah's InitiateSession returns a plain UUID (e.g. "601d963a-2f28-ec11-bae9-000d3aaca798")
      // But our backend prepends the country code (e.g. "KWT-601d963a-...")
      // The SDK expects JUST the UUID — countryCode is already a separate config field
      let cleanSessionId = sessionId;
      if (sessionId.includes('-') && sessionId.split('-')[0].length === 3) {
        cleanSessionId = sessionId.substring(4); // Strip "KWT-" prefix
        console.log('[MF] Stripped country prefix. Clean sessionId:', cleanSessionId);
      }

      try {
        const config: Record<string, any> = {
          countryCode,
          sessionId: cleanSessionId,
          cardViewId: containerId,
          callback: (response: any) => {
            console.log('[MF] Callback Response:', response);
            setIsSubmitting(false);

            // MF callback can use either SessionId (camelCase) or sessionId (lowercase)
            // It also sets isSuccess: true on successful payment
            const returnedSessionId = response?.SessionId || response?.sessionId;
            const isSuccess = response?.isSuccess === true || response?.paymentCompleted === true || !!returnedSessionId;

            if (isSuccess && returnedSessionId) {
              onSuccess(returnedSessionId);
            } else if (isSuccess && !returnedSessionId) {
              // payment succeeded but no sessionId in callback — use the original one passed as prop
              onSuccess(sessionId);
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
        console.log('[MF] encryptionKey (for backend only, NOT sent to SDK):', encryptionKey ?? '(none)');

        // Log the exact config being sent to MF
        console.log('[MF] Config being sent to init:', JSON.stringify({
          countryCode: config.countryCode,
          sessionId: config.sessionId,
          cardViewId: config.cardViewId,
          hasCallback: typeof config.callback === 'function',
          hasEncryptionKey: !!config.encryptionKey,
        }));
        console.log('[MF] DOM element check:', document.getElementById(containerId));

        sdk.init(config);
        initializedForSession.current = sessionId;
        setIsInitialized(true);
        setError(null);
        console.log('[MF] ✅ init() called for session:', sessionId);

        // Start watching for session rejection errors injected by MF
        watchForSessionError();
      } catch (err: any) {
        console.error('[MF] Init Error:', err);
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
      console.warn('[MF] Not ready. isInitialized:', isInitialized);
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const submitFn = sdk.submitCardPayment || sdk.submit || sdk.submitCard;
      if (typeof submitFn === 'function') {
        console.log('[MF] Calling submit...');
        submitFn.call(sdk);
      } else {
        console.error('[MF] No submit fn. Keys:', Object.keys(sdk));
        throw new Error('لم يتم العثور على دالة الدفع.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      console.error('[MF] Submit Error:', err);
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
