/*
  PAGE : livraison.

  Ce qu'elle disait, et qui n'est plus vrai

  « Il n'y a ni numéro de suivi, ni preuve de remise. » C'était exact
  jusqu'au module de livraison : MACHÉ sait désormais par quel chemin
  passe un colis, et surtout constater qu'il est arrivé.

  Ce qu'elle explique maintenant

  Les quatre chemins, et surtout ce qui les sépare — c'est là que les
  malentendus coûtent cher. Un client qui croit qu'un « agent MACHÉ »
  et « la boutique du coin qui garde les colis » sont la même chose ne
  saura pas à qui réclamer quand ça coince. Et un client qui croit que
  MACHÉ suit son colis alors qu'il est chez un transporteur extérieur
  appellera MACHÉ, qui ne saura rien lui dire.

  Le code de remise a sa section, en clair : c'est la seule chose que
  le client doit retenir, et la seule qu'il puisse mal utiliser.
*/

import Link from "next/link";
import { LegalPage } from "@/components/legal-page";

export const metadata = {
  title: "Livraison — MACHÉ",
  description:
    "Les quatre façons dont une commande MACHÉ est acheminée, et le code de remise.",
};

type Path = {
  title: string;
  what: string;
  who: string;
  /* Qui répond quand ça coince. C'est la question que tout le monde pose. */
  recourse: string;
};

const PATHS: Path[] = [
  {
    title: "Le vendeur livre lui-même",
    what: "La boutique vous apporte la commande, ou vous la récupérez chez elle.",
    who: "Le vendeur. MACHÉ n'intervient pas dans le trajet.",
    recourse:
      "Le vendeur d'abord. MACHÉ garde la trace de la remise : si vous n'avez pas donné votre code, la commande n'est pas marquée livrée.",
  },
  {
    title: "Un agent MACHÉ porte le colis",
    what: "Une personne habilitée par MACHÉ prend le colis chez le vendeur et vous l'apporte.",
    who: "Un agent MACHÉ. Son code se vérifie en ligne avant que vous ne lui remettiez quoi que ce soit.",
    recourse: "MACHÉ. C'est nous qui avons habilité cette personne, donc nous en répondons.",
  },
  {
    title: "Le colis attend dans un point de retrait",
    what: "Il est déposé dans un local du quartier — une boutique, une pharmacie, un dépôt — et vous passez le prendre quand vous voulez.",
    who: "Un LIEU, pas une personne. Le commerçant qui le tient est un agent MACHÉ, mais le point continue d'exister s'il est absent ou remplacé.",
    recourse:
      "MACHÉ, comme pour un agent. C'est pour cela que le point a son propre code : votre colis ne se perd pas si le tenant change.",
  },
  {
    title: "Un transporteur extérieur",
    what: "Le vendeur confie le colis à une société de transport qui n'a rien à voir avec MACHÉ.",
    who: "Le transporteur. MACHÉ ne le pilote pas et ne sait pas où en est le colis.",
    recourse:
      "Le transporteur, avec le numéro de suivi, puis le vendeur qui l'a choisi. MACHÉ affiche le numéro mais ne peut rien vous dire de plus — prétendre le contraire vous ferait perdre du temps.",
  },
];

