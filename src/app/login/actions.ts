"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();

  if (!email || !password) {
    redirect("/login?error=missing_fields");
  }

  const supabase = await createSupabaseServerClient();

  // 🔐 LOGIN
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  // 🧠 RÉCUPÉRER LE PROFIL
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    redirect("/login?error=profile_not_found");
  }

  // 🚀 REDIRECTION PAR RÔLE
  if (profile.role === "buyer") {
    redirect("/buyer/dashboard");
  }

  if (
    profile.role === "seller_individual" ||
    profile.role === "seller_business"
  ) {
    redirect("/seller/dashboard");
  }

  if (profile.role === "agent") {
    redirect("/agent/dashboard");
  }

  if (profile.role === "admin") {
    redirect("/admin/dashboard");
  }

  // fallback
  redirect("/");
}
