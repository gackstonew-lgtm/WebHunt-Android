import { NextRequest, NextResponse } from "next/server";
import { initializeKoraPayment } from "@/lib/kora";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency, customer, narration, channels, redirectUrl } = body;

    if (!amount || !customer?.email) {
      return NextResponse.json(
        { status: false, message: "Amount and customer email are required" },
        { status: 400 }
      );
    }

    const result = await initializeKoraPayment({
      amount: Number(amount),
      currency: currency || "KES",
      customer,
      narration,
      channels,
      redirectUrl,
    });

    return NextResponse.json(result, { status: result.status ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json(
      { status: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
