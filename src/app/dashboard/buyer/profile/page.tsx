/*
  PAGE : Espace client — profil

  Sert à :
  - afficher les informations du compte ;
  - rappeler les moyens de connexion disponibles.

  La modification du nom et de l'e-mail n'est pas encore ouverte : elle
  touche à l'authentification et sera traitée avec la gestion du compte.
  C'est annoncé plutôt que présenté par un bouton sans effet.
*/

import { requireBuyer } from "@/lib/buyer";
import { formatDate } from "@/lib/seller";
import { PageHeader, Panel, Table, Row, Cell, Button, Notice } from "@/components/seller/ui";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  buyer: "Client",
  seller_individual: "Vendeur particulier",
  seller_business: "Vendeur Business",
  supplier: "Fournisseur",
  official_brand: "Marque officielle",
  agent: "Agent",
  partner: "Partenaire",
  admin: "Administrateur",
  super_admin: "Super administrateur",
};

export default async function BuyerProfilePage() {
  const { profile, email, displayName, role } = await requireBuyer("/dashboard/buyer/profile");

  return (
    <>
      <PageHeader title="Mon profil" subtitle="Informations de votre compte MACHE." />

      <div className="space-y-4">
        <Panel padded={false}>
          <Table
            columns={[
              { key: "field", label: "Champ", width: "220px" },
              { key: "value", label: "Valeur" },
            ]}
          >
            <Row>
              <Cell muted>Nom</Cell>
              <Cell strong>{displayName}</Cell>
            </Row>
            <Row>
              <Cell muted>Adresse e-mail</Cell>
              <Cell strong>{email || "—"}</Cell>
            </Row>
            <Row>
              <Cell muted>Type de compte</Cell>
              <Cell strong>{ROLE_LABELS[role] || role || "Client"}</Cell>
            </Row>
            <Row>
              <Cell muted>Compte créé le</Cell>
              <Cell muted>{formatDate(profile?.created_at)}</Cell>
            </Row>
          </Table>
        </Panel>

        <Notice tone="info" title="Modification des informations">
          La modification du nom et de l&apos;adresse e-mail n&apos;est pas
          encore ouverte depuis cette page. Passez par l&apos;assistance pour
          toute correction.
        </Notice>

        <Panel title="Connexion">
          <p className="text-[12.5px] leading-relaxed text-[#565959]">
            Vous pouvez vous connecter par mot de passe ou par code à usage
            unique envoyé par e-mail. Le code fonctionne depuis n&apos;importe
            quel appareil, sans mot de passe à retenir.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button href="/forgot-password">Changer mon mot de passe</Button>
            <Button href="/login/code">Se connecter par code</Button>
          </div>
        </Panel>
      </div>
    </>
  );
}
