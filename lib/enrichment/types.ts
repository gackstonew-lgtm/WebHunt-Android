import { 
  ContactType, 
  SocialPlatform, 
  ContactSource, 
  DiscoveredContact, 
  SocialProfiles, 
  EnrichedLeadContacts,
  PhysicalLead,
  OnlineJobLead
} from "../types";

export type { 
  ContactType, 
  SocialPlatform, 
  ContactSource, 
  DiscoveredContact, 
  SocialProfiles, 
  EnrichedLeadContacts 
};

export interface RawExtractedData {
  phones: DiscoveredContact[];
  emails: DiscoveredContact[];
  whatsapp: DiscoveredContact[];
  socials: DiscoveredContact[];
  contactPages: DiscoveredContact[];
  bookingPages: DiscoveredContact[];
  hasContactForm?: boolean;
}

export interface EnrichmentOptions {
  timeoutMs?: number;
  skipCrawl?: boolean;
  forceRefresh?: boolean;
}
