/*
  PAGE : Espace vendeur — apparence d'une boutique

  Sert à :
  - visualiser l'en-tête public de la boutique tel que les clients le voient ;
  - remplacer le logo et la bannière.

  Seules des adresses d'images sont stockées : l'envoi de fichiers suppose
  un espace de stockage (Supabase Storage) qui n'est pas encore raccordé,
  et il est plus honnête de le dire que d'afficher un bouton inerte.
*/

import { requireStoreOwner, initialsOf } from "@/lib/seller";
import {
  PageHeader, Panel, Button, Notice,
  Field, Input, FormFeedback,
} from "@/components/seller/ui";
import { updateStoreAppearanceAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function StoreAppearancePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const { store } = await requireStoreOwner(id);

  const name = store.name?.trim() || "Boutique";
  const publicPath = `/store/${store.slug || store.id}`;

  return (
    <>
      <PageHeader
        title="Apparence"
        subtitle={name}
        actions={<Button href={publicPath}>Voir la vitrine</Button>}
      />

      <div className="space-y-4">
        <FormFeedback
          success={query.success}
          error={query.error}
          successMessages={{ appearance: "Le logo et la bannière ont été mis à jour." }}
        />

        <Panel
          title="Aperçu"
          description="L'en-tête de votre vitrine publique, avec les images actuelles."
          padded={false}
        >
          <div className="overflow-hidden">
            <div className="relative h-36 bg-[#f7f8f8] sm:h-44">
              {store.banner_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={store.banner_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[12px] text-[#767676]">
                  Aucune bannière
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 border-t border-[#e3e6e6] px-4 py-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[3px] border border-[#d5d9d9] bg-white text-[15px] font-semibold text-[#565959]">
                {store.logo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={store.logo_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initialsOf(name)
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-[#0f1111]">{name}</p>
                <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-[#565959]">
                  {store.description?.trim() || "Aucune description."}
                </p>
              </div>
            </div>
          </div>
        </Panel>

        <Notice tone="info" title="Envoi de fichiers">
          Les images sont référencées par leur adresse. L&apos;envoi direct
          depuis votre ordinateur demande un espace de stockage qui n&apos;est
          pas encore raccordé à MACHÉ ; en attendant, hébergez l&apos;image et
          collez son lien ici.
        </Notice>

        <Panel title="Images de la boutique">
          <form action={updateStoreAppearanceAction} className="max-w-2xl space-y-4">
            <input type="hidden" name="store_id" value={store.id} />

            <Field
              label="Logo"
              htmlFor="logo_url"
              hint="Image carrée, lisible en petit. Laissez vide pour afficher les initiales."
            >
              <Input
                id="logo_url"
                name="logo_url"
                type="url"
                inputMode="url"
                placeholder="https://…"
                defaultValue={store.logo_url || ""}
              />
            </Field>

            <Field
              label="Bannière"
              htmlFor="banner_url"
              hint="Image large (environ 1600 × 400). Évitez d'y écrire du texte : il est recadré sur mobile."
            >
              <Input
                id="banner_url"
                name="banner_url"
                type="url"
                inputMode="url"
                placeholder="https://…"
                defaultValue={store.banner_url || ""}
              />
            </Field>

            <Button type="submit" variant="primary">
              Enregistrer l&apos;apparence
            </Button>
          </form>
        </Panel>

        <Panel
          title="Ce qui se règle ailleurs"
          description="Pour éviter que deux écrans modifient la même chose."
        >
          <ul className="space-y-2 text-[12.5px] text-[#565959]">
            <li>
              Nom, catégorie, description et mots-clés :{" "}
              <a
                href={`/dashboard/seller/stores/${store.id}/store`}
                className="font-medium text-[#d2162c] hover:underline"
              >
                Ma boutique
              </a>
            </li>
            <li>
              Adresse publique et ouverture :{" "}
              <a
                href={`/dashboard/seller/stores/${store.id}/settings`}
                className="font-medium text-[#d2162c] hover:underline"
              >
                Paramètres
              </a>
            </li>
            <li>
              Images des produits : sur la fiche de chaque produit.
            </li>
          </ul>
        </Panel>
      </div>
    </>
  );
}
