import React, { useEffect, useRef, useState } from 'react';
import { SpinnerIcon } from './Icons';
import { useSettings } from '../shared/hooks/useSettings';
import { useTranslation, t as tStatic } from '../i18n';

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

// ── Session-rejection detection ────────────────────────────────────────────
// The v3 SDK surface used here is `sdk.init(config)` plus the single `callback`
// wired below; it exposes no separate session/error channel, and a rejected
// SessionId is only ever surfaced as text rendered inside the MF iframe host.
// So we still have to observe that text — but we match on signals that survive
// localisation instead of the English-only phrases this used to look for.
//
// `SessionId` is a verbatim API field name and stays Latin even when the iframe
// renders Arabic, so on its own it is a reliable signal. Otherwise we require
// BOTH a session word AND an invalidity/expiry word, in either language: that
// keeps ordinary field validation ("card number is not valid" / "رقم البطاقة
// غير صالح") from being misread as a dead session and thrown away.
const SESSION_ID_TOKEN_RE = /session\s*-?_?id/i;
const SESSION_WORD_RE = /session|الجلسة|جلسة/i;
const INVALID_WORD_RE = /not\s+valid|invalid|expired|منتهي|انتهت|غير\s+صالحة|غير\s+صحيحة/i;

const isSessionRejectedText = (text: string): boolean => {
  if (!text) return false;
  if (SESSION_ID_TOKEN_RE.test(text)) return true;
  return SESSION_WORD_RE.test(text) && INVALID_WORD_RE.test(text);
};

// Called from inside the SDK callback — reads the language at call time via the
// non-reactive `t`, so it never freezes to the language at module-eval time.
const translateMyFatoorahError = (msg: string): string => {
  if (!msg) return tStatic('payment.errors.paymentFailed');
  const lowerMsg = msg.toLowerCase();
  if (lowerMsg.includes('card details are invalid or missing')) return tStatic('payment.errors.cardDetailsInvalid');
  if (lowerMsg.includes('card number is invalid')) return tStatic('payment.errors.cardNumberInvalid');
  if (lowerMsg.includes('expiry date is invalid') || lowerMsg.includes('invalid expiry')) return tStatic('payment.errors.expiryInvalid');
  if (lowerMsg.includes('cvv is invalid') || lowerMsg.includes('invalid cvv')) return tStatic('payment.errors.cvvInvalid');
  if (lowerMsg.includes('insufficient funds')) return tStatic('payment.errors.insufficientFunds');
  if (lowerMsg.includes('card has expired') || lowerMsg.includes('expired card')) return tStatic('payment.errors.cardExpired');
  if (lowerMsg.includes('3ds') || lowerMsg.includes('3-d secure') || lowerMsg.includes('authentication failed')) return tStatic('payment.errors.authenticationFailed');
  if (lowerMsg.includes('not permitted to cardholder') || lowerMsg.includes('transaction not permitted')) return tStatic('payment.errors.notPermitted');
  if (lowerMsg.includes('do not honour') || lowerMsg.includes('do not honor')) return tStatic('payment.errors.doNotHonour');
  if (lowerMsg.includes('restricted card')) return tStatic('payment.errors.restrictedCard');
  if (lowerMsg.includes('invalid merchant')) return tStatic('payment.errors.invalidMerchant');
  if (lowerMsg.includes('exceeds') && lowerMsg.includes('limit')) return tStatic('payment.errors.limitExceeded');
  if (lowerMsg.includes('declined')) return tStatic('payment.errors.declined');

  // Unmapped gateway string: never shown to the user (it is English-only SDK
  // text), but kept in the console so new MyFatoorah messages stay diagnosable
  // and can be added to the mapping above.
  console.warn('[MyFatoorah] Unmapped gateway error:', msg);
  return tStatic('payment.errors.gatewayError');
};

