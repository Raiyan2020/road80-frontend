export const auth = {
  // Login screen (phone step)
  login: {
    title: 'Log in',
    subtitle: "Welcome to 80road, Kuwait's real estate marketplace",
    phoneLabel: 'Phone number',
    // 'Log in', not 'Continue' — the screen title and the consent line below
    // both say "log in"; a "Continue" button contradicts them.
    submit: 'Log in',
    phoneIncomplete: 'Please enter your full phone number ({digits} digits)',
    sendCodeFailed: 'Could not send the code',
  },

  // OTP verification screen
  verify: {
    title: 'Verify your number',
    codeSentTo: 'We sent a verification code to {phone}',
    confirm: 'Confirm',
    invalidCode: 'The verification code is incorrect',
    resend: 'Resend code',
    resendIn: 'Resend in {seconds}s',
    resendSuccess: 'Verification code resent',
    resendFailed: 'Could not resend the code',
    resendFailedRetry: 'Could not resend the code, please try again',
    changePhone: 'Change phone number',
  },

  // Footer under the auth card
  footer: {
    registerCompanyCta: 'Create a real estate agency, company, or hotel account',
    consentPrefix: 'By logging in you agree to the',
    and: 'and the',
  },

  // Fallback display name for a user with no name set
  defaultUserName: 'User',

  // Company registration screen
  registerCompany: {
    back: 'Back',
    title: 'Register a new company',
    subtitle:
      "Join the 80road real estate network and start showcasing your company's properties to a wide audience",
    logoLabel: 'Company logo',
    emailLabel: 'Email',
    nameLabel: 'Company name',
    namePlaceholder: 'Enter the company name',
    // 'Category', matching nav.categories and the companies-list filter —
    // this is the same taxonomy, previously called two different things.
    departmentLabel: 'Category',
    departmentPlaceholder: 'Select a category',
    countryLabel: 'Country',
    countryPlaceholder: 'Select a country',
    stateLabel: 'Governorate',
    statePlaceholder: 'Select a governorate',
    selectCountryFirst: 'Select a country first',
    phoneLabel: 'Phone number',
    whatsappLabel: 'WhatsApp number',
    digitsPlaceholder: 'Enter {digits} digits',
    captionLabel: 'Company description',
    captionPlaceholder: 'Tell us a little about your real estate business...',
    submit: 'Submit registration',
    successToast: 'Registration submitted — our team will review it shortly',
    errorToast: 'Something went wrong during registration',
    errorRetryLater: 'Something went wrong during registration, please try again later',

    // Account type selector (company vs hotel) — use case 1.1
    accountTypeLabel: 'Account type',
    accountTypeHint: 'Choose the type of account you want to create',
    accountTypeCompany: 'Company',
    accountTypeCompanyHint: 'Real estate office or contracting company',
    accountTypeHotel: 'Hotel',
    accountTypeHotelHint: 'Hotel or hospitality venue',

    // Hotel-specific labels — the rest of the form is shared with companies
    titleHotel: 'Register a new hotel',
    subtitleHotel: 'Join the 80road network and showcase your hotel to a wide audience',
    logoLabelHotel: 'Hotel logo',
    nameLabelHotel: 'Hotel name',
    namePlaceholderHotel: 'Enter the hotel name',
    captionLabelHotel: 'Hotel description',
    captionPlaceholderHotel: 'Tell us a little about the hotel and its facilities...',
  },

  // Pending-approval screen shown after registration and on blocked login
  pendingApproval: {
    title: 'Your request is under review',
    description: 'We received your registration. Our team will review it and let you know once the account is approved.',
    rejectedTitle: 'Registration not approved',
    rejectedDescription: 'Unfortunately your registration was not approved. Please contact support for more details.',
    backToLogin: 'Back to login',
    backToHome: 'Back to home',
  },

  // Auth-specific validation messages
  validation: {
    emailInvalid: 'Enter a valid email address',
    emailRequired: 'Email is required',
    captionRequired: 'Please enter a company description',
    phoneDigitsOnly: 'Phone number must contain digits only',
    whatsappDigitsOnly: 'WhatsApp number must contain digits only',
    phoneExactDigits: 'Phone number must be {digits} digits',
    whatsappExactDigits: 'WhatsApp number must be {digits} digits',
    imageTypeOrSize: 'Please upload a JPG or PNG image smaller than 1 MB',
  },
};
