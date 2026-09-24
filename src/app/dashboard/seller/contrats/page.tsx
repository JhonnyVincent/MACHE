/*
  PAGE : les contrats que MACHÉ a adressés à cette boutique.

  Pourquoi cet écran vit ici et pas dans le panneau Mercur

  Mercur n'a pas de contrats. C'est une fonction propre à MACHÉ, comme
  les devis et les livraisons.

  Ce que la liste montre en premier

  Ce qui attend une réponse. Un contrat signé ou refusé est une archive ;
  un contrat non lu est une décision qui n'a pas été prise, et c'est
  cela qu'on ouvre cet écran pour retrouver.
*/

import Link from "next/link";
import { redirect } from "next/navigation";
import { getVendorSeller, getVendorContracts, CONTRACT_STATUS } from "@/lib/medusa/vendor";
import { formatDate } from "@/lib/seller";
import { PageHeader, Panel, Badge, Button, EmptyState, Notice } from "@/components/seller/ui";

export const dynamic = "force-dynamic";

const TONES: Record<string, "neutral" | "info" | "success" | "warning" | "danger"> = {
  sent: "warning",
  viewed: "warning",
  signed: "success",
  declined: "danger",
  revoked: "neutral",
};

const WAITING = ["sent", "viewed"];

export default async function SellerContractsPage() {
  const seller = await getVendorSeller();

  if (!seller) redirect("/dashboard/seller/connexion");

  const result = await getVendorContracts();

  const waiting = result.ok
    ? result.data.filter((item) => WAITING.includes(item.status))
    : [];

  const settled = result.ok
    ? result.data.filter((item) => !WAITING.includes(item.status))
    : [];

  return (
    <div className="mx-auto max-w-[900px] space-y-5 p-3 sm:p-5">
      <PageHeader
        title="Contrats"
        subtitle={`Ce que MACHÉ propose à ${seller.name}.`}
        actions={<Button href="/dashboard/seller" variant="secondary">Retour</Button>}
      />

      {!result.ok ? (
        <Notice tone="danger" title="Vos contrats ne s'affichent pas">
          {result.reason}
        </Notice>
      ) : result.data.length === 0 ? (
        <EmptyState
          title="Aucun contrat"
          description="MACHÉ ne vous a rien adressé pour le moment. Ce n'est pas une panne : il n'y a rien à lire."
        />
      ) : (
        <>
          {waiting.length > 0 && (
            <Panel
              title="En attente de votre réponse"
              description={`${waiting.length} contrat${waiting.length > 1 ? "s" : ""}.`}
            >
              <ul className="space-y-2">
                {waiting.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-[#d5d9d9] bg-white p-3"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/seller/contrats/${item.id}`}
                        className="text-md font-semibold text-[#0f1111] hover:underline"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-[#565959]">
                        Version {item.version} · reçu le {formatDate(item.sentAt)}
                        {item.dueAt ? ` · à répondre avant le ${formatDate(item.dueAt)}` : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge tone={TONES[item.status]}>{CONTRACT_STATUS[item.status]}</Badge>
                      <Button href={`/dashboard/seller/contrats/${item.id}`}>Lire</Button>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {settled.length > 0 && (
            <Panel title="Déjà répondus">
              <ul className="space-y-2">
                {settled.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-[#d5d9d9] bg-white p-3"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/seller/contrats/${item.id}`}
                        className="text-md font-semibold text-[#0f1111] hover:underline"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-[#565959]">
                        Version {item.version}
                        {item.signedAt
                          ? ` · signé le ${formatDate(item.signedAt)} par ${item.signerName ?? "—"}`
                          : item.declinedAt
                            ? ` · refusé le ${formatDate(item.declinedAt)}`
                            : ""}
                      </p>
                    </div>

                    <Badge tone={TONES[item.status]}>{CONTRACT_STATUS[item.status]}</Badge>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
