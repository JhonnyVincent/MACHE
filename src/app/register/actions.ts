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

  const allowedRoles = [
    "buyer",
    "seller_individual",
    "seller_business",
    "agent"
  ];

  const safeRole = allowedRoles.includes(role) ? role : "buyer";

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: safeRole
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    }
  });

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`);
  }

  if (data.user) {
    await supabase.from("users").upsert({
      id: data.user.id,
      full_name: fullName,
      email,
      role: safeRole,
      created_at: new Date().toISOString()
    });
  }

  redirect("/register/success");
}
