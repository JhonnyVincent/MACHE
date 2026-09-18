/*
  PAGE : mon profil

  Les informations viennent du compte client Medusa.
*/

import { getCustomer } from "@/lib/medusa/customer";
import {
  PageHeader, Panel, Table, Row, Cell, Button, EmptyState, Notice,
} from "@/components/seller/ui";
import { logoutAction } from "@/app/compte/actions";

export const dynamic = "force-dynamic";

export default async function BuyerProfilePage() {
  const customer = await getCustomer();

  if (!customer) {
    return (
      <>
        <PageHeader title="Mon profil" />
        <Panel padded={false}>
          <EmptyState
            title="Connectez-vous"
            description="Votre profil est rattaché à votre compte client."
            action={
              <Button href="/compte/connexion?next=/dashboard/buyer/profile" variant="primary">
                Se connecter
              </Button>
            }
          />
        </Panel>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Mon profil" subtitle="Les informations de votre compte MACHÉ." />

      <div className="space-y-4">
        <Panel padded={false}>
          <Table columns={[{ key: "k", label: "Élément" }, { key: "v", label: "Valeur" }]}>
            <Row>
              <Cell strong>Prénom</Cell>
              <Cell muted>{customer.firstName ?? "—"}</Cell>
            </Row>
            <Row>
              <Cell strong>Nom</Cell>
              <Cell muted>{customer.lastName ?? "—"}</Cell>
            </Row>
            <Row>
              <Cell strong>Adresse e-mail</Cell>
              <Cell muted>{customer.email}</Cell>
            </Row>
            <Row>
              <Cell strong>Téléphone</Cell>
              <Cell muted>{customer.phone ?? "—"}</Cell>
            </Row>
          </Table>
        </Panel>

        <Panel title="Se déconnecter">
          <p className="max-w-2xl text-sm leading-relaxed text-[#565959]">
            Votre panier en cours n&apos;est pas supprimé : il reste attaché à
            ce navigateur.
          </p>
          <form action={logoutAction} className="mt-3">
            <Button type="submit">Se déconnecter</Button>
          </form>
        </Panel>

        <Notice tone="info" title="Modifier ces informations">
          La modification du profil et du mot de passe n&apos;est pas encore
          branchée. Écrivez à l&apos;équipe MACHÉ si une information est
          erronée — plutôt qu&apos;un formulaire qui n&apos;enregistrerait
          rien.
        </Notice>
      </div>
    </>
  );
}
