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
    const mode = searchParams.get('mode');
    let initialStep = 1;
    if (mode === 'edit') initialStep = 3;
    else if (mode === 'location') initialStep = 2;

    const isEditMode = mode === 'edit' || mode === 'location';

    const [step, setStep] = useState(initialStep);
    const [data, setData] = useState(() => {
        const defaultData = {
            name: '',
            countryId: null as number | null,
            countryName: '',
            governorateId: null as number | null,
            governorateName: '',
            areaId: null as number | null,
            areaName: '',
            categoryValues: [] as number[],
        };
        try {
            const saved = localStorage.getItem('road80_preferences');
            if (saved) {
                return { ...defaultData, ...JSON.parse(saved) };
            }
        } catch { }
        return defaultData;
    });

    const queryClient = useQueryClient();
    const { data: countries = [], isLoading: loadingCountries } = useCountries();
    const { data: states = [], isLoading: loadingStates } = useExploreStates(data.countryId || undefined);
    const { data: cities = [], isLoading: loadingCities } = useExploreCities(data.governorateId || undefined);
    const { data: filters = [], isLoading: loadingFilters } = useCategoriesAppearInFilter();

    const totalSteps = Math.max(5, 4 + filters.length);

    const handleNext = () => {
        if (step < totalSteps) setStep(step + 1);
        else handleFinish();
    };

    const handleBack = () => {
        if (step === initialStep) {
            onComplete();
            return;
        }
        if (step > 1) setStep(step - 1);
    };

    const selectCategoryValue = (valuesInGroup: number[], selectedId: number) => {
        setData((prev) => {
            let current = prev.categoryValues || [];
            // Remove any values that belong to this group to enforce single selection
            current = current.filter(id => !valuesInGroup.includes(id));
            // Add the new selection
            current.push(selectedId);
            return { ...prev, categoryValues: current };
        });

        // Auto advance
        setTimeout(() => {
            if (step < totalSteps) setStep(step + 1);
            else handleFinish();
        }, 150);
    };

    const saveAndComplete = async (finalData: typeof data) => {
        // Resolve selected category value IDs → display names
        const allValues = filters.flatMap((cat) => cat.values);
        const categoryValueNames = (finalData.categoryValues || [])
            .map((id) => allValues.find((v) => v.id === id)?.value)
            .filter(Boolean) as string[];

        // Find deal type specifically (category id=2 "نوع التعاقد")
        const dealCat = filters.find((c) => c.id === 2);
        const dealTypeName = dealCat?.values.find((v) =>
            (finalData.categoryValues || []).includes(v.id)
        )?.value || '';

        const prefsPayload = {
            countryId: finalData.countryId || undefined,
            countryName: finalData.countryName || '',
            stateId: finalData.governorateId || undefined,
            stateName: finalData.governorateName || '',
            cityId: finalData.areaId || undefined,
            cityName: finalData.areaName || '',
            categoryValues: finalData.categoryValues || [],
            categoryValueNames,   // ← resolved names saved directly
            dealTypeName,         // ← e.g. "إيجار" / "بيع" / "فنادق"
            name: finalData.name,
        };

        localStorage.setItem('road80_preferences', JSON.stringify(prefsPayload));


        if (finalData.governorateId && finalData.areaId) {
            try {
                await homeService.saveFilterHistory({
                    name: finalData.name,
                    category_values_ids: finalData.categoryValues || [],
                    state_id: finalData.governorateId,
                    city_id: finalData.areaId
                });
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.listings.all });
            } catch (e) {
                // Failed to save filter history
            }
        }

        onComplete();
    };

    const handleFinish = () => saveAndComplete(data);

    const renderHeader = (title: string, subtitle?: string) => (
        <div className="mb-8 text-center animate-fade-in">
            <h2 className="text-2xl font-bold text-navy dark:text-slate-200 mb-2">{title}</h2>
            {subtitle && <p className="text-gray-400 dark:text-slate-500 text-sm">{subtitle}</p>}
        </div>
    );

    return (
        <div className="w-full h-full bg-white dark:bg-slate-950 flex flex-col relative overflow-hidden text-right transition-colors duration-300" dir="rtl">
            <div className="px-6 pt-8 pb-4 shrink-0">
                <div className="w-full h-1.5 bg-pale dark:bg-slate-800 rounded-full overflow-hidden mb-8">
                    <div
                        className="h-full bg-navy dark:bg-blue transition-all duration-500 rounded-full"
                        style={{ width: `${((step - initialStep) / (totalSteps - initialStep)) * 100}%` }}
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
                            onChange={(e) => setData({ ...data, name: e.target.value })}
                            placeholder="الاسم الكامل"
                            className="w-full h-16 rounded-2xl border border-pale dark:border-slate-800 px-6 text-xl font-bold text-navy dark:text-slate-200 focus:border-navy dark:focus:border-blue focus:outline-none bg-white dark:bg-slate-900 text-center shadow-sm placeholder:text-gray-300 dark:placeholder:text-slate-600 transition-colors"
                            autoFocus
                        />
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-fade-in">
                        {renderHeader('اختر بلدك', 'أين تبحث عن عقارك القادم؟')}
                        {loadingCountries ? (
                            <div className="flex justify-center p-10"><SpinnerIcon className="w-8 h-8 text-navy dark:text-blue animate-spin" /></div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {countries.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => {
                                            setData({ ...data, countryId: c.id, countryName: c.name, governorateId: null, governorateName: '', areaId: null, areaName: '' });
                                            setTimeout(() => setStep(3), 150);
                                        }}
                                        className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 active:scale-95 ${data.countryId === c.id 
                                            ? "border-navy dark:border-blue bg-navy/5 dark:bg-blue/20 text-navy dark:text-blue" 
                                            : "border-pale dark:border-slate-800 bg-white dark:bg-slate-900 text-navy dark:text-slate-200 hover:border-navy/20 dark:hover:border-blue/20"
                                            }`}
                                    >
                                        <div className="w-12 h-12 relative flex items-center justify-center">
                                            {c.image && <img src={c.image} alt={c.name} className="w-full h-full object-contain" />}
                                        </div>
                                        <span className="font-bold text-sm">{c.name}</span>
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
                            <div className="flex justify-center p-10"><SpinnerIcon className="w-8 h-8 text-navy dark:text-blue animate-spin" /></div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {states.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => {
                                            setData({ ...data, governorateId: s.id, governorateName: s.name, areaId: null, areaName: '' });
                                            setTimeout(() => setStep(4), 150);
                                        }}
                                        className={`p-4 h-16 rounded-2xl border-2 transition-all font-bold flex items-center justify-between active:scale-95 ${data.governorateId === s.id 
                                            ? "border-navy dark:border-blue bg-navy/5 dark:bg-blue/20 text-navy dark:text-blue" 
                                            : "border-pale dark:border-slate-800 bg-white dark:bg-slate-900 text-navy dark:text-slate-200 hover:border-navy/20 dark:hover:border-blue/20"
                                            }`}
                                    >
                                        <span>{s.name}</span>
                                        {data.governorateId === s.id && <span className="text-navy dark:text-blue text-xl">✓</span>}
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
                            <div className="flex justify-center p-10"><SpinnerIcon className="w-8 h-8 text-navy dark:text-blue animate-spin" /></div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {cities.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => {
                                            setData({ ...data, areaId: c.id, areaName: c.name });
                                            setTimeout(() => {
                                                if (5 <= totalSteps) setStep(5);
                                                else handleFinish();
                                            }, 150);
                                        }}
                                        className={`p-4 h-16 rounded-2xl border-2 transition-all font-bold flex items-center justify-between active:scale-95 ${data.areaId === c.id 
                                            ? "border-navy dark:border-blue bg-navy/5 dark:bg-blue/20 text-navy dark:text-blue" 
                                            : "border-pale dark:border-slate-800 bg-white dark:bg-slate-900 text-navy dark:text-slate-200 hover:border-navy/20 dark:hover:border-blue/20"
                                            }`}
                                    >
                                        <span>{c.name}</span>
                                        {data.areaId === c.id && <span className="text-navy dark:text-blue text-xl">✓</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {step >= 5 && step <= totalSteps && (
                    <div className="animate-fade-in">
                        {renderHeader(filters[step - 5]?.name || 'تفضيلات البحث', 'ساعدنا في عرض ما يهمك أولاً')}
                        {loadingFilters ? (
                            <div className="flex justify-center p-10"><SpinnerIcon className="w-8 h-8 text-navy dark:text-blue animate-spin" /></div>
                        ) : (
                            <div className="flex flex-col gap-6">
                                {filters[step - 5] && (
                                    <div className="flex flex-col gap-3">
                                        <div className="flex flex-col gap-3">
                                            {filters[step - 5].values.map(v => {
                                                const isSelected = (data.categoryValues || []).includes(v.id);
                                                return (
                                                    <button
                                                        key={v.id}
                                                        onClick={() => {
                                                            const allIds = filters[step - 5].values.map(val => val.id);
                                                            selectCategoryValue(allIds, v.id);
                                                        }}
                                                        className={`p-4 h-16 rounded-2xl border-2 transition-all font-bold flex items-center justify-between active:scale-95 ${isSelected
                                                            ? "border-navy dark:border-blue bg-navy/5 dark:bg-blue/20 text-navy dark:text-blue"
                                                            : "border-pale dark:border-slate-800 bg-white dark:bg-slate-900 text-navy dark:text-slate-200 hover:border-navy/20 dark:hover:border-blue/20"
                                                            }`}
                                                    >
                                                        <span>{v.value}</span>
                                                        {isSelected && <span className="text-navy dark:text-blue text-xl">✓</span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) }
                    </div>
                )}
            </div>

            <div className="shrink-0 p-6 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-slate-950 dark:via-slate-950/90 dark:to-transparent z-10 flex gap-3 transition-colors">
                {step === 1 && !isEditMode ? (
                    <button
                        onClick={handleNext}
                        disabled={!data.name.trim()}
                        className={`flex-1 py-4 rounded-xl font-bold text-white shadow-lg transition-all ${data.name.trim() ? 'bg-navy dark:bg-blue shadow-navy/20 dark:shadow-blue/20 active:scale-95 hover:bg-blue' : 'bg-gray-300 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                            }`}
                    >
                        التالي
                    </button>
                ) : null}

                <button
                    onClick={handleBack}
                    className="w-1/4 min-w-[80px] py-4 bg-white dark:bg-slate-900 border border-pale dark:border-slate-800 rounded-xl text-navy dark:text-slate-200 font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                >
                    {isEditMode && step === 2 ? 'إلغاء' : 'رجوع'}
                </button>
            </div>
        </div>
    );
};

export default QuickWizard;
