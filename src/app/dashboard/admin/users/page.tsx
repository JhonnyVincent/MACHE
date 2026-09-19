/*
  PAGE : Administration — comptes

  Sert à :
  - retrouver un compte par e-mail ou par nom ;
  - voir sa répartition par rôle ;
  - changer le rôle d'un compte (super administrateur uniquement).

  La recherche est faite en base, pas sur une liste chargée en mémoire :
  la table des comptes est destinée à grandir.
*/

import Link from "next/link";
import { requireAdmin, ROLE_LABELS, ASSIGNABLE_ROLES, SUPER_ADMIN_LIMIT } from "@/lib/admin";
import { formatNumber, formatDate } from "@/lib/seller";
import { SELLER_ROLES } from "@/lib/authz";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, EmptyState, Stat, StatRow,
  Notice, Select, Input, FormFeedback,
} from "@/components/seller/ui";
import { setUserRoleAction } from "./actions";
import { supabaseConfigured } from "@/lib/supabase/env";
import { StaffUnavailable } from "@/components/staff-unavailable";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; role?: string; success?: string; error?: string }>;
}) {
  /*
    La garde du layout ne suffit pas : Next rend la page et la mise en
    page en parallèle, donc `require*` s'exécute et lève même quand le
    layout a déjà décidé de ne pas afficher la page. L'écran était
    correct, mais les journaux se remplissaient de traces d'erreur pour
    une situation connue — et du rouge attendu finit par cacher du rouge
    inattendu.
  */
  if (!supabaseConfigured()) return <StaffUnavailable area="Comptes" />;

  const query = searchParams ? await searchParams : {};
  const search = String(query.q || "").trim();
  const roleFilter = String(query.role || "").trim();

  const { supabase, isSuperAdmin, uid } = await requireAdmin("/dashboard/admin/users");

  let request = supabase
    .from("users")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (search) {
    request = request.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }

  if (roleFilter) {
    request = request.eq("role", roleFilter);
  }

  const { data: users, error } = await request;
  const list = users ?? [];

  const [total, sellers, buyers, staff] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("users").select("id", { count: "exact", head: true }).in("role", [...SELLER_ROLES]),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "buyer"),
    supabase.from("users").select("id", { count: "exact", head: true }).in("role", ["admin", "super_admin"]),
  ]);

  return (
    <>
      <PageHeader
        title="Comptes"
        subtitle={
          isSuperAdmin
            ? "Vous pouvez modifier le rôle d'un compte."
            : "Consultation seule : seul un super administrateur modifie les rôles."
        }
      />

      <div className="space-y-4">
        <FormFeedback
          success={query.success}
          error={query.error}
          successMessages={{ role: "Le rôle du compte a été modifié." }}
        />

        {error && (
          <Notice tone="warning" title="Comptes indisponibles">
            {error.message}. Vérifiez que la politique de lecture de la table
            users autorise ce compte : sans elle, l&apos;administration ne voit
            rien, même en super administrateur.
          </Notice>
        )}

        <StatRow>
          <Stat label="Comptes" value={formatNumber(total.count ?? 0)} />
          <Stat label="Vendeurs" value={formatNumber(sellers.count ?? 0)} />
          <Stat label="Clients" value={formatNumber(buyers.count ?? 0)} />
          <Stat label="Personnel" value={formatNumber(staff.count ?? 0)} hint={`${SUPER_ADMIN_LIMIT} super administrateurs au maximum`} />
        </StatRow>

        <Panel title="Rechercher">
          <form method="GET" className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                name="q"
                defaultValue={search}
                placeholder="Adresse e-mail ou nom"
                aria-label="Rechercher un compte"
              />
            </div>
            <div className="sm:w-56">
              <Select name="role" defaultValue={roleFilter} aria-label="Filtrer par rôle">
                <option value="">Tous les rôles</option>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" variant="primary">Chercher</Button>
            {(search || roleFilter) && (
              <Link
                href="/dashboard/admin/users"
                className="self-center text-sm text-[#565959] hover:underline"
              >
                Réinitialiser
              </Link>
            )}
          </form>
        </Panel>

        <Panel
          title="Résultats"
          description={`${formatNumber(list.length)} compte(s) affiché(s), 200 au maximum.`}
          padded={false}
        >
          {list.length === 0 ? (
            <EmptyState
              title="Aucun compte"
              description={
                search || roleFilter
                  ? "Aucun compte ne correspond à cette recherche."
                  : "La table des comptes est vide, ou sa lecture est refusée."
              }
            />
          ) : (
            <Table
              columns={[
                { key: "u", label: "Compte" },
                { key: "r", label: "Rôle" },
                { key: "d", label: "Inscrit le" },
                { key: "a", label: "", align: "right", width: "250px" },
              ]}
            >
              {list.map((user) => {
                const role = String(user.role || "");
                const isSelf = String(user.id) === uid;
                const locked = role === "super_admin" || isSelf;

                return (
                  <Row key={user.id}>
                    <Cell strong>
                      {user.full_name?.trim() || "Sans nom"}
                      <span className="mt-0.5 block text-2xs font-normal text-[#767676]">
                        {user.email}
                      </span>
                    </Cell>
                    <Cell>
                      <Badge
                        tone={
                          role === "super_admin" || role === "admin"
                            ? "info"
                            : role === "agent"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {ROLE_LABELS[role] || role || "Inconnu"}
                      </Badge>
                    </Cell>
                    <Cell muted>{formatDate(user.created_at)}</Cell>
                    <Cell align="right">
                      {!isSuperAdmin ? (
                        <span className="text-xs text-[#767676]">—</span>
                      ) : locked ? (
                        <span className="text-xs text-[#767676]">
                          {isSelf ? "Votre compte" : "Non modifiable ici"}
                        </span>
                      ) : (
                        <form action={setUserRoleAction} className="flex justify-end gap-1.5">
                          <input type="hidden" name="user_id" value={user.id} />
                          <Select
                            name="role"
                            defaultValue={role}
                            aria-label={`Rôle de ${user.email}`}
                            className="w-44"
                          >
                            {ASSIGNABLE_ROLES.map((value) => (
                              <option key={value} value={value}>
                                {ROLE_LABELS[value]}
                              </option>
                            ))}
                          </Select>
                          <Button type="submit" size="sm">Appliquer</Button>
                        </form>
                      )}
                    </Cell>
                  </Row>
                );
              })}
            </Table>
          )}
        </Panel>

        <Notice tone="info" title="Ce que cet écran ne fait pas">
          Il ne crée ni ne supprime de compte, et n&apos;attribue pas le rôle
          de super administrateur : leur nombre est plafonné à{" "}
          {SUPER_ADMIN_LIMIT} et cette décision se prend en base. Suspendre ou
          bannir un compte relève de Supabase Auth, qui n&apos;est pas piloté
          depuis ici.
        </Notice>
      </div>
    </>
  );
}
