/*
  PAGE : lire un contrat, et le signer ou le refuser.

  Le texte est affiché EN ENTIER, sans repli ni « lire la suite »

  Un contrat qu'on plie derrière un bouton est un contrat qu'on ne lit
  pas, et on le sait en le pliant. Si le marchand doit s'engager, il
  faut que le texte soit sous ses yeux au moment où il tape son nom.

  Les trois gestes de la signature

  Taper son nom, déclarer sa qualité, cocher la confirmation. Un seul
  bouton « j'accepte » recueille des clics distraits ; taper son nom
  demande de s'arrêter. C'est aussi ce qui donne sa consistance à la
  preuve : on peut montrer ce que la personne a écrit.

  L'empreinte est affichée

  Elle ne sert à rien au quotidien, et c'est pour cela qu'elle est en
  bas, en petit. Mais elle permet à un marchand méfiant — ou à son
  avocat — de vérifier plus tard que le texte présenté est bien celui
  qui a été signé, sans avoir à croire MACHÉ sur parole.

  Ce que cette page ne prétend pas être

  Une signature électronique qualifiée. Elle le dit, à l'endroit où l'on
  signe, et non en mentions légales.
*/

import Link from "next/link";
import { redirect } from "next/navigation";
import { getVendorSeller, getVendorContract, CONTRACT_STATUS } from "@/lib/medusa/vendor";
import { formatDate } from "@/lib/seller";
import {
  PageHeader, Panel, Badge, Button, Notice, Field, Input, Textarea,
} from "@/components/seller/ui";
import { SubmitButton } from "@/components/submit-button";
import { signContractAction, declineContractAction } from "../actions";

export const dynamic = "force-dynamic";

const TONES: Record<string, "neutral" | "info" | "success" | "warning" | "danger"> = {
  sent: "warning",
  viewed: "warning",
  signed: "success",
  declined: "danger",
  revoked: "neutral",
};

