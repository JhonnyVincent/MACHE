import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardRedirectPage() {
  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();

  // ❌ pas connecté → login
  if (!userData.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  // ⚠️ sécurité si profil introuvable
  if (!profile) {
    redirect("/dashboard/buyer");
  }

  // ✅ SELLER
  if (
    profile.role === "seller_individual" ||
    profile.role === "seller_business"
  ) {
    redirect("/dashboard/seller");
  }

  // ✅ AGENT
  if (profile.role === "agent") {
    redirect("/dashboard/agent");
  }

  // ✅ ADMIN
  if (profile.role === "admin") {
    redirect("/dashboard/admin");
  }

  // ✅ DEFAULT
  redirect("/dashboard/buyer");
}
