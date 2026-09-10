import { UserRole } from "@/types";

export type AppRole =
  | "super_admin"
  | "admin"
  | "buyer"
  | "seller_individual"
  | "seller_business"
  | "supplier"
  | "official_brand"
  | "agent"
  | "partner";

/*
  Liste de référence des rôles vendeurs.

  Elle était dupliquée dans trois fichiers avec trois contenus différents :
  login/actions.ts acceptait `supplier`, le dashboard vendeur non, et
  l'aiguillage /dashboard reconnaissait les rôles contenant "seller" —
  donc ni `supplier` ni `official_brand`. Selon la page atteinte, un même
  compte était vendeur ou ne l'était pas.
*/
export const SELLER_ROLES = [
  "seller_individual",
  "seller_business",
  "supplier",
  "official_brand",
] as const;

export type SellerRole = (typeof SELLER_ROLES)[number];

export function isSellerRole(role?: string | null): role is SellerRole {
  return (SELLER_ROLES as readonly string[]).includes(String(role || "").trim());
}

export type AdminPermission =
  | "manage_users"
  | "manage_admins"
  | "manage_permissions"
  | "manage_vendors"
  | "manage_partners"
  | "manage_agents"
  | "manage_products"
  | "manage_orders"
  | "manage_widgets"
  | "manage_theme"
  | "manage_banners"
  | "approve_accounts"
  | "ban_users"
  | "view_reports";

export const SUPER_ADMIN_LIMIT = 2;

export function isSuperAdmin(role?: string | null) {
  return role === "super_admin";
}

export function isAdmin(role?: string | null) {
  return role === "admin" || role === "super_admin";
}

export function isSeller(role?: string | null) {
  return isSellerRole(role);
}

export function isPartner(role?: string | null) {
  return role === "partner";
}

export function isAgent(role?: string | null) {
  return role === "agent";
}

export function canAccessDashboard(role: UserRole | AppRole, dashboardRole: string) {
  if (role === "super_admin") return true;

  if (role === "admin") {
    return dashboardRole === "admin";
  }

  if (dashboardRole === "buyer") return role === "buyer";

  if (dashboardRole === "seller") {
    return isSellerRole(role);
  }

  if (dashboardRole === "agent") return role === "agent";

  if (dashboardRole === "partner") return role === "partner";

  return false;
}

export function canAccessAdminSection(params: {
  role?: string | null;
  permissions?: string[];
  required: AdminPermission;
}) {
  if (params.role === "super_admin") return true;
  if (params.role !== "admin") return false;

  return params.permissions?.includes(params.required) ?? false;
}

export function computeProductPublicationStatus(input: {
  vendorVerified: boolean;
  documentsValid: boolean;
  categoryAllowed: boolean;
  requiredFieldsComplete: boolean;
  anomalyDetected: boolean;
}) {
  const canAutoApprove =
    input.vendorVerified &&
    input.documentsValid &&
    input.categoryAllowed &&
    input.requiredFieldsComplete &&
    !input.anomalyDetected;

  return canAutoApprove ? "auto_approved" : "manual_review";
}

export function computeVendorRiskLevel(score: number) {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}
