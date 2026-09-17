/*
  PAGE : Espace vendeur — documents d'une boutique

  Sert à :
  - montrer où en est le dossier légal de cette boutique ;
  - enregistrer l'adresse du document officiel ;
  - expliquer ce que la vérification débloque.

  Le badge « vérifiée » n'est pas donné ici : il est décidé par la
  modération MACHÉ. Un vendeur qui se vérifierait lui-même viderait le
  badge de son sens.
*/

import { requireStoreOwner, formatDate } from "@/lib/seller";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, Notice,
  Field, Input, FormFeedback,
} from "@/components/seller/ui";
import { updateStoreDocumentAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function StoreDocumentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const { store, roleLabel } = await requireStoreOwner(id);

  const hasDocument = Boolean(store.legal_doc_url);

  const steps = [
    {
      label: "Boutique créée",
      done: true,
      detail: formatDate(store.created_at),
    },
    {
      label: "Document légal fourni",
      done: hasDocument,
      detail: hasDocument
        ? "Enregistré, en attente d'examen"
        : "Registre de commerce, patente, ou pièce d'identité du vendeur",
    },
    {
      label: "Vérification MACHÉ",
      done: Boolean(store.is_verified),
      detail: store.is_verified
        ? "Badge vérifié accordé"
        : hasDocument
          ? "Examen par l'équipe MACHÉ"
          : "Commence une fois le document fourni",
    },
  ];

  return (
    <>
      <PageHeader
        title="Documents & vérification"
        subtitle={store.name?.trim() || "Boutique"}
        actions={<Button href="/dashboard/seller/documents">Tous mes documents</Button>}
      />

      <div className="space-y-4">
        <FormFeedback
          success={query.success}
          error={query.error}
          successMessages={{ document: "Le document a été enregistré. Il sera examiné par l'équipe MACHÉ." }}
        />

        {!hasDocument && (
          <Notice tone="warning" title="Dossier incomplet">
            Sans document légal, cette boutique ne peut pas être vérifiée et
            certaines catégories de produits lui restent fermées.
          </Notice>
        )}

        {hasDocument && !store.is_verified && (
          <Notice tone="info" title="En attente d'examen">
            Votre document est enregistré. La vérification est prononcée par
            l&apos;équipe MACHÉ ; vous ne pouvez pas l&apos;accorder vous-même.
          </Notice>
        )}

        <Panel title="Avancement du dossier" padded={false}>
          <Table
            columns={[
              { key: "step", label: "Étape" },
              { key: "detail", label: "Détail" },
              { key: "state", label: "État", align: "right", width: "130px" },
            ]}
          >
            {steps.map((step) => (
              <Row key={step.label}>
                <Cell strong>{step.label}</Cell>
                <Cell muted>{step.detail}</Cell>
                <Cell align="right">
                  <Badge tone={step.done ? "success" : "warning"}>
                    {step.done ? "Fait" : "À faire"}
                  </Badge>
                </Cell>
              </Row>
            ))}
          </Table>
        </Panel>

        <Panel
          title="Document légal de la boutique"
          description={`Type de compte : ${roleLabel}.`}
        >
          <form action={updateStoreDocumentAction} className="max-w-2xl space-y-4">
            <input type="hidden" name="store_id" value={store.id} />

            <Field
              label="Adresse du document"
              htmlFor="legal_doc_url"
              required
              hint="Lien vers le document scanné (PDF ou image). L'envoi direct de fichiers demande un espace de stockage qui n'est pas encore raccordé."
            >
              <Input
                id="legal_doc_url"
                name="legal_doc_url"
                type="url"
                inputMode="url"
                required
                placeholder="https://…"
                defaultValue={store.legal_doc_url || ""}
              />
            </Field>

            {hasDocument && (
              <p className="text-[11.5px] text-[#565959]">
                Document actuel :{" "}
                <a
                  href={store.legal_doc_url as string}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-[#d2162c] hover:underline"
                >
                  ouvrir
                </a>
              </p>
            )}

            <Button type="submit" variant="primary">
              {hasDocument ? "Remplacer le document" : "Envoyer le document"}
            </Button>
          </form>
        </Panel>

        <Panel title="Ce que la vérification débloque">
          <ul className="space-y-2 text-[12.5px] text-[#565959]">
            <li>Le badge « vérifiée » sur votre vitrine et sur vos fiches produit.</li>
            <li>L&apos;accès aux catégories réservées aux boutiques vérifiées.</li>
            <li>Une mise en ligne des produits sans examen préalable systématique.</li>
          </ul>
        </Panel>
      </div>
    </>
  );
}
