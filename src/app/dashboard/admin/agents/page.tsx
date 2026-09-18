/*
  PAGE : Administration — agents MACHÉ

  Sert à :
  - enregistrer les agents et leur code de carte ;
  - accorder, suspendre ou retirer une habilitation ;
  - accorder le badge officiel.

  C'est l'écran qui alimente /verify-agent. Tant qu'aucun agent n'y est
  enregistré, la page publique répond « code inconnu » à tout le monde —
  ce qui est le bon comportement, mais rend la vérification inutile.
*/

import { requireAdmin } from "@/lib/admin";
import { AGENT_STATUS_LABELS } from "@/lib/agents";
import { formatNumber, formatDate } from "@/lib/seller";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, EmptyState, Stat, StatRow,
  Notice, Field, Input, FormFeedback,
} from "@/components/seller/ui";
import { createAgentAction, setAgentStatusAction, setAgentBadgeAction } from "./actions";

export const dynamic = "force-dynamic";

const SUCCESS_MESSAGES: Record<string, string> = {
  created: "Agent enregistré. Sa carte est en cours d'habilitation : activez-la pour qu'un client puisse la vérifier.",
  status: "L'habilitation a été mise à jour.",
  badge: "Le badge officiel a été mis à jour.",
};

export default async function AdminAgentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const query = searchParams ? await searchParams : {};
  const { supabase } = await requireAdmin("/dashboard/admin/agents");

  const { data: agents, error } = await supabase
    .from("agent_profiles")
    .select("id, code, display_name, zone, phone_public, status, valid_until, official_badge, user_id, created_at")
    .order("created_at", { ascending: false })
    .limit(300);

  const list = agents ?? [];
  const activeCount = list.filter((agent) => agent.status === "active").length;
  const pendingCount = list.filter((agent) => agent.status === "pending").length;
  const unlinked = list.filter((agent) => !agent.user_id).length;

  const now = Date.now();
  const expired = list.filter(
    (agent) => agent.valid_until && new Date(agent.valid_until).getTime() < now
  ).length;

  return (
    <>
      <PageHeader
        title="Agents"
        subtitle="Cartes d'agent et habilitations. C'est ce que vérifie un client sur le pas de sa porte."
        actions={<Button href="/verify-agent">Voir la page publique</Button>}
      />

      <div className="space-y-4">
        <FormFeedback
          success={query.success}
          error={query.error}
          successMessages={SUCCESS_MESSAGES}
        />

        {error && (
          <Notice tone="warning" title="Annuaire indisponible">
            {error.message}. La migration 0006 doit être appliquée.
          </Notice>
        )}

        <StatRow>
          <Stat label="Cartes enregistrées" value={formatNumber(list.length)} />
          <Stat label="Habilitées" value={formatNumber(activeCount)} tone={activeCount ? "success" : "warning"} />
          <Stat label="En attente" value={formatNumber(pendingCount)} tone={pendingCount ? "warning" : "default"} />
          <Stat label="Échéance passée" value={formatNumber(expired)} tone={expired ? "danger" : "default"} />
          <Stat label="Sans compte lié" value={formatNumber(unlinked)} hint="ne peuvent pas ouvrir leur espace" />
        </StatRow>

        {list.length === 0 && !error && (
          <Notice tone="warning" title="Aucun agent enregistré">
            La page publique de vérification répond « code inconnu » à toutes
            les saisies. C&apos;est le bon comportement, mais un client ne peut
            valider personne tant que vous n&apos;avez enregistré aucune carte.
          </Notice>
        )}

        <Panel title="Cartes d'agent" padded={false}>
          {list.length === 0 ? (
            <EmptyState
              title="Annuaire vide"
              description="Enregistrez une première carte avec le formulaire ci-dessous."
            />
          ) : (
            <Table
              columns={[
                { key: "c", label: "Code" },
                { key: "n", label: "Agent" },
                { key: "z", label: "Zone" },
                { key: "v", label: "Échéance" },
                { key: "s", label: "Habilitation" },
                { key: "a", label: "Actions", align: "right", width: "240px" },
              ]}
            >
              {list.map((agent) => {
                const isExpired = Boolean(
                  agent.valid_until && new Date(agent.valid_until).getTime() < now
                );

                return (
                  <Row key={agent.id}>
                    <Cell strong>
                      <span className="tracking-label">{agent.code}</span>
                      {agent.official_badge && (
                        <span className="ml-2">
                          <Badge tone="info">Badge</Badge>
                        </span>
                      )}
                    </Cell>
                    <Cell>
                      {agent.display_name}
                      <span className="mt-0.5 block text-2xs font-normal text-[#767676]">
                        {agent.user_id ? "Compte lié" : "Aucun compte lié"}
                        {agent.phone_public ? ` · ${agent.phone_public}` : ""}
                      </span>
                    </Cell>
                    <Cell muted>{agent.zone || "—"}</Cell>
                    <Cell muted>
                      {agent.valid_until ? (
                        <span className={isExpired ? "font-semibold text-[#b01124]" : ""}>
                          {formatDate(agent.valid_until)}
                        </span>
                      ) : (
                        "Sans échéance"
                      )}
                    </Cell>
                    <Cell>
                      <Badge
                        tone={
                          agent.status === "active" && !isExpired
                            ? "success"
                            : agent.status === "revoked"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {AGENT_STATUS_LABELS[agent.status as "active"] || agent.status}
                      </Badge>
                    </Cell>
                    <Cell align="right">
                      <span className="flex flex-wrap justify-end gap-1.5">
                        {agent.status !== "active" && (
                          <form action={setAgentStatusAction}>
                            <input type="hidden" name="agent_id" value={agent.id} />
                            <input type="hidden" name="status" value="active" />
                            <Button type="submit" size="sm" variant="primary">
                              Habiliter
                            </Button>
                          </form>
                        )}

                        {agent.status === "active" && (
                          <>
                            <form action={setAgentStatusAction}>
                              <input type="hidden" name="agent_id" value={agent.id} />
                              <input type="hidden" name="status" value="suspended" />
                              <Button type="submit" size="sm">Suspendre</Button>
                            </form>

                            <form action={setAgentBadgeAction}>
                              <input type="hidden" name="agent_id" value={agent.id} />
                              <input
                                type="hidden"
                                name="badge"
                                value={String(!agent.official_badge)}
                              />
                              <Button type="submit" size="sm">
                                {agent.official_badge ? "Retirer le badge" : "Badge officiel"}
                              </Button>
                            </form>
                          </>
                        )}

                        {agent.status !== "revoked" && (
                          <form action={setAgentStatusAction}>
                            <input type="hidden" name="agent_id" value={agent.id} />
                            <input type="hidden" name="status" value="revoked" />
                            <Button type="submit" size="sm">Retirer</Button>
                          </form>
                        )}
                      </span>
                    </Cell>
                  </Row>
                );
              })}
            </Table>
          )}
        </Panel>

        <Panel
          title="Enregistrer un agent"
          description="La carte est créée en attente : l'habiliter est une décision distincte."
        >
          <form action={createAgentAction} className="max-w-2xl space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Code de la carte"
                htmlFor="code"
                required
                hint="Celui imprimé sur la carte. Lettres, chiffres et tirets."
              >
                <Input
                  id="code"
                  name="code"
                  required
                  placeholder="MCH-AG-1024"
                  className="uppercase tracking-label"
                />
              </Field>

              <Field label="Nom affiché" htmlFor="display_name" required>
                <Input id="display_name" name="display_name" required placeholder="Prénom Nom" />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Zone" htmlFor="zone" hint="Ex : Port-au-Prince / Delmas">
                <Input id="zone" name="zone" />
              </Field>

              <Field
                label="Téléphone public"
                htmlFor="phone_public"
                hint="Facultatif. Visible des clients qui vérifient le code."
              >
                <Input id="phone_public" name="phone_public" inputMode="tel" />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Valable jusqu'au"
                htmlFor="valid_until"
                hint="Passée cette date, la vérification répond que la carte est expirée."
              >
                <Input id="valid_until" name="valid_until" type="date" />
              </Field>

              <Field
                label="Photo"
                htmlFor="photo_url"
                hint="Adresse d'une photo d'identité. Facultative mais fortement conseillée."
              >
                <Input id="photo_url" name="photo_url" type="url" placeholder="https://…" />
              </Field>
            </div>

            <Field
              label="Compte MACHÉ de l'agent"
              htmlFor="user_email"
              hint="Adresse e-mail d'un compte ayant déjà le rôle agent. Sans lien, l'agent ne peut pas ouvrir son espace ni voir ses courses."
            >
              <Input id="user_email" name="user_email" type="email" placeholder="agent@example.com" />
            </Field>

            <Button type="submit" variant="primary">
              Enregistrer l&apos;agent
            </Button>
          </form>
        </Panel>

        <Notice tone="info" title="Pourquoi l'habilitation est une étape à part">
          Activer une carte fait répondre « agent habilité » à la page
          publique : un client lui remettra alors un colis ou de
          l&apos;argent. Une carte créée reste donc en attente jusqu&apos;à ce
          qu&apos;une personne décide de l&apos;activer.
        </Notice>
      </div>
    </>
  );
}
