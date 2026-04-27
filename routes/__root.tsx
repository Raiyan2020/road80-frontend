import { createRootRoute, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import React, { useState, useEffect } from 'react';
import SplashScreen from '../components/SplashScreen';
import BottomNavigation from '../components/BottomNavigation';
import Header from '../components/Header';
import { Tab } from '../types';
import { AppContext } from '../components/AppContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { App as CapApp } from '@capacitor/app';
import { initializePushNotifications } from '../shared/utils/notifications';

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

const CATEGORY_NAMES: Record<string, string> = {
  'real-estate': 'الشركات العقارية',
  'construction': 'الشركات الانشائية',
  'contracting': 'شركات المقاولات',
  'decor': 'قسم الديكور',
  'materials': 'مواد البناء'
};

function RootComponent() {
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Eagerly read from Zustand's persisted store to avoid race condition with route guards.
    // Zustand persist format: { state: { user: {...}, isAuthenticated: bool }, version: 0 }
    try {
      const raw = localStorage.getItem('road80_user');
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      // Zustand format
      if (parsed?.state?.isAuthenticated && parsed?.state?.user?.token) return true;
      // Legacy flat format: { token: "..." }
      if (parsed?.token) return true;
      return false;
    } catch {
      return false;
    }
  });
  const location = useLocation();
  const navigate = useNavigate();

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
    } else {
      document.documentElement.classList.remove('dark');
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

        // Navigate to the matched path
        navigateRef.current({ to: path + (search || '') as any, replace: true });
      } catch (e) {
        // Handle deep link error
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

  // Initialize push notifications
  useEffect(() => {
    initializePushNotifications();
  }, []);

  const routePath = location.pathname;
  const isAuthRoute = routePath.startsWith('/auth') || routePath.startsWith('/verify');
  const isStandalonePage = ['/faq', '/terms', '/privacy', '/blogs'].some(p => routePath.startsWith(p));
  const isQuickStart = routePath.startsWith('/quick-start');
  const isProfile = routePath.startsWith('/profile');
  const isCompanies = routePath.startsWith('/companies');
  
  // Use regex to detect listing route: /ad/:id
  const isListingRoute = routePath.startsWith('/ad/');

  // Route guard: redirect unauthenticated users to /auth,
  // and authenticated users away from auth pages to /home.
  // Uses navigateRef to avoid the infinite loop caused by unstable `navigate`.
  useEffect(() => {
    if (showSplash) return;

    if (!isAuthenticated && !isAuthRoute && !isStandalonePage) {
      navigateRef.current({ to: '/auth', replace: true });
    } else if (isAuthenticated && isAuthRoute) {
      navigateRef.current({ to: '/home', replace: true });
    }
    // Only re-run when these values actually change — NOT navigate.
  }, [showSplash, isAuthenticated, isAuthRoute, isStandalonePage, routePath]);

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
      case Tab.COMPANIES: return '/companies/';
      case Tab.ADD: return '/post-ad';
      case Tab.EXPLORE: return '/explore/';
      case Tab.PROFILE: return '/profile';
      default: return '/home';
    }
  };

  const getPageTitle = (tab: Tab): string => {
    switch (tab) {
      case Tab.HOME: return 'الرئيسية';
      case Tab.COMPANIES: return 'الشركات';
      case Tab.ADD: return 'انشر اعلانك';
      case Tab.EXPLORE: return 'اكسبلور';
      case Tab.PROFILE: return 'حسابي';
      default: return '80road';
    }
  };

  const getHeaderProps = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const categoryId = searchParams.get('category');
    const userId = searchParams.get('user');

    if (activeTab === Tab.COMPANIES) {
      if (categoryId) {
        return {
          title: CATEGORY_NAMES[categoryId] || 'الشركات',
          showBack: true,
          onBack: () => navigate({ to: '/companies' })
        };
      } else {
        return {
          title: 'الشركات',
          showBack: true,
          onBack: () => navigate({ to: '/home' })
        };
      }
    }

    if (activeTab === Tab.PROFILE) {
      if (userId && userId !== 'current_user') {
        return {
          title: 'الملف التعريفي',
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

  const handleTabChange = () => {}; 

  return (
    <QueryClientProvider client={queryClient}>
      <AppContext.Provider value={{ theme, setTheme, setIsAuthenticated }}>
        <div 
          className="relative w-full max-w-[430px] mx-auto bg-bg dark:bg-slate-950 sm:rounded-[40px] sm:shadow-2xl overflow-hidden shadow-2xl transition-colors duration-300"
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
                    onTabChange={(tab) => navigate({ to: getRouteForTab(tab) as any })} 
                />
              )}
            </>
          )}
        </div>
        <Toaster position="top-center" richColors />
      </AppContext.Provider>
    </QueryClientProvider>
  );
}
