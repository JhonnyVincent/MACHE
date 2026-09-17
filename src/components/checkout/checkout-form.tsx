"use client";

/*
  COMPOSANT : tunnel d'achat

  Sert à :
  - dérouler le parcours PANIER → ADRESSE → LIVRAISON → PAIEMENT → VÉRIFICATION ;
  - récapituler le panier réel à chaque étape ;
  - transmettre le panier et les coordonnées à l'action serveur.

  Pourquoi les étapes sont dans un seul composant plutôt que sur plusieurs
  URL : le panier vit dans le navigateur. Le répartir sur plusieurs pages
  serveur exigerait de le persister à mi-parcours, donc d'enregistrer une
  commande avant que le client ait confirmé. Les étapes sont donc un état
  local, et un seul envoi crée la commande.

  Aucune validation n'est faite ici en dernier ressort : le serveur relit
  prix, stock et disponibilité. Les contrôles de ce fichier ne servent qu'à
  éviter un aller-retour inutile.
*/

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { formatPrice } from "@/lib/format";

export type ShippingZone = {
  slug: string;
  label: string;
  fee: number | null;
  estimated_days_min: number | null;
  estimated_days_max: number | null;
};

export type PaymentMethod = {
  code: string;
  label: string;
  hint: string;
  available: boolean;
};

type Props = {
  zones: ShippingZone[];
  methods: PaymentMethod[];
  action: (formData: FormData) => void;
  defaultEmail?: string;
  isSignedIn: boolean;
  savedAddress?: {
    full_name: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
  } | null;
};

