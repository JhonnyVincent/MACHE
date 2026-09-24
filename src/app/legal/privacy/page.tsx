/*
  PAGE : politique de confidentialité

  Ce qu'elle était

  Trois phrases, dont une qui disait : « Les données sensibles doivent
  être protégées via Supabase, permissions strictes et RLS. » C'était une
  note technique adressée à soi-même, pas une information destinée à un
  client — et depuis la bascule sur Medusa, c'était en partie faux.

  Ce qu'elle est

  La description exacte de ce que le site fait des données : ce qui est
  demandé, où cela va, ce qui est déposé dans le navigateur. Tout ici a
  été relevé dans le code, pas supposé.

  Ce qu'elle n'invente pas

  L'identité juridique de l'exploitant, le droit applicable, les durées
  de conservation et l'adresse d'exercice des droits sont des décisions
  qui engagent MACHÉ. Elles se prennent, au besoin avec un conseil, et
  ne sont pas écrites ici à sa place. Une politique qui affirmerait des
  durées inventées serait pire qu'une politique incomplète : elle
  donnerait l'apparence d'un engagement qui n'existe pas.
*/

import Link from "next/link";
import { LegalPage } from "@/components/legal-page";

export const metadata = {
  title: "Confidentialité — MACHÉ",
  description:
    "Quelles données MACHÉ collecte, pourquoi, et ce qui est déposé dans votre navigateur.",
};

