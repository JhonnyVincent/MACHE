"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/login?error=missing_fields");
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error || !data.user) {
    // 🔴 Message clair pour user
    redirect("/login?error=invalid_credentials");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (!profile) {
    redirect("/login?error=profile_not_found");
  }

  if (profile.role === "buyer") redirect("/dashboard/buyer");

  if (
    profile.role === "seller_individual" ||
    profile.role === "seller_business"
  ) {
    redirect("/dashboard/seller");
  }

  if (profile.role === "agent") redirect("/dashboard/agent");
  if (profile.role === "admin") redirect("/dashboard/admin");

  redirect("/");
}