function ShippingPageEcrit() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)] sm:text-4xl">
        Livraison
      </h1>

      <p className="mt-4 text-md leading-relaxed text-[var(--mache-muted)]">
        MACHÉ est une place de marché : chaque produit est vendu et expédié par
        son vendeur. Une commande prise chez plusieurs boutiques donne lieu à
        plusieurs envois, qui arrivent séparément et peuvent emprunter des
        chemins différents.
      </p>

      {/* ---------------------------------------------------------------- */}
      <section className="mt-9 rounded-[10px] border-2 border-[var(--mache-primary)] bg-[var(--mache-white)] p-5">
        <h2 className="text-xl font-black tracking-tight text-[var(--mache-text)]">
          Votre code de remise
        </h2>

        <p className="mt-3 text-base leading-relaxed text-[var(--mache-muted)]">
          Pour chaque commande, MACHÉ tire un code de six caractères,{" "}
          <strong className="text-[var(--mache-text)]">
            visible par vous seul
          </strong>{" "}
          sur la page de suivi de votre commande. Vous le donnez à la personne
          qui vous remet le colis, au moment où elle vous le remet.
        </p>

        <p className="mt-3 text-base leading-relaxed text-[var(--mache-muted)]">
          Ni le vendeur ni l&apos;agent ne le connaissent. C&apos;est tout
          l&apos;intérêt : pour marquer votre commande comme livrée, il faut
          avoir obtenu ce code de vous — donc vous avoir rencontré. Sans lui, «
          livré » ne serait que la parole de celui qui réclame son dû.
        </p>

        <ul className="mt-4 space-y-2 text-base leading-relaxed text-[var(--mache-text)]">
          <li className="flex gap-2.5">
            <span aria-hidden="true" className="shrink-0 font-bold text-[var(--mache-primary)]">→</span>
            <span>
              Ne donnez jamais votre code par téléphone, ni avant d&apos;avoir le
              colis en main. Le donner d&apos;avance revient à signer un reçu
              pour quelque chose que vous n&apos;avez pas reçu.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span aria-hidden="true" className="shrink-0 font-bold text-[var(--mache-primary)]">→</span>
            <span>
              Après cinq codes erronés, la remise se bloque et doit être
              débloquée par MACHÉ. C&apos;est volontaire : sans ce plafond, un
              code finirait par se trouver à force d&apos;essais.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span aria-hidden="true" className="shrink-0 font-bold text-[var(--mache-primary)]">→</span>
            <span>
              Les commandes confiées à un transporteur extérieur n&apos;ont pas
              de code : leur livreur ne connaît pas MACHÉ. C&apos;est vous qui
              constatez la réception depuis votre espace.
            </span>
          </li>
        </ul>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="mt-10">
        <h2 className="text-xl font-black tracking-tight text-[var(--mache-text)]">
          Les quatre chemins, et à qui s&apos;adresser
        </h2>

        <p className="mt-2 text-base leading-relaxed text-[var(--mache-muted)]">
          Le vendeur choisit le chemin. Il est indiqué sur votre page de suivi.
        </p>

        <div className="mt-5 space-y-4">
          {PATHS.map((path) => (
            <article
              key={path.title}
              className="rounded-[10px] border border-[var(--mache-line)] bg-[var(--mache-white)] p-5"
            >
              <h3 className="text-lg font-bold text-[var(--mache-text)]">{path.title}</h3>

              <p className="mt-2 text-base leading-relaxed text-[var(--mache-muted)]">
                {path.what}
              </p>

              <dl className="mt-3 space-y-2 border-t border-[var(--mache-line)] pt-3 text-sm leading-relaxed">
                <div>
                  <dt className="font-semibold text-[var(--mache-text)]">Qui transporte</dt>
                  <dd className="text-[var(--mache-muted)]">{path.who}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--mache-text)]">
                    À qui s&apos;adresser si ça coince
                  </dt>
                  <dd className="text-[var(--mache-muted)]">{path.recourse}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="mt-10 rounded-[10px] border border-[var(--mache-line)] bg-[var(--mache-white)] p-5">
        <h2 className="text-lg font-bold text-[var(--mache-text)]">
          Vérifier un agent avant de lui remettre quoi que ce soit
        </h2>

        <p className="mt-2 text-base leading-relaxed text-[var(--mache-muted)]">
          Un agent MACHÉ porte un code. Vous pouvez le vérifier sur{" "}
          <Link
            href="/verify-agent"
            className="font-semibold text-[var(--mache-primary)] hover:underline"
          >
            la page de vérification
          </Link>
          , depuis votre propre téléphone, pendant qu&apos;il attend. Si le code
          ne se vérifie pas, ne remettez ni colis ni argent. C&apos;est normal de
          vérifier, et les agents le savent.
        </p>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="mt-6 rounded-[10px] border border-[#f3d9a5] bg-[#fdf6e8] p-5">
        <h2 className="text-md font-bold text-[var(--mache-text)]">
          Ce qui n&apos;est pas encore en place
        </h2>

        <p className="mt-2 text-base leading-relaxed text-[var(--mache-muted)]">
          Aucun transporteur n&apos;est raccordé à MACHÉ : le numéro de suivi
          d&apos;un transporteur extérieur est recopié à la main par le vendeur,
          et ne se met pas à jour tout seul. Il n&apos;y a ni délai garanti ni
          grille de frais par zone — délais et frais se conviennent avec le
          vendeur. Le réseau de points de retrait est en cours de constitution :{" "}
          <Link
            href="/partenaires"
            className="font-semibold text-[var(--mache-primary)] hover:underline"
          >
            un commerce peut en tenir un
          </Link>
          .
        </p>
      </section>

      <p className="mt-6 text-base text-[var(--mache-muted)]">
        Une question sur une livraison en cours ?{" "}
        <Link href="/contact" className="font-semibold text-[var(--mache-primary)] hover:underline">
          Contactez-nous
        </Link>
        .
      </p>
    </main>
  );
}

/*
  La page telle qu'elle s'affiche.

  Si un texte a été publié depuis l'administration pour « livraison »,
  c'est lui qui s'affiche. Sinon — rien de publié, ou backend muet —
  c'est le texte ci-dessus, écrit dans le code.

  Ce texte n'est donc pas un vestige : c'est le filet. Une page légale
  qui afficherait « service indisponible » serait pire qu'inutile,
  puisque c'est justement la page qu'on consulte quand quelque chose ne
  va pas.
*/
export default async function ShippingPage() {
  return (
    <LegalPage slug="livraison" fallbackTitle="Livraison">
      <ShippingPageEcrit />
    </LegalPage>
  );
}
