/*
  PAGE : Administration — blocs de contenu du site

  Sert à :
  - créer, activer et supprimer les blocs affichés sur les pages publiques ;
  - voir, zone par zone, ce qui est réellement en ligne.

  Un avertissement figure en bas de page : la table site_widgets existe et
  se remplit, mais aucune page publique ne la lit encore. Le dire vaut
  mieux que laisser croire qu'un bloc créé ici apparaîtra sur l'accueil.
*/

import { requireAdmin } from "@/lib/admin";
import { formatNumber } from "@/lib/seller";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, EmptyState, Stat, StatRow,
  Notice, Field, Input, Textarea, FormFeedback,
} from "@/components/seller/ui";
import { createWidgetAction, toggleWidgetAction, deleteWidgetAction } from "./actions";
import { supabaseConfigured } from "@/lib/supabase/env";
import { StaffUnavailable } from "@/components/staff-unavailable";

export const dynamic = "force-dynamic";

export default async function AdminWidgetsPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  /*
    La garde du layout ne suffit pas : Next rend la page et la mise en
    page en parallèle, donc `require*` s'exécute et lève même quand le
    layout a déjà décidé de ne pas afficher la page. L'écran était
    correct, mais les journaux se remplissaient de traces d'erreur pour
    une situation connue — et du rouge attendu finit par cacher du rouge
    inattendu.
  */
  if (!supabaseConfigured()) return <StaffUnavailable area="Blocs d'accueil" />;

  const query = searchParams ? await searchParams : {};
  const { supabase } = await requireAdmin("/dashboard/admin/widgets");

  const { data: widgets, error } = await supabase
    .from("site_widgets")
    .select("id, page, zone, type, title, subtitle, description, image_url, button_text, button_href, position, is_active")
    .order("page", { ascending: true })
    .order("position", { ascending: true })
    .limit(200);

  const list = widgets ?? [];
  const active = list.filter((widget) => widget.is_active).length;
  const pages = new Set(list.map((widget) => String(widget.page))).size;

  return (
    <>
      <PageHeader
        title="Blocs de contenu"
        subtitle="Bandeaux, encarts et appels à l'action des pages publiques."
      />

      <div className="space-y-4">
        <FormFeedback
          success={query.success}
          error={query.error}
          successMessages={{
            created: "Le bloc a été créé.",
            updated: "Le bloc a été mis à jour.",
            deleted: "Le bloc a été supprimé.",
          }}
        />

        {error && (
          <Notice tone="warning" title="Blocs indisponibles">
            {error.message}. La table site_widgets vient de votre propre
            schéma : vérifiez qu&apos;elle existe et que ce compte peut la lire.
          </Notice>
        )}

        <StatRow>
          <Stat label="Blocs" value={formatNumber(list.length)} />
          <Stat label="Actifs" value={formatNumber(active)} tone={active ? "success" : "default"} />
          <Stat label="Pages concernées" value={formatNumber(pages)} />
        </StatRow>

        <Panel title="Blocs enregistrés" padded={false}>
          {list.length === 0 ? (
            <EmptyState
              title="Aucun bloc"
              description="Créez-en un avec le formulaire ci-dessous."
            />
          ) : (
            <Table
              columns={[
                { key: "e", label: "Emplacement" },
                { key: "t", label: "Contenu" },
                { key: "b", label: "Bouton" },
                { key: "p", label: "Ordre", align: "right" },
                { key: "s", label: "État" },
                { key: "a", label: "", align: "right", width: "180px" },
              ]}
            >
              {list.map((widget) => (
                <Row key={widget.id}>
                  <Cell strong>
                    {widget.page} / {widget.zone}
                    <span className="mt-0.5 block text-2xs font-normal text-[#767676]">
                      {widget.type}
                    </span>
                  </Cell>
                  <Cell>
                    {widget.title || "Sans titre"}
                    {widget.subtitle && (
                      <span className="mt-0.5 block text-2xs font-normal text-[#767676]">
                        {widget.subtitle}
                      </span>
                    )}
                  </Cell>
                  <Cell muted>
                    {widget.button_text ? (
                      <>
                        {widget.button_text}
                        <span className="mt-0.5 block text-2xs text-[#767676]">
                          {widget.button_href || "aucun lien"}
                        </span>
                      </>
                    ) : (
                      "—"
                    )}
                  </Cell>
                  <Cell align="right" numeric muted>{widget.position ?? 0}</Cell>
                  <Cell>
                    <Badge tone={widget.is_active ? "success" : "neutral"}>
                      {widget.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </Cell>
                  <Cell align="right">
                    <span className="flex flex-wrap justify-end gap-1.5">
                      <form action={toggleWidgetAction}>
                        <input type="hidden" name="widget_id" value={widget.id} />
                        <input type="hidden" name="page" value={String(widget.page)} />
                        <Button type="submit" size="sm">
                          {widget.is_active ? "Désactiver" : "Activer"}
                        </Button>
                      </form>

                      <form action={deleteWidgetAction}>
                        <input type="hidden" name="widget_id" value={widget.id} />
                        <input type="hidden" name="page" value={String(widget.page)} />
                        <Button type="submit" size="sm">Supprimer</Button>
                      </form>
                    </span>
                  </Cell>
                </Row>
              ))}
            </Table>
          )}
        </Panel>

        <Panel title="Créer un bloc">
          <form action={createWidgetAction} className="max-w-2xl space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Page" htmlFor="page" hint="home, shop, sell…">
                <Input id="page" name="page" defaultValue="home" />
              </Field>

              <Field label="Zone" htmlFor="zone" required hint="hero, newsletter…">
                <Input id="zone" name="zone" required />
              </Field>

              <Field label="Type" htmlFor="type" hint="banner, cta_block…">
                <Input id="type" name="type" defaultValue="text_block" />
              </Field>
            </div>

            <Field label="Titre" htmlFor="title" required>
              <Input id="title" name="title" required />
            </Field>

            <Field label="Sous-titre" htmlFor="subtitle">
              <Input id="subtitle" name="subtitle" />
            </Field>

            <Field label="Description" htmlFor="description">
              <Textarea id="description" name="description" rows={3} />
            </Field>

            <Field label="Image" htmlFor="image_url" hint="Adresse complète, http:// ou https://">
              <Input id="image_url" name="image_url" type="url" placeholder="https://…" />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Texte du bouton" htmlFor="button_text">
                <Input id="button_text" name="button_text" />
              </Field>

              <Field label="Lien du bouton" htmlFor="button_href" hint="Obligatoire si le bouton a un texte.">
                <Input id="button_href" name="button_href" placeholder="/shop" />
              </Field>

              <Field label="Ordre" htmlFor="position" hint="Du plus petit au plus grand.">
                <Input id="position" name="position" type="number" defaultValue={0} />
              </Field>
            </div>

            <Button type="submit" variant="primary">Créer le bloc</Button>
          </form>
        </Panel>

        <Notice tone="warning" title="Ces blocs ne sont pas encore affichés">
          La table se remplit correctement, mais aucune page publique ne la lit
          à ce jour : les sections de l&apos;accueil sont écrites dans le code.
          Un bloc créé ici est donc enregistré, pas visible. Le brancher
          demande de décider quelles zones de quelles pages deviennent
          modifiables — une décision qui vous revient.
        </Notice>
      </div>
    </>
  );
}
