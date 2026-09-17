/*
  PAGE : Espace vendeur — choix de la boutique avant d'ajouter un produit

  Pourquoi cette page ne contient plus de formulaire

  Elle en portait un, indépendant de celui des boutiques, dont l'action
  serveur écrivait des colonnes inexistantes ou d'un autre nom (`name` au
  lieu de `title`, `images`, `pdf_url`), un statut « published » absent de
  la contrainte de la table — l'insert était rejeté par la base — et aucun
  `store_id` : le produit, s'il était passé, n'aurait appartenu à aucune
  boutique et ne serait apparu nulle part.

  Un produit appartient à une boutique. Cette page demande donc laquelle,
  puis renvoie vers le formulaire de cette boutique — celui qui fonctionne,
  qui respecte les limites du plan et qui passe par la modération.
*/

import { requireSeller, formatNumber, formatDate } from "@/lib/seller";
import { categoryLabel } from "@/lib/categories";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, EmptyState, Notice,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

export default async function ChooseStoreForProductPage() {
  const { supabase, uid, limits } = await requireSeller("/dashboard/seller/products/new");

  const { data: stores, error } = await supabase
    .from("stores")
    .select("id, name, slug, category, is_active, is_verified, created_at")
    .eq("owner_id", uid)
    .order("created_at", { ascending: true });

  const storeList = stores ?? [];

  /*
    Compter les produits boutique par boutique : c'est ce qui permet de
    dire, avant le clic, laquelle a encore de la place.
  */
  const counts = new Map<string, number>();

  if (storeList.length > 0) {
    for (const store of storeList) {
      const { count } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("store_id", store.id);

      counts.set(String(store.id), count ?? 0);
    }
  }

  const canCreateStore = storeList.length < limits.maxStores;

  return (
    <>
      <PageHeader
        title="Ajouter un produit"
        subtitle="Dans quelle boutique ?"
        actions={<Button href="/dashboard/seller/products">Mes produits</Button>}
      />

      <div className="space-y-4">
        {error && (
          <Notice tone="warning" title="Boutiques indisponibles">
            {error.message}
          </Notice>
        )}

        <Panel padded={false}>
          {storeList.length === 0 ? (
            <EmptyState
              title="Aucune boutique"
              description="Un produit appartient à une boutique. Créez-en une d'abord."
              action={
                <Button href="/dashboard/seller/stores/new" variant="primary">
                  Créer une boutique
                </Button>
              }
            />
          ) : (
            <Table
              columns={[
                { key: "n", label: "Boutique" },
                { key: "c", label: "Catégorie" },
                { key: "p", label: "Produits", align: "right" },
                { key: "e", label: "État" },
                { key: "a", label: "", align: "right", width: "130px" },
              ]}
            >
              {storeList.map((store) => {
                const used = counts.get(String(store.id)) ?? 0;
                const full = used >= limits.maxArticlesPerStore;

                return (
                  <Row key={store.id}>
                    <Cell strong>
                      {store.name?.trim() || "Sans nom"}
                      <span className="mt-0.5 block text-[10.5px] font-normal text-[#767676]">
                        Créée le {formatDate(store.created_at)}
                      </span>
                    </Cell>
                    <Cell muted>{store.category ? categoryLabel(store.category) : "—"}</Cell>
                    <Cell align="right" numeric muted>
                      {formatNumber(used)} / {formatNumber(limits.maxArticlesPerStore)}
                    </Cell>
                    <Cell>
                      <Badge tone={store.is_active === false ? "warning" : "success"}>
                        {store.is_active === false ? "Fermée" : "Ouverte"}
                      </Badge>
                    </Cell>
                    <Cell align="right">
                      {full ? (
                        <Button href={`/dashboard/seller/stores/${store.id}/subscription`} size="sm">
                          Limite atteinte
                        </Button>
                      ) : (
                        <Button
                          href={`/dashboard/seller/stores/${store.id}/products/new`}
                          size="sm"
                          variant="primary"
                        >
                          Ajouter ici
                        </Button>
                      )}
                    </Cell>
                  </Row>
                );
              })}
            </Table>
          )}
        </Panel>

        {storeList.length > 0 && canCreateStore && (
          <Panel title="Ouvrir une autre boutique">
            <p className="max-w-2xl text-[12.5px] leading-relaxed text-[#565959]">
              Votre plan {limits.planName} autorise {formatNumber(limits.maxStores)}{" "}
              boutique(s) ; vous en avez {formatNumber(storeList.length)}.
            </p>
            <div className="mt-3">
              <Button href="/dashboard/seller/stores/new">Créer une boutique</Button>
            </div>
          </Panel>
        )}
      </div>
    </>
  );
}
