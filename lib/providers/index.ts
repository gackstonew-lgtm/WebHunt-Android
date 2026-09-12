import { IPhysicalLeadProvider } from "./types";
import { IOnlineJobProvider } from "./online/types";
import { OsmOverpassProvider } from "./osm-overpass";
import { GooglePlacesProvider } from "./google-places";
import { YelpFusionProvider } from "./yelp-fusion";
import { FoursquarePlacesProvider } from "./foursquare-places";

import { RemotiveJobProvider } from "./online/remotive";
import { ArbeitnowJobProvider } from "./online/arbeitnow";
import { HimalayasJobProvider } from "./online/himalayas";
import { WeWorkRemotelyJobProvider } from "./online/weworkremotely";
import { JobspressoJobProvider } from "./online/jobspresso";
import { RemoteOkJobProvider } from "./online/remoteok";
import { AfricaJobsProvider } from "./online/africa-jobs";

import { 
  LeadItem, 
  OnlineJobLead, 
  OnlineSearchParams, 
  PhysicalLead, 
  PhysicalSearchParams, 
  SearchParams, 
  SearchResult 
} from "../types";
import { deduplicatePhysicalLeads, deduplicateOnlineJobs } from "../deduplication";
import { normalizePhysicalSearchQuery, normalizeOnlineSearchQuery } from "../taxonomy/search-mapper";
import { scorePhysicalLeadRelevance, scoreOnlineJobRelevance } from "../validation/relevance";
import { enrichLeadsBatch } from "../enrichment";

// In-Memory Fast Cache with TTL for production responsiveness
const memoryCache = new Map<string, { data: SearchResult; expiresAt: number }>();

export class LeadProviderAggregator {
  private physicalProviders: Map<string, IPhysicalLeadProvider> = new Map();
  private onlineProviders: Map<string, IOnlineJobProvider> = new Map();

  constructor() {
    // Register Real Physical Providers (Zero-Mock Production Path)
    this.registerPhysical(new OsmOverpassProvider());
    this.registerPhysical(new GooglePlacesProvider());
    this.registerPhysical(new YelpFusionProvider());
    this.registerPhysical(new FoursquarePlacesProvider());

    // Register Real Online Job Providers (Zero-Mock Production Path)
    this.registerOnline(new RemotiveJobProvider());
    this.registerOnline(new ArbeitnowJobProvider());
    this.registerOnline(new HimalayasJobProvider());
    this.registerOnline(new WeWorkRemotelyJobProvider());
    this.registerOnline(new JobspressoJobProvider());
    this.registerOnline(new RemoteOkJobProvider());
    this.registerOnline(new AfricaJobsProvider());
  }

  registerPhysical(provider: IPhysicalLeadProvider) {
    this.physicalProviders.set(provider.providerKey, provider);
  }

  registerOnline(provider: IOnlineJobProvider) {
    this.onlineProviders.set(provider.providerKey, provider);
  }

  getPhysicalProvidersStatus() {
    return [
      {
        key: "osm",
        name: "OpenStreetMap Overpass (Free Worldwide)",
        configured: true,
        isFree: true,
      },
      {
        key: "google",
        name: "Google Places API (New)",
        configured: this.physicalProviders.get("google")?.isConfigured() || false,
        isFree: false,
      },
      {
        key: "yelp",
        name: "Yelp Fusion API",
        configured: this.physicalProviders.get("yelp")?.isConfigured() || false,
        isFree: false,
      },
      {
        key: "foursquare",
        name: "Foursquare Places API",
        configured: this.physicalProviders.get("foursquare")?.isConfigured() || false,
        isFree: false,
      },
    ];
  }

