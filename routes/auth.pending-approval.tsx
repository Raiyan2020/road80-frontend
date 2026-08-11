import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppImage } from "@/components/AppImage";
import { LANG_LABELS, useTranslation } from "@/i18n";

/**
 * Shown after a company/hotel registration is submitted, and when an account
 * that is still `pending` (or was `reject`ed) attempts to log in.
 *
 * Use case 1.1 — «لا يمكن تسجيل الدخول قبل الموافقة». The backend answers
 * `hotel_pending_approval` / `hotel_rejected`; this screen is where the user
 * lands instead of being force-logged-out with a bare toast.
 */
type PendingSearch = {
  /** `reject` swaps the copy to the rejection variant. */
  state?: "pending" | "reject";
};

export const Route = createFileRoute("/auth/pending-approval")({
  validateSearch: (search: Record<string, unknown>): PendingSearch => ({
    state: search.state === "reject" ? "reject" : "pending",
  }),
  component: PendingApprovalPage,
});

function PendingApprovalPage() {
  const { t: tr, dir, lang, toggleLang } = useTranslation();
  const navigate = useNavigate();
  const { state } = Route.useSearch();

  const isRejected = state === "reject";

  return (
    <div
      className="absolute inset-0 bg-bg dark:bg-slate-950 overflow-y-auto overflow-x-hidden no-scrollbar animate-fade-in transition-colors duration-300"
      dir={dir}
    >
      <button
        type="button"
        onClick={toggleLang}
        aria-label={tr("common.language")}
        className="fixed top-[max(1rem,env(safe-area-inset-top))] rtl:left-4 ltr:right-4 z-20 rounded-full border border-pale dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 px-4 py-2 text-sm font-bold text-navy dark:text-slate-100 shadow-sm backdrop-blur active:scale-95 transition-all"
      >
        {LANG_LABELS[lang === "ar" ? "en" : "ar"]}
      </button>

      <div className="flex min-h-full flex-col items-center justify-center gap-8 p-6 max-w-lg mx-auto text-center">
        <div className="w-24 h-24">
          <AppImage
            src="/road-logo.png"
            alt="80road"
            className="w-full h-full drop-shadow-xl"
            coverClassName="object-contain"
          />
        </div>

        <div
          className={`flex h-20 w-20 items-center justify-center rounded-full ${
            isRejected
              ? "bg-red-50 dark:bg-red-500/10"
              : "bg-blue/10 dark:bg-blue/15"
          }`}
          aria-hidden="true"
        >
          <span className="text-4xl">{isRejected ? "⚠️" : "⏳"}</span>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-black tracking-tight text-navy dark:text-slate-100">
            {tr(
              isRejected
                ? "auth.pendingApproval.rejectedTitle"
                : "auth.pendingApproval.title",
            )}
          </h1>
          <p className="px-2 text-sm font-medium leading-relaxed text-gray-500 dark:text-slate-400">
            {tr(
              isRejected
                ? "auth.pendingApproval.rejectedDescription"
                : "auth.pendingApproval.description",
            )}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/auth" })}
            className="h-14 w-full rounded-2xl bg-blue font-bold text-white shadow-sm transition-all active:scale-95"
          >
            {tr("auth.pendingApproval.backToLogin")}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="h-14 w-full rounded-2xl border border-pale bg-white font-bold text-navy transition-all active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {tr("auth.pendingApproval.backToHome")}
          </button>
        </div>
      </div>
    </div>
  );
}
