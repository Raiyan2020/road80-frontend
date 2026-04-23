
import React, { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import BottomNavigation from './components/BottomNavigation';
import HomePage from './features/home/components/HomePage';
import ProfilePage from './components/ProfilePage';
import AddWizard from './components/AddWizard';
import ListingDetailsPage from './components/ListingDetailsPage';
import OfficesPage from './components/OfficesPage';
import ExplorePage from './components/ExplorePage';
import AuthPage from './components/AuthPage';
import QuickWizard from './components/QuickWizard';
import Header from './components/Header';
import { Tab, Listing } from './types';
import { initializePushNotifications } from './shared/utils/notifications';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

// Duplicate category map for Title resolution
const CATEGORY_NAMES: Record<string, string> = {
  'real-estate': 'الشركات العقارية',
  'construction': 'الشركات الانشائية',
  'contracting': 'شركات المقاولات',
  'decor': 'قسم الديكور',
  'materials': 'مواد البناء'
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Eagerly read from localStorage to avoid race condition with route guards
    return !!localStorage.getItem('road80_user');
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Default to Light Mode. Only enable Dark Mode if explicitly saved.
    const saved = localStorage.getItem('road80_theme');
    if (saved === 'dark') {
        return 'dark';
    }
    return 'light';
  });

  // Effect to apply theme class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('road80_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Auth is eagerly initialized above via lazy state initializer.
  // This effect is kept for any future side-effects on mount.

  // Routing Hook
  useEffect(() => {
    const onHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    
    // Initial Route Set if empty
    if (!window.location.hash) {
      window.location.hash = '#/home';
    }

    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Initialize Native Push Notifications
  useEffect(() => {
    initializePushNotifications();
  }, []);

  // Handle Deep Links (Payment Callbacks)
  useEffect(() => {
    const setupDeepLinkListener = async () => {
      CapacitorApp.addListener('appUrlOpen', (event: any) => {
        // Example URL: road80://payment-callback?status=success&paymentId=...
        const url = new URL(event.url);
        
        if (url.host === 'payment-callback') {
            const status = url.searchParams.get('status');
            const paymentId = url.searchParams.get('paymentId');

            // 1. Close the 3DS browser if open
            Browser.close();

            // 2. Navigate based on status using the hash router
            if (status === 'success') {
                window.location.hash = `#/profile?payment=success&id=${paymentId}`;
            } else {
                window.location.hash = '#/profile?payment=failed';
            }
        }
      });
    };

    setupDeepLinkListener();

    return () => {
      // Net-safe cleanup
      CapacitorApp.removeAllListeners();
    };
  }, []);

  // Parse Route
  const routePath = currentHash.replace('#', '').split('?')[0] || '/home';
  const isAuthRoute = ['/auth', '/verify'].includes(routePath);
  const isQuickStart = routePath.startsWith('/quick-start');
  
  // Route Guards
  useEffect(() => {
    if (!showSplash) {
      if (!isAuthenticated && !isAuthRoute) {
        // Not logged in -> Redirect to Auth
        window.location.hash = '#/auth';
      } else if (isAuthenticated && isAuthRoute) {
        // Logged in but on Auth page -> Redirect to Home
        window.location.hash = '#/home';
      }
    }
  }, [showSplash, isAuthenticated, isAuthRoute, routePath]);

  // Determine Logic
  let activeTab = Tab.HOME;
  let listingId: number | null = null;

  if (routePath.startsWith('/home')) activeTab = Tab.HOME;
  else if (routePath.startsWith('/companies')) activeTab = Tab.COMPANIES;
  else if (routePath.startsWith('/post-ad')) activeTab = Tab.ADD;
  else if (routePath.startsWith('/explore')) activeTab = Tab.EXPLORE;
  else if (routePath.startsWith('/profile')) activeTab = Tab.PROFILE;
  else if (routePath.startsWith('/ad/')) {
    activeTab = Tab.PROFILE; 
    const parts = routePath.split('/');
    if (parts.length >= 3) {
      listingId = parseInt(parts[2]);
    }
  }

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

  // Compute Header Props (Title & Back Button)
  const getHeaderProps = () => {
    const params = new URLSearchParams(currentHash.split('?')[1] || '');
    const categoryId = params.get('category');
    const userId = params.get('user');

    if (activeTab === Tab.COMPANIES) {
      if (categoryId) {
        // Sub-page: Company List (Filtered)
        return {
          title: CATEGORY_NAMES[categoryId] || 'الشركات',
          showBack: true,
          onBack: () => window.location.hash = '#/companies'
        };
      } else {
        // Root: Categories
        return {
          title: 'الشركات',
          showBack: true,
          onBack: () => window.location.hash = '#/home'
        };
      }
    }

    if (activeTab === Tab.PROFILE) {
      if (userId && userId !== 'current_user') {
        // Sub-page: Other User/Company Profile
        return {
          title: 'الملف التعريفي',
          showBack: true,
          onBack: () => window.history.back()
        };
      }
    }

    // Default
    return {
      title: getPageTitle(activeTab),
      showBack: false,
      onBack: undefined
    };
  };

  const headerProps = getHeaderProps();

  const handleWizardComplete = () => {
    window.location.hash = '#/profile';
    setLastUpdate(Date.now());
  };

  const handleListingClick = (listing: Listing) => {
    window.location.hash = `#/ad/${listing.id}`;
  };

  const handleBackFromDetails = () => {
    window.history.back();
  };
  
  const handleTabChange = () => {}; 

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    window.location.hash = '#/quick-start';
  };

  const handleQuickWizardComplete = () => {
    window.location.hash = '#/home';
  };

  return (
    <div 
      className="relative w-full max-w-[430px] mx-auto bg-bg dark:bg-slate-950 sm:rounded-[40px] sm:shadow-2xl overflow-hidden shadow-2xl transition-colors duration-300"
      style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
    >
      {showSplash ? (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      ) : (
        <>
          {/* Auth Flow */}
          {(!isAuthenticated || isAuthRoute) ? (
             <AuthPage onLoginSuccess={handleLoginSuccess} />
          ) : (
            /* Protected App Shell */
            <>
              {/* Layer 1: Header */}
              {!listingId && !isQuickStart && (
                <Header 
                  title={headerProps.title} 
                  showBack={headerProps.showBack} 
                  onBack={headerProps.onBack} 
                />
              )}

              {/* Layer 2: Main Content Area */}
              <main 
                className="absolute left-0 right-0 overflow-hidden bg-bg dark:bg-slate-950 animate-fade-in transition-colors duration-300"
                style={{
                  top: (listingId || isQuickStart) ? '0' : 'calc(var(--header-h) + env(safe-area-inset-top))',
                  bottom: (listingId || isQuickStart) ? '0' : 'calc(var(--tab-h) + env(safe-area-inset-bottom))',
                  zIndex: (listingId || isQuickStart) ? 50 : 10
                }}
              >
                 {isQuickStart ? (
                    <QuickWizard onComplete={handleQuickWizardComplete} />
                 ) : listingId ? (
                    <ListingDetailsPage 
                      listingId={listingId}
                      onBack={handleBackFromDetails} 
                    />
                 ) : (
                   <>
                    <div className={`absolute inset-0 ${activeTab === Tab.HOME ? 'block' : 'hidden'}`}>
                      <div className="h-full w-full overflow-y-auto overflow-x-hidden no-scrollbar pb-20">
                        <HomePage theme={theme} onToggleTheme={toggleTheme} />
                      </div>
                    </div>

                    <div className={`absolute inset-0 ${activeTab === Tab.COMPANIES ? 'block' : 'hidden'}`}>
                      <div className="h-full w-full overflow-y-auto overflow-x-hidden no-scrollbar pb-20">
                        <OfficesPage />
                      </div>
                    </div>

                    <div className={`absolute inset-0 ${activeTab === Tab.ADD ? 'block' : 'hidden'}`}>
                       <AddWizard onComplete={handleWizardComplete} />
                    </div>

                    <div className={`absolute inset-0 ${activeTab === Tab.EXPLORE ? 'block' : 'hidden'}`}>
                      <div className="h-full w-full overflow-y-auto overflow-x-hidden no-scrollbar pb-20">
                        <ExplorePage />
                      </div>
                    </div>

                    <div className={`absolute inset-0 ${activeTab === Tab.PROFILE ? 'block' : 'hidden'}`}>
                       <div className="h-full w-full overflow-y-auto overflow-x-hidden no-scrollbar pb-20">
                         <ProfilePage 
                            key={lastUpdate} 
                            onListingClick={handleListingClick}
                         />
                       </div>
                    </div>
                   </>
                 )}
              </main>

              {/* Layer 3: Bottom Navigation */}
              {!listingId && !isQuickStart && (
                <BottomNavigation 
                    activeTab={activeTab} 
                    onTabChange={handleTabChange} 
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default App;
