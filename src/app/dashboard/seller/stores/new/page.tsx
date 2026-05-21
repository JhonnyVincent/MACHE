import Link from "next/link";
import { createStoreAction } from "./actions";

const categories = [
  "Vêtements",
  "Beauté",
  "Alimentation",
  "Artisanat",
  "Maison",
  "Électronique",
  "Bijoux",
  "Chaussures",
  "Accessoires",
  "Services",
];

export default function NewStorePage() {
  return (
    <main className="min-h-screen bg-[#f3f4f8]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Link
          href="/dashboard/seller"
          className="text-sm font-black text-[#d2162c]"
        >
          ← Retour au dashboard
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <section className="rounded-3xl border bg-white p-8 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#d2162c]">
              Nouveau store
            </p>

            <h1 className="mt-3 text-4xl font-black text-[#070707]">
              Créer une boutique
            </h1>

            <p className="mt-3 text-sm text-gray-500">
              Ajoutez les informations principales. Le logo, la bannière et les documents pourront être complétés après.
            </p>

            <form action={createStoreAction} className="mt-8 space-y-5">
              <div>
                <label className="text-sm font-black text-gray-900">
                  Nom du store *
                </label>
                <input
                  name="name"
                  required
                  placeholder="Ex : Lakay Fashion"
                  className="mt-2 w-full rounded-2xl border px-4 py-4 text-sm outline-none focus:border-[#d2162c]"
                />
              </div>

              <div>
                <label className="text-sm font-black text-gray-900">
                  Catégorie principale *
                </label>
                <select
                  name="category"
                  required
                  className="mt-2 w-full rounded-2xl border bg-white px-4 py-4 text-sm outline-none focus:border-[#d2162c]"
                >
                  <option value="">Choisir une catégorie</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-black text-gray-900">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={5}
                  placeholder="Présentez votre boutique, votre histoire, vos produits..."
                  className="mt-2 w-full rounded-2xl border px-4 py-4 text-sm outline-none focus:border-[#d2162c]"
                />
              </div>

              <div>
                <label className="text-sm font-black text-gray-900">
                  Mots-clés
                </label>
                <input
                  name="keywords"
                  placeholder="mode, robe, chaussures, beauté, produits haïtiens"
                  className="mt-2 w-full rounded-2xl border px-4 py-4 text-sm outline-none focus:border-[#d2162c]"
                />
                <p className="mt-2 text-xs text-gray-400">
                  Séparez les mots-clés par des virgules.
                </p>
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-[#070707] px-6 py-4 text-sm font-black text-white hover:bg-[#111827]"
              >
                Créer mon store →
              </button>
            </form>
          </section>

          <aside className="space-y-5">
            <div className="rounded-3xl bg-[#070707] p-6 text-white">
              <h2 className="text-xl font-black">Après création</h2>
              <div className="mt-5 space-y-4 text-sm text-white/70">
                <p>✅ Ajouter logo et bannière</p>
                <p>✅ Compléter les documents du store</p>
                <p>✅ Choisir les couleurs</p>
                <p>✅ Ajouter les premiers produits</p>
                <p>✅ Ouvrir la boutique aux clients</p>
              </div>
            </div>

            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-[#070707]">
                Conseil MACHE
              </h2>
              <p className="mt-3 text-sm text-gray-500">
                Choisissez un nom clair, une catégorie précise et des mots-clés utiles pour aider les clients à retrouver votre boutique.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
