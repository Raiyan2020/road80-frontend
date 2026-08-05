import React from 'react';
import { useTranslation } from '../i18n';

const PlaceholderPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full relative bg-bg animate-fade-in">
      {/* True Center content */}
      <div className="absolute inset-0 flex items-center justify-center p-6 pb-20 pointer-events-none">
        <h1 className="text-4xl font-bold text-navy pointer-events-auto">{t('common.comingSoon')}</h1>
      </div>
      
      {/* Bottom Footer */}
      <div className="absolute bottom-8 left-0 right-0 text-center z-10">
        <p className="text-mid text-sm font-medium opacity-80">
          <a 
            href="https://raiyansoft.net" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:underline hover:text-blue transition-colors"
          >
            {t('common.poweredBy', { name: 'Raiyansoft' })}
          </a>
        </p>
      </div>
    </div>
  );
};

export default PlaceholderPage;
