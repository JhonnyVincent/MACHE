"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getSellerUser() {
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

  return {
    supabase,
    userId: userData.user.id,
    role: profile.role
  };
}

export async function createProductAction(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const price = Number(formData.get("price"));
  const category = String(formData.get("category") || "").trim();

  if (!title || !price || price <= 0) {
    redirect("/dashboard/seller/products/new?error=missing_fields");
  }

  const { supabase, userId } = await getSellerUser();

  const { error } = await supabase.from("products").insert({
    seller_id: userId,
    title,
    description,
    price,
    category,
    status: "draft",
    featured_priority: 0,
    is_sponsored: false,
    sales_count: 0
  });

  if (error) {
    redirect(
      `/dashboard/seller/products/new?error=${encodeURIComponent(error.message)}`
    );
  }

  redirect("/dashboard/seller/products?success=product_created");
}

export async function publishProductAction(formData: FormData) {
  const productId = String(formData.get("product_id") || "").trim();

  if (!productId) {
    redirect("/dashboard/seller/products?error=missing_product");
  }

  const { supabase, userId } = await getSellerUser();

  const { error } = await supabase
    .from("products")
    .update({ status: "active" })
    .eq("id", productId)
    .eq("seller_id", userId);

  if (error) {
    redirect(`/dashboard/seller/products?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard/seller/products?success=product_published");
}

export async function pauseProductAction(formData: FormData) {
  const productId = String(formData.get("product_id") || "").trim();

  if (!productId) {
    redirect("/dashboard/seller/products?error=missing_product");
  }

  const { supabase, userId } = await getSellerUser();

  const { error } = await supabase
    .from("products")
    .update({ status: "paused" })
    .eq("id", productId)
    .eq("seller_id", userId);

  if (error) {
    redirect(`/dashboard/seller/products?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard/seller/products?success=product_paused");
}

export async function deleteProductAction(formData: FormData) {
  const productId = String(formData.get("product_id") || "").trim();

  if (!productId) {
    redirect("/dashboard/seller/products?error=missing_product");
  }

  const { supabase, userId } = await getSellerUser();

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("seller_id", userId);

  if (error) {
    redirect(`/dashboard/seller/products?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard/seller/products?success=product_deleted");
}
