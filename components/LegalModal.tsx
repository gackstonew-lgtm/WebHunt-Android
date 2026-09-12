"use client";

import React, { useState } from "react";
import { X, Shield, FileText, CheckCircle2, Globe, ShieldCheck, Lock, Database } from "lucide-react";

interface LegalModalProps {
  initialTab?: "privacy" | "terms";
  onClose: () => void;
}

export default function LegalModal({ initialTab = "privacy", onClose }: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<"privacy" | "terms">(initialTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0D0D0D] border border-[rgba(248,243,240,0.14)] rounded-3xl shadow-2xl overflow-hidden text-[#F8F3F0] max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(248,243,240,0.10)] bg-[#080808]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#161616] text-[#0048BB] border border-[rgba(248,243,240,0.10)]">
              {activeTab === "privacy" ? <Shield className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-[#F8F3F0] text-base">
                {activeTab === "privacy" ? "Privacy Policy" : "Terms of Service"}
              </h3>
              <p className="text-xs text-[#A8A196]">
                {activeTab === "privacy" ? "Data Provenance, Sourcing & Protection" : "Acceptable Use, Telemarketing & Outreach Compliance"}
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

        {/* Tab Switcher */}
        <div className="px-6 pt-3 pb-1 bg-[#080808]/80 border-b border-[rgba(248,243,240,0.06)] flex space-x-2">
          <button
            onClick={() => setActiveTab("privacy")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === "privacy"
                ? "bg-[#161616] text-[#F8F3F0] border border-[rgba(0,72,187,0.4)] shadow-sm"
                : "text-[#A8A196] hover:text-[#F8F3F0]"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-[#0048BB]" />
            <span>Privacy Policy</span>
          </button>
          <button
            onClick={() => setActiveTab("terms")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === "terms"
                ? "bg-[#161616] text-[#F8F3F0] border border-[rgba(0,72,187,0.4)] shadow-sm"
                : "text-[#A8A196] hover:text-[#F8F3F0]"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#0048BB]" />
            <span>Terms of Service</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-[#A8A196]">
          {activeTab === "privacy" ? (
            <>
              <div className="p-3.5 rounded-2xl bg-[#080808] border border-[rgba(248,243,240,0.10)] flex items-start space-x-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#F8F3F0]">100% Genuine, Verifiable Data Guarantee:</span> WebHunt Delta indexes strictly real, traceable businesses and job opportunities. We query official, public developer APIs (Remotive, Arbeitnow, Himalayas, RemoteOK), public feeds (WeWorkRemotely, Jobspresso), and global open geodata (OpenStreetMap Overpass, Google Places, Yelp, Foursquare). No fake data or synthetic fallbacks are ever generated.
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-[#F8F3F0] flex items-center space-x-2 text-sm">
                  <Database className="w-4 h-4 text-[#0048BB]" />
                  <span>Data Sourcing & Provenance</span>
                </h4>
                <p>
                  All commercial contact information and job listings surfaced by WebHunt Delta originate from publicly accessible directories, open mapping databases, and corporate career APIs. We do not purchase private personal databases or harvest private consumer inboxes.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-[#F8F3F0] flex items-center space-x-2 text-sm">
                  <Lock className="w-4 h-4 text-[#0048BB]" />
                  <span>Account & Workspace Information</span>
                </h4>
                <p>
                  We store user account credentials (email address, full name, cryptographically salted password hashes) and user-generated CRM leads, custom outreach notes, proposal drafts, and task reminders. We do not sell, rent, or monetize user data.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-[#F8F3F0] flex items-center space-x-2 text-sm">
                  <ShieldCheck className="w-4 h-4 text-[#0048BB]" />
                  <span>User Rights & Data Portability</span>
                </h4>
                <p>
                  You retain full ownership of your saved prospect data. You can export your full lead pipeline to CSV at any time, modify your profile preferences, or request full deletion of your workspace data.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <h4 className="font-semibold text-[#F8F3F0] flex items-center space-x-2 text-sm">
                  <FileText className="w-4 h-4 text-[#0048BB]" />
                  <span>1. Agreement to Terms</span>
                </h4>
                <p>
                  By accessing or using WebHunt Delta, you agree to comply with and be bound by these Terms of Service. WebHunt Delta provides lead discovery and sales pipeline productivity software for commercial and professional outreach.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-[#F8F3F0] flex items-center space-x-2 text-sm">
                  <Globe className="w-4 h-4 text-[#0048BB]" />
                  <span>2. Permitted Commercial Outreach & Outreach Laws</span>
                </h4>
                <p>
                  Users agree to conduct outbound commercial communications in strict compliance with applicable regional and international telemarketing and privacy regulations:
                </p>
                <ul className="space-y-1.5 pl-3 list-disc list-inside">
                  <li>
                    <strong className="text-[#F8F3F0]">Kenya & East Africa:</strong> B2B commercial outreach to published business lines is permitted. You must comply with the Kenya Data Protection Act (2019) by promptly honoring opt-out requests.
                  </li>
                  <li>
                    <strong className="text-[#F8F3F0]">United States (TCPA & DNC):</strong> Direct B2B contact to published business numbers is allowed. Abide by permitted local calling hours (8:00 AM – 9:00 PM local time) and honor Do-Not-Call requests immediately.
                  </li>
                  <li>
                    <strong className="text-[#F8F3F0]">UK & European Union (PECR & GDPR):</strong> Corporate subscribers (limited companies) may be contacted for relevant B2B services, provided an immediate opt-out mechanism is available in every communication.
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-[#F8F3F0] flex items-center space-x-2 text-sm">
                  <ShieldCheck className="w-4 h-4 text-[#0048BB]" />
                  <span>3. Third-Party Data Provider Compliance</span>
                </h4>
                <ul className="space-y-1.5 pl-3 list-disc list-inside">
                  <li><strong className="text-[#F8F3F0]">OpenStreetMap Overpass:</strong> Used under the Open Database License (ODbL). Queries are cached server-side to prevent unnecessary infrastructure load.</li>
                  <li><strong className="text-[#F8F3F0]">Remotive, Arbeitnow, Himalayas & RemoteOK:</strong> Queried via official public JSON developer endpoints with proper attribution.</li>
                  <li><strong className="text-[#F8F3F0]">We Work Remotely & Jobspresso:</strong> Syndicated via official public RSS feeds.</li>
                  <li><strong className="text-[#F8F3F0]">Google Places, Yelp & Foursquare:</strong> Optional commercial APIs rate-limited according to developer terms.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-[#F8F3F0] flex items-center space-x-2 text-sm">
                  <Lock className="w-4 h-4 text-[#0048BB]" />
                  <span>4. Disclaimer of Warranties</span>
                </h4>
                <p>
                  WebHunt Delta is provided &quot;as is&quot; and &quot;as available&quot;. While WebHunt Delta connects solely to authentic live public feeds and APIs, we do not warrant that all third-party job postings or business listings will remain active or convert into closed sales contracts.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[rgba(248,243,240,0.10)] bg-[#080808] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#0048BB] hover:bg-[#00388A] text-white font-semibold text-xs shadow-md shadow-[#0048BB]/20 transition"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
