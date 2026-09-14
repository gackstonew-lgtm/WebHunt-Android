import { PhysicalLead, OnlineJobLead } from '../types';
import { normalizePhoneNumber, normalizeBusinessName } from '../utils';
export { resolvePhysicalEntities } from './entity-resolution';

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
  const jobMap = new Map<string, OnlineJobLead>();
  const urlMap = new Map<string, string>(); // url -> signature

  for (const job of jobs) {
    const normCompany = normalizeBusinessName(job.company || '');
    const normTitle = (job.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const normLoc = (job.location || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const normCategory = (job.aiTaskCategory || job.category || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const signature = `${normCompany}::${normTitle}::${normLoc}::${normCategory}`;
    const canonicalUrl = (job.url || '').split('?')[0].toLowerCase().trim();

    // Check if we've seen this exact canonical URL or company+title+location signature
    const existingSig = canonicalUrl ? urlMap.get(canonicalUrl) : undefined;
    const targetSig = existingSig || (jobMap.has(signature) ? signature : undefined);

    if (targetSig && jobMap.has(targetSig)) {
      // Merge with existing canonical job
      const existing = jobMap.get(targetSig)!;
      const mergedSources = new Set<string>(existing.sources || [existing.source || 'online']);
      mergedSources.add(job.source || 'online');
      existing.sources = Array.from(mergedSources);

      // Keep richer description snippet if available
      if ((job.descriptionSnippet || '').length > (existing.descriptionSnippet || '').length) {
        existing.descriptionSnippet = job.descriptionSnippet;
      }

      // Keep salary if missing in existing
      if ((!existing.salary || existing.salary === 'Competitive') && job.salary && job.salary !== 'Competitive') {
        existing.salary = job.salary;
      }

      // Merge tags
      if (job.tags && job.tags.length > 0) {
        const tagSet = new Set([...(existing.tags || []), ...job.tags]);
        existing.tags = Array.from(tagSet);
      }

      // Update provenance
      if (job.provenance) {
        existing.provenance = [...(existing.provenance || []), ...job.provenance];
      }
    } else {
      // New distinct job listing
      const initialSources = job.sources && job.sources.length > 0 
        ? job.sources 
        : [job.source || 'online'];
      
      const canonicalJob: OnlineJobLead = {
        ...job,
        sources: initialSources,
      };

      jobMap.set(signature, canonicalJob);
      if (canonicalUrl) {
        urlMap.set(canonicalUrl, signature);
      }
    }
  }

  return Array.from(jobMap.values());
}

