"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function createSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 48);
}

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
    "supplier",
    "official_brand",
    "agent",
  ];

  const safeRole = allowedRoles.includes(role) ? role : "buyer";

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: safeRole,
      },
       emailRedirectTo: "https://mache-two.vercel.app/auth/callback",
    },
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
      created_at: new Date().toISOString(),
    });

    const isSellerRole =
      safeRole === "seller_individual" ||
      safeRole === "seller_business" ||
      safeRole === "supplier" ||
      safeRole === "official_brand";

    if (isSellerRole) {
      const baseSlug = createSlug(fullName || email.split("@")[0]);
      const slug = `${baseSlug || "boutique"}-${data.user.id.slice(0, 6)}`;

      await supabase.from("stores").upsert(
        {
          owner_id: data.user.id,
          slug,
          name: fullName,
          description: "Boutique officielle sur Maché.",
          seller_type: safeRole,
          logo_url: "/images/logo-haiti-mache-hibiscus.png",
          banner_url:
            "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1800&auto=format&fit=crop",
          city: "Port-au-Prince",
          country: "Haïti",
          is_verified: false,
          is_active: true,
          marketplace_enabled: true,
          saas_enabled: safeRole !== "seller_individual",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "owner_id",
        }
      );
    }
  }

  redirect("/register/success");
}
