import { IPhysicalLeadProvider } from "./types";
import { PhysicalLead, PhysicalSearchParams } from "../types";

/**
 * DEPRECATED: Isolated offline test stub.
 * In production, WebHunt uses real data providers (OpenStreetMap, Google Places, Yelp, Foursquare).
 */
export class DemoSandboxProvider implements IPhysicalLeadProvider {
  name = "Demo Sandbox Provider (Decommissioned)";
  providerKey = "all" as any;

  isConfigured(): boolean {
    return false; // Decommissioned in production
  }

  async search(params: PhysicalSearchParams): Promise<PhysicalLead[]> {
    console.warn("[DemoSandboxProvider] Demo provider is decommissioned. Real data providers are active.");
    return [];
  }
}
