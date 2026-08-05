export const quickStart = {
  // Splash screen shown before the wizard
  splash: {
    logoAlt: 'شعار رود 80',
  },

  // Step 1 — name
  name: {
    title: 'مرحباً بك 👋',
    subtitle: 'الرجاء إدخال اسمك لنبدأ',
    placeholder: 'الاسم الكامل',
  },

  // Step 2 — country
  country: {
    title: 'اختر بلدك',
    subtitle: 'أين تبحث عن عقارك القادم؟',
  },

  // Step 3 — governorate
  governorate: {
    // Was 'اختر المنطقة' (area), but this step selects a governorate — the
    // subtitle and the step's behaviour both say محافظة.
    title: 'اختر المحافظة',
    subtitle: 'في أي محافظة تود البحث؟',
  },

  // Step 4 — city
  city: {
    title: 'اختر المدينة',
    subtitle: 'حدد المدينة المفضلة لديك',
  },

  // Steps 5+ — dynamic preference filters coming from the API
  preferences: {
    title: 'تفضيلات البحث',
    subtitle: 'ساعدنا في عرض ما يهمك أولاً',
  },

  // Shared wizard chrome
  stepCounter: 'الخطوة {current} من {total}',
};
