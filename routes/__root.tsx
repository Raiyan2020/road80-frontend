import { createRootRoute, Outlet, useLocation, useNavigate, ScrollRestoration } from '@tanstack/react-router';
import React, { useState, useEffect } from 'react';
import SplashScreen from '../components/SplashScreen';
import BottomNavigation from '../components/BottomNavigation';
import Header from '../components/Header';
import { Tab } from '../types';
import { AppContext } from '../components/AppContext';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import type { PluginListenerHandle } from '@capacitor/core';
import { initializePushNotifications, registerCurrentDevice } from '../shared/utils/notifications';
import { setAppNavigator, navigateToNotification } from '../shared/utils/notification-routing';
import { initSwLangSync } from '../shared/utils/sw-lang';
import { useLangStore } from '../i18n';
import { useUserStore } from '../stores/user.store';
import { useSyncFavorites } from '../features/favorites/hooks/useSyncFavorites';
import { useTranslation, type TranslationKey } from '../i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export const Route = createRootRoute({
  component: RootComponent,
})

const CATEGORY_KEYS = ['real-estate', 'construction', 'contracting', 'decor', 'materials'] as const;

function FavoritesBootstrap() {
  useSyncFavorites();
  return null;
}

/**
 * Query-key prefixes whose responses are rendered by the server in the caller's
 * language (both API clients send `Accept-Language` from `getLang()`), so their
 * cached payloads go stale the moment the language changes.
 *
 * Most of these queries now carry the language in their own key, which already
 * gives them a clean cache entry per language. This list is the safety net for
 * the ones that deliberately do NOT — shared keys like `['profile','my-favorites']`
 * (also read by the id-only favorites sync) and `['social-platforms']` — plus any
 * future query that forgets to key itself.
 *
 * Intentionally omitted: `['profile']` (the user's own name/avatar/socials),
 * auth/session state, and the favorites id set — none of which the server
 * translates.
 */
const LANGUAGE_DEPENDENT_QUERY_PREFIXES: readonly (readonly unknown[])[] = [
  ['listings'],
  ['offices'],
  ['companies'],
  ['departments'],
  ['categories'],
  ['categories-filter'],
  ['post-ad-categories'],
  ['filter-options'],
  ['home-data'],
  ['ads-by-history'],
  ['countries'],
  ['states'],
  ['cities'],
  ['settings'],
  ['social-platforms'],
  ['notifications'],
  ['notifications-unread'],
  ['blogs'],
  ['pages'],
  ['profile', 'my-ads'],
  ['profile', 'my-favorites'],
];

function matchesLanguageDependentPrefix(queryKey: readonly unknown[]): boolean {
  return LANGUAGE_DEPENDENT_QUERY_PREFIXES.some(
    (prefix) =>
      queryKey.length >= prefix.length &&
      prefix.every((segment, i) => queryKey[i] === segment)
  );
}

/**
 * True for cache entries that must be refetched because the language changed.
 *
 * Queries that key themselves by language are excluded: by convention the
 * language is the LAST segment of their key (see features/blogs/hooks and
 * features/pages/hooks for the canonical shape). An entry already tagged with
 * the new language is the one React just mounted and is fetching afresh —
 * invalidating it would fire a second, redundant request. Entries tagged with
 * the outgoing language are observer-less by now, so `refetchType: 'active'`
 * would skip them anyway; leaving them cached makes switching back instant.
 */
function shouldInvalidateForLanguage(
  queryKey: readonly unknown[],
  nextLang: string
): boolean {
  if (!matchesLanguageDependentPrefix(queryKey)) return false;
  return queryKey[queryKey.length - 1] !== nextLang;
}

/**
 * Keeps everything outside React's render tree in step with the chosen
 * language: the service worker's copy of it (for background push), the
 * backend's record of it (for server-sent push), and the React Query cache
 * (whose entries were fetched under the previous `Accept-Language`).
 */