function PrivacyPageEcrit() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)] sm:text-4xl">
        Confidentialité
      </h1>

      <p className="mt-3 text-md leading-relaxed text-[var(--mache-muted)]">
        Ce que MACHÉ demande, pourquoi, et où cela va.
      </p>

      <div className="mt-8 space-y-7 text-md leading-relaxed text-[var(--mache-muted)]">
        <section>
          <h2 className="text-lg font-bold text-[var(--mache-text)]">
            Ce que nous demandons, et seulement quand nous en avons besoin
          </h2>

          <p className="mt-2">
            Parcourir le catalogue ne demande rien. Aucun compte
            n&apos;est nécessaire pour voir les produits, les boutiques
            ou les prix.
          </p>

          <ul className="mt-3 space-y-2">
            <li>
              <strong className="text-[var(--mache-text)]">
                Pour créer un compte client
              </strong>{" "}
              : votre adresse e-mail, un mot de passe, et votre nom si
              vous le donnez.
            </li>
            <li>
              <strong className="text-[var(--mache-text)]">
                Pour commander
              </strong>{" "}
              : votre nom, votre téléphone et votre adresse de livraison —
              rue, ville, code postal, pays. Le vendeur en a besoin pour
              vous livrer, et l&apos;agent pour vous trouver.
            </li>
            <li>
              <strong className="text-[var(--mache-text)]">
                Pour ouvrir une boutique
              </strong>{" "}
              : le nom de la boutique, une adresse e-mail et un mot de
              passe. Ce que vous ajoutez ensuite — description, logo,
              produits — est public par nature.
            </li>
          </ul>

          <p className="mt-3">
            Nous ne demandons{" "}
            <strong className="text-[var(--mache-text)]">
              aucune donnée bancaire
            </strong>
            . Le paiement se fait à la livraison, en main propre : aucun
            numéro de carte n&apos;est saisi sur MACHÉ, donc aucun
            n&apos;est conservé.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[var(--mache-text)]">
            Qui voit quoi
          </h2>

          <p className="mt-2">
            Quand vous commandez, le vendeur concerné reçoit ce
            qu&apos;il lui faut pour préparer et livrer : votre nom, votre
            téléphone, votre adresse, et les articles commandés. Il ne
            reçoit pas votre mot de passe, ni l&apos;historique de vos
            achats chez d&apos;autres boutiques.
          </p>

          <p className="mt-3">
            Un panier qui mélange plusieurs boutiques devient plusieurs
            commandes, une par vendeur. Chacun ne voit que la sienne.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[var(--mache-text)]">
            Ce qui est déposé dans votre navigateur
          </h2>

          <p className="mt-2">
            Cinq cookies, tous nécessaires au fonctionnement du site.
            MACHÉ ne dépose{" "}
            <strong className="text-[var(--mache-text)]">
              aucun cookie publicitaire, ni aucun traceur d&apos;audience
            </strong>
            .
          </p>

          <ul className="mt-3 space-y-1.5">
            <li>
              <code className="text-sm">mache_cart_id</code> — retient
              votre panier d&apos;une page à l&apos;autre.
            </li>
            <li>
              <code className="text-sm">mache_customer_token</code> — vous
              garde connecté à votre compte client.
            </li>
            <li>
              <code className="text-sm">mache_vendor_token</code> et{" "}
              <code className="text-sm">mache_vendor_seller</code> —
              gardent un vendeur connecté à sa boutique.
            </li>
            <li>
              <code className="text-sm">mache_locale</code> — retient la
              langue que vous avez choisie.
            </li>
          </ul>

          <p className="mt-3">
            Les jetons de connexion sont inaccessibles aux scripts de la
            page, ce qui les protège du vol par un script injecté.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[var(--mache-text)]">
            Les images des produits
          </h2>

          <p className="mt-2">
            Les photos que vous voyez sont hébergées par les vendeurs ou
            par leurs prestataires. Les afficher fait connaître votre
            adresse IP à ces hébergeurs, comme pour n&apos;importe quelle
            image sur le web. MACHÉ ne leur transmet rien d&apos;autre.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[var(--mache-text)]">
            Vos droits
          </h2>

          <p className="mt-2">
            Vous pouvez consulter et corriger vos informations depuis
            votre espace client, et demander la suppression de votre
            compte en nous écrivant.
          </p>

          <Link
            href="/contact"
            className="mt-3 inline-block rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
          >
            Nous écrire
          </Link>
        </section>

        {/*
          Dit franchement plutôt que comblé par des affirmations
          inventées. Des durées de conservation annoncées au hasard
          donneraient l'apparence d'un engagement inexistant.
        */}
        <section className="rounded-[10px] border border-[#f3d9a5] bg-[#fdf6e8] p-4">
          <h2 className="text-lg font-bold text-[var(--mache-text)]">
            Ce qui reste à arrêter
          </h2>

          <p className="mt-2 text-base">
            Cette page décrit fidèlement ce que fait le site aujourd&apos;hui.
            Trois points relèvent d&apos;une décision de MACHÉ et seront
            précisés avant l&apos;ouverture commerciale : l&apos;identité
            juridique de l&apos;exploitant, les durées de conservation des
            données, et le droit applicable en cas de litige.
          </p>

          <p className="mt-2 text-base">
            Nous préférons le dire plutôt que d&apos;annoncer des
            engagements que nous n&apos;avons pas encore pris.
          </p>
        </section>
      </div>

      <p className="mt-10 text-sm text-[var(--mache-muted)]">
        <Link href="/legal/terms" className="font-semibold hover:underline">
          Conditions générales
        </Link>{" "}
        ·{" "}
        <Link href="/legal/returns" className="font-semibold hover:underline">
          Retours
        </Link>{" "}
        ·{" "}
        <Link href="/legal/shipping" className="font-semibold hover:underline">
          Livraison
        </Link>
      </p>
    </main>
  );
}

/*
  La page telle qu'elle s'affiche.

  Si un texte a été publié depuis l'administration pour « confidentialite »,
  c'est lui qui s'affiche. Sinon — rien de publié, ou backend muet —
  c'est le texte ci-dessus, écrit dans le code.

  Ce texte n'est donc pas un vestige : c'est le filet. Une page légale
  qui afficherait « service indisponible » serait pire qu'inutile,
  puisque c'est justement la page qu'on consulte quand quelque chose ne
  va pas.
*/
export default async function PrivacyPage() {
  return (
    <LegalPage slug="confidentialite" fallbackTitle="Confidentialité">
      <PrivacyPageEcrit />
    </LegalPage>
  );
}
