/*
  PAGE : « MACHE » — la vue d'ensemble de l'administration, et le point
  d'entrée de tout ce que MACHE ajoute au panneau (menu déroulant).

  Les chiffres sont lus à chaque affichage. Un tiret quand la lecture
  échoue : « aucune boutique » et « je n'ai pas pu compter » sont deux
  choses différentes.
*/
import { Grid, Loading, Notice, Page, Stat, useLoad } from "../../lib/kit";

export const config = { label: "MACHE", rank: 20 };

type Sellers = { sellers?: { status?: string }[]; count?: number };

export default function MacheHome() {
  const sellers = useLoad<Sellers>("/admin/sellers?limit=200");
  const orders = useLoad<{ count?: number }>("/admin/orders?limit=1");

  const list = sellers.data?.sellers ?? [];
  const pending = list.filter((x) => x.status === "pending_approval" || x.status === "pending").length;

  return (
    <Page title="MACHE" subtitle="L'état de la marketplace, et l'accès à tout ce qui est propre à MACHE (menu à gauche).">
      <Loading error={sellers.error} loading={sellers.loading} />
      <Grid cols={3}>
        <Stat label="Boutiques" value={sellers.data ? sellers.data.count ?? list.length : "—"} hint="Inscrites sur la marketplace" />
        <Stat label="En attente d'approbation" value={sellers.data ? pending : "—"} hint="Ouvertes, pas encore validées" />
        <Stat label="Commandes" value={orders.data ? orders.data.count ?? 0 : "—"} hint="Depuis l'ouverture" />
      </Grid>
      {pending > 0 && (
        <Notice tone="warn" title={`${pending} boutique${pending > 1 ? "s" : ""} attend${pending > 1 ? "ent" : ""} votre décision`}>
          Tant qu&apos;une boutique n&apos;est pas approuvée, ses produits n&apos;apparaissent pas dans le catalogue. Son propriétaire, lui, attend.
        </Notice>
      )}
    </Page>
  );
}
