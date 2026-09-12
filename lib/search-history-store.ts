"use client";

import { useState, useEffect } from "react";

const SEARCH_HISTORY_KEY = "webhunt_leads_search_history_v1";
const LEGACY_HISTORY_KEY = "gacks_leads_search_history_v2";

export interface SearchHistoryItem {
  id: string;
  mode: "physical" | "online";
  query: string;
  location: string;
  provider: string;
  totalFetched: number;
  qualifiedCount: number;
  createdAt: string;
}

export function getStoredSearchHistory(): SearchHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY) || localStorage.getItem(LEGACY_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

export function logSearchHistory(item: Omit<SearchHistoryItem, "id" | "createdAt">): void {
  if (typeof window === "undefined") return;
  try {
    const prev = getStoredSearchHistory();
    const newItem: SearchHistoryItem = {
      ...item,
      id: `hist_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newItem, ...prev.filter((p) => p.query !== item.query)].slice(0, 30);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to log search history:", err);
  }
}

export function clearStoredSearchHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
    localStorage.removeItem(LEGACY_HISTORY_KEY);
  } catch (err) {
    console.error("Failed to clear search history:", err);
  }
}
