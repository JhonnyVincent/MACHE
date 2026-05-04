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

  if (!profile) {
    redirect("/dashboard/buyer");
  }

  if (
    profile.role === "seller_individual" ||
    profile.role === "seller_business"
  ) {
    redirect("/dashboard/seller");
  }

  if (profile.role === "agent") {
    redirect("/dashboard/agent");
  }

  if (profile.role === "admin") {
    redirect("/dashboard/admin");
  }

  redirect("/dashboard/buyer");
}
