import crypto from "crypto";

export interface KoraCustomer {
  name?: string;
  email: string;
}

export interface InitializeKoraPaymentParams {
  amount: number;
  currency?: "KES" | "USD" | "NGN" | "GHS" | string;
  customer: KoraCustomer;
  reference?: string;
  narration?: string;
  redirectUrl?: string;
  notificationUrl?: string;
  channels?: Array<"card" | "mobile_money" | "bank_transfer">;
  defaultChannel?: "card" | "mobile_money" | "bank_transfer";
  metadata?: Record<string, any>;
}

export interface KoraInitializationResponse {
  status: boolean;
  message: string;
  data?: {
    checkout_url: string;
    reference: string;
    access_token?: string;
  };
  error?: string;
}

export interface KoraVerificationResponse {
  status: boolean;
  message: string;
  data?: {
    reference: string;
    amount: number;
    amount_paid?: number;
    currency: string;
    status: "success" | "failed" | "pending" | "abandoned" | string;
    payment_method?: string;
    fee?: number;
    paid_at?: string;
    customer?: {
      name?: string;
      email: string;
    };
    metadata?: Record<string, any>;
  };
  error?: string;
}

export interface PaymentPlan {
  id: "monthly" | "annual" | string;
  name: string;
  tagline: string;
  priceKes: number;
  priceUsd: number;
  durationDays: number;
  interval: "monthly" | "annual";
  credits?: number;
  isPopular?: boolean;
  features: string[];
}

export const KORA_PAYMENT_PLANS: PaymentPlan[] = [
  {
    id: "monthly",
    name: "Monthly Access",
    tagline: "Unrestricted physical & remote lead radar scans with CRM pipeline access",
    priceKes: 6500,
    priceUsd: 50,
    durationDays: 30,
    interval: "monthly",
    features: [
      "Unlimited Local Lead Radar Scans (No-Website Businesses)",
      "Unlimited Remote Opportunity Scans (Tech, Writing, Design)",
      "Instant WhatsApp, Phone & Direct Contact Enrichment",
      "Full CRM Pipeline & Deal Tracking Workflow",
      "AI Pitch Script & Proposal Draft Generators",
      "Full CSV & Client Data Export",
      "30-Day Unrestricted Access",
    ],
  },
  {
    id: "annual",
    name: "Annual Pass",
    tagline: "Maximum value: 1 full year of uncapped radar discovery & CRM automation",
    priceKes: 26000,
    priceUsd: 200,
    durationDays: 365,
    interval: "annual",
    isPopular: true,
    features: [
      "Everything in Monthly Access Plan",
      "365 Days of Uncapped Radar Discovery Access",
      "Save over 66% compared to monthly billing",
      "Priority API Data Refresh & Worldwide Indexing",
      "Priority Customer & Engineering Support",
      "Multi-Seat Workspace & Collaboration Tools",
      "12-Month Price Lock Guarantee",
    ],
  },
];

/**
 * Authoritative server-side plan resolver
 */
export function getAuthoritativePlan(planId: string): PaymentPlan | null {
  const normalized = (planId || "").toLowerCase().trim();
  if (normalized === "monthly" || normalized === "month" || normalized === "starter_scan") {
    return KORA_PAYMENT_PLANS[0];
  }
  if (normalized === "annual" || normalized === "yearly" || normalized === "pro_unlimited" || normalized === "agency_enterprise") {
    return KORA_PAYMENT_PLANS[1];
  }
  return null;
}

const KORA_SECRET_KEY = process.env.KORA_SECRET_KEY || "sk_test_po5kmjfHC9PHacCPVvoTFWni7dUkRvEudUDNFTHW";
const KORA_PUBLIC_KEY = process.env.NEXT_PUBLIC_KORA_PUBLIC_KEY || process.env.KORA_PUBLIC_KEY || "pk_test_FbZedpG4a7TsYLV4S14b6kEwGRXp8f8FV1popotE";
const KORA_BASE_URL = process.env.KORA_API_BASE_URL || "https://api.korapay.com/merchant/api/v1";

