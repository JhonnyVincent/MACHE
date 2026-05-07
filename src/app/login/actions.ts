"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const sellerRoles = [
  "seller_individual",
  "seller_business",
  "supplier",
  "official_brand",
];

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "").trim();

  if (!email || !password) {
    redirect("/login?error=missing_fields");
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    console.error("LOGIN ERROR:", error);
    redirect("/login?error=invalid_credentials");
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile || profileError) {
    redirect("/dashboard/buyer");
  }

  const isSeller = sellerRoles.includes(profile.role);

  if (next === "/dashboard/seller" && isSeller) {
    redirect("/dashboard/seller");
  }

  if (next === "/dashboard/seller" && !isSeller) {
    redirect("/login?error=Ce compte n'est pas un compte vendeur.");
  }

  if (profile.role === "buyer") {
    redirect("/dashboard/buyer");
  }

  if (isSeller) {
    redirect("/dashboard/seller");
  }

  if (profile.role === "agent") {
    redirect("/dashboard/agent");
  }

  if (profile.role === "admin" || profile.role === "super_admin") {
    redirect("/dashboard/admin");
  }

  redirect("/");
}
