"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Radar, 
  KanbanSquare, 
  History, 
  Download, 
  User, 
  LogIn,
  Sparkles,
  CreditCard,
  Crown
} from "lucide-react";
import ProfileSettingsModal from "./profile/ProfileSettingsModal";
import KoraCheckoutModal from "./payments/KoraCheckoutModal";
import { getStoredPipelineLeads, clearAllClientStorage } from "@/lib/pipeline-store";
import { exportLeadsToCsv } from "@/lib/export";
import { syncLocalStorageWithDatabase } from "@/lib/sync-bridge";
import { getAuthStatusAction, logoutAction } from "@/app/actions/auth";
import { getUserSubscriptionAction } from "@/app/actions/payments";

export default function Navbar() {
  const pathname = usePathname();
  const [showProfile, setShowProfile] = useState(false);
  const [showKoraCheckout, setShowKoraCheckout] = useState(false);
  const [leadCount, setLeadCount] = useState(0);
  const [userSession, setUserSession] = useState<{ id: string; email: string; name?: string | null } | null>(null);
  const [hasActiveSub, setHasActiveSub] = useState(false);

  const isAuthRoute = pathname ? pathname === "/auth" || pathname.startsWith("/auth/") : false;

  useEffect(() => {
    const stored = getStoredPipelineLeads();
    setLeadCount(stored.length);

    // Fetch auth and subscription status
    getUserSubscriptionAction().then((res) => {
      if (res.isAuthenticated && res.user) {
        setUserSession(res.user);
        setHasActiveSub(!!res.subscriptionStatus.subscription);
      } else {
        setUserSession(null);
        setHasActiveSub(false);
      }
    }).catch(() => {});

    // Trigger seamless background sync with the database on load
    syncLocalStorageWithDatabase().catch((e) => console.warn("Background sync info:", e));

    const handleStorage = () => {
      const updated = getStoredPipelineLeads();
      setLeadCount(updated.length);
    };

    window.addEventListener("storage", handleStorage);
    const interval = setInterval(handleStorage, 2000);
    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, [pathname]);

  const handleLogout = async () => {
    clearAllClientStorage();
    await logoutAction();
    setUserSession(null);
    window.location.href = "/auth?mode=signin";
  };

  const handleExportAll = () => {
    const leads = getStoredPipelineLeads();
    if (leads.length === 0) {
      alert("No leads currently in pipeline to export. Discover and save leads first!");
      return;
    }
    exportLeadsToCsv(leads, "webhunt-leads-full-pipeline");
  };

  const navLinks = [
    { href: "/", label: "Radar", icon: Radar },
    { href: "/pipeline", label: "CRM", icon: KanbanSquare, badge: leadCount > 0 ? leadCount : undefined },
    { href: "/searches", label: "History", icon: History },
    { href: "/subscription", label: "Pricing", icon: CreditCard },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[rgba(248,243,240,0.12)] bg-[#000000]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-[#0048BB] p-0.5 shadow-md shadow-[#0048BB]/20 group-hover:bg-[#00388A] transition-colors duration-200">
                  <div className="w-full h-full bg-[#0D0D0D] rounded-[10px] flex items-center justify-center">
                    <Radar className="w-5 h-5 text-[#F8F3F0] group-hover:text-[#0048BB] transition-colors" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-lg text-[#F8F3F0] tracking-tight">WebHunt</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#161616] text-[#A8A196] border border-[rgba(248,243,240,0.12)]">
                      Delta
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A8A196] hidden sm:block">Physical &amp; Online Lead Discovery</p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            {!isAuthRoute && (
              <nav className="hidden md:flex items-center space-x-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={"flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all " + (
                        isActive
                          ? "bg-[#161616] text-[#F8F3F0] border border-[rgba(0,72,187,0.4)] shadow-sm"
                          : "text-[#A8A196] hover:text-[#F8F3F0] hover:bg-[#161616]/60"
                      )}
                    >
                      <Icon className={"w-4 h-4 " + (isActive ? "text-[#0048BB]" : "text-[#A8A196]")} />
                      <span>{link.label}</span>
                      {link.badge !== undefined && (
                        <span className="ml-1.5 px-2 py-0.5 text-xs font-semibold rounded-full bg-[#0048BB] text-white">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Right Action buttons */}
            {!isAuthRoute && (
              <div className="flex items-center space-x-2">
                {/* Profile & Settings Trigger */}
                <button
                  onClick={() => setShowProfile(true)}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 sm:px-3 text-xs font-semibold rounded-xl bg-[#0D0D0D] text-[#F8F3F0] hover:bg-[#161616] border border-[rgba(248,243,240,0.12)] transition shadow-sm"
                  title="Manage Profile, Appearance & Settings"
                >
                  <User className="w-3.5 h-3.5 text-[#0048BB]" />
                  <span className="hidden xs:inline">Profile</span>
                </button>

                {/* Subscription / Upgrade Trigger */}
                {hasActiveSub ? (
                  <Link
                    href="/subscription"
                    className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1.5 sm:px-3 text-xs font-bold rounded-xl bg-[#10192A] text-emerald-400 border border-emerald-500/30 shadow-sm transition hover:bg-emerald-950/30"
                    title="Active Subscription Managed"
                  >
                    <Crown className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Active</span>
                  </Link>
                ) : (
                  <button
                    onClick={() => setShowKoraCheckout(true)}
                    className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1.5 sm:px-3 text-xs font-semibold rounded-xl bg-[#161616] text-[#F8F3F0] hover:bg-[#1C1C1C] border border-[rgba(0,72,187,0.4)] shadow-sm transition"
                    title="Upgrade Subscription (Monthly $50 / Annual $200)"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#0048BB]" />
                    <span>Upgrade</span>
                  </button>
                )}

                {!userSession && (
                  <Link
                    href="/auth?mode=signin"
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 sm:px-3 text-xs font-semibold rounded-xl bg-[#0048BB] hover:bg-[#00388A] text-white shadow-sm transition"
                    title="Sign In to WebHunt"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </Link>
                )}

                <button
                  onClick={handleExportAll}
                  className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#0D0D0D] text-[#F8F3F0] hover:bg-[#161616] border border-[rgba(248,243,240,0.12)] transition"
                  title="Download in-session leads as CSV"
                >
                  <Download className="w-3.5 h-3.5 text-[#A8A196]" />
                  <span>Export CSV</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </header>

      {showProfile && <ProfileSettingsModal onClose={() => setShowProfile(false)} />}
      {showKoraCheckout && (
        <KoraCheckoutModal
          onClose={() => setShowKoraCheckout(false)}
          userEmail={userSession?.email || ""}
          userName={userSession?.name || ""}
          onSuccess={() => {
            setShowKoraCheckout(false);
            setHasActiveSub(true);
          }}
        />
      )}
    </>
  );
}
