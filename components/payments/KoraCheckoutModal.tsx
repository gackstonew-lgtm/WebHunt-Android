"use client";

import React, { useState } from "react";
import { 
  X, 
  CreditCard, 
  Smartphone, 
  Building2, 
  ShieldCheck, 
  Check, 
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Zap
} from "lucide-react";
import { KORA_PAYMENT_PLANS, PaymentPlan } from "@/lib/kora";
import { initializePaymentAction, verifyPaymentAction } from "@/app/actions/payments";

interface KoraCheckoutModalProps {
  onClose: () => void;
  defaultPlanId?: string;
  userEmail?: string;
  userName?: string;
  returnTo?: string;
  onSuccess?: () => void;
}

export default function KoraCheckoutModal({
  onClose,
  defaultPlanId = "annual",
  userEmail = "",
  userName = "",
  returnTo = "",
  onSuccess,
}: KoraCheckoutModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    defaultPlanId === "monthly" ? "monthly" : "annual"
  );
  const [currency, setCurrency] = useState<"USD" | "KES" | "NGN">("USD");
  const [email, setEmail] = useState(userEmail);
  const [name, setName] = useState(userName);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verificationRef, setVerificationRef] = useState<string>("");
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const currentPlan =
    KORA_PAYMENT_PLANS.find((p) => p.id === selectedPlanId) || KORA_PAYMENT_PLANS[0];

  const getPlanPrice = (plan: PaymentPlan) => {
    if (currency === "KES") return "KSh " + plan.priceKes.toLocaleString();
    if (currency === "NGN") return "₦" + (plan.priceUsd * 1500).toLocaleString();
    return "$" + plan.priceUsd.toLocaleString();
  };

  const handleCheckout = async () => {
    if (!email.trim()) {
      setErrorMessage("Please enter a valid email address for transaction receipt & verification.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await initializePaymentAction({
        planId: currentPlan.id,
        currency,
        customerEmail: email.trim(),
        customerName: name.trim() || "WebHunt Lead Hunter",
        narration: "WebHunt Delta " + currentPlan.name + " (" + (currency === 'KES' ? 'KSh ' + currentPlan.priceKes : '$' + currentPlan.priceUsd) + ")",
        returnTo,
      });

      if (res.status && res.data?.checkout_url) {
        window.location.href = res.data.checkout_url;
      } else {
        setErrorMessage(res.message || "Failed to initialize Kora Payment.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred while connecting to payment gateway.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationRef.trim()) return;

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const res = await verifyPaymentAction(verificationRef.trim());
      setVerificationResult(res);
      if (res.status && (res as any).activated) {
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setVerificationResult({ status: false, message: err.message });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl max-h-[92vh] bg-[#0D0D0D] border border-[rgba(248,243,240,0.16)] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#F8F3F0] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-[rgba(248,243,240,0.12)] bg-[#121212]/90">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#1C1C1C] border border-[rgba(0,72,187,0.3)] flex items-center justify-center text-[#0048BB]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold text-[#F8F3F0] tracking-tight">
                  WebHunt Delta Subscription
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#10192A] text-[#0048BB] border border-[rgba(0,72,187,0.3)]">
                  Kora Gateway
                </span>
              </div>
              <p className="text-xs text-[#A8A196]">
                Choose your pass to unlock unrestricted lead radar scans &amp; CRM pipeline tools
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[#A8A196] hover:text-[#F8F3F0] hover:bg-[#1C1C1C] p-2 rounded-xl transition border border-transparent hover:border-[rgba(248,243,240,0.12)]"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* Supported Channels Banner */}
          <div className="grid grid-cols-3 gap-2 bg-[#080808] p-3 rounded-2xl border border-[rgba(248,243,240,0.1)]">
            <div className="flex flex-col sm:flex-row items-center sm:space-x-2 text-center sm:text-left p-1.5 rounded-xl bg-[#161616]">
              <Smartphone className="w-4 h-4 text-[#5EBA8C] shrink-0 mb-1 sm:mb-0" />
              <div>
                <span className="font-bold text-[#F8F3F0] block text-[11px]">M-Pesa / Mobile</span>
                <span className="text-[9px] text-[#A8A196] block">Kenya &amp; Africa</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:space-x-2 text-center sm:text-left p-1.5 rounded-xl bg-[#161616]">
              <CreditCard className="w-4 h-4 text-[#0048BB] shrink-0 mb-1 sm:mb-0" />
              <div>
                <span className="font-bold text-[#F8F3F0] block text-[11px]">Visa / Mastercard</span>
                <span className="text-[9px] text-[#A8A196] block">Global Cards</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:space-x-2 text-center sm:text-left p-1.5 rounded-xl bg-[#161616]">
              <Building2 className="w-4 h-4 text-[#A8A196] shrink-0 mb-1 sm:mb-0" />
              <div>
                <span className="font-bold text-[#F8F3F0] block text-[11px]">Bank Transfer</span>
                <span className="text-[9px] text-[#A8A196] block">Direct Electronic</span>
              </div>
            </div>
          </div>

          {/* Currency Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#A8A196] uppercase tracking-wider">
              Select Currency
            </span>
            <div className="flex items-center p-1 rounded-xl bg-[#161616] border border-[rgba(248,243,240,0.12)]">
              {(["USD", "KES", "NGN"] as const).map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => setCurrency(curr)}
                  className={"px-3 py-1 rounded-lg text-xs font-semibold transition " + (
                    currency === curr
                      ? "bg-[#0048BB] text-white shadow-sm"
                      : "text-[#A8A196] hover:text-[#F8F3F0]"
                  )}
                >
                  {curr === "USD" ? "$ (USD)" : curr === "KES" ? "KSh (KES)" : "₦ (NGN)"}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing Plans Grid (Exactly 2 Authoritative Plans) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {KORA_PAYMENT_PLANS.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              return (
                <button
                  type="button"
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={"w-full text-left p-4 sm:p-5 rounded-2xl border transition flex flex-col justify-between space-y-4 relative " + (
                    isSelected
                      ? "bg-[#10192A] border-[#0048BB] text-[#F8F3F0] shadow-lg shadow-[#0048BB]/15"
                      : "bg-[#080808] hover:bg-[#161616] border-[rgba(248,243,240,0.08)] text-[#A8A196] hover:text-[#F8F3F0]"
                  )}
                >
                  {plan.isPopular && (
                    <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-[#0048BB] text-white text-[9px] font-bold shadow-sm flex items-center space-x-1">
                      <Zap className="w-3 h-3 fill-current" />
                      <span>BEST VALUE (SAVE 66%)</span>
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-base text-[#F8F3F0]">{plan.name}</div>
                      <span className="text-[10px] font-semibold text-[#A8A196] uppercase tracking-wider">
                        {plan.id === "monthly" ? "30 Days" : "365 Days"}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#A8A196] mt-1 line-clamp-2">{plan.tagline}</div>
                  </div>

                  <div>
                    <div className="flex items-baseline space-x-1">
                      <span className="text-2xl font-extrabold text-[#0048BB]">
                        {getPlanPrice(plan)}
                      </span>
                      <span className="text-[11px] text-[#A8A196]">
                        {plan.id === "monthly" ? "/ month" : "/ year"}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#A8A196] mt-3 space-y-1.5">
                      {plan.features.slice(0, 4).map((f) => (
                        <div key={f} className="flex items-start space-x-1.5">
                          <Check className="w-3.5 h-3.5 text-[#5EBA8C] shrink-0 mt-0.5" />
                          <span className="leading-tight">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[rgba(248,243,240,0.08)] flex items-center justify-between text-xs font-semibold">
                    <span>{isSelected ? "Selected Plan" : "Choose " + plan.name}</span>
                    <div className={"w-5 h-5 rounded-full border flex items-center justify-center " + (
                      isSelected ? "border-[#0048BB] bg-[#0048BB] text-white" : "border-[rgba(248,243,240,0.2)]"
                    )}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Customer Details Form */}
          <div className="bg-[#080808] border border-[rgba(248,243,240,0.1)] rounded-2xl p-4 space-y-3">
            <div className="text-[11px] font-semibold text-[#A8A196] uppercase tracking-wider">
              Receipt &amp; Account Information
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[#A8A196] mb-1">
                  Full Name / Business
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Baraka Tech"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#161616] border border-[rgba(248,243,240,0.12)] text-xs text-[#F8F3F0] focus:outline-none focus:ring-1 focus:ring-[#0048BB]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#A8A196] mb-1">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#161616] border border-[rgba(248,243,240,0.12)] text-xs text-[#F8F3F0] focus:outline-none focus:ring-1 focus:ring-[#0048BB]"
                />
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 flex items-center space-x-2 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Verify Existing Payment Reference Accordion */}
          <div className="pt-2 border-t border-[rgba(248,243,240,0.08)]">
            <details className="group cursor-pointer">
              <summary className="text-[11px] text-[#A8A196] hover:text-[#F8F3F0] flex items-center justify-between list-none">
                <span>Already made a payment? Verify reference number</span>
                <span className="text-xs group-open:rotate-180 transition">▼</span>
              </summary>
              
              <form onSubmit={handleManualVerify} className="mt-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={verificationRef}
                    onChange={(e) => setVerificationRef(e.target.value)}
                    placeholder="Enter reference (e.g. WH-1726045...)"
                    className="flex-1 px-3 py-2 rounded-xl bg-[#161616] border border-[rgba(248,243,240,0.12)] text-xs text-[#F8F3F0] focus:outline-none font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="px-4 py-2 bg-[#161616] hover:bg-[#222222] text-[#F8F3F0] font-semibold text-xs rounded-xl border border-[rgba(248,243,240,0.12)] flex items-center space-x-1"
                  >
                    {isVerifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Verify</span>}
                  </button>
                </div>

                {verificationResult && (
                  <div className={"p-3 rounded-xl text-xs border " + (
                    verificationResult.status && verificationResult.data?.status === "success"
                      ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                      : "bg-[#161616] border-[rgba(248,243,240,0.12)] text-[#A8A196]"
                  )}>
                    <div className="font-bold">
                      {verificationResult.status ? "Transaction Verified:" : "Verification Notice:"}
                    </div>
                    <div>{verificationResult.message}</div>
                    {verificationResult.data && (
                      <div className="font-mono text-[10px] mt-1 opacity-80">
                        Ref: {verificationResult.data.reference} | Status: {verificationResult.data.status} | Amount: {verificationResult.data.currency} {verificationResult.data.amount}
                      </div>
                    )}
                  </div>
                )}
              </form>
            </details>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[rgba(248,243,240,0.12)] bg-[#121212] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-[11px] text-[#A8A196]">
            <ShieldCheck className="w-4 h-4 text-[#5EBA8C]" />
            <span>Kora 256-bit Encrypted Checkout • PCI-DSS Certified</span>
          </div>

          <div className="flex items-center space-x-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#A8A196] hover:text-[#F8F3F0] hover:bg-[#1C1C1C] rounded-xl transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={isLoading}
              className="px-5 py-2.5 bg-[#0048BB] hover:bg-[#00388A] text-white text-xs font-bold rounded-xl shadow-md shadow-[#0048BB]/20 transition flex items-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting to Kora...</span>
                </>
              ) : (
                <>
                  <span>Pay {getPlanPrice(currentPlan)} with Kora</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
