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
    console.error("LOGIN ERROR:", error);
    redirect("/login?error=invalid_credentials");
  }

  // 🔥 IMPORTANT : vérifie si profil existe
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle(); // ✅ au lieu de .single()

  // ✅ Si pas de profil → client par défaut
  if (!profile || profileError) {
    redirect("/dashboard/buyer");
  }

  // 🎯 REDIRECTIONS PAR ROLE
  if (profile.role === "buyer") {
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

  // fallback
  redirect("/");
}
