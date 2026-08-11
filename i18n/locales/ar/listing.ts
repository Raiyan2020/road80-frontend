export const listing = {
  // Header / summary card
  defaultPublisherName: 'مستخدم',
  defaultTitle: 'إعلان على طريق 80',
  shareAd: 'مشاركة الإعلان',
  addToFavorites: 'إضافة إلى المفضلة',
  removeFromFavorites: 'إزالة من المفضلة',
  // Arabic's bare singular is count-agnostic, so the variants share a form.
  // They exist so the English side can differ — the two dictionaries must
  // stay structurally identical.
  views: '{count} مشاهدة',
  views_one: 'مشاهدة واحدة',
  location: '{city}، {state}',

  // Hidden by an admin (`is_hidden`), deleted, or never existed — all 404.
  unavailable: {
    title: 'الإعلان غير متاح',
    hint: 'قد يكون هذا الإعلان قد أُخفي أو حُذف.',
    back: 'رجوع',
  },

  // Sections
  propertyDetails: 'تفاصيل العقار',
  description: 'الوصف',
  noDescription: 'لا يوجد وصف متاح لهذا العقار.',
  safetyTips: 'نصائح السلامة',

  // Media gallery
  gallery: {
    fullscreen: 'ملء الشاشة',
    slideAlt: 'صورة الإعلان {index}',
    thumbAlt: 'صورة مصغرة {index}',
  },

  // Static attribute labels
  attrs: {
    listingType: 'نوع الإعلان',
    propertyType: 'نوع العقار',
    size: 'المساحة',
    sizeValue: '{size} م²',
    rooms: 'الغرف',
    bathrooms: 'الحمامات',
    balcony: 'بلكونة',
    parking: 'المواقف',
    parkingSystem: 'نظام المواقف',
    ac: 'التكييف',
    electricity: 'الكهرباء',
    water: 'الماء',
  },

  // Contact actions
  contact: {
    whatsapp: 'واتساب',
    call: 'اتصال',
    available: 'بيانات التواصل متاحة',
    phoneLabel: 'الهاتف: {phone}',
    whatsappLabel: 'واتساب: {whatsapp}',
    numberLabel: 'رقم التواصل: {phone}',
    copyNumber: 'نسخ الرقم',
    numberCopied: 'تم نسخ الرقم بنجاح',
    callError: 'حدث خطأ أثناء محاولة الاتصال',
  },

  // Unlock sheet
  unlock: {
    title: 'فتح التواصل مع ناشر الإعلان',
    description: 'لفتح القفل والتواصل مع البائع في هذا الإعلان، يرجى الدفع مرة واحدة فقط.',
    feeLabel: 'سعر فتح الاعلان:',
    fee: '١٥٠ فلس',
    unlocked: 'تم فتح التواصل مع ناشر الإعلان',
  },

  // Payment flow
  payment: {
    completeTitle: 'إكمال عملية الدفع',
    backToOptions: 'العودة لخيارات الدفع',
    applePay: 'الدفع السريع',
    card: 'الدفع ببطاقة بنكية',
    starting: 'جاري بدء عملية الدفع...',
    verifying: 'جاري التحقق من الدفع...',
    confirming: 'جاري تأكيد العملية...',
    succeeded: 'تم الدفع بنجاح',
    success: 'تم الدفع بنجاح!',
    successUnlocked: 'تم الدفع بنجاح وتحرير رقم التواصل!',
    failed: 'فشل الدفع',
    sessionCreateFailed: 'حدث خطأ أثناء إنشاء جلسة الدفع',
    cannotVerify: 'خطأ: لا يمكن التحقق من الدفع، يرجى المحاولة مجدداً',
    verifyFailed: 'فشل التحقق من الدفع',
    verifyError: 'حدث خطأ أثناء التحقق من الدفع',
  },

  // Favorites
  favorites: {
    added: 'تمت الإضافة إلى المفضلة',
    removed: 'تمت الإزالة من المفضلة',
    error: 'حدث خطأ أثناء تعديل المفضلة',
  },
};
