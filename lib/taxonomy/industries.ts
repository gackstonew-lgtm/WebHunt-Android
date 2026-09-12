import { IndustryCategory, IndustryDefinition } from "./types";

export const INDUSTRY_CATEGORIES: IndustryCategory[] = [
  {
    id: "construction_home",
    name: "Construction & Home Services",
    icon: "Hammer",
    description: "Plumbing, electrical, roofing, HVAC, landscaping, general contracting, and home maintenance.",
    applicableModes: ["physical"],
  },
  {
    id: "automotive",
    name: "Automotive & Transportation",
    icon: "Car",
    description: "Auto repair, bodywork, detailing, tire shops, parts, dealerships, and logistics.",
    applicableModes: ["physical"],
  },
  {
    id: "food_hospitality",
    name: "Food & Hospitality",
    icon: "Utensils",
    description: "Restaurants, cafes, bakeries, bars, catering, hotels, and vacation rentals.",
    applicableModes: ["physical"],
  },
  {
    id: "healthcare",
    name: "Healthcare & Medical",
    icon: "HeartPulse",
    description: "Dental clinics, medical practices, pharmacies, diagnostic labs, therapy, and veterinary.",
    applicableModes: ["physical", "online"],
  },
  {
    id: "beauty_personal_care",
    name: "Beauty & Personal Care",
    icon: "Scissors",
    description: "Barbershops, hair salons, spas, nail studios, skincare, and wellness centers.",
    applicableModes: ["physical"],
  },
  {
    id: "professional_services",
    name: "Professional & Legal Services",
    icon: "Briefcase",
    description: "Accounting, legal firms, auditing, management consulting, and business strategy.",
    applicableModes: ["physical", "online"],
  },
  {
    id: "technology",
    name: "Technology & Software",
    icon: "Cpu",
    description: "Software engineering, cloud, DevOps, AI, cybersecurity, and IT support.",
    applicableModes: ["physical", "online"],
  },
  {
    id: "retail_commerce",
    name: "Retail & Local Commerce",
    icon: "ShoppingBag",
    description: "Electronics, clothing, supermarkets, furniture, hardware, and specialty stores.",
    applicableModes: ["physical"],
  },
  {
    id: "energy_environment",
    name: "Energy, Solar & Environment",
    icon: "Sun",
    description: "Solar installation, renewable energy, recycling, water treatment, and electrical systems.",
    applicableModes: ["physical", "online"],
  },
  {
    id: "marketing_creative",
    name: "Marketing & Creative",
    icon: "Palette",
    description: "Digital marketing, SEO, branding, graphic design, video, and content creation.",
    applicableModes: ["physical", "online"],
  },
  {
    id: "education",
    name: "Education & Training",
    icon: "GraduationCap",
    description: "Schools, universities, tutoring, vocational training, and e-learning bootcamps.",
    applicableModes: ["physical", "online"],
  },
  {
    id: "real_estate",
    name: "Real Estate & Property",
    icon: "Building",
    description: "Property management, commercial real estate, residential brokerage, and appraisal.",
    applicableModes: ["physical"],
  },
  {
    id: "finance",
    name: "Finance & Banking",
    icon: "Landmark",
    description: "Banking, investment, insurance, fintech, mortgage, and wealth management.",
    applicableModes: ["physical", "online"],
  },
  {
    id: "security_facilities",
    name: "Security & Facility Services",
    icon: "Shield",
    description: "Security companies, CCTV installation, locksmiths, fire safety, and access control.",
    applicableModes: ["physical"],
  },
  {
    id: "events_entertainment",
    name: "Events & Entertainment",
    icon: "Music",
    description: "Event planning, venues, DJ services, wedding coordinators, and equipment rental.",
    applicableModes: ["physical", "online"],
  },
  {
    id: "manufacturing_industrial",
    name: "Manufacturing & Industrial",
    icon: "Factory",
    description: "Industrial manufacturing, electronics, textiles, packaging, and machinery.",
    applicableModes: ["physical"],
  },
  {
    id: "agriculture",
    name: "Agriculture & Agribusiness",
    icon: "Sprout",
    description: "Farming, livestock, horticulture, agricultural technology, and irrigation.",
    applicableModes: ["physical", "online"],
  },
  {
    id: "telecom_media",
    name: "Telecommunications & Media",
    icon: "Radio",
    description: "ISPs, fiber installation, VoIP, data centers, publishing, and broadcasting.",
    applicableModes: ["physical", "online"],
  },
  {
    id: "remote_work_gigs",
    name: "Remote Work & Global Opportunities",
    icon: "Globe",
    description: "Virtual assistance, transcription, software testing, data annotation, and customer support.",
    applicableModes: ["online"],
  },
];

