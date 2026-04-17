import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { CheckIcon, AppleIcon, ChevronRightIcon, SpinnerIcon, PlusIcon, PlayIcon } from './Icons';
import { useCategories } from '../features/post-ad/hooks/useCategories';
import { useChunkedVideoUpload } from '../features/post-ad/hooks/useChunkedVideoUpload';
import { useCountries } from '../shared/hooks/useCountries';
import { useExploreStates, useExploreCities } from '../features/explore/hooks/useExploreLocations';
import { useSettings } from '../shared/hooks/useSettings';
import { postAdService } from '../features/post-ad/services/post-ad.service';
import { Category } from '../features/post-ad/services/post-ad.service';
import { Country } from '../shared/types/country';
import { toast } from 'sonner';

interface AddWizardProps {
  onComplete: () => void;
}

type WizardStep =
  | { type: 'category'; data: Category; key: string }
  | { type: 'country'; key: string }
  | { type: 'state'; key: string }
  | { type: 'city'; key: string }
  | { type: 'video'; key: string }
  | { type: 'images'; key: string }
  | { type: 'details'; key: string }
  | { type: 'summary'; key: string };

const KNET_LOGO = 'https://media.licdn.com/dms/image/v2/D4D0BAQFazp_I3lLeQg/company-logo_200_200/company-logo_200_200/0/1715599858189/the_shared_electronic_banking_services_co_knet_logo?e=2147483647&v=beta&t=FfjCLbNIUGrTCTi-tI5nXSNP9B4AcOJbWsFqV0bSWcM';

