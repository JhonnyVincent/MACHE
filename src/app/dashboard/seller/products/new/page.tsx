"use client";

import { useState } from "react";
import Link from "next/link";

export default function NewSellerProductPage() {
  const [images, setImages] = useState<FileList | null>(null);

  return (
    <main className="container-page py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase text-[var(--mache-primary)]">
            Dashboard vendeur
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Ajouter un produit
          </h1>

          <p className="mt-2 text-neutral-500">
            Publiez un nouveau produit sur votre boutique Maché.
          </p>
        </div>

        <Link href="/dashboard/seller" className="btn-secondary">
          Retour dashboard
        </Link>
      </div>

      <form className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.4fr]">
        <section className="space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-black">
              Informations produit
            </h2>

            <div className="mt-6 grid gap-5">
              <div>
                <label className="text-sm font-bold">
                  Nom du produit *
                </label>

                <input
                  type="text"
                  placeholder="Ex: Chemise premium"
                  className="mt-2 w-full rounded-2xl border p-4 outline-none focus:border-[var(--mache-primary)]"
                />
              </div>

              <div>
                <label className="text-sm font-bold">
                  Description *
                </label>

                <textarea
                  rows={5}
                  placeholder="Décrivez votre produit..."
                  className="mt-2 w-full rounded-2xl border p-4 outline-none focus:border-[var(--mache-primary)]"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-bold">
                    Prix (HTG) *
                  </label>

                  <input
                    type="number"
                    placeholder="2500"
                    className="mt-2 w-full rounded-2xl border p-4 outline-none focus:border-[var(--mache-primary)]"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold">
                    Stock *
                  </label>

                  <input
                    type="number"
                    placeholder="10"
                    className="mt-2 w-full rounded-2xl border p-4 outline-none focus:border-[var(--mache-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold">
                  Catégorie *
                </label>

                <select className="mt-2 w-full rounded-2xl border p-4 outline-none focus:border-[var(--mache-primary)]">
                  <option>Mode</option>
                  <option>Beauté</option>
                  <option>Maison</option>
                  <option>Accessoires</option>
                  <option>Artisanat</option>
                  <option>Technologie</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-black">
              Photos produit *
            </h2>

            <p className="mt-2 text-sm text-neutral-500">
              Une photo minimum est obligatoire pour publier le produit.
            </p>

            <div className="mt-5 rounded-3xl border-2 border-dashed p-8 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                capture="environment"
                onChange={(e) => setImages(e.target.files)}
                className="mx-auto block"
              />

              <p className="mt-4 text-sm text-neutral-500">
                Ajouter depuis :
              </p>

              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <span className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-bold">
                  📷 Appareil photo
                </span>

                <span className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-bold">
                  🖼️ Galerie
                </span>

                <span className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-bold">
                  💻 Ordinateur
                </span>
              </div>

              {images && (
                <p className="mt-5 text-sm font-bold text-green-600">
                  {images.length} image(s) sélectionnée(s)
                </p>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-black">
              Documents & fichiers
            </h2>

            <p className="mt-2 text-sm text-neutral-500">
              Ajoutez des documents PDF, fiches techniques ou certificats.
            </p>

            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="mt-5 block w-full rounded-2xl border p-4"
            />
          </div>
        </section>

        <aside className="space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-black">
              Services Maché
            </h2>

            <div className="mt-5 space-y-4">
              <label className="flex items-start gap-3 rounded-2xl border p-4">
                <input type="checkbox" className="mt-1" />

                <div>
                  <p className="font-bold">
                    Aide photos produit
                  </p>

                  <p className="text-sm text-neutral-500">
                    Recevez des conseils pour améliorer vos photos.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border p-4">
                <input type="checkbox" className="mt-1" />

                <div>
                  <p className="font-bold">
                    Shooting studio partenaire
                  </p>

                  <p className="text-sm text-neutral-500">
                    Réservez une séance photo professionnelle.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border p-4">
                <input type="checkbox" className="mt-1" />

                <div>
                  <p className="font-bold">
                    Optimisation fiche produit
                  </p>

                  <p className="text-sm text-neutral-500">
                    Maché vous aide à mieux vendre votre produit.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="card p-6">
            <button
              type="submit"
              className="btn-primary w-full"
            >
              Publier le produit
            </button>

            <p className="mt-4 text-center text-xs text-neutral-500">
              Les produits peuvent être vérifiés avant publication.
            </p>
          </div>
        </aside>
      </form>
    </main>
  );
}
