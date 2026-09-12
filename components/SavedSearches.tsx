"use client";

import React, { useState, useEffect } from "react";
import { History, ArrowRight, Calendar, Compass, Store, Terminal, Sparkles } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { getStoredSearchHistory, SearchHistoryItem, clearStoredSearchHistory } from "@/lib/search-history-store";

export default function SavedSearches() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    setHistory(getStoredSearchHistory());
  }, []);

  const handleClear = () => {
    clearStoredSearchHistory();
    setHistory([]);
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#0D0D0D] border border-[rgba(248,243,240,0.12)] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#161616] text-[#0048BB] border border-[rgba(248,243,240,0.12)] flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-[#F8F3F0] text-base">Historical Radar Scans</h3>
            <p className="text-xs text-[#A8A196]">
              Audit past queries, geographical yields, and provider metrics.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#080808] text-[#A8A196] border border-[rgba(248,243,240,0.12)]">
            {history.length} Scans Logged
          </span>
          {history.length > 0 && (
            <button
              onClick={handleClear}
              className="text-xs text-[#A8A196] hover:text-[#0048BB] transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0D0D0D] border border-[rgba(248,243,240,0.12)] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#080808] flex items-center justify-center text-[#A8A196] mx-auto border border-[rgba(248,243,240,0.08)]">
            <History className="w-6 h-6 text-[#0048BB]" />
          </div>
          <h4 className="text-base font-bold text-[#F8F3F0]">No Search Scans Recorded Yet</h4>
          <p className="text-xs text-[#A8A196] max-w-sm mx-auto">
            Run a live business discovery scan or remote job radar query from the home page. Your historical scans will be logged here automatically.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#0048BB] hover:bg-[#00388A] text-white text-xs font-bold shadow-md shadow-[#0048BB]/20 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch Lead Radar</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.map((s) => (
            <div
              key={s.id}
              className="bg-[#0D0D0D] border border-[rgba(248,243,240,0.12)] hover:border-[rgba(248,243,240,0.25)] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 group transition"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded flex items-center space-x-1 bg-[#161616] text-[#A8A196] border border-[rgba(248,243,240,0.12)]">
                    {s.mode === "physical" ? <Store className="w-3 h-3 text-[#0048BB]" /> : <Terminal className="w-3 h-3 text-[#0048BB]" />}
                    <span>{s.mode === "physical" ? "Local Physical" : "Remote Job"}</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#080808] text-[#A8A196] border border-[rgba(248,243,240,0.08)]">
                    {s.provider}
                  </span>
                </div>

                <h4 className="font-bold text-[#F8F3F0] text-base mt-2">
                  {s.query}
                </h4>

                <div className="text-xs text-[#A8A196] mt-1 flex items-center space-x-1">
                  <Compass className="w-3.5 h-3.5 text-[#0048BB] shrink-0" />
                  <span>{s.location}</span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 bg-[#080808] p-3 rounded-xl border border-[rgba(248,243,240,0.12)] text-xs">
                  <div>
                    <span className="text-[10px] text-[#A8A196] uppercase font-semibold">Total Scanned</span>
                    <div className="font-bold text-[#F8F3F0]">{s.totalFetched}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#5EBA8C] uppercase font-semibold">Qualified Leads</span>
                    <div className="font-bold text-[#5EBA8C]">{s.qualifiedCount}</div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[rgba(248,243,240,0.12)] flex items-center justify-between text-xs text-[#A8A196]">
                <div className="flex items-center space-x-1 text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-[#A8A196]" />
                  <span>{formatDate(s.createdAt)}</span>
                </div>

                <Link
                  href="/"
                  className="text-xs text-[#0048BB] hover:text-[#F8F3F0] font-semibold inline-flex items-center space-x-1"
                >
                  <span>Re-scan</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
