"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { 
  Search, 
  X, 
  ChevronDown, 
  Check, 
  Layers,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal
} from "lucide-react";
import { LeadMode } from "@/lib/types";
import { 
  IndustryDefinition, 
  searchTaxonomy, 
  getCategoriesWithIndustries, 
  getIndustryById 
} from "@/lib/taxonomy";

interface IndustrySelectorProps {
  mode: LeadMode;
  value: string;
  selectedIndustryIds: string[];
  onChange: (nicheText: string, industryIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function IndustrySelector({
  mode,
  value,
  selectedIndustryIds,
  onChange,
  placeholder,
  disabled = false,
}: IndustrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"search" | "categories">("search");
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  const triggerInputRef = useRef<HTMLInputElement>(null);
  const modalSearchInputRef = useRef<HTMLInputElement>(null);

  // Mount state for SSR safe Portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Category hierarchy for current mode
  const categoryGroups = useMemo(() => {
    return getCategoriesWithIndustries(mode);
  }, [mode]);

  // Set default category tab if not set
  useEffect(() => {
    if (categoryGroups.length > 0 && !selectedCategoryTab) {
      setSelectedCategoryTab(categoryGroups[0].category.id);
    }
  }, [categoryGroups, selectedCategoryTab]);

  // Search results based on live typing in modal
  const searchResults = useMemo(() => {
    return searchTaxonomy(searchQuery, mode, 30);
  }, [searchQuery, mode]);

  // Selected industry objects
  const selectedIndustries = useMemo(() => {
    return selectedIndustryIds
      .map((id) => getIndustryById(id))
      .filter((ind): ind is IndustryDefinition => Boolean(ind));
  }, [selectedIndustryIds]);

  // Body scroll locking when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  // Auto-focus modal search input when opening
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        modalSearchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle closing modal and restoring focus
  const handleClose = () => {
    setIsOpen(false);
    triggerInputRef.current?.focus();
  };

  // Keyboard navigation (Escape key to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Handle selecting / toggling an industry from taxonomy
  const handleToggleIndustry = (industry: IndustryDefinition) => {
    const isAlreadySelected = selectedIndustryIds.includes(industry.id);
    let newIds: string[];

    if (isAlreadySelected) {
      newIds = selectedIndustryIds.filter((id) => id !== industry.id);
    } else {
      newIds = [...selectedIndustryIds, industry.id];
    }

    const updatedIndustries = newIds
      .map((id) => getIndustryById(id))
      .filter((ind): ind is IndustryDefinition => Boolean(ind));

    const newNicheText = updatedIndustries.length > 0 
      ? updatedIndustries.map((ind) => ind.name).join(", ")
      : "";

    onChange(newNicheText, newIds);
  };

  // Handle removing a single tag
  const handleRemoveIndustry = (idToRemove: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newIds = selectedIndustryIds.filter((id) => id !== idToRemove);
    const updatedIndustries = newIds
      .map((id) => getIndustryById(id))
      .filter((ind): ind is IndustryDefinition => Boolean(ind));

    const newNicheText = updatedIndustries.length > 0 
      ? updatedIndustries.map((ind) => ind.name).join(", ")
      : "";

    onChange(newNicheText, newIds);
  };

  // Handle clearing all selections
  const handleClearAll = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange("", []);
    setSearchQuery("");
  };

  // Handle direct text typing in the form trigger input
  const handleTriggerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSearchQuery(text);
    onChange(text, selectedIndustryIds);
  };

  // Open modal handler
  const handleOpenModal = () => {
    if (disabled) return;
    setSearchQuery(value || "");
    setIsOpen(true);
  };

