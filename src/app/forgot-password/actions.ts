"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured, AUTH_UNAVAILABLE_MESSAGE } from "@/lib/supabase/env";

export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email) {
    redirect("/forgot-password?error=missing_email");
  }

  if (!supabaseConfigured()) {
    redirect(`/forgot-password?error=${encodeURIComponent(AUTH_UNAVAILABLE_MESSAGE)}`);
  }

  const headersList = await headers();
  const origin = headersList.get("origin") || "https://mache-two.vercel.app";

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/forgot-password?success=check_email");
}
