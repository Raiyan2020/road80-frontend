export const listing = {
  // Header / summary card
  defaultPublisherName: 'User',
  defaultTitle: 'Listing on 80road',
  shareAd: 'Share listing',
  addToFavorites: 'Add to favorites',
  removeFromFavorites: 'Remove from favorites',
  views: '{count} views',
  views_one: '1 view',
  location: '{city}, {state}',

  unavailable: {
    title: 'Listing unavailable',
    hint: 'This listing may have been hidden or deleted.',
    back: 'Go back',
  },

  // Sections
  propertyDetails: 'Property details',
  description: 'Description',
  noDescription: 'No description available for this property.',
  safetyTips: 'Safety tips',

  // Media gallery
  gallery: {
    fullscreen: 'Full screen',
    slideAlt: 'Property photo {index}',
    thumbAlt: 'Thumbnail {index}',
  },

  // Static attribute labels
  attrs: {
    listingType: 'Ad type',
    propertyType: 'Property type',
    // 'Size' not 'Area' — المنطقة (district) is already 'Area' elsewhere, and
    // both labels appear on this screen.
    size: 'Size',
    sizeValue: '{size} m²',
    rooms: 'Rooms',
    bathrooms: 'Bathrooms',
    balcony: 'Balcony',
    parking: 'Parking',
    parkingSystem: 'Parking system',
    ac: 'Air conditioning',
    electricity: 'Electricity',
    water: 'Water',
  },

  // Contact actions
  contact: {
    whatsapp: 'WhatsApp',
    call: 'Call',
    chat: 'Chat',
    chatError: 'Could not start the property conversation',
    available: 'Contact details are available',
    phoneLabel: 'Phone: {phone}',
    whatsappLabel: 'WhatsApp: {whatsapp}',
    numberLabel: 'Contact number: {phone}',
    copyNumber: 'Copy number',
    numberCopied: 'Number copied',
    callError: 'Something went wrong while starting the call',
  },

  // Unlock sheet
  unlock: {
    title: "Unlock the advertiser's contact details",
    // The Arabic unlocks CONTACT WITH THE ADVERTISER, not the ad itself —
    // the ad is already visible. The previous wording misdescribed what the
    // customer is paying for.
    description:
      "Pay once to unlock the advertiser's contact details for this ad.",
    feeLabel: 'Unlock fee:',
    fee: '150 fils',
    unlocked: "The advertiser's contact details are now unlocked",
  },

  // Payment flow
  payment: {
    completeTitle: 'Complete your payment',
    backToOptions: 'Back to payment options',
    applePay: 'Express pay',
    card: 'Pay by bank card',
    starting: 'Starting payment...',
    verifying: 'Verifying payment...',
    confirming: 'Confirming transaction...',
    succeeded: 'Payment successful',
    success: 'Payment successful!',
    successUnlocked: 'Payment successful — contact number unlocked!',
    failed: 'Payment failed',
    sessionCreateFailed: 'Something went wrong while starting the payment session',
    cannotVerify: 'The payment could not be verified, please try again',
    verifyFailed: 'Payment verification failed',
    verifyError: 'Something went wrong while verifying the payment',
  },

  // Favorites
  favorites: {
    added: 'Added to favorites',
    removed: 'Removed from favorites',
    error: 'Something went wrong while updating your favorites',
  },
};
