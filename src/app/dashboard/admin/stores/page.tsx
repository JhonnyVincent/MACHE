/*
  PAGE : Administration — boutiques

  Sert à :
  - voir les boutiques de la marketplace et l'état de leur dossier ;
  - accorder ou retirer la vérification.

  L'ordre de tri n'est pas anodin : les boutiques ayant fourni un document
  et attendant une décision remontent, parce que ce sont celles qui
  attendent quelque chose de vous.
*/

import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { categoryLabel } from "@/lib/categories";
import { formatNumber, formatDate } from "@/lib/seller";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, EmptyState, Stat, StatRow,
  Notice, Input, FormFeedback,
} from "@/components/seller/ui";
import { setStoreVerificationAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminStoresPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; success?: string; error?: string }>;
}) {
  const query = searchParams ? await searchParams : {};
  const search = String(query.q || "").trim();

  const { supabase } = await requireAdmin("/dashboard/admin/stores");

  let request = supabase
    .from("stores")
    .select("id, name, slug, category, seller_type, is_active, is_verified, legal_doc_url, created_at, rating_average, rating_count")
    .order("created_at", { ascending: false })
    .limit(200);

  if (search) {
    request = request.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
  }

  const { data: stores, error } = await request;
  const list = stores ?? [];

  /*
    Boutiques à traiter d'abord : document fourni, vérification pas encore
    accordée.
  */
  const waiting = list.filter((store) => store.legal_doc_url && !store.is_verified);
  const rest = list.filter((store) => !(store.legal_doc_url && !store.is_verified));
  const ordered = [...waiting, ...rest];

  const verified = list.filter((store) => store.is_verified).length;
  const closed = list.filter((store) => store.is_active === false).length;
  const noDoc = list.filter((store) => !store.legal_doc_url).length;

  return (
    <>
      <PageHeader
        title="Boutiques"
        subtitle="Dossiers et vérifications."
      />

      <div className="space-y-4">
        <FormFeedback
          success={query.success}
          error={query.error}
          successMessages={{
            verified: "La boutique est désormais vérifiée.",
            unverified: "La vérification a été retirée.",
          }}
        />

        {error && (
          <Notice tone="warning" title="Boutiques indisponibles">
            {error.message}
          </Notice>
        )}

        <StatRow>
          <Stat label="Boutiques" value={formatNumber(list.length)} />
          <Stat label="Vérifiées" value={formatNumber(verified)} tone="success" />
          <Stat
            label="En attente de décision"
            value={formatNumber(waiting.length)}
            tone={waiting.length ? "warning" : "default"}
          />
          <Stat label="Sans document" value={formatNumber(noDoc)} />
          <Stat label="Fermées" value={formatNumber(closed)} />
        </StatRow>

        <Panel title="Rechercher">
          <form method="GET" className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                name="q"
                defaultValue={search}
                placeholder="Nom ou adresse de la boutique"
                aria-label="Rechercher une boutique"
              />
            </div>
            <Button type="submit" variant="primary">Chercher</Button>
            {search && (
              <Link
                href="/dashboard/admin/stores"
                className="self-center text-[12px] text-[#565959] hover:underline"
              >
                Réinitialiser
              </Link>
            )}
          </form>
        </Panel>

        <Panel
          title="Boutiques"
          description="Celles qui ont fourni un document et attendent une décision sont en tête."
          padded={false}
        >
          {ordered.length === 0 ? (
            <EmptyState
              title="Aucune boutique"
              description={
                search
                  ? "Aucune boutique ne correspond à cette recherche."
                  : "Aucune boutique n'a encore été créée."
              }
            />
          ) : (
            <Table
              columns={[
                { key: "n", label: "Boutique" },
                { key: "c", label: "Catégorie" },
                { key: "d", label: "Document" },
                { key: "r", label: "Note" },
                { key: "s", label: "État" },
                { key: "a", label: "", align: "right", width: "200px" },
              ]}
            >
              {ordered.map((store) => (
                <Row key={store.id}>
                  <Cell strong>
                    <Link
                      href={`/store/${store.slug || store.id}`}
                      className="hover:underline"
                    >
                      {store.name?.trim() || "Sans nom"}
                    </Link>
                    <span className="mt-0.5 block text-[10.5px] font-normal text-[#767676]">
                      Créée le {formatDate(store.created_at)}
                    </span>
                  </Cell>
                  <Cell muted>{store.category ? categoryLabel(store.category) : "—"}</Cell>
                  <Cell>
                    {store.legal_doc_url ? (
                      <a
                        href={String(store.legal_doc_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[12px] font-medium text-[#d2162c] hover:underline"
                      >
                        Ouvrir
                      </a>
                    ) : (
                      <Badge tone="danger">Manquant</Badge>
                    )}
                  </Cell>
                  <Cell muted numeric>
                    {store.rating_count
                      ? `${Number(store.rating_average).toFixed(1)} (${formatNumber(store.rating_count)})`
                      : "—"}
                  </Cell>
                  <Cell>
                    <span className="flex flex-wrap gap-1">
                      <Badge tone={store.is_verified ? "success" : "warning"}>
                        {store.is_verified ? "Vérifiée" : "Non vérifiée"}
                      </Badge>
                      {store.is_active === false && <Badge tone="neutral">Fermée</Badge>}
                    </span>
                  </Cell>
                  <Cell align="right">
                    <form action={setStoreVerificationAction} className="flex justify-end">
                      <input type="hidden" name="store_id" value={store.id} />
                      <input
                        type="hidden"
                        name="verified"
                        value={String(!store.is_verified)}
                      />
                      <Button
                        type="submit"
                        size="sm"
                        variant={store.is_verified ? "secondary" : "primary"}
                      >
                        {store.is_verified ? "Retirer la vérification" : "Vérifier"}
                      </Button>
                    </form>
                  </Cell>
                </Row>
              ))}
            </Table>
          )}
        </Panel>

        <Notice tone="info" title="Ce que la vérification déclenche">
          Le badge apparaît sur la vitrine et les fiches produit, et les
          produits de cette boutique passent en publication directe au lieu
          d&apos;attendre un examen. Elle ne peut pas être accordée à une
          boutique n&apos;ayant fourni aucun document.
        </Notice>
      </div>
    </>
  );
}
