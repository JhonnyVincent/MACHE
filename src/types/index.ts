/*
  FICHIER : Types globaux MACHÉ

  Sert à :
  - Définir les types principaux utilisés dans tout le projet
  - Éviter les erreurs TypeScript
  - Garder une structure propre pour UserRole, Product, AgentProfile, etc.
  - Permettre au site de comprendre les produits venant :
    1. de l’ancien système avec "images"
    2. du nouveau système Supabase avec "image_urls"

  Important :
  - "images" = ancien format utilisé dans mock-data
  - "image_urls" = nouveau format Supabase pour plusieurs images produit
*/

export type UserRole =
  | "buyer"
  | "seller_individual"
  | "seller_business"
  | "supplier"
  | "official_brand"
  | "agent"
  | "admin"
  | "super_admin";

export type ProductStatus =
  | "draft"
  | "submitted"
  | "auto_approved"
  | "manual_review"
  | "active"
  | "rejected"
  | "paused"
  | "archived";

export type PaymentStatus =
  | "pending"
  | "requires_action"
  | "authorized"
  | "paid"
  | "failed"
  | "refunded"
  | "partially_refunded"
  | "cancelled"
  | "cash_on_delivery";

export interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  stock: number;

  // Ancien système : utilisé par les produits mock/local
  images: string[];

  // Nouveau système : utilisé par Supabase pour plusieurs images produit
  image_urls?: string[];

  vendorName: string;
  category: string;
  description: string;
  rating: number;
  reviewCount: number;
  status: ProductStatus;

  // Produit prioritaire / sponsorisé
  featured?: boolean;
  isSponsored?: boolean;

  variants?: Array<{ id: string; name: string; value: string }>;
}

export interface AgentProfile {
  code: string;
  fullName: string;
  zone: string;
  status: "active" | "suspended" | "expired";
  validUntil: string;
  avatar: string;
  officialBadge: boolean;
}
