export const payment = {
  // Card form / embedded MyFatoorah widget
  form: {
    title: 'تفاصيل الدفع الآمن',
    payNow: 'ادفع الآن',
    securedBy: 'دفع آمن بدعم من MyFatoorah',
  },

  // Transient states shown around the embedded form
  status: {
    loadingGateway: 'جاري تحميل نظام الدفع...',
    processing: 'جاري معالجة الدفع...',
  },

  // Failures — both our own and the ones mapped from the MyFatoorah SDK
  errors: {
    paymentFailed: 'فشل الدفع',
    initFailed: 'فشل تهيئة نظام الدفع. يرجى المحاولة لاحقاً.',
    sessionExpired: 'انتهت صلاحية الجلسة، جاري إنشاء جلسة جديدة...',
    sessionInvalid: 'جلسة الدفع غير صالحة. تأكد من تفعيل الدفع المدمج في حسابك على MyFatoorah.',
    cardDetailsInvalid: 'بيانات البطاقة غير صالحة أو غير مكتملة',
    cardNumberInvalid: 'رقم البطاقة غير صالح',
    expiryInvalid: 'تاريخ الانتهاء غير صالح',
    cvvInvalid: 'رمز التحقق (CVV) غير صالح',
    insufficientFunds: 'الرصيد غير كافٍ',
    declined: 'تم رفض العملية من قبل البنك',
    cardExpired: 'انتهت صلاحية هذه البطاقة. يرجى استخدام بطاقة أخرى.',
    authenticationFailed:
      'فشل التحقق من البنك (3-D Secure). يرجى المحاولة مرة أخرى أو استخدام بطاقة أخرى.',
    notPermitted: 'البنك لا يسمح بهذا النوع من العمليات على هذه البطاقة',
    doNotHonour: 'رفض البنك هذه العملية. يرجى التواصل مع البنك أو استخدام بطاقة أخرى.',
    restrictedCard: 'هذه البطاقة مقيدة ولا يمكن استخدامها لإتمام هذا الدفع',
    invalidMerchant: 'تعذر إتمام عملية الدفع. يرجى المحاولة لاحقاً.',
    limitExceeded: 'هذه العملية تتجاوز الحد المسموح به لبطاقتك',
    // تُعرض بدلاً من تمرير رسالة غير مترجمة من الـ SDK كما هي
    gatewayError: 'تعذر إتمام عملية الدفع. يرجى المحاولة مرة أخرى أو استخدام بطاقة أخرى.',
  },
};
