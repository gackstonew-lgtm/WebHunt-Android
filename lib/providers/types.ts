import { PhysicalLead, PhysicalSearchParams, PhysicalProviderType } from "../types";

export interface IPhysicalLeadProvider {
  name: string;
  providerKey: PhysicalProviderType;
  isConfigured(): boolean;
  search(params: PhysicalSearchParams): Promise<PhysicalLead[]>;
}

