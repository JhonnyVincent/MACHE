/*
  COMPOSANT : file de modération des produits

  Sert à :
  - lister les produits en attente de décision ;
  - afficher ce qui motive un examen (boutique non vérifiée, champs manquants) ;
  - approuver, refuser, mettre en pause ou archiver.

  Remplace un encart qui annonçait « Ici on pourra approuver, mettre en
  avant, sponsoriser, masquer ou supprimer des produits ».
*/

import Link from "next/link";
import {
  STATUS_LABELS, STATUS_TONES, MODERATION_STATUSES, type ModerationProduct,
} from "@/lib/moderation";
import { moderateProductAction } from "@/app/dashboard/admin/products/moderation-actions";

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatHTG(value: number) {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)} HTG`;
}

const TONE_CLASSES: Record<string, string> = {
  success: "border-[#b7dfc9] bg-[#eefaf3] text-[#046c4e]",
  warning: "border-[#f3d9a5] bg-[#fdf6e8] text-[#946200]",
  danger: "border-[#f2c2c8] bg-[#fdeaec] text-[#b01124]",
  info: "border-[#c2d4f0] bg-[#eef3fc] text-[#1d3357]",
  neutral: "border-slate-200 bg-slate-50 text-slate-600",
};

export function ModerationQueue({
  products,
  counts,
  activeStatus,
  message,
  error,
}: {
  products: ModerationProduct[];
  counts: Record<string, number>;
  activeStatus: string;
  message?: string;
  error?: string;
}) {
  return (
    <div className="space-y-4">
      {message && (
        <div className="rounded-xl border border-[#b7dfc9] bg-[#eefaf3] px-4 py-3 text-sm text-[#046c4e]">
          Produit passé au statut « {STATUS_LABELS[message] || message} ». La
          visibilité au catalogue public est mise à jour.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {MODERATION_STATUSES.map((status) => {
          const count = counts[status] ?? 0;
          if (count === 0 && status !== activeStatus) return null;

          return (
            <Link
              key={status}
              href={`/dashboard/admin/products?status=${status}`}
              className={`rounded-lg px-3 py-2 text-[13px] font-bold transition ${
                activeStatus === status
                  ? "bg-[#071f3d] text-white"
                  : "bg-white text-[#071f3d] hover:bg-[#fff1f1] hover:text-[#d20a1e]"
              }`}
            >
              {STATUS_LABELS[status]}
              <span className="ml-1.5 opacity-60">{count}</span>
            </Link>
          );
        })}
      </div>

      {products.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-[16px] font-[900]">Aucun produit dans cet état</p>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-[1.7] text-slate-500">
            Les produits soumis par les vendeurs apparaissent ici pour examen.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {products.map((product) => {
            /* Ce qui justifie un examen humain, dit explicitement. */
            const flags: string[] = [];
            if (!product.storeVerified) flags.push("boutique non vérifiée");
            if (!product.category) flags.push("catégorie manquante");
            if (!product.imageUrl) flags.push("sans photo");
            if (product.price <= 0) flags.push("prix nul");

            return (
              <li key={product.id} className="card p-5">
                <div className="flex flex-wrap gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.imageUrl || "/placeholder-product.png"}
                    alt=""
                    className="h-20 w-20 shrink-0 rounded-xl border border-slate-200 object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-[15px] font-[900] text-[#071f3d]">{product.title}</h4>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${
                          TONE_CLASSES[STATUS_TONES[product.status] || "neutral"]
                        }`}
                      >
                        {STATUS_LABELS[product.status] || product.status}
                      </span>
                    </div>

                    <p className="mt-1 text-[12.5px] text-slate-500">
                      {product.storeName} · {product.sellerName} ·{" "}
                      {product.category || "sans catégorie"} · {formatHTG(product.price)} ·{" "}
                      stock {product.stock}
                    </p>

                    <p className="mt-0.5 text-[11.5px] text-slate-400">
                      Créé le {formatDate(product.createdAt)}
                      {product.submittedAt ? ` · soumis le ${formatDate(product.submittedAt)}` : ""}
                    </p>

                    {flags.length > 0 && (
                      <p className="mt-2 text-[12px] font-bold text-[#946200]">
                        À vérifier : {flags.join(", ")}
                      </p>
                    )}

                    {product.rejectionReason && (
                      <p className="mt-2 rounded-lg bg-[#fdeaec] px-3 py-2 text-[12px] text-[#b01124]">
                        Motif du refus précédent : {product.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  {product.status !== "active" && (
                    <form action={moderateProductAction}>
                      <input type="hidden" name="product_id" value={product.id} />
                      <input type="hidden" name="decision" value="approve" />
                      <input type="hidden" name="filter" value={activeStatus} />
                      <button className="rounded-lg bg-[#046c4e] px-4 py-2 text-[12.5px] font-bold text-white transition hover:bg-[#03543c]">
                        Approuver et publier
                      </button>
                    </form>
                  )}

                  {product.status === "active" && (
                    <form action={moderateProductAction}>
                      <input type="hidden" name="product_id" value={product.id} />
                      <input type="hidden" name="decision" value="pause" />
                      <input type="hidden" name="filter" value={activeStatus} />
                      <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-[12.5px] font-bold text-[#071f3d] transition hover:bg-slate-50">
                        Mettre en pause
                      </button>
                    </form>
                  )}

                  <form action={moderateProductAction} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="product_id" value={product.id} />
                    <input type="hidden" name="decision" value="reject" />
                    <input type="hidden" name="filter" value={activeStatus} />
                    <input
                      name="reason"
                      required
                      maxLength={500}
                      placeholder="Motif du refus (obligatoire)"
                      className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-[12.5px] outline-none focus:border-[#d20a1e]"
                    />
                    <button className="rounded-lg bg-[#b01124] px-4 py-2 text-[12.5px] font-bold text-white transition hover:bg-[#8d0d1d]">
                      Refuser
                    </button>
                  </form>

                  <Link
                    href={`/product/${product.id}`}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-[12.5px] font-bold text-[#071f3d] transition hover:bg-slate-50"
                  >
                    Voir la fiche
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
