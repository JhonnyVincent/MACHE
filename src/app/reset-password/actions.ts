"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured, AUTH_UNAVAILABLE_MESSAGE } from "@/lib/supabase/env";

export async function resetPasswordAction(formData: FormData) {
  const password = String(formData.get("password") || "").trim();
  const confirmPassword = String(formData.get("confirm_password") || "").trim();

  if (!password || !confirmPassword) {
    redirect("/reset-password?error=missing_fields");
  }

  if (password.length < 8) {
    redirect("/reset-password?error=password_too_short");
  }

  if (password !== confirmPassword) {
    redirect("/reset-password?error=passwords_not_match");
  }

  if (!supabaseConfigured()) {
    redirect(`/reset-password?error=${encodeURIComponent(AUTH_UNAVAILABLE_MESSAGE)}`);
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?message=password_updated");
}