export default async function SellerContractPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const seller = await getVendorSeller();

  if (!seller) redirect("/dashboard/seller/connexion");

  const { id } = await params;

  const query = searchParams ? await searchParams : {};

  const result = await getVendorContract(id);

  return (
    <div className="mx-auto max-w-[820px] space-y-5 p-3 sm:p-5">
      <PageHeader
        title={result.ok ? result.data.contract.title : "Contrat"}
        subtitle={
          result.ok
            ? `Version ${result.data.contract.version} · reçu le ${formatDate(
                result.data.contract.sentAt
              )}`
            : undefined
        }
        actions={
          <Button href="/dashboard/seller/contrats" variant="secondary">
            Tous les contrats
          </Button>
        }
      />

      {query.success && (
        <Notice tone="info" title="C'est enregistré">
          {query.success}
        </Notice>
      )}
      {query.error && (
        <Notice tone="danger" title="Ça n'a pas marché">
          {query.error}
        </Notice>
      )}

      {!result.ok ? (
        /*
          Le backend refuse de servir le texte si son empreinte ne
          correspond plus à celle figée à l'envoi. Ce message-là ne doit
          surtout pas être masqué : il dit qu'on a évité de faire signer
          un texte modifié.
        */
        <Notice tone="danger" title="Ce contrat ne peut pas être affiché">
          {result.reason}
        </Notice>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={TONES[result.data.contract.status]}>
              {CONTRACT_STATUS[result.data.contract.status]}
            </Badge>

            {result.data.contract.dueAt &&
              ["sent", "viewed"].includes(result.data.contract.status) && (
                <span className="text-sm text-[#565959]">
                  À répondre avant le {formatDate(result.data.contract.dueAt)}
                </span>
              )}
          </div>

          {result.data.summary && (
            <p className="rounded-[6px] border border-[#d5d9d9] bg-[#f7f8f8] p-3 text-base leading-relaxed text-[#0f1111]">
              {result.data.summary}
            </p>
          )}

          {/*
            Le texte, en entier. `whitespace-pre-wrap` garde les sauts de
            ligne et les alinéas tels qu'ils ont été écrits : un contrat
            reformaté à l'affichage n'est plus tout à fait le même
            document que celui dont on calcule l'empreinte.
          */}
          <article className="whitespace-pre-wrap rounded-[10px] border border-[#d5d9d9] bg-white p-5 text-base leading-relaxed text-[#0f1111]">
            {result.data.body}
          </article>

          {/* -------------------------------------------------------- */}
          {result.data.contract.status === "signed" ? (
            <Panel
              title="Vous avez signé ce contrat"
              description={`Le ${formatDate(result.data.contract.signedAt)}.`}
            >
              <dl className="space-y-1.5 text-sm">
                <div className="flex gap-2">
                  <dt className="text-[#565959]">Signé par</dt>
                  <dd className="font-medium text-[#0f1111]">
                    {result.data.contract.signerName}
                    {result.data.contract.signerRole
                      ? ` — ${result.data.contract.signerRole}`
                      : ""}
                  </dd>
                </div>
              </dl>

              <p className="mt-3 text-sm leading-relaxed text-[#565959]">
                Conservez cette page. Le contrat ne peut plus être modifié :
                toute correction de MACHÉ prendrait la forme d&apos;une nouvelle
                version, qu&apos;il faudrait vous soumettre à nouveau.
              </p>
            </Panel>
          ) : result.data.contract.status === "declined" ? (
            <Panel
              title="Vous avez refusé ce contrat"
              description={`Le ${formatDate(result.data.contract.declinedAt)}.`}
            >
              <p className="text-sm leading-relaxed text-[#565959]">
                Motif transmis à MACHÉ : « {result.data.contract.declineReason} »
              </p>
            </Panel>
          ) : result.data.contract.status === "revoked" ? (
            <Notice tone="warning" title="MACHÉ a retiré cet envoi">
              Ce contrat ne peut plus être signé. Il reste consultable.
            </Notice>
          ) : (
            <>
              {/* ---------------------------------------------------- */}
              <Panel
                title="Signer"
                description="Lisez le texte ci-dessus avant de remplir ce cadre."
              >
                <form action={signContractAction} className="space-y-3">
                  <input type="hidden" name="contract_id" value={result.data.contract.id} />

                  <Field
                    label="Votre nom complet"
                    required
                    hint="Tapez-le vous-même : c'est ce qui est enregistré comme votre signature."
                  >
                    <Input name="signer_name" required minLength={3} maxLength={200} />
                  </Field>

                  <Field label="Votre qualité" hint="Gérant, propriétaire, responsable…">
                    <Input name="signer_role" maxLength={200} />
                  </Field>

                  <Field label="Votre adresse e-mail" hint="Facultative.">
                    <Input name="signer_email" type="email" maxLength={320} />
                  </Field>

                  <label className="flex items-start gap-2.5 rounded-[6px] border border-[#d5d9d9] bg-[#f7f8f8] p-3">
                    <input
                      type="checkbox"
                      name="agreed"
                      required
                      className="mt-0.5 h-4 w-4 shrink-0"
                    />
                    <span className="text-sm leading-relaxed text-[#0f1111]">
                      J&apos;ai lu ce contrat en entier et j&apos;accepte ses
                      termes au nom de {seller.name}.
                    </span>
                  </label>

                  <SubmitButton pendingLabel="Enregistrement…">
                    Signer ce contrat
                  </SubmitButton>
                </form>

                {/*
                  Dit à l'endroit où l'on signe, pas en mentions légales
                  au bas de la page : c'est ici que la personne décide.
                */}
                <p className="mt-4 border-t border-[#d5d9d9] pt-3 text-xs leading-relaxed text-[#767676]">
                  MACHÉ enregistre votre acceptation, l&apos;heure, et
                  l&apos;empreinte du texte exact que vous signez. MACHÉ ne
                  vérifie pas votre identité : ce n&apos;est pas une signature
                  électronique qualifiée au sens de la loi, mais la preuve
                  d&apos;un consentement donné sur un texte qui ne pourra plus
                  changer.
                </p>
              </Panel>

              {/* ---------------------------------------------------- */}
              <Panel
                title="Refuser"
                description="Vous n'êtes pas obligé d'accepter."
              >
                <form action={declineContractAction} className="space-y-3">
                  <input type="hidden" name="contract_id" value={result.data.contract.id} />

                  <Field
                    label="Pourquoi refusez-vous ?"
                    required
                    hint="Une phrase suffit. Elle évite à MACHÉ de vous rappeler pour comprendre."
                  >
                    <Textarea name="reason" required minLength={5} rows={3} />
                  </Field>

                  {/*
                    Volontairement moins saillant que le bouton « signer » :
                    refuser reste possible et visible, mais ce n'est pas
                    l'action que la page pousse à faire par défaut.
                  */}
                  <SubmitButton
                    pendingLabel="Enregistrement…"
                    className="!bg-white !text-[#0f1111] !border !border-[#8d9096] hover:!bg-[#f7f8f8]"
                  >
                    Refuser ce contrat
                  </SubmitButton>
                </form>
              </Panel>
            </>
          )}

          {/* -------------------------------------------------------- */}
          <p className="break-all text-2xs leading-relaxed text-[#9a9a9a]">
            Empreinte du texte (SHA-256) : {result.data.contract.contentHash}
            {result.data.contract.proofHash && (
              <>
                <br />
                Sceau de la signature : {result.data.contract.proofHash}
              </>
            )}
            <br />
            Ces empreintes permettent de vérifier, plus tard, que le document
            présenté est bien celui-ci.
          </p>

          <p className="text-sm text-[#565959]">
            Une question sur ce contrat ?{" "}
            <Link href="/contact" className="font-medium underline">
              Écrivez à MACHÉ
            </Link>{" "}
            avant de signer.
          </p>
        </>
      )}
    </div>
  );
}
