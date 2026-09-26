/*
  PAGE : geler les versements d'une boutique.

  POURQUOI CET ÉCRAN EXISTE SÉPARÉMENT DE « BOUTIQUES »

  Parce que suspendre et geler ne sont pas la même décision. Suspendre
  arrête la VENTE ; geler arrête l'ARGENT. En cas de fraude soupçonnée,
  on veut souvent retenir les sommes AVANT d'être sûr — donc sans
  fermer une boutique qui a peut-être des commandes honnêtes en cours.
  Les fondre en un seul bouton obligerait à choisir entre ne rien faire
  et tout casser.

  LA LIMITE, ÉCRITE LÀ OÙ L'ON DÉCIDE

  MACHÉ n'encaisse pas : l'acheteur règle le vendeur en main propre.
  Geler ne reprend donc RIEN à un vendeur qui a déjà l'argent dans la
  poche. Le dire ici, et pas en note de bas de page, est le point :
  croire qu'on a récupéré l'argent alors qu'on a seulement arrêté un
  compteur ferait renoncer à la seule démarche qui compte — réclamer.

  CE QUE LE GEL FAIT VRAIMENT

  Une livraison confirmée reste confirmée — la remise a eu lieu, c'est
  un fait — mais sa somme n'est plus portée comme due au vendeur. Les
  versements déjà autorisés sont repris. Le jour où MACHÉ versera
  vraiment, c'est la même vanne, déjà fermée.

  LE MOTIF EST OBLIGATOIRE DANS LES DEUX SENS

  Un gel sans motif ne se défend pas s'il est contesté et ne se lève
  pas par quelqu'un d'autre. Un dégel sans motif laisse un argent
  reparti sans que personne sache pourquoi.
*/

import { redirect } from "next/navigation";
import {
  getAdminUser,
  fetchPayoutFreezes,
  fetchSellers,
  type PayoutFreeze,
  type AdminSeller,
} from "@/lib/medusa/admin";
import { formatDate } from "@/lib/seller";
import {
  PageHeader, Panel, Badge, Notice, EmptyState, Field, Select, Textarea, Stat, StatRow,
} from "@/components/seller/ui";
import { SubmitButton } from "@/components/submit-button";
import { setPayoutFreezeAction } from "./actions";

export const dynamic = "force-dynamic";

