import { AgentProfile, Product } from "@/types";

export const featuredProducts: Product[] = [
  {
    id: "p1",
    slug: "robe-artisanale-haiti",
    title: "Robe artisanale Haïti",
    price: 79,
    compareAtPrice: 99,
    currency: "USD",
    stock: 18,
    images: [
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1200&auto=format&fit=crop"
    ],
    vendorName: "Atelier Soleil",
    category: "Mode",
    description:
      "Pièce artisanale premium conçue pour une clientèle locale et internationale.",
    rating: 4.8,
    reviewCount: 134,
    status: "active",
    featured: true,
    variants: [
      { id: "v1", name: "Taille", value: "M" },
      { id: "v2", name: "Couleur", value: "Rouge terre" }
    ]
  },
  {
    id: "p2",
    slug: "cafe-premium-caribe",
    title: "Café premium des Caraïbes",
    price: 18,
    currency: "USD",
    stock: 92,
    images: [
      "https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1200&auto=format&fit=crop"
    ],
    vendorName: "Mache Export",
    category: "Épicerie",
    description: "Sélection premium pour la diaspora et l’export.",
    rating: 4.7,
    reviewCount: 89,
    status: "active",
    featured: true
  },
  {
    id: "p3",
    slug: "sac-cuir-caribe",
    title: "Sac cuir Caraïbe",
    price: 120,
    compareAtPrice: 149,
    currency: "USD",
    stock: 7,
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop"
    ],
    vendorName: "Maison Diaspora",
    category: "Accessoires",
    description: "Sac structuré, premium, durable et prêt pour l’export.",
    rating: 4.9,
    reviewCount: 41,
    status: "active",
    featured: true
  }
];

export const allProducts: Product[] = [
  ...featuredProducts,
  {
    id: "p4",
    slug: "epices-creoles-selection",
    title: "Épices créoles sélection",
    price: 14,
    currency: "USD",
    stock: 120,
    images: [
      "https://images.unsplash.com/photo-1509358271058-acd22cc93898?q=80&w=1200&auto=format&fit=crop"
    ],
    vendorName: "Saveurs Lakay",
    category: "Cuisine",
    description: "Pack d’épices pour cuisine haïtienne et caribéenne.",
    rating: 4.6,
    reviewCount: 23,
    status: "active"
  },
  {
    id: "p5",
    slug: "tableau-art-naif-haiti",
    title: "Tableau art naïf Haïti",
    price: 210,
    currency: "USD",
    stock: 4,
    images: [
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=1200&auto=format&fit=crop"
    ],
    vendorName: "Galerie Kreyol",
    category: "Art",
    description: "Œuvre décorative pour marché local et diaspora.",
    rating: 4.9,
    reviewCount: 12,
    status: "active"
  }
];

export const agents: AgentProfile[] = [
  {
    code: "MCH-AG-1024",
    fullName: "Jean Marc Joseph",
    zone: "Port-au-Prince / Delmas",
    status: "active",
    validUntil: "2026-12-31",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop",
    officialBadge: true
  },
  {
    code: "MCH-AG-4421",
    fullName: "Nadia Pierre",
    zone: "Cap-Haïtien",
    status: "suspended",
    validUntil: "2026-03-01",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop",
    officialBadge: true
  }
];

export const featuredVendors = [
  {
    name: "Atelier Soleil",
    kind: "Seller Business",
    rating: 4.8,
    verified: true,
    region: "Port-au-Prince"
  },
  {
    name: "Maison Diaspora",
    kind: "Seller Individual",
    rating: 4.7,
    verified: true,
    region: "Montréal"
  },
  {
    name: "Mache Export",
    kind: "Platform Store",
    rating: 4.9,
    verified: true,
    region: "Miami"
  }
];
