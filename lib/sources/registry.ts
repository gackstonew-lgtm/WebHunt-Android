export type IntegrationStatus = 
  | 'ACTIVE_API'
  | 'ACTIVE_FEED'
  | 'REQUIRES_API_KEY'
  | 'REQUIRES_PARTNER_ACCESS'
  | 'AUTHORIZED_CRAWL'
  | 'UNAVAILABLE_BY_POLICY'
  | 'DEPRECATED';

export interface SourceDefinition {
  id: string;
  name: string;
  category: 
    | 'business_directory'
    | 'remote_jobs'
    | 'freelance'
    | 'tech_development'
    | 'ai_data_tasks'
    | 'writing'
    | 'design'
    | 'virtual_assistant'
    | 'customer_support'
    | 'transcription'
    | 'testing_research'
    | 'microtasks'
    | 'kenya_africa';
  integrationMethod: 'REST_API' | 'RSS_FEED' | 'JSON_FEED' | 'PARTNER_API' | 'MANUAL_PORTAL';
  status: IntegrationStatus;
  authRequirement: 'NONE' | 'API_KEY' | 'OAUTH2' | 'PARTNER_CONTRACT' | 'NONE_PUBLIC';
  geographicCoverage: 'WORLDWIDE' | 'AFRICA_KENYA' | 'US_NORTH_AMERICA' | 'EUROPE' | 'REGIONAL';
  supportedData: string[];
  attributionRequirements: string;
  termsSummary: string;
  websiteUrl: string;
  apiUrl?: string;
  notes: string;
}

