/*
  PAGE : les partenaires de MACHÉ.

  Le piège de cette page

  « Nos partenaires » est la page qu'on remplit le plus facilement de
  logos qu'on n'a pas le droit d'afficher. Une marque connue posée en
  bas d'une page d'accueil vaut caution : le visiteur en conclut que
  cette entreprise travaille avec MACHÉ. Si c'est faux, c'est un
  mensonge, et en droit une atteinte à la marque.

  Donc : aucun logo, aucun nom, tant que personne n'a signé.

  Ce que la page fait à la place

  Elle dit ce qu'un partenariat avec MACHÉ veut dire, quels quatre
  types sont recherchés, et ce que MACHÉ donne en échange. Elle est
  utile telle quelle — plus utile, en vérité, qu'un mur de logos, car
  elle s'adresse à quelqu'un qui se demande s'il a sa place ici.

  Le premier partenariat est déjà branché

  Tenir un point de retrait n'est pas une intention : le module de
  livraison sait déposer un colis dans un point et le remettre contre
  le code de l'acheteur. C'est le seul des quatre dont la page peut
  dire « c'est en place », et elle le distingue des trois autres.
*/

import Link from "next/link";

export const metadata = {
  title: "Partenaires et sponsors · MACHÉ",
  description:
    "Ce qu'est un partenariat avec MACHÉ, les quatre formes recherchées, et comment le proposer.",
};

type Partnership = {
  title: string;
  who: string;
  what: string;
  /* Ce que MACHÉ apporte en retour. Sans cela, la page demande sans offrir. */
  gives: string;
  /* Est-ce branché aujourd'hui, ou seulement souhaité ? */
  ready: boolean;
};

const PARTNERSHIPS: Partnership[] = [
  {
    title: "Tenir un point de retrait",
    who: "Une boutique, une pharmacie, un dépôt, un cybercafé — un local ouvert à heures régulières, dans un quartier.",
    what: "Les colis destinés au quartier y attendent leur destinataire. Vous les remettez contre le code que l'acheteur vous donne.",
    gives:
      "Du passage : chaque retrait amène quelqu'un chez vous. Votre point est affiché avec son adresse et ses horaires sur MACHÉ.",
    ready: true,
  },
  {
    title: "Transporter",
    who: "Un transporteur, une coopérative de motos-taxis, une société de fret entre départements.",
    what: "Acheminer les colis d'un département à l'autre, ou d'un vendeur à un point de retrait.",
    gives:
      "Un volume groupé au lieu de courses isolées, et une adresse de destination fiable — le point de retrait plutôt qu'un domicile difficile à trouver.",
    ready: false,
  },
  {
    title: "Encadrer des producteurs",
    who: "Une coopérative agricole, une association d'artisans, une chambre de métiers, une ONG qui accompagne des producteurs.",
    what:
      "Aider vos membres à ouvrir leur boutique et à tenir leur catalogue. MACHÉ n'a pas d'équipe sur le terrain ; vous, vous connaissez les producteurs.",
    gives:
      "L'ouverture d'une boutique ne coûte rien, et vos membres gardent leur propre marque plutôt que de disparaître derrière la nôtre.",
    ready: false,
  },
  {
    title: "Faire connaître",
    who: "Un média, une association de la diaspora, une organisation d'événements.",
    what:
      "Faire savoir que les producteurs haïtiens sont joignables en ligne — c'est aujourd'hui le premier obstacle, bien avant la technique.",
    gives: "Ce qui est à discuter, et honnêtement : MACHÉ n'a pas encore de budget de communication.",
    ready: false,
  },
];

