/*
  PAGE : les textes publics du site.

  Ce qu'elle change

  Les pages légales étaient écrites en dur. Changer une phrase de la
  politique de confidentialité demandait un développeur, une
  modification et un déploiement — autant dire qu'elle ne changeait
  pas. Une politique de confidentialité qui ne suit pas ce que fait
  réellement l'entreprise est un texte faux affiché en permanence.

  Ce que l'écran montre pour chaque page

  Ce qui est EN VIGUEUR aujourd'hui, et rien d'autre en gros. Un
  administrateur qui ouvre cet écran veut d'abord savoir ce que ses
  visiteurs lisent en ce moment.

  « Texte d'origine » n'est pas une absence

  Quand aucune version n'est publiée, le site affiche celui qui est
  écrit dans son code. C'est un texte valable, pas un trou — et l'écran
  le dit comme tel, sans pastille d'alerte.
*/

import { Link } from "next-view-transitions";
import { redirect } from "next/navigation";
import {
  getAdminUser,
  fetchPolicies,
  POLICY_STATUS_LABELS,
  type AdminPolicy,
} from "@/lib/medusa/admin";
import { formatDate } from "@/lib/seller";
import {
  PageHeader, Panel, Badge, Button, Notice, Field, Input, Textarea, Select,
} from "@/components/seller/ui";
import { SubmitButton } from "@/components/submit-button";
import { createPolicyAction } from "./actions";

export const dynamic = "force-dynamic";

const TONES: Record<string, "neutral" | "success" | "warning"> = {
  draft: "warning",
  live: "success",
  archived: "neutral",
};

export default async function AdminTextsPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string; nouveau?: string }>;
}) {
  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  const query = searchParams ? await searchParams : {};

  const result = await fetchPolicies();

  const writing = query.nouveau === "1";

  const byPage = (slug: string): AdminPolicy[] =>
    result.ok
      ? result.data.policies
          .filter((item) => item.slug === slug)
          .sort((a, b) => b.version - a.version)
      : [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Textes du site"
        subtitle="Confidentialité, conditions, retours — modifiables sans passer par un développeur."
        actions={
          writing ? (
            <Button href="/dashboard/admin/textes" variant="secondary">
              Annuler
            </Button>
          ) : (
            <Button href="/dashboard/admin/textes?nouveau=1">
              Écrire une version
            </Button>
          )
        }
      />

      {query.success && (
        <Notice tone="info" title="C'est fait">
          {query.success}
        </Notice>
      )}
      {query.error && (
        <Notice tone="danger" title="Ça n'a pas marché">
          {query.error}
        </Notice>
      )}

      {!result.ok ? (
        <Notice tone="danger" title="Les textes ne s'affichent pas">
          {result.reason}
        </Notice>
      ) : (
        <>
          {writing && (
            <Panel
              title="Nouvelle version"
              description="Créée en brouillon : le site continue d'afficher la version actuelle."
            >
              <form action={createPolicyAction} className="space-y-3">
                <Field label="Quelle page ?" required>
                  <Select name="slug" required>
                    {result.data.pages.map((page) => (
                      <option key={page.slug} value={page.slug}>
                        {page.label} — {page.path}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Titre de la page" required>
                  <Input name="title" required maxLength={300} />
                </Field>

                <Field label="Sous-titre" hint="Une phrase sous le titre. Facultative.">
                  <Input name="summary" maxLength={500} />
                </Field>

                <Field
                  label="Texte"
                  required
                  hint="Une ligne commençant par ## devient un titre de section. Les lignes vides séparent les paragraphes."
                >
                  <Textarea name="body" required rows={18} className="font-mono text-sm" />
                </Field>

                <Field
                  label="Pourquoi cette version ?"
                  hint="Note interne, jamais affichée au public. Dans six mois, « version 4 » ne dira rien à personne."
                >
                  <Input name="change_note" maxLength={500} />
                </Field>

                <SubmitButton pendingLabel="Création…">Créer le brouillon</SubmitButton>
              </form>
            </Panel>
          )}

          {result.data.pages.map((page) => {
            const versions = byPage(page.slug);

            const live = versions.find((item) => item.status === "live");
            const drafts = versions.filter((item) => item.status === "draft");
            const archived = versions.filter((item) => item.status === "archived");

            return (
              <Panel key={page.slug} title={page.label} description={page.hint}>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-[#d5d9d9] bg-white p-3">
                  <div className="min-w-0">
                    {live ? (
                      <>
                        <p className="text-sm font-semibold text-[#0f1111]">
                          Version {live.version} — en vigueur
                        </p>
                        <p className="mt-0.5 text-xs text-[#565959]">
                          Depuis le {formatDate(live.publishedAt)}
                          {live.changeNote ? ` · ${live.changeNote}` : ""}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-[#0f1111]">
                          Texte d&apos;origine
                        </p>
                        {/*
                          Formulé comme un état normal, pas comme un
                          manque : ce texte est valable et s'affiche.
                        */}
                        <p className="mt-0.5 text-xs text-[#565959]">
                          Aucune version publiée : le site affiche le texte écrit
                          dans son code.
                        </p>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={page.path}
                      className="text-sm text-[var(--mache-primary)] underline"
                    >
                      Voir la page
                    </Link>
                    {live && (
                      <Button href={`/dashboard/admin/textes/${live.id}`} variant="secondary">
                        Ouvrir
                      </Button>
                    )}
                  </div>
                </div>

                {drafts.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-label text-[#767676]">
                      Brouillon{drafts.length > 1 ? "s" : ""} en attente
                    </p>
                    <ul className="mt-1.5 space-y-1.5">
                      {drafts.map((item) => (
                        <li
                          key={item.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-[4px] border border-[#f3d9a5] bg-[#fdf6e8] px-3 py-2"
                        >
                          <span className="text-sm text-[#0f1111]">
                            Version {item.version}
                            {item.changeNote ? ` — ${item.changeNote}` : ""}
                          </span>
                          <Button href={`/dashboard/admin/textes/${item.id}`} variant="secondary">
                            Reprendre
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {archived.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-semibold uppercase tracking-label text-[#767676]">
                      {archived.length} version{archived.length > 1 ? "s" : ""} précédente
                      {archived.length > 1 ? "s" : ""}
                    </summary>
                    <ul className="mt-2 space-y-1.5">
                      {archived.map((item) => (
                        <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-[#565959]">
                            Version {item.version}
                            {item.publishedAt
                              ? ` — en vigueur à partir du ${formatDate(item.publishedAt)}`
                              : ""}
                          </span>
                          <Link
                            href={`/dashboard/admin/textes/${item.id}`}
                            className="text-[var(--mache-primary)] underline"
                          >
                            Lire
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {/*
                      Pourquoi on les garde : c'est à ces textes qu'on se
                      réfère pour dire à quoi quelqu'un s'est engagé à
                      l'époque de son achat.
                    */}
                    <p className="mt-2 text-xs leading-relaxed text-[#767676]">
                      Elles ne sont jamais supprimées : un client qui a accepté
                      les conditions l&apos;an dernier a accepté CE texte-là.
                    </p>
                  </details>
                )}

                {versions.length > 0 && !live && drafts.length === 0 && (
                  <Badge tone={TONES.archived}>
                    {POLICY_STATUS_LABELS.archived}
                  </Badge>
                )}
              </Panel>
            );
          })}
        </>
      )}
    </div>
  );
}
