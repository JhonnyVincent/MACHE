/*
  PAGE : Espace vendeur — visibilité des produits d'une boutique

  Sert à :
  - dire ce qui, aujourd'hui, fait réellement remonter un produit sur MACHÉ ;
  - lister les produits dont la fiche est incomplète, avec le lien pour la corriger.

  Il n'y a pas de régie publicitaire sur MACHÉ : aucune table de campagne,
  aucun prestataire de paiement raccordé, aucun tarif arrêté. Plutôt
  qu'afficher un formulaire de campagne qui n'aboutirait nulle part, cette
  page traite le seul levier de visibilité qui existe et qui fonctionne :
  la qualité de la fiche produit.
*/

import { requireStoreOwner, formatNumber } from "@/lib/seller";
import { categoryLabel } from "@/lib/categories";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, EmptyState, Stat, StatRow, Notice, Meter,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

export default async function StoreVisibilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, store } = await requireStoreOwner(id);

  const { data: products, error } = await supabase
    .from("products")
    .select("id, title, price, stock, status, category, description, image_urls, rating_count")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .limit(500);

  const list = products ?? [];

  /*
    Un produit est « prêt à être vu » quand rien ne l'empêche d'apparaître
    ni de convaincre : en ligne, en stock, rangé dans une catégorie,
    illustré et décrit. Chaque manque ci-dessous est un motif concret de
    ne pas être trouvé ou de ne pas être acheté.
  */
  function gapsOf(product: (typeof list)[number]) {
    const gaps: string[] = [];

    if (String(product.status) !== "active") gaps.push("Hors ligne");
    if ((product.stock ?? 0) <= 0) gaps.push("Rupture");
    if (!String(product.category || "").trim()) gaps.push("Sans catégorie");
    if (!Array.isArray(product.image_urls) || product.image_urls.length === 0) {
      gaps.push("Sans image");
    }
    if (String(product.description || "").trim().length < 40) {
      gaps.push("Description trop courte");
    }
    if (!(Number(product.price) > 0)) gaps.push("Sans prix");

    return gaps;
  }

  const withGaps = list
    .map((product) => ({ product, gaps: gapsOf(product) }))
    .filter((entry) => entry.gaps.length > 0)
    .sort((a, b) => b.gaps.length - a.gaps.length);

  const ready = list.length - withGaps.length;

  const countGap = (label: string) =>
    withGaps.filter((entry) => entry.gaps.includes(label)).length;

  const storeGaps: { label: string; done: boolean; href: string; why: string }[] = [
    {
      label: "Boutique ouverte au public",
      done: store.is_active !== false,
      href: `/dashboard/seller/stores/${store.id}/settings`,
      why: "Une boutique fermée ne remonte dans aucune recherche.",
    },
    {
      label: "Catégorie de boutique renseignée",
      done: Boolean(String(store.category || "").trim()),
      href: `/dashboard/seller/stores/${store.id}/store`,
      why: "Sans catégorie, la boutique n'apparaît dans aucune rubrique.",
    },
    {
      label: "Description de la boutique",
      done: String(store.description || "").trim().length >= 40,
      href: `/dashboard/seller/stores/${store.id}/store`,
      why: "La description est lue par les clients et par la recherche interne.",
    },
    {
      label: "Logo et bannière",
      done: Boolean(store.logo_url) && Boolean(store.banner_url),
      href: `/dashboard/seller/stores/${store.id}/customization`,
      why: "Une vitrine sans visuel inspire moins confiance.",
    },
    {
      label: "Boutique vérifiée",
      done: Boolean(store.is_verified),
      href: `/dashboard/seller/stores/${store.id}/documents`,
      why: "Le badge vérifié rassure et débloque certaines catégories.",
    },
  ];

  const storeDone = storeGaps.filter((item) => item.done).length;

  return (
    <>
      <PageHeader
        title="Visibilité"
        subtitle={store.name?.trim() || "Boutique"}
        actions={
          <Button href={`/dashboard/seller/stores/${store.id}/products`}>
            Mes produits
          </Button>
        }
      />

      <div className="space-y-4">
        {error && (
          <Notice tone="warning" title="Produits indisponibles">
            {error.message}
          </Notice>
        )}

        <StatRow>
          <Stat label="Produits" value={formatNumber(list.length)} />
          <Stat
            label="Fiches complètes"
            value={formatNumber(ready)}
            tone={ready === list.length && list.length > 0 ? "success" : "default"}
          />
          <Stat
            label="À corriger"
            value={formatNumber(withGaps.length)}
            tone={withGaps.length ? "warning" : "default"}
          />
          <Stat label="Sans image" value={formatNumber(countGap("Sans image"))} />
          <Stat label="Hors ligne" value={formatNumber(countGap("Hors ligne"))} />
        </StatRow>

        <Notice tone="info" title="Pas de publicité payante sur MACHÉ">
          Aucune régie publicitaire n&apos;est en place : il n&apos;existe ni
          campagne, ni budget, ni tarif de mise en avant, et aucun prestataire
          de paiement n&apos;est raccordé pour les facturer. Mettre en avant un
          produit contre paiement est une décision commerciale qui ne se prend
          pas ici. En attendant, la visibilité d&apos;un produit dépend
          entièrement de sa fiche — c&apos;est ce que cette page mesure.
        </Notice>

        <Panel
          title="État de la vitrine"
          description={`${storeDone} sur ${storeGaps.length} points en ordre.`}
        >
          <div className="mb-4 max-w-md">
            <Meter value={storeDone} max={storeGaps.length} intent="progress" />
          </div>

          <ul className="space-y-2.5">
            {storeGaps.map((item) => (
              <li key={item.label} className="flex flex-wrap items-start gap-2">
                <Badge tone={item.done ? "success" : "warning"}>
                  {item.done ? "OK" : "À faire"}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-medium text-[#0f1111]">{item.label}</p>
                  <p className="mt-0.5 text-[11.5px] leading-snug text-[#565959]">{item.why}</p>
                </div>
                {!item.done && (
                  <Button href={item.href} size="sm">
                    Corriger
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Fiches produit à compléter"
          description="Classées par nombre de manques. Chaque manque est une raison de ne pas être trouvé."
          padded={false}
        >
          {list.length === 0 ? (
            <EmptyState
              title="Aucun produit"
              description="Ajoutez un premier produit pour que cette boutique soit visible."
              action={
                <Button href={`/dashboard/seller/stores/${store.id}/products/new`} variant="primary">
                  Ajouter un produit
                </Button>
              }
            />
          ) : withGaps.length === 0 ? (
            <EmptyState
              title="Toutes les fiches sont complètes"
              description="Vos produits sont en ligne, illustrés, décrits et rangés dans une catégorie."
            />
          ) : (
            <Table
              columns={[
                { key: "p", label: "Produit" },
                { key: "c", label: "Catégorie" },
                { key: "g", label: "Ce qui manque" },
                { key: "a", label: "", align: "right", width: "90px" },
              ]}
            >
              {withGaps.map(({ product, gaps }) => (
                <Row key={product.id}>
                  <Cell strong>{product.title}</Cell>
                  <Cell muted>
                    {product.category ? categoryLabel(product.category) : "—"}
                  </Cell>
                  <Cell>
                    <span className="flex flex-wrap gap-1">
                      {gaps.map((gap) => (
                        <Badge
                          key={gap}
                          tone={gap === "Hors ligne" || gap === "Rupture" ? "danger" : "warning"}
                        >
                          {gap}
                        </Badge>
                      ))}
                    </span>
                  </Cell>
                  <Cell align="right">
                    <Button
                      href={`/dashboard/seller/stores/${store.id}/products/${product.id}`}
                      size="sm"
                    >
                      Modifier
                    </Button>
                  </Cell>
                </Row>
              ))}
            </Table>
          )}
        </Panel>
      </div>
    </>
  );
}
