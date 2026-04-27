import React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import Header from '../components/Header';
import { usePrivacy } from '../features/pages/hooks/usePages';
import { SpinnerIcon } from '../components/Icons';

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage
});

function PrivacyPage() {
  const navigate = useNavigate();
  const { data, isLoading } = usePrivacy();

  return (
    <div className="h-full bg-gray-50 dark:bg-slate-950 flex flex-col overflow-hidden" dir="rtl">
      <Header title="سياسة الخصوصية" showBack onBack={() => navigate({ to: '..' })} />
      
      <div className="flex-1 p-5 overflow-y-auto" style={{ paddingTop: 'calc(var(--header-h) + env(safe-area-inset-top) + 20px)' }}>
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <SpinnerIcon className="w-8 h-8 animate-spin text-navy dark:text-blue" />
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-pale dark:border-slate-800 text-right">
             <h2 className="text-xl font-bold text-navy dark:text-slate-200 mb-4">{data?.title || 'سياسة الخصوصية'}</h2>
             <div 
               className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed font-medium whitespace-pre-line Prose" 
               dangerouslySetInnerHTML={{ __html: data?.description || '' }}
             />
          </div>
        )}
      </div>
    </div>
  );
}
