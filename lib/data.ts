export type Category = {
  slug: string;
  name: string;
  icon: string;
  description: string;
};

export type Partner = {
  id: string;
  categorySlug: string;
  businessName: string;
  ownerName: string;
  description: string;
  city: string;
  rating: number;
  jobsCompleted: number;
  isVerified: boolean;
  trustScore: number;
  startingPrice: number;
  phone: string;
};

export const categories: Category[] = [
  {
    slug: "all",
    name: "All Services",
    icon: "🧭",
    description: "Browse all local service partners.",
  },
  {
    slug: "lorry-transport",
    name: "Lorry & Transport",
    icon: "🚚",
    description: "Trucks, mini trucks and goods transport.",
  },
  {
    slug: "advocate",
    name: "Advocates",
    icon: "⚖️",
    description: "Verified legal consultants.",
  },
  {
    slug: "land-broker",
    name: "Land Brokers",
    icon: "📍",
    description: "Trusted land and property brokers.",
  },
  {
    slug: "local-shops",
    name: "Local Shops",
    icon: "🏪",
    description: "Local stores and service shops.",
  },
];

export const partners: Partner[] = [
  {
    id: "p1",
    categorySlug: "lorry-transport",
    businessName: "Ramesh Goods Transport",
    ownerName: "Ramesh Kumar",
    description:
      "Mini lorry and goods transport service for house shifting and shop delivery.",
    city: "Pune",
    rating: 4.8,
    jobsCompleted: 120,
    isVerified: true,
    trustScore: 87,
    startingPrice: 3500,
    phone: "+91 98765 43210",
  },
  {
    id: "p2",
    categorySlug: "lorry-transport",
    businessName: "FastMove Logistics",
    ownerName: "Suresh Patil",
    description:
      "Intercity lorry transport with loading and unloading support.",
    city: "Mumbai",
    rating: 4.6,
    jobsCompleted: 95,
    isVerified: true,
    trustScore: 82,
    startingPrice: 5000,
    phone: "+91 91234 56780",
  },
  {
    id: "p3",
    categorySlug: "advocate",
    businessName: "Sharma Legal Associates",
    ownerName: "Adv. Neha Sharma",
    description:
      "Property, civil and documentation legal advice.",
    city: "Delhi",
    rating: 4.9,
    jobsCompleted: 210,
    isVerified: true,
    trustScore: 91,
    startingPrice: 2000,
    phone: "+91 99887 76655",
  },
  {
    id: "p4",
    categorySlug: "land-broker",
    businessName: "Green Acres Land Consultants",
    ownerName: "Mahesh Verma",
    description:
      "Verified land plots, farmhouse sites and property guidance.",
    city: "Hyderabad",
    rating: 4.5,
    jobsCompleted: 64,
    isVerified: false,
    trustScore: 72,
    startingPrice: 5000,
    phone: "+91 90909 80808",
  },
  {
    id: "p5",
    categorySlug: "local-shops",
    businessName: "City Hardware Store",
    ownerName: "Rakesh Jain",
    description:
      "Hardware, plumbing and electrical materials with local delivery.",
    city: "Nashik",
    rating: 4.7,
    jobsCompleted: 320,
    isVerified: true,
    trustScore: 85,
    startingPrice: 500,
    phone: "+91 98989 77667",
  },
];

export function getFilteredPartners(categorySlug: string, query: string) {
  const q = query.trim().toLowerCase();

  return partners.filter((partner) => {
    const matchesCategory =
      categorySlug === "all" || partner.categorySlug === categorySlug;

    const matchesQuery =
      partner.businessName.toLowerCase().includes(q) ||
      partner.city.toLowerCase().includes(q) ||
      partner.ownerName.toLowerCase().includes(q) ||
      partner.description.toLowerCase().includes(q);

    return matchesCategory && matchesQuery;
  });
}