  getOnlineProvidersStatus() {
    return [
      {
        key: "remotive",
        name: "Remotive Public API (Free Worldwide)",
        configured: true,
        isFree: true,
      },
      {
        key: "arbeitnow",
        name: "Arbeitnow Job Board API (Free)",
        configured: true,
        isFree: true,
      },
      {
        key: "himalayas",
        name: "Himalayas Remote Jobs API (Free)",
        configured: true,
        isFree: true,
      },
      {
        key: "weworkremotely",
        name: "We Work Remotely Feeds (Free)",
        configured: true,
        isFree: true,
      },
      {
        key: "jobspresso",
        name: "Jobspresso Remote Feed (Free)",
        configured: true,
        isFree: true,
      },
      {
        key: "remoteok",
        name: "Remote OK Public API (Free)",
        configured: true,
        isFree: true,
      },
      {
        key: "africa",
        name: "Africa & Kenya Remote Discovery (Free)",
        configured: true,
        isFree: true,
      },
    ];
  }

  async search(params: SearchParams): Promise<SearchResult> {
    const industryKey = (params.industryIds || []).sort().join(",");
    const cacheKey = params.mode === "physical"
      ? `phys:${params.country}:${params.city || ""}:${params.niche}:${industryKey}:${params.provider || "all"}:${params.radius || 25}:${params.maxResults || 50}`
      : `online:${params.query}:${params.category || "all"}:${params.country || ""}:${industryKey}:${params.provider || "all"}:${params.maxResults || 50}`;

    // 1. Check in-memory cache
    if (!params.forceRefresh) {
      const cached = memoryCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        console.log(`[Cache Hit] Returning cached results for: ${cacheKey}`);
        return {
          ...cached.data,
          fromCache: true,
        };
      }
    }

