import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from '../i18n';

function AboutPage() {
  const { t } = useTranslation();
  return <div className="p-6 mt-20 text-center font-bold text-navy">{t('pages.about.title')}</div>;
}

export const Route = createFileRoute('/about')({
  component: AboutPage
});
