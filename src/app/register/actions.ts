"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function registerAction(formData: FormData) {
  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();
  const role = String(formData.get("role") || "buyer").trim();

  if (!fullName || !email || !password) {
    redirect("/register?error=missing_fields");
  }

  const supabase = await createSupabaseServerClient();

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://mache-two.vercel.app"
  ).replace(/\/$/, "");

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      data: {
        full_name: fullName,
        role
      }
    }
  });

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/register/success");
}
