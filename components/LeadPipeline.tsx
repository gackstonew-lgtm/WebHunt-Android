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
  Trash2, 
  FileText, 
  MessageSquareQuote, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  PhoneOutgoing, 
  Award, 
  Archive,
  Store,
  Terminal,
  ExternalLink,
  Mail,
  MessageCircle,
  Globe,
  Calendar,
  Layers,
  CheckSquare,
  ChevronRight
} from "lucide-react";
import { LeadItem, OnlineJobLead, PhysicalLead, PipelineStatus } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import PitchScriptModal from "./PitchScriptModal";
import JobProposalModal from "./JobProposalModal";
import LeadNotesModal from "./LeadNotesModal";
import ApplicationTrackerDrawer from "./pipeline/ApplicationTrackerDrawer";
import FollowUpQueue from "./pipeline/FollowUpQueue";
import { exportLeadsToCsv } from "@/lib/export";
import { PipelineStats } from "@/lib/pipeline-store";
import { generateWhatsAppChatLink, createQuickWhatsAppLeadMessage } from "@/lib/outreach/whatsapp";

interface LeadPipelineProps {
  leads: LeadItem[];
  stats: PipelineStats;
  onUpdateStatus: (leadId: string, status: PipelineStatus) => void;
  onUpdateNotes: (leadId: string, notes: string, estimatedValue?: number) => void;
  onDeleteLead: (leadId: string) => void;
  onClearPipeline?: () => void;
}

const SALES_STAGES = [
  { key: "ALL", label: "All Sales Leads", icon: TrendingUp },
  { key: "NEW", label: "Inbox (New)", icon: Clock },
  { key: "CONTACTED", label: "Contacted", icon: PhoneOutgoing },
  { key: "INTERESTED", label: "Pitch / Proposal Sent", icon: Sparkles },
  { key: "CLOSED", label: "Closed / Won", icon: Award },
  { key: "NOT_INTERESTED", label: "Archived", icon: Archive },
];

const JOB_STAGES = [
  { key: "ALL", label: "All Job Apps", icon: TrendingUp },
  { key: "SAVED", label: "Saved / Researching", icon: Clock },
  { key: "PREPARING", label: "Preparing App", icon: FileText },
  { key: "APPLIED", label: "Applied / Submitted", icon: PhoneOutgoing },
  { key: "INTERVIEW", label: "Interviewing", icon: Sparkles },
  { key: "OFFER", label: "Offer Received", icon: Award },
  { key: "REJECTED", label: "Rejected / Withdrawn", icon: Archive },
];

