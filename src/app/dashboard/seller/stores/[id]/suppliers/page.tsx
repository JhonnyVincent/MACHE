/*
  PAGE : Espace vendeur — fournisseurs pour une boutique

  Sert à :
  - lister les fournisseurs et marques réellement inscrits sur MACHÉ ;
  - montrer les prestataires déjà rattachés au compte.

  Ce fichier existait sous un chemin erroné (« rc/app/… ») : il n'a jamais
  été servi par Next, qui ne route que depuis src/app. Il est remis ici.

  Seules des données publiques sont affichées : une boutique fournisseur
  ouverte au public, son nom, sa catégorie. Aucune coordonnée privée d'un
  autre compte n'apparaît — la mise en relation passe par MACHÉ.
*/

import { requireStoreOwner, formatDate } from "@/lib/seller";
import { categoryLabel } from "@/lib/categories";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, EmptyState, Notice,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

export default async function StoreSuppliersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, uid, store } = await requireStoreOwner(id);

  /* Boutiques fournisseurs ouvertes au public : donnée déjà publique. */
  const { data: suppliers, error: suppliersError } = await supabase
    .from("stores")
    .select("id, slug, name, category, seller_type, is_verified, created_at")
    .in("seller_type", ["supplier", "official_brand"])
    .eq("is_active", true)
    .neq("owner_id", uid)
    .order("is_verified", { ascending: false })
    .limit(100);

  const { data: links, error: linksError } = await supabase
    .from("partner_vendors")
    .select("id, partner_id, relation_type, is_active, created_at")
    .eq("vendor_id", uid);

  const supplierList = suppliers ?? [];
  const partnerships = links ?? [];

  return (
    <>
      <PageHeader
        title="Fournisseurs"
        subtitle={store.name?.trim() || "Boutique"}
        actions={<Button href="/dashboard/seller/partners">Mes partenaires</Button>}
      />

      <div className="space-y-4">
        {suppliersError && (
          <Notice tone="warning" title="Annuaire indisponible">
            {suppliersError.message}
          </Notice>
        )}

        <Panel
          title="Fournisseurs et marques sur MACHÉ"
          description="Comptes fournisseurs et marques officielles dont la boutique est ouverte au public."
          padded={false}
        >
          {supplierList.length === 0 ? (
            <EmptyState
              title="Aucun fournisseur inscrit"
              description="Aucun compte fournisseur ou marque officielle n'a encore de boutique ouverte sur MACHÉ. L'annuaire se remplira à mesure des inscriptions."
            />
          ) : (
            <Table
              columns={[
                { key: "n", label: "Boutique" },
                { key: "t", label: "Type" },
                { key: "c", label: "Catégorie" },
                { key: "d", label: "Sur MACHÉ depuis" },
                { key: "a", label: "", align: "right", width: "90px" },
              ]}
            >
              {supplierList.map((supplier) => (
                <Row key={supplier.id}>
                  <Cell strong>
                    {supplier.name?.trim() || "Sans nom"}
                    {supplier.is_verified && (
                      <span className="ml-2">
                        <Badge tone="success">Vérifiée</Badge>
                      </span>
                    )}
                  </Cell>
                  <Cell muted>
                    {supplier.seller_type === "official_brand"
                      ? "Marque officielle"
                      : "Fournisseur"}
                  </Cell>
                  <Cell muted>
                    {supplier.category ? categoryLabel(supplier.category) : "—"}
                  </Cell>
                  <Cell muted>{formatDate(supplier.created_at)}</Cell>
                  <Cell align="right">
                    <Button href={`/store/${supplier.slug || supplier.id}`} size="sm">
                      Voir
                    </Button>
                  </Cell>
                </Row>
              ))}
            </Table>
          )}
        </Panel>

        <Panel
          title="Prestataires rattachés à votre compte"
          description="Partenaires autorisés à intervenir sur votre activité."
          padded={false}
        >
          {linksError ? (
            <div className="p-4">
              <Notice tone="warning" title="Liste indisponible">
                {linksError.message}
              </Notice>
            </div>
          ) : partnerships.length === 0 ? (
            <EmptyState
              title="Aucun prestataire rattaché"
              description="Un prestataire n'apparaît ici qu'après avoir été autorisé à intervenir sur votre compte."
            />
          ) : (
            <Table
              columns={[
                { key: "p", label: "Partenaire" },
                { key: "t", label: "Type d'intervention" },
                { key: "d", label: "Depuis" },
                { key: "s", label: "État", align: "right" },
              ]}
            >
              {partnerships.map((link) => (
                <Row key={link.id}>
                  <Cell strong>{String(link.partner_id).slice(0, 8)}</Cell>
                  <Cell muted>{link.relation_type || "service"}</Cell>
                  <Cell muted>{formatDate(link.created_at)}</Cell>
                  <Cell align="right">
                    <Badge tone={link.is_active ? "success" : "neutral"}>
                      {link.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </Cell>
                </Row>
              ))}
            </Table>
          )}
        </Panel>

        <Notice tone="info" title="Mise en relation">
          MACHÉ ne diffuse pas les coordonnées privées d&apos;un autre compte.
          Pour travailler avec un fournisseur, passez par sa vitrine publique
          ou demandez une mise en relation à l&apos;équipe.
        </Notice>
      </div>
    </>
  );
}
