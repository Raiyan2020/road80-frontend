import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import Header from '../components/Header';
import { useAboutUs } from '../features/pages/hooks/usePages';
import { useUIStore } from '../stores/ui.store';
import { SpinnerIcon } from '../components/Icons';
import { useTranslation } from '../i18n';

export const Route = createFileRoute('/about')({
  component: AboutPage
});

function AboutPage() {
  const { t, dir } = useTranslation();
  const { data, isLoading } = useAboutUs();

  return (
    <div className="h-full bg-gray-50 dark:bg-slate-950 flex flex-col overflow-hidden" dir={dir}>
      <Header title={t('nav.about')} showBack onBack={() => {
        useUIStore.getState().setMenuOpen(true);
        window.history.back();
      }} />

      <div className="flex-1 p-5 overflow-y-auto" style={{ paddingTop: 'calc(var(--header-h) + env(safe-area-inset-top) + 20px)' }}>
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <SpinnerIcon className="w-8 h-8 animate-spin text-navy dark:text-blue" />
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-pale dark:border-slate-800 text-start">
            {/* Unlike terms/privacy, the about-us payload carries an image. */}
            {data?.image && (
              <img
                src={data.image}
                alt={data.title || t('nav.about')}
                className="w-full max-h-56 object-cover"
              />
            )}
            <div className="p-6">
              <h2 className="text-xl font-bold text-navy dark:text-slate-200 mb-4">
                {data?.title || t('nav.about')}
              </h2>
              <div
                className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed font-medium whitespace-pre-line Prose"
                dangerouslySetInnerHTML={{ __html: data?.description || '' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
