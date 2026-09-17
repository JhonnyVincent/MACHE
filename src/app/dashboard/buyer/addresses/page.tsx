/*
  PAGE : Espace client — mes adresses

  Sert à :
  - lister les adresses enregistrées par le client ;
  - expliquer comment elles sont créées.

  Les adresses sont enregistrées depuis le tunnel d'achat, quand le client
  coche « Enregistrer cette adresse ». Un formulaire d'ajout autonome
  viendra avec la gestion complète du profil ; l'annoncer plutôt que
  d'afficher un bouton sans effet.
*/

import { requireBuyer } from "@/lib/buyer";
import { formatDate } from "@/lib/seller";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, EmptyState, Notice,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

export default async function BuyerAddressesPage() {
  const { supabase, uid } = await requireBuyer("/dashboard/buyer/addresses");

  const { data: addresses, error } = await supabase
    .from("addresses")
    .select("id, label, full_name, phone, line1, line2, city, department, is_default, created_at")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });

  if (error) console.error("[buyer/addresses]", error.message);

  const list = addresses ?? [];

  return (
    <>
      <PageHeader
        title="Mes adresses"
        subtitle="Les adresses enregistrées lors de vos commandes."
      />

      <div className="space-y-4">
        {error && (
          <Notice tone="warning" title="Adresses indisponibles">
            {error.message}. La migration 0001 doit être appliquée à la base.
          </Notice>
        )}

        <Panel padded={false}>
          {list.length === 0 ? (
            <EmptyState
              title="Aucune adresse enregistrée"
              description="Lors de votre prochaine commande, cochez « Enregistrer cette adresse » pour la retrouver ici et ne plus la resaisir."
              action={<Button href="/shop" variant="primary">Voir le catalogue</Button>}
            />
          ) : (
            <Table
              columns={[
                { key: "name", label: "Destinataire" },
                { key: "address", label: "Adresse" },
                { key: "zone", label: "Zone" },
                { key: "added", label: "Ajoutée le" },
              ]}
            >
              {list.map((address) => (
                <Row key={address.id}>
                  <Cell strong>
                    {address.full_name}
                    <span className="mt-0.5 block text-[11px] font-normal text-[#565959]">
                      {address.phone}
                    </span>
                    {address.is_default && (
                      <span className="mt-1 inline-block">
                        <Badge tone="success">Par défaut</Badge>
                      </span>
                    )}
                  </Cell>
                  <Cell muted>
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}
                    <span className="mt-0.5 block">{address.city}</span>
                  </Cell>
                  <Cell muted>{address.department || "—"}</Cell>
                  <Cell muted>{formatDate(address.created_at)}</Cell>
                </Row>
              ))}
            </Table>
          )}
        </Panel>
      </div>
    </>
  );
}
