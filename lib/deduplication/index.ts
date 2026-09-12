import { PhysicalLead, OnlineJobLead } from '../types';
import { normalizePhoneNumber, normalizeBusinessName } from '../utils';

export function deduplicatePhysicalLeads(leads: PhysicalLead[]): PhysicalLead[] {
  const seenPhones = new Set<string>();
  const seenNameLocations = new Set<string>();
  const seenPlaceIds = new Set<string>();
  const deduplicated: PhysicalLead[] = [];

  for (const lead of leads) {
    const normPhone = lead.phone ? normalizePhoneNumber(lead.phone) : '';
    const normName = normalizeBusinessName(lead.businessName);
    const locationKey = `${normName}_${(lead.city || '').toLowerCase()}_${(lead.country || '').toLowerCase()}`;
    const placeId = lead.providerPlaceId || '';

    // Check place ID
    if (placeId && seenPlaceIds.has(placeId)) {
      continue;
    }

    // Check phone number
    if (normPhone && seenPhones.has(normPhone)) {
      continue;
    }

    // Check name + city/country
    if (normName && seenNameLocations.has(locationKey)) {
      continue;
    }

    if (placeId) seenPlaceIds.add(placeId);
    if (normPhone) seenPhones.add(normPhone);
    if (normName) seenNameLocations.add(locationKey);

    deduplicated.push(lead);
  }

  return deduplicated;
}

export function deduplicateOnlineJobs(jobs: OnlineJobLead[]): OnlineJobLead[] {
  const seenKeys = new Set<string>();
  const seenUrls = new Set<string>();
  const deduplicated: OnlineJobLead[] = [];

  for (const job of jobs) {
    const normCompany = normalizeBusinessName(job.company);
    const normTitle = job.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const signature = `${normCompany}_${normTitle}`;
    const canonicalUrl = job.url.split('?')[0].toLowerCase();

    if (canonicalUrl && seenUrls.has(canonicalUrl)) {
      continue;
    }

    if (signature && seenKeys.has(signature)) {
      continue;
    }

    if (canonicalUrl) seenUrls.add(canonicalUrl);
    if (signature) seenKeys.add(signature);

    deduplicated.push(job);
  }

  return deduplicated;
}
