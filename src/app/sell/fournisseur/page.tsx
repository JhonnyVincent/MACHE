import { pageMetadata } from "@/lib/seo";
import { ProfilePage, type ProfileContent } from "@/components/sell/profile-page";

export const metadata = pageMetadata({
  title: "Vendre en gros : fournisseurs et grossistes",
  description:
    "Fournisseurs et grossistes : vendez en volume sur MACHE, recevez des demandes de devis de boutiques, hôtels, écoles et entreprises.",
  path: "/sell/fournisseur",
});

const content: ProfileContent = {
  eyebrow: "Profil vendeur · Fournisseur et grossiste",
  title: "Vendez en gros aux boutiques et aux partenaires.",
  intro:
    "Le profil Fournisseur est pensé pour les grossistes, distributeurs, importateurs et vendeurs qui veulent gérer du volume, des lots et des relations professionnelles.",
  primaryCta: "Créer un compte fournisseur",
  secondaryCta: { label: "Demander un devis", href: "/contact" },
  benefitsTitle: "Pensé pour le volume et les relations professionnelles.",
  benefits: [
    "Vendre en volume",
    "Travailler avec des boutiques",
    "Créer des prix de gros",
    "Recevoir des demandes professionnelles",
    "Préparer l’export futur",
    "Gérer plusieurs clients",
  ],
  toolsTitle: "Une place de marché pour le gros, avec le suivi de stock.",
  toolsIntro:
    "Le fournisseur peut utiliser MACHE pour présenter son catalogue, recevoir des demandes, gérer son stock et préparer des ventes en volume.",
  tools: [
    ["Commandes en volume", "Recevez et organisez les grosses commandes des boutiques et revendeurs."],
    ["Prix de gros", "Préparez des prix adaptés aux quantités et aux contrats professionnels."],
    ["Catalogue fournisseur", "Présentez vos produits, lots, catégories et disponibilités."],
    ["Partenaires", "Travaillez avec la livraison, l’export, le marketing et les services professionnels."],
    ["Suivi de stock", "Suivez vos quantités, disponibilités, alertes et mouvements de produits."],
    ["Devis", "Orientez les clients professionnels vers un contact ou un devis personnalisé."],
  ],
  plansTitle: "Des offres adaptées aux gros volumes.",
  plansIntro:
    "Les fournisseurs ont souvent besoin d’un accompagnement personnalisé : volumes, contrats, logistique, visibilité, partenaires et options avancées.",
  plans: [
    { name: "Business", price: "Sur devis", text: "Pour les fournisseurs à gros volume, avec partenaires et besoins avancés." },
    { name: "Partenaire", price: "Contrat", text: "Pour les grossistes, importateurs, exportateurs et acteurs stratégiques." },
  ],
  stepsTitle: "Lancer votre espace fournisseur.",
  steps: [
    "Créer un compte fournisseur",
    "Ajouter votre activité",
    "Envoyer les documents",
    "Créer le catalogue de gros",
    "Recevoir demandes et commandes",
  ],
  closing: {
    title: "Grossiste, importateur ou distributeur ? Parlons de votre volume.",
    text: "MACHE peut vous aider à structurer votre présence, vos prix, vos lots et vos futurs partenariats de livraison ou d’export.",
    primary: "Créer un compte fournisseur",
    secondary: { label: "Demander un devis", href: "/contact" },
  },
};

export default function SellFournisseurPage() {
  return <ProfilePage content={content} />;
}
