import React from 'react';
import { Link } from '@tanstack/react-router';
import { Tab, NavItem } from '../types';
import { HomeIcon, BuildingIcon, PlusIcon, PlayIcon, UserIcon } from './Icons';

interface BottomNavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const NAV_ITEMS: NavItem[] = [
  { id: Tab.HOME, label: 'الرئيسية', icon: HomeIcon },
  { id: Tab.COMPANIES, label: 'الشركات', icon: BuildingIcon },
  { id: Tab.ADD, icon: PlusIcon, isSpecial: true },
  { id: Tab.EXPLORE, label: 'اكسبلور', icon: PlayIcon },
  { id: Tab.PROFILE, label: 'حسابي', icon: UserIcon },
];

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

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab }) => {
  return (
    <div 
      className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-pale dark:border-slate-800 shadow-[0_-5px_15px_rgba(0,0,0,0.02)] z-40 overflow-visible transition-colors duration-300"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        height: 'calc(var(--tab-h) + env(safe-area-inset-bottom))'
      }}
    >
      <div className="flex justify-between items-center h-full px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          
          if (item.isSpecial) {
            return (
              <Link
                key={item.id}
                to={getRouteForTab(item.id)}
                search={item.id === Tab.ADD ? { step: 1 } : undefined}
                className={`relative -top-6 bg-navy dark:bg-blue text-white rounded-full w-14 h-14 flex items-center justify-center transform transition-all duration-300 active:scale-95 border-4 border-bg dark:border-slate-950 z-50 ${
                  isActive ? 'shadow-[0_0_20px_4px_rgba(5,47,117,0.4)]' : 'shadow-lg'
                }`}
                aria-label="إضافة"
              >
                <item.icon className="w-8 h-8" />
              </Link>
            );
          }

          return (
            <Link
              key={item.id}
              to={getRouteForTab(item.id) as any}
              search={item.id === Tab.COMPANIES ? ({ category: undefined } as any) : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-1 h-full transition-all duration-200 ${
                isActive ? 'text-navy dark:text-blue' : 'text-gray-400 dark:text-slate-600'
              }`}
              aria-label={item.label}
              aria-selected={isActive}
            >
              <item.icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
              <span className={`text-[13px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-2 w-1 h-1 bg-navy dark:bg-blue rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
