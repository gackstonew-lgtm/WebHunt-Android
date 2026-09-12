"use client";

import { getStoredPipelineLeads, saveStoredPipelineLeads } from "./pipeline-store";
import { LeadItem } from "./types";
import { bulkSaveLeadsAction, fetchPipelineLeadsAction } from "@/app/actions/leads";

const LAST_SYNC_KEY = "webhunt_last_db_sync_timestamp";

/**
 * Synchronizes client-side localStorage leads with the authenticated database.
 * Merges both sets and eliminates duplicates based on unique identifiers.
 */
export async function syncLocalStorageWithDatabase(userId?: string): Promise<{
  success: boolean;
  totalSynced: number;
  error?: string;
}> {
  if (typeof window === "undefined") return { success: true, totalSynced: 0 };

  try {
    const localLeads = getStoredPipelineLeads();
    
    // 1. Fetch server leads
    const serverResult = await fetchPipelineLeadsAction(userId);
    const serverLeads: LeadItem[] = serverResult.success && serverResult.data ? serverResult.data : [];

    // 2. Map existing server leads by identifier (phone / url / id)
    const serverMap = new Map<string, LeadItem>();
    serverLeads.forEach((l) => {
      const key = l.type === "physical" ? (l.phone || l.id) : (l.url || l.id);
      serverMap.set(key, l);
    });

    // 3. Identify local leads that are not yet on the server
    const leadsToUpload: LeadItem[] = [];
    localLeads.forEach((localLead) => {
      const key = localLead.type === "physical" ? (localLead.phone || localLead.id) : (localLead.url || localLead.id);
      if (!serverMap.has(key)) {
        leadsToUpload.push(localLead);
      }
    });

    // 4. Upload missing local leads to server
    if (leadsToUpload.length > 0) {
      await bulkSaveLeadsAction(leadsToUpload, userId);
    }

    // 5. Merge all unique leads back into local storage so offline access is fast and complete
    const mergedMap = new Map<string, LeadItem>();
    
    // Server leads first
    serverLeads.forEach((l) => {
      const key = l.type === "physical" ? (l.phone || l.id) : (l.url || l.id);
      mergedMap.set(key, l);
    });

    // Local leads overlay (keeping any newer local notes or edits)
    localLeads.forEach((l) => {
      const key = l.type === "physical" ? (l.phone || l.id) : (l.url || l.id);
      if (!mergedMap.has(key)) {
        mergedMap.set(key, l);
      }
    });

    const mergedList = Array.from(mergedMap.values());
    saveStoredPipelineLeads(mergedList);
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

    return {
      success: true,
      totalSynced: mergedList.length,
    };
  } catch (err: any) {
    console.warn("[SyncBridge] Auto-sync encountered an issue:", err);
    return {
      success: false,
      totalSynced: 0,
      error: err.message || "Failed to sync pipeline storage",
    };
  }
}
