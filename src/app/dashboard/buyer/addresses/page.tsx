/*
  PAGE : mes adresses

  Lit le carnet d'adresses Medusa. Il lisait auparavant la table Supabase
  `addresses`, qui n'est plus celle utilisée au moment de commander : le
  client aurait modifié une adresse sans effet sur ses livraisons.
*/

import { getCustomer, getCustomerAddresses } from "@/lib/medusa/customer";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, EmptyState, Notice,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

export default async function BuyerAddressesPage() {
  const customer = await getCustomer();

  if (!customer) {
    return (
      <>
        <PageHeader title="Mes adresses" />
        <Panel padded={false}>
          <EmptyState
            title="Connectez-vous"
            description="Votre carnet d'adresses est rattaché à votre compte."
            action={
              <Button href="/compte/connexion?next=/dashboard/buyer/addresses" variant="primary">
                Se connecter
              </Button>
            }
          />
        </Panel>
      </>
    );
  }

  const result = await getCustomerAddresses();
  const addresses = result.ok ? result.data : [];

  return (
    <>
      <PageHeader
        title="Mes adresses"
        subtitle="Les adresses de livraison enregistrées sur votre compte."
      />

      <div className="space-y-4">
        {!result.ok && (
          <Notice tone="warning" title="Carnet d'adresses indisponible">
            {result.reason}
          </Notice>
        )}

        <Panel padded={false}>
          {addresses.length === 0 ? (
            <EmptyState
              title="Aucune adresse enregistrée"
              description="L'adresse saisie lors d'une commande est conservée sur votre compte."
              action={<Button href="/shop" variant="primary">Voir le catalogue</Button>}
            />
          ) : (
            <Table
              columns={[
                { key: "n", label: "Destinataire" },
                { key: "a", label: "Adresse" },
                { key: "t", label: "Téléphone" },
                { key: "d", label: "", align: "right", width: "110px" },
              ]}
            >
              {addresses.map((address) => (
                <Row key={address.id}>
                  <Cell strong>
                    {[address.firstName, address.lastName].filter(Boolean).join(" ") || "—"}
                  </Cell>
                  <Cell muted>
                    {address.address1}
                    {address.address2 ? `, ${address.address2}` : ""}
                    <span className="mt-0.5 block text-[11px]">
                      {[address.city, address.province, address.countryCode]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </Cell>
                  <Cell muted>{address.phone ?? "—"}</Cell>
                  <Cell align="right">
                    {address.isDefaultShipping && <Badge tone="info">Par défaut</Badge>}
                  </Cell>
                </Row>
              ))}
            </Table>
          )}
        </Panel>

        <Notice tone="info" title="Modifier une adresse">
          L&apos;adresse se saisit au moment de commander, et celle que vous
          y renseignez est conservée ici. La modification directe depuis
          cette page n&apos;est pas encore branchée : elle viendra avec la
          gestion complète du carnet d&apos;adresses.
        </Notice>
      </div>
    </>
  );
}
