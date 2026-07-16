export function getOfflinePaymentInfo() {
  return {
    iban: process.env.SCHOOL_PAYMENT_IBAN ?? null,
    mbway: process.env.SCHOOL_PAYMENT_MBWAY ?? null,
  };
}
