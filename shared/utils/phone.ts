/**
 * Normalizes and formats phone numbers across different countries (Egypt, Kuwait, Saudi, UAE, etc.)
 * Handles cases where leading zeroes or country codes are stripped by backend/database storage.
 */

export interface FormattedPhone {
  /** Clean international format with + (e.g. "+201068286020") */
  dial: string;
  /** International digits without + for WhatsApp links (e.g. "201068286020") */
  whatsapp: string;
  /** User-friendly formatted string (e.g. "+20 1068286020") */
  display: string;
  /** Local formatted number with leading zero if applicable (e.g. "01068286020") */
  local: string;
}

export function formatPhoneNumber(
  rawPhone: string | number | null | undefined,
  countryName?: string | null
): FormattedPhone | null {
  if (!rawPhone) return null;

  const rawStr = String(rawPhone).trim();
  if (!rawStr) return null;

  // Extract all digits
  const digits = rawStr.replace(/\D/g, '');
  if (!digits) return null;

  const country = (countryName || '').trim().toLowerCase();
  const isEgypt =
    /^(egypt|مصر|eg|cairo|القاهرة|الإسكندرية|giza|الجيزة)/i.test(country) ||
    // Auto-detect Egyptian 10-digit number starting with 10, 11, 12, 15
    (!country && /^(10|11|12|15)\d{8}$/.test(digits)) ||
    (!country && /^0(10|11|12|15)\d{8}$/.test(digits));

  const isKuwait =
    /^(kuwait|الكويت|kw|kwt)/i.test(country) ||
    (!country && /^[24569]\d{7}$/.test(digits));

  const isSaudi =
    /^(saudi|السعودية|المملكة العربية السعودية|ksa|sa)/i.test(country) ||
    (!country && /^5\d{8}$/.test(digits)) ||
    (!country && /^05\d{8}$/.test(digits));

  const isUAE =
    /^(uae|emirates|الإمارات|امارات|ae)/i.test(country);

  // ── 1. Egyptian Numbers ───────────────────────────────────────────────────
  // Egyptian mobiles are 11 digits starting with 010, 011, 012, 015
  // If stored without 0, they are 10 digits starting with 10, 11, 12, 15
  if (digits.startsWith('20') && digits.length >= 12) {
    // Already has +20
    const rest = digits.slice(2);
    return {
      dial: `+20${rest}`,
      whatsapp: `20${rest}`,
      display: `+20 ${rest}`,
      local: `0${rest}`,
    };
  }

  if (isEgypt || /^(10|11|12|15)\d{8}$/.test(digits) || /^0(10|11|12|15)\d{8}$/.test(digits)) {
    const nationalDigits = digits.startsWith('0') ? digits.slice(1) : digits;
    return {
      dial: `+20${nationalDigits}`,
      whatsapp: `20${nationalDigits}`,
      display: `+20 ${nationalDigits}`,
      local: `0${nationalDigits}`,
    };
  }

  // ── 2. Kuwait Numbers ─────────────────────────────────────────────────────
  if (digits.startsWith('965') && digits.length >= 11) {
    const rest = digits.slice(3);
    return {
      dial: `+965${rest}`,
      whatsapp: `965${rest}`,
      display: `+965 ${rest}`,
      local: rest,
    };
  }

  if (isKuwait || /^[24569]\d{7}$/.test(digits)) {
    return {
      dial: `+965${digits}`,
      whatsapp: `965${digits}`,
      display: `+965 ${digits}`,
      local: digits,
    };
  }

  // ── 3. Saudi Numbers ──────────────────────────────────────────────────────
  if (digits.startsWith('966') && digits.length >= 12) {
    const rest = digits.slice(3);
    return {
      dial: `+966${rest}`,
      whatsapp: `966${rest}`,
      display: `+966 ${rest}`,
      local: `0${rest}`,
    };
  }

  if (isSaudi || /^0?5\d{8}$/.test(digits)) {
    const nationalDigits = digits.startsWith('0') ? digits.slice(1) : digits;
    return {
      dial: `+966${nationalDigits}`,
      whatsapp: `966${nationalDigits}`,
      display: `+966 ${nationalDigits}`,
      local: `0${nationalDigits}`,
    };
  }

  // ── 4. UAE Numbers ────────────────────────────────────────────────────────
  if (digits.startsWith('971') && digits.length >= 12) {
    const rest = digits.slice(3);
    return {
      dial: `+971${rest}`,
      whatsapp: `971${rest}`,
      display: `+971 ${rest}`,
      local: `0${rest}`,
    };
  }

  if (isUAE || (/^0?5\d{8}$/.test(digits) && isUAE)) {
    const nationalDigits = digits.startsWith('0') ? digits.slice(1) : digits;
    return {
      dial: `+971${nationalDigits}`,
      whatsapp: `971${nationalDigits}`,
      display: `+971 ${nationalDigits}`,
      local: `0${nationalDigits}`,
    };
  }

  // ── 5. General Fallback ───────────────────────────────────────────────────
  // If it already has a country code (+ in raw string or > 10 digits)
  if (rawStr.startsWith('+')) {
    return {
      dial: `+${digits}`,
      whatsapp: digits,
      display: `+${digits}`,
      local: digits,
    };
  }

  return {
    dial: `+${digits}`,
    whatsapp: digits,
    display: digits,
    local: digits,
  };
}
