"use client";

import React, { useState } from "react";
import { 
  Search, 
  MapPin, 
  Globe, 
  Layers, 
  Sparkles, 
  RefreshCw, 
  ArrowRight,
  Store,
  Terminal
} from "lucide-react";
import { LeadMode, PhysicalProviderType, OnlineProviderType, SearchParams } from "@/lib/types";
import { COUNTRIES } from "@/lib/countries";
import IndustrySelector from "./IndustrySelector";

interface SearchFormProps {
  onSearch: (params: SearchParams) => Promise<any>;
  isLoading: boolean;
  providersStatus: {
    physical: { key: string; name: string; configured: boolean; isFree: boolean }[];
    online: { key: string; name: string; configured: boolean; isFree: boolean }[];
  };
}

export default function SearchForm({ onSearch, isLoading, providersStatus }: SearchFormProps) {
  const [mode, setMode] = useState<LeadMode>("physical");

  // Physical mode state
  const [niche, setNiche] = useState("Plumbers & Plumbing Services");
  const [physicalIndustryIds, setPhysicalIndustryIds] = useState<string[]>(["plumbing"]);
  const [country, setCountry] = useState("Kenya");
  const [city, setCity] = useState("");
  const [radius, setRadius] = useState<number>(25);
  const [physicalProvider, setPhysicalProvider] = useState<PhysicalProviderType>("all");

  // Online mode state
  const [query, setQuery] = useState("React / Next.js Developer");
  const [onlineIndustryIds, setOnlineIndustryIds] = useState<string[]>(["software_development"]);
  const [category, setCategory] = useState<string>("all");
  const [onlineProvider, setOnlineProvider] = useState<OnlineProviderType>("all");

  const [forceRefresh, setForceRefresh] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "physical") {
      if (!niche.trim() || !country) return;
      onSearch({
        mode: "physical",
        niche: niche.trim(),
        industryIds: physicalIndustryIds,
        country,
        city: city.trim(),
        radius,
        provider: physicalProvider,
        forceRefresh,
      });
    } else {
      if (!query.trim()) return;
      onSearch({
        mode: "online",
        query: query.trim(),
        industryIds: onlineIndustryIds,
        category: category !== "all" ? category : undefined,
        provider: onlineProvider,
        forceRefresh,
      });
    }
  };

  return (
    <div className="bg-[#0D0D0D] border border-[rgba(248,243,240,0.12)] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      {/* Mode Switcher Banner */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[rgba(248,243,240,0.12)]">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#161616] border border-[rgba(248,243,240,0.12)] text-[#A8A196] text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#0048BB]" />
            <span>Multi-Channel Lead Discovery Radar</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#F8F3F0] tracking-tight">
            Discover High-Conversion Leads
          </h2>
        </div>

        {/* Dual Mode Toggle Buttons */}
        <div className="bg-[#000000] p-1.5 rounded-2xl border border-[rgba(248,243,240,0.12)] flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setMode("physical")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              mode === "physical"
                ? "bg-[#0048BB] text-white shadow-md shadow-[#0048BB]/20"
                : "text-[#A8A196] hover:text-[#F8F3F0] hover:bg-[#161616]/50"
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Physical Mode (No Website)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("online")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              mode === "online"
                ? "bg-[#0048BB] text-white shadow-md shadow-[#0048BB]/20"
                : "text-[#A8A196] hover:text-[#F8F3F0] hover:bg-[#161616]/50"
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Online Mode (Remote Gigs)</span>
          </button>
        </div>
      </div>

      {/* Search Input Form */}
      <form onSubmit={handleSubmit} className="relative z-10 space-y-6 pt-6">
        {mode === "physical" ? (
          /* ================= PHYSICAL MODE INPUTS ================= */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Niche Input with Interactive Taxonomy Selector */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-semibold text-[#A8A196] flex items-center space-x-1.5">
                  <Search className="w-3.5 h-3.5 text-[#0048BB]" />
                  <span>Target Industry / Business Type</span>
                </label>
                <IndustrySelector
                  mode="physical"
                  value={niche}
                  selectedIndustryIds={physicalIndustryIds}
                  onChange={(newNiche, newIds) => {
                    setNiche(newNiche);
                    setPhysicalIndustryIds(newIds);
                  }}
                  placeholder="Search industries (e.g. Plumbers, Auto Repair)..."
                />
              </div>

              {/* Worldwide Country Selector */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-semibold text-[#A8A196] flex items-center space-x-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#0048BB]" />
                  <span>Target Country (Worldwide)</span>
                </label>
                <div className="relative">
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-[#080808] border border-[rgba(248,243,240,0.12)] rounded-xl px-4 py-3 text-sm text-[#F8F3F0] focus:outline-none focus:ring-2 focus:ring-[#0048BB]/40 focus:border-[#0048BB] appearance-none cursor-pointer transition"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.name} className="bg-[#0D0D0D] text-[#F8F3F0]">
                        {c.flag} {c.name} {c.dialCode ? `(${c.dialCode})` : ""}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-3.5 pointer-events-none text-[#A8A196] text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* City / Region Input */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-semibold text-[#A8A196] flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0048BB]" />
                  <span>City / Region / ZIP (Optional)</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Nairobi, Mombasa, Austin..."
                  className="w-full bg-[#080808] border border-[rgba(248,243,240,0.12)] rounded-xl px-4 py-3 text-sm text-[#F8F3F0] placeholder-[#A8A196]/50 focus:outline-none focus:ring-2 focus:ring-[#0048BB]/40 focus:border-[#0048BB] transition"
                />
              </div>
            </div>
          </div>
        ) : (
          /* ================= ONLINE MODE INPUTS ================= */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Job Keyword / Industry Selector */}
              <div className="md:col-span-12 space-y-1.5">
                <label className="text-xs font-semibold text-[#A8A196] flex items-center space-x-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#0048BB]" />
                  <span>Job Role, Field or Service Keyword</span>
                </label>
                <IndustrySelector
                  mode="online"
                  value={query}
                  selectedIndustryIds={onlineIndustryIds}
                  onChange={(newQuery, newIds) => {
                    setQuery(newQuery);
                    setOnlineIndustryIds(newIds);
                  }}
                  placeholder="Search job fields (e.g. Software Development, AI Data, Writing)..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Controls Strip */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[rgba(248,243,240,0.12)]">
          <div className="flex items-center space-x-4">
            <label className="inline-flex items-center space-x-2 cursor-pointer text-xs text-[#A8A196] hover:text-[#F8F3F0] select-none">
              <input
                type="checkbox"
                checked={forceRefresh}
                onChange={(e) => setForceRefresh(e.target.checked)}
                className="rounded border-[rgba(248,243,240,0.2)] text-[#0048BB] focus:ring-0 bg-[#080808]"
              />
              <span>Fresh Scan</span>
            </label>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-[#0048BB] hover:bg-[#00388A] text-white font-bold text-sm shadow-md shadow-[#0048BB]/25 disabled:opacity-50 transition duration-150"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>
                  {mode === "physical"
                    ? `Scanning ${country} for Real Businesses...`
                    : "Scanning Live Remote Opportunities..."}
                </span>
              </>
            ) : (
              <>
                <span>
                  {mode === "physical" ? "Launch Local Lead Radar" : "Scan Remote Opportunities"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
