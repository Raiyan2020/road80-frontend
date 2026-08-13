import React, { useState, useEffect } from 'react';
import { useLocation } from '@tanstack/react-router';
import { useExploreStates, useExploreCities } from '@/features/explore/hooks/useExploreLocations';
import { useCountries } from '@/shared/hooks/useCountries';
import { useCategoriesAppearInFilter } from '@/shared/hooks/useHome';
import { homeService } from '@/shared/services/home.service';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/types';
import { SpinnerIcon } from './Icons';
import { AppImage } from './AppImage';
import { useTranslation } from '@/i18n';
import { useHomeData } from '@/features/home/hooks/useHomeData';
import { toast } from 'sonner';

interface QuickWizardProps {
    onComplete: () => void;
}

const QuickWizard: React.FC<QuickWizardProps> = ({ onComplete }) => {
    const { t, dir } = useTranslation();
    const searchParams = new URLSearchParams(window.location.search);
    const mode = searchParams.get('mode');
    const isLocationMode = mode === 'location';
    let initialStep = 1;
    if (mode === 'edit') initialStep = 3;
    else if (isLocationMode) initialStep = 2;

    const isEditMode = mode === 'edit' || isLocationMode;

    const [step, setStep] = useState(initialStep);
    const [isSaving, setIsSaving] = useState(false);
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
                // The persisted payload uses stateId/cityId while local state uses
                // governorateId/areaId — map explicitly, a plain spread silently
                // dropped the previous governorate/area selection.
                const p = JSON.parse(saved) || {};
                return {
                    ...defaultData,
                    name: p.name ?? defaultData.name,
                    countryId: p.countryId ?? defaultData.countryId,
                    countryName: p.countryName ?? defaultData.countryName,
                    governorateId: p.stateId ?? defaultData.governorateId,
                    governorateName: p.stateName ?? defaultData.governorateName,
                    areaId: p.cityId ?? defaultData.areaId,
                    areaName: p.cityName ?? defaultData.areaName,
                    categoryValues: p.categoryValues ?? defaultData.categoryValues,
                };
            }
        } catch { }
        return defaultData;
    });

    const queryClient = useQueryClient();
    const didHydrateServerPreferences = React.useRef(false);
    const { data: homeData, isFetched: isHomeDataFetched } = useHomeData();
    const { data: countries = [], isLoading: loadingCountries } = useCountries();
    const { data: states = [], isLoading: loadingStates } = useExploreStates(data.countryId || undefined);
    const { data: cities = [], isLoading: loadingCities } = useExploreCities(data.governorateId || undefined);
    const { data: filters = [], isLoading: loadingFilters } = useCategoriesAppearInFilter();

    // The API is the source of truth. Local storage keeps the UI fast, but it
    // must not hide server-side preferences on a new browser/device.
    useEffect(() => {
        if (didHydrateServerPreferences.current || !isHomeDataFetched) return;
        didHydrateServerPreferences.current = true;

        const saved = homeData?.filter_histories_details;
        if (!saved) return;

        setData((current) => ({
            ...current,
            countryId: saved.country_id ?? current.countryId,
            governorateId: saved.state_id ?? current.governorateId,
            areaId: saved.city_id ?? current.areaId,
            categoryValues: saved.category_value_id ?? current.categoryValues,
        }));
    }, [homeData, isHomeDataFetched]);

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
        const categoryValues = (data.categoryValues || [])
            .filter(id => !valuesInGroup.includes(id));
        categoryValues.push(selectedId);
        const updated = { ...data, categoryValues };
        setData(updated);

        // Auto advance
        setTimeout(() => {
            if (step < totalSteps) setStep(step + 1);
            // Pass the freshly computed state. Calling handleFinish() here used
            // the previous render and silently dropped the final selection.
            else saveAndComplete(updated);
        }, 150);
    };

    const saveAndComplete = async (finalData: typeof data) => {
        if (!finalData.countryId || !finalData.governorateId || !finalData.areaId || isSaving) {
            toast.error(t('common.tryAgain'));
            return;
        }

        setIsSaving(true);
        // The *ids* are the source of truth here. The `*Name` fields are
        // server-localized display strings captured in whatever language was
        // active during onboarding, so consumers must resolve labels from the id
        // at render time and treat these purely as a pre-load fallback.
        // (`categoryValueNames` / `dealTypeName` used to be persisted too; they
        // were never read anywhere and were frozen in one language, so they are
        // no longer written.)
        const prefsPayload = {
            countryId: finalData.countryId || undefined,
            countryName: finalData.countryName || '',
            stateId: finalData.governorateId || undefined,
            stateName: finalData.governorateName || '',
            cityId: finalData.areaId || undefined,
            cityName: finalData.areaName || '',
            categoryValues: finalData.categoryValues || [],
            name: finalData.name,
        };

        try {
            const response = await homeService.saveFilterHistory({
                name: finalData.name,
                category_values_ids: finalData.categoryValues || [],
                country_id: finalData.countryId,
                state_id: finalData.governorateId,
                city_id: finalData.areaId,
            });

            if (!response.status) throw new Error(response.message);

            localStorage.setItem('road80_preferences', JSON.stringify({
                ...prefsPayload,
                countryId: response.data.country_id ?? prefsPayload.countryId,
                stateId: response.data.state_id ?? prefsPayload.stateId,
                cityId: response.data.city_id ?? prefsPayload.cityId,
                categoryValues: response.data.category_value_id ?? prefsPayload.categoryValues,
            }));

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.listings.all }),
                queryClient.invalidateQueries({ queryKey: ['home-data'] }),
            ]);

            onComplete();
        } catch (error) {
            toast.error((error as any)?.data?.message || t('common.tryAgain'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleFinish = () => saveAndComplete(data);

    const renderHeader = (title: string, subtitle?: string) => (
        <div className="mb-8 text-center animate-fade-in">
            <h2 className="text-2xl font-bold text-navy dark:text-slate-200 mb-2">{title}</h2>
            {subtitle && <p className="text-gray-400 dark:text-slate-500 text-sm">{subtitle}</p>}
        </div>
    );

    return (
        <div className="w-full h-full bg-white dark:bg-slate-950 flex flex-col relative overflow-hidden rtl:text-right ltr:text-left transition-colors duration-300" dir={dir}>
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
                        {renderHeader(t('quickStart.name.title'), t('quickStart.name.subtitle'))}
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData({ ...data, name: e.target.value })}
                            placeholder={t('quickStart.name.placeholder')}
                            className="w-full h-16 rounded-2xl border border-pale dark:border-slate-800 px-6 text-xl font-bold text-navy dark:text-slate-200 focus:border-navy dark:focus:border-blue focus:outline-none bg-white dark:bg-slate-900 text-center shadow-sm placeholder:text-gray-300 dark:placeholder:text-slate-600 transition-colors"
                            autoFocus
                        />
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-fade-in">
                        {renderHeader(t('quickStart.country.title'), t('quickStart.country.subtitle'))}
                        {loadingCountries ? (
                            <div className="flex justify-center p-10"><SpinnerIcon className="w-8 h-8 text-navy dark:text-blue animate-spin" /></div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {countries.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => {
                                            const updated = { ...data, countryId: c.id, countryName: c.name, governorateId: null, governorateName: '', areaId: null, areaName: '' };
                                            setData(updated);
                                            setTimeout(() => setStep(3), 150);
                                        }}
                                        className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 active:scale-95 ${data.countryId === c.id 
                                            ? "border-navy dark:border-blue bg-navy/5 dark:bg-blue/20 text-navy dark:text-blue" 
                                            : "border-pale dark:border-slate-800 bg-white dark:bg-slate-900 text-navy dark:text-slate-200 hover:border-navy/20 dark:hover:border-blue/20"
                                            }`}
                                    >
                                        <div className="w-12 h-12 relative flex items-center justify-center">
                                            <AppImage src={c.image} alt={c.name} className="w-full h-full" coverClassName="object-contain" />
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
                        {renderHeader(t('quickStart.governorate.title'), t('quickStart.governorate.subtitle'))}
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
                        {renderHeader(t('quickStart.city.title'), t('quickStart.city.subtitle'))}
                        {loadingCities ? (
                            <div className="flex justify-center p-10"><SpinnerIcon className="w-8 h-8 text-navy dark:text-blue animate-spin" /></div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {cities.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => {
                                            const updated = { ...data, areaId: c.id, areaName: c.name };
                                            setData(updated);
                                            setTimeout(() => {
                                                if (isLocationMode) saveAndComplete(updated);
                                                else if (5 <= totalSteps) setStep(5);
                                                else saveAndComplete(updated);
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
                        {renderHeader(filters[step - 5]?.name || t('quickStart.preferences.title'), t('quickStart.preferences.subtitle'))}
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
                                                        disabled={isSaving}
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
                        {t('common.next')}
                    </button>
                ) : null}

                <button
                    onClick={handleBack}
                    disabled={isSaving}
                    className="w-1/4 min-w-[80px] py-4 bg-white dark:bg-slate-900 border border-pale dark:border-slate-800 rounded-xl text-navy dark:text-slate-200 font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                >
                    {isEditMode && step === 2 ? t('common.cancel') : t('common.back')}
                </button>
            </div>
        </div>
    );
};

export default QuickWizard;
