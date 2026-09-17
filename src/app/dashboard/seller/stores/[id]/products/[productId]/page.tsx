/*
  PAGE : Espace vendeur — fiche d'un produit

  Sert à :
  - modifier le produit ;
  - voir son état de publication et ce qu'il a réellement vendu ;
  - le retirer.

  Le produit est chargé avec store_id ET seller_id dans la requête : un
  identifiant d'URL ne prouve rien, et un vendeur ne doit jamais ouvrir la
  fiche d'un produit qui n'est pas le sien.
*/

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStoreOwner, formatHTG, formatNumber, formatDate } from "@/lib/seller";
import { PRODUCT_STATUS_LABELS, PRODUCT_STATUS_TONES, intentOfStatus } from "@/lib/products";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, Notice, Stat, StatRow, FormFeedback,
} from "@/components/seller/ui";
import { ProductForm } from "@/components/seller/product-form";
import { updateProductAction, deleteProductAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; productId: string }>;
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const { id, productId } = await params;
  const query = searchParams ? await searchParams : {};
  const { supabase, store, uid } = await requireStoreOwner(id);

  const { data: product } = await supabase
    .from("products")
    .select("id, title, slug, description, price, stock, status, category, image_urls, image_url, rejection_reason, created_at, updated_at")
    .eq("id", productId)
    .eq("store_id", store.id)
    .eq("seller_id", uid)
    .maybeSingle();

  if (!product) notFound();

  /* Ce que ce produit a réellement vendu, d'après les lignes de commande. */
  const { data: soldLines } = await supabase
    .from("order_items")
    .select("quantity, subtotal, seller_amount")
    .eq("product_id", product.id)
    .limit(1000);

  const lines = soldLines ?? [];
  const unitsSold = lines.reduce((sum, line) => sum + (line.quantity ?? 0), 0);
  const revenue = lines.reduce((sum, line) => sum + (line.subtotal ?? 0), 0);
  const net = lines.reduce((sum, line) => sum + (line.seller_amount ?? 0), 0);

  const images = Array.isArray(product.image_urls) && product.image_urls.length
    ? (product.image_urls as string[])
    : product.image_url
      ? [String(product.image_url)]
      : [];

  const status = String(product.status);
  const publicHandle = product.slug || product.id;

  return (
    <>
      <PageHeader
        title={product.title}
        subtitle={store.name?.trim() || "Boutique"}
        actions={
          <>
            {["active", "auto_approved"].includes(status) && (
              <Button href={`/product/${publicHandle}`}>Voir la fiche publique</Button>
            )}
            <Button href={`/dashboard/seller/stores/${store.id}/products`}>
              Retour au catalogue
            </Button>
          </>
        }
      />

      <div className="space-y-4">
        <FormFeedback
          success={query.success}
          error={query.error}
          successMessages={{
            created: "Produit créé. Vérifiez sa fiche avant de le laisser en ligne.",
            updated: "Le produit a été mis à jour.",
          }}
        />

        {status === "rejected" && (
          <Notice tone="danger" title="Produit refusé par la modération">
            {product.rejection_reason ||
              "Aucun motif n'a été enregistré. Corrigez la fiche puis remettez-la en ligne."}
          </Notice>
        )}

        {["manual_review", "submitted"].includes(status) && (
          <Notice tone="warning" title="En cours d'examen">
            Ce produit n&apos;est pas encore visible des clients. L&apos;équipe
            MACHÉ l&apos;examine ; une boutique vérifiée réduit ce délai.
          </Notice>
        )}

        <StatRow>
          <Stat
            label="État"
            value={PRODUCT_STATUS_LABELS[status] || status}
            tone={["active", "auto_approved"].includes(status) ? "success" : "warning"}
          />
          <Stat
            label="Stock"
            value={formatNumber(product.stock ?? 0)}
            tone={(product.stock ?? 0) <= 0 ? "danger" : "default"}
          />
          <Stat label="Vendus" value={formatNumber(unitsSold)} />
          <Stat label="Chiffre d'affaires" value={formatHTG(revenue)} />
          <Stat label="Net vendeur" value={formatHTG(net)} tone="success" />
        </StatRow>

        <Panel title="Fiche du produit">
          <ProductForm
            action={updateProductAction}
            hidden={{ store_id: store.id, product_id: product.id }}
            defaults={{
              title: product.title,
              slug: product.slug || "",
              description: product.description || "",
              category: product.category || "",
              price: product.price ?? null,
              stock: product.stock ?? 0,
              imageUrls: images,
              intent: intentOfStatus(status),
            }}
            submitLabel="Enregistrer les modifications"
            storeVerified={Boolean(store.is_verified)}
          />
        </Panel>

        <Panel title="Historique" padded={false}>
          <Table
            columns={[
              { key: "k", label: "Élément" },
              { key: "v", label: "Valeur" },
            ]}
          >
            <Row>
              <Cell strong>Créé le</Cell>
              <Cell muted>{formatDate(product.created_at)}</Cell>
            </Row>
            <Row>
              <Cell strong>Dernière modification</Cell>
              <Cell muted>{formatDate(product.updated_at)}</Cell>
            </Row>
            <Row>
              <Cell strong>Statut en base</Cell>
              <Cell>
                <Badge tone={PRODUCT_STATUS_TONES[status] || "neutral"}>
                  {PRODUCT_STATUS_LABELS[status] || status}
                </Badge>
              </Cell>
            </Row>
            <Row>
              <Cell strong>Adresse publique</Cell>
              <Cell muted>/product/{publicHandle}</Cell>
            </Row>
          </Table>
        </Panel>

        <Panel title="Retirer ce produit">
          <div className="max-w-2xl space-y-3">
            <p className="text-[12.5px] leading-relaxed text-[#565959]">
              {unitsSold > 0 ? (
                <>
                  Ce produit a déjà été commandé {formatNumber(unitsSold)} fois.
                  Il ne sera donc pas supprimé mais <strong>archivé</strong> :
                  il disparaît du site public, et vos acheteurs gardent leur
                  commande, leur suivi et leur droit de déposer un avis.
                </>
              ) : (
                <>
                  Ce produit n&apos;a jamais été commandé : il sera réellement
                  supprimé. Cette action est définitive.
                </>
              )}{" "}
              Pour le retirer temporairement, préférez{" "}
              <span className="font-medium text-[#0f1111]">« Mettre en pause »</span>{" "}
              dans le formulaire ci-dessus.
            </p>

            <form action={deleteProductAction}>
              <input type="hidden" name="store_id" value={store.id} />
              <input type="hidden" name="product_id" value={product.id} />
              <Button type="submit">
                {unitsSold > 0 ? "Archiver ce produit" : "Supprimer ce produit"}
              </Button>
            </form>
          </div>
        </Panel>

        <p className="text-[11.5px] text-[#767676]">
          <Link
            href={`/dashboard/seller/stores/${store.id}/ads`}
            className="text-[#d2162c] hover:underline"
          >
            Vérifier ce qui manque à vos fiches produit
          </Link>
        </p>
      </div>
    </>
  );
}
