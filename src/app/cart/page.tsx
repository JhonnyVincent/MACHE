import Link from "next/link";
import { featuredProducts } from "@/lib/mock-data";

export default function CartPage() {
  const cartItems = featuredProducts.slice(0, 2);
  const subtotal = cartItems.reduce((acc, item) => acc + item.price, 0);

  return (
    <main className="container-page py-12">
      <h1 className="text-3xl font-bold">Panier</h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {cartItems.map((item) => (
            <div key={item.id} className="card flex flex-col gap-4 p-6 sm:flex-row">
              <img
                src={item.images[0]}
                alt={item.title}
                className="h-28 w-full rounded-2xl object-cover sm:w-32"
              />

              <div className="flex-1">
                <h2 className="text-lg font-semibold">{item.title}</h2>
                <p className="mt-1 text-sm text-neutral-500">{item.vendorName}</p>

                <div className="mt-3 flex flex-wrap gap-3">
                  <input
                    type="number"
                    defaultValue={1}
                    min={1}
                    className="input max-w-28"
                  />
                  <button className="btn-secondary">Retirer</button>
                </div>
              </div>

              <div className="font-bold">
                {item.currency} {item.price}
              </div>
            </div>
          ))}
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold">Résumé commande</h2>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Sous-total</span>
              <span>USD {subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Livraison</span>
              <span>Calculée au checkout</span>
            </div>
            <div className="flex justify-between">
              <span>Taxes</span>
              <span>Selon destination</span>
            </div>
          </div>

          <Link href="/checkout/pending" className="btn-primary mt-6 w-full">
            Continuer vers le checkout
          </Link>
        </div>
      </div>
    </main>
  );
}
