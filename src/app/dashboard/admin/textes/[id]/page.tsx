/*
  PAGE : une version d'un texte public.

  BROUILLON — modifiable, publiable. Le site ne l'affiche pas.
  EN VIGUEUR — c'est ce que lisent les visiteurs. Le texte ne bouge plus.
  ARCHIVÉE — une version remplacée. Conservée pour savoir à quoi
             quelqu'un s'est engagé à l'époque.

  Pourquoi une version en vigueur n'est pas modifiable

  Parce qu'un client qui a accepté les conditions le mois dernier a
  accepté CE texte-là. Le récrire sous ses pieds ferait porter son
  acceptation sur des clauses qu'il n'a jamais lues. C'est la même
  fraude que pour un contrat, en plus discrète : personne ne relit une
  politique de confidentialité.

  Comme pour les contrats, le formulaire DISPARAÎT une fois le texte en
  vigueur — il n'est pas grisé. Un champ grisé se lit comme « il
  faudrait un droit de plus » ; ici, aucun droit ne rouvre ce texte.
*/

import { Link } from "next-view-transitions";
import { redirect } from "next/navigation";
import {
  getAdminUser,
  fetchPolicyVersion,
  fetchPolicies,
  POLICY_STATUS_LABELS,
} from "@/lib/medusa/admin";
import { parsePolicyBody } from "@/lib/medusa/policies";
import { formatDate } from "@/lib/seller";
import {
  PageHeader, Panel, Badge, Button, Notice, Field, Input, Textarea,
} from "@/components/seller/ui";
import { SubmitButton } from "@/components/submit-button";
import {
  editPolicyAction,
  publishPolicyAction,
  newPolicyVersionAction,
  archivePolicyAction,
} from "../actions";

export const dynamic = "force-dynamic";

const TONES: Record<string, "neutral" | "success" | "warning"> = {
  draft: "warning",
  live: "success",
  archived: "neutral",
};

