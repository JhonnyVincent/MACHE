/*
  PAGE : Administration — vue d'ensemble

  Ce que cet espace couvre, et ce qu'il ne couvre plus

  Le catalogue, les commandes, les régions, les taxes et la modération des
  produits sont passés au panneau d'administration de Medusa, qui en est
  la source de vérité. Les compteurs correspondants ont été retirés
  d'ici : ils lisaient encore Supabase et affichaient donc des chiffres
  morts — un catalogue figé, un chiffre d'affaires d'avant la bascule.

  Restent les écrans que Medusa ne connaît pas, parce qu'ils sont propres
  à MACHÉ : l'habilitation des agents, la vérification des boutiques, les
  rôles des comptes et les partenaires.
*/

import { requireAdmin } from "@/lib/admin";
import { formatNumber } from "@/lib/seller";
import { SELLER_ROLES } from "@/lib/authz";
import { medusaBackendUrl } from "@/lib/medusa/config";
import {
  PageHeader, Panel, Stat, StatRow, Table, Row, Cell, Button, Notice,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const { supabase, isSuperAdmin, firstName } = await requireAdmin();

  const [users, sellers, stores, unverified, agents] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("users").select("id", { count: "exact", head: true }).in("role", [...SELLER_ROLES]),
    supabase.from("stores").select("id", { count: "exact", head: true }),
    supabase.from("stores").select("id", { count: "exact", head: true }).eq("is_verified", false),
    supabase.from("agent_profiles").select("id", { count: "exact", head: true }),
  ]);

  const n = (result: { count: number | null }) => result.count ?? 0;

  const backendUrl = medusaBackendUrl();

  const todo = [
    n(unverified) > 0 && {
      label: `${formatNumber(n(unverified))} boutique(s) en attente de vérification`,
      href: "/dashboard/admin/stores",
      action: "Vérifier",
    },
    n(agents) === 0 && {
      label: "Aucun agent enregistré : la vérification publique ne trouvera personne",
      href: "/dashboard/admin/agents",
      action: "Enregistrer",
    },
  ].filter(Boolean) as { label: string; href: string; action: string }[];

  const readErrors = [users, stores, agents]
    .map((result) => result.error?.message)
    .filter(Boolean);

  return (
    <>
      <PageHeader
        title={`Bonjour ${firstName}`}
        subtitle={
          isSuperAdmin
            ? "Accès complet : comptes, rôles, boutiques et agents."
            : "Accès administrateur : boutiques, agents et partenaires."
        }
        actions={
          backendUrl ? (
            <Button href={`${backendUrl}/dashboard`} variant="primary">
              Panneau Medusa
            </Button>
          ) : undefined
        }
      />

      <div className="space-y-4">
        {readErrors.length > 0 && (
          <Notice tone="warning" title="Certains compteurs sont indisponibles">
            {readErrors[0]}. Vérifiez que les politiques de lecture autorisent
            ce compte.
          </Notice>
        )}

        <StatRow>
          <Stat label="Comptes" value={formatNumber(n(users))} hint={`${formatNumber(n(sellers))} vendeur(s)`} />
          <Stat label="Boutiques" value={formatNumber(n(stores))} />
          <Stat
            label="À vérifier"
            value={formatNumber(n(unverified))}
            tone={n(unverified) ? "warning" : "success"}
          />
          <Stat
            label="Agents habilités"
            value={formatNumber(n(agents))}
            tone={n(agents) ? "default" : "warning"}
          />
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

        <Panel
          title="Le commerce se pilote ailleurs"
          description="Catalogue, commandes, régions, taxes, promotions et modération."
        >
          {backendUrl ? (
            <>
              <p className="max-w-2xl text-sm leading-relaxed text-[#565959]">
                Ces domaines sont tenus par le backend commerce, qui en est la
                seule source de vérité. Les dupliquer ici reviendrait à
                entretenir deux vérités sur un même stock.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button href={`${backendUrl}/dashboard`}>
                  Administration Medusa
                </Button>
                <Button href={`${backendUrl}/seller`}>
                  Panneau vendeur Mercur
                </Button>
              </div>
            </>
          ) : (
            <p className="max-w-2xl text-sm leading-relaxed text-[#565959]">
              L&apos;adresse du backend commerce n&apos;est pas renseignée
              (NEXT_PUBLIC_MEDUSA_BACKEND_URL) : MACHÉ ne sait pas où trouver
              le panneau d&apos;administration.
            </p>
          )}
        </Panel>

        <Notice tone="info" title="Ce que cette page ne dit pas">
          Aucune évolution dans le temps n&apos;est affichée : MACHÉ ne
          conserve pas d&apos;historique de ces compteurs, et une variation
          calculée sans point de comparaison serait inventée.
        </Notice>
      </div>
    </>
  );
}