export default function PartenairesPage() {
  return (
    <main className="bg-[var(--mache-bg)] pb-12">
      {/* ---------------------------------------------------------------- */}
      <section className="border-b border-[var(--mache-line)] bg-[var(--mache-white)]">
        <div className="container-page py-10 lg:py-14">
          <span className="inline-block rounded-[3px] bg-[var(--mache-primary)] px-2 py-1 text-xs font-bold uppercase tracking-widest text-white">
            Partenaires
          </span>

          <h1 className="mt-4 max-w-3xl text-hero font-black tracking-tightest text-[var(--mache-text)]">
            MACHÉ ne peut pas faire ça tout seul.
          </h1>

          <p className="mt-5 max-w-2xl text-md leading-relaxed text-[var(--mache-muted)]">
            Connecter les producteurs d&apos;Haïti au reste du monde demande des
            locaux, des routes, des gens qui connaissent les producteurs et des
            gens qui savent le faire savoir. MACHÉ tient la place de marché ;
            le reste se fait à plusieurs.
          </p>

          {/*
            L'encadré qui évite le mensonge le plus facile de cette page.
            Il est en haut, pas en bas : quelqu'un qui cherche des
            références doit l'apprendre avant de faire défiler.
          */}
          <div className="mt-7 max-w-2xl rounded-[10px] border border-[#e6d6b8] bg-[#fdf8ec] p-5">
            <h2 className="text-md font-bold text-[var(--mache-text)]">
              Cette page ne liste encore personne
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--mache-muted)]">
              MACHÉ démarre, et aucun partenariat n&apos;est signé. Elle restera
              vide jusque-là : un logo affiché sans accord donne à croire
              qu&apos;une entreprise soutient MACHÉ, et c&apos;est le genre de
              caution qui ne se reprend pas. Les noms apparaîtront ici quand ils
              auront dit oui.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="mache-reveal container-page py-10">
        <h2 className="text-2xl font-black tracking-tight text-[var(--mache-text)]">
          Quatre façons de travailler ensemble
        </h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {PARTNERSHIPS.map((item) => (
            <article
              key={item.title}
              className="flex flex-col rounded-[10px] border border-[var(--mache-line)] bg-[var(--mache-white)] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-lg font-bold text-[var(--mache-text)]">{item.title}</h3>

                {/*
                  La distinction qui rend la page honnête : un seul de
                  ces quatre est branché. Les trois autres sont des
                  souhaits, et le dire évite qu'un partenaire croie
                  rejoindre un dispositif qui tourne.
                */}
                <span
                  className={`shrink-0 rounded-[3px] px-2 py-0.5 text-2xs font-bold uppercase tracking-wide ${
                    item.ready
                      ? "bg-[#eaf6ec] text-[#116b25]"
                      : "bg-[#f7f8f8] text-[#565959]"
                  }`}
                >
                  {item.ready ? "En place" : "À construire"}
                </span>
              </div>

              <p className="mt-3 text-sm font-semibold text-[var(--mache-text)]">{item.who}</p>

              <p className="mt-2 text-sm leading-relaxed text-[var(--mache-muted)]">{item.what}</p>

              <p className="mt-3 border-t border-[var(--mache-line)] pt-3 text-sm leading-relaxed text-[var(--mache-muted)]">
                <span className="font-semibold text-[var(--mache-text)]">
                  Ce que MACHÉ apporte :{" "}
                </span>
                {item.gives}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="mache-reveal container-page pb-10">
        <div className="rounded-[10px] border border-[var(--mache-line)] bg-[var(--mache-white)] p-6">
          <h2 className="text-xl font-black tracking-tight text-[var(--mache-text)]">
            Et les sponsors ?
          </h2>

          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--mache-muted)]">
            MACHÉ ne vend pas d&apos;espace publicitaire et n&apos;a pas de
            régie : il n&apos;y a rien à sponsoriser sur le site, ni bannière,
            ni produit mis en avant contre paiement. Le jour où cela existera,
            ce sera écrit ici et signalé comme tel sur les pages concernées —
            une mise en avant payée qui ne se distingue pas d&apos;un classement
            trompe l&apos;acheteur.
          </p>

          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--mache-muted)]">
            Un soutien financier au projet, en revanche, se discute. Il
            n&apos;achète pas de place dans les résultats de recherche.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="mache-reveal container-page">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] bg-[var(--mache-dark)] p-6 text-white">
          <div>
            <h2 className="text-xl font-black tracking-tight">
              Vous vous reconnaissez dans l&apos;une de ces quatre lignes ?
            </h2>
            <p className="mt-1.5 max-w-xl text-base leading-relaxed text-white/70">
              Écrivez-nous en disant laquelle, où vous êtes et ce que vous
              faites déjà. C&apos;est suffisant pour commencer.
            </p>
          </div>

          <Link
            href="/contact"
            className="rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-strong)]"
          >
            Nous écrire
          </Link>
        </div>
      </section>
    </main>
  );
}
