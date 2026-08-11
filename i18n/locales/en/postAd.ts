export const postAd = {
  // ── Wizard progress header ────────────────────────────────────────────────
  progress: {
    stepOf: 'Step {current} of {total}',
  },

  // ── Success screen (after publishing) ─────────────────────────────────────
  success: {
    title: 'Your ad has been received!',
    redirectingToPayment: 'Taking you to the payment gateway...',
    postAnother: 'Post another ad',
    goToMyAds: 'Go to my ads',
    reviewNote: 'Your ad goes live as soon as our team reviews and approves it.',
    publishedNote: 'Your company content is now live and available without fees.',
  },

  // ── Dynamic category steps ────────────────────────────────────────────────
  category: {
    areaUnit: 'm²',
    areaWithUnit: '{value} m²',
  },

  // ── Location steps (country / state / city) ───────────────────────────────
  location: {
    countryTitle: 'Country',
    stateTitle: 'Governorate / State',
    cityTitle: 'Area / City',
    noStates: 'No governorates are available for this country',
    noCities: 'No cities are available for this governorate',
  },

  // ── Video step ────────────────────────────────────────────────────────────
  media: {
    title: 'Photos & video',
  },

  video: {
    title: 'Upload a video (optional)',
    choose: 'Choose a video',
    formats: 'MP4, MOV',
    optimizingHint: "MP4, MOV · we'll optimise it for you",
    uploaded: 'Uploaded',
    remove: 'Remove video',
    cancel: 'Cancel',
    previewAlt: 'Video preview',
    optimizing: 'Optimising video… {percent}%',
    compressing: 'Compressing and resizing video… {percent}%',
    compressingDetail: 'We’re reducing the video size for a faster upload.',
    continueInBackground:
      'You can continue with the next steps while we work in the background and save time.',
    optimized: 'Uploaded · {before} → {after} ({percent}% smaller)',
    comparing: 'Shrinking… (was {size})',
    savedPercent: '{percent}% smaller',
    alreadyOptimized: 'Already optimised · {size}',
    backgroundNotice:
      "Great — keep going! We'll optimise and upload your video in the background.",
    waitForCompress: 'Please wait until the video finishes optimising',
    uploadProgress: 'Uploading {percent}%',
    uploadDetail: '{uploaded} of {total}',
    processing: 'Finishing up...',
    processingDetail: 'The upload is complete; we’re preparing the video.',
    etaSeconds: '~{seconds}s left',
    etaMinutes: '~{minutes}m left',
    typeError: 'Videos must be in MP4 or MOV format only.',
    tooLarge:
      'This video is {size} (max {max}). Try a shorter clip — we optimise it automatically.',
    uploadFailed: 'Video upload failed. Please try again.',
    uploadFailedRemove: 'Video upload failed. Please remove it and try again.',
    waitForUpload: 'Please wait until the video finishes uploading',
    uploadError: 'Something went wrong while uploading the video',
    mergeFailed: "We couldn't finish processing the video. Please try again.",
  },

  // ── Images step ───────────────────────────────────────────────────────────
  images: {
    title: 'Property photos',
    addImages: 'Add photos',
    removeImage: 'Remove photo',
    imageAlt: 'Property photo {index}',
    selectedCount: '{count} photos selected · JPG, JPEG, PNG',
    selectedCount_one: '1 photo selected · JPG, JPEG, PNG',
    typeError: 'Images must be in JPG, JPEG or PNG format only.',
    tooLarge: 'Some photos are too large to process (limit {max}) and were skipped.',
    // No plural variant: the call site passes {done, total}, not `count`, so
    // resolve() would never pick one up.
    optimizing: 'Optimising photo {done} of {total}...',
    watermarking: 'Adding the watermark...',
    watermarkFailed: 'Could not watermark {count} photos',
    optimized: 'Optimised {count} photos · {before} → {after} ({percent}% smaller)',
    optimized_one: 'Photo optimised · {before} → {after} ({percent}% smaller)',
    waitForOptimize: 'Please wait until your photos finish optimising',
  },

  // ── Details step (price / title / description) ────────────────────────────
  details: {
    title: 'Ad details',
    hint: 'Fill in your ad details — you can move between fields using your keyboard',
    priceLabel: 'Price (KWD)',
    pricePlaceholder: '0',
    titleLabel: 'Ad title',
    titlePlaceholder: 'e.g. Apartment for rent in Salmiya',
    descriptionLabel: 'Ad description',
    descriptionPlaceholder: 'Write a detailed description of the property...',
    descriptionMinHint: 'At least 10 characters',
    descriptionOk: 'Looks good — you can continue',
  },

  // ── Summary step ──────────────────────────────────────────────────────────
  summary: {
    title: 'Ad summary',
    country: 'Country',
    state: 'Governorate',
    city: 'Area',
    price: 'Price',
    priceWithCurrency: '{price} KWD',
    emptyValue: '—',
    publishFeeLabel: 'Ad posting fee',
    publishFeeValue: '150 fils',
  },

  // ── Footer actions ────────────────────────────────────────────────────────
  footer: {
    payAndPublish: 'Pay & publish',
  },

  // ── Payment flow ──────────────────────────────────────────────────────────
  payment: {
    sessionFailed: 'Something went wrong while starting the secure payment session',
    gatewayError: 'Something went wrong while contacting the payment gateway',
    transactionNotFound: 'Transaction number not found',
    verifyFailed: 'The payment could not be completed',
    confirmError: 'Something went wrong while confirming your payment',
    operationFailed: 'The operation failed',
    errorWithMessage: 'Payment error: {message}',
  },

  // ── Publish errors ────────────────────────────────────────────────────────
  errors: {
    createFailed: 'Something went wrong, please try again',
    unexpected: 'An unexpected error occurred!',
  },

  // ── Fallback values sent to the backend ───────────────────────────────────
  defaults: {
    adTitle: 'Property in {location}',
    kuwait: 'Kuwait',
  },
};
