/*
  PAGE : un contrat, côté administration.

  Ce qu'on y fait dépend entièrement de son état, et l'écran ne montre
  que ce qui est réellement possible :

  BROUILLON  — modifier, publier.
  PUBLIÉ     — envoyer, suivre les réponses, créer une version suivante.
  ARCHIVÉ    — consulter.

  Pourquoi le formulaire de modification DISPARAÎT une fois publié

  Plutôt que de l'afficher grisé. Un champ grisé se lit comme « il
  faudrait un droit de plus » ; ici il n'y a pas de droit qui rouvrirait
  ce texte. Personne ne peut le modifier, et c'est le point.

  Le suivi des réponses répond à une question pratique

  Qui dois-je relancer ? D'où les états séparés : « envoyé, non lu » et
  « lu, sans réponse » n'appellent pas le même message.
*/

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getAdminUser,
  fetchContract,
  fetchContractSignatures,
  fetchSellers,
  CONTRACT_STATUS_LABELS,
  SIGNATURE_STATUS_LABELS,
} from "@/lib/medusa/admin";
import { formatDate } from "@/lib/seller";
import {
  PageHeader, Panel, Badge, Button, Notice, Field, Input, Textarea, Stat, StatRow,
} from "@/components/seller/ui";
import { SubmitButton } from "@/components/submit-button";
import {
  editContractAction,
  publishContractAction,
  newVersionAction,
  archiveContractAction,
  sendContractAction,
  revokeSignatureAction,
} from "../actions";

export const dynamic = "force-dynamic";

const SIGN_TONES: Record<string, "neutral" | "info" | "success" | "warning" | "danger"> = {
  sent: "warning",
  viewed: "warning",
  signed: "success",
  declined: "danger",
  revoked: "neutral",
};

