/*
  PAGE : la sécurité du compte d'administration.

  Ce que ce compte commande : l'approbation des boutiques, le chiffre
  d'affaires, l'apparence du site pour tous les visiteurs. Un mot de
  passe seul, pour cela, est peu.

  Pourquoi une application d'authentification et pas un SMS

  D'abord parce que MACHÉ n'a ni fournisseur d'e-mail ni passerelle
  SMS : ce serait impossible aujourd'hui. Mais c'est aussi le meilleur
  des trois — un SMS s'intercepte par détournement de carte SIM, et une
  boîte e-mail compromise livrerait les codes avec le reste.

  Les codes de secours ne sont pas un supplément

  Sans fournisseur d'e-mail, MACHÉ n'a AUCUN moyen de réinitialiser quoi
  que ce soit. Un téléphone perdu sans codes de secours ferme
  l'administration définitivement. La page insiste là-dessus au moment
  où ils s'affichent, parce que c'est le seul moment où on peut les
  noter.

  La limite est écrite sur la page, pas seulement dans ce commentaire

  Ce second facteur protège les écrans MACHÉ. Il ne protège pas le
  panneau Medusa servi par le backend. Taire cette limite donnerait un
  sentiment de sécurité plus dangereux que pas de protection du tout,
  parce qu'on cesserait de se méfier.
*/

import { redirect } from "next/navigation";
import { getAdminUser, fetchTwoFactor } from "@/lib/medusa/admin";
import { PageHeader, Panel, Notice, Field, Input } from "@/components/seller/ui";
import { SubmitButton } from "@/components/submit-button";
import {
  startTwoFactorAction,
  confirmTwoFactorAction,
  disableTwoFactorAction,
} from "./actions";

export const dynamic = "force-dynamic";

/* Le secret se recopie à la main : par groupes de quatre, on se perd moins. */
function grouped(secret: string): string {
  return (secret.match(/.{1,4}/g) ?? []).join(" ");
}

