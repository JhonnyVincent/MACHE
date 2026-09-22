/*
  Écran des anciennes portes d'authentification de MACHÉ.

  Ce qu'il remplace

  `/login`, `/register`, `/forgot-password`, `/reset-password` et la
  connexion par code lisaient leurs comptes dans Supabase. Le projet
  Supabase a été supprimé : ces pages affichaient toujours un
  formulaire complet, qui échouait à l'envoi.

  Un formulaire qui ne peut pas aboutir est pire qu'une page absente.
  On le remplit, on l'envoie, on recommence en croyant s'être trompé de
  mot de passe — et sur `/register`, on croit avoir créé un compte qui
  n'existe pas.

  Ce qu'il montre

  Les trois portes qui fonctionnent, nommées par ce qu'on vient y
  faire. Quelqu'un qui atterrit ici cherchait à se connecter ; il faut
  lui dire où, pas seulement que ce n'est pas ici.

  Il ne cite aucune variable d'environnement : ces adresses sont
  publiques, contrairement aux espaces internes.
*/

import Link from "next/link";

const DOORS = [
  {
    title: "Vous achetez sur MACHÉ",
    text: "Suivre vos commandes, vos adresses, vos demandes de devis.",
    href: "/compte/connexion",
    action: "Se connecter",
  },
  {
    title: "Vous vendez sur MACHÉ",
    text: "Votre boutique, vos produits, vos commandes et vos versements.",
    href: "/dashboard/seller/connexion",
    action: "Espace vendeur",
  },
  {
    title: "Vous êtes de l'équipe MACHÉ",
    text: "Administration de la marketplace.",
    href: "/dashboard/admin/connexion",
    action: "Administration",
  },
];

export function AuthDoors({ what }: { what: string }) {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-14">
      <h1 className="text-2xl font-bold tracking-tight text-[var(--mache-text)]">
        Cette page n&apos;est plus utilisée
      </h1>

      <p className="mt-3 text-md leading-relaxed text-[var(--mache-muted)]">
        {what} Les comptes de MACHÉ ont changé d&apos;endroit : chaque
        public a maintenant sa propre porte.
      </p>

      <div className="mt-6 space-y-3">
        {DOORS.map((door) => (
          <div
            key={door.href}
            className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[var(--mache-line)] bg-white p-4"
          >
            <div className="min-w-0">
              <p className="text-base font-bold text-[var(--mache-text)]">
                {door.title}
              </p>
              <p className="mt-0.5 text-base text-[var(--mache-muted)]">
                {door.text}
              </p>
            </div>

            <Link
              href={door.href}
              className="shrink-0 rounded-[6px] bg-[var(--mache-text)] px-4 py-2 text-base font-bold text-white transition-colors hover:bg-black"
            >
              {door.action}
            </Link>
          </div>
        ))}
      </div>

      {/*
        Pas encore de compte : la porte la plus fréquente depuis cette
        page, puisqu'elle servait aussi à s'inscrire.
      */}
      <p className="mt-6 text-base leading-relaxed text-[var(--mache-muted)]">
        Pas encore de compte ?{" "}
        <Link
          href="/compte/inscription"
          className="font-semibold text-[var(--mache-primary)] hover:underline"
        >
          Créer un compte client
        </Link>{" "}
        ou{" "}
        <Link
          href="/dashboard/seller/inscription"
          className="font-semibold text-[var(--mache-primary)] hover:underline"
        >
          ouvrir une boutique
        </Link>
        .
      </p>
    </main>
  );
}
