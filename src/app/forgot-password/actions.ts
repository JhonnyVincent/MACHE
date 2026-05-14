"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  if (!email) {
    redirect("/forgot-password?error=missing_email");
  }

  const supabase = await createSupabaseServerClient();

  const redirectTo = new URL(
    "/auth/callback",
    process.env.NEXT_PUBLIC_SITE_URL
  );

  redirectTo.searchParams.set("next", "/reset-password");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo.toString(),
  });

  if (error) {
    redirect(
      `/forgot-password?error=${encodeURIComponent(error.message)}`
    );
  }

  redirect("/forgot-password?success=check_email");
}
