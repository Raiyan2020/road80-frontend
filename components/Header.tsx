import React, { useState } from "react";
import { BellIcon, ChevronRightIcon, MenuIcon, LogoutIcon } from "./Icons";
import { useNavigate, Link } from "@tanstack/react-router";
import { useUnreadCount } from "../features/notifications/hooks/use-notifications";
import { useLogout } from "../shared/hooks/useLogout";
import { useUIStore } from "../stores/ui.store";
import { useTranslation, LANG_LABELS, type Lang, type TranslationKey } from "../i18n";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, showBack, onBack }) => {
  const navigate = useNavigate();
  const { isMenuOpen, setMenuOpen: setIsMenuOpen } = useUIStore();
  const unreadCount = useUnreadCount().data ?? 0;
  const { mutate: logoutMutation } = useLogout();
  const { t, dir, lang, setLang } = useTranslation();

  return (
    <>
      <header
        className="absolute top-0 left-0 right-0 bg-white dark:bg-slate-950 border-b border-pale dark:border-slate-700 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)] z-40 flex items-center justify-between px-4 transition-colors duration-300"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          height: "calc(var(--header-h) + env(safe-area-inset-top))",
        }}
      >
        <div className="w-8 flex items-center justify-center">
          {showBack ? (
            <button
              onClick={onBack}
              className="w-8 h-8 flex items-center justify-center text-navy dark:text-slate-200 active:scale-90 transition-transform rtl:-mr-2 ltr:-ml-2"
              aria-label={t('common.back')}
            >
              <ChevronRightIcon className="w-6 h-6 rtl:rotate-0 ltr:rotate-180" />
            </button>
          ) : (
            <button
              onClick={() => setIsMenuOpen(true)}
              className="w-8 h-8 flex items-center justify-center text-navy dark:text-slate-200 active:scale-90 transition-transform rtl:-mr-2 ltr:-ml-2"
              aria-label={t('common.menu')}
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          )}
        </div>

        <h1 className="text-[24px] font-bold text-navy dark:text-slate-200 truncate max-w-[75%] text-center">
          {title}
        </h1>

        <button
          onClick={() => navigate({ to: "/notifications" })}
          className="w-10 h-10 flex items-center justify-center text-navy dark:text-slate-200 relative active:scale-95 transition-transform"
          aria-label={t('common.notifications')}
        >
          <BellIcon className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] leading-none font-bold shadow-sm ring-2 ring-white dark:ring-slate-900 border border-white/20">
              {unreadCount > 99 ? "+99" : unreadCount}
            </span>
          )}
        </button>
      </header>

      {/* Side Menu Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-start" dir={dir}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-navy/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          {/* Drawer */}
          <div className="relative w-3/4 max-w-sm h-full bg-white dark:bg-slate-950 shadow-2xl flex flex-col rtl:animate-slide-in-right ltr:animate-slide-in-left rtl:border-l ltr:border-r border-pale dark:border-slate-700">
            <div className="p-6 border-b border-pale dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-navy dark:text-slate-200">
                {t('common.menu')}
              </h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-500 rounded-full bg-gray-100 dark:bg-slate-900"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              {[
                { titleKey: "nav.faq", to: "/faq" },
                { titleKey: "nav.terms", to: "/terms" },
                { titleKey: "nav.privacy", to: "/privacy" },
                { titleKey: "nav.blog", to: "/blogs" },
                //  { titleKey: 'nav.registerCompany', to: '/auth/register-company' }
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMenuOpen(false)}
                  className="p-4 rounded-xl font-bold text-navy dark:text-slate-200 active:bg-gray-100 dark:active:bg-slate-800 border border-transparent dark:border-slate-700/60 transition-colors flex items-center justify-between hover:border-navy/20 dark:hover:border-slate-600"
                >
                  {t(link.titleKey as TranslationKey)}
                  <ChevronRightIcon className="w-4 h-4 opacity-50 rtl:rotate-180 ltr:rotate-0" />
                </Link>
              ))}
            </div>

            {/* Language switcher */}
            <div className="px-4 pb-2">
              <p className="px-1 pb-2 text-sm font-semibold text-gray-500 dark:text-slate-400">
                {t('common.language')}
              </p>
              <div
                role="group"
                aria-label={t('common.language')}
                className="flex gap-2 p-1 rounded-xl bg-gray-100 dark:bg-slate-900"
              >
                {(Object.keys(LANG_LABELS) as Lang[]).map((code) => {
                  const isActive = lang === code;
                  return (
                    <button
                      key={code}
                      onClick={() => setLang(code)}
                      aria-pressed={isActive}
                      className={`flex-1 py-2.5 rounded-lg font-bold transition-all active:scale-95 ${
                        isActive
                          ? 'bg-white dark:bg-slate-700 text-navy dark:text-slate-100 shadow-sm'
                          : 'text-gray-500 dark:text-slate-400'
                      }`}
                    >
                      {LANG_LABELS[code]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-pale dark:border-slate-700">
              <button
                onClick={() => {
                  logoutMutation();
                  setIsMenuOpen(false);
                }}
                className="w-full p-4 rounded-xl font-bold text-red-500 border border-red-200/60 dark:border-red-500/30 bg-red-50/40 dark:bg-red-950/20 active:scale-95 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center gap-3"
              >
                <LogoutIcon className="w-6 h-6" />
                {t('common.logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
