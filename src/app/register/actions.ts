"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function createSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function registerAction(formData: FormData) {
  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();
  const role = String(formData.get("role") || "buyer").trim();

  if (!fullName || !email || !password) {
    redirect("/register?error=missing_fields");
  }

  const headersList = await headers();
  const origin = headersList.get("origin") || "https://mache-two.vercel.app";

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/register/success`,
      data: {
        full_name: fullName,
        role,
      },
    },
  });

  if (error || !data.user) {
    redirect(`/register?error=${encodeURIComponent(error?.message || "signup_error")}`);
  }

  await supabase.from("users").upsert({
    id: data.user.id,
    email,
    full_name: fullName,
    role,
  });

  const isSeller =
    role === "seller_individual" ||
    role === "seller_business";

  if (isSeller) {
    const slug = createSlug(fullName || email.split("@")[0]);

    await supabase.from("stores").upsert({
      owner_id: data.user.id,
      name: fullName,
      slug: `${slug}-${data.user.id.slice(0, 6)}`,
      seller_type: role,
      description: "Boutique officielle sur Maché",
      is_active: true,
    });
  }

  redirect("/login?message=account_created");
}
