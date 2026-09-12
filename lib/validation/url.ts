/**
 * WebHunt URL and Website Syntax Validator
 */

export interface UrlValidationResult {
  raw: string;
  normalizedUrl: string | null;
  domain: string | null;
  isValid: boolean;
  isHttps: boolean;
}

export function validateUrl(rawUrl?: string | null): UrlValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.trim() === '') {
    return {
      raw: '',
      normalizedUrl: null,
      domain: null,
      isValid: false,
      isHttps: false,
    };
  }

  const trimmed = rawUrl.trim();
  let candidate = trimmed;

  if (!candidate.startsWith('http://') && !candidate.startsWith('https://')) {
    candidate = `https://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    const domain = parsed.hostname.toLowerCase();

    // Check that domain contains at least one dot, valid characters, and is not a loopback address
    if (
      !domain.includes('.') || 
      domain.startsWith('.') || 
      domain.endsWith('.') || 
      domain.length < 4 ||
      domain === 'localhost' ||
      domain.endsWith('.localhost') ||
      domain.endsWith('.local') ||
      domain.endsWith('.internal') ||
      domain.startsWith('127.') ||
      domain === '0.0.0.0' ||
      domain.startsWith('169.254.')
    ) {
      return {
        raw: trimmed,
        normalizedUrl: null,
        domain: null,
        isValid: false,
        isHttps: false,
      };
    }

    return {
      raw: trimmed,
      normalizedUrl: parsed.toString(),
      domain: domain.replace(/^www\./, ''),
      isValid: true,
      isHttps: parsed.protocol === 'https:',
    };
  } catch (err) {
    return {
      raw: trimmed,
      normalizedUrl: null,
      domain: null,
      isValid: false,
      isHttps: false,
    };
  }
}
