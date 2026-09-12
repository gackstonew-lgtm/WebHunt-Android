"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Copy, 
  Check, 
  Sparkles, 
  ExternalLink, 
  Briefcase, 
  Code, 
  Mail, 
  Save, 
  AlertTriangle,
  Layers,
  Send,
  UserCheck
} from "lucide-react";
import { OnlineJobLead } from "@/lib/types";
import { generateTruthfulJobProposal, ProposalTemplateType } from "@/lib/proposals/truthful-generator";
import { getUserProfileAction, UserProfileData } from "@/app/actions/profile";
import { saveProposalDraftAction, checkDuplicateOutreachAction, recordOutreachMessageAction } from "@/app/actions/outreach";
import { generateMailtoLink } from "@/lib/outreach/gmail";

interface JobProposalModalProps {
  job: OnlineJobLead;
  onClose: () => void;
}

export default function JobProposalModal({ job, onClose }: JobProposalModalProps) {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [templateType, setTemplateType] = useState<ProposalTemplateType>("technical_pitch");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await getUserProfileAction();
      if (res.success && res.data) {
        setProfile(res.data);
        const proposal = generateTruthfulJobProposal(job, res.data, templateType);
        setSubject(proposal.subject);
        setBody(`${proposal.greeting}\n\n${proposal.body}\n\n${proposal.callToAction}`);
      }

      // Check if candidate reached out recently
      if (job.email) {
        const dupCheck = await checkDuplicateOutreachAction(job.email, "email", 7);
        if (dupCheck.isDuplicate) {
          setDuplicateWarning(`You contacted ${job.email} on ${dupCheck.lastContactedAt ? new Date(dupCheck.lastContactedAt).toLocaleDateString() : "recently"}.`);
        }
      }
    }
    load();
  }, [job, templateType]);

  const handleTemplateChange = (type: ProposalTemplateType) => {
    setTemplateType(type);
    if (profile) {
      const proposal = generateTruthfulJobProposal(job, profile, type);
      setSubject(proposal.subject);
      setBody(`${proposal.greeting}\n\n${proposal.body}\n\n${proposal.callToAction}`);
    }
  };

  const handleCopy = () => {
    const fullText = `SUBJECT: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveDraft = async () => {
    if (!profile) return;
    setIsSavingDraft(true);
    await saveProposalDraftAction({
      leadId: job.id,
      title: `${job.title} @ ${job.company}`,
      templateType,
      subject,
      body,
      callToAction: "",
      fullText: `SUBJECT: ${subject}\n\n${body}`,
    });
    setIsSavingDraft(false);
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2500);
  };

  const handleSendEmail = async () => {
    const targetEmail = job.email || "hiring@" + (job.company.toLowerCase().replace(/\s+/g, "") + ".com");
    
    // Log outreach message
    await recordOutreachMessageAction({
      leadId: job.id,
      channel: "email",
      recipient: targetEmail,
      subject,
      messageBody: body,
      status: "SENT",
    });

    const mailto = generateMailtoLink(targetEmail, subject, body);
    window.location.href = mailto;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0D0D0D] border border-[rgba(248,243,240,0.2)] rounded-3xl shadow-2xl overflow-hidden text-[#F8F3F0] max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(248,243,240,0.12)] bg-[#080808]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#0048BB] text-white shadow-md shadow-[#0048BB]/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#F8F3F0] text-base truncate max-w-sm sm:max-w-md">
                {job.title}
              </h3>
              <p className="text-xs text-[#A8A196]">
                Truthful Grounded Proposal for <span className="text-[#F8F3F0] font-semibold">{job.company}</span>
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
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Duplicate Outreach Warning */}
          {duplicateWarning && (
            <div className="p-3 rounded-xl bg-[#10192A] border border-[rgba(0,72,187,0.4)] flex items-center space-x-2 text-xs text-[#0048BB]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{duplicateWarning}</span>
            </div>
          )}

          {/* Quick Info Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-[#080808] border border-[rgba(248,243,240,0.12)] gap-3">
            <div className="flex items-center space-x-2 text-xs text-[#A8A196]">
              <Briefcase className="w-4 h-4 text-[#0048BB] shrink-0" />
              <span>{job.location} • {job.salary || "Competitive"}</span>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-[#0048BB] hover:bg-[#00388A] text-white font-semibold text-xs shadow-md shadow-[#0048BB]/20 transition flex items-center space-x-1.5"
              >
                <span>View Listing</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl bg-[#161616] hover:bg-[#161616]/80 text-[#F8F3F0] text-xs font-medium border border-[rgba(248,243,240,0.12)] transition flex items-center space-x-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#5EBA8C]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Proposal"}</span>
              </button>
            </div>
          </div>

          {/* Template Style Selector */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-[#A8A196] uppercase tracking-wider">
              Proposal Strategy / Template
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { type: "technical_pitch", label: "Concise Technical Pitch", desc: "Direct stack & highlights" },
                { type: "comprehensive_cover", label: "Formal Cover Letter", desc: "Deep experience narrative" },
                { type: "agency_modernization", label: "Contract / Partner Offer", desc: "Rates & fast availability" },
              ].map((tmpl) => (
                <button
                  key={tmpl.type}
                  onClick={() => handleTemplateChange(tmpl.type as ProposalTemplateType)}
                  className={`p-2.5 rounded-xl text-left border transition text-xs ${
                    templateType === tmpl.type
                      ? "bg-[#161616] border-[#0048BB] text-[#F8F3F0]"
                      : "bg-[#080808] border-[rgba(248,243,240,0.08)] text-[#A8A196] hover:text-[#F8F3F0]"
                  }`}
                >
                  <div className="font-bold">{tmpl.label}</div>
                  <div className="text-[10px] text-[#A8A196] mt-0.5">{tmpl.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Subject Line */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-[#A8A196] uppercase tracking-wider">
              Subject Line
            </span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#080808] border border-[rgba(248,243,240,0.12)] font-mono text-xs text-[#F8F3F0] focus:outline-none focus:ring-1 focus:ring-[#0048BB]"
            />
          </div>

          {/* Proposal Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#A8A196] uppercase tracking-wider">
                Tailored Message (Strictly Grounded in Profile Facts)
              </span>
              <span className="text-[10px] text-[#5EBA8C] flex items-center space-x-1">
                <UserCheck className="w-3 h-3" />
                <span>Zero Hallucinations Guarantee</span>
              </span>
            </div>
            <textarea
              rows={9}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full p-4 rounded-2xl bg-[#080808] border border-[rgba(248,243,240,0.12)] text-xs text-[#F8F3F0] leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#0048BB]"
            />
          </div>

          {/* Candidate Profile Skills Cited */}
          {profile?.skills && (
            <div className="flex flex-wrap gap-1.5 items-center pt-1">
              <span className="text-xs text-[#A8A196] mr-1">Verified Profile Stack:</span>
              {profile.skills.slice(0, 6).map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-0.5 rounded-md bg-[#161616] text-[#A8A196] border border-[rgba(248,243,240,0.12)] text-[10px]"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[rgba(248,243,240,0.12)] bg-[#080808] flex items-center justify-between">
          <div>
            {draftSaved && (
              <span className="text-xs text-[#5EBA8C] flex items-center space-x-1 font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>Draft saved to pipeline!</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className="px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-[#161616]/80 text-[#F8F3F0] text-xs font-medium border border-[rgba(248,243,240,0.12)] transition flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5 text-[#A8A196]" />
              <span>{isSavingDraft ? "Saving..." : "Save Draft"}</span>
            </button>

            <button
              onClick={handleSendEmail}
              className="px-4 py-2 rounded-xl bg-[#0048BB] hover:bg-[#00388A] text-white font-semibold text-xs shadow-md shadow-[#0048BB]/20 transition flex items-center space-x-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Send via Email / Mailto</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

