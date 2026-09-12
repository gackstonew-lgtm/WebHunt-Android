"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Briefcase, 
  ExternalLink, 
  CheckSquare, 
  Square, 
  Copy, 
  Check, 
  Calendar, 
  Mail, 
  User, 
  Clock, 
  Sparkles, 
  Save, 
  FileText,
  AlertCircle
} from "lucide-react";
import { OnlineJobLead, PipelineStatus } from "@/lib/types";
import { ApplicationData, createOrUpdateApplicationAction, fetchApplicationDetailsAction } from "@/app/actions/applications";
import { checkApplicantEligibility } from "@/lib/eligibility/regional-filter";
import { formatDate } from "@/lib/utils";

interface ApplicationTrackerDrawerProps {
  job: OnlineJobLead;
  onClose: () => void;
  onStatusChange: (status: PipelineStatus) => void;
}

export default function ApplicationTrackerDrawer({
  job,
  onClose,
  onStatusChange,
}: ApplicationTrackerDrawerProps) {
  const [appData, setAppData] = useState<ApplicationData>({
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    jobUrl: job.url,
    applicationMethod: "external_form",
    status: (job.status as any) || "SAVED",
    checklist: {
      tailoredResumeReady: false,
      coverLetterPrepared: false,
      portfolioLinksVerified: true,
      timezoneOverlapChecked: true,
      ratesAligned: true,
    },
    notes: job.notes || "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedCover, setCopiedCover] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const eligibility = checkApplicantEligibility(job);

  useEffect(() => {
    async function load() {
      const res = await fetchApplicationDetailsAction(job.id);
      if (res.success && res.data) {
        setAppData({
          ...res.data,
          checklist: res.data.checklist || {
            tailoredResumeReady: false,
            coverLetterPrepared: false,
            portfolioLinksVerified: true,
            timezoneOverlapChecked: true,
            ratesAligned: true,
          },
        });
      }
      setIsLoading(false);
    }
    load();
  }, [job.id]);

  const handleSave = async (updated?: Partial<ApplicationData>) => {
    setIsSaving(true);
    const toSave = { ...appData, ...updated };
    setAppData(toSave);
    const res = await createOrUpdateApplicationAction(toSave);
    setIsSaving(false);
    if (res.success) {
      setSaveSuccess(true);
      if (toSave.status !== job.status) {
        onStatusChange(toSave.status as PipelineStatus);
      }
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const toggleChecklistItem = (key: keyof NonNullable<ApplicationData["checklist"]>) => {
    const current = appData.checklist || {
      tailoredResumeReady: false,
      coverLetterPrepared: false,
      portfolioLinksVerified: false,
      timezoneOverlapChecked: false,
      ratesAligned: false,
    };
    const next = {
      ...current,
      [key]: !current[key],
    };
    setAppData({ ...appData, checklist: next });
    handleSave({ checklist: next });
  };

  const copyNotesOrPitch = () => {
    if (appData.coverLetterText || job.descriptionSnippet) {
      navigator.clipboard.writeText(appData.coverLetterText || job.descriptionSnippet || "");
      setCopiedCover(true);
      setTimeout(() => setCopiedCover(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0D0D0D] border-l border-[rgba(248,243,240,0.2)] text-[#F8F3F0] h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(248,243,240,0.12)] bg-[#080808]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#0048BB] text-white shadow-md shadow-[#0048BB]/20">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#F8F3F0] text-base truncate max-w-xs sm:max-w-md">
                {job.title}
              </h3>
              <p className="text-xs text-[#A8A196]">
                Application Tracking for <span className="text-[#F8F3F0] font-semibold">{job.company}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#A8A196] hover:text-[#F8F3F0] hover:bg-[#161616] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#F8F3F0] flex-1">
          {/* Quick Apply Action Strip */}
          <div className="p-4 rounded-2xl bg-[#080808] border border-[rgba(248,243,240,0.12)] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-[#A8A196] uppercase tracking-wider">
                Application Pipeline Stage
              </span>
              <select
                value={appData.status}
                onChange={(e) => {
                  const newStatus = e.target.value as any;
                  setAppData({ ...appData, status: newStatus });
                  handleSave({ status: newStatus });
                }}
                className="bg-[#161616] border border-[rgba(0,72,187,0.4)] text-xs text-[#F8F3F0] px-3 py-1.5 rounded-xl font-semibold focus:outline-none cursor-pointer"
              >
                <option value="SAVED">📁 Saved / Researching</option>
                <option value="PREPARING">📝 Preparing Application</option>
                <option value="APPLIED">🚀 Applied / Submitted</option>
                <option value="INTERVIEW">🎙️ Interview Scheduled</option>
                <option value="OFFER">🏆 Offer Received</option>
                <option value="REJECTED">⛔ Rejected</option>
                <option value="WITHDRAWN">↩️ Withdrawn</option>
              </select>
            </div>

            {/* Direct Official Apply Link */}
            <div className="pt-2 border-t border-[rgba(248,243,240,0.08)] flex items-center justify-between">
              <span className="text-[11px] text-[#A8A196]">Original Listing on {job.source}</span>
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-[#0048BB] hover:bg-[#00388A] text-white font-semibold text-xs shadow-md shadow-[#0048BB]/20 flex items-center space-x-1.5 transition"
              >
                <span>Open Application Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Regional Eligibility & Timezone Overlap Badge */}
          <div className="p-3.5 rounded-2xl bg-[#101914] border border-[rgba(94,186,140,0.3)] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#5EBA8C] flex items-center space-x-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{eligibility.badgeText}</span>
              </span>
              <span className="text-[10px] text-[#A8A196] bg-[#080808] px-2 py-0.5 rounded-md">
                ~{eligibility.timezoneOverlapHours}h EAT Overlap
              </span>
            </div>
            <p className="text-[11px] text-[#A8A196] leading-relaxed">
              {eligibility.reasons[0] || "General worldwide remote role"}
            </p>
          </div>

          {/* Document Preparation Checklist */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#0048BB] uppercase tracking-wider flex items-center space-x-1.5">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Document Preparation Checklist</span>
            </h4>

            <div className="space-y-2 bg-[#080808] p-3.5 rounded-2xl border border-[rgba(248,243,240,0.12)]">
              {[
                { key: "tailoredResumeReady", label: "Tailored CV / Resume highlighted for this role" },
                { key: "coverLetterPrepared", label: "Proposal / Cover Letter generated & personalized" },
                { key: "portfolioLinksVerified", label: "Live portfolio & GitHub repository links verified" },
                { key: "timezoneOverlapChecked", label: "Timezone working hours aligned (EAT / UTC+3)" },
                { key: "ratesAligned", label: "Compensation / Salary expectations documented" },
              ].map((item) => {
                const isChecked = Boolean(appData.checklist?.[item.key as keyof typeof appData.checklist]);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleChecklistItem(item.key as any)}
                    className="w-full flex items-center space-x-2.5 text-left p-1.5 rounded-xl hover:bg-[#161616] transition text-[11px]"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-[#5EBA8C] shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-[#A8A196] shrink-0" />
                    )}
                    <span className={isChecked ? "text-[#F8F3F0] font-medium" : "text-[#A8A196]"}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recruiter & Follow-up Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#0048BB] uppercase tracking-wider flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Recruiter Contact & Follow-up</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#080808] p-3.5 rounded-2xl border border-[rgba(248,243,240,0.12)]">
              <div>
                <label className="block text-[10px] font-medium text-[#A8A196] mb-1">Recruiter / Hiring Contact</label>
                <input
                  type="text"
                  value={appData.recruiterName || ""}
                  onChange={(e) => setAppData({ ...appData, recruiterName: e.target.value })}
                  placeholder="e.g. Sarah Jenkins (Talent Partner)"
                  className="w-full px-3 py-1.5 rounded-xl bg-[#161616] border border-[rgba(248,243,240,0.12)] text-xs text-[#F8F3F0]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-[#A8A196] mb-1">Recruiter Email</label>
                <input
                  type="email"
                  value={appData.recruiterEmail || ""}
                  onChange={(e) => setAppData({ ...appData, recruiterEmail: e.target.value })}
                  placeholder="e.g. jobs@company.com"
                  className="w-full px-3 py-1.5 rounded-xl bg-[#161616] border border-[rgba(248,243,240,0.12)] text-xs text-[#F8F3F0]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-[#A8A196] mb-1">Target Follow-up Date</label>
                <input
                  type="date"
                  value={
                    appData.followUpDate
                      ? new Date(appData.followUpDate).toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => setAppData({ ...appData, followUpDate: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#161616] border border-[rgba(248,243,240,0.12)] text-xs text-[#F8F3F0]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-[#A8A196] mb-1">Salary / Rate Offer</label>
                <input
                  type="text"
                  value={appData.salaryOffer || ""}
                  onChange={(e) => setAppData({ ...appData, salaryOffer: e.target.value })}
                  placeholder="e.g. $80,000 / yr"
                  className="w-full px-3 py-1.5 rounded-xl bg-[#161616] border border-[rgba(248,243,240,0.12)] text-xs text-[#F8F3F0]"
                />
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold text-[#A8A196] uppercase tracking-wider">
              Application Notes & Interview Prep
            </label>
            <textarea
              rows={3}
              value={appData.notes || ""}
              onChange={(e) => setAppData({ ...appData, notes: e.target.value })}
              placeholder="Add key talking points, interviewer feedback, technical test notes..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#080808] border border-[rgba(248,243,240,0.12)] focus:outline-none focus:ring-1 focus:ring-[#0048BB] text-xs text-[#F8F3F0] leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[rgba(248,243,240,0.12)] bg-[#080808] flex items-center justify-between">
          <div className="text-xs text-[#A8A196]">
            {saveSuccess && (
              <span className="text-[#5EBA8C] flex items-center space-x-1 font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>Application saved!</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#161616] hover:bg-[#161616]/80 text-[#F8F3F0] text-xs font-medium border border-[rgba(248,243,240,0.12)] transition"
            >
              Close
            </button>
            <button
              onClick={() => handleSave()}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-[#0048BB] hover:bg-[#00388A] text-white font-semibold text-xs shadow-md shadow-[#0048BB]/20 flex items-center space-x-1.5 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
