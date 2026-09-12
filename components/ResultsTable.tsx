"use client";

import React, { useState } from "react";
import { 
  Phone, 
  Copy, 
  Check, 
  MapPin, 
  Star, 
  Sparkles, 
  Download, 
  Plus, 
  BookmarkCheck, 
  FileText, 
  MessageSquareQuote,
  ShieldCheck,
  CheckSquare,
  Square,
  ArrowUpDown,
  Filter,
  Terminal,
  Store,
  ExternalLink,
  Mail,
  MessageCircle,
  Globe,
  Calendar
} from "lucide-react";
import { LeadItem, OnlineJobLead, PhysicalLead, SearchResult } from "@/lib/types";
import PitchScriptModal from "./PitchScriptModal";
import JobProposalModal from "./JobProposalModal";
import LeadNotesModal from "./LeadNotesModal";
import JobCard from "./JobCard";
import { exportLeadsToCsv } from "@/lib/export";

interface ResultsTableProps {
  searchResult: SearchResult;
  onSaveLead: (lead: LeadItem) => void;
  onBulkSave: (leads: LeadItem[]) => void;
  savedLeadIds: Set<string>;
}

export default function ResultsTable({
  searchResult,
  onSaveLead,
  onBulkSave,
  savedLeadIds,
}: ResultsTableProps) {
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [pitchLead, setPitchLead] = useState<PhysicalLead | null>(null);
  const [proposalJob, setProposalJob] = useState<OnlineJobLead | null>(null);
  const [notesLead, setNotesLead] = useState<LeadItem | null>(null);

  // Sorting & Filtering state
  const [sortBy, setSortBy] = useState<string>("default");
  const [minRating, setMinRating] = useState<number>(0);
  const [tagFilter, setTagFilter] = useState<string>("ALL");

  const leads = searchResult.leads;

  // Filter & Sort
  const filteredLeads = leads
    .filter((l) => {
      if (l.type === "physical" && minRating > 0) {
        return (l.rating || 0) >= minRating;
      }
      if (l.type === "online" && tagFilter !== "ALL") {
        return l.tags?.some((t) => t.toLowerCase().includes(tagFilter.toLowerCase()));
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "rating" && a.type === "physical" && b.type === "physical") {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === "name") {
        const nameA = a.type === "physical" ? a.businessName : a.title;
        const nameB = b.type === "physical" ? b.businessName : b.title;
        return nameA.localeCompare(nameB);
      }
      return 0;
    });

  const handleCopyPhone = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleCopyEmail = (email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.size === filteredLeads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(filteredLeads.map((l) => l.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedLeadIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLeadIds(next);
  };

  const handleSaveAll = () => {
    const targets =
      selectedLeadIds.size > 0
        ? filteredLeads.filter((l) => selectedLeadIds.has(l.id))
        : filteredLeads;
    onBulkSave(targets);
  };

  const handleExport = () => {
    const targets =
      selectedLeadIds.size > 0
        ? filteredLeads.filter((l) => selectedLeadIds.has(l.id))
        : filteredLeads;
    exportLeadsToCsv(targets, `webhunt-leads-${searchResult.mode}`);
  };

  return (
    <div className="space-y-4">
      {/* Metrics Banner */}
      <div className="bg-[#0D0D0D] border border-[rgba(248,243,240,0.12)] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-2xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#161616] border border-[rgba(248,243,240,0.12)] text-[#F8F3F0]">
            {searchResult.mode === "physical" ? <Store className="w-5 h-5 text-[#0048BB]" /> : <Terminal className="w-5 h-5 text-[#0048BB]" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-[#F8F3F0] text-base">
                {searchResult.mode === "physical"
                  ? `Found ${leads.length} Verified Local Businesses Without Websites`
                  : `Found ${leads.length} Live Remote Opportunities (100% Real Data)`}
              </h3>
              {searchResult.fromCache && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#161616] text-[#A8A196] border border-[rgba(248,243,240,0.12)]">
                  Cached
                </span>
              )}
            </div>
            <p className="text-xs text-[#A8A196]">
              {searchResult.mode === "physical"
                ? `Scanned ${searchResult.totalFetched} live records in ${searchResult.location} for "${searchResult.query}"`
                : `Queried official public developer endpoints for "${searchResult.query}"`}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Physical Rating Filter */}
          {searchResult.mode === "physical" && (
            <div className="flex items-center space-x-1.5 bg-[#080808] border border-[rgba(248,243,240,0.12)] px-3 py-1.5 rounded-xl text-xs text-[#A8A196]">
              <Filter className="w-3.5 h-3.5 text-[#A8A196]" />
              <select
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                className="bg-transparent text-[#F8F3F0] focus:outline-none cursor-pointer"
              >
                <option value="0" className="bg-[#0D0D0D]">All Ratings</option>
                <option value="4.0" className="bg-[#0D0D0D]">★ 4.0+ Rating</option>
                <option value="4.5" className="bg-[#0D0D0D]">★ 4.5+ Rating</option>
              </select>
            </div>
          )}

          {/* Sort Selector */}
          <div className="flex items-center space-x-1.5 bg-[#080808] border border-[rgba(248,243,240,0.12)] px-3 py-1.5 rounded-xl text-xs text-[#A8A196]">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#A8A196]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-[#F8F3F0] focus:outline-none cursor-pointer"
            >
              <option value="default" className="bg-[#0D0D0D]">Default Order</option>
              {searchResult.mode === "physical" && (
                <option value="rating" className="bg-[#0D0D0D]">Highest Rating</option>
              )}
              <option value="name" className="bg-[#0D0D0D]">Alphabetical</option>
            </select>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExport}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#080808] hover:bg-[#161616] text-[#F8F3F0] border border-[rgba(248,243,240,0.12)] text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5 text-[#A8A196]" />
            <span>Export CSV</span>
          </button>

          {/* Bulk Save to Pipeline */}
          <button
            onClick={handleSaveAll}
            disabled={filteredLeads.length === 0}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#0048BB] hover:bg-[#00388A] text-white font-semibold text-xs shadow-md shadow-[#0048BB]/20 disabled:opacity-50 transition"
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>
              {selectedLeadIds.size > 0
                ? `Save Selected (${selectedLeadIds.size})`
                : `Save All (${filteredLeads.length})`}
            </span>
          </button>
        </div>
      </div>

      {/* Results Content */}
      {searchResult.mode === "physical" ? (
        /* ================= PHYSICAL TABLE ================= */
        <div className="bg-[#0D0D0D] border border-[rgba(248,243,240,0.12)] rounded-2xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[rgba(248,243,240,0.12)] bg-[#080808]/90 text-[#A8A196] font-semibold uppercase tracking-wider">
                  <th className="p-4 w-10 text-center">
                    <button onClick={toggleSelectAll} className="text-[#A8A196] hover:text-[#F8F3F0]">
                      {selectedLeadIds.size === filteredLeads.length && filteredLeads.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-[#0048BB]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-4">Business & Niche</th>
                  <th className="p-4">Contact Channels</th>
                  <th className="p-4">Location & Country</th>
                  <th className="p-4">Reputation</th>
                  <th className="p-4">Website Status</th>
                  <th className="p-4">Source & Provenance</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(248,243,240,0.06)] text-[#F8F3F0]">
                {filteredLeads.map((item) => {
                  const lead = item as PhysicalLead;
                  const isSelected = selectedLeadIds.has(lead.id);
                  const isSaved = savedLeadIds.has(lead.id);
                  const hasValidPhone = lead.phone && lead.phoneFormatted !== "Phone unavailable";

                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-[#161616]/50 transition group ${
                        isSelected ? "bg-[#161616]/70" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleSelect(lead.id)}
                          className="text-[#A8A196] hover:text-[#F8F3F0] transition"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#0048BB]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Business Name & Niche */}
                      <td className="p-4">
                        <div className="font-bold text-[#F8F3F0] text-sm group-hover:text-[#0048BB] transition">
                          {lead.businessName}
                        </div>
                        <div className="text-[#A8A196] mt-0.5 inline-flex items-center space-x-1">
                          <span className="px-2 py-0.5 rounded-md bg-[#080808] text-[10px] text-[#A8A196] border border-[rgba(248,243,240,0.08)]">
                            {lead.category || "Local Business"}
                          </span>
                        </div>
                      </td>

                      {/* Contact Channels (Phone, Email, WhatsApp, Socials, Booking) */}
                      <td className="p-4">
                        <div className="space-y-1.5 min-w-[200px]">
                          {/* Phone */}
                          {hasValidPhone ? (
                            <div className="flex items-center justify-between bg-[#080808] px-2 py-1 rounded-lg border border-[rgba(248,243,240,0.08)]">
                              <a
                                href={`tel:${lead.phone}`}
                                className="font-mono text-[#F8F3F0] hover:underline flex items-center space-x-1 text-xs"
                                title="Click to call"
                              >
                                <Phone className="w-3.5 h-3.5 shrink-0" />
                                <span>{lead.phoneFormatted || lead.phone}</span>
                              </a>
                              <button
                                onClick={(e) => handleCopyPhone(lead.phone, e)}
                                className="p-1 rounded text-[#A8A196] hover:text-[#F8F3F0] hover:bg-[#161616] transition"
                                title="Copy phone number"
                              >
                                {copiedPhone === lead.phone ? (
                                  <Check className="w-3 h-3 text-[#5EBA8C]" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[#A8A196]/60 italic font-mono text-[11px]">
                              Phone unavailable
                            </span>
                          )}

                          {/* Enriched Channels Strip */}
                          {(lead.email || lead.whatsapp || lead.bookingUrl || lead.contactPageUrl || (lead.socialProfiles && Object.keys(lead.socialProfiles).length > 0)) && (
                            <div className="flex flex-wrap items-center gap-1 pt-0.5">
                              {/* Email */}
                              {lead.email && (
                                <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-[#141414] text-[#F8F3F0] border border-[rgba(0,72,187,0.3)] text-[10px] font-medium">
                                  <a
                                    href={`mailto:${lead.email}`}
                                    className="hover:text-[#0048BB] flex items-center space-x-1"
                                    title={`Email: ${lead.email}`}
                                  >
                                    <Mail className="w-3 h-3 text-[#0048BB] shrink-0" />
                                    <span className="max-w-[120px] truncate">{lead.email}</span>
                                  </a>
                                  <button
                                    onClick={(e) => handleCopyEmail(lead.email!, e)}
                                    className="text-[#A8A196] hover:text-[#F8F3F0] p-0.5 ml-0.5"
                                    title="Copy email"
                                  >
                                    {copiedEmail === lead.email ? (
                                      <Check className="w-2.5 h-2.5 text-[#5EBA8C]" />
                                    ) : (
                                      <Copy className="w-2.5 h-2.5" />
                                    )}
                                  </button>
                                </div>
                              )}

                              {/* WhatsApp Direct Chat */}
                              {(lead.whatsapp || hasValidPhone) && (
                                <a
                                  href={
                                    lead.whatsapp?.startsWith("http")
                                      ? lead.whatsapp
                                      : `https://wa.me/${(lead.whatsapp || lead.phone).replace(/\D/g, "").replace(/^0/, "254")}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-[#101914] text-[#5EBA8C] hover:bg-[#5EBA8C]/20 border border-[rgba(94,186,140,0.3)] text-[10px] font-medium transition"
                                  title="Open Direct WhatsApp Chat"
                                >
                                  <MessageCircle className="w-3 h-3 text-[#5EBA8C] shrink-0" />
                                  <span>WhatsApp</span>
                                </a>
                              )}

                              {/* Booking URL */}
                              {lead.bookingUrl && (
                                <a
                                  href={lead.bookingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-[#161616] text-[#F8F3F0] hover:text-[#0048BB] border border-[rgba(248,243,240,0.12)] text-[10px] font-medium transition"
                                  title="Book Appointment"
                                >
                                  <Calendar className="w-3 h-3 text-[#0048BB] shrink-0" />
                                  <span>Book</span>
                                </a>
                              )}

                              {/* Contact Page */}
                              {lead.contactPageUrl && (
                                <a
                                  href={lead.contactPageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-[#161616] text-[#A8A196] hover:text-[#F8F3F0] border border-[rgba(248,243,240,0.08)] text-[10px] font-medium transition"
                                  title="Contact Page"
                                >
                                  <Globe className="w-3 h-3 text-[#A8A196] shrink-0" />
                                  <span>Contact Page</span>
                                </a>
                              )}

                              {/* Social Profiles */}
                              {lead.socialProfiles?.facebook && (
                                <a
                                  href={lead.socialProfiles.facebook}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-1.5 py-0.5 rounded bg-[#161616] text-[#A8A196] hover:text-[#F8F3F0] border border-[rgba(248,243,240,0.08)] text-[10px] font-bold transition"
                                  title="Facebook Page"
                                >
                                  fb
                                </a>
                              )}
                              {lead.socialProfiles?.instagram && (
                                <a
                                  href={lead.socialProfiles.instagram}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-1.5 py-0.5 rounded bg-[#161616] text-[#A8A196] hover:text-[#F8F3F0] border border-[rgba(248,243,240,0.08)] text-[10px] font-bold transition"
                                  title="Instagram Profile"
                                >
                                  ig
                                </a>
                              )}
                              {lead.socialProfiles?.linkedin && (
                                <a
                                  href={lead.socialProfiles.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-1.5 py-0.5 rounded bg-[#161616] text-[#A8A196] hover:text-[#F8F3F0] border border-[rgba(248,243,240,0.08)] text-[10px] font-bold transition"
                                  title="LinkedIn Profile"
                                >
                                  in
                                </a>
                              )}
                              {lead.socialProfiles?.twitter && (
                                <a
                                  href={lead.socialProfiles.twitter}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-1.5 py-0.5 rounded bg-[#161616] text-[#A8A196] hover:text-[#F8F3F0] border border-[rgba(248,243,240,0.08)] text-[10px] font-bold transition"
                                  title="X / Twitter"
                                >
                                  𝕏
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Location & Country */}
                      <td className="p-4 max-w-[200px] truncate">
                        <div className="flex items-center space-x-1 text-[#A8A196] truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#A8A196] shrink-0" />
                          <span className="truncate">{lead.address || `${lead.city}, ${lead.country}`}</span>
                        </div>
                      </td>

                      {/* Reputation */}
                      <td className="p-4 whitespace-nowrap">
                        {lead.rating ? (
                          <div className="flex items-center space-x-1">
                            <div className="flex items-center space-x-0.5 text-[#5EBA8C] font-bold">
                              <Star className="w-3.5 h-3.5 fill-[#5EBA8C] text-[#5EBA8C]" />
                              <span>{lead.rating.toFixed(1)}</span>
                            </div>
                            <span className="text-[#A8A196] text-[11px]">
                              ({lead.reviewCount || 0})
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#A8A196]/60 italic">No reviews</span>
                        )}
                      </td>

                      {/* Website Status Flag */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#161616] text-[#5EBA8C] border border-[rgba(248,243,240,0.12)]">
                          <ShieldCheck className="w-3 h-3 text-[#5EBA8C]" />
                          <span>No Website</span>
                        </span>
                      </td>

                      {/* Provider Source & Provenance */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-[#080808] text-[#A8A196] border border-[rgba(248,243,240,0.08)]">
                            {lead.sourceProvider}
                          </span>
                          {lead.sourceUrl && (
                            <a
                              href={lead.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#A8A196] hover:text-[#F8F3F0] p-0.5"
                              title="View original source record"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1.5">
                          {/* Pitch script button */}
                          <button
                            onClick={() => setPitchLead(lead)}
                            className="px-2.5 py-1 rounded-lg bg-[#161616] hover:bg-[#161616]/80 text-[#F8F3F0] border border-[rgba(248,243,240,0.2)] font-medium transition flex items-center space-x-1"
                            title="Generate cold call pitch script"
                          >
                            <MessageSquareQuote className="w-3.5 h-3.5 text-[#0048BB]" />
                            <span>Pitch</span>
                          </button>

                          {/* Notes */}
                          <button
                            onClick={() => setNotesLead(lead)}
                            className="p-1.5 rounded-lg bg-[#080808] hover:bg-[#161616] text-[#A8A196] hover:text-[#F8F3F0] border border-[rgba(248,243,240,0.12)] transition"
                            title="Add notes"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* Save to pipeline */}
                          <button
                            onClick={() => onSaveLead(lead)}
                            disabled={isSaved}
                            className={`px-3 py-1 rounded-lg font-medium transition flex items-center space-x-1 ${
                              isSaved
                                ? "bg-[#161616] text-[#5EBA8C] border border-[rgba(248,243,240,0.12)] cursor-default"
                                : "bg-[#0048BB] hover:bg-[#00388A] text-white shadow-sm"
                            }`}
                          >
                            {isSaved ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#5EBA8C]" />
                                <span>Saved</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Save</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ================= ONLINE JOBS CARD GRID ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((item) => {
            const job = item as OnlineJobLead;
            const isSaved = savedLeadIds.has(job.id);
            return (
              <JobCard
                key={job.id}
                job={job}
                isSaved={isSaved}
                onSave={onSaveLead}
                onOpenProposal={setProposalJob}
                onOpenNotes={setNotesLead}
              />
            );
          })}
        </div>
      )}

      {/* Modals */}
      {pitchLead && <PitchScriptModal lead={pitchLead} onClose={() => setPitchLead(null)} />}
      {proposalJob && <JobProposalModal job={proposalJob} onClose={() => setProposalJob(null)} />}
      {notesLead && (
        <LeadNotesModal
          lead={notesLead as any}
          onSave={async (notes, estimatedValue) => {
            notesLead.notes = notes;
            notesLead.estimatedValue = estimatedValue;
            onSaveLead(notesLead);
          }}
          onClose={() => setNotesLead(null)}
        />
      )}
    </div>
  );
}