export const SOURCE_REGISTRY: SourceDefinition[] = [
  // =========================================================================
  // 1. BUSINESS DIRECTORIES & GEODATA
  // =========================================================================
  {
    id: 'osm_overpass',
    name: 'OpenStreetMap Overpass API',
    category: 'business_directory',
    integrationMethod: 'REST_API',
    status: 'ACTIVE_API',
    authRequirement: 'NONE_PUBLIC',
    geographicCoverage: 'WORLDWIDE',
    supportedData: ['Business Name', 'Category', 'Address', 'Phone', 'Coordinates', 'Tags'],
    attributionRequirements: 'OpenStreetMap contributors under ODbL license',
    termsSummary: 'Free global geodata with reasonable rate limits and cached requests.',
    websiteUrl: 'https://www.openstreetmap.org',
    apiUrl: 'https://overpass-api.de/api/interpreter',
    notes: 'Primary zero-key global business discovery engine with Nominatim geocoding.',
  },
  {
    id: 'google_places',
    name: 'Google Places API (New)',
    category: 'business_directory',
    integrationMethod: 'REST_API',
    status: 'REQUIRES_API_KEY',
    authRequirement: 'API_KEY',
    geographicCoverage: 'WORLDWIDE',
    supportedData: ['Business Name', 'Phone', 'Address', 'Rating', 'Review Count', 'Website Uri'],
    attributionRequirements: 'Google Maps Platform Attribution',
    termsSummary: 'Commercial Places API; requires GOOGLE_PLACES_API_KEY in server environment.',
    websiteUrl: 'https://developers.google.com/maps/documentation/places/web-service',
    apiUrl: 'https://places.googleapis.com/v1/places:searchText',
    notes: 'Enabled automatically when GOOGLE_PLACES_API_KEY is configured in .env.',
  },
  {
    id: 'yelp_fusion',
    name: 'Yelp Fusion API',
    category: 'business_directory',
    integrationMethod: 'REST_API',
    status: 'REQUIRES_API_KEY',
    authRequirement: 'API_KEY',
    geographicCoverage: 'WORLDWIDE',
    supportedData: ['Business Name', 'Phone', 'Address', 'Rating', 'Review Count', 'Categories'],
    attributionRequirements: 'Yelp Branding and Attribution Guidelines',
    termsSummary: 'Free tier up to 5,000 requests/day with API Key.',
    websiteUrl: 'https://www.yelp.com/developers',
    apiUrl: 'https://api.yelp.com/v3/businesses/search',
    notes: 'Enabled automatically when YELP_API_KEY is configured in .env.',
  },
  {
    id: 'foursquare_places',
    name: 'Foursquare Places API',
    category: 'business_directory',
    integrationMethod: 'REST_API',
    status: 'REQUIRES_API_KEY',
    authRequirement: 'API_KEY',
    geographicCoverage: 'WORLDWIDE',
    supportedData: ['Place Name', 'Address', 'Phone', 'Categories', 'Coordinates'],
    attributionRequirements: 'Powered by Foursquare',
    termsSummary: 'Requires Developer Account and FOURSQUARE_API_KEY.',
    websiteUrl: 'https://location.foursquare.com/developer/',
    apiUrl: 'https://api.foursquare.com/v3/places/search',
    notes: 'Enabled automatically when FOURSQUARE_API_KEY is configured in .env.',
  },

  // =========================================================================
  // 2. REMOTE JOBS & GLOBAL MARKETPLACES
  // =========================================================================
  {
    id: 'remotive',
    name: 'Remotive Public Jobs API',
    category: 'remote_jobs',
    integrationMethod: 'REST_API',
    status: 'ACTIVE_API',
    authRequirement: 'NONE_PUBLIC',
    geographicCoverage: 'WORLDWIDE',
    supportedData: ['Job Title', 'Company', 'Category', 'Tags', 'Candidate Location', 'Apply URL', 'Salary'],
    attributionRequirements: 'Powered by Remotive Public API',
    termsSummary: 'Free public developer endpoint without authentication; cached per hour.',
    websiteUrl: 'https://remotive.com',
    apiUrl: 'https://remotive.com/api/remote-jobs',
    notes: 'High reliability worldwide remote opportunities across software, support, writing, design, and marketing.',
  },
  {
    id: 'arbeitnow',
    name: 'Arbeitnow Job Board API',
    category: 'remote_jobs',
    integrationMethod: 'REST_API',
    status: 'ACTIVE_API',
    authRequirement: 'NONE_PUBLIC',
    geographicCoverage: 'WORLDWIDE',
    supportedData: ['Job Title', 'Company Name', 'Location', 'Remote Status', 'Tags', 'Apply URL'],
    attributionRequirements: 'Jobs provided by Arbeitnow API',
    termsSummary: 'Official free public JSON API for tech and remote employment.',
    websiteUrl: 'https://www.arbeitnow.com',
    apiUrl: 'https://www.arbeitnow.com/api/job-board-api',
    notes: 'Active worldwide and European tech opportunities with visa and remote tags.',
  },
  {
    id: 'himalayas',
    name: 'Himalayas Remote Jobs API',
    category: 'remote_jobs',
    integrationMethod: 'REST_API',
    status: 'ACTIVE_API',
    authRequirement: 'NONE_PUBLIC',
    geographicCoverage: 'WORLDWIDE',
    supportedData: ['Job Title', 'Company Name', 'Category', 'Seniority', 'Compensation', 'Location Restrictions', 'Apply URL'],
    attributionRequirements: 'Source: Himalayas App',
    termsSummary: 'Free public JSON endpoint for verified remote employers.',
    websiteUrl: 'https://himalayas.app',
    apiUrl: 'https://himalayas.app/jobs/api',
    notes: 'Deep company metadata and transparent salary brackets for remote roles.',
  },
  {
    id: 'weworkremotely',
    name: 'We Work Remotely Public Feeds',
    category: 'remote_jobs',
    integrationMethod: 'RSS_FEED',
    status: 'ACTIVE_FEED',
    authRequirement: 'NONE_PUBLIC',
    geographicCoverage: 'WORLDWIDE',
    supportedData: ['Job Title', 'Company', 'Category', 'Description', 'Apply URL', 'PubDate'],
    attributionRequirements: 'We Work Remotely Public RSS',
    termsSummary: 'Public RSS feed distributed by We Work Remotely for syndication.',
    websiteUrl: 'https://weworkremotely.com',
    apiUrl: 'https://weworkremotely.com/categories/remote-programming-jobs.rss',
    notes: 'Leading remote community with dedicated engineering, design, customer support, and writing feeds.',
  },
  {
    id: 'jobspresso',
    name: 'Jobspresso Remote Feed',
    category: 'remote_jobs',
    integrationMethod: 'RSS_FEED',
    status: 'ACTIVE_FEED',
    authRequirement: 'NONE_PUBLIC',
    geographicCoverage: 'WORLDWIDE',
    supportedData: ['Job Title', 'Company', 'Apply Link', 'Snippet', 'Published Date'],
    attributionRequirements: 'Jobspresso Syndication Feed',
    termsSummary: 'Publicly syndicated job listings feed.',
    websiteUrl: 'https://jobspresso.co',
    apiUrl: 'https://jobspresso.co/feed/',
    notes: 'Curated remote opportunities in tech, marketing, customer support, and product.',
  },
  {
    id: 'remoteok',
    name: 'Remote OK Public API',
    category: 'remote_jobs',
    integrationMethod: 'REST_API',
    status: 'ACTIVE_API',
    authRequirement: 'NONE_PUBLIC',
    geographicCoverage: 'WORLDWIDE',
    supportedData: ['Job Title', 'Company', 'Tags', 'Location', 'Apply URL', 'Date'],
    attributionRequirements: 'Remote OK API',
    termsSummary: 'Official public JSON API; rate-limited and cached.',
    websiteUrl: 'https://remoteok.com',
    apiUrl: 'https://remoteok.com/api',
    notes: 'Worldwide developer, AI, design, and writing gigs.',
  },

  // =========================================================================
  // 3. KENYA & AFRICA OPPORTUNITIES
  // =========================================================================
  {
    id: 'africa_jobs_adapter',
    name: 'Africa & Kenya Remote Discovery Adapter',
    category: 'kenya_africa',
    integrationMethod: 'REST_API',
    status: 'ACTIVE_API',
    authRequirement: 'NONE_PUBLIC',
    geographicCoverage: 'AFRICA_KENYA',
    supportedData: ['Job Title', 'Company', 'Region', 'Country (Kenya/Nigeria/SA)', 'Category', 'Apply Link'],
    attributionRequirements: 'Public African Remote Aggregations',
    termsSummary: 'Verified public African remote and tech opportunities.',
    websiteUrl: 'https://webhunt-delta.vercel.app',
    notes: 'Dedicated filter returning remote and regional positions tailored for Kenyan and African professionals.',
  },
  {
    id: 'fuzu',
    name: 'Fuzu Career Portal',
    category: 'kenya_africa',
    integrationMethod: 'MANUAL_PORTAL',
    status: 'REQUIRES_PARTNER_ACCESS',
    authRequirement: 'PARTNER_CONTRACT',
    geographicCoverage: 'AFRICA_KENYA',
    supportedData: ['East African Career Listings'],
    attributionRequirements: 'Fuzu Ltd.',
    termsSummary: 'No public unauthenticated REST API available; requires formal employer/enterprise partner API agreement.',
    websiteUrl: 'https://www.fuzu.com',
    notes: 'Enterprise partner integration pending API authorization.',
  },
  {
    id: 'brightermonday',
    name: 'BrighterMonday Kenya',
    category: 'kenya_africa',
    integrationMethod: 'MANUAL_PORTAL',
    status: 'REQUIRES_PARTNER_ACCESS',
    authRequirement: 'PARTNER_CONTRACT',
    geographicCoverage: 'AFRICA_KENYA',
    supportedData: ['Kenyan & East African Job Postings'],
    attributionRequirements: 'BrighterMonday / The African Talent Company',
    termsSummary: 'Requires recruiter partner API credentials; public automated scraping prohibited by ToS.',
    websiteUrl: 'https://www.brightermonday.co.ke',
    notes: 'Partner API tier required.',
  },

  // =========================================================================
  // 4. FREELANCING & TALENT PLATFORMS
  // =========================================================================
  {
    id: 'upwork',
    name: 'Upwork Global Inc.',
    category: 'freelance',
    integrationMethod: 'PARTNER_API',
    status: 'REQUIRES_PARTNER_ACCESS',
    authRequirement: 'OAUTH2',
    geographicCoverage: 'WORLDWIDE',
    supportedData: ['Freelance Contracts', 'Milestones', 'Job Posts'],
    attributionRequirements: 'Upwork API Terms of Use',
    termsSummary: 'Requires approved Upwork Developer Account and OAuth2 client credentials. Scraping is strictly forbidden by robots.txt and ToS.',
    websiteUrl: 'https://www.upwork.com',
    apiUrl: 'https://developers.upwork.com/',
    notes: 'Direct API key activation supported via enterprise partner program.',
  },
  {
    id: 'fiverr',
    name: 'Fiverr International',
    category: 'freelance',
    integrationMethod: 'PARTNER_API',
    status: 'REQUIRES_PARTNER_ACCESS',
    authRequirement: 'OAUTH2',
    geographicCoverage: 'WORLDWIDE',
    supportedData: ['Gigs', 'Custom Offers'],
    attributionRequirements: 'Fiverr API Terms',
    termsSummary: 'No public open job feed. Requires certified affiliate or enterprise developer partner token.',
    websiteUrl: 'https://www.fiverr.com',
    notes: 'Requires Fiverr Partner Key.',
  },
  {
    id: 'freelancer_com',
    name: 'Freelancer.com API',
    category: 'freelance',
    integrationMethod: 'REST_API',
    status: 'REQUIRES_API_KEY',
    authRequirement: 'OAUTH2',
    geographicCoverage: 'WORLDWIDE',
    supportedData: ['Projects', 'Bids', 'Contests'],
    attributionRequirements: 'Freelancer API Agreement',
    termsSummary: 'Requires Freelancer OAuth token to query project search endpoints.',
    websiteUrl: 'https://www.freelancer.com/api',
    notes: 'OAuth2 integration available with developer token.',
  },

  // =========================================================================
  // 5. AI & DATA TASKS
  // =========================================================================
  {
    id: 'outlier_ai',
    name: 'Outlier.ai / Remotasks',
    category: 'ai_data_tasks',
    integrationMethod: 'MANUAL_PORTAL',
    status: 'REQUIRES_PARTNER_ACCESS',
    authRequirement: 'PARTNER_CONTRACT',
    geographicCoverage: 'WORLDWIDE',
    supportedData: ['AI Training & RLHF Annotation Tasks'],
    attributionRequirements: 'Scale AI / Outlier',
    termsSummary: 'No public unauthenticated API. User accounts are vetted internally; automated crawling blocked by Cloudflare.',
    websiteUrl: 'https://outlier.ai',
    notes: 'Curated direct application portals supported via Africa/Remote feeds.',
  },
  {
    id: 'dataannotation_tech',
    name: 'DataAnnotation.tech',
    category: 'ai_data_tasks',
    integrationMethod: 'MANUAL_PORTAL',
    status: 'REQUIRES_PARTNER_ACCESS',
    authRequirement: 'PARTNER_CONTRACT',
    geographicCoverage: 'WORLDWIDE',
    supportedData: ['AI Evaluation & Coding Tasks'],
    attributionRequirements: 'DataAnnotation Tech',
    termsSummary: 'Direct portal assessment required; no public API feed available.',
    websiteUrl: 'https://www.dataannotation.tech',
    notes: 'Direct portal links provided for applicant onboarding.',
  },
  {
    id: 'prolific',
    name: 'Prolific Academic Research & Data Tasks',
    category: 'ai_data_tasks',
    integrationMethod: 'REST_API',
    status: 'REQUIRES_API_KEY',
    authRequirement: 'API_KEY',
    geographicCoverage: 'WORLDWIDE',
    supportedData: ['Scientific Studies', 'AI Feedback Tasks'],
    attributionRequirements: 'Prolific API',
    termsSummary: 'Requires researcher or participant API key.',
    websiteUrl: 'https://www.prolific.com',
    notes: 'Researcher API available for verified partner accounts.',
  },

  // =========================================================================
  // 6. WRITING, DESIGN, CUSTOMER SUPPORT, TRANSCRIPTION, TESTING, MICROTASKS
  // =========================================================================
  {
    id: 'problogger',
    name: 'ProBlogger Job Board',
    category: 'writing',
    integrationMethod: 'RSS_FEED',
    status: 'ACTIVE_FEED',
    authRequirement: 'NONE_PUBLIC',
    geographicCoverage: 'WORLDWIDE',
    supportedData: ['Content Writing', 'Copywriting', 'SEO Articles', 'Apply Link'],
    attributionRequirements: 'ProBlogger Jobs RSS',
    termsSummary: 'Public RSS feed syndicating freelance and remote writing roles.',
    websiteUrl: 'https://problogger.com/jobs/',
    apiUrl: 'https://problogger.com/jobs/feed/',
    notes: 'Curated writing opportunities aggregated into writing category.',
  },
  {
    id: 'dribbble_jobs',
    name: 'Dribbble Design Opportunities',
    category: 'design',
    integrationMethod: 'REST_API',
    status: 'REQUIRES_PARTNER_ACCESS',
    authRequirement: 'API_KEY',
    geographicCoverage: 'WORLDWIDE',
    supportedData: ['UI/UX Design', 'Brand Identity', 'Product Design'],
    attributionRequirements: 'Dribbble Holdings',
    termsSummary: 'Requires Dribbble Enterprise/Partner API.',
    websiteUrl: 'https://dribbble.com/jobs',
    notes: 'Remote design opportunities queried through Remotive & Himalayas design endpoints.',
  },
  {
    id: 'usertesting',
    name: 'UserTesting / User Interviews',
    category: 'testing_research',
    integrationMethod: 'MANUAL_PORTAL',
    status: 'REQUIRES_PARTNER_ACCESS',
    authRequirement: 'PARTNER_CONTRACT',
    geographicCoverage: 'WORLDWIDE',
    supportedData: ['Usability Testing', 'Product Feedback Sessions'],
    attributionRequirements: 'UserTesting, Inc.',
    termsSummary: 'Closed participant panel; direct sign-up via authenticated platform.',
    websiteUrl: 'https://www.usertesting.com',
    notes: 'Direct application link routed through verified source catalog.',
  },
  {
    id: 'rev_transcription',
    name: 'Rev / TranscribeMe',
    category: 'transcription',
    integrationMethod: 'MANUAL_PORTAL',
    status: 'REQUIRES_PARTNER_ACCESS',
    authRequirement: 'PARTNER_CONTRACT',
    geographicCoverage: 'WORLDWIDE',
    supportedData: ['Audio Transcription', 'Captioning', 'Translation'],
    attributionRequirements: 'Rev.com, Inc.',
    termsSummary: 'Freelancer application portal with transcription skill test.',
    websiteUrl: 'https://www.rev.com/freelancers',
    notes: 'Direct verified onboarding catalog link.',
  },
];

export function getSourcesByCategory(category: string): SourceDefinition[] {
  if (category === 'all') return SOURCE_REGISTRY;
  return SOURCE_REGISTRY.filter((s) => s.category === category);
}

export function getActiveProvidersSummary() {
  const activeApis = SOURCE_REGISTRY.filter((s) => s.status === 'ACTIVE_API' || s.status === 'ACTIVE_FEED');
  const partnerApis = SOURCE_REGISTRY.filter((s) => s.status === 'REQUIRES_PARTNER_ACCESS' || s.status === 'REQUIRES_API_KEY');
  return {
    totalRegistered: SOURCE_REGISTRY.length,
    activeLive: activeApis.length,
    requiresKeyOrPartner: partnerApis.length,
    sources: SOURCE_REGISTRY,
  };
}
