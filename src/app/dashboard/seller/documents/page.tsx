import { requireSeller, formatDate } from "@/lib/seller";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, EmptyState, Notice, Stat, StatRow,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

export default async function SellerDocumentsPage() {
  const { supabase, uid, profile, roleLabel } = await requireSeller("/dashboard/seller/documents");

  const { data: stores, error } = await supabase
    .from("stores")
    .select("id, name, slug, is_verified, legal_doc_url, created_at")
    .eq("owner_id", uid)
    .order("created_at", { ascending: true });

  if (error) console.error("[seller/documents]", error.message);

  const storeList = stores ?? [];

  const personal = [
    { label: "Pièce d'identité", done: true, note: "Fournie à l'inscription" },
    { label: "Adresse personnelle", done: Boolean(profile.address_verified), note: "Justificatif de domicile" },
    { label: "Contrat marketplace MACHE", done: true, note: "Accepté à la création du compte" },
  ];

  const missingPersonal = personal.filter((item) => !item.done).length;
  const missingStores = storeList.filter((store) => !store.legal_doc_url).length;

  return (
    <>
      <PageHeader
        title="Documents"
        subtitle="Pièces exigées pour vendre sur MACHE. Une boutique sans document légal ne peut pas être vérifiée."
      />

      <div className="space-y-4">
        {error && <Notice tone="warning" title="Documents indisponibles">{error.message}</Notice>}

        <StatRow>
          <Stat label="Documents personnels" value={`${personal.length - missingPersonal}/${personal.length}`} tone={missingPersonal ? "warning" : "success"} />
          <Stat label="Boutiques conformes" value={`${storeList.length - missingStores}/${storeList.length || 0}`} tone={missingStores ? "warning" : "success"} />
          <Stat label="Boutiques vérifiées" value={`${storeList.filter((s) => s.is_verified).length}/${storeList.length || 0}`} />
        </StatRow>

        {(missingPersonal > 0 || missingStores > 0) && (
          <Notice tone="warning" title="Des pièces manquent">
            Tant que ces documents ne sont pas fournis, la vérification de vos boutiques reste
            en attente et certaines catégories de produits vous sont fermées.
          </Notice>
        )}

        <Panel title="Documents personnels" description={roleLabel} padded={false}>
          <Table
            columns={[
              { key: "doc", label: "Document" },
              { key: "note", label: "Détail" },
              { key: "status", label: "État", align: "right" },
            ]}
          >
            {personal.map((item) => (
              <Row key={item.label}>
                <Cell strong>{item.label}</Cell>
                <Cell muted>{item.note}</Cell>
                <Cell align="right">
                  <Badge tone={item.done ? "success" : "warning"}>
                    {item.done ? "Validé" : "À fournir"}
                  </Badge>
                </Cell>
              </Row>
            ))}
          </Table>
        </Panel>

        <Panel title="Documents par boutique" padded={false}>
          {storeList.length === 0 ? (
            <EmptyState title="Aucune boutique" description="Les documents légaux sont demandés à la création d'une boutique." action={<Button href="/dashboard/seller/stores/new" variant="primary">Créer une boutique</Button>} />
          ) : (
            <Table
              columns={[
                { key: "store", label: "Boutique" },
                { key: "created", label: "Créée le" },
                { key: "legal", label: "Document légal" },
                { key: "verified", label: "Vérification" },
                { key: "actions", label: "", align: "right", width: "110px" },
              ]}
            >
              {storeList.map((store) => (
                <Row key={store.id}>
                  <Cell strong>{store.name?.trim() || "Sans nom"}</Cell>
                  <Cell muted>{formatDate(store.created_at)}</Cell>
                  <Cell>
                    <Badge tone={store.legal_doc_url ? "success" : "danger"}>
                      {store.legal_doc_url ? "Fourni" : "Manquant"}
                    </Badge>
                  </Cell>
                  <Cell>
                    <Badge tone={store.is_verified ? "success" : "warning"}>
                      {store.is_verified ? "Vérifiée" : "En attente"}
                    </Badge>
                  </Cell>
                  <Cell align="right">
                    <Button href={`/dashboard/seller/stores/${store.id}/documents`} size="sm">
                      Gérer
                    </Button>
                  </Cell>
                </Row>
              ))}
            </Table>
          )}
        </Panel>
      </div>
    </>
  );
}