    if (params.mode === "physical") {
      return this.searchPhysical(params, cacheKey);
    } else {
      return this.searchOnline(params, cacheKey);
    }
  }

  private async searchPhysical(params: PhysicalSearchParams, cacheKey: string): Promise<SearchResult> {
    const normalized = normalizePhysicalSearchQuery(params);
    const selected = params.provider || "all";
    const targets: IPhysicalLeadProvider[] = [];

    if (selected === "all") {
      for (const p of Array.from(this.physicalProviders.values())) {
        if (p.isConfigured()) {
          targets.push(p);
        }
      }
    } else {
      const p = this.physicalProviders.get(selected);
      if (p && p.isConfigured()) {
        targets.push(p);
      } else {
        targets.push(this.physicalProviders.get("osm")!);
      }
    }

    if (targets.length === 0) {
      targets.push(this.physicalProviders.get("osm")!);
    }

    const sourcesQueried: string[] = [];
    const failedSources: string[] = [];

    // Parallel fetch from all target providers with timeout & Promise.allSettled
    const promises = targets.map(async (t) => {
      sourcesQueried.push(t.name);
      try {
        const res = await t.search(params);
        return res;
      } catch (err) {
        console.warn(`[PhysicalProvider] ${t.name} failed:`, err);
        failedSources.push(t.name);
        return [] as PhysicalLead[];
      }
    });

    const settled = await Promise.allSettled(promises);
    const rawLeads: PhysicalLead[] = [];

    for (const res of settled) {
      if (res.status === "fulfilled") {
        rawLeads.push(...res.value);
      }
    }

    // Deduplicate via multi-tier deduplicator
    const deduplicated = deduplicatePhysicalLeads(rawLeads);

    // Apply Deterministic Relevance Scoring & Filtering
    const scoredLeads: PhysicalLead[] = [];
    for (const lead of deduplicated) {
      const relevance = scorePhysicalLeadRelevance(lead, normalized.matchedIndustries, params.niche);
      if (relevance.isRelevant) {
        scoredLeads.push({
          ...lead,
          relevanceScore: relevance.score,
        });
      }
    }

    // Sort by relevance score descending, then data quality
    scoredLeads.sort((a, b) => {
      const scoreDiff = (b.relevanceScore || 0) - (a.relevanceScore || 0);
      if (Math.abs(scoreDiff) > 0.05) return scoreDiff;
      return (b.dataQualityScore || 0) - (a.dataQualityScore || 0);
    });

    // Fast asynchronous contact enrichment for legitimate contact discovery
    const finalLeads = await enrichLeadsBatch(scoredLeads, { forceRefresh: params.forceRefresh }) as PhysicalLead[];

    const displayQuery = normalized.primaryIndustry ? normalized.primaryIndustry.name : params.niche;

    const searchResult: SearchResult = {
      mode: "physical",
      query: displayQuery,
      location: [params.city, params.country].filter(Boolean).join(", "),
      provider: selected,
      totalFetched: rawLeads.length,
      qualifiedCount: finalLeads.length,
      fromCache: false,
      sourcesQueried,
      failedSources,
      leads: finalLeads,
    };

    // Cache for 1 hour
    memoryCache.set(cacheKey, { data: searchResult, expiresAt: Date.now() + 3600 * 1000 });

    return searchResult;
  }

  private async searchOnline(params: OnlineSearchParams, cacheKey: string): Promise<SearchResult> {
    const normalized = normalizeOnlineSearchQuery(params);
    const selected = params.provider || "all";
    const targets: IOnlineJobProvider[] = [];

    if (selected === "all") {
      for (const p of Array.from(this.onlineProviders.values())) {
        if (p.isConfigured()) {
          targets.push(p);
        }
      }
    } else {
      const p = this.onlineProviders.get(selected);
      if (p) targets.push(p);
      else targets.push(this.onlineProviders.get("remotive")!);
    }

    if (targets.length === 0) {
      targets.push(this.onlineProviders.get("remotive")!);
    }

    const sourcesQueried: string[] = [];
    const failedSources: string[] = [];

    // Parallel fetch from all job providers with Promise.allSettled
    const promises = targets.map(async (t) => {
      sourcesQueried.push(t.name);
      try {
        const res = await t.fetchJobs(params);
        return res;
      } catch (err) {
        console.warn(`[OnlineJobProvider] ${t.name} failed:`, err);
        failedSources.push(t.name);
        return [] as OnlineJobLead[];
      }
    });

    const settled = await Promise.allSettled(promises);
    const rawJobs: OnlineJobLead[] = [];

    for (const res of settled) {
      if (res.status === "fulfilled") {
        rawJobs.push(...res.value);
      }
    }

    // Deduplicate jobs by company + title similarity & canonical URL
    const deduplicated = deduplicateOnlineJobs(rawJobs);

    // Apply Deterministic Relevance Scoring & Filtering
    const scoredJobs: OnlineJobLead[] = [];
    for (const job of deduplicated) {
      const relevance = scoreOnlineJobRelevance(job, normalized.matchedIndustries, params.query);
      if (relevance.isRelevant) {
        scoredJobs.push({
          ...job,
          relevanceScore: relevance.score,
        });
      }
    }

    // Sort by relevance score descending
    scoredJobs.sort((a, b) => {
      const scoreDiff = (b.relevanceScore || 0) - (a.relevanceScore || 0);
      if (Math.abs(scoreDiff) > 0.05) return scoreDiff;
      return (b.dataQualityScore || 0) - (a.dataQualityScore || 0);
    });

    const finalJobs = await enrichLeadsBatch(scoredJobs, { forceRefresh: params.forceRefresh }) as OnlineJobLead[];
    const displayQuery = normalized.primaryIndustry ? normalized.primaryIndustry.name : params.query;

    const searchResult: SearchResult = {
      mode: "online",
      query: displayQuery,
      location: "Worldwide Remote",
      provider: selected,
      totalFetched: rawJobs.length,
      qualifiedCount: finalJobs.length,
      fromCache: false,
      sourcesQueried,
      failedSources,
      leads: finalJobs,
    };

    // Cache for 1 hour
    memoryCache.set(cacheKey, { data: searchResult, expiresAt: Date.now() + 3600 * 1000 });

    return searchResult;
  }
}

export const aggregator = new LeadProviderAggregator();
export default aggregator;
