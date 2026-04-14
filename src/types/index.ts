export type UserRole =
  | "buyer"
  | "seller_individual"
  | "seller_business"
  | "agent"
  | "admin";

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
  images: string[];
  vendorName: string;
  category: string;
  description: string;
  rating: number;
  reviewCount: number;
  status: ProductStatus;
  featured?: boolean;
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
