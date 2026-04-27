"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createProductAction(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const price = Number(formData.get("price"));
  const category = String(formData.get("category") || "").trim();

  if (!title || !price) {
    redirect("/dashboard/seller/products/new?error=missing_fields");
  }

  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (
    !profile ||
    !["seller_individual", "seller_business"].includes(profile.role)
  ) {
    redirect("/");
  }

  const { error } = await supabase.from("products").insert({
    seller_id: userData.user.id,
    title,
    description,
    price,
    category,
    status: "draft"
  });

  if (error) {
    redirect(
      `/dashboard/seller/products/new?error=${encodeURIComponent(error.message)}`
    );
  }

  redirect("/dashboard/seller/products?success=product_created");
}
