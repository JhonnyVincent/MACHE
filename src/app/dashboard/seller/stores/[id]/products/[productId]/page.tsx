/*
  PAGE : Modifier un produit

  Sert à :
  - Ouvrir la page d’un produit précis du store
  - Préparer la modification du produit
  - Plus tard : modifier titre, prix, stock, image, statut, description
*/

import Link from "next/link";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string; productId: string }>;
}) {
  const { id, productId } = await params;

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-6">
      <Link
        href={`/dashboard/seller/stores/${id}/products`}
        className="text-sm font-bold text-[#0053c6]"
      >
        ← Retour aux produits
      </Link>

      <div className="mt-6 rounded-2xl border border-[#e7eaf1] bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black text-[#07152f]">
          Modifier le produit
        </h1>

        <p className="mt-3 text-gray-500">
          Page de modification du produit : {productId}
        </p>

        <div className="mt-6 rounded-xl bg-[#fff8e8] p-5 text-sm text-gray-700">
          Cette page existe maintenant. On branchera ensuite les vrais champs de modification.
        </div>
      </div>
    </main>
  );
}
