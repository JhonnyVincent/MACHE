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

  const stock = Number(formData.get("stock") || 0);
  const shippingMethod = String(formData.get("shipping_method") || "seller").trim();
  const shippingNote = String(formData.get("shipping_note") || "").trim();

  const imageUrls = Array.from({ length: 10 })
    .map((_, i) => String(formData.get(`image_${i + 1}`) || "").trim())
    .filter((url) => url.length > 0);

  if (!title || !price || price <= 0 || imageUrls.length === 0) {
    redirect("/dashboard/seller/products/new?error=missing_fields");
  }

  if (imageUrls.length > 10) {
    redirect("/dashboard/seller/products/new?error=too_many_images");
  }

  const { supabase, userId } = await getSellerUser();

  const { error } = await supabase.from("products").insert({
    seller_id: userId,
    title,
    description,
    price,
    category,
    status: "draft",

    image_url: imageUrls[0],
    image_urls: imageUrls,
    stock,
    shipping_method: shippingMethod,
    shipping_note: shippingNote,

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
