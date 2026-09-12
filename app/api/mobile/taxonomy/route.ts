import { NextResponse } from "next/server";
import { INDUSTRY_CATEGORIES, INDUSTRY_TAXONOMY } from "@/lib/taxonomy";
import { COUNTRIES } from "@/lib/countries";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    success: true,
    categories: INDUSTRY_CATEGORIES,
    industries: INDUSTRY_TAXONOMY,
    countries: COUNTRIES,
  });
}
