
import React, { useState } from 'react';
import { BellIcon, ChevronRightIcon, MenuIcon, LogoutIcon } from './Icons';
import { useNavigate, Link } from '@tanstack/react-router';
import { useUnreadCount } from '../features/notifications/hooks/use-notifications';

import { useLogout } from '../shared/hooks/useLogout';
import { useContext } from 'react';
import { AppContext } from './AppContext';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, showBack, onBack }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: unreadCountResponse } = useUnreadCount();
  const unreadCount = (unreadCountResponse as any)?.data || (unreadCountResponse as any)?.unread_count || 0;
  const { mutate: logoutMutation } = useLogout();
  const { setIsAuthenticated } = useContext(AppContext);
  
  return (
    <>
    <header 
      className="absolute top-0 left-0 right-0 bg-white dark:bg-slate-900 border-b border-pale dark:border-slate-800 shadow-[0_5px_15px_rgba(0,0,0,0.02)] z-40 flex items-center justify-between px-4 transition-colors duration-300"
      style={{ 
        paddingTop: 'env(safe-area-inset-top)',
        height: 'calc(var(--header-h) + env(safe-area-inset-top))'
      }}
    >
      <div className="w-8 flex items-center justify-center">
        {showBack ? (
          <button 
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center text-navy dark:text-slate-200 active:scale-90 transition-transform -mr-2"
            aria-label="رجوع"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        ) : (
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="w-8 h-8 flex items-center justify-center text-navy dark:text-slate-200 active:scale-90 transition-transform -mr-2"
            aria-label="القائمة"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
        )}
      </div>
      
      <h1 className="text-[24px] font-bold text-navy dark:text-slate-200 truncate max-w-[75%] text-center">
        {title}
      </h1>

      <button 
        onClick={() => navigate({ to: '/notifications' })}
        className="w-8 h-8 flex items-center justify-center text-navy dark:text-slate-200 relative active:scale-95 transition-transform"
        aria-label="التنبيهات"
      >
        <BellIcon className="w-6 h-6" />
        {(unreadCount as number) > 0 && (
          <span className="absolute top-1.5 right-2 w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm ring-2 ring-white dark:ring-slate-900 border border-white/20">
            {(unreadCount as number) > 99 ? '+99' : unreadCount as number}
          </span>
        )}
      </button>
    </header>

    {/* Side Menu Drawer */}
    {isMenuOpen && (
      <div className="fixed inset-0 z-50 flex justify-start" dir="rtl">
         {/* Backdrop */}
         <div 
            className="absolute inset-0 bg-navy/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
         />
         {/* Drawer */}
         <div className="relative w-3/4 max-w-sm h-full bg-white dark:bg-slate-950 shadow-2xl flex flex-col animate-slide-in-right border-l border-pale dark:border-slate-800">
            <div className="p-6 border-b border-pale dark:border-slate-800 flex items-center justify-between">
               <h2 className="text-xl font-bold text-navy dark:text-slate-200">القائمة</h2>
               <button onClick={() => setIsMenuOpen(false)} className="w-8 h-8 flex items-center justify-center text-gray-500 rounded-full bg-gray-100 dark:bg-slate-900">✕</button>
            </div>
             
             <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                {[
                   { title: 'الأسئلة الشائعة', to: '/faq' },
                   { title: 'الشروط والأحكام', to: '/terms' },
                   { title: 'سياسة الخصوصية', to: '/privacy' },
                   { title: 'المدونة', to: '/blogs' },
                   { title: 'تسجيل مكتب كشركة', to: '/auth/register-company' }
                ].map(link => (
                   <Link 
                      key={link.to} 
                      to={link.to}
                      onClick={() => setIsMenuOpen(false)}
                      className="p-4 rounded-xl font-bold text-navy dark:text-slate-200 active:bg-gray-100 dark:active:bg-slate-900 transition-colors flex items-center justify-between"
                   >
                      {link.title}
                      <ChevronRightIcon className="w-4 h-4 opacity-50 rotate-180" />
                   </Link>
                ))}
             </div>

             <div className="p-4 border-t border-pale dark:border-slate-800">
                <button 
                  onClick={() => {
                     logoutMutation();
                     setIsAuthenticated(false);
                     setIsMenuOpen(false);
                  }}
                  className="w-full p-4 rounded-xl font-bold text-red-500 active:bg-red-50 dark:active:bg-red-900/10 transition-colors flex items-center gap-3"
                >
                   <LogoutIcon className="w-6 h-6" />
                   تسجيل الخروج
                </button>
             </div>
          </div>
      </div>
    )}
    </>
  );
};

export default Header;
