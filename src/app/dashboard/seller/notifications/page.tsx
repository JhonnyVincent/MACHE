import { requireSeller, formatDate, formatHTG, LOW_STOCK_THRESHOLD } from "@/lib/seller";
import {
  PageHeader, Panel, Badge, Button, EmptyState, Notice,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

type Alert = {
  tone: "danger" | "warning" | "info";
  title: string;
  detail: string;
  href: string;
  action: string;
};

export default async function SellerNotificationsPage() {
  const { supabase, uid, profile } = await requireSeller("/dashboard/seller/notifications");

  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, is_verified, legal_doc_url")
    .eq("owner_id", uid);

  const storeList = stores ?? [];
  const ids = storeList.map((store) => store.id);

  const [pendingOrders, lowStock] = await Promise.all([
    ids.length
      ? supabase
          .from("orders")
          .select("id, total_price, created_at")
          .in("store_id", ids)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [], error: null }),
    ids.length
      ? supabase
          .from("products")
          .select("id, title, stock, store_id")
          .in("store_id", ids)
          .lte("stock", LOW_STOCK_THRESHOLD)
          .limit(20)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const pending = pendingOrders.data ?? [];
  const low = lowStock.data ?? [];

  const alerts: Alert[] = [];

  for (const order of pending) {
    alerts.push({
      tone: "warning",
      title: `Commande #${String(order.id).slice(0, 8)} à traiter`,
      detail: `${formatHTG(order.total_price)} · reçue le ${formatDate(order.created_at)}`,
      href: "/dashboard/seller/orders",
      action: "Traiter",
    });
  }

  for (const product of low) {
    const store = storeList.find((s) => s.id === product.store_id);

    alerts.push({
      tone: (product.stock ?? 0) <= 0 ? "danger" : "warning",
      title:
        (product.stock ?? 0) <= 0
          ? `Rupture de stock : ${product.title || "produit sans titre"}`
          : `Stock bas : ${product.title || "produit sans titre"}`,
      detail: `${product.stock ?? 0} unité(s) restante(s)${store ? ` · ${store.name}` : ""}`,
      href: "/dashboard/seller/stock",
      action: "Réapprovisionner",
    });
  }

  for (const store of storeList.filter((s) => !s.legal_doc_url)) {
    alerts.push({
      tone: "danger",
      title: `Document légal manquant : ${store.name || "boutique"}`,
      detail: "La boutique ne peut pas être vérifiée sans ce document.",
      href: "/dashboard/seller/documents",
      action: "Déposer",
    });
  }

  if (!profile.address_verified) {
    alerts.push({
      tone: "warning",
      title: "Adresse personnelle non vérifiée",
      detail: "Un justificatif de domicile est demandé pour finaliser votre compte.",
      href: "/dashboard/seller/documents",
      action: "Fournir",
    });
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Ce qui demande une action de votre part, calculé à partir de l'état réel de vos boutiques."
      />

      <div className="space-y-4">
        <Notice tone="info" title="Notifications calculées">
          Cette page ne stocke rien : elle est recalculée à chaque affichage depuis vos
          commandes, votre stock et vos documents. Rien à marquer comme lu, rien à archiver.
        </Notice>

        <Panel title={`${alerts.length} élément${alerts.length > 1 ? "s" : ""} à traiter`} padded={false}>
          {alerts.length === 0 ? (
            <EmptyState
              title="Rien à signaler"
              description="Aucune commande en attente, aucun stock critique, aucun document manquant."
            />
          ) : (
            <ul>
              {alerts.map((alert, index) => (
                <li
                  key={`${alert.title}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e3e6e6] px-4 py-3 last:border-0"
                >
                  <div className="flex min-w-0 items-start gap-2.5">
                    <Badge tone={alert.tone}>
                      {alert.tone === "danger" ? "Urgent" : alert.tone === "warning" ? "À faire" : "Info"}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-medium">{alert.title}</p>
                      <p className="mt-0.5 text-[11.5px] text-[#565959]">{alert.detail}</p>
                    </div>
                  </div>
                  <Button href={alert.href} size="sm">{alert.action}</Button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
