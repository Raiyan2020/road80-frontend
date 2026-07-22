import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useUpdateSocials } from '../features/account/hooks/useProfile';
import { useSocialPlatforms } from '@/shared/hooks/useSocialPlatforms';
import type { UserSocials } from '@/shared/services/social-platforms.service';
import { SpinnerIcon, CloseIcon } from './Icons';
import { SocialPlatformIcon } from './SocialPlatformIcon';
import { ModalPortal } from './ModalPortal';
import { useTranslation } from '../i18n';

interface SocialLinksDialogProps {
  isOpen: boolean;
  onClose: () => void;
  socials?: UserSocials;
}

const MAX_LINK_LENGTH = 500;

export const SocialLinksDialog: React.FC<SocialLinksDialogProps> = ({
  isOpen,
  onClose,
  socials,
}) => {
  const { t, dir } = useTranslation();
  const { data: platforms = [], isLoading, isError } = useSocialPlatforms();
  const { updateSocials, isUpdating } = useUpdateSocials();

  const [links, setLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    const initial: Record<string, string> = {};
    platforms.forEach((platform) => {
      initial[platform.slug] = socials?.[platform.slug]?.link || '';
    });
    setLinks(initial);
  }, [isOpen, platforms, socials]);

  if (!isOpen) return null;

  const getBackendErrorMessage = (error: unknown) => {
    const fetchError = error as {
      data?: { message?: string; errors?: Record<string, string[]> };
      message?: string;
    };
    const response = fetchError?.data;
    const firstFieldError = response?.errors
      ? Object.values(response.errors).flat().find(Boolean)
      : undefined;

    return response?.message || firstFieldError || fetchError?.message || t('profile.socialsDialog.saveError');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Record<string, string> = {};
    platforms.forEach((platform) => {
      const value = (links[platform.slug] || '').trim();
      const previous = socials?.[platform.slug]?.link || '';
      // Send a slug only when it changed: a value to save, or "" to delete a
      // previously saved link. Untouched slugs are left out so the backend
      // keeps them as-is.
      if (value !== previous) {
        payload[platform.slug] = value;
      }
    });

    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }

    const tooLong = Object.values(payload).some((link) => link.length > MAX_LINK_LENGTH);
    if (tooLong) {
      toast.error(t('validation.linkTooLong', { max: MAX_LINK_LENGTH }));
      return;
    }

    try {
      await updateSocials(payload);
      toast.success(t('profile.socialsDialog.saveSuccess'), { closeButton: true });
      onClose();
    } catch (err) {
      toast.error(getBackendErrorMessage(err), { closeButton: true });
    }
  };

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white dark:bg-slate-900 w-full max-w-sm overflow-y-auto overscroll-contain rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300"
        style={{ maxHeight: 'calc(var(--vh, 1vh) * 90)' }}
        dir={dir}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-navy dark:text-slate-200">{t('profile.socialsDialog.title')}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-navy dark:hover:text-white transition-all active:scale-90"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-10 flex justify-center">
            <SpinnerIcon className="w-8 h-8 text-navy dark:text-blue animate-spin" />
          </div>
        ) : isError || platforms.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400 dark:text-slate-600">
            {t('profile.socialsDialog.loadError')}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 max-h-[45vh] overflow-y-auto no-scrollbar pl-1">
              {platforms.map((platform) => (
                <div key={platform.slug} className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-navy dark:text-slate-200 flex items-center gap-2">
                    <span className="w-6 h-6 shrink-0 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
                      <SocialPlatformIcon
                        slug={platform.slug}
                        image={platform.image}
                        name={platform.name}
                        className="w-4 h-4"
                      />
                    </span>
                    {platform.name}
                  </label>
                  <input
                    type="url"
                    inputMode="url"
                    dir="ltr"
                    maxLength={MAX_LINK_LENGTH}
                    value={links[platform.slug] ?? ''}
                    onChange={(e) =>
                      setLinks((prev) => ({ ...prev, [platform.slug]: e.target.value }))
                    }
                    placeholder={platform.link || t('profile.socialsDialog.linkPlaceholder')}
                    className="h-12 px-4 rounded-xl border border-pale dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 text-navy dark:text-slate-200 text-sm focus:border-navy dark:focus:border-blue transition-all"
                  />
                </div>
              ))}
            </div>

            <p className="text-[11px] text-gray-400 dark:text-slate-600">
              {t('profile.socialsDialog.emptyFieldHint')}
            </p>

            <button
              type="submit"
              disabled={isUpdating}
              className="h-14 bg-navy dark:bg-blue text-white rounded-xl font-bold flex items-center justify-center disabled:opacity-70 active:scale-95 transition-all"
            >
              {isUpdating ? <SpinnerIcon className="w-6 h-6 animate-spin" /> : t('profile.saveChanges')}
            </button>
          </form>
        )}
      </div>
    </div>
    </ModalPortal>
  );
};

export default SocialLinksDialog;
