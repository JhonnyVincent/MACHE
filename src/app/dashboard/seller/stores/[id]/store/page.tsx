/*
  PAGE : Espace vendeur — identité d'une boutique

  Sert à :
  - afficher l'état réel de la boutique (adresse publique, vérification) ;
  - modifier son nom, sa catégorie, sa description et ses mots-clés ;
  - donner le lien exact vers la vitrine publique.

  L'apparence (logo, bannière) est traitée sur « Apparence », et l'adresse
  publique sur « Paramètres » : chaque écran écrit ses propres colonnes.
*/

import { requireStoreOwner, formatDate, formatNumber } from "@/lib/seller";
import { CATEGORY_OPTIONS, categoryLabel } from "@/lib/categories";
import {
  PageHeader, Panel, Stat, StatRow, Badge, Button, Notice,
  Field, Input, Textarea, Select, FormFeedback,
} from "@/components/seller/ui";
import { updateStoreIdentityAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function StoreIdentityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const { supabase, store } = await requireStoreOwner(id);

  const { count: productCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("store_id", store.id);

  const { count: publishedCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("store_id", store.id)
    .eq("status", "active");

  const keywords: string[] = Array.isArray(store.keywords) ? store.keywords : [];
  const publicPath = `/store/${store.slug || store.id}`;

  return (
    <>
      <PageHeader
        title="Ma boutique"
        subtitle={store.name?.trim() || "Boutique"}
        actions={
          <>
            <Button href={publicPath}>Voir la vitrine</Button>
            <Button href={`/dashboard/seller/stores/${store.id}/customization`} size="md">
              Apparence
            </Button>
          </>
        }
      />

      <div className="space-y-4">
        <FormFeedback
          success={query.success}
          error={query.error}
          successMessages={{ identity: "Les informations de la boutique ont été mises à jour." }}
        />

        <StatRow>
          <Stat label="Créée le" value={formatDate(store.created_at)} />
          <Stat label="Produits" value={formatNumber(productCount || 0)} />
          <Stat
            label="En ligne"
            value={formatNumber(publishedCount || 0)}
            tone={publishedCount ? "success" : "warning"}
          />
          <Stat
            label="Note moyenne"
            value={store.rating_count ? `${Number(store.rating_average).toFixed(1)} / 5` : "—"}
            hint={store.rating_count ? `${formatNumber(store.rating_count)} avis` : "Aucun avis"}
          />
          <Stat
            label="Vérification"
            value={store.is_verified ? "Vérifiée" : "En attente"}
            tone={store.is_verified ? "success" : "warning"}
          />
        </StatRow>

        {!store.is_active && (
          <Notice tone="warning" title="Boutique fermée">
            Cette boutique n&apos;apparaît pas sur le site public. Vous pouvez la
            rouvrir depuis les paramètres.
          </Notice>
        )}

        <Panel
          title="Adresse publique"
          description="C'est le lien que voient vos clients."
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="tnum text-[13px] font-semibold text-[#0f1111]">
                machè.ht{publicPath}
              </p>
              <p className="mt-1 text-[11.5px] text-[#565959]">
                {store.slug
                  ? "Modifiable depuis les paramètres de la boutique."
                  : "Aucune adresse définie : la vitrine est servie par identifiant."}
              </p>
            </div>
            <Button href={`/dashboard/seller/stores/${store.id}/settings`} size="sm">
              Modifier l&apos;adresse
            </Button>
          </div>
        </Panel>

        <Panel
          title="Informations de la boutique"
          description="Ces informations apparaissent sur votre vitrine et servent au classement dans les catégories."
        >
          <form action={updateStoreIdentityAction} className="max-w-2xl space-y-4">
            <input type="hidden" name="store_id" value={store.id} />

            <Field label="Nom de la boutique" htmlFor="name" required>
              <Input
                id="name"
                name="name"
                required
                maxLength={80}
                defaultValue={store.name || ""}
              />
            </Field>

            <Field
              label="Catégorie principale"
              htmlFor="category"
              hint={
                store.category
                  ? `Actuellement : ${categoryLabel(store.category)}`
                  : "Sans catégorie, la boutique ne remonte dans aucune rubrique."
              }
            >
              <Select id="category" name="category" defaultValue={store.category || ""}>
                <option value="">Aucune catégorie</option>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.slug} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Description"
              htmlFor="description"
              hint="Ce que vous vendez, d'où vous vendez, ce qui vous distingue."
            >
              <Textarea
                id="description"
                name="description"
                rows={5}
                defaultValue={store.description || ""}
              />
            </Field>

            <Field
              label="Mots-clés"
              htmlFor="keywords"
              hint="Séparés par des virgules, 20 au maximum. Ils aident la recherche interne."
            >
              <Input
                id="keywords"
                name="keywords"
                defaultValue={keywords.join(", ")}
                placeholder="mode, robe, artisanat"
              />
            </Field>

            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {keywords.map((keyword) => (
                  <Badge key={keyword}>{keyword}</Badge>
                ))}
              </div>
            )}

            <Button type="submit" variant="primary">
              Enregistrer les informations
            </Button>
          </form>
        </Panel>
      </div>
    </>
  );
}
