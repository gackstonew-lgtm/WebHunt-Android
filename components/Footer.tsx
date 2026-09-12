"use client";

import React, { useState } from "react";
import LegalModal from "./LegalModal";

export default function Footer() {
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<"privacy" | "terms">("privacy");

  const openLegalModal = (tab: "privacy" | "terms") => {
    setLegalModalTab(tab);
    setLegalModalOpen(true);
  };

  return (
    <>
      <footer className="border-t border-[rgba(248,243,240,0.12)] bg-[#000000] py-6 text-xs text-[#A8A196]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} WebHunt Delta • Worldwide B2B & Remote Tech Discovery</span>
          <div className="flex items-center space-x-3 text-xs text-[#A8A196]">
            <button
              onClick={() => openLegalModal("privacy")}
              className="hover:text-[#F8F3F0] transition underline-offset-4 hover:underline focus:outline-none"
            >
              Privacy Policy
            </button>
            <span className="text-[rgba(248,243,240,0.3)]">•</span>
            <button
              onClick={() => openLegalModal("terms")}
              className="hover:text-[#F8F3F0] transition underline-offset-4 hover:underline focus:outline-none"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </footer>

      {legalModalOpen && (
        <LegalModal
          initialTab={legalModalTab}
          onClose={() => setLegalModalOpen(false)}
        />
      )}
    </>
  );
}
