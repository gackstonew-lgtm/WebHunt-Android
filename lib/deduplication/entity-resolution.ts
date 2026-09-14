import { PhysicalLead } from "../types";
import { normalizePhoneNumber } from "../utils";

/**
 * Normalizes business names for robust matching:
 * Removes corporate legal designators, punctuation, and extraneous spacing.
 */
export function cleanBusinessName(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/\b(ltd|limited|llc|inc|incorporated|corp|corporation|co|company|enterprises|enterprise|center|centre|services|service)\b/gi, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculates Jaccard token similarity between two business names (0.0 to 1.0)
 */
export function calculateNameSimilarity(nameA: string, nameB: string): number {
  const cleanA = cleanBusinessName(nameA);
  const cleanB = cleanBusinessName(nameB);

  if (!cleanA || !cleanB) return 0;
  if (cleanA === cleanB) return 1.0;

  const tokensA = new Set(cleanA.split(/\s+/).filter(t => t.length > 1));
  const tokensB = new Set(cleanB.split(/\s+/).filter(t => t.length > 1));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }

  const union = new Set([...tokensA, ...tokensB]).size;
  return intersection / union;
}

/**
 * Calculates geographic distance in meters using the Haversine formula
 */
export function calculateGeoDistanceMeters(
  lat1: number | null | undefined,
  lon1: number | null | undefined,
  lat2: number | null | undefined,
  lon2: number | null | undefined
): number | null {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;

  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Evaluates match confidence between two physical business leads based on weighted evidence.
 * Returns match confidence score (0.0 to 1.0) and whether they are verified as the same entity.
 */
export function evaluateEntityMatch(
  leadA: PhysicalLead,
  leadB: PhysicalLead
): { isMatch: boolean; confidence: number; matchReasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  const phoneA = leadA.phone ? normalizePhoneNumber(leadA.phone) : "";
  const phoneB = leadB.phone ? normalizePhoneNumber(leadB.phone) : "";

  // 1. Phone match (Strongest signal)
  if (phoneA && phoneB && phoneA === phoneB) {
    score += 0.85;
    reasons.push("Exact normalized phone match");
  }

  // 2. Name Similarity
  const nameSim = calculateNameSimilarity(leadA.businessName, leadB.businessName);
  if (nameSim >= 0.85) {
    score += 0.40;
    reasons.push(`High name similarity (${(nameSim * 100).toFixed(0)}%)`);
  } else if (nameSim >= 0.60) {
    score += 0.20;
    reasons.push(`Partial name similarity (${(nameSim * 100).toFixed(0)}%)`);
  }

  // 3. Geographic proximity
  const distance = calculateGeoDistanceMeters(
    leadA.latitude,
    leadA.longitude,
    leadB.latitude,
    leadB.longitude
  );

  if (distance !== null) {
    if (distance <= 150) {
      score += 0.45;
      reasons.push(`Close proximity (${distance.toFixed(0)}m)`);
    } else if (distance <= 500) {
      score += 0.25;
      reasons.push(`Proximity (${distance.toFixed(0)}m)`);
    } else if (distance > 5000 && !phoneA && !phoneB) {
      // Businesses more than 5km apart with no phone cannot be the same entity
      return { isMatch: false, confidence: 0, matchReasons: ["Distance too great"] };
    }
  }

  // 4. City & Address match
  const cityA = (leadA.city || "").toLowerCase().trim();
  const cityB = (leadB.city || "").toLowerCase().trim();
  if (cityA && cityB && cityA === cityB) {
    score += 0.10;
  }

  const isMatch = score >= 0.70;
  return { isMatch, confidence: Math.min(score, 1.0), matchReasons: reasons };
}

/**
 * Fuses two physical leads into a single canonical entity, selecting the highest-quality
 * verified data from each source and preserving provenance.
 */
export function fusePhysicalLeads(primary: PhysicalLead, secondary: PhysicalLead): PhysicalLead {
  // Combine unique sources
  const existingSources = new Set<string>(primary.sources || [primary.sourceProvider]);
  if (secondary.sources) {
    secondary.sources.forEach(s => existingSources.add(s));
  } else {
    existingSources.add(secondary.sourceProvider);
  }

  // Combine provenance history
  const combinedProvenance = [
    ...(primary.provenance || [{ source: primary.sourceProvider, sourceUrl: primary.sourceUrl || undefined, retrievedAt: primary.retrievedAt || new Date() }]),
    ...(secondary.provenance || [{ source: secondary.sourceProvider, sourceUrl: secondary.sourceUrl || undefined, retrievedAt: secondary.retrievedAt || new Date() }]),
  ];

  // Best phone
  const hasPrimaryPhone = primary.phone && primary.phoneFormatted !== "Phone unavailable";
  const hasSecondaryPhone = secondary.phone && secondary.phoneFormatted !== "Phone unavailable";
  const phone = hasPrimaryPhone ? primary.phone : (hasSecondaryPhone ? secondary.phone : primary.phone);
  const phoneFormatted = hasPrimaryPhone ? primary.phoneFormatted : (hasSecondaryPhone ? secondary.phoneFormatted : primary.phoneFormatted);
  const phoneStatus = hasPrimaryPhone ? primary.phoneStatus : (hasSecondaryPhone ? secondary.phoneStatus : primary.phoneStatus);

  // Best coordinates
  const latitude = primary.latitude != null ? primary.latitude : secondary.latitude;
  const longitude = primary.longitude != null ? primary.longitude : secondary.longitude;

  // Best address
  const address = primary.address && primary.address.length > 5
    ? primary.address
    : (secondary.address || primary.address);

  // Best ratings
  const rating = primary.rating != null ? primary.rating : secondary.rating;
  const reviewCount = Math.max(primary.reviewCount || 0, secondary.reviewCount || 0);

  // Social profiles fusion
  const socialProfiles = {
    ...(primary.socialProfiles || {}),
    ...(secondary.socialProfiles || {}),
  };

  // Contacts fusion
  const email = primary.email || secondary.email;
  const emails = Array.from(new Set([...(primary.emails || []), ...(secondary.emails || [])]));
  const whatsapp = primary.whatsapp || secondary.whatsapp;
  const bookingUrl = primary.bookingUrl || secondary.bookingUrl;
  const contactPageUrl = primary.contactPageUrl || secondary.contactPageUrl;

  return {
    ...primary,
    phone,
    phoneFormatted,
    phoneStatus,
    address,
    latitude,
    longitude,
    rating,
    reviewCount,
    email,
    emails,
    whatsapp,
    bookingUrl,
    contactPageUrl,
    socialProfiles: Object.keys(socialProfiles).length > 0 ? socialProfiles : undefined,
    sources: Array.from(existingSources),
    provenance: combinedProvenance,
    dataQualityScore: Math.max(primary.dataQualityScore || 0, secondary.dataQualityScore || 0),
    tags: Array.from(new Set([
      ...(Array.isArray(primary.tags) ? primary.tags : (primary.tags ? [primary.tags] : [])),
      ...(Array.isArray(secondary.tags) ? secondary.tags : (secondary.tags ? [secondary.tags] : [])),
      "entity-fused"
    ])),
  };
}

/**
 * Resolves entities across a collection of raw physical leads, merging duplicate businesses
 * and preserving multi-source provenance.
 */
export function resolveAndFusePhysicalEntities(leads: PhysicalLead[]): PhysicalLead[] {
  if (!leads || leads.length === 0) return [];

  const canonicalLeads: PhysicalLead[] = [];

  for (const candidate of leads) {
    let matchedIndex = -1;

    for (let i = 0; i < canonicalLeads.length; i++) {
      const existing = canonicalLeads[i];
      const match = evaluateEntityMatch(existing, candidate);
      if (match.isMatch) {
        matchedIndex = i;
        break;
      }
    }

    if (matchedIndex >= 0) {
      // Fuse candidate into existing canonical entity
      canonicalLeads[matchedIndex] = fusePhysicalLeads(canonicalLeads[matchedIndex], candidate);
    } else {
      // Add as new canonical entity
      canonicalLeads.push({
        ...candidate,
        sources: candidate.sources || [candidate.sourceProvider],
        provenance: candidate.provenance || [{
          source: candidate.sourceProvider,
          sourceUrl: candidate.sourceUrl || undefined,
          retrievedAt: candidate.retrievedAt || new Date(),
        }],
      });
    }
  }

  return canonicalLeads;
}

export const resolvePhysicalEntities = resolveAndFusePhysicalEntities;
