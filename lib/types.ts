export type LeadMode = 'physical' | 'online';

export type PipelineStatus = 
  | 'NEW' 
  | 'QUALIFIED'
  | 'CONTACTED' 
  | 'INTERESTED' 
  | 'NEGOTIATION'
  | 'CLOSED' 
  | 'NOT_INTERESTED'
  | 'SAVED'
  | 'PREPARING'
  | 'APPLIED'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'WITHDRAWN';

export type PhysicalProviderType = 'osm' | 'google' | 'yelp' | 'foursquare' | 'all';
export type OnlineProviderType = 'remotive' | 'arbeitnow' | 'himalayas' | 'weworkremotely' | 'jobspresso' | 'remoteok' | 'africa' | 'all';

export type WebsiteConfidence = 'High' | 'Medium' | 'Verified';

export type RemoteType = 'worldwide' | 'regional' | 'country_specific' | 'hybrid' | 'onsite';

export type VerificationStatus = 'SOURCE_LISTED' | 'VERIFIED' | 'UNAVAILABLE';

export type JobCategory = 
  | 'all'
  | 'tech'
  | 'freelance'
  | 'ai_data'
  | 'writing'
  | 'design'
  | 'virtual_assistant'
  | 'customer_support'
  | 'transcription'
  | 'testing'
  | 'microtasks'
  | 'africa';

export type ContactType = 'phone' | 'email' | 'whatsapp' | 'social' | 'contact_page' | 'booking_page';

export type SocialPlatform = 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'youtube' | 'tiktok' | 'telegram' | 'other';

export type ContactSource = 'provider_api' | 'osm_tag' | 'official_website' | 'structured_data' | 'public_directory';

export interface DiscoveredContact {
  type: ContactType;
  value: string;
  formattedValue?: string;
  platform?: SocialPlatform;
  label?: string;
  source: ContactSource;
  sourceUrl?: string | null;
  verified: boolean;
  status?: 'syntax_valid' | 'source_verified' | 'unverified';
}

export interface SocialProfiles {
  facebook?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  telegram?: string | null;
  [key: string]: string | null | undefined;
}

export interface EnrichedLeadContacts {
  phones: DiscoveredContact[];
  emails: DiscoveredContact[];
  whatsapp: DiscoveredContact[];
  socials: DiscoveredContact[];
  contactPages: DiscoveredContact[];
  bookingPages: DiscoveredContact[];
  
  primaryPhone: string;
  primaryPhoneFormatted?: string;
  primaryEmail?: string | null;
  primaryWhatsApp?: string | null;
  primaryContactPage?: string | null;
  primaryBookingPage?: string | null;
  hasContactForm?: boolean;
  socialProfiles: SocialProfiles;
  lastEnrichedAt?: string | Date;
}

export interface PhysicalLead {
  id: string;
  type: 'physical';
  businessName: string;
  phone: string;
  phoneFormatted: string;
  phoneStatus?: 'verified' | 'source_listed' | 'unavailable';
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country: string;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  category?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  hasWebsite: boolean;
  websiteUrl?: string | null;
  noWebsiteConfidence: WebsiteConfidence | string;
  sourceProvider: string;
  sourceUrl?: string | null;
  sourceType?: string | null;
  providerPlaceId?: string | null;
  status: PipelineStatus;
  estimatedValue: number;
  notes?: string | null;
  tags?: string | string[] | null;
  relevanceScore?: number | null;
  dataQualityScore?: number | null;
  verificationStatus?: VerificationStatus;
  
  // Enriched Contact Channels
  email?: string | null;
  emails?: string[];
  whatsapp?: string | null;
  contactPageUrl?: string | null;
  bookingUrl?: string | null;
  hasContactForm?: boolean;
  socialProfiles?: SocialProfiles;
  contacts?: DiscoveredContact[];
  enrichment?: EnrichedLeadContacts;

  retrievedAt?: string | Date;
  lastVerifiedAt?: string | Date | null;
  contactedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface OnlineJobLead {
  id: string;
  type: 'online';
  title: string;
  company: string;
  companyLogo?: string | null;
  location: string;
  country?: string | null;
  isRemote: boolean;
  remoteType?: RemoteType;
  category?: string | null;
  tags: string[];
  url: string;
  postedDate: string;
  salary?: string | null;
  source: string; // 'remotive' | 'arbeitnow' | 'himalayas' | 'weworkremotely' | 'jobspresso' | 'remoteok' | 'africa'
  sourceId?: string | null;
  sourceUrl?: string | null;
  sourceType?: string | null;
  descriptionSnippet?: string;
  status: PipelineStatus;
  estimatedValue: number;
  notes?: string | null;
  relevanceScore?: number | null;
  dataQualityScore?: number | null;
  verificationStatus?: VerificationStatus;

  // Enriched Contact Channels
  email?: string | null;
  emails?: string[];
  whatsapp?: string | null;
  contactPageUrl?: string | null;
  bookingUrl?: string | null;
  hasContactForm?: boolean;
  socialProfiles?: SocialProfiles;
  contacts?: DiscoveredContact[];
  enrichment?: EnrichedLeadContacts;

  retrievedAt?: string | Date;
  lastVerifiedAt?: string | Date | null;
  contactedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export type LeadItem = PhysicalLead | OnlineJobLead;

export interface PhysicalSearchParams {
  mode: 'physical';
  niche: string;
  country: string;
  city?: string;
  locationQuery?: string;
  radius?: number;
  provider?: PhysicalProviderType;
  industryIds?: string[];
  selectedIndustries?: Array<{ id: string; name: string }>;
  maxResults?: number;
  forceRefresh?: boolean;
}

export interface OnlineSearchParams {
  mode: 'online';
  query: string;
  category?: string;
  country?: string;
  provider?: OnlineProviderType;
  industryIds?: string[];
  selectedIndustries?: Array<{ id: string; name: string }>;
  maxResults?: number;
  forceRefresh?: boolean;
}

export type SearchParams = PhysicalSearchParams | OnlineSearchParams;

export interface SearchResult {
  mode: LeadMode;
  query: string;
  location: string;
  provider: string;
  totalFetched: number;
  qualifiedCount: number;
  fromCache: boolean;
  sourcesQueried?: string[];
  failedSources?: string[];
  leads: LeadItem[];
}
