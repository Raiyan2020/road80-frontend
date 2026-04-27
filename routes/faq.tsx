import React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import Header from '../components/Header';
import { useFaqs } from '../features/pages/hooks/usePages';
import { SpinnerIcon } from '../components/Icons';

export const Route = createFileRoute('/faq')({
  component: FaqPage
});

function FaqPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useFaqs();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col pb-24" dir="rtl">
      <Header title="الأسئلة الشائعة" showBack onBack={() => navigate({ to: '..' })} />
      
      <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4" style={{ paddingTop: 'calc(var(--header-h) + env(safe-area-inset-top) + 20px)' }}>
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <SpinnerIcon className="w-8 h-8 animate-spin text-navy dark:text-blue" />
          </div>
        ) : (
          data?.map((faq) => (
             <div key={faq.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-pale dark:border-slate-800 text-right">
                <h3 className="text-lg font-bold text-navy dark:text-slate-200 mb-2">{faq.question}</h3>
                <div 
                  className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed font-medium whitespace-pre-line" 
                  dangerouslySetInnerHTML={{ __html: faq.answer || '' }}
                />
             </div>
          ))
        )}
      </div>
    </div>
  );
}