export const INDUSTRY_TAXONOMY: IndustryDefinition[] = [
  // ==========================================
  // 1. CONSTRUCTION & HOME SERVICES
  // ==========================================
  {
    id: "plumbing",
    name: "Plumbers & Plumbing Services",
    categoryId: "construction_home",
    isPopular: true,
    applicableModes: ["physical"],
    aliases: ["plumber", "plumbing", "drain cleaning", "pipe repair", "water heater repair", "emergency plumber", "plumbing contractor"],
    businessTerms: {
      queryTerms: ["plumber", "plumbing contractor", "emergency plumbing", "drain repair"],
      osmTags: [
        { key: "craft", value: "plumber" },
        { key: "shop", value: "plumber" },
        { key: "service", value: "plumbing" },
      ],
      googleTypes: ["plumber", "general_contractor"],
      yelpCategories: ["plumbing"],
      foursquareCategories: ["Plumbing Service"],
    },
    jobTerms: {
      titles: ["Plumber", "Master Plumber", "Plumbing Estimator", "Plumbing Project Manager"],
      keywords: ["piping", "drainage", "plumbing", "water systems"],
    },
  },
  {
    id: "electricians",
    name: "Electricians & Electrical Contractors",
    categoryId: "construction_home",
    isPopular: true,
    applicableModes: ["physical"],
    aliases: ["electrician", "electrical", "wiring", "electrical contractor", "emergency electrician", "lighting installation"],
    businessTerms: {
      queryTerms: ["electrician", "electrical contractor", "electrical services", "wiring contractor"],
      osmTags: [
        { key: "craft", value: "electrician" },
        { key: "shop", value: "electrical" },
      ],
      googleTypes: ["electrician"],
      yelpCategories: ["electricians"],
      foursquareCategories: ["Electrician"],
    },
    jobTerms: {
      titles: ["Electrician", "Electrical Engineer", "Electrical Estimator"],
      keywords: ["wiring", "electrical", "high voltage", "circuits"],
    },
  },
  {
    id: "roofing",
    name: "Roofing Contractors",
    categoryId: "construction_home",
    isPopular: true,
    applicableModes: ["physical"],
    aliases: ["roofing", "roof repair", "roof replacement", "roofing contractor", "gutter installation", "shingle repair"],
    businessTerms: {
      queryTerms: ["roofing contractor", "roof repair", "roofing services", "metal roofing"],
      osmTags: [
        { key: "craft", value: "roofer" },
        { key: "building", value: "roof" },
      ],
      googleTypes: ["roofing_contractor"],
      yelpCategories: ["roofing"],
      foursquareCategories: ["Roofing Contractor"],
    },
    jobTerms: {
      titles: ["Roofer", "Roofing Estimator", "Roofing Superintendent"],
      keywords: ["roofing", "shingles", "commercial roofing"],
    },
  },
  {
    id: "hvac",
    name: "HVAC & Air Conditioning Services",
    categoryId: "construction_home",
    isPopular: true,
    applicableModes: ["physical"],
    aliases: ["hvac", "air conditioning", "heating repair", "ac repair", "ventilation", "heating and cooling", "furnace repair"],
    businessTerms: {
      queryTerms: ["hvac contractor", "air conditioning repair", "heating services", "ac technician"],
      osmTags: [
        { key: "craft", value: "hvac" },
        { key: "craft", value: "electrician" },
      ],
      googleTypes: ["hvac_contractor"],
      yelpCategories: ["hvac"],
      foursquareCategories: ["Heating, Ventilating & Air Conditioning Service"],
    },
    jobTerms: {
      titles: ["HVAC Technician", "HVAC Installer", "HVAC Engineer"],
      keywords: ["refrigeration", "air conditioning", "hvac", "ventilation"],
    },
  },
  {
    id: "landscaping",
    name: "Landscaping & Lawn Care",
    categoryId: "construction_home",
    isPopular: true,
    applicableModes: ["physical"],
    aliases: ["landscaping", "lawn care", "gardening", "tree service", "lawn mowing", "landscape design", "irrigation repair"],
    businessTerms: {
      queryTerms: ["landscaper", "lawn care service", "tree cutting", "gardening service"],
      osmTags: [
        { key: "craft", value: "gardener" },
        { key: "leisure", value: "garden" },
      ],
      googleTypes: ["landscaping", "general_contractor"],
      yelpCategories: ["landscaping", "lawn_services"],
      foursquareCategories: ["Landscaping"],
    },
    jobTerms: {
      titles: ["Landscape Architect", "Groundskeeper", "Landscaping Foreman"],
      keywords: ["horticulture", "irrigation", "lawn care"],
    },
  },
  {
    id: "general_contractors",
    name: "General Contractors & Construction",
    categoryId: "construction_home",
    isPopular: false,
    applicableModes: ["physical"],
    aliases: ["general contractor", "builder", "construction company", "building contractor", "renovation", "remodeling", "civil contractor"],
    businessTerms: {
      queryTerms: ["general contractor", "construction company", "home remodeling", "building contractor"],
      osmTags: [
        { key: "craft", value: "builder" },
        { key: "office", value: "construction" },
      ],
      googleTypes: ["general_contractor"],
      yelpCategories: ["contractors"],
      foursquareCategories: ["Construction"],
    },
    jobTerms: {
      titles: ["Construction Manager", "Site Engineer", "Civil Project Manager", "Estimator"],
      keywords: ["construction", "project management", "building codes"],
    },
  },
  {
    id: "painting_contractors",
    name: "Painting & Decorating Contractors",
    categoryId: "construction_home",
    isPopular: false,
    applicableModes: ["physical"],
    aliases: ["painter", "painting contractor", "house painting", "commercial painting", "interior painting", "exterior painting"],
    businessTerms: {
      queryTerms: ["painting contractor", "house painter", "commercial painter"],
      osmTags: [{ key: "craft", value: "painter" }],
      googleTypes: ["painter"],
      yelpCategories: ["painters"],
      foursquareCategories: ["Painting Service"],
    },
    jobTerms: {
      titles: ["Painter", "Painting Estimator", "Finishing Foreman"],
      keywords: ["painting", "drywall", "coating"],
    },
  },
  {
    id: "flooring_tiling",
    name: "Flooring, Masonry & Tiling",
    categoryId: "construction_home",
    isPopular: false,
    applicableModes: ["physical"],
    aliases: ["flooring", "tiling", "masonry", "hardwood floor", "carpet installation", "tile contractor", "stonework"],
    businessTerms: {
      queryTerms: ["flooring contractor", "tile installer", "masonry contractor", "hardwood installation"],
      osmTags: [
        { key: "craft", value: "tiler" },
        { key: "craft", value: "stonemason" },
        { key: "craft", value: "floorer" },
      ],
      googleTypes: ["general_contractor"],
      yelpCategories: ["flooring"],
      foursquareCategories: ["Flooring Service"],
    },
    jobTerms: {
      titles: ["Flooring Installer", "Tile Setter", "Mason"],
      keywords: ["tiling", "flooring", "masonry"],
    },
  },
  {
    id: "cleaning_pest_control",
    name: "Cleaning & Pest Control Services",
    categoryId: "construction_home",
    isPopular: false,
    applicableModes: ["physical"],
    aliases: ["cleaning service", "maid service", "commercial cleaning", "pest control", "fumigation", "carpet cleaning", "exterminator"],
    businessTerms: {
      queryTerms: ["cleaning service", "pest control", "fumigation services", "office cleaning"],
      osmTags: [
        { key: "craft", value: "cleaning" },
        { key: "shop", value: "dry_cleaning" },
      ],
      googleTypes: ["cleaning_services"],
      yelpCategories: ["homecleaning", "pest_control"],
      foursquareCategories: ["Cleaning Service", "Pest Control"],
    },
    jobTerms: {
      titles: ["Cleaning Supervisor", "Pest Control Specialist"],
      keywords: ["fumigation", "sanitization", "commercial cleaning"],
    },
  },
  {
    id: "locksmith_security_doors",
    name: "Locksmiths & Door Security",
    categoryId: "construction_home",
    isPopular: false,
    applicableModes: ["physical"],
    aliases: ["locksmith", "key cutting", "emergency locksmith", "door lock repair", "safes", "smart lock installation"],
    businessTerms: {
      queryTerms: ["locksmith", "emergency locksmith", "key cutting service"],
      osmTags: [{ key: "craft", value: "locksmith" }, { key: "shop", value: "locksmith" }],
      googleTypes: ["locksmith"],
      yelpCategories: ["locksmiths"],
      foursquareCategories: ["Locksmith"],
    },
    jobTerms: {
      titles: ["Locksmith Technician"],
      keywords: ["locks", "safes", "access control"],
    },
  },

  // ==========================================
  // 2. AUTOMOTIVE & TRANSPORTATION
  // ==========================================
  {
    id: "auto_repair",
    name: "Auto Repair & Mechanics",
    categoryId: "automotive",
    isPopular: true,
    applicableModes: ["physical"],
    aliases: ["auto repair", "car repair", "mechanic", "automotive repair", "vehicle repair", "auto service", "garage", "brake repair", "engine diagnostics"],
    businessTerms: {
      queryTerms: ["auto repair", "car mechanic", "auto service", "car garage"],
      osmTags: [
        { key: "shop", value: "car_repair" },
        { key: "amenity", value: "car_repair" },
      ],
      googleTypes: ["car_repair", "auto_repair"],
      yelpCategories: ["autorepair"],
      foursquareCategories: ["Automotive Repair Shop"],
    },
    jobTerms: {
      titles: ["Automotive Mechanic", "Auto Technician", "Service Advisor", "Diesel Mechanic"],
      keywords: ["diagnostics", "automotive", "mechanic", "engines"],
    },
  },
  {
    id: "auto_body_detailing",
    name: "Auto Body, Paint & Detailing",
    categoryId: "automotive",
    isPopular: false,
    applicableModes: ["physical"],
    aliases: ["auto body", "car detailing", "car wash", "auto paint", "collision repair", "dent removal", "ceramic coating"],
    businessTerms: {
      queryTerms: ["auto body repair", "car detailing", "car wash", "collision center"],
      osmTags: [
        { key: "amenity", value: "car_wash" },
        { key: "shop", value: "car_repair" },
      ],
      googleTypes: ["car_wash", "car_repair"],
      yelpCategories: ["auto_detailing", "carwash", "bodyshops"],
      foursquareCategories: ["Car Wash and Detail"],
    },
    jobTerms: {
      titles: ["Auto Body Technician", "Detailer", "Paint Specialist"],
      keywords: ["detailing", "car wash", "auto painting"],
    },
  },
  {
    id: "tire_shops_parts",
    name: "Tire Shops & Auto Spare Parts",
    categoryId: "automotive",
    isPopular: false,
    applicableModes: ["physical"],
    aliases: ["tire shop", "auto parts", "spare parts", "car batteries", "wheel alignment", "tires", "motor spares"],
    businessTerms: {
      queryTerms: ["tire shop", "auto parts store", "car battery replacement", "spare parts"],
      osmTags: [
        { key: "shop", value: "car_parts" },
        { key: "shop", value: "tyres" },
      ],
      googleTypes: ["auto_parts_store"],
      yelpCategories: ["tires", "autoparts"],
      foursquareCategories: ["Auto Parts and Accessories"],
    },
    jobTerms: {
      titles: ["Parts Specialist", "Tire Technician"],
      keywords: ["auto parts", "tires", "inventory"],
    },
  },
  {
    id: "car_dealerships_rentals",
    name: "Car Dealerships & Vehicle Rental",
    categoryId: "automotive",
    isPopular: false,
    applicableModes: ["physical"],
    aliases: ["car dealership", "used car dealer", "car rental", "vehicle leasing", "car hire", "motorcycle dealer"],
    businessTerms: {
      queryTerms: ["car dealership", "car rental", "used car dealer", "car hire"],
      osmTags: [
        { key: "shop", value: "car" },
        { key: "amenity", value: "car_rental" },
      ],
      googleTypes: ["car_dealer", "car_rental"],
      yelpCategories: ["car_dealers", "carrental"],
      foursquareCategories: ["Car Dealership", "Car Rental"],
    },
    jobTerms: {
      titles: ["Car Sales Executive", "Fleet Manager", "Rental Agent"],
      keywords: ["automotive sales", "leasing", "fleet management"],
    },
  },
  {
    id: "logistics_freight_moving",
    name: "Logistics, Freight & Moving Companies",
    categoryId: "automotive",
    isPopular: false,
    applicableModes: ["physical", "online"],
    aliases: ["logistics", "freight forwarding", "courier", "moving company", "shipping", "warehousing", "dispatch", "delivery service"],
    businessTerms: {
      queryTerms: ["logistics company", "courier service", "moving company", "freight forwarder"],
      osmTags: [
        { key: "amenity", value: "courier" },
        { key: "office", value: "logistics" },
      ],
      googleTypes: ["moving_company"],
      yelpCategories: ["movers", "courierservices"],
      foursquareCategories: ["Moving and Storage", "Courier Service"],
    },
    jobTerms: {
      titles: ["Logistics Coordinator", "Freight Broker", "Supply Chain Analyst", "Dispatcher"],
      keywords: ["logistics", "supply chain", "freight", "fleet management", "dispatch"],
    },
  },

  // ==========================================
  // 3. FOOD & HOSPITALITY
  // ==========================================
  {
    id: "restaurants_cafes",
    name: "Restaurants, Cafes & Bistros",
    categoryId: "food_hospitality",
    isPopular: true,
    applicableModes: ["physical"],
    aliases: ["restaurant", "cafe", "coffee shop", "dining", "bistro", "eatery", "fast food", "grill"],
    businessTerms: {
      queryTerms: ["restaurant", "cafe", "coffee shop", "bistro"],
      osmTags: [
        { key: "amenity", value: "restaurant" },
        { key: "amenity", value: "cafe" },
        { key: "amenity", value: "fast_food" },
      ],
      googleTypes: ["restaurant", "cafe"],
      yelpCategories: ["restaurants", "cafes"],
      foursquareCategories: ["Restaurant", "Cafe"],
    },
    jobTerms: {
      titles: ["Restaurant Manager", "Executive Chef", "Sous Chef", "Food and Beverage Director"],
      keywords: ["hospitality", "culinary", "restaurant management"],
    },
  },
  {
    id: "bakeries_pastry",
    name: "Bakeries & Pastry Shops",
    categoryId: "food_hospitality",
    isPopular: true,
    applicableModes: ["physical"],
    aliases: ["bakery", "bakeries", "pastry shop", "cake bakery", "bread shop", "donuts", "custom cakes"],
    businessTerms: {
      queryTerms: ["bakery", "pastry shop", "custom cake shop"],
      osmTags: [
        { key: "shop", value: "bakery" },
        { key: "shop", value: "pastry" },
      ],
      googleTypes: ["bakery"],
      yelpCategories: ["bakeries"],
      foursquareCategories: ["Bakery"],
    },
    jobTerms: {
      titles: ["Head Baker", "Pastry Chef", "Cake Decorator"],
      keywords: ["baking", "pastry", "culinary arts"],
    },
  },
  {
    id: "catering_event_food",
    name: "Catering & Event Food Services",
    categoryId: "food_hospitality",
    isPopular: false,
    applicableModes: ["physical"],
    aliases: ["catering", "caterer", "wedding catering", "corporate catering", "buffet service", "private chef"],
    businessTerms: {
      queryTerms: ["catering service", "event caterer", "wedding catering"],
      osmTags: [
        { key: "amenity", value: "catering" },
        { key: "craft", value: "caterer" },
      ],
      googleTypes: ["restaurant"],
      yelpCategories: ["catering"],
      foursquareCategories: ["Catering Service"],
    },
    jobTerms: {
      titles: ["Catering Director", "Event Chef", "Banquet Manager"],
      keywords: ["catering", "banquet", "menu planning"],
    },
  },
  {
    id: "hotels_resorts_lodging",
    name: "Hotels, Resorts & Guest Houses",
    categoryId: "food_hospitality",
    isPopular: false,
    applicableModes: ["physical"],
    aliases: ["hotel", "resort", "guest house", "hostel", "motel", "bed and breakfast", "vacation rental", "lodge"],
    businessTerms: {
      queryTerms: ["hotel", "resort", "guest house", "lodge"],
      osmTags: [
        { key: "tourism", value: "hotel" },
        { key: "tourism", value: "guest_house" },
        { key: "tourism", value: "hostel" },
      ],
      googleTypes: ["lodging", "hotel"],
      yelpCategories: ["hotels", "bedbreakfast"],
      foursquareCategories: ["Hotel", "Bed and Breakfast"],
    },
    jobTerms: {
      titles: ["General Manager - Hotel", "Front Desk Supervisor", "Hospitality Coordinator"],
      keywords: ["hotel management", "hospitality", "reservations"],
    },
  },

  // ==========================================
  // 4. HEALTHCARE & MEDICAL
  // ==========================================
  {
    id: "dentistry",
    name: "Dentists & Dental Clinics",
    categoryId: "healthcare",
    isPopular: true,
    applicableModes: ["physical"],
    aliases: ["dentist", "dentists", "dental clinic", "orthodontist", "dental care", "teeth whitening", "dental surgeon", "pediatric dentist"],
    businessTerms: {
      queryTerms: ["dentist", "dental clinic", "orthodontist", "dental surgeon"],
      osmTags: [
        { key: "amenity", value: "dentist" },
        { key: "healthcare", value: "dentist" },
      ],
      googleTypes: ["dentist", "dental_clinic"],
      yelpCategories: ["dentists", "orthodontists"],
      foursquareCategories: ["Dentist's Office"],
    },
    jobTerms: {
      titles: ["Dentist", "Dental Hygienist", "Dental Assistant", "Orthodontist"],
      keywords: ["dentistry", "oral health", "dental care"],
    },
  },
  {
    id: "clinics_hospitals",
    name: "Hospitals, Clinics & Medical Centers",
    categoryId: "healthcare",
    isPopular: false,
    applicableModes: ["physical", "online"],
    aliases: ["clinic", "hospital", "medical center", "doctors office", "physician", "pediatrician", "urgent care", "telemedicine"],
    businessTerms: {
      queryTerms: ["medical clinic", "hospital", "urgent care center", "family doctor"],
      osmTags: [
        { key: "amenity", value: "clinic" },
        { key: "amenity", value: "hospital" },
        { key: "amenity", value: "doctors" },
      ],
      googleTypes: ["hospital", "doctor"],
      yelpCategories: ["medcenters", "physicians", "urgent_care"],
      foursquareCategories: ["Hospital", "Doctor's Office"],
    },
    jobTerms: {
      titles: ["Registered Nurse", "Medical Doctor", "Physician Assistant", "Clinical Coordinator", "Telehealth Nurse"],
      keywords: ["healthcare", "clinical", "nursing", "patient care", "medical"],
    },
  },
  {
    id: "pharmacies",
    name: "Pharmacies & Drug Stores",
    categoryId: "healthcare",
    isPopular: false,
    applicableModes: ["physical"],
    aliases: ["pharmacy", "chemist", "drug store", "pharmaceuticals", "prescription medicine", "apothecary"],
    businessTerms: {
      queryTerms: ["pharmacy", "chemist", "drug store"],
      osmTags: [
        { key: "amenity", value: "pharmacy" },
        { key: "healthcare", value: "pharmacy" },
      ],
      googleTypes: ["pharmacy"],
      yelpCategories: ["pharmacy"],
      foursquareCategories: ["Pharmacy"],
    },
    jobTerms: {
      titles: ["Pharmacist", "Pharmacy Technician"],
      keywords: ["pharmacology", "dispensing", "prescriptions"],
    },
  },
  {
    id: "veterinary",
    name: "Veterinary Clinics & Animal Hospitals",
    categoryId: "healthcare",
    isPopular: false,
    applicableModes: ["physical"],
    aliases: ["vet", "veterinarian", "veterinary clinic", "animal hospital", "pet clinic", "pet doctor"],
    businessTerms: {
      queryTerms: ["veterinary clinic", "animal hospital", "vet clinic"],
      osmTags: [{ key: "amenity", value: "veterinary" }],
      googleTypes: ["veterinary_care"],
      yelpCategories: ["vet"],
      foursquareCategories: ["Veterinarian"],
    },
    jobTerms: {
      titles: ["Veterinarian", "Vet Tech", "Animal Care Specialist"],
      keywords: ["veterinary", "animal care", "pet medicine"],
    },
  },
  {
    id: "therapy_mental_health",
    name: "Therapy, Physiotherapy & Mental Health",
    categoryId: "healthcare",
    isPopular: false,
    applicableModes: ["physical", "online"],
    aliases: ["physiotherapy", "chiropractor", "psychologist", "therapist", "counseling", "mental health", "speech therapy", "rehabilitation"],
    businessTerms: {
      queryTerms: ["physiotherapy clinic", "chiropractor", "mental health counselor", "physical therapist"],
      osmTags: [
        { key: "amenity", value: "clinic" },
        { key: "healthcare", value: "physiotherapist" },
        { key: "healthcare", value: "psychotherapist" },
      ],
      googleTypes: ["physiotherapist"],
      yelpCategories: ["physicaltherapy", "chiropractors", "counselingpsychology"],
      foursquareCategories: ["Physical Therapist", "Counseling and Mental Health"],
    },
    jobTerms: {
      titles: ["Licensed Therapist", "Physical Therapist", "Mental Health Counselor", "Remote Psychologist"],
      keywords: ["counseling", "therapy", "mental health", "rehabilitation"],
    },
  },

  // ==========================================
  // 5. BEAUTY & PERSONAL CARE
  // ==========================================
  {
    id: "barbershops",
    name: "Barbershops & Men's Grooming",
    categoryId: "beauty_personal_care",
    isPopular: true,
    applicableModes: ["physical"],
    aliases: ["barbershop", "barber", "haircut", "men grooming", "beard trim", "shave"],
    businessTerms: {
      queryTerms: ["barbershop", "barber salon", "men haircut"],
      osmTags: [{ key: "shop", value: "hairdresser" }],
      googleTypes: ["barber_shop", "hair_care"],
      yelpCategories: ["barbers"],
      foursquareCategories: ["Barbershop"],
    },
    jobTerms: {
      titles: ["Master Barber", "Barber Stylist"],
      keywords: ["barbering", "grooming", "hair styling"],
    },
  },
  {
    id: "hair_beauty_salons",
    name: "Hair Salons & Beauty Parlors",
    categoryId: "beauty_personal_care",
    isPopular: true,
    applicableModes: ["physical"],
    aliases: ["hair salon", "beauty salon", "hair stylist", "hair braiding", "blowout", "hair coloring"],
    businessTerms: {
      queryTerms: ["hair salon", "beauty parlor", "hair stylist salon"],
      osmTags: [
        { key: "shop", value: "hairdresser" },
        { key: "shop", value: "beauty" },
      ],
      googleTypes: ["hair_care", "beauty_salon"],
      yelpCategories: ["hair", "beautysvc"],
      foursquareCategories: ["Salon and Barbershop"],
    },
    jobTerms: {
      titles: ["Hair Stylist", "Colorist", "Salon Manager"],
      keywords: ["cosmetology", "styling", "hair care"],
    },
  },
  {
    id: "spas_nails_wellness",
    name: "Spas, Nail Salons & Massage",
    categoryId: "beauty_personal_care",
    isPopular: false,
    applicableModes: ["physical"],
    aliases: ["spa", "nail salon", "manicure", "pedicure", "massage parlor", "skincare", "day spa", "waxing"],
    businessTerms: {
      queryTerms: ["spa", "nail salon", "massage therapy center", "day spa"],
      osmTags: [
        { key: "shop", value: "beauty" },
        { key: "amenity", value: "spa" },
        { key: "shop", value: "massage" },
      ],
      googleTypes: ["spa", "beauty_salon"],
      yelpCategories: ["spas", "nailsalons", "massage"],
      foursquareCategories: ["Spa", "Nail Salon", "Massage Clinic"],
    },
    jobTerms: {
      titles: ["Massage Therapist", "Esthetician", "Nail Technician", "Spa Coordinator"],
      keywords: ["skincare", "wellness", "massage therapy"],
    },
  },

  // ==========================================
  // 6. PROFESSIONAL & LEGAL SERVICES
  // ==========================================
  {
    id: "law_firms",
    name: "Law Firms & Legal Services",
    categoryId: "professional_services",
    isPopular: true,
    applicableModes: ["physical", "online"],
    aliases: ["law firm", "lawyer", "attorney", "legal services", "solicitor", "advocate", "notary", "corporate lawyer", "immigration lawyer"],
    businessTerms: {
      queryTerms: ["law firm", "lawyer", "attorney", "legal advocate"],
      osmTags: [
        { key: "office", value: "lawyer" },
        { key: "office", value: "legal" },
      ],
      googleTypes: ["lawyer"],
      yelpCategories: ["lawyers"],
      foursquareCategories: ["Lawyer", "Law Firm"],
    },
    jobTerms: {
      titles: ["Corporate Attorney", "Legal Counsel", "Paralegal", "Contract Specialist", "Legal Researcher"],
      keywords: ["contracts", "legal compliance", "litigation", "corporate law"],
    },
  },
  {
    id: "accounting_tax_audit",
    name: "Accounting, Bookkeeping & Tax Services",
    categoryId: "professional_services",
    isPopular: true,
    applicableModes: ["physical", "online"],
    aliases: ["accounting", "accountant", "bookkeeping", "tax consultant", "cpa", "auditing", "payroll services", "tax return"],
    businessTerms: {
      queryTerms: ["accounting firm", "accountant", "tax consultant", "cpa firm"],
      osmTags: [
        { key: "office", value: "accountant" },
        { key: "office", value: "tax_advisor" },
      ],
      googleTypes: ["accounting"],
      yelpCategories: ["accountants", "taxservices"],
      foursquareCategories: ["Accounting Firm"],
    },
    jobTerms: {
      titles: ["Staff Accountant", "Senior Bookkeeper", "Tax Specialist", "Financial Controller", "Auditor"],
      keywords: ["quickbooks", "xero", "reconciliation", "tax filings", "gaap", "financial statements"],
    },
  },
  {
    id: "business_consulting",
    name: "Management & Business Consulting",
    categoryId: "professional_services",
    isPopular: false,
    applicableModes: ["physical", "online"],
    aliases: ["consulting", "management consulting", "business advisor", "strategy consultant", "hr consulting", "financial consulting"],
    businessTerms: {
      queryTerms: ["business consulting", "management consultant", "strategy advisory firm"],
      osmTags: [
        { key: "office", value: "consulting" },
        { key: "office", value: "company" },
      ],
      googleTypes: ["consultant"],
      yelpCategories: ["businessconsulting"],
      foursquareCategories: ["Business Consulting"],
    },
    jobTerms: {
      titles: ["Management Consultant", "Strategy Lead", "Operations Consultant", "Business Analyst"],
      keywords: ["strategy", "operations", "process optimization", "advisory", "growth"],
    },
  },

  // ==========================================
  // 7. TECHNOLOGY & SOFTWARE
  // ==========================================
  {
    id: "software_development",
    name: "Software & Web Development",
    categoryId: "technology",
    isPopular: true,
    applicableModes: ["physical", "online"],
    aliases: ["software development", "web development", "full stack", "frontend", "backend", "react", "next.js", "node.js", "python", "software company"],
    businessTerms: {
      queryTerms: ["software company", "web development agency", "custom software agency"],
      osmTags: [
        { key: "office", value: "it" },
        { key: "office", value: "software" },
      ],
      googleTypes: ["software_company"],
      yelpCategories: ["webdesign", "it_services"],
      foursquareCategories: ["Software Company", "IT Services"],
    },
    jobTerms: {
      titles: [
        "Software Engineer",
        "Full Stack Developer",
        "Frontend Developer",
        "Backend Developer",
        "React / Next.js Engineer",
        "Python / Django Engineer",
        "Node.js Backend Engineer",
        "Mobile App Developer (React Native / Flutter)",
      ],
      keywords: ["typescript", "react", "next.js", "node.js", "python", "golang", "api", "docker", "aws"],
      category: "tech",
    },
  },
  {
    id: "ai_data_science",
    name: "AI, Machine Learning & Data Science",
    categoryId: "technology",
    isPopular: true,
    applicableModes: ["physical", "online"],
    aliases: ["ai", "machine learning", "data science", "data engineering", "generative ai", "llm", "deep learning", "nlp", "computer vision"],
    businessTerms: {
      queryTerms: ["ai company", "data analytics firm", "machine learning agency"],
      osmTags: [{ key: "office", value: "it" }],
      googleTypes: ["software_company"],
      yelpCategories: ["it_services"],
      foursquareCategories: ["Software Company"],
    },
    jobTerms: {
      titles: [
        "Machine Learning Engineer",
        "Data Scientist",
        "AI Engineer",
        "Data Engineer",
        "LLM Prompt Engineer",
        "AI Data Annotator",
        "Computer Vision Engineer",
      ],
      keywords: ["python", "pytorch", "tensorflow", "sql", "pandas", "llm", "rag", "huggingface", "data pipelines"],
      category: "ai_data",
    },
  },
  {
    id: "cloud_devops_cybersecurity",
    name: "Cloud, DevOps & Cybersecurity",
    categoryId: "technology",
    isPopular: false,
    applicableModes: ["physical", "online"],
    aliases: ["devops", "cloud computing", "cybersecurity", "aws", "azure", "kubernetes", "infosec", "penetration testing", "sre"],
    businessTerms: {
      queryTerms: ["cybersecurity firm", "cloud infrastructure consultant", "managed it security"],
      osmTags: [{ key: "office", value: "it" }],
      googleTypes: ["software_company"],
      yelpCategories: ["it_services"],
      foursquareCategories: ["IT Services"],
    },
    jobTerms: {
      titles: [
        "DevOps Engineer",
        "Site Reliability Engineer (SRE)",
        "Cloud Architect (AWS/GCP)",
        "Cybersecurity Analyst",
        "Information Security Engineer",
      ],
      keywords: ["aws", "kubernetes", "terraform", "ci/cd", "security", "soc2", "linux", "cloudformation"],
      category: "tech",
    },
  },
  {
    id: "ui_ux_product_design",
    name: "UI/UX & Product Design",
    categoryId: "technology",
    isPopular: true,
    applicableModes: ["physical", "online"],
    aliases: ["ui design", "ux design", "product design", "figma", "user research", "web design agency", "interaction design"],
    businessTerms: {
      queryTerms: ["ui ux design agency", "digital product design studio", "web design agency"],
      osmTags: [{ key: "office", value: "graphic_design" }],
      googleTypes: ["graphic_designer"],
      yelpCategories: ["graphicdesign", "webdesign"],
      foursquareCategories: ["Design Studio"],
    },
    jobTerms: {
      titles: ["Product Designer", "UI/UX Designer", "Senior UX Researcher", "Interaction Designer", "Figma Design Specialist"],
      keywords: ["figma", "user research", "wireframing", "prototyping", "design systems", "usability"],
      category: "design",
    },
  },
  {
    id: "qa_software_testing",
    name: "QA & Software Testing",
    categoryId: "technology",
    isPopular: false,
    applicableModes: ["physical", "online"],
    aliases: ["qa", "quality assurance", "software testing", "automation tester", "cypress", "selenium", "manual tester"],
    businessTerms: {
      queryTerms: ["software testing agency", "qa consulting firm"],
      osmTags: [{ key: "office", value: "it" }],
      googleTypes: ["software_company"],
      yelpCategories: ["it_services"],
      foursquareCategories: ["IT Services"],
    },
    jobTerms: {
      titles: ["QA Automation Engineer", "Manual QA Tester", "SDET (Software Development Engineer in Test)", "Performance Tester"],
      keywords: ["playwright", "cypress", "selenium", "jest", "postman", "test automation", "qa"],
      category: "testing",
    },
  },

  // ==========================================
  // 8. ENERGY, SOLAR & ENVIRONMENT
  // ==========================================
  {
    id: "solar_renewable_energy",
    name: "Solar Energy & Renewable Installation",
    categoryId: "energy_environment",
    isPopular: true,
    applicableModes: ["physical", "online"],
    aliases: ["solar", "solar energy", "solar panel installation", "solar equipment", "renewable energy", "inverter repair", "battery storage", "solar consulting"],
    businessTerms: {
      queryTerms: ["solar energy company", "solar panel installation", "solar equipment supplier", "renewable energy contractor"],
      osmTags: [
        { key: "shop", value: "energy" },
        { key: "office", value: "energy_supplier" },
        { key: "craft", value: "electrician" },
      ],
      googleTypes: ["solar_energy_equipment_supplier", "general_contractor"],
      yelpCategories: ["solarenergyinstallation", "solarinstallation"],
      foursquareCategories: ["Solar Energy"],
    },
    jobTerms: {
      titles: ["Solar Installation Technician", "Solar Design Engineer", "Renewable Energy Project Manager", "Energy Auditor"],
      keywords: ["photovoltaic", "pv", "solar", "renewable energy", "inverters", "grid tie"],
    },
  },

  // ==========================================
  // 9. MARKETING & CREATIVE
  // ==========================================
  {
    id: "digital_marketing_seo",
    name: "Digital Marketing, SEO & Ads",
    categoryId: "marketing_creative",
    isPopular: true,
    applicableModes: ["physical", "online"],
    aliases: ["digital marketing", "seo", "sem", "social media marketing", "google ads", "meta ads", "performance marketing", "growth marketing"],
    businessTerms: {
      queryTerms: ["digital marketing agency", "seo agency", "social media marketing agency"],
      osmTags: [
        { key: "office", value: "advertising" },
        { key: "office", value: "marketing" },
      ],
      googleTypes: ["marketing_agency"],
      yelpCategories: ["marketing"],
      foursquareCategories: ["Marketing Agency"],
    },
    jobTerms: {
      titles: [
        "Digital Marketing Manager",
        "SEO Specialist",
        "Growth Marketer",
        "PPC / Google Ads Specialist",
        "Social Media Strategist",
        "Performance Marketing Lead",
      ],
      keywords: ["seo", "google ads", "facebook ads", "analytics", "cro", "growth hacking", "email marketing"],
      category: "marketing",
    },
  },
  {
    id: "content_copywriting",
    name: "Content Writing & Technical Copywriting",
    categoryId: "marketing_creative",
    isPopular: false,
    applicableModes: ["physical", "online"],
    aliases: ["copywriting", "content writer", "technical writer", "blog writing", "ghostwriting", "seo writer", "copy editor"],
    businessTerms: {
      queryTerms: ["content writing agency", "copywriting studio"],
      osmTags: [{ key: "office", value: "publisher" }],
      googleTypes: ["marketing_agency"],
      yelpCategories: ["marketing"],
      foursquareCategories: ["Marketing Agency"],
    },
    jobTerms: {
      titles: [
        "Content Writer",
        "Copywriter",
        "Technical Writer",
        "B2B SaaS Content Marketer",
        "SEO Content Strategist",
      ],
      keywords: ["copywriting", "articles", "technical writing", "editing", "content strategy"],
      category: "writing",
    },
  },
  {
    id: "graphic_video_creative",
    name: "Graphic Design, Video & Photography",
    categoryId: "marketing_creative",
    isPopular: false,
    applicableModes: ["physical", "online"],
    aliases: ["graphic design", "video editing", "photography", "motion graphics", "3d animation", "photo studio", "videography"],
    businessTerms: {
      queryTerms: ["graphic design studio", "photography studio", "video production company"],
      osmTags: [
        { key: "shop", value: "photo" },
        { key: "office", value: "graphic_design" },
      ],
      googleTypes: ["photographer", "graphic_designer"],
      yelpCategories: ["graphicdesign", "photographers"],
      foursquareCategories: ["Photography Studio", "Design Studio"],
    },
    jobTerms: {
      titles: ["Video Editor (Premiere / After Effects)", "Motion Graphics Designer", "Brand Identity Designer", "Creative Director"],
      keywords: ["premiere pro", "after effects", "illustrator", "photoshop", "video editing", "animation"],
      category: "design",
    },
  },

  // ==========================================
  // 10. REMOTE WORK & GLOBAL GIGS
  // ==========================================
  {
    id: "virtual_assistance",
    name: "Virtual Assistance & Administration",
    categoryId: "remote_work_gigs",
    isPopular: true,
    applicableModes: ["online"],
    aliases: ["virtual assistant", "executive assistant", "admin support", "data entry", "scheduling", "email management", "va"],
    businessTerms: {
      queryTerms: ["virtual assistant agency", "administrative services"],
      osmTags: [{ key: "office", value: "administrative" }],
      googleTypes: ["consultant"],
      yelpCategories: ["virtualoffices"],
      foursquareCategories: ["Business Services"],
    },
    jobTerms: {
      titles: [
        "Executive Virtual Assistant",
        "Remote Operations Coordinator",
        "Administrative Assistant",
        "Project Coordinator",
        "Data Entry Specialist",
      ],
      keywords: ["calendar management", "inbox zero", "data entry", "slack", "notion", "google suite", "crm"],
      category: "virtual_assistant",
    },
  },
  {
    id: "customer_support",
    name: "Customer Support & Success",
    categoryId: "remote_work_gigs",
    isPopular: true,
    applicableModes: ["online"],
    aliases: ["customer support", "customer success", "help desk", "live chat agent", "technical support", "zendesk", "intercom"],
    businessTerms: {
      queryTerms: ["call center", "customer support agency"],
      osmTags: [{ key: "office", value: "telecommunication" }],
      googleTypes: ["consultant"],
      yelpCategories: ["businessservices"],
      foursquareCategories: ["Business Services"],
    },
    jobTerms: {
      titles: [
        "Customer Support Representative",
        "Technical Support Specialist",
        "Customer Success Manager (CSM)",
        "Live Chat Support Agent",
        "Helpdesk Tier 1 / 2 Specialist",
      ],
      keywords: ["zendesk", "intercom", "freshdesk", "customer satisfaction", "troubleshooting", "chat support"],
      category: "customer_support",
    },
  },
  {
    id: "transcription_annotation",
    name: "Transcription, Captioning & Audio Review",
    categoryId: "remote_work_gigs",
    isPopular: false,
    applicableModes: ["online"],
    aliases: ["transcription", "transcriptionist", "audio typing", "closed captioning", "medical transcription", "legal transcription"],
    businessTerms: {
      queryTerms: ["transcription services", "audio transcription"],
      osmTags: [{ key: "office", value: "company" }],
      googleTypes: ["consultant"],
      yelpCategories: ["businessservices"],
      foursquareCategories: ["Business Services"],
    },
    jobTerms: {
      titles: [
        "Audio Transcriptionist",
        "Video Captioner",
        "Medical Transcriptionist",
        "Audio Quality Reviewer",
      ],
      keywords: ["transcription", "audio analysis", "wpm", "timestamping", "captioning"],
      category: "transcription",
    },
  },
  {
    id: "africa_kenya_remote",
    name: "Africa & Kenya Remote Opportunities",
    categoryId: "remote_work_gigs",
    isPopular: true,
    applicableModes: ["online"],
    aliases: ["kenya remote", "africa remote", "nairobi remote developer", "african tech gigs", "remote east africa"],
    businessTerms: {
      queryTerms: ["tech hub nairobi", "remote talent kenya"],
      osmTags: [{ key: "office", value: "it" }],
      googleTypes: ["software_company"],
      yelpCategories: ["it_services"],
      foursquareCategories: ["IT Services"],
    },
    jobTerms: {
      titles: [
        "Remote African Software Engineer",
        "Kenya-based Technical Lead",
        "Africa Remote Data Annotator",
        "Nairobi Remote Product Specialist",
      ],
      keywords: ["africa remote", "kenya", "nairobi", "fintech", "mpesa", "emerging markets"],
      category: "africa",
    },
  },

  // ==========================================
  // 11. RETAIL & COMMERCE
  // ==========================================
  {
    id: "supermarkets_groceries",
    name: "Supermarkets & Grocery Stores",
    categoryId: "retail_commerce",
    isPopular: false,
    applicableModes: ["physical"],
    aliases: ["supermarket", "grocery store", "food market", "minimart", "convenience store", "produce market"],
    businessTerms: {
      queryTerms: ["supermarket", "grocery store", "convenience store"],
      osmTags: [
        { key: "shop", value: "supermarket" },
        { key: "shop", value: "convenience" },
        { key: "shop", value: "greengrocer" },
      ],
      googleTypes: ["supermarket", "grocery_or_supermarket"],
      yelpCategories: ["grocery"],
      foursquareCategories: ["Supermarket", "Grocery Store"],
    },
    jobTerms: {
      titles: ["Store Manager", "Inventory Specialist", "Merchandiser"],
      keywords: ["retail", "supermarket", "inventory management"],
    },
  },
  {
    id: "electronics_mobile_shops",
    name: "Electronics, Phones & Computer Shops",
    categoryId: "retail_commerce",
    isPopular: false,
    applicableModes: ["physical"],
    aliases: ["electronics", "mobile phone shop", "computer repair shop", "phone accessories", "laptop repair", "smartphone sales"],
    businessTerms: {
      queryTerms: ["electronics store", "mobile phone shop", "computer repair store"],
      osmTags: [
        { key: "shop", value: "electronics" },
        { key: "shop", value: "mobile_phone" },
        { key: "shop", value: "computer" },
      ],
      googleTypes: ["electronics_store"],
      yelpCategories: ["electronics", "mobilephonerepair"],
      foursquareCategories: ["Electronics Store"],
    },
    jobTerms: {
      titles: ["Electronics Technician", "Store Sales Rep", "Hardware Repair Specialist"],
      keywords: ["micro soldering", "device repair", "electronics"],
    },
  },

  // ==========================================
  // 12. REAL ESTATE & PROPERTY
  // ==========================================
  {
    id: "real_estate_property",
    name: "Real Estate Agencies & Property Management",
    categoryId: "real_estate",
    isPopular: false,
    applicableModes: ["physical"],
    aliases: ["real estate", "realtor", "property management", "estate agent", "apartment rental", "commercial real estate", "property development"],
    businessTerms: {
      queryTerms: ["real estate agency", "property management company", "realtor office"],
      osmTags: [
        { key: "office", value: "estate_agent" },
        { key: "office", value: "property_management" },
      ],
      googleTypes: ["real_estate_agency"],
      yelpCategories: ["realestateagents", "propertymgmt"],
      foursquareCategories: ["Real Estate Office"],
    },
    jobTerms: {
      titles: ["Real Estate Broker", "Property Manager", "Leasing Consultant", "Acquisitions Analyst"],
      keywords: ["real estate", "property management", "leasing", "realtor"],
    },
  },

  // ==========================================
  // 13. EDUCATION & TRAINING
  // ==========================================
  {
    id: "schools_universities_tutoring",
    name: "Schools, Tutoring & Vocational Training",
    categoryId: "education",
    isPopular: false,
    applicableModes: ["physical", "online"],
    aliases: ["school", "university", "college", "tutoring", "vocational training", "language school", "coding bootcamp", "academy"],
    businessTerms: {
      queryTerms: ["private school", "tutoring center", "vocational training college", "academy"],
      osmTags: [
        { key: "amenity", value: "school" },
        { key: "amenity", value: "college" },
        { key: "amenity", value: "university" },
      ],
      googleTypes: ["school", "university"],
      yelpCategories: ["tutoring", "privateschools"],
      foursquareCategories: ["School", "College and University"],
    },
    jobTerms: {
      titles: ["Online Tutor", "Instructional Designer", "Curriculum Developer", "Technical Instructor"],
      keywords: ["curriculum", "pedagogy", "e-learning", "tutoring", "stem"],
    },
  },

  // ==========================================
  // 14. EVENTS & ENTERTAINMENT
  // ==========================================
  {
    id: "event_planning_venues",
    name: "Event Planning, Venues & Entertainment",
    categoryId: "events_entertainment",
    isPopular: false,
    applicableModes: ["physical"],
    aliases: ["event planner", "wedding planner", "event venue", "wedding venue", "dj services", "party equipment rental", "sound system hire"],
    businessTerms: {
      queryTerms: ["event planning company", "wedding venue", "party equipment rental"],
      osmTags: [
        { key: "amenity", value: "events_venue" },
        { key: "office", value: "event_planner" },
      ],
      googleTypes: ["event_venue"],
      yelpCategories: ["eventplanning", "venues"],
      foursquareCategories: ["Event Space"],
    },
    jobTerms: {
      titles: ["Event Coordinator", "Wedding Producer", "Venue Manager"],
      keywords: ["event production", "logistics", "vendor management"],
    },
  },
];
