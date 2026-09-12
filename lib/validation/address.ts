/**
 * WebHunt Address Validation & Geocoding Parser
 * Preserves raw source data, avoids fabricating fake addresses, and falls back to "Address unavailable"
 */

export interface AddressComponents {
  raw: string;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country: string;
  formatted: string;
  isComplete: boolean;
}

export function parseAndFormatAddress(
  rawAddress?: string | null,
  cityHint?: string | null,
  countryHint?: string | null,
  postalHint?: string | null
): AddressComponents {
  const country = (countryHint || 'Worldwide').trim();
  const city = (cityHint || '').trim();
  const raw = (rawAddress || '').trim();

  if (!raw && !city) {
    return {
      raw: '',
      street: null,
      city: city || null,
      state: null,
      postalCode: postalHint || null,
      country,
      formatted: 'Address unavailable',
      isComplete: false,
    };
  }

  if (!raw && city) {
    return {
      raw: `${city}, ${country}`,
      street: null,
      city,
      state: null,
      postalCode: postalHint || null,
      country,
      formatted: `${city}, ${country}`,
      isComplete: false,
    };
  }

  // Raw address is available
  return {
    raw,
    street: raw,
    city: city || null,
    state: null,
    postalCode: postalHint || null,
    country,
    formatted: raw,
    isComplete: true,
  };
}
