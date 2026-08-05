import { toast } from "sonner";
import { t } from "@/i18n";

/**
 * Public web origin for shareable links. The app only configures an API host
 * (VITE_API_URL), so the front-facing origin lives here.
 */
const SHARE_ORIGIN = "https://road-80.com";

export const buildShareUrl = (path: string) =>
  `${SHARE_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;

export interface ShareContentOptions {
  title: string;
  text?: string;
  url: string;
}

const copyLink = async (url: string) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    } else {
      // Older WebViews without the async clipboard API.
      const el = document.createElement("textarea");
      el.value = url;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    toast.success(t("common.copiedToClipboard"));
  } catch {
    toast.error(t("common.copyFailed"));
  }
};

/**
 * Opens the platform's native share sheet via the Web Share API.
 *
 * iOS (WKWebView) and mobile browsers get the real native sheet. Android's
 * WebView does not implement navigator.share, so it falls back to copying the
 * link to the clipboard.
 *
 * Must be called directly from a user gesture or the browser will reject it.
 */
export async function shareContent({ title, text, url }: ShareContentOptions) {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch (err) {
      // The user dismissed the sheet — nothing to report.
      if (err instanceof DOMException && err.name === "AbortError") return;
      // Anything else (unsupported payload, blocked gesture) falls through.
    }
  }

  await copyLink(url);
}
