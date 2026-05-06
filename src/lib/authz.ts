import { UserRole } from "@/types";

export type AppRole =
  | "super_admin"
  | "admin"
  | "buyer"
  | "seller_individual"
  | "seller_business"
  | "agent"
  | "partner";

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
  return role === "seller_individual" || role === "seller_business";
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
    return role === "seller_individual" || role === "seller_business";
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