const STEPS = [
  { key: "address", label: "Adresse" },
  { key: "shipping", label: "Livraison" },
  { key: "payment", label: "Paiement" },
  { key: "review", label: "Vérification" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

export function CheckoutForm({
  zones,
  methods,
  action,
  defaultEmail,
  isSignedIn,
  savedAddress,
}: Props) {
  const { items, subtotal, count } = useCart();

  const [step, setStep] = useState<StepKey>("address");
  const [touched, setTouched] = useState(false);

  const [fullName, setFullName] = useState(savedAddress?.full_name ?? "");
  const [phone, setPhone] = useState(savedAddress?.phone ?? "");
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [line1, setLine1] = useState(savedAddress?.line1 ?? "");
  const [line2, setLine2] = useState(savedAddress?.line2 ?? "");
  const [city, setCity] = useState(savedAddress?.city ?? "");
  const [instructions, setInstructions] = useState("");
  const [zoneSlug, setZoneSlug] = useState(zones[0]?.slug ?? "");
  const [method, setMethod] = useState(
    methods.find((m) => m.available)?.code ?? ""
  );

  const zone = zones.find((z) => z.slug === zoneSlug);
  const shippingPending = !zone || zone.fee === null;
  const shippingFee = shippingPending ? 0 : Number(zone!.fee);
  const total = subtotal + shippingFee;

  const cartPayload = useMemo(
    () => JSON.stringify(items.map((item) => ({ id: item.id, quantity: item.quantity }))),
    [items]
  );

  const addressComplete = Boolean(
    fullName.trim() && phone.trim() && line1.trim() && city.trim()
  );

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  function goNext() {
    setTouched(true);

    if (step === "address" && !addressComplete) return;
    if (step === "shipping" && !zoneSlug) return;
    if (step === "payment" && !method) return;

    setTouched(false);
    const next = STEPS[Math.min(stepIndex + 1, STEPS.length - 1)];
    setStep(next.key);
  }

  if (items.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-[18px] font-[900]">Votre panier est vide</p>
        <p className="mx-auto mt-2 max-w-md text-[14px] leading-[1.8] text-[var(--mache-muted)]">
          Ajoutez des articles au panier avant de passer commande.
        </p>
        <Link href="/shop" className="btn-primary mt-6">
          Voir le catalogue
        </Link>
      </div>
    );
  }

  const fieldClass =
    "mt-1.5 w-full rounded-[8px] border border-[var(--mache-line)] px-3.5 py-2.5 text-[13.5px] outline-none transition focus:border-[var(--mache-primary)]";
  const labelClass = "text-[12.5px] font-[800] text-[var(--mache-text)]";

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <div>
        {/* Fil des étapes */}
        <ol className="mb-5 flex flex-wrap gap-1.5">
          {STEPS.map((item, index) => {
            const done = index < stepIndex;
            const current = index === stepIndex;

            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => index <= stepIndex && setStep(item.key)}
                  disabled={index > stepIndex}
                  className={`rounded-[6px] px-3 py-1.5 text-[12.5px] font-[800] transition ${
                    current
                      ? "bg-[var(--mache-primary)] text-white"
                      : done
                        ? "bg-[var(--mache-primary-soft)] text-[var(--mache-primary)]"
                        : "bg-[var(--mache-bg)] text-[var(--mache-light)]"
                  }`}
                >
                  <span className="tnum mr-1.5">{index + 1}</span>
                  {item.label}
                </button>
              </li>
            );
          })}
        </ol>

        <form action={action} className="card p-5">
          <input type="hidden" name="cart" value={cartPayload} />
          <input type="hidden" name="zone" value={zoneSlug} />
          <input type="hidden" name="payment_method" value={method} />

          {/* ------------------------------------------------ ADRESSE */}
          <div className={step === "address" ? "" : "hidden"}>
            <h2 className="text-[17px] font-[900]">Adresse de livraison</h2>

            <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="full_name">Nom complet *</label>
                <input
                  id="full_name" name="full_name" required className={fieldClass}
                  value={fullName} onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="phone">Téléphone *</label>
                <input
                  id="phone" name="phone" required type="tel" className={fieldClass}
                  value={phone} onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel" placeholder="+509 ..."
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="email">E-mail</label>
                <input
                  id="email" name="email" type="email" className={fieldClass}
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="line1">Adresse *</label>
                <input
                  id="line1" name="line1" required className={fieldClass}
                  value={line1} onChange={(e) => setLine1(e.target.value)}
                  autoComplete="address-line1" placeholder="Rue, numéro"
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="line2">Complément</label>
                <input
                  id="line2" name="line2" className={fieldClass}
                  value={line2} onChange={(e) => setLine2(e.target.value)}
                  autoComplete="address-line2" placeholder="Quartier, repère"
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="city">Ville *</label>
                <input
                  id="city" name="city" required className={fieldClass}
                  value={city} onChange={(e) => setCity(e.target.value)}
                  autoComplete="address-level2"
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="instructions">Précisions pour le livreur</label>
                <input
                  id="instructions" name="instructions" className={fieldClass}
                  value={instructions} onChange={(e) => setInstructions(e.target.value)}
                />
              </div>
            </div>

            {isSignedIn && (
              <label className="mt-4 flex items-center gap-2 text-[12.5px]">
                <input type="checkbox" name="save_address" defaultChecked />
                Enregistrer cette adresse pour mes prochaines commandes
              </label>
            )}

            {touched && !addressComplete && (
              <p className="mt-3 text-[12.5px] font-[700] text-[var(--mache-danger)]">
                Renseignez le nom, le téléphone, l&apos;adresse et la ville.
              </p>
            )}
          </div>

          {/* ---------------------------------------------- LIVRAISON */}
          <div className={step === "shipping" ? "" : "hidden"}>
            <h2 className="text-[17px] font-[900]">Zone de livraison</h2>

            {zones.length === 0 ? (
              <p className="mt-3 rounded-[8px] border border-[#f3d9a5] bg-[#fdf6e8] px-3.5 py-3 text-[12.5px] leading-[1.7]">
                Aucune zone de livraison n&apos;est configurée. La migration
                0003 doit être appliquée à la base avant de pouvoir commander.
              </p>
            ) : (
              <div className="mt-3 grid gap-2">
                {zones.map((z) => (
                  <label
                    key={z.slug}
                    className={`flex cursor-pointer items-start gap-3 rounded-[8px] border px-3.5 py-3 transition ${
                      zoneSlug === z.slug
                        ? "border-[var(--mache-primary)] bg-[var(--mache-primary-soft)]"
                        : "border-[var(--mache-line)] hover:border-[var(--mache-primary)]"
                    }`}
                  >
                    <input
                      type="radio" name="zone_choice" className="mt-1"
                      checked={zoneSlug === z.slug}
                      onChange={() => setZoneSlug(z.slug)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-[800]">{z.label}</span>
                      <span className="mt-0.5 block text-[12px] text-[var(--mache-muted)]">
                        {z.fee === null
                          ? "Frais confirmés par la boutique après commande"
                          : formatPrice(Number(z.fee))}
                        {z.estimated_days_min
                          ? ` · ${z.estimated_days_min}${
                              z.estimated_days_max ? `–${z.estimated_days_max}` : ""
                            } jours`
                          : ""}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* ----------------------------------------------- PAIEMENT */}
          <div className={step === "payment" ? "" : "hidden"}>
            <h2 className="text-[17px] font-[900]">Mode de paiement</h2>

            <div className="mt-3 grid gap-2">
              {methods.map((m) => (
                <label
                  key={m.code}
                  className={`flex items-start gap-3 rounded-[8px] border px-3.5 py-3 transition ${
                    !m.available
                      ? "cursor-not-allowed border-[var(--mache-line)] bg-[var(--mache-bg)] opacity-70"
                      : method === m.code
                        ? "cursor-pointer border-[var(--mache-primary)] bg-[var(--mache-primary-soft)]"
                        : "cursor-pointer border-[var(--mache-line)] hover:border-[var(--mache-primary)]"
                  }`}
                >
                  <input
                    type="radio" name="payment_choice" className="mt-1"
                    disabled={!m.available}
                    checked={method === m.code}
                    onChange={() => setMethod(m.code)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-[800]">
                      {m.label}
                      {!m.available && (
                        <span className="ml-2 rounded-[3px] bg-[var(--mache-line)] px-1.5 py-0.5 text-[10.5px] font-[700] text-[var(--mache-muted)]">
                          bientôt
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-[var(--mache-muted)]">
                      {m.hint}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* ------------------------------------------- VÉRIFICATION */}
          <div className={step === "review" ? "" : "hidden"}>
            <h2 className="text-[17px] font-[900]">Vérification</h2>

            <dl className="mt-4 divide-y divide-[var(--mache-line)] text-[13px]">
              <div className="grid gap-1 py-3 sm:grid-cols-[150px_1fr]">
                <dt className="text-[var(--mache-muted)]">Livré à</dt>
                <dd>
                  <strong>{fullName}</strong> · {phone}
                  <br />
                  {line1}
                  {line2 ? `, ${line2}` : ""} — {city}
                </dd>
              </div>
              <div className="grid gap-1 py-3 sm:grid-cols-[150px_1fr]">
                <dt className="text-[var(--mache-muted)]">Zone</dt>
                <dd>{zone?.label ?? "—"}</dd>
              </div>
              <div className="grid gap-1 py-3 sm:grid-cols-[150px_1fr]">
                <dt className="text-[var(--mache-muted)]">Paiement</dt>
                <dd>{methods.find((m) => m.code === method)?.label ?? "—"}</dd>
              </div>
              <div className="grid gap-1 py-3 sm:grid-cols-[150px_1fr]">
                <dt className="text-[var(--mache-muted)]">Articles</dt>
                <dd>
                  {items.map((item) => (
                    <span key={item.id} className="block">
                      {item.quantity} × {item.title} —{" "}
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>

            {shippingPending && (
              <p className="mt-4 rounded-[8px] border border-[#f3d9a5] bg-[#fdf6e8] px-3.5 py-3 text-[12.5px] leading-[1.7]">
                Les frais de livraison de cette zone ne sont pas encore
                tarifés : le total ci-contre ne les comprend pas. La boutique
                vous les confirmera avant l&apos;expédition.
              </p>
            )}

            <button type="submit" className="btn-primary mt-5 w-full justify-center py-3.5">
              Confirmer la commande
            </button>

            <p className="mt-2 text-center text-[11.5px] text-[var(--mache-muted)]">
              Aucun paiement en ligne n&apos;est prélevé à cette étape.
            </p>
          </div>

          {/* Navigation entre étapes */}
          {step !== "review" && (
            <div className="mt-5 flex items-center justify-between gap-3 border-t border-[var(--mache-line)] pt-4">
              {stepIndex > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep(STEPS[stepIndex - 1].key)}
                  className="btn-secondary"
                >
                  Retour
                </button>
              ) : (
                <Link href="/cart" className="btn-secondary">
                  Retour au panier
                </Link>
              )}

              <button type="button" onClick={goNext} className="btn-primary">
                Continuer
              </button>
            </div>
          )}

          {step === "review" && (
            <div className="mt-4 border-t border-[var(--mache-line)] pt-4">
              <button
                type="button"
                onClick={() => setStep("payment")}
                className="btn-secondary"
              >
                Retour
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Récapitulatif */}
      <aside className="card h-fit p-5">
        <h2 className="text-[16px] font-[900]">Récapitulatif</h2>

        <ul className="mt-3 divide-y divide-[var(--mache-line)]">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3 py-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image || "/placeholder-product.png"}
                alt=""
                className="h-12 w-12 shrink-0 rounded-[6px] object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[12.5px] font-[700]">{item.title}</p>
                <p className="mt-0.5 text-[11.5px] text-[var(--mache-muted)]">
                  {item.quantity} × {formatPrice(item.price)}
                </p>
              </div>
              <p className="tnum shrink-0 text-[12.5px] font-[800]">
                {formatPrice(item.price * item.quantity)}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-3 space-y-2 border-t border-[var(--mache-line)] pt-3 text-[13px]">
          <div className="flex justify-between">
            <span className="text-[var(--mache-muted)]">
              Sous-total ({count} article{count > 1 ? "s" : ""})
            </span>
            <span className="tnum font-[800]">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--mache-muted)]">Livraison</span>
            <span className="tnum">
              {shippingPending ? "à confirmer" : formatPrice(shippingFee)}
            </span>
          </div>
        </div>

        <div className="mt-3 flex justify-between border-t border-[var(--mache-line)] pt-3 text-[19px] font-[950]">
          <span>Total</span>
          <span className="tnum">{formatPrice(total)}</span>
        </div>
      </aside>
    </div>
  );
}