const AddWizard: React.FC<AddWizardProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // ── Backend Data ─────────────────────────────────────────────────────────
  const { data: categories = [], isLoading: catsLoading } = useCategories();
  const { data: countries = [] } = useCountries();
  const { data: settings } = useSettings();
  const { uploadState, uploadVideo, reset: resetVideoUpload } = useChunkedVideoUpload();

  // ── Form State ───────────────────────────────────────────────────────────
  // categoryValues: map of category.id → selected category_value.id
  const [categoryValues, setCategoryValues] = useState<Record<number, number | string>>({});
  const [countryId, setCountryId] = useState<number | null>(null);
  const [stateId, setStateId] = useState<number | null>(null);
  const [cityId, setCityId] = useState<number | null>(null);
  const [price, setPrice] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [images, setImages] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [published, setPublished] = useState(false);

  // ── Location Data ────────────────────────────────────────────────────────
  const { data: states = [] } = useExploreStates(countryId || undefined);
  const { data: cities = [] } = useExploreCities(stateId);

  // ── Dynamic Step Generation (mirrors Next.js useWizardSteps) ────────────
  const steps = useMemo<WizardStep[]>(() => {
    if (!categories || categories.length === 0) return [];
    const base: WizardStep[] = [];

    // First 2 categories
    if (categories[0]) base.push({ type: 'category', data: categories[0], key: `cat_${categories[0].id}` });
    if (categories[1]) base.push({ type: 'category', data: categories[1], key: `cat_${categories[1].id}` });

    // Location steps
    base.push({ type: 'country', key: 'country' });
    base.push({ type: 'state', key: 'governorate' });
    base.push({ type: 'city', key: 'area' });

    // Remaining categories
    categories.slice(2).forEach(cat => {
      base.push({ type: 'category', data: cat, key: `cat_${cat.id}` });
    });

    // Media & final steps
    base.push({ type: 'video', key: 'video' });
    base.push({ type: 'images', key: 'images' });
    base.push({ type: 'details', key: 'details' });
    base.push({ type: 'summary', key: 'summary' });

    return base;
  }, [categories]);

  const totalSteps = steps.length;

  // ── URL-synced Step ──────────────────────────────────────────────────────
  const getStep = () => {
    const params = new URLSearchParams(window.location.search);
    const s = parseInt(params.get('step') || '1');
    return isNaN(s) || s < 1 ? 1 : Math.min(s, totalSteps || 1);
  };

  const [step, setStep] = useState(getStep());

  useEffect(() => {
    const s = getStep();
    if (s !== step) setStep(s);
  }, [location.search, totalSteps]);

  useEffect(() => {
    document.getElementById('wizard-scroll-area')?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const goTo = useCallback((s: number) => {
    navigate({ to: '/post-ad', search: { step: s } as any });
  }, [navigate]);

  const currentStepInfo = steps[step - 1];

  // ── Validation ───────────────────────────────────────────────────────────
  const isCurrentStepValid = (): boolean => {
    if (!currentStepInfo) return true;
    if (currentStepInfo.type === 'category') {
      const val = categoryValues[currentStepInfo.data.id];
      return val !== undefined && val !== null && val !== '';
    }
    if (currentStepInfo.type === 'country') return !!countryId;
    if (currentStepInfo.type === 'state') return states.length === 0 || !!stateId;
    if (currentStepInfo.type === 'city') return cities.length === 0 || !!cityId;
    if (currentStepInfo.type === 'details') return !!price && Number(price) > 0;
    return true;
  };

  const next = () => {
    if (!isCurrentStepValid()) {
      toast.error('يرجى تعبئة الخيارات المطلوبة قبل المتابعة');
      return;
    }
    if (step < totalSteps) goTo(step + 1);
  };

  const prev = () => {
    if (step > 1) goTo(step - 1);
  };

  const selAndNext = (catId: number, valueId: number | string) => {
    setCategoryValues(prev => ({ ...prev, [catId]: valueId }));
    // Using requestAnimationFrame to ensure the state update doesn't conflict with immediate navigation
    if (step < totalSteps) {
      setTimeout(() => goTo(step + 1), 100);
    }
  };

  // ── Video Upload ─────────────────────────────────────────────────────────
  const handleVideoSelect = async (file: File) => {
    setVideoFile(file);
    try {
      await uploadVideo(file);
    } catch {
      toast.error('فشل رفع الفيديو. يرجى المحاولة مرة أخرى.');
    }
  };

  // ── Publish ──────────────────────────────────────────────────────────────
  const handlePublish = async () => {
    if (uploadState && (uploadState.status === 'uploading' || uploadState.status === 'merging')) {
      toast.warning('انتظر حتى ينتهي رفع الفيديو');
      return;
    }
    if (uploadState && uploadState.status === 'error') {
      toast.error('فشل رفع الفيديو. يرجى إزالته والمحاولة مرة أخرى.');
      return;
    }
    if (!price || Number(price) <= 0) {
      toast.error('يرجى إدخال السعر');
      return;
    }

    setIsProcessing(true);
    try {
      const videoPaths: string[] = uploadState?.serverPath ? [uploadState.serverPath] : [];

      // Build answers array — only include categories with real FK values (select/boolean).
      // Range and number types use raw user input (e.g., 150 for م²) which are NOT valid
      // category_value_ids in the backend's database, so we skip them to avoid 422 errors.
      const validCategoryIds = new Set(
        categories
          .filter((c: any) => c.type === 'select' || c.type === 'boolean')
          .map((c: any) => c.id)
      );
      const answers = (Object.entries(categoryValues) as [string, string | number][])
        .filter(([catId]) => validCategoryIds.has(Number(catId)))
        .map(([catId, valId]) => ({
          category_id: Number(catId),
          category_value_id: valId,
        }));

      const countryName = countries.find(c => c.id === countryId)?.name || '';
      const stateName = states.find(s => s.id === stateId)?.name || '';
      const cityName = cities.find(c => c.id === cityId)?.name || '';

      // Always send non-empty title and description — backend requires them
      const finalTitle = title.trim() || `عقار في ${cityName || stateName || countryName || 'الكويت'}`;
      const finalDescription = description.trim() || finalTitle;

      const res = await postAdService.createAd({
        answers,
        countryId: countryId ?? 1,
        stateId: stateId ?? 1,
        cityId: cityId ?? 1,
        videoPaths,
        images,
        price: Number(price),
        title: finalTitle,
        description: finalDescription,
      });

      const paymentUrl = (res as any).data?.payment_url || (res as any).payment_url;
      if (paymentUrl) {
        setPublished(true);
        setTimeout(() => { window.location.href = paymentUrl; }, 1200);
      } else if (res.status) {
        setPublished(true);
        setTimeout(() => { onComplete(); }, 1500);
      } else {
        // Show the backend validation message
        const errMsg = res.message
          || ((res as any).errors && Object.values((res as any).errors).flat().join(' '))
          || 'حدث خطأ، يرجى المحاولة مجدداً';
        toast.error(errMsg);
      }
    } catch (e: any) {
      // ofetch throws FetchError — the parsed response body is at e.data
      const serverMsg =
        e?.data?.message ||
        (e?.data?.errors && Object.values(e.data.errors).flat().join(' ')) ||
        e?.message ||
        'حدث خطأ غير متوقع!';
      console.error('Failed to publish ad', e);
      toast.error(serverMsg, { id: 'create-ad-error' });
    } finally {
      setIsProcessing(false);
    }
  };

  // ── UI Helpers ───────────────────────────────────────────────────────────
  const renderTitle = (label: string) => (
    <h2 className="text-xl font-bold text-navy mb-6 text-center">{label}</h2>
  );

  const renderOpt = (label: React.ReactNode, isSelected: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      className={`w-full p-4 mb-3 rounded-2xl border flex items-center justify-between transition-all duration-200 active:scale-98 ${
        isSelected
          ? 'border-navy bg-navy text-white shadow-lg shadow-navy/20'
          : 'border-pale bg-white dark:bg-slate-900 dark:border-slate-700 text-navy dark:text-slate-200 hover:border-mid'
      }`}
    >
      <div className="font-bold text-sm">{label}</div>
      {isSelected && <CheckIcon className="w-5 h-5 text-white shrink-0" />}
    </button>
  );

  // ── Loading skeleton while categories load ───────────────────────────────
  if (catsLoading || totalSteps === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-bg dark:bg-slate-950">
        <SpinnerIcon className="w-8 h-8 text-navy animate-spin" />
        <p className="text-sm text-gray-400 font-medium">جاري التحميل...</p>
      </div>
    );
  }

  // ── Success screen ───────────────────────────────────────────────────────
  if (published) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-bg dark:bg-slate-950 animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20">
          <CheckIcon className="w-12 h-12 text-white" />
        </div>
        <h3 className="text-2xl font-black text-navy dark:text-slate-200">تم النشر بنجاح!</h3>
        <p className="text-gray-400 text-sm text-center max-w-xs">جاري التوجيه إلى بوابة الدفع...</p>
      </div>
    );
  }

  // ── Step Content ─────────────────────────────────────────────────────────
  const renderStep = () => {
    if (!currentStepInfo) return null;

    // CATEGORY step
    if (currentStepInfo.type === 'category') {
      const cat = currentStepInfo.data;
      const selectedVal = categoryValues[cat.id];

      if (cat.type === 'select' || cat.type === 'boolean') {
        return (
          <>
            {renderTitle(cat.name)}
            {cat.values.map(v =>
              renderOpt(v.value, selectedVal === v.id, () => selAndNext(cat.id, v.id))
            )}
          </>
        );
      }

      if (cat.type === 'number') {
        return (
          <>
            {renderTitle(cat.name)}
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => selAndNext(cat.id, n)}
                  className={`aspect-square rounded-2xl border-2 flex items-center justify-center text-xl font-black transition-all active:scale-95 ${
                    selectedVal === n
                      ? 'bg-navy text-white border-navy shadow-lg shadow-navy/20'
                      : 'bg-white dark:bg-slate-900 text-navy dark:text-slate-200 border-pale dark:border-slate-700'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </>
        );
      }

      if (cat.type === 'range') {
        const val = (selectedVal as number) || 50;
        return (
          <>
            {renderTitle(cat.name)}
            <div className="flex flex-col items-center justify-center gap-8 py-10 bg-white dark:bg-slate-900 rounded-3xl border border-pale dark:border-slate-700 shadow-sm">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-blue">{val}</span>
                <span className="text-lg text-gray-400 font-bold">م²</span>
              </div>
              <input
                type="range" min="50" max="2000" step="5"
                value={val}
                onChange={e => setCategoryValues(prev => ({ ...prev, [cat.id]: parseInt(e.target.value) }))}
                className="w-4/5 accent-navy h-2 bg-pale rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between w-4/5 text-xs text-gray-400 font-bold">
                <span>50 م²</span><span>1000 م²</span><span>2000 م²</span>
              </div>
            </div>
          </>
        );
      }
    }

    // COUNTRY step
    if (currentStepInfo.type === 'country') {
      return (
        <>
          {renderTitle('الدولة')}
          <div className="grid grid-cols-2 gap-3">
            {countries.map(c => (
              <button
                key={c.id}
                onClick={() => { setCountryId(c.id); setStateId(null); setCityId(null); setTimeout(() => goTo(step + 1), 150); }}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all active:scale-95 ${
                  countryId === c.id
                    ? 'border-navy bg-navy/5 dark:bg-navy/20'
                    : 'border-pale bg-white dark:bg-slate-900 dark:border-slate-700'
                }`}
              >
                {c.image && <img src={c.image} alt={c.name} className="w-10 h-10 object-contain" />}
                <span className={`font-bold text-sm ${countryId === c.id ? 'text-navy dark:text-blue' : 'text-navy dark:text-slate-200'}`}>{c.name}</span>
              </button>
            ))}
          </div>
        </>
      );
    }

    // STATE step
    if (currentStepInfo.type === 'state') {
      if (states.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-gray-400 font-bold text-center">لا يوجد محافظات متوفرة لهذه الدولة</p>
          </div>
        );
      }
      return (
        <>
          {renderTitle('المحافظة / الولاية')}
          {states.map(s =>
            renderOpt(s.name, stateId === s.id, () => { setStateId(s.id); setCityId(null); setTimeout(() => goTo(step + 1), 150); })
          )}
        </>
      );
    }

    // CITY step
    if (currentStepInfo.type === 'city') {
      if (cities.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-gray-400 font-bold text-center">لا يوجد مدن متوفرة لهذه المحافظة</p>
          </div>
        );
      }
      return (
        <>
          {renderTitle('المنطقة / المدينة')}
          {cities.map(c =>
            renderOpt(c.name, cityId === c.id, () => { setCityId(c.id); setTimeout(() => goTo(step + 1), 150); })
          )}
        </>
      );
    }

    // VIDEO step
    if (currentStepInfo.type === 'video') {
      return (
        <>
          {renderTitle('ارفع فيديو (اختياري)')}
          {videoFile ? (
            <div className="flex flex-col gap-4">
              <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden">
                <video src={URL.createObjectURL(videoFile)} className="w-full h-full object-cover" />
                {uploadState && uploadState.status !== 'done' && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                    <SpinnerIcon className="w-8 h-8 text-white animate-spin" />
                    <div className="w-4/5 h-2 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue transition-all duration-300 rounded-full"
                        style={{ width: `${uploadState.progress}%` }}
                      />
                    </div>
                    <span className="text-white text-sm font-bold">{uploadState.progress}%</span>
                  </div>
                )}
                {uploadState?.status === 'done' && (
                  <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1">
                    <CheckIcon className="w-3 h-3" /> تم الرفع
                  </div>
                )}
                {uploadState?.status === 'error' && (
                  <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
                    <p className="text-white font-bold text-sm text-center px-4">{uploadState.error}</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => { setVideoFile(null); resetVideoUpload(); }}
                className="w-full py-3 text-red-500 border border-red-200 rounded-xl font-bold text-sm active:scale-95 transition-all"
              >
                إزالة الفيديو
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-4 border-2 border-dashed border-pale dark:border-slate-700 rounded-3xl py-16 cursor-pointer hover:border-navy transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-navy/5 flex items-center justify-center group-hover:bg-navy/10 transition-all">
                <PlayIcon className="w-8 h-8 text-navy dark:text-blue" />
              </div>
              <div className="text-center">
                <p className="font-bold text-navy dark:text-slate-200">اختر فيديو</p>
                <p className="text-xs text-gray-400 mt-1">MP4, MOV, AVI</p>
              </div>
              <input
                type="file" accept="video/*" className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleVideoSelect(e.target.files[0]); }}
              />
            </label>
          )}
        </>
      );
    }

    // IMAGES step
    if (currentStepInfo.type === 'images') {
      return (
        <>
          {renderTitle('صور العقار')}
          <div className="grid grid-cols-3 gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100">
                <img src={URL.createObjectURL(img)} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold"
                >✕</button>
              </div>
            ))}
            <label className="aspect-square rounded-xl border-2 border-dashed border-pale dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-navy transition-all">
              <PlusIcon className="w-8 h-8 text-gray-300" />
              <input
                type="file" accept="image/*" multiple className="hidden"
                onChange={e => {
                  if (e.target.files) {
                    setImages(prev => [...prev, ...Array.from(e.target.files!)]);
                  }
                }}
              />
            </label>
          </div>
          <p className="text-xs text-gray-400 text-center mt-3">{images.length} صورة مختارة</p>
        </>
      );
    }

    // DETAILS step
    if (currentStepInfo.type === 'details') {
      return (
        <div className="flex flex-col gap-5" dir="rtl">
          {renderTitle('تفاصيل الإعلان')}
          <div className="flex flex-col gap-2">
            <label className="font-bold text-navy dark:text-slate-200 text-sm flex items-center justify-between">
              السعر (د.ك) <span className="text-red-500">*</span>
            </label>
            <input
              type="number" min="1" placeholder="0.00" value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-full h-14 rounded-2xl border-2 border-pale dark:border-slate-700 bg-white dark:bg-slate-900 px-5 text-xl font-black text-blue focus:border-navy focus:outline-none transition-all"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-bold text-gray-400 text-sm">عنوان الإعلان (اختياري)</label>
            <input
              type="text" placeholder="مثال: شقة للإيجار في السالمية" value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full h-14 rounded-2xl border-2 border-pale dark:border-slate-700 bg-white dark:bg-slate-900 px-5 text-base font-bold text-navy dark:text-slate-200 focus:border-navy focus:outline-none transition-all"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-bold text-gray-400 text-sm">وصف الإعلان (اختياري)</label>
            <textarea
              rows={5} placeholder="اكتب وصفاً تفصيلياً للعقار..." value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full rounded-2xl border-2 border-pale dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-4 text-base font-medium text-navy dark:text-slate-200 focus:border-navy focus:outline-none transition-all resize-none"
            />
          </div>
        </div>
      );
    }

    // SUMMARY step
    if (currentStepInfo.type === 'summary') {
      const countryName = countries.find(c => c.id === countryId)?.name;
      const stateName = states.find(s => s.id === stateId)?.name;
      const cityName = cities.find(c => c.id === cityId)?.name;
      const publishFee = '١٥٠ فلس';

      return (
        <div dir="rtl">
          {renderTitle('ملخص الإعلان')}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-pale dark:border-slate-700 shadow-sm flex flex-col gap-4 mb-6">
            {/* Category answers */}
            {categories.map(cat => {
              const valId = categoryValues[cat.id];
              let displayVal: string = '—';
              if (cat.values && cat.values.length > 0) {
                const found = cat.values.find(v => String(v.id) === String(valId));
                displayVal = found ? found.value : (valId !== undefined ? String(valId) : '—');
              } else if (valId !== undefined) {
                displayVal = cat.type === 'range' ? `${valId} م²` : String(valId);
              }
              return (
                <div key={cat.id} className="flex justify-between items-center border-b border-b-pale dark:border-b-slate-700 pb-3 last:border-0 last:pb-0">
                  <span className="text-gray-400 font-bold text-sm">{cat.name}</span>
                  <span className="font-black text-navy dark:text-slate-200">{displayVal}</span>
                </div>
              );
            })}
            {/* Location */}
            <div className="flex justify-between items-center border-b border-b-pale dark:border-b-slate-700 pb-3">
              <span className="text-gray-400 font-bold text-sm">الدولة</span>
              <span className="font-black text-navy dark:text-slate-200">{countryName || '—'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-b-pale dark:border-b-slate-700 pb-3">
              <span className="text-gray-400 font-bold text-sm">المحافظة</span>
              <span className="font-black text-navy dark:text-slate-200">{stateName || '—'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-b-pale dark:border-b-slate-700 pb-3">
              <span className="text-gray-400 font-bold text-sm">المنطقة</span>
              <span className="font-black text-navy dark:text-slate-200">{cityName || '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-bold text-sm">السعر</span>
              <span className="font-black text-navy dark:text-slate-200">{price ? `${price} د.ك` : '—'}</span>
            </div>

            {/* Publish fee */}
            <div className="mt-2 pt-4 border-t border-dashed border-pale dark:border-slate-700">
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-pale dark:border-slate-700">
                <span className="font-bold text-navy dark:text-slate-200">سعر اضافه اعلان</span>
                <span className="text-2xl font-black text-blue">{publishFee}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // ── Footer buttons ───────────────────────────────────────────────────────
  const renderFooter = () => {
    const backBtn = (
      <button
        onClick={prev}
        disabled={step === 1}
        className={`w-full py-4 rounded-xl font-bold border border-pale dark:border-slate-700 bg-white dark:bg-slate-900 text-navy dark:text-slate-200 transition-all shadow-sm ${
          step === 1 ? 'opacity-40 cursor-not-allowed' : 'active:scale-95 hover:bg-pale/30'
        }`}
      >
        رجوع
      </button>
    );

    // Summary step → payment buttons
    if (currentStepInfo?.type === 'summary') {
      return (
        <div className="flex flex-col gap-3">
          {backBtn}
          <button
            onClick={handlePublish}
            disabled={isProcessing}
            className="w-full py-4 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
          >
            {isProcessing
              ? <SpinnerIcon className="w-5 h-5 animate-spin" />
              : <><AppleIcon className="w-5 h-5 mb-0.5" /><span>الدفع والنشر (Apple Pay)</span></>
            }
          </button>
          <button
            onClick={handlePublish}
            disabled={isProcessing}
            className="w-full py-4 bg-white dark:bg-slate-900 text-navy dark:text-slate-200 border border-pale dark:border-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
          >
            {isProcessing
              ? <SpinnerIcon className="w-5 h-5 animate-spin text-navy" />
              : <><img src={KNET_LOGO} className="w-8 h-8 object-contain" alt="KNET" /><span>الدفع عبر الكي نت</span></>
            }
          </button>
        </div>
      );
    }

    // Steps that need manual Next (range slider, video, images)
    const needsManualNext =
      currentStepInfo?.type === 'video' ||
      currentStepInfo?.type === 'images' ||
      currentStepInfo?.type === 'details' ||
      (currentStepInfo?.type === 'category' && currentStepInfo.data.type === 'range');

    if (needsManualNext) {
      return (
        <div className="flex flex-col gap-3">
          {backBtn}
          <button
            onClick={next}
            className="w-full py-4 bg-navy text-white rounded-xl font-bold shadow-lg shadow-navy/20 active:scale-95 transition-all"
          >
            التالي
          </button>
        </div>
      );
    }

    // Default: just back button (auto-advance on selection)
    return <div className="w-full">{backBtn}</div>;
  };

  // ── Layout ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full bg-bg dark:bg-slate-950 flex flex-col relative overflow-hidden" dir="rtl">
      {/* Progress bar */}
      <div className="px-5 pt-6 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400 font-bold">الخطوة {step} من {totalSteps}</span>
          <button onClick={onComplete} className="text-xs text-gray-400 font-bold hover:text-navy transition-colors">
            تخطي
          </button>
        </div>
        <div className="w-full h-1.5 bg-pale dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-navy dark:bg-blue transition-all duration-500 rounded-full"
            style={{ width: `${totalSteps > 0 ? (step / totalSteps) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Scrollable content */}
      <div
        id="wizard-scroll-area"
        className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 pb-6"
      >
        <div className="animate-fade-in">
          {renderStep()}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-5 pb-8 pt-3 bg-gradient-to-t from-bg dark:from-slate-950 via-bg/90 dark:via-slate-950/90 to-transparent">
        {renderFooter()}
      </div>
    </div>
  );
};

export default AddWizard;