/**
 * Generate a unique reference for WebHunt transactions
 */
export function generateKoraReference(prefix: string = "WH"): string {
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${timestamp}-${randomStr}`;
}

/**
 * Get public configuration for client-side Kora drop-in checkout
 */
export function getKoraPublicConfig() {
  return {
    publicKey: KORA_PUBLIC_KEY,
    supportedCurrencies: ["KES", "USD", "NGN", "GHS"],
    supportedChannels: ["card", "mobile_money", "bank_transfer"],
    isTestMode: KORA_PUBLIC_KEY.startsWith("pk_test_"),
    plans: KORA_PAYMENT_PLANS,
  };
}

/**
 * Initialize a payment charge with Kora
 */
export async function initializeKoraPayment(
  params: InitializeKoraPaymentParams
): Promise<KoraInitializationResponse> {
  const reference = params.reference || generateKoraReference();
  const currency = params.currency || "KES";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://webhunt-delta.vercel.app";

  const payload = {
    amount: params.amount,
    currency,
    reference,
    narration: params.narration || "WebHunt Delta Subscription / Lead Discovery Credits",
    notification_url: params.notificationUrl || `${appUrl}/api/webhooks/kora`,
    redirect_url: params.redirectUrl || `${appUrl}/pipeline?payment=success&ref=${reference}`,
    customer: {
      name: params.customer.name || "WebHunt User",
      email: params.customer.email,
    },
    channels: params.channels || ["card", "mobile_money", "bank_transfer"],
    default_channel: params.defaultChannel || (currency === "KES" ? "mobile_money" : "card"),
    metadata: params.metadata || {},
  };

  try {
    const response = await fetch(`${KORA_BASE_URL}/charges/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KORA_SECRET_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const resData = await response.json();

    if (!response.ok || !resData.status) {
      return {
        status: false,
        message: resData.message || `Failed to initialize payment (Status: ${response.status})`,
        error: resData.error || resData.message,
      };
    }

    return {
      status: true,
      message: resData.message || "Payment initialized successfully",
      data: {
        checkout_url: resData.data?.checkout_url,
        reference: resData.data?.reference || reference,
        access_token: resData.data?.access_token,
      },
    };
  } catch (error: any) {
    console.error("Kora Payment Initialization Error:", error);
    return {
      status: false,
      message: error.message || "Network error while contacting Kora Payment Gateway",
      error: error.message,
    };
  }
}

/**
 * Verify a transaction status from Kora by reference
 */
export async function verifyKoraTransaction(
  reference: string
): Promise<KoraVerificationResponse> {
  if (!reference) {
    return {
      status: false,
      message: "Payment reference is required",
    };
  }

  try {
    const response = await fetch(`${KORA_BASE_URL}/charges/query/${encodeURIComponent(reference)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${KORA_SECRET_KEY}`,
      },
      cache: "no-store",
    });

    const resData = await response.json();

    if (!response.ok || !resData.status) {
      return {
        status: false,
        message: resData.message || `Verification failed (Status: ${response.status})`,
        error: resData.error || resData.message,
      };
    }

    return {
      status: true,
      message: resData.message || "Transaction verified successfully",
      data: resData.data,
    };
  } catch (error: any) {
    console.error("Kora Transaction Verification Error:", error);
    return {
      status: false,
      message: error.message || "Network error during transaction verification",
      error: error.message,
    };
  }
}

/**
 * Verify webhook cryptographic signature sent by Kora
 */
export function verifyKoraWebhookSignature(
  rawPayload: string,
  signatureHeader: string | null
): boolean {
  if (!signatureHeader || !rawPayload) {
    return false;
  }

  try {
    const hash = crypto
      .createHmac("sha256", KORA_SECRET_KEY)
      .update(rawPayload)
      .digest("hex");

    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signatureHeader));
  } catch (err) {
    console.warn("Kora webhook signature verification failed:", err);
    return false;
  }
}
