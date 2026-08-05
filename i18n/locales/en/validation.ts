export const validation = {
  // Generic
  required: 'This field is required',
  invalid: 'Invalid value',
  minLength: 'Must be at least {min} characters',
  maxLength: 'Must not exceed {max} characters',
  digitsOnly: 'Enter digits only',

  // Name
  nameMin3: 'Name must be at least 3 characters',
  nameMin2: 'Name must be at least 2 characters',
  nameTooLong: 'Name is too long',
  nameMinChars: 'Name must be at least {min} characters',

  // Description / bio
  descriptionMin3: 'Description must be more than 3 characters',
  descriptionMin10: 'Description must be at least 10 characters',
  // 'Bio', matching the field label it appears under.
  bioMinChars: 'Bio must be at least {min} characters',

  // Phone
  phoneInvalid: 'Enter a valid phone number',
  phoneRange: 'Phone number must be between 9 and 15 digits',
  whatsappRange: 'WhatsApp number must be between 9 and 15 digits',

  // OTP
  otpLength: 'Enter the 4-digit verification code',

  // Selects
  selectCountry: 'Please select a country',
  selectGovernorate: 'Please select a governorate',
  selectArea: 'Please select an area',
  selectDepartment: 'Please select a category',
  selectPropertyType: 'Please select a property type',
  selectPurpose: 'Please select what you are looking for',
  selectRequiredOptions: 'Please fill in the required options before continuing',

  // Media
  uploadCompanyImage: 'Please upload a company logo',
  imageTooLarge: 'Sorry, the image must be under 1 MB and in JPG or PNG format only.',

  // Ad fields
  priceRequired: 'Price is required',
  enterPrice: 'Please enter a price',
  enterAdTitle: 'Please enter an ad title',
  adDescriptionMin10: 'Ad description must be at least 10 characters',

  // Links
  linkTooLong: 'Link must not exceed {max} characters',
  linkInvalid: 'Please enter a valid link',
};
