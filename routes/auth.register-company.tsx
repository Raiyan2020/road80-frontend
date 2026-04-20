import React, { useState, useRef } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useRegisterCompany } from '../shared/hooks/useRegisterCompany';
import { useCountries, useStates } from '../shared/hooks/useLocation';
import { useDepartments } from '../features/companies/hooks/useDepartments';
import { BuildingIcon, PhoneIcon, WhatsappIcon, ChevronRightIcon, SpinnerIcon, MailIcon } from '../components/Icons';
import { toast } from 'sonner';

export const Route = createFileRoute('/auth/register-company')({
  component: RegisterCompanyPage
});

function RegisterCompanyPage() {
  const navigate = useNavigate();
  const registerMutation = useRegisterCompany();
  
  const { data: countriesResponse, isLoading: loadingCountries } = useCountries();
  const { data: departmentsResponse, isLoading: loadingDepts } = useDepartments();

  // The API wrappers might return { data: [...] } or just [...] depending on implementation
  const countries = (countriesResponse as any)?.data || countriesResponse || [];
  const departments = (departmentsResponse as any)?.data || departmentsResponse || [];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    caption: '',
    company_department_id: '',
    country_id: '',
    state_id: '',
    phone: '',
    whatsapp_phone: '',
  });

  const { data: statesResponse, isLoading: loadingStates } = useStates(formData.country_id);
  const states = (statesResponse as any)?.data || statesResponse || [];

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset state if country changes
      ...(name === 'country_id' ? { state_id: '' } : {})
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.country_id || !formData.company_department_id || !formData.state_id || !formData.phone || !formData.whatsapp_phone || !formData.caption) {
       toast.error('يرجى تعبئة جميع الحقول المطلوبة');
       return;
    }
    if (!imageFile) {
       toast.error('يرجى اختيار شعار الشركة');
       return;
    }
    if (formData.caption.length < 10) {
       toast.error('وصف الشركة يجب أن يكون 10 أحرف على الأقل');
       return;
    }

    const payload = {
        name: formData.name,
        email: formData.email,
        caption: formData.caption,
        state_id: formData.state_id,
        country_id: formData.country_id,
        phone: formData.phone,
        whatsapp_phone: formData.whatsapp_phone,
        image: imageFile,
        company_department_id: formData.company_department_id
    };

    registerMutation.mutate(payload, {
      onSuccess: (response: any) => {
        if (response.status || response.message === 'success') {
          toast.success("تم التسجيل بنجاح، في انتظار موافقة الإدارة");
          navigate({ to: '/auth' });
        } else {
          toast.error(response.message || "حدث خطأ ما أثناء التسجيل");
        }
      },
      onError: (error: any) => {
        const message = error?.data?.message || error?.message || "حدث خطأ ما أثناء التسجيل، يرجى المحاولة لاحقاً";
        toast.error(message);
      }
    });
  };

  return (
    <div className="absolute inset-0 bg-bg dark:bg-slate-950 overflow-y-auto overflow-x-hidden no-scrollbar animate-fade-in transition-colors duration-300" dir="rtl">
        <div className="p-4 sm:p-6 pb-24 max-w-lg mx-auto">
            {/* Header */}
            <div className="flex flex-col items-center text-center gap-4 mb-8">
                <button 
                  onClick={() => window.history.back()}
                  className="self-start flex items-center gap-1 text-gray-500 dark:text-slate-400 hover:text-navy dark:hover:text-blue transition-colors font-bold text-sm"
                >
                  <ChevronRightIcon className="w-5 h-5 rotate-180" /> العودة للوراء
                </button>
                
                <div className="w-24 h-24 mb-2">
                   <img src="https://raiyansoft.com/wp-content/uploads/2026/02/sg54.png" alt="80road" className="w-full h-full object-contain drop-shadow-xl" />
                </div>
                
                <div className="space-y-1">
                  <h1 className="text-2xl font-black text-navy dark:text-slate-100 tracking-tight">تسجيل شركة جديدة</h1>
                  <p className="text-gray-500 dark:text-slate-400 font-medium text-sm px-4">
                    انضم إلى شبكة 80road العقارية وابدأ بعرض عقارات شركتك لجمهور واسع
                  </p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-slate-900 border border-pale dark:border-slate-800 rounded-[32px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
               <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  
                  {/* Image Uploader */}
                  <div className="flex flex-col items-center gap-2">
                     <span className="text-sm font-bold text-navy dark:text-slate-200">شعار الشركة</span>
                     <div 
                        className="w-28 h-28 rounded-3xl bg-gray-50 dark:bg-slate-800 border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center overflow-hidden cursor-pointer relative active:scale-95 transition-all"
                        onClick={() => fileInputRef.current?.click()}
                     >
                        {previewImage ? (
                           <img src={previewImage} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                           <span className="text-xs font-bold text-gray-400">اختر صورة</span>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                     </div>
                     
                     {/* Email */}
                     <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-navy dark:text-slate-200 flex items-center gap-1.5 px-1">
                          <MailIcon className="w-4 h-4 text-blue" />
                          البريد الإلكتروني (اختياري)
                        </label>
                        <input 
                          type="email" 
                          name="email"
                          placeholder="example@road80.com" 
                          value={formData.email}
                          onChange={handleChange}
                          className="h-14 px-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-pale dark:border-slate-700 text-navy dark:text-slate-200 font-bold outline-none focus:border-blue transition-colors text-left ltr" 
                          dir="ltr"
                        />
                     </div>
                  </div>

                  <div className="flex flex-col gap-5">
                    {/* Company Name */}
                    <div className="flex flex-col gap-2">
                       <label className="text-sm font-bold text-navy dark:text-slate-200 flex items-center gap-1.5 px-1">
                         <BuildingIcon className="w-4 h-4 text-blue" />
                         اسم الشركة
                       </label>
                       <input 
                         required
                         type="text" 
                         name="name"
                         placeholder="أدخل اسم الشركة" 
                         value={formData.name}
                         onChange={handleChange}
                         className="h-14 px-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-pale dark:border-slate-700 text-navy dark:text-slate-200 font-bold outline-none focus:border-blue transition-colors" 
                       />
                    </div>

                    {/* Department Select */}
                    <div className="flex flex-col gap-2">
                       <label className="text-sm font-bold text-navy dark:text-slate-200 px-1">القسم</label>
                       <select 
                         required
                         name="company_department_id"
                         value={formData.company_department_id}
                         onChange={handleChange}
                         className="h-14 px-4 pr-10 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-pale dark:border-slate-700 text-navy dark:text-slate-200 font-bold outline-none focus:border-blue transition-colors appearance-none"
                         style={{ backgroundPosition: 'left 1rem center', backgroundRepeat: 'no-repeat', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a9c2e0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundSize: '0.65rem auto' }}
                       >
                         <option value="">اختر القسم</option>
                         {!loadingDepts && departments.map((d: any) => (
                           <option key={d.id} value={d.id}>{d.name || d.value}</option>
                         ))}
                       </select>
                    </div>

                    {/* Country Select */}
                    <div className="flex flex-col gap-2">
                       <label className="text-sm font-bold text-navy dark:text-slate-200 px-1">الدولة</label>
                       <select 
                         required
                         name="country_id"
                         value={formData.country_id}
                         onChange={handleChange}
                         className="h-14 px-4 pr-10 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-pale dark:border-slate-700 text-navy dark:text-slate-200 font-bold outline-none focus:border-blue transition-colors appearance-none"
                         style={{ backgroundPosition: 'left 1rem center', backgroundRepeat: 'no-repeat', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a9c2e0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundSize: '0.65rem auto' }}
                       >
                         <option value="">اختر الدولة</option>
                         {!loadingCountries && countries.map((c: any) => (
                           <option key={c.id || c.code} value={c.id || c.code}>{c.name}</option>
                         ))}
                       </select>
                    </div>

                    {/* State Select */}
                    <div className="flex flex-col gap-2">
                       <label className="text-sm font-bold text-navy dark:text-slate-200 px-1">المحافظة</label>
                       <select 
                         required
                         name="state_id"
                         value={formData.state_id}
                         onChange={handleChange}
                         disabled={!formData.country_id || loadingStates}
                         className="h-14 px-4 pr-10 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-pale dark:border-slate-700 text-navy dark:text-slate-200 font-bold outline-none focus:border-blue transition-colors appearance-none disabled:opacity-50"
                         style={{ backgroundPosition: 'left 1rem center', backgroundRepeat: 'no-repeat', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a9c2e0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundSize: '0.65rem auto' }}
                       >
                         <option value="">{!formData.country_id ? "اختر الدولة أولاً" : "اختر المحافظة"}</option>
                         {!loadingStates && states.map((s: any) => (
                           <option key={s.id} value={s.id}>{s.name}</option>
                         ))}
                       </select>
                    </div>

                    {/* Phone */}
                    <div className="flex flex-col gap-2">
                       <label className="text-sm font-bold text-navy dark:text-slate-200 flex items-center gap-1.5 px-1">
                         <PhoneIcon className="w-4 h-4 text-blue" />
                         رقم الهاتف
                       </label>
                       <input 
                         required
                         type="tel" 
                         name="phone"
                         placeholder="9xxxxxxxx" 
                         value={formData.phone}
                         onChange={handleChange}
                         className="h-14 px-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-pale dark:border-slate-700 text-navy dark:text-slate-200 font-bold outline-none focus:border-blue transition-colors text-right ltr" 
                         dir="ltr"
                       />
                    </div>

                    {/* WhatsApp */}
                    <div className="flex flex-col gap-2">
                       <label className="text-sm font-bold text-navy dark:text-slate-200 flex items-center gap-1.5 px-1">
                         <WhatsappIcon className="w-4 h-4 text-green-500" />
                         رقم الواتساب
                       </label>
                       <input 
                         type="tel" 
                         name="whatsapp_phone"
                         placeholder="9xxxxxxxx" 
                         value={formData.whatsapp_phone}
                         onChange={handleChange}
                         className="h-14 px-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-pale dark:border-slate-700 text-navy dark:text-slate-200 font-bold outline-none focus:border-blue transition-colors text-right ltr" 
                         dir="ltr"
                       />
                    </div>

                    {/* Caption */}
                    <div className="flex flex-col gap-2">
                       <label className="text-sm font-bold text-navy dark:text-slate-200 px-1">وصف الشركة</label>
                       <textarea 
                         name="caption"
                         placeholder="تحدث قليلاً عن نشاط الشركة العقاري..." 
                         value={formData.caption}
                         onChange={handleChange}
                         className="min-h-[120px] p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-pale dark:border-slate-700 text-navy dark:text-slate-200 font-bold outline-none focus:border-blue transition-colors resize-y" 
                       />
                    </div>

                  </div>

                  <button 
                     type="submit" 
                     disabled={registerMutation.isPending}
                     className="mt-2 w-full h-14 rounded-2xl bg-navy dark:bg-blue text-white font-black text-lg flex items-center justify-center shadow-lg shadow-navy/20 dark:shadow-blue/20 active:scale-95 transition-all disabled:opacity-70"
                  >
                     {registerMutation.isPending ? <SpinnerIcon className="w-6 h-6 animate-spin" /> : "تقديم طلب التسجيل"}
                  </button>

               </form>
            </div>
        </div>
    </div>
  );
}
