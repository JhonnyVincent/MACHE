const faqs = [
  {
    q: "Qui peut vendre sur Mache ?",
    a: "Des particuliers, des vendeurs professionnels, des fournisseurs et la plateforme Mache."
  },
  {
    q: "Comment un produit est-il publié ?",
    a: "Auto-approbation si toutes les conditions sont remplies, sinon revue manuelle."
  },
  {
    q: "Peut-on vérifier un agent ?",
    a: "Oui, grâce à un code public sur la page de vérification."
  },
  {
    q: "Les paiements sont-ils prévus ?",
    a: "Oui, l’architecture prévoit Stripe, PayPal, moyens locaux et cash on delivery."
  }
];

export default function FaqPage() {
  return (
    <main className="container-page py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold">FAQ</h1>
        <div className="mt-8 space-y-4">
          {faqs.map((faq) => (
            <div key={faq.q} className="card p-6">
              <h2 className="text-lg font-semibold">{faq.q}</h2>
              <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
