import { notFound, redirect } from "next/navigation";
import {
  createProductAction,
  deleteProductAction,
  pauseProductAction,
  publishProductAction
} from "./actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteKey = "buyer" | "seller" | "agent" | "admin";

type SellerProduct = {
  id: string;
  title: string;
  price: number;
  category: string | null;
  status: string | null;
  stock: number | null;
  shipping_method: string | null;
};

const dashboardStats = {
  buyer: [
    { label: "Commandes", value: "12" },
    { label: "Wishlist", value: "28" },
    { label: "Messages", value: "6" },
    { label: "Notifications", value: "14" }
  ],
  seller: [
    { label: "Ventes 30j", value: "$0" },
    { label: "Commandes", value: "0" },
    { label: "Balance disponible", value: "$0" },
    { label: "Produits actifs", value: "0" }
  ],
  agent: [],
  admin: []
};

const dashboardConfig: Record<
  RouteKey,
  {
    label: string;
    nav: Array<{ slug: string; label: string }>;
    content: Record<string, { title: string; type?: string; lines?: string[] }>;
  }
> = {
  buyer: {
    label: "Dashboard Buyer",
    nav: [
      { slug: "", label: "Résumé" },
      { slug: "messages", label: "Messages" }
    ],
    content: {
      "": { title: "Résumé du compte" },
      messages: { title: "Messages" }
    }
  },

  seller: {
    label: "Dashboard Seller",
    nav: [
      { slug: "", label: "Résumé" },
      { slug: "products", label: "Products" },
      { slug: "products/new", label: "New Product" }
    ],
    content: {
      "": { title: "Résumé vendeur", type: "seller_home" },
      products: { title: "Mes produits", type: "seller_products" },
      "products/new": { title: "Ajouter un produit", type: "seller_ai_form" }
    }
  },

  agent: { label: "", nav: [], content: {} },
  admin: { label: "", nav: [], content: {} }
};

function getShippingLabel(method: string | null) {
  if (method === "mache") return "Livraison Maché";
  if (method === "partner") return "Livraison partenaire";
  return "Livraison vendeur";
}

function SellerSection({
  type,
  products = []
}: {
  type?: string;
  products?: SellerProduct[];
}) {
  if (type === "seller_home") {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-bold">Bienvenue vendeur</h3>

        <div className="mt-6 flex gap-3">
          <a href="/dashboard/seller/products/new" className="btn-primary">
            Ajouter produit
          </a>

          <a href="/dashboard/seller/products" className="btn-secondary">
            Voir produits
          </a>
        </div>
      </div>
    );
  }

  if (type === "seller_products") {
    return (
      <div className="grid gap-4">
        {products.map((p) => (
          <div key={p.id} className="card p-4">
            <h3>{p.title}</h3>
            <p>${p.price}</p>

            <div className="mt-3">
              {p.status !== "active" ? (
                <form action={publishProductAction}>
                  <input type="hidden" name="product_id" value={p.id} />
                  <button className="btn-primary">Publier</button>
                </form>
              ) : (
                <form action={pauseProductAction}>
                  <input type="hidden" name="product_id" value={p.id} />
                  <button className="btn-secondary">Pause</button>
                </form>
              )}

              <form action={deleteProductAction}>
                <input type="hidden" name="product_id" value={p.id} />
                <button className="text-red-500">Supprimer</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "seller_ai_form") {
    return (
      <form action={createProductAction} className="card p-6 space-y-4">
        <input name="title" placeholder="Nom produit" className="input" />
        <input name="price" placeholder="Prix" type="number" className="input" />
        <button className="btn-primary">Créer</button>
      </form>
    );
  }

  return null;
}

export default async function DashboardRoute({
  params
}: {
  params: Promise<{ role: string; section?: string[] }>;
}) {
  const { role, section = [] } = await params;
  const safeRole = role as RouteKey;

  if (!dashboardConfig[safeRole]) notFound();

  // 🔥 FIX PRINCIPAL (LE PROBLÈME QUE TU AVAIS)
  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  // 🔴 SI SELLER → FORCE DASHBOARD SELLER
  if (
    safeRole === "buyer" &&
    (profile?.role === "seller_individual" ||
      profile?.role === "seller_business")
  ) {
    redirect("/dashboard/seller");
  }

  const key = section.join("/");
  const page =
    dashboardConfig[safeRole].content[key] ??
    dashboardConfig[safeRole].content[""];

  let sellerProducts: SellerProduct[] = [];

  if (safeRole === "seller") {
    const { data } = await supabase
      .from("products")
      .select("id,title,price,category,status,stock,shipping_method")
      .eq("seller_id", userData.user.id);

    sellerProducts = data || [];
  }

  return (
    <main className="container-page py-10">
      <h1 className="text-3xl font-bold">{page.title}</h1>

      {safeRole === "seller" && page.type ? (
        <SellerSection type={page.type} products={sellerProducts} />
      ) : (
        <p>Dashboard buyer</p>
      )}
    </main>
  );
}
