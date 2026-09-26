/*
  PAGE : les comptes.

  Elle listait les comptes de l'ancien socle et leurs rôles. Les comptes
  vivent maintenant dans Medusa, et y sont déjà administrés : clients,
  vendeurs et membres du personnel, chacun avec ses écrans, dans le
  panneau du backend.

  Cette page ne les redit pas. Elle dit où ils sont — ce qui est plus
  utile qu'une seconde liste, forcément en retard sur la première.

  CE QU'ELLE FAIT EN PLUS : BLOQUER UN COMPTE CLIENT

  Parce que le panneau de Mercur ne le propose pas. Il propose de
  SUPPRIMER un client — ce qui emporterait ses commandes, et avec elles
  les commissions que MACHÉ doit encore facturer.

  Le blocage empêche ce compte d'agir : commander en étant connecté,
  déposer un avis, écrire à MACHÉ, se servir de l'espace agent. Le
  backend refuse toute écriture faite avec sa session.

  Il n'empêche PAS la personne de revenir : on peut acheter sans
  compte, et rien n'interdit d'en créer un autre. La page l'écrit là où
  l'on bloque. Promettre une barrière qui n'existe pas est pire que ne
  rien promettre — on cesse alors de surveiller.

  La liste des clients n'est pas déroulée : on arrive ici avec un
  compte précis en tête, généralement signalé par quelqu'un. Afficher
  tout le monde inviterait à bloquer au hasard.
*/

import { Link } from "next-view-transitions";
import { redirect } from "next/navigation";
import { getAdminUser, searchCustomers } from "@/lib/medusa/admin";
import { medusaBackendUrl } from "@/lib/medusa/config";
import { formatDate } from "@/lib/seller";
import { Panel, Badge, Notice, Field, Input, EmptyState } from "@/components/seller/ui";
import { SubmitButton } from "@/components/submit-button";
import { setCustomerBlockedAction } from "./actions";

export const dynamic = "force-dynamic";

const WHERE = [
  {
    title: "Clients",
    text: "Comptes d'achat, adresses, commandes. Dans le panneau, section Clients.",
  },
  {
    title: "Vendeurs et leurs équipes",
    text: "Chaque boutique a ses membres et ses droits. Dans le panneau, section Boutiques.",
  },
  {
    title: "Personnel MACHÉ",
    text: "Les comptes qui ouvrent cette page. Ils se créent côté serveur, avec la commande `medusa user`.",
  },
];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; fait?: string; erreur?: string }>;
}) {
  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  const query = searchParams ? await searchParams : {};

  const term = (query.q ?? "").trim();

  const found = term ? await searchCustomers(term) : null;

  const backendUrl = medusaBackendUrl();
  const panelUrl = backendUrl ? `${backendUrl}/dashboard` : "";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0f1111]">
          Comptes
        </h1>
        <p className="mt-1 text-base text-[#565959]">
          Trois publics, trois endroits — tous dans le backend commerce.
        </p>
      </div>

      <div className="rounded-[8px] border border-[#d5d9d9] bg-white p-5">
        <div className="space-y-4">
          {WHERE.map((entry) => (
            <div key={entry.title}>
              <p className="text-base font-semibold text-[#0f1111]">
                {entry.title}
              </p>
              <p className="mt-0.5 text-base leading-relaxed text-[#565959]">
                {entry.text}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-5 text-base leading-relaxed text-[#565959]">
          Cette page ne duplique pas ces listes : une seconde liste est une
          liste en retard sur la première, et c'est toujours la mauvaise
          qu'on finit par croire.
        </p>

        {panelUrl ? (
          <a
            href={panelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block rounded-[6px] bg-[#0f1111] px-5 py-2.5 text-base font-bold text-white transition-colors hover:bg-black"
          >
            Ouvrir le panneau
          </a>
        ) : (
          <p className="mt-4 text-sm text-[#565959]">
            L&apos;adresse du backend commerce n&apos;est pas renseignée sur ce
            déploiement.
          </p>
        )}
      </div>

      {query.erreur && (
        <Notice tone="danger" title="Rien n'a été changé">{query.erreur}</Notice>
      )}

      {query.fait && <Notice tone="info" title="Enregistré">{query.fait}</Notice>}

      <Panel
        title="Bloquer un compte client"
        description="Le panneau de Mercur ne propose que de supprimer — ce qui emporterait les commandes, et les commissions qui restent à facturer."
      >
        <Notice tone="warning" title="Ce qu'un blocage ne fait pas">
          Il empêche ce COMPTE d&apos;agir : commander en étant connecté,
          déposer un avis, écrire à MACHÉ, se servir de l&apos;espace agent.
          Il n&apos;empêche pas la PERSONNE de revenir — on peut acheter sans
          compte, et rien n&apos;interdit d&apos;en créer un autre. Un compte
          bloqué peut encore lire son historique, ce qui compte pour régler un
          litige en cours.
        </Notice>

        <form method="get" className="mt-4">
          <Field
            label="Chercher un compte"
            htmlFor="q"
            hint="Par adresse e-mail ou par nom. La liste n'est pas déroulée : on bloque un compte précis, pas au hasard."
          >
            <Input id="q" name="q" defaultValue={term} placeholder="adresse@exemple.com" />
          </Field>
          <div className="mt-2">
            <SubmitButton pendingLabel="Recherche…">Chercher</SubmitButton>
          </div>
        </form>

        {found && !found.ok && (
          <div className="mt-4">
            <Notice tone="danger" title="La recherche n'a pas abouti">
              {found.reason}
            </Notice>
          </div>
        )}

        {found?.ok && found.data.length === 0 && (
          <div className="mt-4">
            <EmptyState
              title="Aucun compte ne correspond"
              description="Vérifiez l'adresse. Un acheteur sans compte n'apparaît pas ici : il n'en a pas."
            />
          </div>
        )}

        {found?.ok &&
          found.data.map((customer) => (
            <div
              key={customer.id}
              className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-[#d5d9d9] p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#0f1111]">
                  {customer.name}
                </p>
                <p className="mt-0.5 text-xs text-[#565959]">
                  {customer.email}
                  {customer.createdAt ? ` · inscrit le ${formatDate(customer.createdAt)}` : ""}
                </p>
                <div className="mt-1.5">
                  {customer.blocked ? (
                    <Badge tone="danger">Bloqué</Badge>
                  ) : (
                    <Badge tone="success">Actif</Badge>
                  )}
                </div>
              </div>

              <form action={setCustomerBlockedAction}>
                <input type="hidden" name="customer_id" value={customer.id} />
                <input
                  type="hidden"
                  name="blocked"
                  value={customer.blocked ? "false" : "true"}
                />
                <input type="hidden" name="q" value={term} />
                <SubmitButton pendingLabel="…">
                  {customer.blocked ? "Débloquer" : "Bloquer ce compte"}
                </SubmitButton>
              </form>
            </div>
          ))}
      </Panel>

      <div className="rounded-[8px] border border-[#d5d9d9] bg-white p-4">
        <p className="text-base font-semibold text-[#0f1111]">Agents MACHÉ</p>
        <p className="mt-1 text-base leading-relaxed text-[#565959]">
          Un agent est un CLIENT à qui s&apos;ajoute une fonction : tenir un
          point de retrait, livrer, démarcher. Son habilitation — et sa
          suspension — sont des appartenances à des groupes de clients, que
          seule l&apos;administration modifie.{" "}
          <Link href="/dashboard/admin/agents" className="font-medium text-[#0f1111] underline">
            Voir les agents
          </Link>
        </p>
      </div>
    </div>
  );
}
