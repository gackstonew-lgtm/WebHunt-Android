import { NextRequest, NextResponse } from "next/server";
import { verifyKoraTransaction } from "@/lib/kora";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.json(
      { status: false, message: "Query parameter 'reference' is required" },
      { status: 400 }
    );
  }

  const result = await verifyKoraTransaction(reference);
  return NextResponse.json(result, { status: result.status ? 200 : 400 });
}
