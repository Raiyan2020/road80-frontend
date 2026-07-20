import React, { useState, useRef } from 'react';
import { useEffect } from 'react';
import { useProfile } from '../features/account/hooks/useProfile';
import { SpinnerIcon, CloseIcon } from './Icons';
import { AppImage } from './AppImage';
import { ModalPortal } from './ModalPortal';
import { toast } from 'sonner';

const MIN_NAME_LENGTH = 3;
const MIN_BIO_LENGTH = 4;

export const UpdateProfileDialog: React.FC<{ isOpen: boolean; onClose: () => void; profileData: any }> = ({ isOpen, onClose, profileData }) => {
  const { updateProfile, isUpdating } = useProfile();
  
  const [name, setName] = useState(profileData?.name || '');
  const [bio, setBio] = useState(profileData?.caption || profileData?.bio || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState(profileData?.image || null);
  const [showErrors, setShowErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getBackendErrorMessage = (error: unknown) => {
    const fetchError = error as {
      data?: {
        message?: string;
        errors?: Record<string, string[]>;
      };
      message?: string;
    };
    const response = fetchError?.data;
    const firstFieldError = response?.errors
      ? Object.values(response.errors).flat().find(Boolean)
      : undefined;

    return response?.message || firstFieldError || fetchError?.message || 'حدث خطأ أثناء التحديث';
  };

  useEffect(() => {
    if (!isOpen) return;
    setName(profileData?.name || '');
    setBio(profileData?.caption || profileData?.bio || '');
    setPreviewImage(profileData?.image || null);
    setImageFile(null);
    setShowErrors(false);
  }, [isOpen, profileData]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const isNameValid = name.trim().length >= MIN_NAME_LENGTH;
  const isBioValid = bio.trim().length >= MIN_BIO_LENGTH;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isNameValid || !isBioValid) {
      setShowErrors(true);
      if (!isNameValid) {
        toast.error(`يجب أن يكون طول الاسم ${MIN_NAME_LENGTH} حروف على الأقل`);
      } else if (!isBioValid) {
        toast.error(`يجب أن يكون طول الوصف ${MIN_BIO_LENGTH} حروف على الأقل`);
      }
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('caption', bio);
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    try {
      await updateProfile(formData);
      toast.success('تم تحديث الملف الشخصي بنجاح', { closeButton: true });
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
        dir="rtl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-navy dark:text-slate-200">تحديث الملف الشخصي</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-navy dark:hover:text-white transition-all active:scale-90"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3">
            <div 
              className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-gray-300 overflow-hidden cursor-pointer flex items-center justify-center relative group"
              onClick={() => fileInputRef.current?.click()}
            >
              <AppImage
                src={previewImage}
                alt="Preview"
                className="w-full h-full"
              />
              <div className="absolute inset-0 bg-black/30 items-center justify-center hidden group-hover:flex">
                 <span className="text-white text-xs font-bold">تغيير</span>
              </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-navy dark:text-slate-200 flex items-center justify-between">
              الاسم
              {showErrors && !isNameValid && (
                <span className="text-red-500 text-[10px] font-normal">
                  {MIN_NAME_LENGTH} حروف على الأقل
                </span>
              )}
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className={`h-12 px-4 rounded-xl border bg-gray-50 dark:bg-slate-800/50 text-navy dark:text-slate-200 transition-all ${
                showErrors && !isNameValid ? 'border-red-500 shadow-[0_0_0_1px_#ef4444]' : 'border-pale dark:border-slate-800 focus:border-navy dark:focus:border-blue'
              }`}
              placeholder="أدخل اسمك"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-navy dark:text-slate-200 flex items-center justify-between">
              البايو (الوصف)
              {showErrors && !isBioValid && (
                <span className="text-red-500 text-[10px] font-normal">
                  {MIN_BIO_LENGTH} حروف على الأقل
                </span>
              )}
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              className={`px-4 py-3 rounded-xl border bg-gray-50 dark:bg-slate-800/50 text-navy dark:text-slate-200 min-h-[100px] transition-all ${
                showErrors && !isBioValid ? 'border-red-500 shadow-[0_0_0_1px_#ef4444]' : 'border-pale dark:border-slate-800 focus:border-navy dark:focus:border-blue'
              }`}
              placeholder="اكتب شيئاً عن نفسك..."
            />
          </div>

          <button 
            type="submit" 
            disabled={isUpdating}
            className="h-14 mt-4 bg-navy dark:bg-blue text-white rounded-xl font-bold flex items-center justify-center disabled:opacity-70 active:scale-95 transition-all"
          >
            {isUpdating ? <SpinnerIcon className="w-6 h-6 animate-spin" /> : 'حفظ التغييرات'}
          </button>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};
