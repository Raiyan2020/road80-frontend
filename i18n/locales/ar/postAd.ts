export const postAd = {
  // ── Wizard progress header ────────────────────────────────────────────────
  progress: {
    stepOf: 'الخطوة {current} من {total}',
  },

  // ── Success screen (after publishing) ─────────────────────────────────────
  success: {
    title: 'تم استلام إعلانك بنجاح!',
    redirectingToPayment: 'جاري التوجيه إلى بوابة الدفع...',
    postAnother: 'نشر إعلان جديد',
    goToMyAds: 'الذهاب إلى إعلاناتي',
    reviewNote: 'سيظهر إعلانك فور مراجعته والموافقة عليه من قبل الإدارة.',
  },

  // ── Dynamic category steps ────────────────────────────────────────────────
  category: {
    areaUnit: 'م²',
    areaWithUnit: '{value} م²',
  },

  // ── Location steps (country / state / city) ───────────────────────────────
  location: {
    countryTitle: 'الدولة',
    stateTitle: 'المحافظة / الولاية',
    cityTitle: 'المنطقة / المدينة',
    noStates: 'لا يوجد محافظات متوفرة لهذه الدولة',
    noCities: 'لا يوجد مدن متوفرة لهذه المحافظة',
  },

  // ── Media step (video + photos on one step) ───────────────────────────────
  media: {
    title: 'صور وفيديو العقار',
  },

  // ── Video section ─────────────────────────────────────────────────────────
  video: {
    title: 'ارفع فيديو (اختياري)',
    choose: 'اختر فيديو',
    formats: 'MP4, MOV',
    optimizingHint: 'MP4، MOV · سنقوم بتحسينه تلقائياً',
    uploaded: 'تم الرفع',
    remove: 'إزالة الفيديو',
    cancel: 'إلغاء',
    previewAlt: 'معاينة الفيديو',
    optimizing: 'جاري تحسين الفيديو… {percent}%',
    compressing: 'جاري ضغط الفيديو وتصغير أبعاده… {percent}%',
    compressingDetail: 'نقوم بتقليل حجم الفيديو ليتم رفعه بشكل أسرع.',
    continueInBackground:
      'يمكنك متابعة الخطوات التالية بينما نعمل في الخلفية لتوفير وقتك.',
    optimized: 'تم الرفع · {before} ← {after} (أصغر بنسبة {percent}%)',
    comparing: 'جاري التصغير… (كان {size})',
    savedPercent: 'أصغر بنسبة {percent}%',
    alreadyOptimized: 'محسّن بالفعل · {size}',
    backgroundNotice: 'رائع — تابع الخطوات! سنقوم بتحسين ورفع الفيديو في الخلفية.',
    waitForCompress: 'يرجى الانتظار حتى ينتهي تحسين الفيديو',
    uploadProgress: 'جاري الرفع {percent}%',
    uploadDetail: '{uploaded} من {total}',
    processing: 'جاري الإنهاء...',
    processingDetail: 'اكتمل الرفع، ونقوم الآن بتجهيز الفيديو.',
    etaSeconds: 'يتبقى ~{seconds} ثانية',
    etaMinutes: 'يتبقى ~{minutes} دقيقة',
    typeError: 'يجب أن يكون الفيديو بصيغة MP4 أو MOV فقط.',
    tooLarge:
      'حجم هذا الفيديو {size} (الحد {max}). جرّب مقطعاً أقصر — نقوم بتحسينه تلقائياً.',
    uploadFailed: 'فشل رفع الفيديو. يرجى المحاولة مرة أخرى.',
    uploadFailedRemove: 'فشل رفع الفيديو. يرجى إزالته والمحاولة مرة أخرى.',
    waitForUpload: 'انتظر حتى ينتهي رفع الفيديو',
    uploadError: 'حدث خطأ أثناء رفع الفيديو',
    mergeFailed: 'تعذر إكمال معالجة الفيديو. يرجى المحاولة مرة أخرى.',
  },

  // ── Images step ───────────────────────────────────────────────────────────
  images: {
    title: 'صور العقار',
    addImages: 'إضافة صور',
    removeImage: 'إزالة الصورة',
    imageAlt: 'صورة العقار {index}',
    selectedCount: '{count} صورة مختارة · JPG, JPEG, PNG',
    // Arabic's bare singular already reads correctly for one; the variant
    // exists so English can differ (the dictionaries must stay identical).
    selectedCount_one: 'صورة واحدة مختارة · JPG, JPEG, PNG',
    typeError: 'يجب أن تكون الصورة بصيغة JPG أو JPEG أو PNG فقط.',
    tooLarge: 'بعض الصور كبيرة جداً للمعالجة (الحد {max}) وتم تخطيها.',
    // No plural variant: the call site passes {done, total}, not `count`, so
    // resolve() would never pick one up.
    optimizing: 'جاري تحسين الصورة {done} من {total}...',
    watermarking: 'جاري إضافة العلامة المائية...',
    watermarkFailed: 'تعذّرت إضافة العلامة المائية على {count} صورة',
    optimized: 'تم تحسين {count} صور · {before} ← {after} (أصغر بنسبة {percent}%)',
    optimized_one: 'تم تحسين الصورة · {before} ← {after} (أصغر بنسبة {percent}%)',
    waitForOptimize: 'انتظر حتى ينتهي تحسين الصور',
  },

  // ── Details step (price / title / description) ────────────────────────────
  details: {
    title: 'تفاصيل الإعلان',
    hint: 'أدخل تفاصيل إعلانك — يمكنك الانتقال بين الحقول من لوحة المفاتيح',
    priceLabel: 'السعر (د.ك)',
    pricePlaceholder: '0',
    titleLabel: 'عنوان الإعلان',
    titlePlaceholder: 'مثال: شقة للإيجار في السالمية',
    descriptionLabel: 'وصف الإعلان',
    descriptionPlaceholder: 'اكتب وصفاً تفصيلياً للعقار...',
    descriptionMinHint: '10 حروف على الأقل',
    descriptionOk: 'ممتاز — يمكنك المتابعة',
  },

  // ── Summary step ──────────────────────────────────────────────────────────
  summary: {
    title: 'ملخص الإعلان',
    country: 'الدولة',
    state: 'المحافظة',
    city: 'المنطقة',
    price: 'السعر',
    priceWithCurrency: '{price} د.ك',
    emptyValue: '—',
    publishFeeLabel: 'سعر اضافه اعلان',
    publishFeeValue: '١٥٠ فلس',
  },

  // ── Footer actions ────────────────────────────────────────────────────────
  footer: {
    payAndPublish: 'الدفع والنشر',
  },

  // ── Payment flow ──────────────────────────────────────────────────────────
  payment: {
    sessionFailed: 'فشل بدء جلسة الدفع الآمن',
    gatewayError: 'حدث خطأ أثناء الاتصال ببوابة الدفع',
    transactionNotFound: 'فشل العثور على رقم العملية',
    verifyFailed: 'فشل إتمام عملية الدفع',
    confirmError: 'حدث خطأ أثناء تأكيد الدفع',
    operationFailed: 'فشل العملية',
    errorWithMessage: 'خطأ في الدفع: {message}',
  },

  // ── Publish errors ────────────────────────────────────────────────────────
  errors: {
    createFailed: 'حدث خطأ، يرجى المحاولة مجدداً',
    unexpected: 'حدث خطأ غير متوقع!',
  },

  // ── Fallback values sent to the backend ───────────────────────────────────
  defaults: {
    adTitle: 'عقار في {location}',
    kuwait: 'الكويت',
  },
};