const MyFatoorahPayment: React.FC<MyFatoorahPaymentProps> = ({
  sessionId,
  countryCode,
  encryptionKey,
  onSuccess,
  onError,
  onRequestNewSession,
}) => {
  const { t, lang } = useTranslation();
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const containerId = "myfatoorah-embedded-container";
  const initializedForSession = useRef<string | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const hasTriggeredRetry = useRef(false); // prevent infinite retry loop
  const { data: settings } = useSettings();

  // Continuously clear any text selection the user makes (works around cross-origin iframe limitation)
  useEffect(() => {
    const clearSel = () => {
      try { window.getSelection()?.removeAllRanges(); } catch {}
    };

    // Fire on every selection-change and on touch move (prevents drag-select on mobile)
    document.addEventListener('selectionchange', clearSel, true);
    document.addEventListener('touchmove', clearSel, { passive: true, capture: true });

    return () => {
      document.removeEventListener('selectionchange', clearSel, true);
      document.removeEventListener('touchmove', clearSel, true);
    };
  }, []);

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
    // Keyed by session AND language so switching language re-initialises the
    // embedded form in the new language (the SDK has no live-update API).
    if (initializedForSession.current === `${sessionId}|${lang}`) {
      return;
    }

    // Reset retry flag whenever session changes
    hasTriggeredRetry.current = false;

    let isCancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    // Single recovery path for a rejected/expired session, whichever channel
    // reported it (SDK callback or iframe text) — but only auto-retry ONCE.
    const handleSessionRejected = () => {
      observerRef.current?.disconnect();

      if (!hasTriggeredRetry.current && onRequestNewSession) {
        hasTriggeredRetry.current = true; // never auto-retry more than once
        setIsInitialized(false);
        setError(t('payment.errors.sessionExpired'));
        setTimeout(onRequestNewSession, 800);
      } else {
        // If already retried once, just show the error — do NOT loop
        setIsInitialized(false);
        setError(t('payment.errors.sessionInvalid'));
      }
    };

    // Watch for "SessionId is not valid" text injected by MF iframe
    const watchForSessionError = () => {
      const container = document.getElementById(containerId);
      if (!container) return;

      observerRef.current?.disconnect();
      observerRef.current = new MutationObserver(() => {
        const text = container.innerText || '';
        if (isSessionRejectedText(text)) {
          handleSessionRejected();
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
        const cardStyle = {
          direction: 'ltr',
          cardHeight: '300px',
          hideNetworkIcons: false,
          input: {
            color: '#3e689b',
            fontSize: '16px',
            fontFamily: 'sans-serif',
            borderColor: '#e1eaf5',
            borderRadius: '12px',
            inputHeight: '46px',
            inputMargin: '12px',
            placeholder: { color: '#a9c2e0', fontSize: '14px' },
          },
          label: {
            display: true,
            color: '#3e689b',
            fontSize: '13px',
            fontWeight: '600',
          },
          error: { borderColor: '#ef4444' },
          button: {
            useCustomButton: false,
            textContent: t('payment.form.payNow'),
            fontSize: '16px',
            fontFamily: 'sans-serif',
            color: '#ffffff',
            backgroundColor: '#3e689b',
            height: '52px',
            borderRadius: '16px',
            width: '100%',
            margin: '12px 0 0',
            cursor: 'pointer',
            onButtonClicked: () => {
              setIsSubmitting(true);
              setError(null);
            },
          },
          separator: { display: 'none' },
        };

        const config: Record<string, any> = {
          sessionId,
          containerId,
          paymentOptions: ['Card'],
          // Renders MyFatoorah's own labels/validation in the active app language
          language: lang,
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
              const msg = String(response.Error || response.error || '');

              // The SDK's own error channel is the reliable place to catch a
              // rejected/expired session — prefer it over the iframe text
              // observer, which is only a fallback for errors MF renders but
              // never reports back through `callback`.
              if (isSessionRejectedText(msg)) {
                handleSessionRejected();
                return;
              }

              setError(translateMyFatoorahError(msg || tStatic('payment.errors.paymentFailed')));
              onError(response);
            }
          },
          style: cardStyle,
          settings: {
            card: { style: cardStyle },
          },
        };

        // NOTE: encryptionKey is for backend-side verification only.
        // Do NOT pass it to the SDK — it's not a recognized field and may cause validation failure.

        // Log the exact config being sent to MF

        sdk.init(config);
        initializedForSession.current = `${sessionId}|${lang}`;
        setIsInitialized(true);
        setError(null);

        // Start watching for session rejection errors injected by MF
        watchForSessionError();
      } catch (err: any) {
        setError(t('payment.errors.initFailed'));
      }
    };

    retryTimer = setTimeout(initMyFatoorah, 150);

    return () => {
      isCancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      observerRef.current?.disconnect();
    };
  }, [sessionId, countryCode, encryptionKey, lang]);

  const clearSelection = () => {
    window.getSelection()?.removeAllRanges();
  };

  return (
    <div
      id="myfatoorah-payment-lock"
      className="flex flex-col gap-6 w-full animate-fade-in select-none"
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
      onSelect={clearSelection}
      style={{
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      <div className="bg-pale/30 dark:bg-slate-800/50 p-5 rounded-2xl border border-pale dark:border-slate-700">
        <h4 className="text-[13px] font-bold text-navy dark:text-slate-300 mb-5">{t('payment.form.title')}</h4>

        {error && (
          <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-center flex flex-col gap-2">
            <p className="text-[12px] text-red-600 dark:text-red-400 font-medium">{error}</p>
            {onRequestNewSession && (
              <button
                onClick={() => { setError(null); initializedForSession.current = null; onRequestNewSession(); }}
                className="text-[11px] text-navy dark:text-blue underline font-bold"
              >
                {t('common.retry')}
              </button>
            )}
          </div>
        )}

        <div className="relative w-full rounded-2xl border border-pale dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden min-h-[380px] py-3">
          <div id={containerId} className="w-full" />

          {!isInitialized && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white dark:bg-slate-900">
              <SpinnerIcon className="w-7 h-7 text-navy/30 animate-spin" />
              <span className="text-[10px] text-gray-400">{t('payment.status.loadingGateway')}</span>
            </div>
          )}
        </div>

        {isSubmitting && (
          <div className="flex items-center justify-center gap-2 py-3">
            <SpinnerIcon className="w-5 h-5 text-navy/50 animate-spin" />
            <span className="text-[12px] text-gray-500 font-medium">{t('payment.status.processing')}</span>
          </div>
        )}
      </div>

      <div className="flex justify-center items-center gap-5 opacity-40">
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" className="h-2.5 object-contain" alt="Visa" />
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" className="h-4 object-contain" alt="Mastercard" />
        <span className="text-[9px] font-black text-gray-400 border-s border-gray-300 ps-4">KNET</span>
      </div>
      <p className="text-[9px] text-center text-gray-400 font-medium tracking-wide">
        {t('payment.form.securedBy')}
      </p>
    </div>
  );
};

export default MyFatoorahPayment;
