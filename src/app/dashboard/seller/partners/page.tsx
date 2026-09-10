import { requireSeller } from "@/lib/seller";
import { PageHeader, Panel, Button, Notice, Table, Row, Cell, Badge, EmptyState } from "@/components/seller/ui";

export const dynamic = "force-dynamic";

const SERVICES = [
  { name: "Logistique et livraison", detail: "Prise en charge des colis, livraison en Haïti et vers la diaspora.", status: "En cours d'intégration" },
  { name: "Photographie produit", detail: "Prises de vue de vos articles, aux normes de la marketplace.", status: "Disponible sur demande" },
  { name: "Import et sourcing", detail: "Mise en relation avec des fournisseurs et gestion des formalités d'import.", status: "Disponible sur demande" },
  { name: "Comptabilité", detail: "Suivi des ventes, déclarations et bilans pour les vendeurs professionnels.", status: "En cours d'intégration" },
];

export default async function SellerPartnersPage() {
  const { supabase, uid } = await requireSeller("/dashboard/seller/partners");

  /*
    La table partner_vendors relie un partenaire à un vendeur. La politique
    RLS autorise le vendeur à lire ses propres liens.
  */
  const { data: links, error } = await supabase
    .from("partner_vendors")
    .select("id, partner_id, relation_type, is_active, created_at")
    .eq("vendor_id", uid);

  if (error) console.error("[seller/partners]", error.message);

  const partnerships = links ?? [];

  return (
    <>
      <PageHeader
        title="Partenaires"
        subtitle="Prestataires qui peuvent intervenir sur votre activité, et services proposés autour de la marketplace."
      />

      <div className="space-y-4">
        <Panel title="Vos partenaires" description="Prestataires rattachés à votre compte" padded={false}>
          {error ? (
            <div className="p-4">
              <Notice tone="warning" title="Liste indisponible">
                {error.message}
              </Notice>
            </div>
          ) : partnerships.length === 0 ? (
            <EmptyState
              title="Aucun partenaire rattaché"
              description="Quand un prestataire est autorisé à intervenir sur votre compte, il apparaît ici avec l'étendue de ses droits."
            />
          ) : (
            <Table
              columns={[
                { key: "partner", label: "Partenaire" },
                { key: "type", label: "Type d'intervention" },
                { key: "status", label: "État", align: "right" },
              ]}
            >
              {partnerships.map((link) => (
                <Row key={link.id}>
                  <Cell strong>{String(link.partner_id).slice(0, 8)}</Cell>
                  <Cell muted>{link.relation_type || "service"}</Cell>
                  <Cell align="right">
                    <Badge tone={link.is_active ? "success" : "neutral"}>
                      {link.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </Cell>
                </Row>
              ))}
            </Table>
          )}
        </Panel>

        <Panel title="Services disponibles" padded={false}>
          <Table
            columns={[
              { key: "service", label: "Service" },
              { key: "detail", label: "Description" },
              { key: "status", label: "Disponibilité", align: "right" },
            ]}
          >
            {SERVICES.map((service) => (
              <Row key={service.name}>
                <Cell strong>{service.name}</Cell>
                <Cell muted>{service.detail}</Cell>
                <Cell align="right">
                  <Badge tone={service.status.startsWith("Disponible") ? "success" : "neutral"}>
                    {service.status}
                  </Badge>
                </Cell>
              </Row>
            ))}
          </Table>
        </Panel>

        <Panel title="Devenir partenaire">
          <p className="text-[12.5px] leading-relaxed text-[#565959]">
            Vous proposez un service utile aux vendeurs de la marketplace — logistique,
            photo, comptabilité, formation ? Présentez votre activité à l&apos;équipe.
          </p>
          <div className="mt-3">
            <Button href="/contact">Proposer un service</Button>
          </div>
        </Panel>
      </div>
    </>
  );
}