function Frozen({
  freeze,
  seller,
}: {
  freeze: PayoutFreeze;
  seller: AdminSeller | undefined;
}) {
  return (
    <Panel
      title={seller?.name ?? freeze.sellerId}
      description={seller ? `/store/${seller.handle}` : "Boutique introuvable dans la liste"}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="danger">Versements gelés</Badge>
        {freeze.deliveriesHeld > 0 && (
          <Badge tone="warning">
            {freeze.deliveriesHeld} livraison{freeze.deliveriesHeld > 1 ? "s" : ""} retenue
            {freeze.deliveriesHeld > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      <dl className="mt-3 space-y-1.5 text-sm">
        <div>
          <dt className="text-[#767676]">Motif</dt>
          <dd className="text-[#0f1111]">{freeze.reason}</dd>
        </div>
        {freeze.createdAt && (
          <div>
            <dt className="text-[#767676]">Gelé le</dt>
            <dd className="text-[#0f1111]">{formatDate(freeze.createdAt)}</dd>
          </div>
        )}
      </dl>

      <form
        action={setPayoutFreezeAction}
        className="mt-4 space-y-3 border-t border-[#e7e7e7] pt-4"
      >
        <input type="hidden" name="seller_id" value={freeze.sellerId} />
        <input type="hidden" name="freeze" value="false" />

        <Field
          label="Pourquoi levez-vous le gel"
          htmlFor={`lift-${freeze.id}`}
          required
          hint="Ce que la vérification a donné. Sans cela, personne ne saura pourquoi l'argent est reparti."
        >
          <Textarea id={`lift-${freeze.id}`} name="reason" rows={2} required />
        </Field>

        <SubmitButton pendingLabel="Levée…">Lever le gel</SubmitButton>
      </form>
    </Panel>
  );
}

export default async function AdminPayoutFreezePage({
  searchParams,
}: {
  searchParams?: Promise<{ fait?: string; erreur?: string }>;
}) {
  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  const query = searchParams ? await searchParams : {};

  const [result, sellersResult] = await Promise.all([
    fetchPayoutFreezes(),
    fetchSellers(),
  ]);

  const freezes = result.ok ? result.data.freezes : [];
  const sellers = sellersResult.ok ? sellersResult.data : [];

  const byId = new Map(sellers.map((seller) => [seller.id, seller]));

  const active = freezes.filter((freeze) => freeze.active);
  const lifted = freezes.filter((freeze) => !freeze.active);

  const frozenIds = new Set(active.map((freeze) => freeze.sellerId));

  /* On ne propose que les boutiques qui ne sont pas déjà gelées. */
  const freezable = sellers.filter((seller) => !frozenIds.has(seller.id));

  const totalHeld = active.reduce((sum, freeze) => sum + freeze.deliveriesHeld, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gel des versements"
        subtitle="Arrêter l'argent d'une boutique, sans forcément arrêter sa vente."
      />

      {query.erreur && (
        <Notice tone="danger" title="Rien n'a été changé">{query.erreur}</Notice>
      )}
      {query.fait && <Notice tone="info" title="Enregistré">{query.fait}</Notice>}

      {!result.ok && (
        <Notice tone="danger" title="Liste indisponible">{result.reason}</Notice>
      )}

      <Notice tone="warning" title="Ce qu'un gel ne fait pas">
        MACHÉ n&apos;encaisse pas : l&apos;acheteur règle le vendeur en main
        propre. Geler ne reprend donc <strong>rien</strong> à un vendeur qui a
        déjà l&apos;argent. Ce que le gel fait : une livraison confirmée cesse
        de porter sa somme comme due, et les versements déjà autorisés sont
        repris. Pour l&apos;argent déjà encaissé, il faut le réclamer — le gel
        ne le remplace pas.
      </Notice>

      <StatRow>
        <Stat
          label="Boutiques gelées"
          value={active.length}
          tone={active.length > 0 ? "danger" : "default"}
        />
        <Stat
          label="Livraisons retenues"
          value={totalHeld}
          tone={totalHeld > 0 ? "warning" : "default"}
          hint="Leur somme n'est pas portée comme due au vendeur."
        />
        <Stat
          label="Gels levés"
          value={lifted.length}
          hint="Conservés : un gel a retenu de l'argent, l'effacer rendrait l'écart inexplicable."
        />
      </StatRow>

      <Panel
        title="Geler une boutique"
        description="Suspendre l'arrête de vendre ; geler retient son argent. Les deux se décident séparément."
      >
        {sellersResult.ok && freezable.length === 0 ? (
          <EmptyState
            title={sellers.length === 0 ? "Aucune boutique" : "Toutes les boutiques sont déjà gelées"}
            description="Rien à geler pour le moment."
          />
        ) : (
          <form action={setPayoutFreezeAction} className="space-y-3">
            <input type="hidden" name="freeze" value="true" />

            <Field label="Boutique" htmlFor="seller_id" required>
              <Select id="seller_id" name="seller_id" required defaultValue="">
                <option value="" disabled>
                  Choisissez une boutique
                </option>
                {freezable.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.name} — /store/{seller.handle}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Ce que vous reprochez à cette boutique"
              htmlFor="reason"
              required
              hint="Écrit maintenant, pendant que vous l'avez en tête. Dans six mois, un gel sans motif ne se défend pas et ne se lève pas."
            >
              <Textarea id="reason" name="reason" rows={3} required />
            </Field>

            <SubmitButton pendingLabel="Gel…">Geler les versements</SubmitButton>
          </form>
        )}

        {!sellersResult.ok && (
          <div className="mt-3">
            <Notice tone="danger" title="La liste des boutiques ne s'affiche pas">
              {sellersResult.reason}
            </Notice>
          </div>
        )}
      </Panel>

      {active.map((freeze) => (
        <Frozen key={freeze.id} freeze={freeze} seller={byId.get(freeze.sellerId)} />
      ))}

      {lifted.length > 0 && (
        <Panel
          title="Gels levés"
          description="Conservés : chacun a retenu de l'argent pendant un temps."
        >
          <ul className="space-y-3 text-sm">
            {lifted.map((freeze) => {
              const seller = byId.get(freeze.sellerId);

              return (
                <li key={freeze.id} className="border-b border-[#e7e7e7] pb-3 last:border-0 last:pb-0">
                  <p className="font-semibold text-[#0f1111]">
                    {seller?.name ?? freeze.sellerId}
                  </p>
                  <p className="mt-0.5 text-[#565959]">
                    Gelé{freeze.createdAt ? ` le ${formatDate(freeze.createdAt)}` : ""} — {freeze.reason}
                  </p>
                  <p className="mt-0.5 text-[#565959]">
                    Levé{freeze.liftedAt ? ` le ${formatDate(freeze.liftedAt)}` : ""}
                    {freeze.liftedReason ? ` — ${freeze.liftedReason}` : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </div>
  );
}
