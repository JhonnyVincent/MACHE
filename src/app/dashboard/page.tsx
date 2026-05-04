import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardRedirectPage() {
  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  const role = String(profile?.role || "buyer").toLowerCase().trim();

  if (
    role === "seller" ||
    role === "seller_individual" ||
    role === "seller_business" ||
    role.includes("seller") ||
    role.includes("vendeur")
  ) {
    redirect("/dashboard/seller");
  }

  if (role === "agent") {
    redirect("/dashboard/agent");
  }

  if (role === "admin") {
    redirect("/dashboard/admin");
  }

  redirect("/dashboard/buyer");
}
