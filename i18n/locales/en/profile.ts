export const profile = {
  // Shared actions inside the profile area
  saveChanges: 'Save changes',

  page: {
    defaultUserName: 'User',
    defaultCompanyName: 'Company',
    unavailable: {
      title: 'Profile unavailable',
      hint: 'This account may be hidden or suspended by the administrators.',
    },
    newBadge: 'New',

    statAds: 'Ads',
    statLikes: 'Likes',
    statViews: 'Views',

    socialLinksTitle: 'Social links',
    socialLinksAria: 'Edit social links',
    editProfileTitle: 'Edit profile',
    editProfileAria: 'Edit profile',

    myAdsHeading: 'My ads',
    userAdsHeading: "{name}'s ads",
    tabMyAds: 'My ads',
    tabFavorites: 'My favorites',
    emptyAds: 'No ads yet',
    editAd: 'Edit ad',
    deleteAd: 'Delete ad',
    deleteAdConfirm: 'Delete this ad permanently?',
    deleteAdSuccess: 'Ad deleted',
    deleteAdError: 'Could not delete the ad',
    editAdTitle: 'Edit ad',
    adTitleLabel: 'Title',
    adDescriptionLabel: 'Description',
    adPriceLabel: 'Price',
    updateAdSuccess: 'Ad updated',
    updateAdError: 'Could not update the ad',
    startChat: 'Start chat',

    sendWhatsapp: 'WhatsApp',
    call: 'Call',
  },

  editDialog: {
    title: 'Update profile',
    avatarAlt: 'Image preview',
    changeAvatar: 'Change',
    nameLabel: 'Name',
    namePlaceholder: 'Enter your name',
    bioLabel: 'Bio',
    bioPlaceholder: 'Tell us something about yourself...',
    minCharsHint: 'At least {min} characters',
    updateSuccess: 'Profile updated',
    updateError: 'Something went wrong while updating',
  },

  socialsDialog: {
    title: 'Social links',
    loadError: 'Something went wrong while loading social platforms',
    linkPlaceholder: 'https://',
    emptyFieldHint: 'Leave a field empty to remove its link',
    saveSuccess: 'Social links saved',
    saveError: 'Something went wrong while saving',
  },

  // Hotel profile management — use case 1.2
  hotel: {
    title: 'Hotel profile',
    subtitle: 'Complete your hotel details so guests can find and contact you',
    manageCta: 'Manage hotel profile',

    logoLabel: 'Hotel logo',
    coverLabel: 'Cover image',
    coverHint: 'Optional — shown as the background of your public profile',
    coverReplace: 'Change cover',
    coverAdd: 'Add a cover image',

    nameLabel: 'Hotel name',
    namePlaceholder: 'Enter the hotel name',
    captionLabel: 'About the hotel',
    captionPlaceholder: 'Tell guests about the hotel and its facilities...',

    websiteLabel: 'Website',
    websitePlaceholder: 'hotel.com',
    websiteHint: 'Optional',

    starRatingLabel: 'Star rating',
    starRatingPlaceholder: 'Not specified',
    starRatingHint: 'Optional — your hotel classification, 1 to 5 stars',
    starsOne: '1 star',
    starsTwo: '2 stars',
    starsMany: '{count} stars',

    emailLabel: 'Email',
    whatsappLabel: 'WhatsApp number',
    countryLabel: 'Country',
    stateLabel: 'Governorate',

    ratingSummary: '{rate} from {count} ratings',
    noRatingsYet: 'No ratings yet',

    save: 'Save changes',
    saveSuccess: 'Hotel profile updated',
    saveError: 'Something went wrong while saving the profile',

    onlyHotelAccounts: 'This section is available for hotel accounts only.',

    validation: {
      websiteInvalid: 'Enter a valid website address',
      starRatingRange: 'Star rating must be between 1 and 5',
    },
  },
};
