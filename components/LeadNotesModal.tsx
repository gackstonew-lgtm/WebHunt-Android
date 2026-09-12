"use client";

import React, { useState } from "react";
import { X, Save, DollarSign, FileText, Check } from "lucide-react";
import { LeadItem } from "@/lib/types";

interface LeadNotesModalProps {
  lead: LeadItem;
  onSave: (notes: string, estimatedValue: number) => Promise<void> | void;
  onClose: () => void;
}

export default function LeadNotesModal({ lead, onSave, onClose }: LeadNotesModalProps) {
  const [notes, setNotes] = useState(lead.notes || "");
  const [estimatedValue, setEstimatedValue] = useState<number>(lead.estimatedValue || (lead.type === "physical" ? 1500 : 3500));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const title = lead.type === "physical" ? lead.businessName : `${lead.title} (${lead.company})`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(notes, estimatedValue);
      setSaved(true);
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0D0D0D] border border-[rgba(248,243,240,0.14)] rounded-3xl shadow-2xl overflow-hidden text-[#F8F3F0]">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(248,243,240,0.10)] bg-[#080808]">
            <div>
              <h3 className="font-bold text-[#F8F3F0] text-base truncate max-w-sm">{title}</h3>
              <p className="text-xs text-[#A8A196]">Prospect Progress, Notes & Estimated Deal Value</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#A8A196] hover:text-[#F8F3F0] hover:bg-[#161616] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 text-sm">
            {/* Deal Value */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#F8F3F0] flex items-center space-x-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[#0048BB]" />
                <span>Estimated Contract / Deal Value ($ USD)</span>
              </label>
              <input
                type="number"
                step="50"
                min="100"
                max="100000"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#000000] border border-[rgba(248,243,240,0.14)] rounded-xl px-4 py-2.5 text-sm text-[#F8F3F0] focus:outline-none focus:ring-2 focus:ring-[#0048BB]/40 focus:border-[#0048BB] transition"
              />
            </div>

            {/* Notes textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#F8F3F0] flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-[#0048BB]" />
                <span>Notes & Interaction History</span>
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Log discussion details, client requirements, scheduled callback time..."
                className="w-full bg-[#000000] border border-[rgba(248,243,240,0.14)] rounded-xl p-3 text-xs text-[#F8F3F0] placeholder-[#A8A196]/50 focus:outline-none focus:ring-2 focus:ring-[#0048BB]/40 focus:border-[#0048BB] resize-none transition"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[rgba(248,243,240,0.10)] bg-[#080808] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#161616] hover:bg-[#222222] text-[#A8A196] hover:text-[#F8F3F0] text-xs font-medium border border-[rgba(248,243,240,0.10)] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-[#0048BB] hover:bg-[#00388A] text-white text-xs font-semibold shadow-md shadow-[#0048BB]/20 disabled:opacity-50 transition"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving..." : "Save"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
