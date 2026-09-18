/*
  PAGE : Espace partenaire

  Sert à :
  - montrer au prestataire les vendeurs auxquels il est rattaché ;
  - dire ce que ce rattachement permet, et ce qu'il ne permet pas.

  Remplace un encart qui affichait « Espace partenaire Maché. » et rien
  d'autre.
*/

import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePartner, RELATION_LABELS } from "@/lib/partner";
import { formatNumber, formatDate, initialsOf } from "@/lib/seller";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, EmptyState, Stat, StatRow, Notice,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

export default async function PartnerHomePage() {
  const { supabase, uid, displayName, firstName, email } = await requirePartner();

  const { data: links, error } = await supabase
    .from("partner_vendors")
    .select("id, vendor_id, relation_type, is_active, created_at")
    .eq("partner_id", uid)
    .order("created_at", { ascending: false })
    .limit(200);

  const list = links ?? [];
  const vendorIds = [...new Set(list.map((link) => String(link.vendor_id)))].filter(Boolean);

  /*
    Nom des vendeurs rattachés. Rien d'autre n'est chargé : un partenaire
    n'a pas à voir le chiffre d'affaires ni les commandes d'un vendeur.
  */
  const vendorsResult = vendorIds.length
    ? await supabase.from("users").select("id, full_name").in("id", vendorIds)
    : { data: [] };

  const nameById = new Map(
    (vendorsResult.data ?? []).map((vendor) => [
      String(vendor.id),
      vendor.full_name?.trim() || String(vendor.id).slice(0, 8),
    ])
  );

  const active = list.filter((link) => link.is_active).length;

  async function signOutAction() {
    "use server";

    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#eef1f3] font-sans text-[13px] text-[#0f1111] antialiased">
      <header
        data-chrome="app"
        className="flex h-12 shrink-0 items-center gap-3 border-b border-[#d5d9d9] bg-white px-3 sm:px-4"
      >
        <Link href="/" className="text-[14px] font-bold tracking-[0.1em]">
          MACHE
        </Link>
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#767676]">
          Espace partenaire
        </span>

        <div className="ml-auto flex items-center gap-2 border-l border-[#d5d9d9] pl-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0a0a0a] text-[10px] font-semibold text-white">
            {initialsOf(displayName, 1)}
          </span>
          <span className="hidden text-[12px] font-medium sm:block">{firstName}</span>
          <form action={signOutAction}>
            <button
              type="submit"
              className="ml-2 text-[11px] text-[#565959] underline-offset-2 hover:text-[#0f1111] hover:underline"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1000px] flex-1 p-3 sm:p-5">
        <PageHeader
          title={`Bonjour ${firstName}`}
          subtitle={email}
          actions={<Button href="/contact">Contacter MACHÉ</Button>}
        />

        <div className="space-y-4">
          {error && (
            <Notice tone="warning" title="Rattachements indisponibles">
              {error.message}. La table partner_vendors vient de votre schéma :
              vérifiez qu&apos;elle existe et que ce compte peut la lire.
            </Notice>
          )}

          <StatRow>
            <Stat label="Vendeurs rattachés" value={formatNumber(list.length)} />
            <Stat label="Rattachements actifs" value={formatNumber(active)} tone={active ? "success" : "default"} />
          </StatRow>

          <Panel title="Vendeurs que vous accompagnez" padded={false}>
            {list.length === 0 ? (
              <EmptyState
                title="Aucun rattachement"
                description="Vous apparaîtrez ici dès qu'un vendeur vous aura autorisé à intervenir sur son activité."
              />
            ) : (
              <Table
                columns={[
                  { key: "v", label: "Vendeur" },
                  { key: "t", label: "Type d'intervention" },
                  { key: "d", label: "Depuis" },
                  { key: "s", label: "État", align: "right" },
                ]}
              >
                {list.map((link) => (
                  <Row key={link.id}>
                    <Cell strong>
                      {nameById.get(String(link.vendor_id)) ||
                        String(link.vendor_id).slice(0, 8)}
                    </Cell>
                    <Cell muted>
                      {RELATION_LABELS[String(link.relation_type)] ||
                        link.relation_type ||
                        "Prestation de service"}
                    </Cell>
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

          <Notice tone="info" title="Ce que ce rattachement permet aujourd'hui">
            Il vous identifie comme prestataire reconnu du vendeur auprès de
            MACHÉ. Il ne vous donne accès ni à son catalogue, ni à ses
            commandes, ni à ses chiffres : aucune règle d&apos;accès ne le
            prévoit, et MACHÉ ne l&apos;ouvrira pas sans que le vendeur
            l&apos;ait explicitement demandé. Les échanges se font donc
            directement avec lui.
          </Notice>
        </div>
      </main>
    </div>
  );
}
