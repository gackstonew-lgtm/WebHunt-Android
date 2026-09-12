import { aggregator } from "../lib/providers";

async function runLiveVerification() {
  console.log("\n==================================================");
  console.log("TESTING LIVE REAL DATA PROVIDERS");
  console.log("==================================================");

  // 1. Test Online Remote Jobs Search
  console.log("\n[Test 1] Searching for 'React' remote jobs across live feeds...");
  const onlineRes = await aggregator.search({
    mode: "online",
    query: "React",
    category: "tech",
    provider: "all",
    forceRefresh: true,
  });

  console.log(`[Online Result] Total fetched: ${onlineRes.totalFetched}, Deduplicated: ${onlineRes.qualifiedCount}`);
  console.log(`[Online Result] Sources queried: ${onlineRes.sourcesQueried?.join(", ")}`);
  if (onlineRes.leads.length > 0) {
    const sample = onlineRes.leads[0] as any;
    console.log(`[Sample Job] "${sample.title}" at "${sample.company}" (${sample.source})`);
    console.log(`[Sample URL] ${sample.url}`);
    console.log(`[Sample Location] ${sample.location} | Remote: ${sample.isRemote} | RemoteType: ${sample.remoteType}`);
    console.log(`[Sample Provenance] SourceType: ${sample.sourceType}, Verified: ${sample.verificationStatus}, Score: ${sample.dataQualityScore}`);
  }

  // 2. Test Kenya / Africa Remote Search
  console.log("\n[Test 2] Searching Africa & Kenya accessible remote jobs...");
  const africaRes = await aggregator.search({
    mode: "online",
    query: "Developer",
    provider: "africa",
    forceRefresh: true,
  });
  console.log(`[Africa Result] Total: ${africaRes.qualifiedCount} jobs`);
  if (africaRes.leads.length > 0) {
    const sample = africaRes.leads[0] as any;
    console.log(`[Sample Africa Job] "${sample.title}" at "${sample.company}"`);
  }

  // 3. Test Physical Business Search via OSM
  console.log("\n[Test 3] Searching Physical Businesses (Plumbers in Nairobi, Kenya)...");
  const physRes = await aggregator.search({
    mode: "physical",
    niche: "Plumbers",
    country: "Kenya",
    city: "Nairobi",
    provider: "osm",
    forceRefresh: true,
  });

  console.log(`[Physical Result] Total fetched: ${physRes.totalFetched}, Qualified: ${physRes.qualifiedCount}`);
  if (physRes.leads.length > 0) {
    const sample = physRes.leads[0] as any;
    console.log(`[Sample Business] "${sample.businessName}" | Phone: ${sample.phoneFormatted} (${sample.phoneStatus})`);
    console.log(`[Sample Address] ${sample.address}`);
    console.log(`[Sample Source] ${sample.sourceProvider} | URL: ${sample.sourceUrl}`);
  }

  console.log("\n==================================================");
  console.log("LIVE VERIFICATION COMPLETE");
  console.log("==================================================\n");
}

runLiveVerification().catch(console.error);