export default function LeadPipeline({
  leads,
  stats,
  onUpdateStatus,
  onUpdateNotes,
  onDeleteLead,
  onClearPipeline,
}: LeadPipelineProps) {
  const [pipelineMode, setPipelineMode] = useState<"sales" | "jobs" | "all">("sales");
  const [currentTab, setCurrentTab] = useState<string>("ALL");
  const [pitchLead, setPitchLead] = useState<PhysicalLead | null>(null);
  const [proposalJob, setProposalJob] = useState<OnlineJobLead | null>(null);
  const [trackerJob, setTrackerJob] = useState<OnlineJobLead | null>(null);
  const [notesLead, setNotesLead] = useState<LeadItem | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [currencyMode, setCurrencyMode] = useState<"USD" | "KES">("USD");

  const activeStages = pipelineMode === "jobs" ? JOB_STAGES : SALES_STAGES;

  const filteredLeads = leads.filter((l) => {
    if (pipelineMode === "sales" && l.type !== "physical") return false;
    if (pipelineMode === "jobs" && l.type !== "online") return false;

    if (currentTab !== "ALL") {
      if (l.status !== currentTab) return false;
    }
    return true;
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

  const handleQuickWhatsApp = (lead: PhysicalLead, e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = createQuickWhatsAppLeadMessage({
      businessName: lead.businessName,
      category: lead.category,
      city: lead.city,
      senderName: "Web Developer",
    });
    const wa = generateWhatsAppChatLink(lead.whatsapp || lead.phone, msg, lead.country || "KE");
    if (wa.isValid) {
      window.open(wa.url, "_blank");
    }
  };

  const handleExport = () => {
    exportLeadsToCsv(filteredLeads, `webhunt-pipeline-${pipelineMode}-${currentTab.toLowerCase()}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Pipeline Volume */}
        <div className="p-4 rounded-2xl bg-[#0D0D0D] border border-[rgba(248,243,240,0.12)] shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#A8A196] font-medium">Pipeline Volume</span>
            <div className="p-1.5 rounded-lg bg-[#161616] text-[#0048BB]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-[#F8F3F0]">{leads.length}</span>
            <span className="text-xs text-[#A8A196]">
              ({stats.physicalCount} local, {stats.onlineCount} remote)
            </span>
          </div>
        </div>

        {/* Outreach Activity */}
        <div className="p-4 rounded-2xl bg-[#0D0D0D] border border-[rgba(248,243,240,0.12)] shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#A8A196] font-medium">Outreach Activity</span>
            <div className="p-1.5 rounded-lg bg-[#161616] text-[#5EBA8C]">
              <PhoneOutgoing className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-[#5EBA8C]">
              {stats.contactedLeads + stats.interestedLeads + stats.closedLeads}
            </span>
            <span className="text-xs text-[#A8A196]">contacted</span>
          </div>
        </div>

        {/* Active Pitches / Apps */}
        <div className="p-4 rounded-2xl bg-[#0D0D0D] border border-[rgba(248,243,240,0.12)] shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#A8A196] font-medium">Active In Progress</span>
            <div className="p-1.5 rounded-lg bg-[#161616] text-[#0048BB]">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-[#F8F3F0]">{stats.interestedLeads}</span>
            <span className="text-xs text-[#A8A196]">active deals/apps</span>
          </div>
        </div>

        {/* Pipeline Value */}
        <div className="p-4 rounded-2xl bg-[#0D0D0D] border border-[rgba(248,243,240,0.12)] shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#A8A196] font-medium">Est. Pipeline Value</span>
            <div className="p-1.5 rounded-lg bg-[#161616] text-[#5EBA8C]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-[#5EBA8C]">
              {formatCurrency(stats.totalPipelineValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Follow-up Reminders Task Queue */}
      <FollowUpQueue />

      {/* Primary Pipeline Switcher: Sales vs Jobs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-[#0D0D0D] border border-[rgba(248,243,240,0.12)] rounded-2xl">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => {
              setPipelineMode("sales");
              setCurrentTab("ALL");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              pipelineMode === "sales"
                ? "bg-[#161616] text-[#F8F3F0] border border-[rgba(0,72,187,0.4)] shadow-md"
                : "text-[#A8A196] hover:text-[#F8F3F0] hover:bg-[#161616]/60"
            }`}
          >
            <Store className="w-4 h-4 text-[#0048BB]" />
            <span>Sales Pipeline (Local Businesses)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#080808] text-[#A8A196]">
              {stats.physicalCount}
            </span>
          </button>

          <button
            onClick={() => {
              setPipelineMode("jobs");
              setCurrentTab("ALL");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              pipelineMode === "jobs"
                ? "bg-[#161616] text-[#F8F3F0] border border-[rgba(0,72,187,0.4)] shadow-md"
                : "text-[#A8A196] hover:text-[#F8F3F0] hover:bg-[#161616]/60"
            }`}
          >
            <Terminal className="w-4 h-4 text-[#0048BB]" />
            <span>Job Applications (Remote Gigs)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#080808] text-[#A8A196]">
              {stats.onlineCount}
            </span>
          </button>
        </div>

        <div className="flex items-center space-x-2 pr-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#161616] hover:bg-[#161616]/80 text-[#F8F3F0] border border-[rgba(248,243,240,0.12)] text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5 text-[#A8A196]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Stage Tabs Strip */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[rgba(248,243,240,0.12)] pb-4">
        {activeStages.map((stage) => {
          const Icon = stage.icon;
          const count =
            stage.key === "ALL"
              ? (pipelineMode === "sales" ? stats.physicalCount : stats.onlineCount)
              : leads.filter((l) => {
                  if (pipelineMode === "sales" && l.type !== "physical") return false;
                  if (pipelineMode === "jobs" && l.type !== "online") return false;
                  return l.status === stage.key;
                }).length;

          const isActive = currentTab === stage.key;

          return (
            <button
              key={stage.key}
              onClick={() => setCurrentTab(stage.key)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? "bg-[#161616] text-[#F8F3F0] border border-[rgba(0,72,187,0.4)] shadow-sm"
                  : "text-[#A8A196] hover:text-[#F8F3F0] hover:bg-[#161616]/60"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#0048BB]" : "text-[#A8A196]"}`} />
              <span>{stage.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                isActive ? "bg-[#0048BB] text-white" : "bg-[#080808] text-[#A8A196]"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cards Grid */}
      {filteredLeads.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0D0D0D] border border-[rgba(248,243,240,0.12)] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#080808] flex items-center justify-center text-[#A8A196] mx-auto border border-[rgba(248,243,240,0.08)]">
            <Clock className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-[#F8F3F0]">No leads in this stage</h4>
          <p className="text-xs text-[#A8A196] max-w-sm mx-auto">
            {pipelineMode === "sales"
              ? "Discover local businesses without websites from the Lead Finder Radar on the home page."
              : "Discover remote software opportunities and track your job applications here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => {
            const isPhysical = lead.type === "physical";
            const physLead = isPhysical ? (lead as PhysicalLead) : null;
            const jobLead = !isPhysical ? (lead as OnlineJobLead) : null;

            return (
              <div
                key={lead.id}
                className="bg-[#0D0D0D] border border-[rgba(248,243,240,0.12)] hover:border-[rgba(248,243,240,0.25)] rounded-2xl p-5 shadow-xl transition flex flex-col justify-between space-y-4 relative group"
              >
                <div>
                  {/* Top Channel Badge & Stage Selector */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded flex items-center space-x-1 bg-[#161616] text-[#A8A196] border border-[rgba(248,243,240,0.12)]">
                        {isPhysical ? <Store className="w-3 h-3 text-[#0048BB]" /> : <Terminal className="w-3 h-3 text-[#0048BB]" />}
                        <span>{isPhysical ? physLead?.country : (jobLead?.source || "Remote Job")}</span>
                      </span>
                    </div>

                    {/* Status Selector Dropdown */}
                    <select
                      value={lead.status}
                      onChange={(e) => onUpdateStatus(lead.id, e.target.value as PipelineStatus)}
                      className="bg-[#080808] border border-[rgba(248,243,240,0.12)] text-xs text-[#F8F3F0] px-2 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0048BB] cursor-pointer"
                    >
                      {isPhysical ? (
                        <>
                          <option value="NEW" className="bg-[#0D0D0D]">📥 New Lead</option>
                          <option value="CONTACTED" className="bg-[#0D0D0D]">📞 Contacted</option>
                          <option value="INTERESTED" className="bg-[#0D0D0D]">✨ Pitch / Proposal</option>
                          <option value="CLOSED" className="bg-[#0D0D0D]">🏆 Closed / Won</option>
                          <option value="NOT_INTERESTED" className="bg-[#0D0D0D]">⛔ Archived</option>
                        </>
                      ) : (
                        <>
                          <option value="SAVED" className="bg-[#0D0D0D]">📁 Saved</option>
                          <option value="PREPARING" className="bg-[#0D0D0D]">📝 Preparing App</option>
                          <option value="APPLIED" className="bg-[#0D0D0D]">🚀 Applied</option>
                          <option value="INTERVIEW" className="bg-[#0D0D0D]">🎙️ Interview</option>
                          <option value="OFFER" className="bg-[#0D0D0D]">🏆 Offer</option>
                          <option value="REJECTED" className="bg-[#0D0D0D]">⛔ Rejected</option>
                          <option value="WITHDRAWN" className="bg-[#0D0D0D]">↩️ Withdrawn</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Title & Subtitle */}
                  <h4 className="font-bold text-[#F8F3F0] text-base leading-snug mt-2">
                    {isPhysical ? physLead?.businessName : jobLead?.title}
                  </h4>
                  <div className="text-[11px] text-[#A8A196] mt-0.5">
                    {isPhysical ? physLead?.category : `${jobLead?.company} • ${jobLead?.location}`}
                  </div>

                  {/* Physical Phone or Job Details */}
                  {isPhysical && physLead && (
                    <div className="mt-3 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between bg-[#080808] p-2.5 rounded-xl border border-[rgba(248,243,240,0.12)]">
                        <a
                          href={`tel:${physLead.phone}`}
                          className="font-mono text-[#F8F3F0] hover:underline flex items-center space-x-1.5"
                        >
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>{physLead.phoneFormatted || physLead.phone}</span>
                        </a>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => handleQuickWhatsApp(physLead, e)}
                            className="p-1 rounded text-[#5EBA8C] hover:bg-[#5EBA8C]/10 transition"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleCopyPhone(physLead.phone, e)}
                            className="p-1 rounded text-[#A8A196] hover:text-[#F8F3F0]"
                            title="Copy phone"
                          >
                            {copiedPhone === physLead.phone ? (
                              <Check className="w-3 h-3 text-[#5EBA8C]" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Enriched Contact Badges on Card */}
                      {(physLead.email || physLead.whatsapp || physLead.bookingUrl || physLead.contactPageUrl || (physLead.socialProfiles && Object.keys(physLead.socialProfiles).length > 0)) && (
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          {physLead.email && (
                            <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-[#161616] text-[#F8F3F0] border border-[rgba(0,72,187,0.3)] text-[10px]">
                              <a
                                href={`mailto:${physLead.email}`}
                                className="hover:text-[#0048BB] flex items-center space-x-1"
                                title={`Email: ${physLead.email}`}
                              >
                                <Mail className="w-3 h-3 text-[#0048BB]" />
                                <span className="max-w-[110px] truncate">{physLead.email}</span>
                              </a>
                              <button
                                onClick={(e) => handleCopyEmail(physLead.email!, e)}
                                className="text-[#A8A196] hover:text-[#F8F3F0] p-0.5 ml-0.5"
                                title="Copy email"
                              >
                                {copiedEmail === physLead.email ? <Check className="w-2.5 h-2.5 text-[#5EBA8C]" /> : <Copy className="w-2.5 h-2.5" />}
                              </button>
                            </div>
                          )}

                          {physLead.whatsapp && (
                            <a
                              href={physLead.whatsapp.startsWith("http") ? physLead.whatsapp : `https://wa.me/${physLead.whatsapp.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-[#101914] text-[#5EBA8C] hover:bg-[#5EBA8C]/20 border border-[rgba(94,186,140,0.3)] text-[10px] font-medium"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3 text-[#5EBA8C]" />
                              <span>WhatsApp</span>
                            </a>
                          )}

                          {physLead.bookingUrl && (
                            <a
                              href={physLead.bookingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-[#161616] text-[#F8F3F0] hover:text-[#0048BB] border border-[rgba(248,243,240,0.12)] text-[10px]"
                              title="Book / Schedule"
                            >
                              <Calendar className="w-3 h-3 text-[#0048BB]" />
                              <span>Book</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {!isPhysical && jobLead && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs text-[#A8A196]">
                        <span className="text-[#5EBA8C] font-semibold">{jobLead.salary || "Competitive"}</span>
                        <span>{formatDate(jobLead.postedDate)}</span>
                      </div>
                      {jobLead.tags && jobLead.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {jobLead.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded bg-[#080808] text-[10px] text-[#A8A196] border border-[rgba(248,243,240,0.08)]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Deal Value */}
                  <div className="mt-3 flex items-center justify-between text-xs text-[#A8A196]">
                    <span className="font-semibold text-[#F8F3F0]">
                      Est. Value: {formatCurrency(lead.estimatedValue || (isPhysical ? 1500 : 3500))}
                    </span>
                    <span className="text-[11px] text-[#A8A196]">
                      {formatDate(lead.createdAt)}
                    </span>
                  </div>

                  {/* Notes Preview */}
                  {lead.notes && (
                    <div className="mt-3 p-2.5 rounded-xl bg-[#080808] border border-[rgba(248,243,240,0.12)] text-[11px] text-[#A8A196] italic">
                      "{lead.notes}"
                    </div>
                  )}
                </div>

                {/* Footer Action Strip */}
                <div className="pt-3 border-t border-[rgba(248,243,240,0.12)] flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5">
                    {isPhysical && physLead && (
                      <button
                        onClick={() => setPitchLead(physLead)}
                        className="px-2.5 py-1 rounded-lg bg-[#161616] hover:bg-[#161616]/80 text-[#F8F3F0] border border-[rgba(248,243,240,0.2)] text-xs font-medium flex items-center space-x-1 transition"
                      >
                        <MessageSquareQuote className="w-3 h-3 text-[#0048BB]" />
                        <span>Pitch</span>
                      </button>
                    )}

                    {!isPhysical && jobLead && (
                      <>
                        <button
                          onClick={() => setProposalJob(jobLead)}
                          className="px-2.5 py-1 rounded-lg bg-[#161616] hover:bg-[#161616]/80 text-[#F8F3F0] border border-[rgba(248,243,240,0.2)] text-xs font-medium flex items-center space-x-1 transition"
                        >
                          <Sparkles className="w-3 h-3 text-[#0048BB]" />
                          <span>Proposal</span>
                        </button>
                        <button
                          onClick={() => setTrackerJob(jobLead)}
                          className="px-2.5 py-1 rounded-lg bg-[#080808] hover:bg-[#161616] text-[#A8A196] hover:text-[#F8F3F0] border border-[rgba(248,243,240,0.12)] text-xs font-medium flex items-center space-x-1 transition"
                          title="Track application checklist & notes"
                        >
                          <CheckSquare className="w-3 h-3 text-[#5EBA8C]" />
                          <span>Track App</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => setNotesLead(lead)}
                      className="px-2.5 py-1 rounded-lg bg-[#080808] hover:bg-[#161616] text-[#A8A196] hover:text-[#F8F3F0] border border-[rgba(248,243,240,0.12)] text-xs font-medium flex items-center space-x-1 transition"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Notes</span>
                    </button>
                  </div>

                  <button
                    onClick={() => onDeleteLead(lead.id)}
                    className="p-1.5 rounded-lg text-[#A8A196] hover:text-red-400 hover:bg-red-500/10 transition"
                    title="Delete lead"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals & Drawers */}
      {pitchLead && <PitchScriptModal lead={pitchLead} onClose={() => setPitchLead(null)} />}
      {proposalJob && <JobProposalModal job={proposalJob} onClose={() => setProposalJob(null)} />}
      {trackerJob && (
        <ApplicationTrackerDrawer
          job={trackerJob}
          onClose={() => setTrackerJob(null)}
          onStatusChange={(newStatus) => {
            onUpdateStatus(trackerJob.id, newStatus);
            trackerJob.status = newStatus;
          }}
        />
      )}
      {notesLead && (
        <LeadNotesModal
          lead={notesLead}
          onSave={(notes, estimatedValue) => {
            onUpdateNotes(notesLead.id, notes, estimatedValue);
            setNotesLead(null);
          }}
          onClose={() => setNotesLead(null)}
        />
      )}
    </div>
  );
}

