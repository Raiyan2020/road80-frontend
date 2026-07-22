import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from '../i18n';

function ContactPage() {
  const { t } = useTranslation();
  return <div className="p-6 mt-20 text-center font-bold text-navy">{t('nav.contact')}</div>;
}

export const Route = createFileRoute('/contact')({
  component: ContactPage
});
