"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Sparkles, 
  ShieldCheck, 
  Check, 
  ArrowRight, 
  CreditCard, 
  Smartphone, 
  Building2, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Radar, 
  Zap, 
  Lock,
  ArrowLeft,
  Calendar,
  Layers,
  Crown
} from "lucide-react";
import { KORA_PAYMENT_PLANS, PaymentPlan } from "@/lib/kora";
import { 
  getUserSubscriptionAction, 
  initializePaymentAction, 
  verifyPaymentAction 
} from "@/app/actions/payments";
import { SubscriptionStatusResult } from "@/lib/auth/subscription";

function SubscriptionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const returnTo = searchParams.get("returnTo") || "";
  const paymentStatus = searchParams.get("payment");
  const refParam = searchParams.get("ref");

  const [loadingStatus, setLoadingStatus] = useState(true);
  const [userSession, setUserSession] = useState<any | null>(null);
  const [subStatus, setSubStatus] = useState<SubscriptionStatusResult | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("annual");
  const [currency, setCurrency] = useState<"USD" | "KES" | "NGN">("USD");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verificationSuccessMessage, setVerificationSuccessMessage] = useState<string | null>(null);

  // Manual reference check state
  const [manualRef, setManualRef] = useState(refParam || "");
  const [isVerifyingRef, setIsVerifyingRef] = useState(false);
  const [manualVerifyResult, setManualVerifyResult] = useState<any | null>(null);

  const currentPlan =
    KORA_PAYMENT_PLANS.find((p) => p.id === selectedPlanId) || KORA_PAYMENT_PLANS[0];

  const fetchStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await getUserSubscriptionAction();
      if (res.isAuthenticated && res.user) {
        setUserSession(res.user);
        setCustomerEmail(res.user.email);
        setCustomerName(res.user.name || "");
      }
      setSubStatus(res.subscriptionStatus);
    } catch (err: any) {
      console.warn("Failed to load subscription status:", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Handle auto-verification if redirected with payment=success
  useEffect(() => {
    if (paymentStatus === "success" && refParam) {
      setIsVerifyingRef(true);
      verifyPaymentAction(refParam)
        .then((res) => {
          if (res.status) {
            setVerificationSuccessMessage(
              "Your transaction (" + refParam + ") was verified successfully! Your subscription is now active."
            );
            fetchStatus();
          } else {
            setErrorMessage(res.message || "Payment verification pending. Please verify below.");
          }
        })
        .catch((err) => {
          setErrorMessage(err.message || "Verification error");
        })
        .finally(() => {
          setIsVerifyingRef(false);
        });
    }
  }, [paymentStatus, refParam]);

  const getPlanPrice = (plan: PaymentPlan) => {
    if (currency === "KES") return "KSh " + plan.priceKes.toLocaleString();
    if (currency === "NGN") return "₦" + (plan.priceUsd * 1500).toLocaleString();
    return "$" + plan.priceUsd.toLocaleString();
  };

  const handleCheckout = async (planIdToUse?: string) => {
    const targetPlan = planIdToUse
      ? KORA_PAYMENT_PLANS.find((p) => p.id === planIdToUse) || currentPlan
      : currentPlan;

    if (!userSession && !customerEmail.trim()) {
      setErrorMessage("Please enter your email address to receive access and invoice.");
      return;
    }

    setIsCheckingOut(true);
    setErrorMessage(null);

    try {
      const res = await initializePaymentAction({
        planId: targetPlan.id,
        currency,
        customerEmail: customerEmail.trim() || userSession?.email,
        customerName: customerName.trim() || userSession?.name || "WebHunt Lead Hunter",
        narration: "WebHunt " + targetPlan.name + " Subscription",
        returnTo,
      });

      if (res.status && res.data?.checkout_url) {
        window.location.href = res.data.checkout_url;
      } else {
        setErrorMessage(res.message || "Failed to connect to Kora Gateway.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualRef.trim()) return;

    setIsVerifyingRef(true);
    setManualVerifyResult(null);

    try {
      const res = await verifyPaymentAction(manualRef.trim());
      setManualVerifyResult(res);
      if (res.status) {
        fetchStatus();
      }
    } catch (err: any) {
      setManualVerifyResult({ status: false, message: err.message });
    } finally {
      setIsVerifyingRef(false);
    }
  };

  const getReturnHref = () => {
    if (returnTo === "physical") return "/";
    if (returnTo === "online") return "/";
    if (returnTo.startsWith("/")) return returnTo;
    return "/";
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
      
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          href={getReturnHref()}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-[#A8A196] hover:text-[#F8F3F0] transition px-3 py-1.5 rounded-xl bg-[#0D0D0D] border border-[rgba(248,243,240,0.12)]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to {returnTo === "online" ? "Remote Gigs Radar" : "Local Lead Radar"}</span>
        </Link>

        {userSession && (
          <div className="text-xs text-[#A8A196]">
            Signed in as <span className="font-semibold text-[#F8F3F0]">{userSession.email}</span>
          </div>
        )}
      </div>

      {/* Success Banner */}
      {verificationSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-sm">Subscription Active!</div>
              <div>{verificationSuccessMessage}</div>
            </div>
          </div>
          <Link
            href={getReturnHref()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shrink-0 transition"
          >
            Launch Radar Now
          </Link>
        </div>
      )}

      {/* Current Active Status Card (Only shown for verified paid subscriptions) */}
      {subStatus?.subscription && (
        <div className="bg-gradient-to-r from-[#10192A] via-[#0D0D0D] to-[#10192A] border border-[#0048BB]/40 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0048BB] text-white flex items-center justify-center shadow-md shadow-[#0048BB]/30">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold text-[#F8F3F0]">
                    Active Subscription
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                    Active
                  </span>
                </div>
                <p className="text-xs text-[#A8A196] mt-0.5">
                  {"Plan: " + (subStatus.subscription.plan === "annual" ? "Annual Pass ($200/yr)" : "Monthly Access ($50/mo)") + " • " + (subStatus.subscription.daysRemaining || 0) + " days remaining"}
                </p>
              </div>
            </div>

            <Link
              href={getReturnHref()}
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-[#0048BB] hover:bg-[#00388A] text-white text-xs font-bold shadow-md shadow-[#0048BB]/20 transition shrink-0"
            >
              <Radar className="w-4 h-4" />
              <span>Launch Lead Radar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Hero Header Banner */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#161616] border border-[rgba(248,243,240,0.12)] text-[#A8A196] text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-[#0048BB]" />
          <span>Production Radar Access Control</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F8F3F0] tracking-tight">
          Unlock Unlimited Discovery Radar
        </h1>
        <p className="text-sm text-[#A8A196] max-w-xl mx-auto leading-relaxed">
          Access high-intent physical business leads with no websites, remote tech contracts, enriched WhatsApp &amp; phone contacts, and deal pipeline automation.
        </p>

        {/* Currency Switcher */}
        <div className="inline-flex items-center p-1 rounded-2xl bg-[#0D0D0D] border border-[rgba(248,243,240,0.12)] mt-4">
          {(["USD", "KES", "NGN"] as const).map((curr) => (
            <button
              key={curr}
              type="button"
              onClick={() => setCurrency(curr)}
              className={"px-4 py-1.5 rounded-xl text-xs font-bold transition " + (
                currency === curr
                  ? "bg-[#0048BB] text-white shadow-md shadow-[#0048BB]/25"
                  : "text-[#A8A196] hover:text-[#F8F3F0]"
              )}
            >
              {curr === "USD" ? "USD ($)" : curr === "KES" ? "KES (KSh)" : "NGN (₦)"}
            </button>
          ))}
        </div>
      </div>

      {/* Two Authoritative Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {KORA_PAYMENT_PLANS.map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          const isAnnual = plan.id === "annual";

          return (
            <div
              key={plan.id}
              className={"relative rounded-3xl p-6 sm:p-8 border transition flex flex-col justify-between space-y-6 " + (
                isAnnual
                  ? "bg-[#0D0D0D] border-[#0048BB] shadow-2xl shadow-[#0048BB]/10"
                  : "bg-[#0D0D0D] border-[rgba(248,243,240,0.12)] hover:border-[rgba(248,243,240,0.25)]"
              )}
            >
              {isAnnual && (
                <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-[#0048BB] text-white text-[10px] font-bold shadow-md flex items-center space-x-1">
                  <Zap className="w-3 h-3 fill-current" />
                  <span>RECOMMENDED • SAVE 66%</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-[#F8F3F0]">{plan.name}</h3>
                    <p className="text-xs text-[#A8A196] mt-1">{plan.tagline}</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-[#161616] text-[#A8A196] border border-[rgba(248,243,240,0.1)]">
                    {plan.durationDays} Days
                  </span>
                </div>

                <div className="pt-2">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-4xl sm:text-5xl font-extrabold text-[#F8F3F0] tracking-tight">
                      {getPlanPrice(plan)}
                    </span>
                    <span className="text-sm font-semibold text-[#A8A196]">
                      {isAnnual ? "/ year" : "/ month"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A8A196] mt-1">
                    {isAnnual ? "Billed annually • Full 365-day uncapped discovery" : "Billed monthly • 30-day flexible pass"}
                  </p>
                </div>

                {/* Features List */}
                <div className="pt-4 border-t border-[rgba(248,243,240,0.08)] space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#A8A196]">
                    Included Features
                  </div>
                  {plan.features.map((feat) => (
                    <div key={feat} className="flex items-start space-x-2 text-xs text-[#F8F3F0]">
                      <Check className="w-4 h-4 text-[#5EBA8C] shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checkout CTA */}
              <div className="pt-4 border-t border-[rgba(248,243,240,0.08)]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlanId(plan.id);
                    handleCheckout(plan.id);
                  }}
                  disabled={isCheckingOut}
                  className={"w-full py-3.5 px-6 rounded-xl font-bold text-sm transition flex items-center justify-center space-x-2 shadow-md " + (
                    isAnnual
                      ? "bg-[#0048BB] hover:bg-[#00388A] text-white shadow-[#0048BB]/25"
                      : "bg-[#161616] hover:bg-[#222222] text-[#F8F3F0] border border-[rgba(248,243,240,0.15)]"
                  )}
                >
                  {isCheckingOut && selectedPlanId === plan.id ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Connecting to Kora...</span>
                    </>
                  ) : (
                    <>
                      <span>Get {plan.name}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Guest Email Field if Not Signed In */}
      {!userSession && (
        <div className="bg-[#0D0D0D] border border-[rgba(248,243,240,0.12)] rounded-3xl p-6 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#A8A196]">
            <Lock className="w-4 h-4 text-[#0048BB]" />
            <span>Account Details for Invoice &amp; Subscription Setup</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#A8A196] mb-1">
                Your Full Name / Agency
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Baraka Tech"
                className="w-full px-4 py-2.5 rounded-xl bg-[#161616] border border-[rgba(248,243,240,0.12)] text-xs text-[#F8F3F0] focus:outline-none focus:ring-1 focus:ring-[#0048BB]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#A8A196] mb-1">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-2.5 rounded-xl bg-[#161616] border border-[rgba(248,243,240,0.12)] text-xs text-[#F8F3F0] focus:outline-none focus:ring-1 focus:ring-[#0048BB]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Supported Payment Rails Badges */}
      <div className="bg-[#080808] border border-[rgba(248,243,240,0.1)] rounded-3xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center space-x-3 p-3 rounded-2xl bg-[#121212] border border-[rgba(248,243,240,0.06)]">
            <Smartphone className="w-6 h-6 text-[#5EBA8C] shrink-0" />
            <div>
              <div className="font-bold text-[#F8F3F0]">M-Pesa &amp; Mobile Money</div>
              <div className="text-[10px] text-[#A8A196]">Instant STK Push in Kenya, Ghana &amp; Africa</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-2xl bg-[#121212] border border-[rgba(248,243,240,0.06)]">
            <CreditCard className="w-6 h-6 text-[#0048BB] shrink-0" />
            <div>
              <div className="font-bold text-[#F8F3F0]">Global Visa &amp; Mastercard</div>
              <div className="text-[10px] text-[#A8A196]">3D-Secure 256-bit encrypted checkout</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-2xl bg-[#121212] border border-[rgba(248,243,240,0.06)]">
            <ShieldCheck className="w-6 h-6 text-[#A8A196] shrink-0" />
            <div>
              <div className="font-bold text-[#F8F3F0]">Instant Radar Activation</div>
              <div className="text-[10px] text-[#A8A196]">Automatic server verification &amp; access sync</div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Verification Accordion */}
      <div className="bg-[#0D0D0D] border border-[rgba(248,243,240,0.1)] rounded-3xl p-5 text-xs space-y-3">
        <details className="group cursor-pointer">
          <summary className="font-semibold text-[#A8A196] hover:text-[#F8F3F0] flex items-center justify-between list-none">
            <span>Already paid via Kora? Click here to verify your reference number</span>
            <span className="text-xs group-open:rotate-180 transition">▼</span>
          </summary>

          <form onSubmit={handleManualVerify} className="mt-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={manualRef}
                onChange={(e) => setManualRef(e.target.value)}
                placeholder="Enter transaction reference (e.g. WH-1726045...)"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#161616] border border-[rgba(248,243,240,0.12)] text-xs text-[#F8F3F0] font-mono focus:outline-none focus:ring-1 focus:ring-[#0048BB]"
              />
              <button
                type="submit"
                disabled={isVerifyingRef}
                className="px-5 py-2.5 bg-[#161616] hover:bg-[#222222] text-[#F8F3F0] font-bold rounded-xl border border-[rgba(248,243,240,0.12)] flex items-center justify-center space-x-2"
              >
                {isVerifyingRef ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Verify Reference</span>}
              </button>
            </div>

            {manualVerifyResult && (
              <div className={"p-4 rounded-xl text-xs border " + (
                manualVerifyResult.status && manualVerifyResult.data?.status === "success"
                  ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                  : "bg-[#161616] border-[rgba(248,243,240,0.12)] text-[#A8A196]"
              )}>
                <div className="font-bold">
                  {manualVerifyResult.status ? "Transaction Verified Successfully:" : "Verification Notice:"}
                </div>
                <div>{manualVerifyResult.message}</div>
                {manualVerifyResult.data && (
                  <div className="font-mono text-[10px] mt-1 opacity-80">
                    Ref: {manualVerifyResult.data.reference} | Status: {manualVerifyResult.data.status} | Amount: {manualVerifyResult.data.currency} {manualVerifyResult.data.amount}
                  </div>
                )}
              </div>
            )}
          </form>
        </details>
      </div>

    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh] text-[#A8A196] space-x-2 text-xs">
        <RefreshCw className="w-4 h-4 animate-spin text-[#0048BB]" />
        <span>Loading subscription status...</span>
      </div>
    }>
      <SubscriptionContent />
    </Suspense>
  );
}
