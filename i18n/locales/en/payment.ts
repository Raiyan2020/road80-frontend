export const payment = {
  // Card form / embedded MyFatoorah widget
  form: {
    title: 'Secure payment details',
    payNow: 'Pay now',
    securedBy: 'Secure payment powered by MyFatoorah',
  },

  // Transient states shown around the embedded form
  status: {
    loadingGateway: 'Loading the payment form...',
    processing: 'Processing your payment...',
  },

  // Failures — both our own and the ones mapped from the MyFatoorah SDK
  errors: {
    paymentFailed: 'Payment failed',
    initFailed: 'Something went wrong while starting the payment form. Please try again later.',
    sessionExpired: 'Your payment session has expired — starting a new one...',
    sessionInvalid:
      'This payment session is not valid. Make sure embedded payments are enabled on your MyFatoorah account.',
    cardDetailsInvalid: 'Your card details are invalid or incomplete',
    cardNumberInvalid: 'The card number is invalid',
    expiryInvalid: 'The expiry date is invalid',
    cvvInvalid: 'The security code (CVV) is invalid',
    insufficientFunds: 'Insufficient funds',
    declined: 'Your bank declined this transaction',
    cardExpired: 'This card has expired. Please use another card.',
    authenticationFailed:
      'Bank verification (3-D Secure) failed. Please try again or use another card.',
    notPermitted: 'Your bank does not allow this type of transaction on this card',
    doNotHonour: 'Your bank refused this transaction. Please contact your bank or use another card.',
    restrictedCard: 'This card is restricted and cannot be used for this payment',
    invalidMerchant: 'The payment could not be processed. Please try again later.',
    limitExceeded: 'This transaction exceeds your card limit',
    // Shown instead of passing an unmapped English SDK string straight through
    gatewayError: "The payment couldn't be completed. Please try again or use another card.",
  },
};
