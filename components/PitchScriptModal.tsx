"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Copy, 
  Check, 
  Sparkles, 
  PhoneCall, 
  MessageSquareQuote, 
  Lightbulb, 
  MessageCircle, 
  Mail, 
  Save, 
  ExternalLink,
  Coins,
  AlertTriangle
} from "lucide-react";
import { PhysicalLead } from "@/lib/types";
import { generateTruthfulPhysicalPitch } from "@/lib/proposals/truthful-generator";
import { getUserProfileAction, UserProfileData } from "@/app/actions/profile";
import { generateWhatsAppChatLink, createQuickWhatsAppLeadMessage } from "@/lib/outreach/whatsapp";
import { generateMailtoLink } from "@/lib/outreach/gmail";
import { saveProposalDraftAction, checkDuplicateOutreachAction, recordOutreachMessageAction } from "@/app/actions/outreach";

interface PitchScriptModalProps {
  lead: PhysicalLead;
  onClose: () => void;
}

export default function PitchScriptModal({ lead, onClose }: PitchScriptModalProps) {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [templateType, setTemplateType] = useState<"local_website_pitch" | "agency_modernization">("local_website_pitch");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await getUserProfileAction();
      if (res.success && res.data) {
        setProfile(res.data);
        const pitch = generateTruthfulPhysicalPitch(lead, res.data, templateType);
        setSubject(pitch.subject);
        setBody(`${pitch.greeting}\n\n${pitch.body}\n\n${pitch.callToAction}`);
      }

      // Check if lead was contacted recently
      const targetPhone = lead.phoneFormatted || lead.phone;
      if (targetPhone) {
        const dupCheck = await checkDuplicateOutreachAction(targetPhone, "whatsapp", 7);
        if (dupCheck.isDuplicate) {
          setDuplicateWarning(`You contacted this lead via WhatsApp on ${dupCheck.lastContactedAt ? new Date(dupCheck.lastContactedAt).toLocaleDateString() : "recently"}.`);
        }
      }
    }
    load();
  }, [lead, templateType]);

  const handleTemplateChange = (type: "local_website_pitch" | "agency_modernization") => {
    setTemplateType(type);
    if (profile) {
      const pitch = generateTruthfulPhysicalPitch(lead, profile, type);
      setSubject(pitch.subject);
      setBody(`${pitch.greeting}\n\n${pitch.body}\n\n${pitch.callToAction}`);
    }
  };

  const copyToClipboard = () => {
    const fullScriptText = `OUTREACH SCRIPT FOR ${lead.businessName.toUpperCase()} (${lead.country}):
Phone: ${lead.phoneFormatted || lead.phone}
Niche: ${lead.category || "Local Business"}
Location: ${lead.city ? `${lead.city}, ` : ""}${lead.country}

SUBJECT: ${subject}

${body}`;

    navigator.clipboard.writeText(fullScriptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = async () => {
    const senderName = profile?.fullName || "Your Name";
    const message = createQuickWhatsAppLeadMessage({
      businessName: lead.businessName,
      category: lead.category,
      city: lead.city,
      senderName,
    });

    const targetPhone = lead.whatsapp || lead.phone;
    const waLink = generateWhatsAppChatLink(targetPhone, message, lead.country || "KE");

    if (waLink.isValid) {
      await recordOutreachMessageAction({
        leadId: lead.id,
        channel: "whatsapp",
        recipient: targetPhone,
        messageBody: message,
        status: "SENT",
      });
      window.open(waLink.url, "_blank");
    } else {
      alert("Invalid phone format for WhatsApp. Please verify the phone number.");
    }
  };

  const handleSendEmail = async () => {
    if (!lead.email) return;
    await recordOutreachMessageAction({
      leadId: lead.id,
      channel: "email",
      recipient: lead.email,
      subject,
      messageBody: body,
      status: "SENT",
    });
    const mailto = generateMailtoLink(lead.email, subject, body);
    window.location.href = mailto;
  };

  const handleSaveDraft = async () => {
    if (!profile) return;
    await saveProposalDraftAction({
      leadId: lead.id,
      title: `Website Pitch - ${lead.businessName}`,
      templateType,
      subject,
      body,
      callToAction: "",
      fullText: `SUBJECT: ${subject}\n\n${body}`,
    });
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
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
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-[#F8F3F0] text-base">{lead.businessName}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#161616] text-[#5EBA8C] border border-[rgba(248,243,240,0.12)]">
                  {lead.country}
                </span>
              </div>
              <p className="text-xs text-[#A8A196]">Multi-Channel Pitch (Phone, WhatsApp & Email)</p>
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

          {/* Quick Action Channels Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-[#080808] border border-[rgba(248,243,240,0.12)] gap-3">
            <div className="flex items-center space-x-2.5">
              <PhoneCall className="w-4 h-4 text-[#5EBA8C]" />
              <span className="font-mono text-xs font-semibold text-[#F8F3F0]">
                {lead.phoneFormatted || lead.phone}
              </span>
            </div>
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <a
                href={`tel:${lead.phone}`}
                className="px-3 py-1.5 rounded-xl bg-[#161616] hover:bg-[#161616]/80 text-[#F8F3F0] text-xs font-medium border border-[rgba(248,243,240,0.12)] transition flex items-center space-x-1"
              >
                <span>Call Phone</span>
              </a>

              <button
                onClick={handleOpenWhatsApp}
                className="px-3.5 py-1.5 rounded-xl bg-[#101914] text-[#5EBA8C] hover:bg-[#5EBA8C]/20 border border-[rgba(94,186,140,0.3)] font-semibold text-xs transition flex items-center space-x-1.5 shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Chat on WhatsApp</span>
              </button>

              <button
                onClick={copyToClipboard}
                className="px-3 py-1.5 rounded-xl bg-[#161616] hover:bg-[#161616]/80 text-[#F8F3F0] text-xs font-medium border border-[rgba(248,243,240,0.12)] transition flex items-center space-x-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#5EBA8C]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Pitch"}</span>
              </button>
            </div>
          </div>

          {/* Template Switcher */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-[#A8A196] uppercase tracking-wider">
              Outreach Strategy
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => handleTemplateChange("local_website_pitch")}
                className={`p-2.5 rounded-xl text-left border transition text-xs ${
                  templateType === "local_website_pitch"
                    ? "bg-[#161616] border-[#0048BB] text-[#F8F3F0]"
                    : "bg-[#080808] border-[rgba(248,243,240,0.08)] text-[#A8A196] hover:text-[#F8F3F0]"
                }`}
              >
                <div className="font-bold">Missing Website & WhatsApp Pitch</div>
                <div className="text-[10px] text-[#A8A196] mt-0.5">Capturing lost Google mobile traffic</div>
              </button>

              <button
                onClick={() => handleTemplateChange("agency_modernization")}
                className={`p-2.5 rounded-xl text-left border transition text-xs ${
                  templateType === "agency_modernization"
                    ? "bg-[#161616] border-[#0048BB] text-[#F8F3F0]"
                    : "bg-[#080808] border-[rgba(248,243,240,0.08)] text-[#A8A196] hover:text-[#F8F3F0]"
                }`}
              >
                <div className="font-bold">Digital Growth & Automation Pitch</div>
                <div className="text-[10px] text-[#A8A196] mt-0.5">Online booking & payment systems</div>
              </button>
            </div>
          </div>

          {/* Editable Subject & Body */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#A8A196] uppercase tracking-wider mb-1">
                Pitch Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#080808] border border-[rgba(248,243,240,0.12)] font-mono text-xs text-[#F8F3F0] focus:outline-none focus:ring-1 focus:ring-[#0048BB]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A8A196] uppercase tracking-wider mb-1">
                Customized Message Body
              </label>
              <textarea
                rows={8}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-[#080808] border border-[rgba(248,243,240,0.12)] text-xs text-[#F8F3F0] leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#0048BB]"
              />
            </div>
          </div>

          {/* Objection Handling */}
          <div className="p-3.5 rounded-2xl bg-[#080808] border border-[rgba(248,243,240,0.12)] space-y-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-[#A8A196]">
              <Lightbulb className="w-4 h-4 text-[#0048BB]" />
              <span>Handling Common Local Objections</span>
            </div>
            <div className="space-y-1.5 text-xs text-[#A8A196]">
              <p>
                <span className="font-semibold text-[#F8F3F0]">"We only use Instagram/Facebook":</span>{" "}
                "Social pages are great, but Google searches bring customers with immediate purchase intent. A fast 1-page site with your WhatsApp button captures that revenue."
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[rgba(248,243,240,0.12)] bg-[#080808] flex items-center justify-between">
          <div>
            {draftSaved && (
              <span className="text-xs text-[#5EBA8C] flex items-center space-x-1 font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>Pitch saved as draft!</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveDraft}
              className="px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-[#161616]/80 text-[#F8F3F0] text-xs font-medium border border-[rgba(248,243,240,0.12)] transition flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5 text-[#A8A196]" />
              <span>Save Draft</span>
            </button>

            {lead.email && (
              <button
                onClick={handleSendEmail}
                className="px-4 py-2 rounded-xl bg-[#0048BB] hover:bg-[#00388A] text-white font-semibold text-xs shadow-md shadow-[#0048BB]/20 transition flex items-center space-x-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Email</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#161616] hover:bg-[#161616]/80 text-[#F8F3F0] text-xs font-medium border border-[rgba(248,243,240,0.12)] transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