function LanguageBootstrap() {
  const lang = useLangStore((s) => s.lang);
  const queryClient = useQueryClient();
  const previousLang = React.useRef(lang);

  useEffect(() => initSwLangSync(), []);

  useEffect(() => {
    let previous = useLangStore.getState().lang;
    return useLangStore.subscribe((state) => {
      if (state.lang === previous) return;
      previous = state.lang;
      // Re-register so server-sent notifications switch language too.
      // Best-effort: a logged-out or token-less user simply no-ops.
      registerCurrentDevice().catch(() => {});
    });
  }, []);

  // Deliberately an effect (not a store subscription) so it runs *after* React
  // has re-rendered the tree under the new language. By then the queries that
  // key themselves by language have already swapped to their new key, so only
  // the still-mounted, un-keyed queries actually go back to the network — no
  // double-fetch, no refetch storm.
  //
  // Targeted rather than `queryClient.clear()`: clear() would also drop
  // auth/session-shaped caches and force every screen to refetch from scratch.
  // Mutations are untouched — invalidateQueries only ever touches queries — so
  // in-flight uploads (e.g. the chunked video upload, which is plain
  // useState + service calls and not in the query cache at all) keep running.
  useEffect(() => {
    if (previousLang.current === lang) return;
    previousLang.current = lang;

    queryClient.invalidateQueries({
      predicate: (query) => shouldInvalidateForLanguage(query.queryKey, lang),
      refetchType: 'active',
    });
  }, [lang, queryClient]);

  return null;
}

