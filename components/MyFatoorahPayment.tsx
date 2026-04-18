import React, { useEffect, useState, useRef } from 'react';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';

interface MyFatoorahPaymentProps {
  sessionId: string;
  countryCode: string; // e.g., 'KWT', 'SAU'
  isLive?: boolean;
  onSuccess: (paymentId: string) => void;
  onError: (error: any) => void;
}

declare global {
  interface Window {
    myFatoorah?: any;
  }
}

const MyFatoorahPayment: React.FC<MyFatoorahPaymentProps> = ({
  sessionId,
  countryCode,
  isLive = false,
  onSuccess,
  onError,
}) => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerId = "myfatoorah-embedded-container";
  const scriptId = "myfatoorah-session-script";

  useEffect(() => {
    // 1. Load the MyFatoorah Session Script
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = isLive 
        ? "https://portal.myfatoorah.com/sessions/v1/session.js"
        : "https://demo.myfatoorah.com/sessions/v1/session.js";
      script.async = true;
      script.onload = () => setIsScriptLoaded(true);
      script.onerror = () => {
          setError("Failed to load payment library.");
          onError("Script load error");
      };
      document.body.appendChild(script);
    } else {
      setIsScriptLoaded(true);
    }

    // 2. Cleanup (Optional: keep script if reused, but remove if strict)
    return () => {
        // You can remove the script if needed, but usually better to keep it cached
    };
  }, [isLive, onError]);

  useEffect(() => {
    if (isScriptLoaded && window.myFatoorah && sessionId) {
      try {
        const config = {
          countryCode: countryCode,
          sessionId: sessionId,
          cardViewId: containerId,
          // Custom styles can be added here
          style: {
              direction: 'ltr',
              cardHeight: 250,
          },
          onTokenized: (token: string) => {
              console.log("Token received:", token);
              // Handle the token - typically you send this to your backend's ExecutePayment
              // If your backend returns a 3DS URL, we handle it with Capacitor Browser
          }
        };

        window.myFatoorah.init(config);
      } catch (err) {
        console.error("MyFatoorah Init Error:", err);
        setError("Initialization failed.");
      }
    }
  }, [isScriptLoaded, sessionId, countryCode]);

  const handlePay = async () => {
    if (!window.myFatoorah) return;

    window.myFatoorah.submit()
      .then(async (response: any) => {
        // This is where you get the token/session to execute the payment
        const token = response.sessionId;
        
        // CUSTOM LOGIC: Call your backend ExecutePayment here
        // const result = await api.executePayment({ sessionId: token, ... });
        // if (result.PaymentURL) {
        //    await Browser.open({ url: result.PaymentURL });
        // }
        
        // Note: For this component, we trigger a callback so the parent handles the API call
        onSuccess(token); 
      })
      .catch((err: any) => {
        console.error("Payment Error:", err);
        onError(err);
      });
  };

  return (
    <div className="myfatoorah-payment-wrapper p-4 bg-white rounded-xl shadow-sm">
      {error && <div className="text-red-500 mb-4 text-sm font-medium">{error}</div>}
      
      {/* The container where session.js injects the iframe */}
      <div id={containerId} className="min-h-[200px] border border-gray-100 rounded-lg overflow-hidden">
         {!isScriptLoaded && (
           <div className="flex items-center justify-center p-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
           </div>
         )}
      </div>

      <button
        onClick={handlePay}
        disabled={!isScriptLoaded || !!error}
        className="w-full mt-6 py-4 bg-primary text-white font-bold rounded-xl active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100"
      >
        Pay Now
      </button>
      
      <p className="text-xs text-gray-400 text-center mt-4">
        Secure payment processed by MyFatoorah
      </p>
    </div>
  );
};

export default MyFatoorahPayment;
