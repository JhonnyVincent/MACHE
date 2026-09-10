import { requireSeller, formatDate } from "@/lib/seller";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, Notice,
} from "@/components/seller/ui";
import { PLAN_LIMITS } from "@/lib/seller";

export const dynamic = "force-dynamic";

export default async function SellerSettingsPage() {
  const { profile, email, roleLabel, role, limits, displayName } =
    await requireSeller("/dashboard/seller/settings");

  const plans = Object.entries(PLAN_LIMITS);

  return (
    <>
      <PageHeader title="Paramètres" subtitle="Informations du compte vendeur et détail de votre offre." />

      <div className="space-y-4">
        <Panel title="Compte" padded={false}>
          <Table
            columns={[
              { key: "field", label: "Champ", width: "240px" },
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
              <Cell strong>{roleLabel}</Cell>
            </Row>
            <Row>
              <Cell muted>Adresse vérifiée</Cell>
              <Cell>
                <Badge tone={profile.address_verified ? "success" : "warning"}>
                  {profile.address_verified ? "Vérifiée" : "À vérifier"}
                </Badge>
              </Cell>
            </Row>
            <Row>
              <Cell muted>Compte créé le</Cell>
              <Cell muted>{formatDate(profile.created_at)}</Cell>
            </Row>
          </Table>
        </Panel>

        <Notice tone="info" title="Modification des informations">
          La modification du nom et de l&apos;adresse e-mail n&apos;est pas encore ouverte
          depuis cette page. Passez par l&apos;assistance pour toute correction.
        </Notice>

        <Panel title="Offres disponibles" description={`Votre offre actuelle : ${limits.planName}`} padded={false}>
          <Table
            columns={[
              { key: "plan", label: "Offre" },
              { key: "stores", label: "Boutiques", align: "right" },
              { key: "articles", label: "Produits / boutique", align: "right" },
              { key: "commission", label: "Commission", align: "right" },
              { key: "current", label: "", align: "right", width: "110px" },
            ]}
          >
            {plans.map(([key, plan]) => (
              <Row key={key}>
                <Cell strong>{plan.planName}</Cell>
                <Cell align="right" numeric>{plan.maxStores}</Cell>
                <Cell align="right" numeric>{plan.maxArticlesPerStore.toLocaleString("fr-FR")}</Cell>
                <Cell align="right" numeric>{plan.commission}</Cell>
                <Cell align="right">
                  {key === role ? <Badge tone="success">Votre offre</Badge> : null}
                </Cell>
              </Row>
            ))}
          </Table>
        </Panel>

        <Panel title="Sécurité">
          <p className="text-[12.5px] leading-relaxed text-[#565959]">
            Vous pouvez vous connecter par mot de passe ou par code à usage unique envoyé par
            e-mail. Le code évite d&apos;avoir à retenir un mot de passe et fonctionne depuis
            n&apos;importe quel appareil.
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
