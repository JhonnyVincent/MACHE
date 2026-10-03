import { pageMetadata } from "@/lib/seo";
import { ProfilePage, type ProfileContent } from "@/components/sell/profile-page";

export const metadata = pageMetadata({
  title: "Vendre sur MACHE en tant que vendeur",
  description:
    "Vendre quelques articles ou votre artisanat sur MACHE, seul ou avec une boutique : comment ça marche, ce qu'il faut pour commencer.",
  path: "/sell/vendeur",
});

const content: ProfileContent = {
  eyebrow: "Profil Vendeur",
  title: "Commencez à vendre simplement sur MACHE.",
  intro:
    "Le profil Vendeur est pensé pour les personnes qui veulent vendre quelques produits, tester le marché et gérer leur activité sans complexité.",
  primaryCta: "Créer mon compte vendeur",
  secondaryCta: { label: "Besoin d’aide ?", href: "/contact" },
  benefitsTitle: "Simple, rapide et adapté aux débuts.",
  benefits: [
    "Commencer avec peu de produits",
    "Vendre localement en Haïti",
    "Gérer depuis un téléphone",
    "Un espace vendeur simple",
    "Une boutique publique",
    "Suivi de stock en option",
    "Trouver un grossiste ou une marque, demander un devis et revendre",
  ],
  toolsTitle: "Vendez d’abord. Activez les outils quand vous grandissez.",
  toolsIntro:
    "Un petit vendeur peut commencer avec la place de marché seulement. Ensuite, il peut activer le stock, les statistiques et les outils de gestion selon ses besoins.",
  tools: [
    ["Produits", "Ajoutez images, prix, description et stock."],
    ["Commandes", "Suivez les commandes reçues simplement."],
    ["Stock", "Recevez une alerte quand un produit est presque épuisé."],
    ["Boutique", "Ayez une page publique pour vos produits."],
  ],
  stepsTitle: "Comment commencer ?",
  steps: [
    "Créer un compte vendeur",
    "Choisir le profil Vendeur",
    "Ajouter téléphone et adresse",
    "Publier vos premiers produits",
    "Recevoir vos premières commandes",
  ],
  closing: {
    title: "Lancez votre première boutique aujourd’hui.",
    text: "Commencez avec quelques produits, puis développez votre activité étape par étape.",
    primary: "Créer mon compte",
    secondary: { label: "Voir les autres profils", href: "/sell" },
  },
};

export default function SellVendeurPage() {
  return <ProfilePage content={content} />;
}
