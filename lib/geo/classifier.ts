import { RemoteType } from '../types';

export interface LocationClassification {
  isWorldwide: boolean;
  isRemote: boolean;
  remoteType: RemoteType;
  country?: string;
  city?: string;
  region?: string;
  rawLocation: string;
  displayLocation: string;
}

export function classifyLocation(
  locationString?: string | null,
  isRemoteFlag?: boolean
): LocationClassification {
  if (!locationString || locationString.trim() === '') {
    return {
      isWorldwide: true,
      isRemote: true,
      remoteType: 'worldwide',
      rawLocation: '',
      displayLocation: 'Worldwide Remote',
    };
  }

  const raw = locationString.trim();
  const lower = raw.toLowerCase();

  const isExplicitWorldwide = 
    lower.includes('worldwide') || 
    lower.includes('anywhere') || 
    lower.includes('global') || 
    lower.includes('all locations');

  const hasRemoteKeyword = 
    lower.includes('remote') || 
    lower.includes('work from home') || 
    lower.includes('telecommute') || 
    Boolean(isRemoteFlag);

  const hasHybridKeyword = lower.includes('hybrid') || lower.includes('flexible');
  const hasOnsiteKeyword = lower.includes('onsite') || lower.includes('on-site') || lower.includes('in-office');

  // Country / Region specific remote restrictions
  const isUS = lower.includes('us only') || lower.includes('usa only') || lower.includes('united states') || lower.includes('(us)') || lower.includes('north america');
  const isEU = lower.includes('europe') || lower.includes('eu only') || lower.includes('uk only') || lower.includes('germany') || lower.includes('emea');
  const isAfrica = lower.includes('africa') || lower.includes('kenya') || lower.includes('nigeria') || lower.includes('south africa') || lower.includes('ghana');
  const isAPAC = lower.includes('apac') || lower.includes('asia') || lower.includes('australia') || lower.includes('india') || lower.includes('philippines');
  const isLatAm = lower.includes('latam') || lower.includes('latin america') || lower.includes('brazil');

  let remoteType: RemoteType = 'worldwide';
  let country: string | undefined = undefined;
  let region: string | undefined = undefined;

  if (hasHybridKeyword) {
    remoteType = 'hybrid';
  } else if (hasOnsiteKeyword && !hasRemoteKeyword) {
    remoteType = 'onsite';
  } else if (hasRemoteKeyword || isExplicitWorldwide) {
    if (isExplicitWorldwide && !isUS && !isEU && !isAfrica && !isAPAC && !isLatAm) {
      remoteType = 'worldwide';
    } else if (isUS) {
      remoteType = 'country_specific';
      country = 'United States';
      region = 'North America';
    } else if (isAfrica) {
      remoteType = 'regional';
      region = 'Africa';
      if (lower.includes('kenya')) country = 'Kenya';
      else if (lower.includes('nigeria')) country = 'Nigeria';
    } else if (isEU) {
      remoteType = 'regional';
      region = 'Europe';
    } else if (isAPAC) {
      remoteType = 'regional';
      region = 'Asia-Pacific';
    } else if (isLatAm) {
      remoteType = 'regional';
      region = 'Latin America';
    } else {
      remoteType = 'worldwide';
    }
  }

  let displayLocation = raw;
  if (remoteType === 'worldwide') {
    displayLocation = 'Worldwide Remote';
  } else if (remoteType === 'regional' && region) {
    displayLocation = `Remote (${region})`;
  } else if (remoteType === 'country_specific' && country) {
    displayLocation = `Remote (${country})`;
  }

  return {
    isWorldwide: remoteType === 'worldwide',
    isRemote: hasRemoteKeyword || remoteType === 'worldwide' || remoteType === 'regional' || remoteType === 'country_specific',
    remoteType,
    country,
    region,
    rawLocation: raw,
    displayLocation,
  };
}