export default async function AdminTextVersionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  const { id } = await params;

  const query = searchParams ? await searchParams : {};

  const result = await fetchPolicyVersion(id);

  if (!result.ok) {
    return (
      <div className="space-y-5">
        <PageHeader title="Texte" />
        <Notice tone="danger" title="Ce texte ne s'affiche pas">
          {result.reason}
        </Notice>
      </div>
    );
  }

  const policy = result.data;

  /* Le chemin de la page publique, pour le lien et pour l'invalidation. */
  const catalogue = await fetchPolicies();

  const page = catalogue.ok
    ? catalogue.data.pages.find((item) => item.slug === policy.slug)
    : undefined;

  const path = page?.path ?? "/";

  const isDraft = policy.status === "draft";

  return (
    <div className="space-y-5">
      <PageHeader
        title={policy.title}
        subtitle={`${page?.label ?? policy.slug} · version ${policy.version} · ${
          POLICY_STATUS_LABELS[policy.status]
        }`}
        actions={
          <div className="flex flex-wrap gap-1.5">
            <Button href={path} variant="secondary">
              Voir la page
            </Button>
            <Button href="/dashboard/admin/textes" variant="secondary">
              Tous les textes
            </Button>
          </div>
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

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={TONES[policy.status]}>{POLICY_STATUS_LABELS[policy.status]}</Badge>
        {policy.changeNote && (
          <span className="text-sm text-[#565959]">{policy.changeNote}</span>
        )}
      </div>

      {/* ------------------------------------------------------------ */}
      {isDraft ? (
        <Panel title="Brouillon" description="Le site ne l'affiche pas encore.">
          <form action={editPolicyAction} className="space-y-3">
            <input type="hidden" name="policy_id" value={policy.id} />

            <Field label="Titre de la page" required>
              <Input name="title" defaultValue={policy.title} required maxLength={300} />
            </Field>

            <Field label="Sous-titre">
              <Input name="summary" defaultValue={policy.summary ?? ""} maxLength={500} />
            </Field>

            <Field
              label="Texte"
              required
              hint="Une ligne commençant par ## devient un titre de section. Les lignes vides séparent les paragraphes."
            >
              <Textarea
                name="body"
                defaultValue={policy.body}
                required
                rows={22}
                className="font-mono text-sm"
              />
            </Field>

            <Field label="Pourquoi cette version ?" hint="Note interne, jamais publiée.">
              <Input name="change_note" defaultValue={policy.changeNote ?? ""} maxLength={500} />
            </Field>

            <SubmitButton pendingLabel="Enregistrement…">
              Enregistrer le brouillon
            </SubmitButton>
          </form>

          <div className="mt-5 border-t border-[#d5d9d9] pt-4">
            <Notice tone="warning" title="Publier remplace le texte actuel du site">
              Cette version deviendra celle que lisent vos visiteurs, et son
              texte ne sera plus modifiable. La version actuelle passera en
              archive — elle restera lisible, parce que c&apos;est à elle
              qu&apos;on se réfère pour dire à quoi quelqu&apos;un s&apos;est
              engagé avant aujourd&apos;hui.
            </Notice>

            <form action={publishPolicyAction} className="mt-3">
              <input type="hidden" name="policy_id" value={policy.id} />
              <input type="hidden" name="slug" value={policy.slug} />
              <input type="hidden" name="path" value={path} />
              <SubmitButton pendingLabel="Publication…">
                Mettre en vigueur sur le site
              </SubmitButton>
            </form>
          </div>
        </Panel>
      ) : (
        <Panel
          title="Texte"
          description={
            policy.publishedAt
              ? `Publié le ${formatDate(policy.publishedAt)}.`
              : undefined
          }
        >
          {/*
            Rendu comme il s'affiche au public, pas comme il a été saisi :
            c'est ce qu'on veut relire. Les blocs sont du texte, jamais
            du balisage — il n'y a aucun chemin par lequel une balise
            tapée dans l'administration deviendrait une balise dans la
            page.
          */}
          <div className="space-y-3 rounded-[6px] border border-[#d5d9d9] bg-[#f7f8f8] p-4">
            {parsePolicyBody(policy.body).map((block, index) =>
              block.kind === "heading" ? (
                <h3 key={index} className="pt-2 text-md font-bold text-[#0f1111]">
                  {block.text}
                </h3>
              ) : (
                <p key={index} className="text-sm leading-relaxed text-[#565959]">
                  {block.text}
                </p>
              )
            )}
          </div>

          <p className="mt-3 break-all text-2xs text-[#9a9a9a]">
            Empreinte (SHA-256) : {policy.contentHash ?? "—"}
          </p>
        </Panel>
      )}

      {/* ------------------------------------------------------------ */}
      {!isDraft && (
        <Panel
          title="Corriger ce texte"
          description="Le texte publié ne bouge plus. Une correction prend la forme d'une version suivante."
        >
          <form action={newPolicyVersionAction} className="space-y-3">
            <input type="hidden" name="policy_id" value={policy.id} />

            <Field label="Titre" hint="Vide = le même titre.">
              <Input name="title" maxLength={300} />
            </Field>

            <Field label="Nouveau texte" required>
              <Textarea
                name="body"
                defaultValue={policy.body}
                required
                rows={20}
                className="font-mono text-sm"
              />
            </Field>

            <Field label="Pourquoi cette version ?" hint="Note interne, jamais publiée.">
              <Input name="change_note" maxLength={500} />
            </Field>

            <p className="text-sm leading-relaxed text-[#565959]">
              La nouvelle version naîtra en brouillon. Le site continuera
              d&apos;afficher la version {policy.version} tant que vous ne
              l&apos;aurez pas publiée.
            </p>

            <SubmitButton pendingLabel="Création…">
              Créer la version {policy.version + 1}
            </SubmitButton>
          </form>
        </Panel>
      )}

      {/* ------------------------------------------------------------ */}
      {policy.status !== "archived" && (
        <Panel
          title="Retirer cette version"
          description={
            policy.status === "live"
              ? "La page reviendra au texte écrit dans le code du site."
              : "Ce brouillon sera archivé."
          }
        >
          <form action={archivePolicyAction}>
            <input type="hidden" name="policy_id" value={policy.id} />
            <input type="hidden" name="slug" value={policy.slug} />
            <input type="hidden" name="path" value={path} />
            <input type="hidden" name="was_live" value={policy.status === "live" ? "1" : "0"} />
            <SubmitButton
              pendingLabel="Retrait…"
              className="!bg-white !text-[#0f1111] !border !border-[#8d9096] hover:!bg-[#f7f8f8]"
            >
              Retirer
            </SubmitButton>
          </form>
        </Panel>
      )}

      <p className="text-sm text-[#565959]">
        Le texte d&apos;origine — celui écrit dans le code — reste le filet :
        il s&apos;affiche tant qu&apos;aucune version n&apos;est publiée, et
        aussi quand le backend ne répond pas.{" "}
        <Link href={path} className="font-medium underline">
          Voir la page publique
        </Link>
        .
      </p>
    </div>
  );
}
