/*
  PAGE : le contrat prêt à imprimer, ou à enregistrer en PDF.

  À quoi elle sert

  À sortir de MACHÉ un document qu'on envoie signer ailleurs — Adobe,
  DocuSign, ou tout simplement sur papier. MACHÉ garde la trace de ce
  qu'il a proposé ; la signature elle-même peut se faire où l'on veut.

  Pourquoi pas un vrai fichier PDF généré par le serveur

  Parce que tout navigateur sait imprimer vers un PDF, et que le fichier
  obtenu convient à n'importe quel service de signature. Fabriquer le
  PDF nous-mêmes ajouterait une dépendance sur le chemin d'un document
  juridique, et surtout les ennuis d'accents : les bibliothèques de PDF
  exigent d'embarquer une police pour rendre « é », « à », « ç », et
  mal fait, le contrat sort avec des carrés à la place des accents — sur
  un document qui engage. Ici, ce qui s'imprime est ce qui s'affiche.

  LA LIGNE LA PLUS IMPORTANTE DU DOCUMENT

  L'empreinte du texte, imprimée SUR le contrat.

  C'est elle qui rattache une signature faite ailleurs au texte que
  MACHÉ détient. Sans elle, un contrat signé chez Adobe serait un PDF
  isolé : rien ne permettrait de démontrer qu'il correspond mot pour mot
  à la version enregistrée ici. Avec elle, il suffit de recalculer
  l'empreinte du texte de MACHÉ et de la comparer à celle imprimée sur
  le document signé.

  Ce que la page laisse VIDE

  Les blocs de signature. On ne préremplit pas le nom d'un dirigeant qui
  n'a pas encore signé : un document qui porte déjà le nom du signataire
  avant sa signature est une invitation à ne pas lire.
*/

import { Link } from "next-view-transitions";
import { redirect } from "next/navigation";
import {
  getAdminUser,
  fetchContract,
  fetchSellers,
} from "@/lib/medusa/admin";
import { formatDate } from "@/lib/seller";
import { Notice } from "@/components/seller/ui";

export const dynamic = "force-dynamic";

function SignatureBlock({ role, subtitle }: { role: string; subtitle: string }) {
  return (
    <div className="mache-print-keep flex-1">
      <p className="text-sm font-bold uppercase tracking-wide">{role}</p>
      <p className="mt-0.5 text-xs text-[#565959]">{subtitle}</p>

      <dl className="mt-4 space-y-4 text-sm">
        {["Nom et prénom", "Qualité", "Date"].map((label) => (
          <div key={label}>
            <dt className="text-xs text-[#565959]">{label}</dt>
            <dd className="mt-3 border-b border-black/60" />
          </div>
        ))}

        <div>
          <dt className="text-xs text-[#565959]">
            Signature (précédée de la mention « lu et approuvé »)
          </dt>
          <dd className="mt-12 border-b border-black/60" />
        </div>
      </dl>
    </div>
  );
}

