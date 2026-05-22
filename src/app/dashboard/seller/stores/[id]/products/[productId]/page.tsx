/*
  PAGE : CMS produit vendeur

  Sert à :
  - Modifier complètement un produit du store
  - Changer titre, slug, prix, stock, catégorie, description, statut
  - Gérer plusieurs images avec image_urls
  - Voir le produit public
  - Supprimer le produit
*/

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateProductAction, deleteProductAction } from "./actions";

function formatHTG(value: number) {
  return `${Number(value || 0).toLocaleString("fr-FR")} HTG`;
}

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; productId: string }>;
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  const { id, productId } = await params;
  const query = searchParams ? await searchParams : {};

  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(`/login?next=/dashboard/seller/stores/${id}/products/${productId}`);
  }

  const uid = userData.user.id;

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, slug, owner_id")
    .eq("id", id)
    .eq("owner_id", uid)
    .single();

  if (!store) {
    redirect("/dashboard/seller/stores?error=store_introuvable");
  }

  const { data: product } = await supabase
    .from("products")
    .select(`
      id,
      title,
      slug,
      description,
      price,
      stock,
      status,
      category,
      image_urls,
      seller_id,
      store_id,
      created_at
    `)
    .eq("id", productId)
    .eq("store_id", store.id)
    .eq("seller_id", uid)
    .single();

  if (!product) {
    notFound();
  }

  const imageUrlsText = Array.isArray(product.image_urls)
    ? product.image_urls.join("\n")
    : "";

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href={`/dashboard/seller/stores/${store.id}/products`}
            className="text-sm font-bold text-[#0053c6]"
          >
            ← Retour aux produits
          </Link>

          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#07152f]">
            Modifier le produit
          </h1>

          <p className="mt-2 text-gray-500">
            CMS produit de la boutique : {store.name}
          </p>
        </div>

        <div className="flex gap-3">
          {product.slug ? (
            <Link
              href={`/product/${product.slug}`}
              target="_blank"
              className="rounded-xl border border-[#e7eaf1] bg-white px-5 py-3 text-sm font-black"
            >
              Voir public
            </Link>
          ) : null}

          <Link
            href={`/dashboard/seller/stores/${store.id}/products/new`}
            className="rounded-xl bg-[#061a36] px-5 py-3 text-sm font-black text-white"
          >
            + Nouveau produit
          </Link>
        </div>
      </div>

      {query.success ? (
        <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
          Produit mis à jour avec succès.
        </div>
      ) : null}

      {query.error ? (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          Erreur : {query.error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-[#e7eaf1] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-[#07152f]">
            Informations produit
          </h2>

          <form action={updateProductAction} className="mt-6 space-y-5">
            <input type="hidden" name="store_id" value={store.id} />
            <input type="hidden" name="product_id" value={product.id} />

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Nom du produit">
                <input
                  name="title"
                  defaultValue={product.title || ""}
                  required
                  className="input"
                  placeholder="Ex : Sac artisanal haïtien"
                />
              </Field>

              <Field label="Slug public">
                <input
                  name="slug"
                  defaultValue={product.slug || ""}
                  className="input"
                  placeholder="sac-artisanal-haitien"
                />
              </Field>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Prix HTG">
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={product.price || 0}
                  className="input"
                />
              </Field>

              <Field label="Stock">
                <input
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={product.stock || 0}
                  className="input"
                />
              </Field>

              <Field label="Statut">
                <select
                  name="status"
                  defaultValue={product.status || "draft"}
                  className="input"
                >
                  <option value="draft">Brouillon</option>
                  <option value="active">Actif</option>
                  <option value="paused">En pause</option>
                  <option value="rejected">Refusé</option>
                </select>
              </Field>
            </div>

            <Field label="Catégorie">
              <select
                name="category"
                defaultValue={product.category || ""}
                className="input"
              >
                <option value="">Choisir une catégorie</option>
                <option value="artisanat">Artisanat</option>
                <option value="mode">Mode</option>
                <option value="beaute">Beauté</option>
                <option value="maison">Maison</option>
                <option value="saveurs">Saveurs</option>
                <option value="electronique">Électronique</option>
                <option value="services">Services</option>
              </select>
            </Field>

            <Field label="Description">
              <textarea
                name="description"
                defaultValue={product.description || ""}
                rows={8}
                className="input resize-none"
                placeholder="Décrivez le produit, la matière, l’origine, les détails importants..."
              />
            </Field>

            <Field label="Images du produit">
              <textarea
                name="image_urls"
                defaultValue={imageUrlsText}
                rows={5}
                className="input resize-none"
                placeholder="Une URL par ligne. Exemple : https://..."
              />

              <p className="mt-2 text-xs text-gray-500">
                Pour l’instant : URL une par ligne. Ensuite on branchera l’upload téléphone/PC avec Supabase Storage.
              </p>
            </Field>

            <div className="flex flex-wrap gap-3 border-t border-[#e7eaf1] pt-5">
              <button className="rounded-xl bg-[#e31837] px-6 py-3 text-sm font-black text-white">
                Enregistrer les modifications
              </button>

              <Link
                href={`/dashboard/seller/stores/${store.id}/products`}
                className="rounded-xl border border-[#e7eaf1] bg-white px-6 py-3 text-sm font-black"
              >
                Annuler
              </Link>
            </div>
          </form>
        </section>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-[#e7eaf1] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">Aperçu produit</h2>

            <div className="mt-5 overflow-hidden rounded-2xl bg-gray-100">
              {product.image_urls?.[0] ? (
                <img
                  src={product.image_urls[0]}
                  alt={product.title}
                  className="h-56 w-full object-cover"
                />
              ) : (
                <div className="flex h-56 items-center justify-center text-5xl">
                  📦
                </div>
              )}
            </div>

            <h3 className="mt-4 text-xl font-black">{product.title}</h3>

            <p className="mt-2 text-2xl font-black text-[#e31837]">
              {formatHTG(product.price || 0)}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                {product.category || "Non classé"}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${
                  product.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {product.status === "active" ? "Actif" : product.status}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${
                  Number(product.stock || 0) <= 5
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                Stock {product.stock || 0}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-red-700">
              Zone dangereuse
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Supprimer ce produit le retirera définitivement de la boutique.
            </p>

            <form action={deleteProductAction} className="mt-4">
              <input type="hidden" name="store_id" value={store.id} />
              <input type="hidden" name="product_id" value={product.id} />

              <button className="w-full rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white">
                Supprimer le produit
              </button>
            </form>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-[#07152f]">
        {label}
      </span>

      {children}
    </label>
  );
}
