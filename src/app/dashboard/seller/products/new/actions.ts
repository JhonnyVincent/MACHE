"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function createProductAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const price = Number(formData.get("price") || 0);
  const stock = Number(formData.get("stock") || 0);
  const category = String(formData.get("category") || "").trim();

  const images = formData.getAll("images") as File[];
  const documentFile = formData.get("document") as File | null;

  if (!name || !description || !price || !category) {
    redirect("/dashboard/seller/products/new?error=missing_fields");
  }

  const validImages = images.filter((file) => file && file.size > 0);

  if (validImages.length === 0) {
    redirect("/dashboard/seller/products/new?error=image_required");
  }

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, slug")
    .eq("owner_id", user.id)
    .single();

  if (storeError || !store) {
    redirect("/dashboard/seller/products/new?error=no_store");
  }

  const imageUrls: string[] = [];

  for (const image of validImages) {
    const extension = image.name.split(".").pop() || "jpg";
    const fileName = `${user.id}/${Date.now()}-${slugify(name)}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, image, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      redirect(
        `/dashboard/seller/products/new?error=${encodeURIComponent(
          uploadError.message
        )}`
      );
    }

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    imageUrls.push(data.publicUrl);
  }

  let pdfUrl: string | null = null;

  if (documentFile && documentFile.size > 0) {
    const extension = documentFile.name.split(".").pop() || "pdf";
    const fileName = `${user.id}/${Date.now()}-${slugify(name)}.${extension}`;

    const { error: documentUploadError } = await supabase.storage
      .from("seller-documents")
      .upload(fileName, documentFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (documentUploadError) {
      redirect(
        `/dashboard/seller/products/new?error=${encodeURIComponent(
          documentUploadError.message
        )}`
      );
    }

    const { data } = supabase.storage
      .from("seller-documents")
      .getPublicUrl(fileName);

    pdfUrl = data.publicUrl;
  }

  const { error: insertError } = await supabase.from("products").insert({
    store_id: store.id,
    name,
    description,
    price,
    stock,
    category,
    image_url: imageUrls[0],
    images: imageUrls,
    pdf_url: pdfUrl,
    status: "published",
  });

  if (insertError) {
    redirect(
      `/dashboard/seller/products/new?error=${encodeURIComponent(
        insertError.message
      )}`
    );
  }

  redirect(`/store/${store.slug}`);
}
