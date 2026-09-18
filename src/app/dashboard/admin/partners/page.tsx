/*
  PAGE : Administration — partenaires

  Sert à :
  - lister les prestataires rattachés à des vendeurs ;
  - voir les comptes portant le rôle partenaire.

  Remplace un encart qui annonçait « Ici on reliera les partenaires aux
  vendeurs, comme livraison, financement, export/import et services ».

  Le rattachement d'un partenaire à un vendeur n'est pas créé depuis cet
  écran : il engage deux comptes tiers, et l'accord du vendeur concerné.
  Tant que ce consentement n'est pas modélisé, l'administration le
  constate plutôt que de l'imposer.
*/

import { requireAdmin, ROLE_LABELS } from "@/lib/admin";
import { formatNumber, formatDate } from "@/lib/seller";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, EmptyState, Stat, StatRow, Notice,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

export default async function AdminPartnersPage() {
  const { supabase } = await requireAdmin("/dashboard/admin/partners");

  const [linksResult, accountsResult] = await Promise.all([
    supabase
      .from("partner_vendors")
      .select("id, partner_id, vendor_id, relation_type, is_active, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("users")
      .select("id, email, full_name, role, created_at")
      .eq("role", "partner")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const links = linksResult.data ?? [];
  const accounts = accountsResult.data ?? [];

  /*
    Les identifiants des liens ne parlent pas : on recharge les comptes
    concernés pour afficher des noms. Une jointure PostgREST supposerait
    deux clés étrangères détectées vers la même table, ce qui n'est pas
    garanti ici.
  */
  const ids = [
    ...new Set(
      links.flatMap((link) => [String(link.partner_id), String(link.vendor_id)])
    ),
  ].filter(Boolean);

  const namesResult = ids.length
    ? await supabase.from("users").select("id, full_name, email").in("id", ids)
    : { data: [] };

  const nameById = new Map(
    (namesResult.data ?? []).map((user) => [
      String(user.id),
      user.full_name?.trim() || user.email || String(user.id).slice(0, 8),
    ])
  );

  const label = (id: string) => nameById.get(String(id)) || String(id).slice(0, 8);

  const activeLinks = links.filter((link) => link.is_active).length;

  return (
    <>
      <PageHeader
        title="Partenaires"
        subtitle="Prestataires de la marketplace et rattachements aux vendeurs."
      />

      <div className="space-y-4">
        {linksResult.error && (
          <Notice tone="warning" title="Rattachements indisponibles">
            {linksResult.error.message}. La table partner_vendors vient de votre
            propre schéma : vérifiez qu&apos;elle existe et que ce compte peut
            la lire.
          </Notice>
        )}

        <StatRow>
          <Stat label="Comptes partenaires" value={formatNumber(accounts.length)} />
          <Stat label="Rattachements" value={formatNumber(links.length)} />
          <Stat label="Actifs" value={formatNumber(activeLinks)} tone={activeLinks ? "success" : "default"} />
        </StatRow>

        <Panel
          title="Rattachements partenaire / vendeur"
          description="Qui peut intervenir sur l'activité de qui."
          padded={false}
        >
          {links.length === 0 ? (
            <EmptyState
              title="Aucun rattachement"
              description="Un prestataire n'apparaît ici qu'une fois relié à un vendeur."
            />
          ) : (
            <Table
              columns={[
                { key: "p", label: "Partenaire" },
                { key: "v", label: "Vendeur" },
                { key: "t", label: "Type d'intervention" },
                { key: "d", label: "Depuis" },
                { key: "s", label: "État", align: "right" },
              ]}
            >
              {links.map((link) => (
                <Row key={link.id}>
                  <Cell strong>{label(String(link.partner_id))}</Cell>
                  <Cell muted>{label(String(link.vendor_id))}</Cell>
                  <Cell muted>{link.relation_type || "service"}</Cell>
                  <Cell muted>{formatDate(link.created_at)}</Cell>
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

        <Panel
          title="Comptes partenaires"
          description="Comptes portant le rôle partenaire."
          padded={false}
        >
          {accounts.length === 0 ? (
            <EmptyState
              title="Aucun compte partenaire"
              description="Attribuez le rôle partenaire depuis l'écran des comptes."
              action={<Button href="/dashboard/admin/users">Voir les comptes</Button>}
            />
          ) : (
            <Table
              columns={[
                { key: "n", label: "Compte" },
                { key: "r", label: "Rôle" },
                { key: "d", label: "Inscrit le" },
              ]}
            >
              {accounts.map((account) => (
                <Row key={account.id}>
                  <Cell strong>
                    {account.full_name?.trim() || "Sans nom"}
                    <span className="mt-0.5 block text-[10.5px] font-normal text-[#767676]">
                      {account.email}
                    </span>
                  </Cell>
                  <Cell>
                    <Badge tone="info">{ROLE_LABELS[String(account.role)] || account.role}</Badge>
                  </Cell>
                  <Cell muted>{formatDate(account.created_at)}</Cell>
                </Row>
              ))}
            </Table>
          )}
        </Panel>

        <Notice tone="info" title="Pourquoi on ne crée pas un rattachement ici">
          Relier un prestataire à un vendeur lui donne accès à l&apos;activité
          de ce vendeur. Cet accord appartient au vendeur, pas à
          l&apos;administration : tant que ce consentement n&apos;est pas
          demandé dans l&apos;espace vendeur, cet écran constate les liens
          existants sans en imposer de nouveaux.
        </Notice>
      </div>
    </>
  );
}
