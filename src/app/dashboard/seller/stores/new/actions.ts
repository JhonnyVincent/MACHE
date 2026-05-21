"use server";

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

export async function createStoreAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const keywordsRaw = String(formData.get("keywords") || "").trim();

  if (!name || !category) {
    redirect("/dashboard/seller/stores/new?error=missing_fields");
  }

  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login?next=/dashboard/seller/stores/new");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  const role = String(profile?.role || "").trim();

  if (!["seller_individual", "seller_business", "official_brand"].includes(role)) {
    redirect("/login?error=not_seller");
  }

  const baseSlug = createSlug(name);
  const slug = `${baseSlug}-${Date.now().toString().slice(-5)}`;

  const keywords = keywordsRaw
    ? keywordsRaw
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    : [];

  const { data: store, error } = await supabase
    .from("stores")
    .insert({
      owner_id: userData.user.id,
      name,
      slug,
      seller_type: role,
      category,
      description,
      keywords,
      is_active: true,
      is_verified: false,
    })
    .select("id")
    .single();

  if (error || !store) {
    redirect(`/dashboard/seller/stores/new?error=${encodeURIComponent(error?.message || "store_create_failed")}`);
  }

  redirect(`/dashboard/seller/stores/${store.id}`);
}