export default async function ContractDocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ seller?: string }>;
}) {
  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  const { id } = await params;

  const query = searchParams ? await searchParams : {};

  const result = await fetchContract(id);

  if (!result.ok) {
    return (
      <Notice tone="danger" title="Ce contrat ne s'affiche pas">
        {result.reason}
      </Notice>
    );
  }

  const contract = result.data;

  /*
    La boutique destinataire, quand on en désigne une. Le document se
    tire aussi à blanc — c'est utile pour relire la mise en page avant
    d'envoyer quoi que ce soit.
  */
  let seller: { name: string; handle: string; email: string | null } | null = null;

  if (query.seller) {
    const sellers = await fetchSellers();

    if (sellers.ok) {
      const found = sellers.data.find((item) => item.id === query.seller);

      if (found) {
        seller = { name: found.name, handle: found.handle, email: found.email };
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------------------ */}
      {/* La barre d'outils. Elle ne s'imprime pas.                    */}
      {/* ------------------------------------------------------------ */}
      <div className="mache-no-print flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#d5d9d9] bg-white p-4">
        <div>
          <p className="text-md font-bold text-[#0f1111]">
            Document prêt à imprimer
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[#565959]">
            Imprimez cette page, ou choisissez « Enregistrer au format PDF »
            dans la boîte d&apos;impression. Le fichier obtenu s&apos;envoie à
            Adobe, DocuSign ou tout autre service de signature.
          </p>
        </div>

        <Link
          href={`/dashboard/admin/contrats/${contract.id}`}
          className="shrink-0 rounded-[3px] border border-[#8d9096] bg-white px-3 py-1.5 text-sm font-medium text-[#0f1111] hover:bg-[#f7f8f8]"
        >
          Retour au contrat
        </Link>
      </div>

      {contract.status === "draft" && (
        <div className="mache-no-print">
          <Notice tone="warning" title="Ce contrat est encore un brouillon">
            Son texte peut encore changer, et il n&apos;a donc pas
            d&apos;empreinte. Un document tiré maintenant ne pourrait pas être
            rattaché à une version figée. Publiez-le avant de le faire signer.
          </Notice>
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* Le document lui-même.                                        */}
      {/* ------------------------------------------------------------ */}
      <article className="mache-print mx-auto max-w-[820px] rounded-[10px] border border-[#d5d9d9] bg-white p-8 text-[#0f1111] sm:p-12">
        {/* En-tête */}
        <header className="mache-print-keep border-b-2 border-black pb-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-xl font-black tracking-widest">MACHÉ</p>
            <p className="text-xs">Place de marché haïtienne</p>
          </div>
        </header>

        {/* Titre */}
        <div className="mache-print-keep mt-8 text-center">
          <h1 className="text-2xl font-black uppercase tracking-wide">
            {contract.title}
          </h1>
          <p className="mt-2 text-sm">
            Version {contract.version}
            {contract.publishedAt
              ? ` — établie le ${formatDate(contract.publishedAt)}`
              : " — brouillon"}
          </p>
        </div>

        {/* Les parties */}
        <section className="mache-print-keep mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide">
            Entre les soussignés
          </h2>

          <div className="mt-3 space-y-3 text-sm leading-relaxed">
            <p>
              <strong>MACHÉ</strong>, place de marché en ligne, ci-après
              désignée « MACHÉ »,
            </p>

            <p className="text-center text-xs">d&apos;une part,</p>

            {/*
              Le nom de la boutique est recopié tel qu'il est enregistré.
              Les autres mentions — forme juridique, siège, immatriculation
              — sont laissées à remplir : MACHÉ ne les détient pas, et les
              inventer sur un contrat serait plus grave que partout ailleurs.
            */}
            {seller ? (
              <p>
                <strong>{seller.name}</strong>
                {seller.email ? ` (${seller.email})` : ""}, boutique enregistrée
                sur MACHÉ sous la référence{" "}
                <span className="font-mono">{seller.handle}</span>, ci-après
                désignée « le Marchand »,
              </p>
            ) : (
              <p>
                <span className="inline-block min-w-[280px] border-b border-black/60" />
                , boutique enregistrée sur MACHÉ, ci-après désignée « le
                Marchand »,
              </p>
            )}

            <p className="text-center text-xs">d&apos;autre part.</p>
          </div>

          {/*
            À compléter à la main ou par le service de signature. Ces
            informations n'existent pas dans MACHÉ : les laisser en blanc
            est la seule option honnête.
          */}
          <dl className="mt-4 space-y-3 text-sm">
            {[
              "Forme juridique et siège du Marchand",
              "Numéro d'immatriculation",
              "Représenté par (nom et qualité)",
            ].map((label) => (
              <div key={label}>
                <dt className="text-xs text-[#565959]">{label}</dt>
                <dd className="mt-3 border-b border-black/60" />
              </div>
            ))}
          </dl>
        </section>

        {/* Objet */}
        {contract.summary && (
          <section className="mache-print-keep mt-8">
            <h2 className="text-sm font-bold uppercase tracking-wide">Objet</h2>
            <p className="mt-2 text-sm leading-relaxed">{contract.summary}</p>
          </section>
        )}

        {/* Le texte */}
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide">
            Il a été convenu ce qui suit
          </h2>

          {/*
            `whitespace-pre-wrap` : les alinéas et les sauts de ligne sont
            rendus tels qu'ils ont été écrits. Un contrat reformaté à
            l'affichage n'est plus le document dont on calcule l'empreinte.
          */}
          <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
            {contract.body}
          </div>
        </section>

        {/* L'empreinte */}
        <section className="mache-print-keep mt-10 border-t border-black/30 pt-4">
          <h2 className="text-xs font-bold uppercase tracking-wide">
            Référence d&apos;intégrité
          </h2>

          <p className="mt-2 text-xs leading-relaxed">
            Empreinte numérique du texte ci-dessus (SHA-256) :
          </p>

          <p className="mt-1 break-all font-mono text-xs">
            {contract.contentHash ?? "— (brouillon non publié)"}
          </p>

          <p className="mt-2 text-xs leading-relaxed">
            Cette empreinte identifie le texte de façon unique. Recalculée
            sur le texte conservé par MACHÉ, elle doit être identique à
            celle-ci. Toute modification, fût-elle d&apos;un seul caractère,
            produirait une empreinte différente.
          </p>
        </section>

        {/* Signatures */}
        <section className="mache-print-keep mt-10">
          <h2 className="text-sm font-bold uppercase tracking-wide">
            Signatures
          </h2>

          <p className="mt-2 text-xs leading-relaxed">
            Fait en deux exemplaires originaux.
          </p>

          <div className="mt-6 flex flex-col gap-10 sm:flex-row sm:gap-12">
            <SignatureBlock role="Pour MACHÉ" subtitle="Représentant habilité" />
            <SignatureBlock
              role="Pour le Marchand"
              subtitle={seller ? seller.name : "Nom de la boutique"}
            />
          </div>
        </section>

        <footer className="mache-print-keep mt-10 border-t border-black/30 pt-3 text-2xs leading-relaxed text-[#565959]">
          Document établi par MACHÉ. Contrat n° {contract.displayId}, version{" "}
          {contract.version}.
        </footer>
      </article>
    </div>
  );
}
