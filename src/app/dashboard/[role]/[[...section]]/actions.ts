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

async function getAdminUser() {
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

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    redirect("/");
  }

  return {
    supabase,
    userId: userData.user.id,
    role: profile.role
  };
}

export async function createWidgetAction(formData: FormData) {
  const page = String(formData.get("page") || "home").trim();
  const zone = String(formData.get("zone") || "").trim();
  const type = String(formData.get("type") || "text_block").trim();
  const title = String(formData.get("title") || "").trim();
  const subtitle = String(formData.get("subtitle") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const imageUrl = String(formData.get("image_url") || "").trim();
  const buttonText = String(formData.get("button_text") || "").trim();
  const buttonHref = String(formData.get("button_href") || "").trim();
  const position = Number(formData.get("position") || 0);

  const { supabase, userId } = await getAdminUser();

  const { error } = await supabase.from("site_widgets").insert({
    page,
    zone,
    type,
    title,
    subtitle,
    description,
    image_url: imageUrl || null,
    button_text: buttonText || null,
    button_href: buttonHref || null,
    position,
    is_active: true,
    created_by: userId,
    updated_by: userId
  });

  if (error) {
    redirect(`/dashboard/admin/widgets?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard/admin/widgets?success=widget_created");
}

export async function toggleWidgetAction(formData: FormData) {
  const widgetId = String(formData.get("widget_id") || "").trim();
  const isActive = String(formData.get("is_active")) === "true";

  const { supabase, userId } = await getAdminUser();

  const { error } = await supabase
    .from("site_widgets")
    .update({
      is_active: !isActive,
      updated_by: userId,
      updated_at: new Date().toISOString()
    })
    .eq("id", widgetId);

  if (error) {
    redirect(`/dashboard/admin/widgets?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard/admin/widgets?success=widget_updated");
}

export async function deleteWidgetAction(formData: FormData) {
  const widgetId = String(formData.get("widget_id") || "").trim();

  const { supabase } = await getAdminUser();

  const { error } = await supabase
    .from("site_widgets")
    .delete()
    .eq("id", widgetId);

  if (error) {
    redirect(`/dashboard/admin/widgets?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard/admin/widgets?success=widget_deleted");
}
