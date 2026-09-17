/*
  PAGE : Espace vendeur — paramètres d'une boutique

  Sert à :
  - modifier l'adresse publique (slug) ;
  - fermer ou rouvrir la boutique ;
  - dire précisément ce qu'implique une fermeture.

  Aucune suppression n'est proposée : une boutique ayant vendu porte des
  commandes, des avis et des paiements. La fermer la retire du site public
  sans effacer l'historique d'achats de ses clients.
*/

import { requireStoreOwner, formatNumber, formatDate } from "@/lib/seller";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, Notice,
  Field, Input, FormFeedback,
} from "@/components/seller/ui";
import { updateStoreSlugAction, setStoreActiveAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function StoreSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const { supabase, store, email } = await requireStoreOwner(id);

  const { count: productCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("store_id", store.id);

  const { count: orderLineCount } = await supabase
    .from("order_items")
    .select("*", { count: "exact", head: true })
    .eq("store_id", store.id);

  const isActive = store.is_active !== false;

  return (
    <>
      <PageHeader
        title="Paramètres"
        subtitle={store.name?.trim() || "Boutique"}
        actions={
          <Button href={`/dashboard/seller/stores/${store.id}/store`}>
            Informations de la boutique
          </Button>
        }
      />

      <div className="space-y-4">
        <FormFeedback
          success={query.success}
          error={query.error}
          successMessages={{
            slug: "L'adresse publique a été modifiée.",
            slug_unchanged: "L'adresse publique est inchangée.",
            closed: "La boutique est fermée : elle n'apparaît plus sur le site public.",
            reopened: "La boutique est de nouveau visible sur le site public.",
          }}
        />

        <Panel title="État de la boutique" padded={false}>
          <Table
            columns={[
              { key: "k", label: "Élément" },
              { key: "v", label: "Valeur" },
            ]}
          >
            <Row>
              <Cell strong>Visibilité</Cell>
              <Cell>
                <Badge tone={isActive ? "success" : "warning"}>
                  {isActive ? "Ouverte au public" : "Fermée"}
                </Badge>
              </Cell>
            </Row>
            <Row>
              <Cell strong>Vérification</Cell>
              <Cell>
                <Badge tone={store.is_verified ? "success" : "warning"}>
                  {store.is_verified ? "Vérifiée" : "En attente"}
                </Badge>
              </Cell>
            </Row>
            <Row>
              <Cell strong>Créée le</Cell>
              <Cell muted>{formatDate(store.created_at)}</Cell>
            </Row>
            <Row>
              <Cell strong>Produits</Cell>
              <Cell muted numeric>{formatNumber(productCount || 0)}</Cell>
            </Row>
            <Row>
              <Cell strong>Lignes de commande</Cell>
              <Cell muted numeric>{formatNumber(orderLineCount || 0)}</Cell>
            </Row>
            <Row>
              <Cell strong>Contact du compte</Cell>
              <Cell muted>{email || "—"}</Cell>
            </Row>
          </Table>
        </Panel>

        <Panel
          title="Adresse publique"
          description="Le lien que vous partagez à vos clients."
        >
          <form action={updateStoreSlugAction} className="max-w-2xl space-y-4">
            <input type="hidden" name="store_id" value={store.id} />

            <Field
              label="Adresse"
              htmlFor="slug"
              required
              hint="Lettres, chiffres et tirets. Les accents et espaces sont convertis automatiquement."
            >
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-[12px] text-[#565959]">/store/</span>
                <Input
                  id="slug"
                  name="slug"
                  required
                  minLength={3}
                  defaultValue={store.slug || ""}
                  placeholder="ma-boutique"
                />
              </div>
            </Field>

            <Notice tone="warning" title="Les anciens liens cesseront de fonctionner">
              Si vous avez déjà partagé l&apos;adresse actuelle — sur les réseaux,
              sur une carte de visite, dans un message — elle mènera à une page
              introuvable après le changement.
            </Notice>

            <Button type="submit" variant="primary">
              Modifier l&apos;adresse
            </Button>
          </form>
        </Panel>

        <Panel
          title={isActive ? "Fermer la boutique" : "Rouvrir la boutique"}
          description="Une boutique fermée disparaît du site public. Rien n'est effacé."
        >
          <div className="max-w-2xl space-y-3">
            <ul className="space-y-1.5 text-[12.5px] text-[#565959]">
              <li>
                Les produits de cette boutique ne sont plus achetables ni
                visibles dans la recherche.
              </li>
              <li>
                Les commandes déjà passées restent à honorer et restent
                visibles par vos clients.
              </li>
              <li>Les avis, les paiements et l&apos;historique sont conservés.</li>
              <li>Vous pouvez rouvrir à tout moment depuis cet écran.</li>
            </ul>

            <form action={setStoreActiveAction}>
              <input type="hidden" name="store_id" value={store.id} />
              <input type="hidden" name="active" value={isActive ? "false" : "true"} />
              <Button type="submit" variant={isActive ? "secondary" : "primary"}>
                {isActive ? "Fermer la boutique" : "Rouvrir la boutique"}
              </Button>
            </form>
          </div>
        </Panel>

        <Panel title="Suppression définitive">
          <p className="max-w-2xl text-[12.5px] leading-relaxed text-[#565959]">
            La suppression n&apos;est pas proposée depuis cet écran.
            {(orderLineCount || 0) > 0
              ? ` Cette boutique porte ${formatNumber(orderLineCount || 0)} ligne(s) de commande : les supprimer effacerait des preuves d'achat dues à vos clients.`
              : " Une boutique supprimée emporte ses produits, ses avis et son historique."}{" "}
            Si vous souhaitez réellement la supprimer, fermez-la d&apos;abord,
            puis écrivez à l&apos;équipe MACHÉ depuis l&apos;adresse du compte.
          </p>
        </Panel>
      </div>
    </>
  );
}
