export default function CheckoutSuccessPage() {
  return (
    <main className="container-page py-12">
      <div className="card mx-auto max-w-2xl p-6">
        <h1 className="text-3xl font-bold">Paiement réussi</h1>
        <p className="mt-4 text-neutral-500">
          La commande a été confirmée. Les données de paiement sont prêtes
          à être reliées à Stripe plus tard.
        </p>
      </div>
    </main>
  );
}
