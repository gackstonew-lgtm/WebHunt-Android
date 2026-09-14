import { IPhysicalLeadProvider } from "./types";
import { IOnlineJobProvider, ProviderExecutionResult } from "./online/types";
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
import { AdzunaJobProvider } from "./online/adzuna";
import { JoobleJobProvider } from "./online/jooble";
import { UsaJobsProvider } from "./online/usajobs";
import { AtsJobProvider } from "./online/ats-provider";
import { AiPlatformsProvider } from "./online/ai-platforms";
import { JobicyJobProvider } from "./online/jobicy";
import { TheMuseJobProvider } from "./online/themuse";

import { 
  LeadItem, 
  OnlineJobLead, 
  OnlineSearchParams, 
  PhysicalLead, 
  PhysicalSearchParams, 
  SearchParams, 
  SearchResult,
  SearchDiagnostics
} from "../types";
import { deduplicatePhysicalLeads, deduplicateOnlineJobs } from "../deduplication";
import { resolvePhysicalEntities } from "../deduplication/entity-resolution";
import { normalizePhysicalSearchQuery, normalizeOnlineSearchQuery } from "../taxonomy/search-mapper";
import { parseSearchIntent } from "../taxonomy/intent-parser";
import { scorePhysicalLeadRelevance, scoreOnlineJobRelevance } from "../validation/relevance";
import { enrichLeadsBatch } from "../enrichment";
import { durableCache } from "../cache/durable-cache";
import { healthMonitor } from "./health-monitor";

export class LeadProviderAggregator {
  private physicalProviders: Map<string, IPhysicalLeadProvider> = new Map();
  private onlineProviders: Map<string, IOnlineJobProvider> = new Map();

  constructor() {
    // 1. Register Physical Lead Providers
    const osm = new OsmOverpassProvider();
    const google = new GooglePlacesProvider();
    const yelp = new YelpFusionProvider();
    const foursquare = new FoursquarePlacesProvider();

    this.registerPhysical(osm);
    this.registerPhysical(google);
    this.registerPhysical(yelp);
    this.registerPhysical(foursquare);

    // 2. Register Online Job Providers (Zero-Mock Production Path)
    const remotive = new RemotiveJobProvider();
    const arbeitnow = new ArbeitnowJobProvider();
    const himalayas = new HimalayasJobProvider();
    const weworkremotely = new WeWorkRemotelyJobProvider();
    const jobspresso = new JobspressoJobProvider();
    const remoteok = new RemoteOkJobProvider();
    const africa = new AfricaJobsProvider();
    const adzuna = new AdzunaJobProvider();
    const jooble = new JoobleJobProvider();
    const usajobs = new UsaJobsProvider();
    const ats = new AtsJobProvider();
    const aiPlatforms = new AiPlatformsProvider();
    const jobicy = new JobicyJobProvider();
    const themuse = new TheMuseJobProvider();

    this.registerOnline(remotive);
    this.registerOnline(arbeitnow);
    this.registerOnline(himalayas);
    this.registerOnline(weworkremotely);
    this.registerOnline(jobspresso);
    this.registerOnline(remoteok);
    this.registerOnline(africa);
    this.registerOnline(adzuna);
    this.registerOnline(jooble);
    this.registerOnline(usajobs);
    this.registerOnline(ats);
    this.registerOnline(aiPlatforms);
    this.registerOnline(jobicy);
    this.registerOnline(themuse);
  }

  registerPhysical(provider: IPhysicalLeadProvider) {
    this.physicalProviders.set(provider.providerKey, provider);
    healthMonitor.registerProvider(
      provider.providerKey,
      provider.name,
      "physical",
      provider.isConfigured()
    );
  }