export default async function AdminSecurityPage({
  searchParams,
}: {
  searchParams?: Promise<{
    secret?: string;
    uri?: string;
    codes?: string;
    success?: string;
    error?: string;
  }>;
}) {
  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  const query = searchParams ? await searchParams : {};

  const state = await fetchTwoFactor();

  const enrolling = Boolean(query.secret);

  const codes = query.codes ? query.codes.split(",").filter(Boolean) : [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sécurité du compte"
        subtitle={user.email}
      />

      {query.success && (
        <Notice tone="info" title="C'est fait">
          {query.success}
        </Notice>
      )}
      {query.error && (
        <Notice tone="danger" title="Ça n'a pas marché">
          {query.error}
        </Notice>
      )}

      {/* ------------------------------------------------------------ */}
      {/* Les codes de secours, affichés une seule fois                */}
      {/* ------------------------------------------------------------ */}
      {codes.length > 0 && (
        <div className="rounded-[10px] border-2 border-[#b01124] bg-white p-5">
          <h2 className="text-xl font-black text-[#b01124]">
            Notez ces codes maintenant
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-[#0f1111]">
            Ils ne seront <strong>plus jamais affichés</strong>. MACHÉ n&apos;a
            pas de service d&apos;envoi d&apos;e-mails : si vous perdez votre
            téléphone sans ces codes, personne ne pourra vous rouvrir
            l&apos;administration. Écrivez-les sur papier, rangez-les ailleurs
            que sur ce téléphone.
          </p>

          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {codes.map((code) => (
              <li
                key={code}
                className="rounded-[4px] border border-[#d5d9d9] bg-[#f7f8f8] px-2 py-1.5 text-center font-mono text-sm tracking-wide"
              >
                {code}
              </li>
            ))}
          </ul>

          <p className="mt-3 text-sm text-[#565959]">
            Chacun ne sert qu&apos;une fois. Quand il n&apos;en restera plus,
            revenez ici retirer puis réactiver la protection pour en obtenir de
            nouveaux.
          </p>
        </div>
      )}

      {!state.ok ? (
        <Notice tone="danger" title="L'état ne s'affiche pas">
          {state.reason}
        </Notice>
      ) : (
        <>
          {/* -------------------------------------------------------- */}
          {/* Inscription en cours                                     */}
          {/* -------------------------------------------------------- */}
          {enrolling && !state.data.enabled && (
            <Panel
              title="Étape 1 — ajoutez MACHÉ à votre application"
              description="Google Authenticator, Authy, Bitwarden, 1Password… toutes fonctionnent."
            >
              <p className="text-sm leading-relaxed text-[#565959]">
                Dans votre application, choisissez « ajouter un compte » puis
                « saisir une clé manuellement », et recopiez ceci :
              </p>

              <dl className="mt-4 space-y-3">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-label text-[#767676]">
                    Nom du compte
                  </dt>
                  <dd className="mt-1 font-mono text-sm text-[#0f1111]">
                    MACHE : {user.email}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-label text-[#767676]">
                    Clé
                  </dt>
                  <dd className="mt-1 select-all break-all rounded-[4px] border border-[#d5d9d9] bg-[#f7f8f8] px-3 py-2 font-mono text-md tracking-widest text-[#0f1111]">
                    {grouped(query.secret ?? "")}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-label text-[#767676]">
                    Type
                  </dt>
                  <dd className="mt-1 text-sm text-[#565959]">
                    Basé sur le temps — 6 chiffres, 30 secondes.
                  </dd>
                </div>
              </dl>

              {/*
                Pas de code QR : en générer un demanderait une
                bibliothèque de plus, et le faire fabriquer par un
                service en ligne enverrait la clé de l'administration à
                un tiers. La saisie manuelle est acceptée par toutes les
                applications citées.
              */}
              <p className="mt-4 text-xs leading-relaxed text-[#767676]">
                Il n&apos;y a pas de code QR : le faire fabriquer par un service
                extérieur reviendrait à lui envoyer la clé de
                l&apos;administration de MACHÉ.
              </p>

              <form action={confirmTwoFactorAction} className="mt-6 border-t border-[#d5d9d9] pt-5">
                <input type="hidden" name="secret" value={query.secret ?? ""} />
                <input type="hidden" name="uri" value={query.uri ?? ""} />

                <h3 className="text-md font-bold text-[#0f1111]">
                  Étape 2 — confirmez avec un code
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[#565959]">
                  Tant que ce code n&apos;est pas donné, rien n&apos;est activé.
                  C&apos;est ce qui évite de vous enfermer dehors si la clé a été
                  mal recopiée.
                </p>

                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <Field label="Code affiché par l'application">
                    <Input
                      name="code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={7}
                      placeholder="123456"
                      className="font-mono text-lg tracking-[0.3em]"
                    />
                  </Field>
                  <SubmitButton pendingLabel="Vérification…">Activer</SubmitButton>
                </div>
              </form>
            </Panel>
          )}

          {/* -------------------------------------------------------- */}
          {/* Actif                                                    */}
          {/* -------------------------------------------------------- */}
          {state.data.enabled && (
            <>
              <Panel
                title="Code à usage unique — actif"
                description={`${state.data.recoveryLeft} code${
                  state.data.recoveryLeft > 1 ? "s" : ""
                } de secours restant${state.data.recoveryLeft > 1 ? "s" : ""}.`}
              >
                <p className="text-sm leading-relaxed text-[#565959]">
                  À chaque connexion, votre mot de passe ne suffit plus : il
                  faut aussi les six chiffres de votre application.
                </p>

                {state.data.recoveryLeft === 0 && (
                  <div className="mt-3">
                    <Notice tone="danger" title="Plus aucun code de secours">
                      Si vous perdez votre téléphone maintenant, personne ne
                      pourra vous rouvrir l&apos;administration. Retirez la
                      protection puis réactivez-la pour obtenir une nouvelle
                      série.
                    </Notice>
                  </div>
                )}

                {state.data.locked && (
                  <div className="mt-3">
                    <Notice tone="warning" title="Verrouillé après trop d'erreurs">
                      Les codes de l&apos;application sont refusés jusqu&apos;à
                      ce qu&apos;un code de secours débloque le compte.
                    </Notice>
                  </div>
                )}
              </Panel>

              <Panel
                title="Retirer la protection"
                description="Un code valide est exigé — sinon quelqu'un qui aurait volé votre mot de passe n'aurait qu'à la couper."
              >
                <form action={disableTwoFactorAction} className="space-y-3">
                  <div className="flex flex-wrap items-end gap-2">
                    <Field label="Code de l'application">
                      <Input
                        name="code"
                        inputMode="numeric"
                        maxLength={7}
                        placeholder="123456"
                        className="font-mono tracking-widest"
                      />
                    </Field>
                    <Field label="ou code de secours">
                      <Input
                        name="recovery"
                        placeholder="XXXXX-XXXXX"
                        className="font-mono uppercase"
                      />
                    </Field>
                    <SubmitButton pendingLabel="Retrait…">Retirer</SubmitButton>
                  </div>
                </form>
              </Panel>
            </>
          )}

          {/* -------------------------------------------------------- */}
          {/* Inactif                                                  */}
          {/* -------------------------------------------------------- */}
          {!state.data.enabled && !enrolling && (
            <Panel
              title="Code à usage unique"
              description="Ce compte n'est protégé que par son mot de passe."
            >
              <p className="text-sm leading-relaxed text-[#565959]">
                Ce compte approuve les boutiques, lit le chiffre
                d&apos;affaires, et change l&apos;apparence du site pour tous
                les visiteurs. Un second facteur fait qu&apos;un mot de passe
                volé ne suffit plus.
              </p>

              <p className="mt-2 text-sm leading-relaxed text-[#565959]">
                Il vous faut une application d&apos;authentification sur votre
                téléphone : Google Authenticator, Authy, Bitwarden, 1Password.
                Aucune ne demande de compte payant, et elles fonctionnent sans
                réseau.
              </p>

              <form action={startTwoFactorAction} className="mt-4">
                <SubmitButton pendingLabel="Préparation…">
                  Activer la protection
                </SubmitButton>
              </form>
            </Panel>
          )}

          {/* -------------------------------------------------------- */}
          <Notice tone="warning" title="Ce que cette protection ne couvre pas">
            {state.data.scopeNote ||
              "Ce code protège les écrans MACHÉ. Le panneau d'administration servi par le backend reste accessible avec le mot de passe seul."}{" "}
            Gardez donc un mot de passe long et unique : le second facteur
            s&apos;ajoute à lui, il ne le remplace pas.
          </Notice>
        </>
      )}
    </div>
  );
}
