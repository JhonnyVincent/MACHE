"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function createSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function registerAction(formData: FormData) {
  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();
  const role = String(formData.get("role") || "buyer").trim();

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
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
    const slug = createSlug(fullName);

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
