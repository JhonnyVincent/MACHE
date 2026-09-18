/*
  PAGE : Administration — vue d'ensemble

  Sert à :
  - donner l'état réel de la marketplace : comptes, boutiques, catalogue,
    commandes, modération ;
  - pointer ce qui demande une décision humaine.

  Tous les nombres viennent de `count: "exact"` sur la base. Aucun n'est
  estimé, et aucune variation n'est affichée : MACHÉ ne conserve pas
  d'historique de ces compteurs, donc « +18 % ce mois-ci » serait inventé.
*/

import { requireAdmin } from "@/lib/admin";
import { formatNumber, formatHTG } from "@/lib/seller";
import { PENDING_STATUSES } from "@/lib/moderation";
import { SELLER_ROLES } from "@/lib/authz";
import {
  PageHeader, Panel, Stat, StatRow, Table, Row, Cell, Button, Notice,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const { supabase, isSuperAdmin, firstName } = await requireAdmin();

  /*
    Les compteurs sont écrits à plat plutôt que derrière un utilitaire :
    chaque ligne dit exactement ce qu'elle compte, et une erreur de lecture
    se rattache à un compteur précis.
  */
  const [users, sellers, stores, unverified, products, pending, orders, agents] =
    await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("users").select("id", { count: "exact", head: true }).in("role", [...SELLER_ROLES]),
      supabase.from("stores").select("id", { count: "exact", head: true }),
      supabase.from("stores").select("id", { count: "exact", head: true }).eq("is_verified", false),
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }).in("status", [...PENDING_STATUSES]),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("agent_profiles").select("id", { count: "exact", head: true }),
    ]);

  const n = (result: { count: number | null }) => result.count ?? 0;

  /* Chiffre d'affaires réel de la marketplace, lignes de commande à l'appui. */
  const { data: lines } = await supabase
    .from("order_items")
    .select("subtotal, commission_amount")
    .limit(5000);

  const gross = (lines ?? []).reduce((sum, line) => sum + (line.subtotal ?? 0), 0);
  const commission = (lines ?? []).reduce(
    (sum, line) => sum + (line.commission_amount ?? 0),
    0
  );

  const todo = [
    n(pending) > 0 && {
      label: `${formatNumber(n(pending))} produit(s) en attente d'examen`,
      href: "/dashboard/admin/products",
      action: "Modérer",
    },
    n(unverified) > 0 && {
      label: `${formatNumber(n(unverified))} boutique(s) non vérifiée(s)`,
      href: "/dashboard/admin/stores",
      action: "Vérifier",
    },
    n(agents) === 0 && {
      label: "Aucun agent enregistré : la vérification publique ne trouvera personne",
      href: "/dashboard/admin/agents",
      action: "Enregistrer",
    },
  ].filter(Boolean) as { label: string; href: string; action: string }[];

  const readErrors = [users, stores, products, orders, agents]
    .map((result) => result.error?.message)
    .filter(Boolean);

  return (
    <>
      <PageHeader
        title={`Bonjour ${firstName}`}
        subtitle={
          isSuperAdmin
            ? "Accès complet : comptes, rôles, boutiques, catalogue et contenu du site."
            : "Accès administrateur : modération, boutiques et contenu du site."
        }
        actions={<Button href="/dashboard/admin/products" variant="primary">File de modération</Button>}
      />

      <div className="space-y-4">
        {readErrors.length > 0 && (
          <Notice tone="warning" title="Certains compteurs sont indisponibles">
            {readErrors[0]}. Les migrations 0001 à 0006 doivent être appliquées,
            et les politiques de lecture doivent autoriser ce compte.
          </Notice>
        )}

        <StatRow>
          <Stat label="Comptes" value={formatNumber(n(users))} hint={`${formatNumber(n(sellers))} vendeur(s)`} />
          <Stat label="Boutiques" value={formatNumber(n(stores))} hint={`${formatNumber(n(unverified))} à vérifier`} />
          <Stat label="Produits" value={formatNumber(n(products))} />
          <Stat
            label="En attente d'examen"
            value={formatNumber(n(pending))}
            tone={n(pending) ? "warning" : "success"}
          />
          <Stat label="Commandes" value={formatNumber(n(orders))} />
        </StatRow>

        <StatRow>
          <Stat label="Volume d'affaires" value={formatHTG(gross)} hint="somme des lignes de commande" />
          <Stat label="Commission MACHÉ" value={formatHTG(commission)} tone="success" />
          <Stat label="Agents habilités" value={formatNumber(n(agents))} tone={n(agents) ? "default" : "warning"} />
        </StatRow>

        {todo.length > 0 && (
          <Panel title="Décisions en attente" padded={false}>
            <Table
              columns={[
                { key: "l", label: "Point" },
                { key: "a", label: "", align: "right", width: "140px" },
              ]}
            >
              {todo.map((task) => (
                <Row key={task.label}>
                  <Cell strong>{task.label}</Cell>
                  <Cell align="right">
                    <Button href={task.href} size="sm">{task.action}</Button>
                  </Cell>
                </Row>
              ))}
            </Table>
          </Panel>
        )}

        <Notice tone="info" title="Ce que cette page ne dit pas">
          Aucune évolution dans le temps n&apos;est affichée : MACHÉ ne
          conserve pas d&apos;historique de ces compteurs, et une variation
          calculée sans point de comparaison serait inventée. Les visites et
          le trafic demandent un suivi d&apos;audience qui n&apos;est pas
          installé.
        </Notice>
      </div>
    </>
  );
}