export default async function AdminContractPage({
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

  const result = await fetchContract(id);

  if (!result.ok) {
    return (
      <div className="space-y-5">
        <PageHeader title="Contrat" />
        <Notice tone="danger" title="Ce contrat ne s'affiche pas">
          {result.reason}
        </Notice>
      </div>
    );
  }

  const contract = result.data;

  const published = contract.status === "published";

  /*
    Les signatures et la liste des boutiques ne sont lues que pour un
    contrat publié : un brouillon n'a rien été envoyé, et charger la
    liste des vendeurs pour un écran qui ne peut rien en faire serait
    un appel au backend pour rien.
  */
  const [signatures, sellers] = published
    ? await Promise.all([fetchContractSignatures(id), fetchSellers()])
    : [null, null];

  const sellerName = (sellerId: string) =>
    sellers?.ok
      ? sellers.data.find((item) => item.id === sellerId)?.name ?? sellerId
      : sellerId;

  /* Qui n'a pas encore reçu ce contrat : le reste peut être envoyé. */
  const alreadySent = new Set(
    signatures?.ok ? signatures.data.signatures.map((item) => item.sellerId) : []
  );

  const candidates = sellers?.ok
    ? sellers.data.filter((item) => !alreadySent.has(item.id))
    : [];

  return (
    <div className="space-y-5">
      <PageHeader
        title={contract.title}
        subtitle={`Version ${contract.version} · ${CONTRACT_STATUS_LABELS[contract.status]}`}
        actions={
          <Button href="/dashboard/admin/contrats" variant="secondary">
            Tous les contrats
          </Button>
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

      {/* ------------------------------------------------------------ */}
      {contract.status === "draft" ? (
        <Panel
          title="Brouillon"
          description="Modifiable tant qu'il n'est pas publié."
        >
          <form action={editContractAction} className="space-y-3">
            <input type="hidden" name="contract_id" value={contract.id} />

            <Field label="Titre" required>
              <Input name="title" defaultValue={contract.title} required maxLength={300} />
            </Field>

            <Field label="En une phrase">
              <Input name="summary" defaultValue={contract.summary ?? ""} maxLength={500} />
            </Field>

            <Field label="Texte du contrat" required>
              <Textarea
                name="body"
                defaultValue={contract.body}
                required
                rows={20}
                className="font-mono text-sm"
              />
            </Field>

            <SubmitButton pendingLabel="Enregistrement…">
              Enregistrer le brouillon
            </SubmitButton>
          </form>

          <div className="mt-5 border-t border-[#d5d9d9] pt-4">
            <Notice tone="warning" title="Publier fige ce texte définitivement">
              Après publication, plus personne ne pourra le modifier — pas même
              depuis la base. Le corriger demandera de créer une version
              suivante et de la renvoyer. C&apos;est ce qui permet de prouver
              quel texte un marchand a signé.
            </Notice>

            <form action={publishContractAction} className="mt-3">
              <input type="hidden" name="contract_id" value={contract.id} />
              <SubmitButton pendingLabel="Publication…">
                Publier et figer le texte
              </SubmitButton>
            </form>
          </div>
        </Panel>
      ) : (
        /*
          Publié ou archivé : le texte est en lecture seule. Le formulaire
          n'est pas grisé, il n'existe pas — un champ grisé se lit comme
          « il faudrait un droit de plus », alors qu'ici aucun droit ne
          rouvre ce texte.
        */
        <Panel
          title="Texte"
          description={
            contract.publishedAt
              ? `Figé le ${formatDate(contract.publishedAt)}.`
              : undefined
          }
        >
          <article className="whitespace-pre-wrap rounded-[6px] border border-[#d5d9d9] bg-[#f7f8f8] p-4 text-sm leading-relaxed text-[#0f1111]">
            {contract.body}
          </article>

          <p className="mt-3 break-all text-2xs text-[#9a9a9a]">
            Empreinte (SHA-256) : {contract.contentHash ?? "—"}
          </p>
        </Panel>
      )}

      {/* ------------------------------------------------------------ */}
      {published && (
        <>
          <Panel
            title="Envoyer à des boutiques"
            description={
              candidates.length === 0
                ? "Toutes les boutiques connues ont déjà reçu ce contrat."
                : `${candidates.length} boutique(s) ne l'ont pas encore reçu.`
            }
          >
            {sellers && !sellers.ok ? (
              <Notice tone="danger" title="La liste des boutiques ne s'affiche pas">
                {sellers.reason}
              </Notice>
            ) : candidates.length > 0 ? (
              <form action={sendContractAction} className="space-y-3">
                <input type="hidden" name="contract_id" value={contract.id} />

                <div className="max-h-64 overflow-y-auto rounded-[6px] border border-[#d5d9d9]">
                  {candidates.map((seller) => (
                    <label
                      key={seller.id}
                      className="flex items-center gap-2.5 border-b border-[#eceff1] px-3 py-2 last:border-b-0 hover:bg-[#f7f8f8]"
                    >
                      <input
                        type="checkbox"
                        name="seller_ids"
                        value={seller.id}
                        className="h-4 w-4 shrink-0"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-[#0f1111]">
                          {seller.name}
                        </span>
                        <span className="block truncate text-xs text-[#767676]">
                          {seller.email ?? seller.handle}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>

                <Field
                  label="Date limite de réponse"
                  hint="Facultative. Elle s'affiche chez le marchand ; rien ne se déclenche automatiquement à l'échéance."
                >
                  <Input name="due_at" type="date" />
                </Field>

                <SubmitButton pendingLabel="Envoi…">
                  Envoyer aux boutiques cochées
                </SubmitButton>
              </form>
            ) : null}
          </Panel>

          {/* -------------------------------------------------------- */}
          <Panel title="Réponses">
            {!signatures?.ok ? (
              <Notice tone="danger" title="Le suivi ne s'affiche pas">
                {signatures?.reason ?? "Lecture impossible."}
              </Notice>
            ) : signatures.data.signatures.length === 0 ? (
              <p className="text-sm text-[#565959]">
                Ce contrat n&apos;a encore été envoyé à personne.
              </p>
            ) : (
              <>
                <StatRow>
                  <Stat label="Signés" value={String(signatures.data.tally.signed)} />
                  <Stat
                    label="Lus, sans réponse"
                    value={String(signatures.data.tally.viewed)}
                  />
                  <Stat
                    label="Non lus"
                    value={String(signatures.data.tally.sent)}
                  />
                  <Stat label="Refusés" value={String(signatures.data.tally.declined)} />
                </StatRow>

                <ul className="mt-4 space-y-2">
                  {signatures.data.signatures.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-[6px] border border-[#d5d9d9] bg-white p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#0f1111]">
                            {sellerName(item.sellerId)}
                          </p>
                          <p className="mt-0.5 text-xs text-[#565959]">
                            {item.signedAt
                              ? `Signé le ${formatDate(item.signedAt)} par ${item.signerName ?? "—"}${
                                  item.signerRole ? ` (${item.signerRole})` : ""
                                }`
                              : item.declinedAt
                                ? `Refusé le ${formatDate(item.declinedAt)}`
                                : item.viewedAt
                                  ? `Lu le ${formatDate(item.viewedAt)}, sans réponse`
                                  : `Envoyé le ${formatDate(item.sentAt)}, pas encore ouvert`}
                          </p>

                          {item.declineReason && (
                            <p className="mt-1.5 rounded-[4px] bg-[#fdeaec] px-2 py-1 text-xs text-[#8a1c1c]">
                              « {item.declineReason} »
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge tone={SIGN_TONES[item.status]}>
                            {SIGNATURE_STATUS_LABELS[item.status]}
                          </Badge>

                          {/*
                            Une signature recueillie ne se retire pas :
                            le bouton n'existe que pour les envois sans
                            réponse. Le backend le refuse aussi, mais
                            proposer un geste impossible est une
                            promesse qu'on ne tient pas.
                          */}
                          {["sent", "viewed"].includes(item.status) && (
                            <form action={revokeSignatureAction}>
                              <input type="hidden" name="contract_id" value={contract.id} />
                              <input type="hidden" name="signature_id" value={item.id} />
                              <SubmitButton
                                pendingLabel="…"
                                className="!bg-white !text-[#0f1111] !border !border-[#8d9096] hover:!bg-[#f7f8f8]"
                              >
                                Retirer
                              </SubmitButton>
                            </form>
                          )}
                        </div>
                      </div>

                      {item.proofHash && (
                        <p className="mt-2 break-all text-2xs text-[#9a9a9a]">
                          Sceau : {item.proofHash}
                          {item.signerIp ? ` · depuis ${item.signerIp}` : ""}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Panel>

          {/* -------------------------------------------------------- */}
          <Panel
            title="Corriger ce contrat"
            description="Le texte publié ne bouge plus. Une correction prend la forme d'une version suivante."
          >
            <form action={newVersionAction} className="space-y-3">
              <input type="hidden" name="contract_id" value={contract.id} />

              <Field label="Titre de la nouvelle version" hint="Vide = le même titre.">
                <Input name="title" maxLength={300} />
              </Field>

              <Field label="Nouveau texte" required>
                <Textarea
                  name="body"
                  defaultValue={contract.body}
                  required
                  rows={16}
                  className="font-mono text-sm"
                />
              </Field>

              <p className="text-sm leading-relaxed text-[#565959]">
                La nouvelle version naîtra en brouillon. Les signatures déjà
                recueillies resteront attachées à la version {contract.version},
                mot pour mot — elles ne suivront pas la correction.
              </p>

              <SubmitButton pendingLabel="Création…">
                Créer la version {contract.version + 1}
              </SubmitButton>
            </form>
          </Panel>
        </>
      )}

      {/* ------------------------------------------------------------ */}
      {contract.status !== "archived" && (
        <Panel
          title="Archiver"
          description="Retire ce contrat de la circulation. Rien n'est supprimé : les signatures restent lisibles."
        >
          <form action={archiveContractAction}>
            <input type="hidden" name="contract_id" value={contract.id} />
            <SubmitButton
              pendingLabel="Archivage…"
              className="!bg-white !text-[#0f1111] !border !border-[#8d9096] hover:!bg-[#f7f8f8]"
            >
              Archiver ce contrat
            </SubmitButton>
          </form>
        </Panel>
      )}

      <p className="text-sm text-[#565959]">
        Ce que voit un marchand :{" "}
        <Link href="/dashboard/seller/contrats" className="font-medium underline">
          l&apos;écran de signature
        </Link>
        .
      </p>
    </div>
  );
}
