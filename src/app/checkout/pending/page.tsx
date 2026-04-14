"use client";

import { featuredProducts } from "@/lib/mock-data";
import { useMemo, useState } from "react";
import Link from "next/link";

const paymentMethods = [
  {
    id: "stripe",
    title: "Carte / Stripe",
    desc: "Paiement international sécurisé"
  },
  {
    id: "paypal",
    title: "PayPal",
    desc: "Pour diaspora et international"
  },
  {
    id: "cod",
    title: "Cash on delivery",
    desc: "Paiement à la livraison"
  }
];

export default function CheckoutPendingPage() {
  const cartItems = featuredProducts.slice(0, 2);

  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "Haïti"
  });

  const subtotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.price, 0),
    [cartItems]
  );

  const shipping = form.country === "Haïti" ? 8 : 18;
  const total = subtotal + shipping;

  return (
    <main className="container-page py-8">
      <div className="mb-2 text-[11px] text-[var(--mache-muted)]">
        Accueil / Panier / Paiement
      </div>

      <h1 className="mb-6 text-[clamp(22px,3vw,34px)] font-[900] tracking-[-0.04em]">
        Finaliser la commande
      </h1>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div>
          <div className="card p-6">
            <h2 className="mb-5 text-[15px] font-[800]">Informations de livraison</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-[10px] font-[700] uppercase tracking-[0.08em] text-[var(--mache-muted)]">
                  Prénom
                </label>
                <input
                  className="input"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="Jean"
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-[700] uppercase tracking-[0.08em] text-[var(--mache-muted)]">
                  Nom
                </label>
                <input
                  className="input"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="Pierre"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-[10px] font-[700] uppercase tracking-[0.08em] text-[var(--mache-muted)]">
                Email
              </label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jean@email.com"
              />
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-[10px] font-[700] uppercase tracking-[0.08em] text-[var(--mache-muted)]">
                Téléphone / WhatsApp
              </label>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+509 xxxx xxxx"
              />
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-[10px] font-[700] uppercase tracking-[0.08em] text-[var(--mache-muted)]">
                Adresse
              </label>
              <input
                className="input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Rue, quartier..."
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-[10px] font-[700] uppercase tracking-[0.08em] text-[var(--mache-muted)]">
                  Ville
                </label>
                <input
                  className="input"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Port-au-Prince"
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-[700] uppercase tracking-[0.08em] text-[var(--mache-muted)]">
                  Pays
                </label>
                <select
                  className="input"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                >
                  <option>Haïti</option>
                  <option>République Dominicaine</option>
                  <option>États-Unis</option>
                  <option>Canada</option>
                  <option>France</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card mt-5 p-6">
            <h2 className="mb-5 text-[15px] font-[800]">Mode de paiement</h2>

            <div className="grid gap-3 md:grid-cols-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`rounded-[14px] border p-4 text-left transition ${
                    paymentMethod === method.id
                      ? "border-[var(--mache-primary)] bg-[var(--mache-primary-soft)]"
                      : "border-[var(--mache-line)] bg-[var(--mache-white)]"
                  }`}
                >
                  <div className="text-[13px] font-[800]">{method.title}</div>
                  <div className="mt-1 text-[11px] text-[var(--mache-muted)]">
                    {method.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <Link href="/checkout/success" className="btn-primary w-full justify-center py-4 text-sm">
              Confirmer la commande
            </Link>
          </div>
        </div>

        <div>
          <div className="card sticky top-[110px] p-6">
            <h2 className="mb-5 text-[15px] font-[800]">Récapitulatif</h2>

            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 border-b border-[var(--mache-bg-2)] pb-4"
                >
                  <div className="h-14 w-14 overflow-hidden rounded-[10px] bg-[var(--mache-bg)]">
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="text-[12px] font-[700]">{item.title}</div>
                    <div className="mt-1 text-[11px] text-[var(--mache-muted)]">
                      {item.currency} {item.price}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3 text-[13px]">
              <div className="flex justify-between">
                <span className="text-[var(--mache-muted)]">Sous-total</span>
                <span>USD {subtotal}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-[var(--mache-muted)]">Livraison</span>
                <span>USD {shipping}</span>
              </div>

              <div className="flex justify-between border-t border-[var(--mache-line)] pt-3 text-[18px] font-[800]">
                <span>Total</span>
                <span>USD {total}</span>
              </div>
            </div>

            <div className="mt-5 rounded-[10px] bg-[var(--mache-bg)] px-4 py-3 text-[12px] text-[var(--mache-muted)]">
              Paiement simulé pour l’instant. Architecture prête pour Stripe, PayPal et cash on delivery.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
