import { UserRole } from "@/types";

export function canAccessDashboard(role: UserRole, dashboardRole: string) {
  if (role === "admin") return true;

  if (dashboardRole === "buyer") return role === "buyer";

  if (dashboardRole === "seller") {
    return role === "seller_individual" || role === "seller_business";
  }

  if (dashboardRole === "agent") return role === "agent";

  return false;
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
