/*
  PAGE : Espace agent — ma carte d'agent

  Sert à :
  - montrer à l'agent ce que voit un client qui vérifie son code ;
  - lui donner le lien exact de cette vérification.

  Aucun champ n'est modifiable ici, et c'est volontaire : un agent qui
  pourrait changer son nom, sa zone ou son statut d'habilitation viderait
  de son sens la vérification publique. Ces champs sont tenus par l'équipe
  MACHÉ.
*/

import Link from "next/link";
import { requireAgent, AGENT_STATUS_LABELS } from "@/lib/agents";
import { formatDate } from "@/lib/seller";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, Notice,
} from "@/components/seller/ui";
import { supabaseConfigured } from "@/lib/supabase/env";
import { StaffUnavailable } from "@/components/staff-unavailable";

export const dynamic = "force-dynamic";

export default async function AgentProfilePage() {
  /*
    La garde du layout ne suffit pas : Next rend la page et la mise en
    page en parallèle, donc `require*` s'exécute et lève même quand le
    layout a déjà décidé de ne pas afficher la page. L'écran était
    correct, mais les journaux se remplissaient de traces d'erreur pour
    une situation connue — et du rouge attendu finit par cacher du rouge
    inattendu.
  */
  if (!supabaseConfigured()) return <StaffUnavailable area="Profil agent" />;

  const { agent, displayName, email } = await requireAgent("/dashboard/agent/profile");

  const expired = Boolean(
    agent?.valid_until && new Date(agent.valid_until).getTime() < Date.now()
  );

  const trustworthy = agent?.status === "active" && !expired;

  return (
    <>
      <PageHeader
        title="Ma carte d'agent"
        subtitle="Ce que voit un client qui vérifie votre code."
        actions={
          agent ? (
            <Button href={`/verify-agent?code=${encodeURIComponent(agent.code)}`}>
              Voir la vérification publique
            </Button>
          ) : undefined
        }
      />

      <div className="space-y-4">
        {!agent ? (
          <Notice tone="warning" title="Aucune carte enregistrée">
            Votre compte a le rôle agent, mais aucune carte n&apos;existe à
            votre nom dans l&apos;annuaire MACHÉ. Un client qui saisit un code
            ne vous trouvera pas, et devra donc refuser de vous remettre quoi
            que ce soit. Demandez à l&apos;équipe MACHÉ de créer votre fiche.
          </Notice>
        ) : (
          <>
            {!trustworthy && (
              <Notice tone="danger" title="Votre carte n'est pas valable aujourd'hui">
                {expired
                  ? "Son échéance est passée."
                  : `Son statut est « ${AGENT_STATUS_LABELS[agent.status as "pending"]} ».`}{" "}
                Un client qui la vérifie verra qu&apos;il ne doit rien vous
                remettre. Contactez l&apos;équipe MACHÉ.
              </Notice>
            )}

            <Panel title="Votre fiche publique" padded={false}>
              <Table
                columns={[
                  { key: "k", label: "Élément" },
                  { key: "v", label: "Valeur" },
                ]}
              >
                <Row>
                  <Cell strong>Code</Cell>
                  <Cell>
                    <span className="font-semibold tracking-label">{agent.code}</span>
                  </Cell>
                </Row>
                <Row>
                  <Cell strong>Nom affiché</Cell>
                  <Cell muted>{agent.display_name}</Cell>
                </Row>
                <Row>
                  <Cell strong>Zone</Cell>
                  <Cell muted>{agent.zone || "Non précisée"}</Cell>
                </Row>
                <Row>
                  <Cell strong>Habilitation</Cell>
                  <Cell>
                    <Badge tone={trustworthy ? "success" : "danger"}>
                      {AGENT_STATUS_LABELS[agent.status as "active"]}
                    </Badge>
                  </Cell>
                </Row>
                <Row>
                  <Cell strong>Valable jusqu&apos;au</Cell>
                  <Cell muted>
                    {agent.valid_until ? formatDate(agent.valid_until) : "Sans échéance"}
                  </Cell>
                </Row>
                <Row>
                  <Cell strong>Badge officiel</Cell>
                  <Cell muted>{agent.official_badge ? "Oui" : "Non"}</Cell>
                </Row>
                <Row>
                  <Cell strong>Téléphone public</Cell>
                  <Cell muted>{agent.phone_public || "Non publié"}</Cell>
                </Row>
              </Table>
            </Panel>
          </>
        )}

        <Panel title="Votre compte">
          <p className="text-sm leading-relaxed text-[#565959]">
            Connecté en tant que <span className="font-medium text-[#0f1111]">{displayName}</span>
            {email ? ` (${email})` : ""}. Ces informations ne sont pas publiques :
            seule la fiche ci-dessus est visible des clients.
          </p>
        </Panel>

        <Panel title="Pourquoi vous ne pouvez rien modifier ici">
          <p className="max-w-2xl text-sm leading-relaxed text-[#565959]">
            La page{" "}
            <Link href="/verify-agent" className="font-medium text-[#d2162c] hover:underline">
              de vérification
            </Link>{" "}
            sert à ce qu&apos;un client s&apos;assure, sur le pas de sa porte,
            que vous êtes bien mandaté par MACHÉ. Si un agent pouvait y changer
            son nom, sa zone ou son statut, la vérification ne prouverait plus
            rien. Toute correction passe par l&apos;équipe MACHÉ.
          </p>
        </Panel>
      </div>
    </>
  );
}
