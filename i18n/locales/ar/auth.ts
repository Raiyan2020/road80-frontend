export const auth = {
  // Login screen (phone step)
  login: {
    title: 'تسجيل الدخول',
    subtitle: 'أهلاً بك في منصة 80road العقارية',
    phoneLabel: 'رقم الهاتف',
    submit: 'دخول',
    phoneIncomplete: 'يرجى إدخال رقم الهاتف كاملاً ({digits} أرقام)',
    sendCodeFailed: 'فشل إرسال الرمز',
  },

  // OTP verification screen
  verify: {
    title: 'التحقق',
    codeSentTo: 'تم إرسال رمز التفعيل إلى {phone}',
    confirm: 'تأكيد',
    invalidCode: 'رمز التفعيل غير صحيح',
    resend: 'إعادة إرسال الرمز',
    resendIn: 'إعادة الإرسال بعد {seconds} ثانية',
    resendSuccess: 'تم إعادة إرسال رمز التفعيل',
    resendFailed: 'فشل إعادة الإرسال',
    resendFailedRetry: 'فشل إعادة الإرسال، حاول مرة أخرى',
    changePhone: 'تغيير رقم الهاتف',
  },

  // Footer under the auth card
  footer: {
    registerCompanyCta: 'إنشاء حساب مكتب عقاري / شركة',
    consentPrefix: 'بتسجيل الدخول فإنك تقبل',
    and: 'و',
  },

  // Fallback display name for a user with no name set
  defaultUserName: 'مستخدم',

  // Company registration screen
  registerCompany: {
    back: 'العودة للخلف',
    title: 'تسجيل شركة جديدة',
    subtitle: 'انضم إلى شبكة 80road العقارية وابدأ بعرض عقارات شركتك لجمهور واسع',
    logoLabel: 'شعار الشركة',
    emailLabel: 'البريد الإلكتروني (اختياري)',
    nameLabel: 'اسم الشركة',
    namePlaceholder: 'أدخل اسم الشركة',
    departmentLabel: 'القسم',
    departmentPlaceholder: 'اختر القسم',
    countryLabel: 'الدولة',
    countryPlaceholder: 'اختر الدولة',
    stateLabel: 'المحافظة',
    statePlaceholder: 'اختر المحافظة',
    selectCountryFirst: 'اختر الدولة أولاً',
    phoneLabel: 'رقم الهاتف',
    whatsappLabel: 'رقم الواتساب',
    digitsPlaceholder: 'أدخل {digits} أرقام',
    captionLabel: 'وصف الشركة',
    captionPlaceholder: 'تحدث قليلاً عن نشاط الشركة العقاري...',
    submit: 'تقديم طلب التسجيل',
    successToast: 'تم التسجيل بنجاح، في انتظار موافقة الإدارة',
    errorToast: 'حدث خطأ ما أثناء التسجيل',
    errorRetryLater: 'حدث خطأ ما أثناء التسجيل، يرجى المحاولة لاحقاً',
  },

  // Auth-specific validation messages
  validation: {
    emailInvalid: 'البريد الإلكتروني غير صحيح',
    captionRequired: 'يرجى إدخال وصف الشركة',
    phoneDigitsOnly: 'رقم الهاتف يجب أن يحتوي على أرقام فقط',
    whatsappDigitsOnly: 'رقم الواتساب يجب أن يحتوي على أرقام فقط',
    phoneExactDigits: 'رقم الهاتف يجب أن يكون {digits} أرقام',
    whatsappExactDigits: 'رقم الواتساب يجب أن يكون {digits} أرقام',
    imageTypeOrSize: 'يرجى رفع صورة بصيغة JPG أو PNG وحجم أقل من 1 ميجابايت',
  },
};
