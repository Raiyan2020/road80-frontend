export const home = {
  // Country switcher (top of the home screen)
  country: {
    label: 'الدولة',
    fallbackName: 'الكويت',
  },

  // Theme toggle button
  toggleTheme: 'تبديل المظهر',

  // Interactive search card
  search: {
    label: 'عن ماذا تبحث',
    placeholder: 'اضغط لتحديد طلبك',
  },

  // Quick actions row (fallback labels when the API returns nothing)
  quickActions: {
    rent: 'إيجار',
    sale: 'بيع',
    hotels: 'فنادق',

    // Card copy. `generic` covers contract types we have no artwork for —
    // {name} is the category value as the API localized it.
    subtitle: {
      rent: 'ابحث عن العقار المناسب للإيجار بخيارات متنوعة',
      sale: 'تصفح آلاف العقارات المعروضة للبيع وابحث عن استثمارك القادم',
      hotels: 'احجز أفضل الفنادق بأفضل الأسعار حول العالم',
      generic: 'تصفح جميع العروض ضمن قسم {name}',
    },
    cta: {
      rent: 'استكشف الإيجارات',
      sale: 'استكشف المعروضات',
      hotels: 'استكشف الفنادق',
      generic: 'استكشف {name}',
    },
  },

  // Suggested listings section
  listings: {
    title: 'احدث الاعلانات المضافة تناسب طلبك',
    empty: 'لا توجد لديك أي مقترحات بناءً على اختيارك، ابدأ الاستكشاف معنا',
    startExploring: 'ابدأ الاستكشاف',
  },

  // Promotional banners
  banner: {
    headerAlt: 'إعلان ترويجي',
    footerAlt: 'إعلان ترويجي أسفل الصفحة',
  },
};
