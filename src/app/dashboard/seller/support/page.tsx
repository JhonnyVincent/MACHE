import { requireSeller } from "@/lib/seller";
import { PageHeader, Panel, Button, Notice } from "@/components/seller/ui";

export const dynamic = "force-dynamic";

const TOPICS = [
  {
    title: "Créer et vérifier une boutique",
    text: "Nom, catégorie, document légal : ce qui est demandé et pourquoi la vérification peut prendre quelques jours.",
  },
  {
    title: "Publier un produit",
    text: "Titre, prix en HTG, stock, photos. Les règles de publication et les catégories soumises à autorisation.",
  },
  {
    title: "Traiter une commande",
    text: "De la réception à la remise au client : préparation, expédition, litiges et remboursements.",
  },
  {
    title: "Être payé",
    text: "Quand l'argent est versé, comment la commission est calculée, et ce qui figure sur vos relevés.",
  },
];

export default async function SellerSupportPage() {
  const { firstName, email, roleLabel } = await requireSeller("/dashboard/seller/support");

  return (
    <>
      <PageHeader
        title="Aide"
        subtitle="Documentation vendeur et contact avec l'équipe MACHE."
      />

      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Panel title="Sujets fréquents" padded={false}>
            <ul>
              {TOPICS.map((topic) => (
                <li key={topic.title} className="border-b border-[#e3e6e6] px-4 py-3 last:border-0">
                  <p className="text-[12.5px] font-semibold">{topic.title}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#565959]">{topic.text}</p>
                </li>
              ))}
            </ul>
          </Panel>

          <div className="space-y-4">
            <Panel title="Contacter l'équipe">
              <p className="text-[12.5px] leading-relaxed text-[#565959]">
                Décrivez votre situation le plus précisément possible : nom de la boutique,
                référence de commande, message d&apos;erreur exact. Cela évite un aller-retour.
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <Button href="/contact" variant="primary">Écrire à l&apos;assistance</Button>
                <Button href="/faq">Consulter la FAQ</Button>
              </div>
            </Panel>

            <Panel title="Votre dossier">
              <dl className="space-y-1.5 text-[12px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-[#565959]">Compte</dt>
                  <dd className="font-medium">{firstName}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[#565959]">E-mail</dt>
                  <dd className="truncate font-medium">{email || "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[#565959]">Type</dt>
                  <dd className="font-medium">{roleLabel}</dd>
                </div>
              </dl>
              <p className="mt-3 text-[11.5px] leading-relaxed text-[#767676]">
                Mentionnez ces informations dans votre message.
              </p>
            </Panel>
          </div>
        </div>

        <Notice tone="info" title="Assistance vocale">
          L&apos;assistance par message vocal, prévue pour les vendeurs qui préfèrent parler
          qu&apos;écrire, n&apos;est pas encore disponible. Elle sera annoncée ici.
        </Notice>
      </div>
    </>
  );
}
