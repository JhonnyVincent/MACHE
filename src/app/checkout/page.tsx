/*
  PAGE : Tunnel d'achat

  Sert à :
  - charger les zones de livraison et les modes de paiement disponibles ;
  - préremplir l'adresse depuis la dernière adresse enregistrée ;
  - afficher l'erreur renvoyée par l'action de validation.

  Le panier reste côté navigateur : il est transmis par le formulaire et
  intégralement revérifié côté serveur.
*/

import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchShippingZones, PAYMENT_METHODS } from "@/lib/orders";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { placeOrderAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Commande — Maché",
  description: "Finalisez votre commande sur Maché.",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; details?: string }>;
}) {
  const { error, message, details } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  const { zones, error: zonesError } = await fetchShippingZones();

  /* Dernière adresse utilisée, pour ne pas la resaisir. */
  let savedAddress = null;

  if (user) {
    const { data } = await supabase
      .from("addresses")
      .select("full_name, phone, line1, line2, city")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    savedAddress = data ?? null;
  }

  return (
    <main className="container-page py-10">
      <nav className="mb-4 text-[13px] text-[var(--mache-muted)]">
        <Link href="/cart" className="hover:underline">Panier</Link>
        <span className="mx-2">/</span>
        <span className="font-[700] text-[var(--mache-text)]">Commande</span>
      </nav>

      <h1 className="section-title">Finaliser ma commande</h1>

      {!user && (
        <div className="mt-4 rounded-[10px] border border-[#c2d4f0] bg-[#eef3fc] px-4 py-3 text-[13px] leading-[1.7]">
          <p className="font-[800]">Vous commandez sans compte</p>
          <p className="mt-1 text-[var(--mache-muted)]">
            La commande sera enregistrée, mais vous ne pourrez pas la suivre
            depuis un espace client.{" "}
            <Link href="/login?next=/checkout" className="font-[800] underline">
              Se connecter
            </Link>{" "}
            pour la retrouver plus tard.
          </p>
        </div>
      )}

      {(error || zonesError) && (
        <div
          role="alert"
          className="mt-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] leading-[1.7] text-red-800"
        >
          <p className="font-[800]">
            {message || "La commande n'a pas pu être enregistrée."}
          </p>
          {details && <p className="mt-1">{details}</p>}
          {zonesError && !error && (
            <p className="mt-1">
              Les zones de livraison sont indisponibles : la migration 0003
              doit être appliquée à la base.
            </p>
          )}
        </div>
      )}

      <div className="mt-6">
        <CheckoutForm
          zones={zones}
          methods={[...PAYMENT_METHODS]}
          action={placeOrderAction}
          defaultEmail={user?.email ?? undefined}
          isSignedIn={Boolean(user)}
          savedAddress={savedAddress}
        />
      </div>
    </main>
  );
}
