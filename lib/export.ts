import { LeadItem, PhysicalLead, OnlineJobLead } from "./types";

export function exportLeadsToCsv(leads: LeadItem[], filenamePrefix = "webhunt-leads"): void {
  if (!leads || leads.length === 0) return;

  const headers = [
    "Type",
    "Title / Business Name",
    "Phone / Contact",
    "Phone Status",
    "Primary Email",
    "Secondary Email",
    "WhatsApp",
    "Contact Page URL",
    "Booking URL",
    "Contact Form Available",
    "Facebook",
    "Instagram",
    "LinkedIn",
    "Twitter / X",
    "YouTube",
    "TikTok",
    "Telegram",
    "Location / Remote",
    "Country",
    "Category / Niche",
    "Website / Apply URL",
    "Source Provider",
    "Source URL",
    "Verification Status",
    "Data Quality Score",
    "Rating / Reviews",
    "Pipeline Status",
    "Estimated Value ($)",
    "Notes",
    "Date Added",
  ];

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const clean = String(val).replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = leads.map((lead) => {
    const secondaryEmail = (lead.emails && lead.emails.length > 1) ? lead.emails[1] : "";
    const soc = lead.socialProfiles || {};

    if (lead.type === "physical") {
      const p = lead as PhysicalLead;
      return [
        escapeCsv("Physical Business (No Website)"),
        escapeCsv(p.businessName),
        escapeCsv(p.phoneFormatted || p.phone),
        escapeCsv(p.phoneStatus || "source_listed"),
        escapeCsv(p.email || ""),
        escapeCsv(secondaryEmail),
        escapeCsv(p.whatsapp || ""),
        escapeCsv(p.contactPageUrl || ""),
        escapeCsv(p.bookingUrl || ""),
        escapeCsv(p.hasContactForm ? "Yes" : "No"),
        escapeCsv(soc.facebook || ""),
        escapeCsv(soc.instagram || ""),
        escapeCsv(soc.linkedin || ""),
        escapeCsv(soc.twitter || ""),
        escapeCsv(soc.youtube || ""),
        escapeCsv(soc.tiktok || ""),
        escapeCsv(soc.telegram || ""),
        escapeCsv(p.address || `${p.city}, ${p.country}`),
        escapeCsv(p.country),
        escapeCsv(p.category || "Local Service"),
        escapeCsv(p.websiteUrl || "No Website on Record"),
        escapeCsv(p.sourceProvider),
        escapeCsv(p.sourceUrl || ""),
        escapeCsv(p.verificationStatus || "SOURCE_LISTED"),
        escapeCsv(p.dataQualityScore ? `${(p.dataQualityScore * 100).toFixed(0)}%` : "90%"),
        escapeCsv(p.rating ? `${p.rating.toFixed(1)} (${p.reviewCount || 0})` : "N/A"),
        escapeCsv(p.status),
        escapeCsv(p.estimatedValue || 1500),
        escapeCsv(p.notes || ""),
        escapeCsv(new Date(p.createdAt).toISOString().split("T")[0]),
      ];
    } else {
      const o = lead as OnlineJobLead;
      return [
        escapeCsv("Remote / Online Opportunity"),
        escapeCsv(`${o.title} (${o.company})`),
        escapeCsv(o.company),
        escapeCsv("N/A"),
        escapeCsv(o.email || ""),
        escapeCsv(secondaryEmail),
        escapeCsv(o.whatsapp || ""),
        escapeCsv(o.contactPageUrl || ""),
        escapeCsv(o.bookingUrl || ""),
        escapeCsv(o.hasContactForm ? "Yes" : "No"),
        escapeCsv(soc.facebook || ""),
        escapeCsv(soc.instagram || ""),
        escapeCsv(soc.linkedin || ""),
        escapeCsv(soc.twitter || ""),
        escapeCsv(soc.youtube || ""),
        escapeCsv(soc.tiktok || ""),
        escapeCsv(soc.telegram || ""),
        escapeCsv(o.location),
        escapeCsv(o.country || "Worldwide"),
        escapeCsv(o.category || "Software & Technology"),
        escapeCsv(o.url),
        escapeCsv(o.source),
        escapeCsv(o.sourceUrl || o.url),
        escapeCsv(o.verificationStatus || "VERIFIED"),
        escapeCsv(o.dataQualityScore ? `${(o.dataQualityScore * 100).toFixed(0)}%` : "95%"),
        escapeCsv(o.tags ? o.tags.join(", ") : ""),
        escapeCsv(o.status),
        escapeCsv(o.estimatedValue || 3500),
        escapeCsv(o.notes || ""),
        escapeCsv(new Date(o.createdAt).toISOString().split("T")[0]),
      ];
    }
  });

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filenamePrefix}-${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
