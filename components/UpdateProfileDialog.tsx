import React, { useState, useRef } from 'react';
import { useProfile } from '../features/account/hooks/useProfile';
import { SpinnerIcon } from './Icons';
import { toast } from 'sonner';

export const UpdateProfileDialog: React.FC<{ isOpen: boolean; onClose: () => void; profileData: any }> = ({ isOpen, onClose, profileData }) => {
  const { updateProfile, isUpdating } = useProfile();
  
  const [name, setName] = useState(profileData?.name || '');
  const [bio, setBio] = useState(profileData?.bio || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState(profileData?.image || null);
  const [showErrors, setShowErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isNameValid = name.trim().length >= 3;
    const isBioValid = bio.trim().length >= 10;

    if (!isNameValid || !isBioValid) {
      setShowErrors(true);
      if (!isNameValid) {
        toast.error('يجب أن يكون طول الاسم 3 حروف على الأقل');
      } else if (!isBioValid) {
        toast.error('يجب أن يكون طول الوصف 10 حروف على الأقل');
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
      toast.success('تم تحديث الملف الشخصي بنجاح');
      onClose();
    } catch (err) {
      toast.error("حدث خطأ أثناء التحديث");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300" dir="rtl">
        <h2 className="text-xl font-bold text-navy dark:text-slate-200 mb-6">تحديث الملف الشخصي</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3">
            <div 
              className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-gray-300 overflow-hidden cursor-pointer flex items-center justify-center relative group"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewImage ? (
                <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                 <span className="text-xs text-gray-400">اختر صورة</span>
              )}
              <div className="absolute inset-0 bg-black/30 items-center justify-center hidden group-hover:flex">
                 <span className="text-white text-xs font-bold">تغيير</span>
              </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-navy dark:text-slate-200 flex items-center justify-between">
              الاسم <span className="text-red-500 text-[10px]">* 3 حروف على الأقل</span>
            </label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className={`h-12 px-4 rounded-xl border bg-gray-50 dark:bg-slate-800/50 text-navy dark:text-slate-200 transition-all ${
                showErrors && name.trim().length < 3 ? 'border-red-500 shadow-[0_0_0_1px_#ef4444]' : 'border-pale dark:border-slate-800 focus:border-navy dark:focus:border-blue'
              }`} 
              placeholder="أدخل اسمك"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-navy dark:text-slate-200 flex items-center justify-between">
              البايو (الوصف) <span className="text-red-500 text-[10px]">* 10 حروف على الأقل</span>
            </label>
            <textarea 
              value={bio} 
              onChange={e => setBio(e.target.value)} 
              className={`px-4 py-3 rounded-xl border bg-gray-50 dark:bg-slate-800/50 text-navy dark:text-slate-200 min-h-[100px] transition-all ${
                showErrors && bio.trim().length < 10 ? 'border-red-500 shadow-[0_0_0_1px_#ef4444]' : 'border-pale dark:border-slate-800 focus:border-navy dark:focus:border-blue'
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
  );
};
