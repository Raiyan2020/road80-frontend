export const profile = {
  // Shared actions inside the profile area
  saveChanges: 'حفظ التغييرات',

  page: {
    defaultUserName: 'مستخدم',
    defaultCompanyName: 'شركة',
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
    emptyAds: 'لا توجد إعلانات',

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
    starRatingPlaceholder: 'غير محدد',
    starRatingHint: 'اختياري — تصنيف الفندق من 1 إلى 5 نجوم',
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
      starRatingRange: 'تصنيف النجوم يجب أن يكون بين 1 و 5',
    },
  },
};
