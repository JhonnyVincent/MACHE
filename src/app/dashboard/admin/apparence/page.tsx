/*
  PAGE : l'habillage du site.

  Ce qu'elle permet : activer Noël, Octobre rose, la Saint-Valentin, la
  Fête du Drapeau, ou revenir aux couleurs de MACHÉ.

  Ce qu'elle ne permet pas, et pourquoi

  Choisir une couleur librement. Deux raisons, et la première n'est pas
  la sécurité :

  1. La lisibilité. Une couleur saisie à la main finit posée sur du
     texte blanc, et on ne s'en aperçoit pas depuis cet écran — on y
     voit une pastille, pas une page. Chaque thème proposé a été relu en
     entier.
  2. L'injection. Ces valeurs sont recopiées dans des variables CSS
     servies à tous les visiteurs.

  L'aperçu affiché n'est pas une capture

  Les pastilles montrent les couleurs réelles du thème, reçues du
  backend. Une maquette dessinée ici pourrait mentir sur le résultat ;
  celles-ci ne le peuvent pas, puisqu'elles viennent de la même source
  que ce qui sera servi.

  Aucun thème ne s'active tout seul

  Il n'y a pas de calendrier. Un site qui change d'apparence sans que
  personne ne l'ait décidé est un site dont on ne sait plus qui l'a
  changé.
*/

import { redirect } from "next/navigation";
import { getAdminUser, fetchThemes } from "@/lib/medusa/admin";
import { PageHeader, Panel, Notice } from "@/components/seller/ui";
import { SubmitButton } from "@/components/submit-button";
import { setThemeAction } from "./actions";

export const dynamic = "force-dynamic";

/* L'ordre d'affichage des pastilles : du plus visible au plus discret. */
const SWATCH_ORDER = [
  "--mache-primary",
  "--mache-primary-strong",
  "--mache-primary-dark",
  "--mache-primary-soft",
  "--mache-bg-2",
  "--mache-line",
];

export default async function AdminAppearancePage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  const query = searchParams ? await searchParams : {};

  const result = await fetchThemes();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Apparence du site"
        subtitle="L'habillage saisonnier, visible par tous les visiteurs."
      />

      {query.success && (
        <Notice tone="info" title="C'est appliqué">
          {query.success}
        </Notice>
      )}
      {query.error && (
        <Notice tone="danger" title="Ça n'a pas marché">
          {query.error}
        </Notice>
      )}

      {!result.ok ? (
        <Notice tone="danger" title="Les habillages ne s'affichent pas">
          {result.reason}
        </Notice>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            {result.data.themes.map((theme) => {
              const active = theme.key === result.data.active;

              const swatches = SWATCH_ORDER.filter(
                (name) => theme.variables[name]
              );

              return (
                <div
                  key={theme.key}
                  className={`rounded-[10px] border bg-white p-5 ${
                    active ? "border-2 border-[#046c4e]" : "border-[#d5d9d9]"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-lg font-bold text-[#0f1111]">{theme.label}</h3>

                    {active && (
                      <span className="rounded-[3px] bg-[#eefaf3] px-2 py-0.5 text-2xs font-bold uppercase tracking-wide text-[#046c4e]">
                        Actif
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-[#565959]">
                    {theme.description}
                  </p>

                  {/*
                    Les couleurs réelles du thème. Elles sont posées en
                    style inline plutôt qu'en classe : leurs valeurs ne
                    sont connues qu'à l'exécution, et Tailwind ne génère
                    que les classes qu'il voit écrites.
                  */}
                  {swatches.length > 0 ? (
                    <div className="mt-4 flex gap-1.5">
                      {swatches.map((name) => (
                        <span
                          key={name}
                          title={`${name} — ${theme.variables[name]}`}
                          className="h-8 w-8 rounded-[4px] border border-[#d5d9d9]"
                          style={{ backgroundColor: theme.variables[name] }}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-[#767676]">
                      Les couleurs habituelles de MACHÉ, inchangées.
                    </p>
                  )}

                  {theme.banner ? (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-label text-[#767676]">
                        Bandeau affiché en haut du site
                      </p>
                      <p
                        className="mt-1.5 rounded-[4px] px-3 py-1.5 text-center text-sm font-semibold text-white"
                        style={{
                          backgroundColor:
                            theme.variables["--mache-primary"] ?? "#e41d39",
                        }}
                      >
                        {theme.banner}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-[#767676]">Aucun bandeau.</p>
                  )}

                  {!active && (
                    <form action={setThemeAction} className="mt-4">
                      <input type="hidden" name="theme" value={theme.key} />
                      <SubmitButton pendingLabel="Application…">
                        Activer {theme.label}
                      </SubmitButton>
                    </form>
                  )}
                </div>
              );
            })}
          </div>

          <Panel
            title="Ce que ce réglage ne fait pas"
            description="Pour éviter une mauvaise surprise."
          >
            <ul className="space-y-2 text-sm leading-relaxed text-[#565959]">
              <li>
                <strong className="text-[#0f1111]">Rien ne s&apos;active tout seul.</strong>{" "}
                Il n&apos;y a pas de calendrier : Noël ne s&apos;allumera pas le
                1<sup>er</sup> décembre, et Octobre rose ne s&apos;éteindra pas le
                31 octobre. C&apos;est à vous d&apos;activer et de désactiver.
              </li>
              <li>
                <strong className="text-[#0f1111]">Aucune couleur libre.</strong>{" "}
                Une couleur choisie à la main ne se vérifie pas depuis cet écran :
                on y voit une pastille, pas une page. Chaque habillage proposé a
                été relu en entier — contraste du texte, des boutons, des bordures.
                Pour en ajouter un, il faut passer par le code.
              </li>
              <li>
                <strong className="text-[#0f1111]">Le changement met jusqu&apos;à
                cinq minutes</strong> à toucher tous les visiteurs : les pages
                servies juste avant gardent l&apos;ancien habillage le temps que
                leur cache expire.
              </li>
            </ul>
          </Panel>
        </>
      )}
    </div>
  );
}
