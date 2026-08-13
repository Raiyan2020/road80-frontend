export const profile = {
  // Shared actions inside the profile area
  saveChanges: 'حفظ التغييرات',

  page: {
    defaultUserName: 'مستخدم',
    defaultCompanyName: 'شركة',
    // The company is hidden, suspended, or still awaiting approval — all 404.
    unavailable: {
      title: 'الملف الشخصي غير متاح',
      hint: 'قد يكون هذا الحساب مخفياً أو تم إيقافه من قبل الإدارة.',
    },
    newBadge: 'جديد',

    statAds: 'الإعلانات',
    statLikes: 'الإعجابات',
    statViews: 'المشاهدات',

    socialLinksTitle: 'روابط التواصل',
    socialLinksAria: 'تعديل روابط التواصل',
    editProfileTitle: 'تعديل الملف الشخصي',
    editProfileAria: 'تعديل الملف الشخصي',

    myAdsHeading: 'اعلاناتي',
    userAdsHeading: 'إعلانات {name}',
    tabMyAds: 'اعلاناتي',
    tabFavorites: 'مفضلتي',
    emptyFavorites: 'لا توجد إعلانات مفضلة بعد',
    emptyAds: 'لا توجد إعلانات',
    editAd: 'تعديل الإعلان',
    deleteAd: 'حذف الإعلان',
    deleteAdConfirm: 'هل تريد حذف هذا الإعلان نهائياً؟',
    deleteAdSuccess: 'تم حذف الإعلان',
    deleteAdError: 'تعذر حذف الإعلان',
    editAdTitle: 'تعديل الإعلان',
    adTitleLabel: 'العنوان',
    adDescriptionLabel: 'الوصف',
    adPriceLabel: 'السعر',
    updateAdSuccess: 'تم تحديث الإعلان',
    updateAdError: 'تعذر تحديث الإعلان',
    startChat: 'بدء محادثة',

    sendWhatsapp: 'ارسال واتساب',
    call: 'اتصال',
  },

  editDialog: {
    title: 'تحديث الملف الشخصي',
    avatarAlt: 'معاينة الصورة',
    changeAvatar: 'تغيير',
    nameLabel: 'الاسم',
    namePlaceholder: 'أدخل اسمك',
    bioLabel: 'البايو (الوصف)',
    bioPlaceholder: 'اكتب شيئاً عن نفسك...',
    minCharsHint: '{min} حروف على الأقل',
    updateSuccess: 'تم تحديث الملف الشخصي بنجاح',
    updateError: 'حدث خطأ أثناء التحديث',
  },

  socialsDialog: {
    title: 'روابط التواصل',
    loadError: 'تعذر تحميل منصات التواصل',
    linkPlaceholder: 'https://',
    emptyFieldHint: 'اترك الحقل فارغاً لحذف الرابط',
    saveSuccess: 'تم حفظ روابط التواصل بنجاح',
    saveError: 'حدث خطأ أثناء الحفظ',
  },

  // إدارة بروفايل الفندق — حالة الاستخدام 1.2
  hotel: {
    title: 'بروفايل الفندق',
    subtitle: 'أكمل بيانات فندقك ليتمكن الضيوف من الوصول إليك والتواصل معك',
    manageCta: 'إدارة بروفايل الفندق',

    logoLabel: 'شعار الفندق',
    coverLabel: 'صورة الغلاف',
    coverHint: 'اختياري — تظهر كخلفية للبروفايل العام',
    coverReplace: 'تغيير صورة الغلاف',
    coverAdd: 'إضافة صورة غلاف',

    nameLabel: 'اسم الفندق',
    namePlaceholder: 'أدخل اسم الفندق',
    captionLabel: 'نبذة عن الفندق',
    captionPlaceholder: 'تحدث عن الفندق ومرافقه...',

    websiteLabel: 'الموقع الإلكتروني',
    websitePlaceholder: 'hotel.com',
    websiteHint: 'اختياري',

    starRatingLabel: 'تصنيف النجوم',
    starRatingNotSet: 'لم يتم تصنيفه من الإدارة بعد',
    starRatingHint: 'يتم تحديده من قبل إدارة المنصة',
    // Arabic marks singular / dual / plural separately — a single
    // '{count} نجوم' template renders "1 نجوم", which is wrong.
    starsOne: 'نجمة واحدة',
    starsTwo: 'نجمتان',
    starsMany: '{count} نجوم',

    emailLabel: 'البريد الإلكتروني',
    whatsappLabel: 'رقم الواتساب',
    countryLabel: 'الدولة',
    stateLabel: 'المحافظة',

    ratingSummary: '{rate} من {count} تقييم',
    noRatingsYet: 'لا توجد تقييمات بعد',

    save: 'حفظ التعديلات',
    saveSuccess: 'تم تحديث بروفايل الفندق',
    saveError: 'حدث خطأ أثناء حفظ البروفايل',

    onlyHotelAccounts: 'هذا القسم متاح لحسابات الفنادق فقط.',

    validation: {
      websiteInvalid: 'أدخل عنوان موقع إلكتروني صحيح',
    },
  },
};
