import React, { useState, useEffect } from 'react';
import { useLocation } from '@tanstack/react-router';
import { useExploreStates, useExploreCities } from '@/features/explore/hooks/useExploreLocations';
import { useCountries } from '@/shared/hooks/useCountries';
import { useCategoriesAppearInFilter } from '@/shared/hooks/useHome';
import { homeService } from '@/shared/services/home.service';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/types';
import { SpinnerIcon } from './Icons';

interface QuickWizardProps {
  onComplete: () => void;
}

const QuickWizard: React.FC<QuickWizardProps> = ({ onComplete }) => {
  const searchParams = new URLSearchParams(window.location.search);
  const mode = searchParams.get('mode'); // 'edit' | 'location' | null
  const isEditMode = mode === 'edit' || mode === 'location';
  
  const [step, setStep] = useState(isEditMode ? 2 : 1);
  const [data, setData] = useState({
    name: '',
    countryId: null as number | null,
    countryName: '',
    governorateId: null as number | null,
    governorateName: '',
    areaId: null as number | null,
    areaName: '',
    categoryValues: [] as number[],
  });

  const queryClient = useQueryClient();
  const { data: countries = [], isLoading: loadingCountries } = useCountries();
  const { data: states = [], isLoading: loadingStates } = useExploreStates(data.countryId || undefined);
  const { data: cities = [], isLoading: loadingCities } = useExploreCities(data.governorateId || undefined);
  const { data: filters = [], isLoading: loadingFilters } = useCategoriesAppearInFilter();

  useEffect(() => {
    const saved = localStorage.getItem('road80_preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData(prev => ({ ...prev, ...parsed }));
      } catch (e) {}
    }
  }, []);

  const totalSteps = Math.max(5, 4 + filters.length);

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else handleFinish();
  };

  const handleBack = () => {
    if (isEditMode && step === 2) {
       onComplete();
       return;
    }
    if (step > 1) setStep(step - 1);
  };

  const toggleCategoryValue = (id: number) => {
    setData((prev) => {
      const current = prev.categoryValues || [];
      return {
        ...prev,
        categoryValues: current.includes(id) ? current.filter(i => i !== id) : [...current, id]
      };
    });
  };

  const saveAndComplete = async (finalData: typeof data) => {
      // Create Next.js compatible preferences object
      const prefsPayload = {
          propertyType: '',
          purpose: 'للإيجار', // Fallback defaults like Next.js
          area: finalData.areaName || finalData.governorateName,
          countryId: finalData.countryId || undefined,
          countryName: finalData.countryName || '',
          stateId: finalData.governorateId || undefined,
          cityId: finalData.areaId || undefined,
          categoryValues: finalData.categoryValues || [],
          name: finalData.name,
      };

      localStorage.setItem('road80_preferences', JSON.stringify(prefsPayload));
      
      if (finalData.governorateId && finalData.areaId) {
         try {
             await homeService.saveFilterHistory({
                 category_values_ids: finalData.categoryValues || [],
                 state_id: finalData.governorateId,
                 city_id: finalData.areaId
             });
             queryClient.invalidateQueries({ queryKey: QUERY_KEYS.listings.all });
         } catch (e) {
             console.error("Failed to save filter history", e);
         }
      }
      
      onComplete();
  };
  
  const handleFinish = () => saveAndComplete(data);

  const renderHeader = (title: string, subtitle?: string) => (
      <div className="mb-8 text-center animate-fade-in">
          <h2 className="text-2xl font-bold text-navy mb-2">{title}</h2>
          {subtitle && <p className="text-gray-400 text-sm">{subtitle}</p>}
      </div>
  );

  return (
    <div className="w-full h-full bg-bg flex flex-col relative overflow-hidden text-right" dir="rtl">
        <div className="px-6 pt-8 pb-4">
            <div className="w-full h-1.5 bg-pale rounded-full overflow-hidden mb-8">
                <div 
                    className="h-full bg-navy transition-all duration-500 rounded-full"
                    style={{ width: `${(step / totalSteps) * 100}%` }}
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-24">
            {step === 1 && !isEditMode && (
                <div className="flex flex-col h-full justify-center -mt-20">
                    {renderHeader('مرحباً بك 👋', 'الرجاء إدخال اسمك لنبدأ')}
                    <input 
                        type="text"
                        value={data.name}
                        onChange={(e) => setData({...data, name: e.target.value})}
                        placeholder="الاسم الكامل"
                        className="w-full h-16 rounded-2xl border border-pale px-6 text-xl font-bold text-navy focus:border-navy focus:outline-none bg-white text-center shadow-sm placeholder:text-gray-300"
                        autoFocus
                    />
                </div>
            )}

            {step === 2 && (
                <div className="animate-fade-in">
                    {renderHeader('اختر بلدك', 'أين تبحث عن عقارك القادم؟')}
                    {loadingCountries ? (
                         <div className="flex justify-center p-10"><SpinnerIcon className="w-8 h-8 text-navy animate-spin" /></div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {countries.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => {
                                        setData({ ...data, countryId: c.id, countryName: c.name, governorateId: null, governorateName: '', areaId: null, areaName: '' });
                                        setTimeout(() => setStep(3), 150);
                                    }}
                                    className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 active:scale-95 ${
                                        data.countryId === c.id ? "border-navy bg-navy/5" : "border-pale bg-white hover:border-navy/20"
                                    }`}
                                >
                                    <div className="w-12 h-12 relative flex items-center justify-center">
                                       {c.image && <img src={c.image} alt={c.name} className="w-full h-full object-contain" />}
                                    </div>
                                    <span className="font-bold text-sm text-navy">{c.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {step === 3 && (
                <div className="animate-fade-in">
                    {renderHeader('اختر المنطقة', 'في أي محافظة تود البحث؟')}
                    {loadingStates ? (
                         <div className="flex justify-center p-10"><SpinnerIcon className="w-8 h-8 text-navy animate-spin" /></div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {states.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => {
                                        setData({ ...data, governorateId: s.id, governorateName: s.name, areaId: null, areaName: '' });
                                        setTimeout(() => setStep(4), 150);
                                    }}
                                    className={`p-4 h-16 rounded-2xl border-2 transition-all font-bold flex items-center justify-between active:scale-95 ${
                                        data.governorateId === s.id ? "border-navy bg-navy/5 text-navy" : "border-pale bg-white text-navy hover:border-navy/20"
                                    }`}
                                >
                                    <span>{s.name}</span>
                                    {data.governorateId === s.id && <span className="text-navy text-xl">✓</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {step === 4 && (
                <div className="animate-fade-in">
                    {renderHeader('اختر المدينة', 'حدد المدينة المفضلة لديك')}
                    {loadingCities ? (
                         <div className="flex justify-center p-10"><SpinnerIcon className="w-8 h-8 text-navy animate-spin" /></div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {cities.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => {
                                        setData({ ...data, areaId: c.id, areaName: c.name });
                                        setTimeout(() => setStep(5), 150);
                                    }}
                                    className={`p-4 h-16 rounded-2xl border-2 transition-all font-bold flex items-center justify-between active:scale-95 ${
                                        data.areaId === c.id ? "border-navy bg-navy/5 text-navy" : "border-pale bg-white text-navy hover:border-navy/20"
                                    }`}
                                >
                                    <span>{c.name}</span>
                                    {data.areaId === c.id && <span className="text-navy text-xl">✓</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {step >= 5 && step <= totalSteps && (
                <div className="animate-fade-in">
                    {renderHeader('تفضيلات البحث', 'ساعدنا في عرض ما يهمك أولاً')}
                    {loadingFilters ? (
                         <div className="flex justify-center p-10"><SpinnerIcon className="w-8 h-8 text-navy animate-spin" /></div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {filters[step - 5] && (
                                <div className="flex flex-col gap-3">
                                    <h3 className="font-bold text-navy">{filters[step - 5].name}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {filters[step - 5].values.map(v => {
                                            const isSelected = (data.categoryValues || []).includes(v.id);
                                            return (
                                                <button
                                                    key={v.id}
                                                    onClick={() => toggleCategoryValue(v.id)}
                                                    className={`px-4 py-2 rounded-full border-2 transition-all font-bold text-sm active:scale-95 ${
                                                        isSelected 
                                                            ? "border-navy bg-navy text-white shadow-md shadow-navy/20" 
                                                            : "border-pale bg-white text-navy hover:border-navy/20"
                                                    }`}
                                                >
                                                    {v.value}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-bg via-bg to-transparent z-10 flex gap-3">
            {(step === 1 && !isEditMode) || (step >= 5 && step < totalSteps) ? (
                <button 
                    onClick={handleNext}
                    disabled={step === 1 && !data.name.trim()}
                    className={`flex-1 py-4 rounded-xl font-bold text-white shadow-lg transition-all ${
                        (step > 1 || (step === 1 && data.name.trim())) ? 'bg-navy shadow-navy/20 active:scale-95 hover:bg-blue' : 'bg-gray-300 cursor-not-allowed'
                    }`}
                >
                    التالي
                </button>
            ) : step === totalSteps ? (
                <button 
                    onClick={handleFinish}
                    className="flex-1 py-4 rounded-xl font-bold text-white bg-navy shadow-lg shadow-navy/20 active:scale-95 hover:bg-blue transition-all"
                >
                    حفظ وإكمال التصفح
                </button>
            ) : null}

            <button 
                onClick={handleBack}
                className="w-1/4 min-w-[80px] py-4 bg-white border border-pale rounded-xl text-navy font-bold hover:bg-gray-50 transition-colors active:scale-95"
            >
                {isEditMode && step === 2 ? 'إلغاء' : 'رجوع'}
            </button>
        </div>
    </div>
  );
};

export default QuickWizard;
