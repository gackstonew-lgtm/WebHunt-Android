/**
 * WebHunt Phone Validation and International Normalization Engine
 * Strictly avoids generating fake phone numbers and categorizes numbers into:
 * - 'verified': Verified via direct source carrier/API lookup
 * - 'source_listed': Published on verified source profile and syntactically valid E.164
 * - 'unavailable': Missing or unparseable source listing
 */

export interface PhoneValidationResult {
  raw: string;
  normalized: string; // E.164 digits without formatting or +
  formatted: string;  // Human-readable international format
  countryCode?: string;
  isValid: boolean;
  status: 'verified' | 'source_listed' | 'unavailable';
}

export function validateAndFormatPhone(
  rawPhone?: string | null,
  countryHint?: string
): PhoneValidationResult {
  if (!rawPhone || rawPhone.trim() === '' || rawPhone.toLowerCase().includes('unavailable') || rawPhone.toLowerCase().includes('none')) {
    return {
      raw: '',
      normalized: '',
      formatted: 'Phone unavailable',
      isValid: false,
      status: 'unavailable',
    };
  }

  const cleaned = rawPhone.trim();
  const digitsOnly = cleaned.replace(/\D/g, '');

  if (digitsOnly.length < 5 || digitsOnly.length > 15) {
    // Too short or too long to be a genuine international number
    return {
      raw: cleaned,
      normalized: '',
      formatted: 'Phone unavailable',
      isValid: false,
      status: 'unavailable',
    };
  }

  const countryLower = (countryHint || '').toLowerCase();
  const isKenya = countryLower.includes('kenya') || countryLower === 'ke' || cleaned.startsWith('+254') || cleaned.startsWith('254');
  const isUSorCA = countryLower.includes('united states') || countryLower.includes('usa') || countryLower.includes('canada') || countryLower === 'us' || countryLower === 'ca';
  const isUK = countryLower.includes('united kingdom') || countryLower.includes('uk') || countryLower.includes('great britain') || countryLower === 'gb';
  const isNigeria = countryLower.includes('nigeria') || countryLower === 'ng' || cleaned.startsWith('+234');
  const isSouthAfrica = countryLower.includes('south africa') || countryLower === 'za' || cleaned.startsWith('+27');

  // 1. Kenya (+254)
  if (isKenya) {
    let localDigits = digitsOnly;
    if (localDigits.startsWith('254')) {
      localDigits = localDigits.substring(3);
    } else if (localDigits.startsWith('0')) {
      localDigits = localDigits.substring(1);
    }

    if (localDigits.length === 9) {
      const e164 = `254${localDigits}`;
      const prefix = localDigits.slice(0, 3);
      const mid = localDigits.slice(3, 6);
      const end = localDigits.slice(6);
      return {
        raw: cleaned,
        normalized: e164,
        formatted: `+254 ${prefix} ${mid} ${end}`,
        countryCode: 'KE',
        isValid: true,
        status: 'source_listed',
      };
    }
  }

  // 2. US / Canada (+1)
  if (isUSorCA || (digitsOnly.length === 10 && !cleaned.startsWith('+'))) {
    let num = digitsOnly;
    if (num.length === 11 && num.startsWith('1')) {
      num = num.substring(1);
    }

    if (num.length === 10) {
      const e164 = `1${num}`;
      const area = num.slice(0, 3);
      const prefix = num.slice(3, 6);
      const line = num.slice(6);
      return {
        raw: cleaned,
        normalized: e164,
        formatted: `+1 (${area}) ${prefix}-${line}`,
        countryCode: 'US',
        isValid: true,
        status: 'source_listed',
      };
    }
  }

  // 3. United Kingdom (+44)
  if (isUK || cleaned.startsWith('+44') || (cleaned.startsWith('0') && countryLower.includes('uk'))) {
    let num = digitsOnly;
    if (num.startsWith('44')) num = num.substring(2);
    else if (num.startsWith('0')) num = num.substring(1);

    if (num.length >= 9 && num.length <= 10) {
      return {
        raw: cleaned,
        normalized: `44${num}`,
        formatted: `+44 ${num.slice(0, 4)} ${num.slice(4)}`,
        countryCode: 'GB',
        isValid: true,
        status: 'source_listed',
      };
    }
  }

  // 4. Nigeria (+234)
  if (isNigeria || cleaned.startsWith('+234')) {
    let num = digitsOnly;
    if (num.startsWith('234')) num = num.substring(3);
    else if (num.startsWith('0')) num = num.substring(1);

    if (num.length === 10) {
      return {
        raw: cleaned,
        normalized: `234${num}`,
        formatted: `+234 ${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6)}`,
        countryCode: 'NG',
        isValid: true,
        status: 'source_listed',
      };
    }
  }

  // 5. South Africa (+27)
  if (isSouthAfrica || cleaned.startsWith('+27')) {
    let num = digitsOnly;
    if (num.startsWith('27')) num = num.substring(2);
    else if (num.startsWith('0')) num = num.substring(1);

    if (num.length === 9) {
      return {
        raw: cleaned,
        normalized: `27${num}`,
        formatted: `+27 ${num.slice(0, 2)} ${num.slice(2, 5)} ${num.slice(5)}`,
        countryCode: 'ZA',
        isValid: true,
        status: 'source_listed',
      };
    }
  }

  // 6. Generic international with '+'
  if (cleaned.startsWith('+')) {
    return {
      raw: cleaned,
      normalized: digitsOnly,
      formatted: `+${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 7)} ${digitsOnly.slice(7)}`.trim(),
      countryCode: countryHint || 'INTL',
      isValid: digitsOnly.length >= 7,
      status: 'source_listed',
    };
  }

  // Fallback for valid digits
  return {
    raw: cleaned,
    normalized: digitsOnly,
    formatted: cleaned,
    countryCode: countryHint,
    isValid: digitsOnly.length >= 7,
    status: 'source_listed',
  };
}