  registerOnline(provider: IOnlineJobProvider) {
    this.onlineProviders.set(provider.providerKey, provider);
    healthMonitor.registerProvider(
      provider.providerKey,
      provider.name,
      "online",
      provider.isConfigured()
    );
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
        key: "ai_platforms",
        name: "AI Training & Annotation Platforms (11 Verified Sources)",
        configured: true,
        isFree: true,
      },
      {
        key: "ats",
        name: "Direct Employer ATS (Greenhouse/Lever/Ashby)",
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
        key: "africa",
        name: "Africa & Kenya Remote Discovery (Free)",
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
        key: "jobspresso",
        name: "Jobspresso Remote Feed (Free)",
        configured: true,
        isFree: true,
      },
      {
        key: "jobicy",
        name: "Jobicy Remote Jobs API (Free Worldwide)",
        configured: true,
        isFree: true,
      },
      {
        key: "themuse",
        name: "The Muse Jobs API (Curated Opportunities)",
        configured: true,
        isFree: true,
      },
      {
        key: "adzuna",
        name: "Adzuna Global Job Search API",
        configured: this.onlineProviders.get("adzuna")?.isConfigured() || false,
        isFree: false,
      },
      {
        key: "jooble",
        name: "Jooble Search API",
        configured: this.onlineProviders.get("jooble")?.isConfigured() || false,
        isFree: false,
      },
      {
        key: "usajobs",
        name: "USAJobs Official Search API",
        configured: this.onlineProviders.get("usajobs")?.isConfigured() || false,
        isFree: false,
      },
    ];
  }

  async search(params: SearchParams): Promise<SearchResult> {
    const industryKey = (params.industryIds || []).sort().join(",");
    const cacheKey = params.mode === "physical"
      ? `phys:${params.country}:${params.city || ""}:${params.niche}:${industryKey}:${params.provider || "all"}:${params.radius || 25}:${params.maxResults || 50}`
      : `online:${params.query}:${params.category || "all"}:${params.country || ""}:${industryKey}:${params.provider || "all"}:${params.maxResults || 50}`;

    // 1. Two-Tier Durable Cache Lookup
    if (!params.forceRefresh) {
      const cached = await durableCache.get<SearchResult>(cacheKey);
      if (cached) {
        return {
          ...cached,
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
    const startTime = Date.now();
    const intent = parseSearchIntent(params.niche);
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

    // Parallel fetch with health tracking & timeout
    const promises = targets.map(async (t) => {
      sourcesQueried.push(t.name);
      const reqStart = Date.now();
      try {
        const res = await t.search(params);
        healthMonitor.recordSuccess(t.providerKey, Date.now() - reqStart, res.length);
        return res;
      } catch (err) {
        const latency = Date.now() - reqStart;
        console.warn(`[PhysicalProvider] ${t.name} failed (${latency}ms):`, err);
        healthMonitor.recordFailure(t.providerKey, latency, err as Error);
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

    // Entity Resolution & Contact Fusion across multi-source candidates
    const resolvedLeads = resolvePhysicalEntities(rawLeads);

    // Deterministic Relevance Scoring & Filtering
    const scoredLeads: PhysicalLead[] = [];
    for (const lead of resolvedLeads) {
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

    // Contact Enrichment & Verification Engine
    const finalLeads = await enrichLeadsBatch(scoredLeads, { forceRefresh: params.forceRefresh }) as PhysicalLead[];
    const displayQuery = normalized.primaryIndustry ? normalized.primaryIndustry.name : params.niche;
    const locationStr = [params.city, params.country].filter(Boolean).join(", ");
    const executionTimeMs = Date.now() - startTime;

    const diagnostics: SearchDiagnostics = {
      totalProvidersQueried: sourcesQueried.length,
      successfulProviders: sourcesQueried.length - failedSources.length,
      failedProviders: failedSources.length,
      executionTimeMs,
      cached: false,
    };

    const searchResult: SearchResult = {
      mode: "physical",
      query: displayQuery,
      location: locationStr,
      provider: selected,
      totalFetched: rawLeads.length,
      qualifiedCount: finalLeads.length,
      fromCache: false,
      sourcesQueried,
      failedSources,
      leads: finalLeads,
      diagnostics,
    };

    // Store in Durable Cache (TTL: 1 hour)
    await durableCache.set(cacheKey, selected, displayQuery, locationStr, searchResult, 3600);

    return searchResult;
  }

  private async searchOnline(params: OnlineSearchParams, cacheKey: string): Promise<SearchResult> {
    const startTime = Date.now();
    const intent = parseSearchIntent(params.query);
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
      if (p && p.isConfigured()) {
        targets.push(p);
      } else {
        targets.push(this.onlineProviders.get("remotive")!);
      }
    }

    if (targets.length === 0) {
      targets.push(this.onlineProviders.get("remotive")!);
    }

    const sourcesQueried: string[] = [];
    const failedSources: string[] = [];
    const providerExecutions: ProviderExecutionResult[] = [];

    // Parallel fetch from all configured job providers with unified execution envelope
    const promises = targets.map(async (t) => {
      sourcesQueried.push(t.name);
      const reqStart = Date.now();
      try {
        let execResult: ProviderExecutionResult;
        if (typeof t.execute === "function") {
          execResult = await t.execute(params);
        } else {
          const jobs = await t.fetchJobs(params);
          execResult = {
            providerKey: t.providerKey,
            providerName: t.name,
            status: "success",
            fetchedCount: jobs.length,
            normalizedCount: jobs.length,
            filteredCount: jobs.length,
            finalCount: jobs.length,
            latencyMs: Date.now() - reqStart,
            fromCache: false,
            staleCache: false,
            jobs,
          };
        }
        healthMonitor.recordExecution(execResult);
        providerExecutions.push(execResult);

        if (execResult.status === "unavailable" || execResult.status === "schema_error") {
          failedSources.push(t.name);
        }

        return execResult.jobs;
      } catch (err: any) {
        const latency = Date.now() - reqStart;
        console.warn(`[OnlineJobProvider] ${t.name} failed (${latency}ms):`, err);
        const failResult: ProviderExecutionResult = {
          providerKey: t.providerKey,
          providerName: t.name,
          status: "unavailable",
          fetchedCount: 0,
          normalizedCount: 0,
          filteredCount: 0,
          finalCount: 0,
          latencyMs: latency,
          errorMessage: err?.message || String(err),
          fromCache: false,
          staleCache: false,
          jobs: [],
        };
        healthMonitor.recordExecution(failResult);
        failedSources.push(t.name);
        providerExecutions.push(failResult);
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

    // Output structured Development Matrix Diagnostic Log
    console.log(`\n================== [ONLINE RADAR PROVIDER DIAGNOSTICS] ==================`);
    console.log(`Query: "${params.query || "all"}" | Total Providers: ${targets.length} | Raw Leads: ${rawJobs.length}`);
    console.log(`ProviderKey    | Status        | Fetched | Normalized | Final | Latency | Cache`);
    console.log(`---------------|---------------|---------|------------|-------|---------|------`);
    for (const exec of providerExecutions) {
      const cacheTag = exec.staleCache ? "STALE" : exec.fromCache ? "HIT" : "LIVE";
      console.log(
        `${exec.providerKey.padEnd(14)} | ${exec.status.toUpperCase().padEnd(13)} | ${String(exec.fetchedCount).padStart(7)} | ${String(exec.normalizedCount).padStart(10)} | ${String(exec.finalCount).padStart(5)} | ${String(exec.latencyMs).padStart(5)}ms | ${cacheTag}`
      );
    }
    console.log(`=========================================================================\n`);

    // Deduplicate jobs by company + title similarity & canonical URL with multi-source attribution
    const deduplicated = deduplicateOnlineJobs(rawJobs);

    // Apply Multi-Factor Relevance Scoring & Filtering
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

    // Sort by multi-factor score descending
    scoredJobs.sort((a, b) => {
      const scoreDiff = (b.relevanceScore || 0) - (a.relevanceScore || 0);
      if (Math.abs(scoreDiff) > 0.05) return scoreDiff;
      return (b.dataQualityScore || 0) - (a.dataQualityScore || 0);
    });

    const finalJobs = await enrichLeadsBatch(scoredJobs, { forceRefresh: params.forceRefresh }) as OnlineJobLead[];
    const displayQuery = normalized.primaryIndustry ? normalized.primaryIndustry.name : params.query;
    const executionTimeMs = Date.now() - startTime;

    const diagnostics: SearchDiagnostics = {
      totalProvidersQueried: sourcesQueried.length,
      successfulProviders: sourcesQueried.length - failedSources.length,
      failedProviders: failedSources.length,
      sourcesQueried,
      sourcesFailed: failedSources,
      sourcesSucceeded: sourcesQueried.filter((s) => !failedSources.includes(s)),
      executionTimeMs,
      cached: false,
      providerExecutions: providerExecutions.map((e) => ({
        providerKey: e.providerKey,
        providerName: e.providerName,
        status: e.status,
        fetchedCount: e.fetchedCount,
        finalCount: e.finalCount,
        latencyMs: e.latencyMs,
        fromCache: e.fromCache,
        staleCache: e.staleCache,
        errorMessage: e.errorMessage,
      })),
    };

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
      diagnostics,
    };

    // Store in Durable Cache (TTL: 1 hour)
    await durableCache.set(cacheKey, selected, displayQuery, "Worldwide Remote", searchResult, 3600);

    return searchResult;
  }
}

export const aggregator = new LeadProviderAggregator();
export default aggregator;