function RootComponent() {
  const [showSplash, setShowSplash] = useState(true);
  // Live subscription to Zustand — forceLogout() and normal logout both update
  // this automatically, which triggers the route guard below.
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Store navigate in a ref so the route guard effect doesn't depend on it.
  // TanStack Router's navigate is NOT referentially stable — putting it in a
  // useEffect dependency array causes infinite re-renders.
  const navigateRef = React.useRef(navigate);
  navigateRef.current = navigate;

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('road80_theme');
    if (saved === 'dark') return 'dark';
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      if (Capacitor.isNativePlatform()) {
        StatusBar.setBackgroundColor({ color: '#020617' }); // slate-950
        StatusBar.setStyle({ style: Style.Dark });
      }
    } else {
      document.documentElement.classList.remove('dark');
      if (Capacitor.isNativePlatform()) {
        StatusBar.setBackgroundColor({ color: '#FFFFFF' });
        StatusBar.setStyle({ style: Style.Light });
      }
    }
    localStorage.setItem('road80_theme', theme);
  }, [theme]);

  // Auth state is eagerly initialized above via lazy state initializer.
  // No need for a separate useEffect to check localStorage.

  // Deep link handler — converts road80:// and https://80road.raiyansoft.net URLs to routes
  useEffect(() => {
    const handleDeepLink = (url: string) => {
      try {
        // Normalize: replace custom scheme with https for URL parsing
        const normalized = url
          .replace('road80://', 'https://road80.app/')
          .replace('http://80road.raiyansoft.net', 'https://road80.app')
          .replace('https://80road.raiyansoft.net', 'https://road80.app');

        const parsed = new URL(normalized);
        const path = parsed.pathname;
        const search = parsed.search;

        // Navigate to the matched path. Any https host resolves here — only the
        // pathname is used — so a corrected backend `share_url` origin
        // (/hotels/:id, /hotels/:id/contents/:contentId) works without changes.
        navigateRef.current({ to: path + (search || '') as any, replace: true });
      } catch (e) {
        // Was silent: a malformed link just failed to navigate with no trace.
        console.error('[deeplink] could not handle url', url, e);
      }
    };

    let listenerHandle: any;
    CapApp.addListener('appUrlOpen', (event) => {
      handleDeepLink(event.url);
    }).then((handle) => {
      listenerHandle = handle;
    });

    return () => {
      listenerHandle?.remove();
    };
  }, []);

  // Let push handlers (plain modules, outside React) drive the router.
  useEffect(() => {
    setAppNavigator((target) => {
      navigateRef.current(target as never);
    });
    return () => setAppNavigator(null);
  }, []);

  // Tapping a native push notification must open what it refers to —
  // «ويمكنه الدخول إلى المحادثة ومتابعتها» (UC 1.6). Without this listener the
  // tap only foregrounded the app and landed the user wherever they left off.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    let handle: PluginListenerHandle | undefined;

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      // Capacitor nests the payload under notification.data.
      navigateToNotification(action?.notification?.data ?? action?.notification);
    })
      .then((h) => {
        // The promise can resolve after unmount; drop it rather than leak.
        if (cancelled) void h.remove();
        else handle = h;
      })
      .catch((error) => {
        console.error('[push] failed to attach action listener', error);
      });

    return () => {
      cancelled = true;
      void handle?.remove();
    };
  }, []);

  // Initialize push notifications and status bar overlay
  useEffect(() => {
    initializePushNotifications();
    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: true });
    }
  }, []);

  const routePath = location.pathname;
  const isAuthRoute = routePath.startsWith('/auth') || routePath.startsWith('/verify');
  // Pages that render their own <Header>. Anything listed here must NOT also get
  // the shell header below, or both stack. Add new self-headed routes here.
  const isStandalonePage = ['/about', '/faq', '/terms', '/privacy', '/blogs'].some(p => routePath.startsWith(p));
  const isQuickStart = routePath.startsWith('/quick-start');
  const isProfile = routePath.startsWith('/profile');
  const isCompanies = routePath.startsWith('/companies');

  // Use regex to detect listing route: /ad/:id
  const isListingRoute = routePath.startsWith('/ad/');
  // Sub-pages that need a back button but use the shell header
  const isNotifications = routePath.startsWith('/notifications');

  // Hotel browsing is publicly viewable: a `share_url` (use case 1.5) is sent to
  // people who are usually signed out, and bouncing them to /auth loses the
  // destination entirely. Read-only hotel routes only — the actions inside them
  // (rate, chat) still check for a signed-in account before rendering.
  const isPublicHotelRoute = routePath === '/hotels' || routePath.startsWith('/hotels/');

  // Route guard: redirect unauthenticated users to /auth,
  // and authenticated users away from auth pages to /home.
  // Uses navigateRef to avoid the infinite loop caused by unstable `navigate`.
  useEffect(() => {
    if (showSplash) return;

    if (!isAuthenticated && !isAuthRoute && !isStandalonePage && !isPublicHotelRoute) {
      // Carry the intended destination so login can return the user to it
      // instead of dropping them on /home — this is what makes a shared link
      // still work if the recipient has to sign in first.
      const intended =
        routePath +
        (typeof window !== 'undefined' ? window.location.search : '');
      navigateRef.current({
        to: '/auth',
        search: intended && intended !== '/' ? { redirect: intended } : undefined,
        replace: true,
      } as never);
    } else if (isAuthenticated && isAuthRoute) {
      navigateRef.current({ to: '/home', replace: true });
    }
    // Only re-run when these values actually change — NOT navigate.
  }, [showSplash, isAuthenticated, isAuthRoute, isStandalonePage, isPublicHotelRoute, routePath]);

  let activeTab = Tab.HOME;
  if (routePath.startsWith('/home')) activeTab = Tab.HOME;
  else if (routePath.startsWith('/companies')) activeTab = Tab.COMPANIES;
  else if (routePath.startsWith('/post-ad')) activeTab = Tab.ADD;
  else if (routePath.startsWith('/explore')) activeTab = Tab.EXPLORE;
  else if (routePath.startsWith('/profile')) activeTab = Tab.PROFILE;
  else if (isListingRoute) activeTab = Tab.PROFILE;

  const getRouteForTab = (tab: Tab) => {
    switch (tab) {
      case Tab.HOME: return '/home';
      case Tab.COMPANIES: return '/companies';
      case Tab.ADD: return '/post-ad';
      case Tab.EXPLORE: return '/explore';
      case Tab.PROFILE: return '/profile';
      default: return '/home';
    }
  };

  const getPageTitle = (tab: Tab): string => {
    switch (tab) {
      case Tab.HOME: return t('nav.home');
      case Tab.COMPANIES: return t('nav.companies');
      case Tab.ADD: return t('nav.postAd');
      case Tab.EXPLORE: return t('nav.explore');
      case Tab.PROFILE: return t('nav.profile');
      default: return '80road';
    }
  };

  const getHeaderProps = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const categoryId = searchParams.get('category');
    const userId = searchParams.get('user');

    // Notifications sub-page → show back button
    if (isNotifications) {
      return {
        title: t('nav.notifications'),
        showBack: true,
        onBack: () => window.history.back()
      };
    }

    if (activeTab === Tab.COMPANIES) {
      if (categoryId) {
        const isKnownCategory = (CATEGORY_KEYS as readonly string[]).includes(categoryId);
        return {
          title: isKnownCategory
            ? t(`nav.categories.${categoryId}` as TranslationKey)
            : t('nav.companies'),
          showBack: true,
          onBack: () => navigate({ to: '/companies/' as any, search: { category: undefined } as any })
        };
      } else {
        return {
          title: t('nav.companies'),
          showBack: true,
          onBack: () => navigate({ to: '/home' })
        };
      }
    }

    if (activeTab === Tab.PROFILE) {
      if (userId && userId !== 'current_user') {
        return {
          title: t('nav.publicProfile'),
          showBack: true,
          onBack: () => window.history.back()
        };
      }
    }

    return {
      title: getPageTitle(activeTab),
      showBack: false,
      onBack: undefined
    };
  };

  const headerProps = getHeaderProps();

  const handleTabChange = () => { };

  return (
    <QueryClientProvider client={queryClient}>
      <FavoritesBootstrap />
      <LanguageBootstrap />
      <AppContext.Provider value={{ theme, setTheme }}>
        <div
          className="relative w-full max-w-[991px] mx-auto bg-bg dark:bg-slate-950 sm:rounded-[40px] sm:shadow-2xl overflow-hidden shadow-2xl transition-colors duration-300"
          style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
        >
          {showSplash ? (
            <SplashScreen onFinish={() => setShowSplash(false)} />
          ) : (
            <>
              {!isListingRoute && !isQuickStart && !isAuthRoute && !isStandalonePage && (
                <Header
                  title={headerProps.title}
                  showBack={headerProps.showBack}
                  onBack={headerProps.onBack}
                />
              )}

              <main
                className="absolute left-0 right-0 overflow-hidden bg-bg dark:bg-slate-950 animate-fade-in transition-colors duration-300"
                style={{
                  top: (isListingRoute || isQuickStart || isAuthRoute || isStandalonePage) ? '0' : 'calc(var(--header-h) + env(safe-area-inset-top))',
                  bottom: (isListingRoute || isQuickStart || isAuthRoute) ? '0' : 'calc(var(--tab-h) + env(safe-area-inset-bottom))',
                  zIndex: (isListingRoute || isQuickStart || isAuthRoute) ? 50 : 10
                }}
              >
                <Outlet />
              </main>

              {!isListingRoute && !isQuickStart && !isAuthRoute && (
                <BottomNavigation
                  activeTab={activeTab}
                  onTabChange={(tab) => navigate({ to: getRouteForTab(tab) as any, search: tab === Tab.COMPANIES ? ({ category: undefined } as any) : undefined })}
                />
              )}
            </>
          )}
        </div>
        <ScrollRestoration />
        <Toaster position="top-center" richColors duration={10000} />
      </AppContext.Provider>
    </QueryClientProvider>
  );
}
