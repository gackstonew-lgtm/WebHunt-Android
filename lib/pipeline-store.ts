"use client";

import { useState, useEffect } from "react";
import { LeadItem, PipelineStatus } from "./types";

const PIPELINE_STORAGE_KEY = "webhunt_leads_pipeline_v1";
const LEGACY_STORAGE_KEY = "gacks_leads_pipeline_v2";

export interface PipelineStats {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  interestedLeads: number;
  closedLeads: number;
  archivedLeads: number;
  physicalCount: number;
  onlineCount: number;
  totalPipelineValue: number;
  potentialClosedValue: number;
}

export function getStoredPipelineLeads(): LeadItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PIPELINE_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read pipeline from localStorage:", err);
    return [];
  }
}

export function saveStoredPipelineLeads(leads: LeadItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PIPELINE_STORAGE_KEY, JSON.stringify(leads));
  } catch (err) {
    console.error("Failed to save pipeline to localStorage:", err);
  }
}

export function calculatePipelineStats(leads: LeadItem[]): PipelineStats {
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === "NEW").length;
  const contactedLeads = leads.filter((l) => l.status === "CONTACTED").length;
  const interestedLeads = leads.filter((l) => l.status === "INTERESTED").length;
  const closedLeads = leads.filter((l) => l.status === "CLOSED").length;
  const archivedLeads = leads.filter((l) => l.status === "NOT_INTERESTED").length;

  const physicalCount = leads.filter((l) => l.type === "physical").length;
  const onlineCount = leads.filter((l) => l.type === "online").length;

  const totalPipelineValue = leads.reduce((sum, l) => sum + (l.estimatedValue || 1500), 0);
  const potentialClosedValue = leads
    .filter((l) => l.status === "INTERESTED" || l.status === "CLOSED")
    .reduce((sum, l) => sum + (l.estimatedValue || 1500), 0);

  return {
    totalLeads,
    newLeads,
    contactedLeads,
    interestedLeads,
    closedLeads,
    archivedLeads,
    physicalCount,
    onlineCount,
    totalPipelineValue,
    potentialClosedValue,
  };
}

export function useLeadPipeline() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = getStoredPipelineLeads();
    setLeads(stored);
    setIsLoaded(true);
  }, []);

  const saveLead = (lead: LeadItem) => {
    setLeads((prev) => {
      // De-duplicate in pipeline by ID or phone/url
      const existsIndex = prev.findIndex(
        (item) =>
          item.id === lead.id ||
          (item.type === "physical" && lead.type === "physical" && item.phone === lead.phone) ||
          (item.type === "online" && lead.type === "online" && item.url === lead.url)
      );

      let updated: LeadItem[];
      if (existsIndex >= 0) {
        updated = [...prev];
        updated[existsIndex] = lead;
      } else {
        updated = [lead, ...prev];
      }
      saveStoredPipelineLeads(updated);
      return updated;
    });
  };

  const bulkSaveLeads = (newLeads: LeadItem[]) => {
    setLeads((prev) => {
      const existingIds = new Set(prev.map((l) => l.id));
      const filtered = newLeads.filter((l) => !existingIds.has(l.id));
      const updated = [...filtered, ...prev];
      saveStoredPipelineLeads(updated);
      return updated;
    });
  };

  const updateStatus = (leadId: string, status: PipelineStatus) => {
    setLeads((prev) => {
      const updated = prev.map((l) => {
        if (l.id === leadId) {
          return {
            ...l,
            status,
            contactedAt: status === "CONTACTED" || status === "INTERESTED" || status === "CLOSED" ? new Date() : l.contactedAt,
            updatedAt: new Date(),
          };
        }
        return l;
      });
      saveStoredPipelineLeads(updated);
      return updated;
    });
  };

  const updateNotes = (leadId: string, notes: string, estimatedValue?: number) => {
    setLeads((prev) => {
      const updated = prev.map((l) => {
        if (l.id === leadId) {
          return {
            ...l,
            notes,
            estimatedValue: estimatedValue !== undefined ? estimatedValue : l.estimatedValue,
            updatedAt: new Date(),
          };
        }
        return l;
      });
      saveStoredPipelineLeads(updated);
      return updated;
    });
  };

  const deleteLead = (leadId: string) => {
    setLeads((prev) => {
      const updated = prev.filter((l) => l.id !== leadId);
      saveStoredPipelineLeads(updated);
      return updated;
    });
  };

  const clearPipeline = () => {
    setLeads([]);
    saveStoredPipelineLeads([]);
  };

  const stats = calculatePipelineStats(leads);

  return {
    leads,
    stats,
    isLoaded,
    saveLead,
    bulkSaveLeads,
    updateStatus,
    updateNotes,
    deleteLead,
    clearPipeline,
  };
}

export function clearAllClientStorage(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PIPELINE_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem("webhunt_last_db_sync_timestamp");
    localStorage.removeItem("webhunt_leads_search_history_v1");
    localStorage.removeItem("gacks_leads_search_history_v2");
  } catch (err) {
    console.error("Failed to clear all client storage:", err);
  }
}