  // Render Modal Content via React Portal
  const renderModal = () => {
    if (!isOpen || !mounted) return null;

    const modalMarkup = (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={handleClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="industry-modal-title"
      >
        {/* Centered Modal Card */}
        <div 
          className="relative w-full max-w-2xl sm:max-w-3xl max-h-[90vh] sm:max-h-[85vh] bg-[#0D0D0D] border border-[rgba(248,243,240,0.16)] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#F8F3F0] animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="relative z-10 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[rgba(248,243,240,0.12)] bg-[#121212]/90">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-[#1C1C1C] border border-[rgba(0,72,187,0.3)] flex items-center justify-center text-[#0048BB]">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 id="industry-modal-title" className="text-base sm:text-lg font-bold text-[#F8F3F0] tracking-tight">
                  Target Industry / Business Type
                </h3>
                <p className="text-xs text-[#A8A196]">
                  {mode === "physical"
                    ? "Select verified business niches or enter custom keywords for lead discovery"
                    : "Select verified job fields or enter custom search keywords"}
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="text-[#A8A196] hover:text-[#F8F3F0] hover:bg-[#1C1C1C] p-2 rounded-xl transition border border-transparent hover:border-[rgba(248,243,240,0.12)]"
              aria-label="Close modal"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Search Bar */}
          <div className="relative z-10 px-5 sm:px-6 py-3.5 bg-[#090909] border-b border-[rgba(248,243,240,0.08)]">
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#A8A196]" />
              <input
                ref={modalSearchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeTab !== "search") setActiveTab("search");
                }}
                placeholder={
                  mode === "physical"
                    ? "Search industries (e.g. Plumbers, Auto Repair, Dentists, Solar)..."
                    : "Search job fields (e.g. Software, AI Data, Writing, UI/UX)..."
                }
                className="w-full bg-[#121212] border border-[rgba(248,243,240,0.14)] rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#F8F3F0] placeholder-[#A8A196]/60 focus:outline-none focus:ring-2 focus:ring-[#0048BB]/40 focus:border-[#0048BB] transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-3 text-[#A8A196] hover:text-[#F8F3F0] p-0.5"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation View Tabs */}
          <div className="relative z-10 flex items-center justify-between border-b border-[rgba(248,243,240,0.1)] bg-[#121212] px-5 sm:px-6 py-2.5 text-xs">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                type="button"
                onClick={() => setActiveTab("search")}
                className={`flex items-center space-x-1.5 py-1.5 px-3 rounded-lg font-semibold transition ${
                  activeTab === "search"
                    ? "bg-[#1C1C1C] text-[#0048BB] border border-[rgba(0,72,187,0.3)] shadow-sm"
                    : "text-[#A8A196] hover:text-[#F8F3F0] hover:bg-[#161616]"
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Quick Search</span>
                {searchResults.length > 0 && searchQuery && (
                  <span className="text-[10px] bg-[#0048BB]/20 text-[#0048BB] px-1.5 py-0.2 rounded-full font-bold">
                    {searchResults.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("categories")}
                className={`flex items-center space-x-1.5 py-1.5 px-3 rounded-lg font-semibold transition ${
                  activeTab === "categories"
                    ? "bg-[#1C1C1C] text-[#0048BB] border border-[rgba(0,72,187,0.3)] shadow-sm"
                    : "text-[#A8A196] hover:text-[#F8F3F0] hover:bg-[#161616]"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>All Global Sectors</span>
                <span className="text-[10px] bg-[#222222] text-[#A8A196] px-1.5 py-0.2 rounded-full">
                  {categoryGroups.length}
                </span>
              </button>
            </div>

            <div className="hidden sm:flex items-center space-x-1.5 text-[11px] font-medium text-[#5EBA8C] bg-[#5EBA8C]/10 border border-[#5EBA8C]/20 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Global Taxonomy Indexed</span>
            </div>
          </div>

          {/* Active Selections Bar inside modal */}
          {selectedIndustries.length > 0 && (
            <div className="relative z-10 px-5 sm:px-6 py-2 bg-[#141414] border-b border-[rgba(248,243,240,0.08)] flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto">
              <span className="text-[11px] font-medium text-[#A8A196] mr-1">Selected:</span>
              {selectedIndustries.map((ind) => (
                <span
                  key={ind.id}
                  className="inline-flex items-center space-x-1.5 bg-[#1C1C1C] text-[#F8F3F0] border border-[rgba(0,72,187,0.4)] text-xs font-semibold px-2.5 py-0.5 rounded-lg transition"
                >
                  <span>{ind.name}</span>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveIndustry(ind.id, e)}
                    className="hover:text-[#0048BB] transition p-0.5 rounded"
                    title="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <button
                type="button"
                onClick={(e) => handleClearAll(e)}
                className="text-[11px] text-[#A8A196] hover:text-[#0048BB] underline ml-1 transition"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Modal Body Content */}
          <div className="relative z-10 flex-1 overflow-hidden flex flex-col min-h-[260px] sm:min-h-[320px]">
            {/* View 1: Quick Search View */}
            {activeTab === "search" && (
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-[rgba(248,243,240,0.06)]">
                {searchResults.length > 0 ? (
                  <div className="space-y-1.5">
                    <div className="px-2 py-1 text-[11px] font-semibold text-[#A8A196] uppercase tracking-wider flex items-center justify-between">
                      <span>{searchQuery ? `Matching Niches (${searchResults.length})` : "Indexed Global Niches"}</span>
                      <Sparkles className="w-3.5 h-3.5 text-[#0048BB]" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {searchResults.map((ind) => {
                        const isSelected = selectedIndustryIds.includes(ind.id);
                        return (
                          <button
                            type="button"
                            key={ind.id}
                            onClick={() => handleToggleIndustry(ind)}
                            className={`w-full text-left p-3 rounded-xl flex items-start justify-between transition group border ${
                              isSelected
                                ? "bg-[#10192A] text-[#0048BB] border-[rgba(0,72,187,0.4)] shadow-sm"
                                : "bg-[#101010] hover:bg-[#161616] text-[#F8F3F0] border-[rgba(248,243,240,0.06)] hover:border-[rgba(248,243,240,0.14)]"
                            }`}
                          >
                            <div className="flex flex-col pr-2 min-w-0">
                              <span className="text-xs font-semibold group-hover:text-[#0048BB] transition truncate">
                                {ind.name}
                              </span>
                              <span className="text-[11px] text-[#A8A196] line-clamp-1 mt-0.5">
                                {ind.aliases.slice(0, 3).join(" • ")}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0 mt-0.5">
                              {isSelected ? (
                                <div className="w-5 h-5 rounded-md bg-[#0048BB] text-white flex items-center justify-center">
                                  <Check className="w-3.5 h-3.5" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-md border border-[rgba(248,243,240,0.2)] group-hover:border-[#0048BB] transition" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#161616] border border-[rgba(248,243,240,0.12)] flex items-center justify-center mx-auto text-[#A8A196]">
                      <Search className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#F8F3F0]">
                        No exact taxonomy match for &quot;{searchQuery}&quot;
                      </p>
                      <p className="text-xs text-[#A8A196] max-w-md mx-auto mt-1">
                        WebHunt will execute this keyword as a custom discovery query across all active providers.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* View 2: Categorized Global Sectors Explorer */}
            {activeTab === "categories" && (
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-[rgba(248,243,240,0.1)]">
                {/* Category List Sidebar */}
                <div className="sm:col-span-5 max-h-[360px] sm:max-h-none overflow-y-auto p-2 space-y-1 bg-[#090909]">
                  <div className="px-2 py-1 text-[11px] font-semibold text-[#A8A196] uppercase tracking-wider">
                    Global Sectors ({categoryGroups.length})
                  </div>
                  {categoryGroups.map((group) => {
                    const isSelectedCat = selectedCategoryTab === group.category.id;
                    const selectedCountInGroup = group.industries.filter((i) =>
                      selectedIndustryIds.includes(i.id)
                    ).length;

                    return (
                      <button
                        type="button"
                        key={group.category.id}
                        onClick={() => setSelectedCategoryTab(group.category.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                          isSelectedCat
                            ? "bg-[#181818] text-[#0048BB] font-bold border-l-2 border-[#0048BB] shadow-sm"
                            : "text-[#A8A196] hover:bg-[#121212] hover:text-[#F8F3F0]"
                        }`}
                      >
                        <span className="truncate">{group.category.name}</span>
                        <div className="flex items-center space-x-1.5 shrink-0 ml-1.5">
                          {selectedCountInGroup > 0 && (
                            <span className="text-[10px] bg-[#0048BB] text-white px-1.5 py-0.2 rounded-full font-bold">
                              {selectedCountInGroup}
                            </span>
                          )}
                          <span className="text-[10px] text-[#A8A196]/60">
                            {group.industries.length}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-niches in active category */}
                <div className="sm:col-span-7 max-h-[360px] sm:max-h-none overflow-y-auto p-3 space-y-1.5 bg-[#0D0D0D]">
                  <div className="px-2 py-1 text-[11px] font-semibold text-[#A8A196] uppercase tracking-wider flex items-center justify-between">
                    <span>
                      {categoryGroups.find((g) => g.category.id === selectedCategoryTab)?.category.name || "Industries"}
                    </span>
                    <span className="text-[10px] text-[#A8A196]">Click to select</span>
                  </div>

                  <div className="space-y-1">
                    {categoryGroups
                      .find((g) => g.category.id === selectedCategoryTab)
                      ?.industries.map((ind) => {
                        const isSelected = selectedIndustryIds.includes(ind.id);
                        return (
                          <button
                            type="button"
                            key={ind.id}
                            onClick={() => handleToggleIndustry(ind)}
                            className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between text-xs transition border ${
                              isSelected
                                ? "bg-[#10192A] text-[#0048BB] border-[rgba(0,72,187,0.4)] font-semibold shadow-sm"
                                : "bg-[#121212] hover:bg-[#181818] text-[#F8F3F0] border-[rgba(248,243,240,0.06)] hover:border-[rgba(248,243,240,0.12)]"
                            }`}
                          >
                            <div className="flex flex-col min-w-0 pr-2">
                              <span className="truncate">{ind.name}</span>
                              <span className="text-[10px] text-[#A8A196] truncate">
                                {ind.aliases.slice(0, 2).join(" • ")}
                              </span>
                            </div>
                            
                            <div className="shrink-0">
                              {isSelected ? (
                                <div className="w-5 h-5 rounded-md bg-[#0048BB] text-white flex items-center justify-center">
                                  <Check className="w-3.5 h-3.5" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-md border border-[rgba(248,243,240,0.2)]" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[rgba(248,243,240,0.12)] bg-[#121212] px-5 sm:px-6 py-3.5">
            <div className="text-xs text-[#A8A196]">
              {selectedIndustryIds.length > 0 ? (
                <span className="font-medium text-[#F8F3F0]">
                  <strong className="text-[#0048BB]">{selectedIndustryIds.length}</strong> target industry niche(s) selected
                </span>
              ) : (
                <span>No niche selected (using free-text or general discovery)</span>
              )}
            </div>

            <div className="flex items-center space-x-2 justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-[#A8A196] hover:text-[#F8F3F0] hover:bg-[#1C1C1C] rounded-xl transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 bg-[#0048BB] hover:bg-[#00388A] text-white text-xs font-bold rounded-xl shadow-md shadow-[#0048BB]/20 transition flex items-center space-x-1.5"
              >
                <span>Done / Apply Selection</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );

    return createPortal(modalMarkup, document.body);
  };

  return (
    <div className="relative w-full">
      {/* Main Searchable Input Trigger (Opens Modal) */}
      <div 
        className="relative cursor-pointer group"
        onClick={handleOpenModal}
      >
        <input
          ref={triggerInputRef}
          type="text"
          value={value}
          onChange={handleTriggerInputChange}
          onClick={handleOpenModal}
          placeholder={
            placeholder ||
            (mode === "physical"
              ? "Search or select industries (e.g. Plumbers, Auto Repair, Dentists)..."
              : "Search or select job fields (e.g. Software, AI Data, Writing)...")
          }
          disabled={disabled}
          readOnly
          className="w-full bg-[#080808] border border-[rgba(248,243,240,0.12)] rounded-xl pl-4 pr-10 py-3 text-sm text-[#F8F3F0] placeholder-[#A8A196]/50 focus:outline-none focus:ring-2 focus:ring-[#0048BB]/40 focus:border-[#0048BB] cursor-pointer group-hover:border-[rgba(248,243,240,0.24)] transition"
        />

        <div className="absolute right-3 top-3.5 flex items-center space-x-1">
          {value ? (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[#A8A196] hover:text-[#F8F3F0] p-0.5 transition"
              title="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenModal}
              className="text-[#A8A196] group-hover:text-[#F8F3F0] transition"
              title="Open taxonomy modal"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Render Portal Modal Overlay */}
      {renderModal()}
    </div>
  );
}

