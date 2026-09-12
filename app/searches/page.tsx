import React from "react";
import SavedSearches from "@/components/SavedSearches";

export const dynamic = "force-dynamic";

export default function SearchesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F8F3F0] tracking-tight">Search History & Analytics</h1>
        <p className="text-sm text-[#A8A196] mt-1">
          Review past lead radar scans across Kenya, international cities, and remote job feeds.
        </p>
      </div>

      <SavedSearches />
    </div>
  );
}
