"use client";

import React from "react";
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  ExternalLink, 
  Sparkles, 
  Plus, 
  Check, 
  Globe,
  Clock
} from "lucide-react";
import { OnlineJobLead } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { checkApplicantEligibility } from "@/lib/eligibility/regional-filter";

interface JobCardProps {
  job: OnlineJobLead;
  isSaved: boolean;
  onSave: (job: OnlineJobLead) => void;
  onOpenProposal: (job: OnlineJobLead) => void;
  onOpenNotes?: (job: OnlineJobLead) => void;
}

export default function JobCard({
  job,
  isSaved,
  onSave,
  onOpenProposal,
  onOpenNotes,
}: JobCardProps) {
  const eligibility = checkApplicantEligibility(job);

  return (
    <div className="bg-[#0D0D0D] border border-[rgba(248,243,240,0.12)] hover:border-[rgba(248,243,240,0.25)] rounded-2xl p-5 shadow-xl transition flex flex-col justify-between space-y-4 group">
      <div>
        {/* Top Header: Company + Source Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            {job.companyLogo ? (
              <img
                src={job.companyLogo}
                alt={job.company}
                className="w-9 h-9 rounded-xl bg-[#080808] border border-[rgba(248,243,240,0.12)] object-contain p-1 shrink-0"
                onError={(e) => {
                  // Fallback on error
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-[#080808] border border-[rgba(248,243,240,0.12)] flex items-center justify-center text-[#F8F3F0] font-bold text-xs shrink-0">
                {job.company.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <span className="text-xs font-semibold text-[#F8F3F0]">
                {job.company}
              </span>
              <div className="text-[10px] text-[#A8A196] flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-[#0048BB]" />
                <span>{job.location}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="uppercase text-[9px] font-bold px-2 py-0.5 rounded bg-[#161616] text-[#A8A196] border border-[rgba(248,243,240,0.12)]">
              {job.source}
            </span>
            <span
              className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                eligibility.isEligibleKenya
                  ? "bg-[#101914] text-[#5EBA8C] border-[rgba(94,186,140,0.3)]"
                  : "bg-[#10192A] text-[#0048BB] border-[rgba(0,72,187,0.3)]"
              }`}
              title={eligibility.reasons.join(". ")}
            >
              {eligibility.badgeText}
            </span>
          </div>
        </div>

        {/* Job Title */}
        <h4 className="font-bold text-[#F8F3F0] text-base mt-3 group-hover:text-[#0048BB] transition leading-snug">
          {job.title}
        </h4>

        {/* Snippet */}
        {job.descriptionSnippet && (
          <p className="text-xs text-[#A8A196] mt-2 line-clamp-3 leading-relaxed">
            {job.descriptionSnippet}
          </p>
        )}

        {/* Tags */}
        {job.tags && job.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {job.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md bg-[#080808] text-[10px] text-[#A8A196] border border-[rgba(248,243,240,0.08)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info & Actions */}
      <div className="pt-3 border-t border-[rgba(248,243,240,0.12)] space-y-3">
        <div className="flex items-center justify-between text-xs text-[#A8A196]">
          <span className="text-[#5EBA8C] font-semibold">{job.salary || "Competitive"}</span>
          <div className="flex items-center space-x-1 text-[11px] text-[#A8A196]">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(job.postedDate)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => onOpenProposal(job)}
            className="px-3 py-1.5 rounded-xl bg-[#161616] hover:bg-[#161616]/80 text-[#F8F3F0] border border-[rgba(248,243,240,0.2)] text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0048BB]" />
            <span>Proposal</span>
          </button>

          <div className="flex items-center space-x-1.5">
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-xl bg-[#080808] hover:bg-[#161616] text-[#A8A196] hover:text-[#F8F3F0] border border-[rgba(248,243,240,0.12)] text-xs font-medium transition"
              title="Apply on official platform"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={() => onSave(job)}
              disabled={isSaved}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition ${
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
        </div>
      </div>
    </div>
  );
}
