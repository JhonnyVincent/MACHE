// src/components/seller-store-page-shell.tsx

/*
  COMPOSANT : SellerStorePageShell

  Sert à :
  - Réutiliser le même design pour les pages du dashboard store
  - Éviter de recopier 15 fois le même style
  - Afficher un titre, une description et des cartes d’actions
*/

import Link from "next/link";

export function SellerStorePageShell({
  title,
  description,
  storeId,
  cards,
}: {
  title: string;
  description: string;
  storeId: string;
  cards: {
    title: string;
    text: string;
    href?: string;
    icon: string;
  }[];
}) {
  return (
    <main className="min-h-screen bg-[#f5f7fb] p-6">
      <div className="mb-6">
        <Link
          href={`/dashboard/seller/stores/${storeId}`}
          className="text-sm font-bold text-[#0053c6]"
        >
          ← Retour au tableau de bord
        </Link>

        <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#07152f]">
          {title}
        </h1>

        <p className="mt-2 max-w-3xl text-gray-500">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const content = (
            <div className="rounded-2xl border border-[#e7eaf1] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf3ff] text-2xl">
                {card.icon}
              </div>

              <h2 className="mt-5 text-xl font-black text-[#07152f]">
                {card.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                {card.text}
              </p>
            </div>
          );

          if (card.href) {
            return (
              <Link key={card.title} href={card.href}>
                {content}
              </Link>
            );
          }

          return <div key={card.title}>{content}</div>;
        })}
      </div>
    </main>
  );
}
