/*
  PAGE : personnaliser sa vitrine

  Le seul écran vendeur resté dans MACHÉ, parce que c'est le seul qui
  n'existe pas dans le panneau Mercur : composer la page publique de sa
  boutique. Tout le reste du métier vendeur — produits, stock, commandes,
  versements — se fait là-bas, et rien ici ne le double.

  L'éditeur écrit le format de Puck. Le jour où l'éditeur visuel par
  glisser-déposer sera installé, il lira et écrira exactement les mêmes
  données : aucune reprise ne sera nécessaire.
*/

import Link from "next/link";
import { getVendorSeller } from "@/lib/medusa/vendor";
import { medusaBackendUrl } from "@/lib/medusa/config";
import {
  parseLayout, BLOCK_CATALOG, blockDefinition, type BlockField,
} from "@/lib/storefront/blocks";
import {
  vendorLoginAction, vendorLogoutAction, addBlockAction,
  removeBlockAction, moveBlockAction, updateBlockAction,
} from "./actions";

export const dynamic = "force-dynamic";

const input =
  "mt-1 w-full rounded-[6px] border border-[var(--mache-line)] bg-white px-3 py-2 text-base outline-none focus:border-[var(--mache-primary)]";

const label = "text-sm font-semibold text-[var(--mache-text)]";

export default async function VitrinePage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  const query = searchParams ? await searchParams : {};
  const backendUrl = medusaBackendUrl();
  const seller = await getVendorSeller();

  /* ------------------------------------------------------------------ */
  /* Non connecté                                                       */
  /* ------------------------------------------------------------------ */
  if (!seller) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--mache-text)]">
          Personnaliser ma vitrine
        </h1>
        <p className="mt-2 text-base leading-relaxed text-[var(--mache-muted)]">
          Connectez-vous avec le compte de votre panneau vendeur.
        </p>

        {query.error && (
          <div className="mt-4 rounded-[8px] border border-[#f2c2c8] bg-[#fdeaec] px-4 py-3 text-base text-[#b01124]">
            {decodeURIComponent(query.error)}
          </div>
        )}

        <form action={vendorLoginAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className={label}>Adresse e-mail</label>
            <input id="email" name="email" type="email" required autoComplete="email" className={input} />
          </div>

          <div>
            <label htmlFor="password" className={label}>Mot de passe</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" className={input} />
          </div>

          <div>
            <label htmlFor="store_handle" className={label}>Adresse de votre boutique</label>
            <input id="store_handle" name="store_handle" required placeholder="ma-boutique" className={input} />
            <p className="mt-1 text-xs text-[var(--mache-muted)]">
              La partie après <code>/store/</code> dans l&apos;adresse de votre
              vitrine. Elle est demandée parce que l&apos;API vendeur ne permet
              pas de retrouver vos boutiques sans elle ; votre appartenance est
              vérifiée par le serveur.
            </p>
          </div>

          <button
            type="submit"
            className="w-full rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
          >
            Se connecter
          </button>
        </form>

        <p className="mt-5 text-sm text-[var(--mache-muted)]">
          Pas encore de boutique ?{" "}
          {backendUrl ? (
            <a href={`${backendUrl}/seller`} className="font-semibold text-[var(--mache-primary)] hover:underline">
              Créez-la dans le panneau vendeur
            </a>
          ) : (
            "Créez-la dans le panneau vendeur."
          )}
        </p>
      </main>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Éditeur                                                            */
  /* ------------------------------------------------------------------ */
  const { layout, isCustom } = parseLayout(seller.metadata, seller.name);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--mache-line)] pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--mache-text)]">
            Ma vitrine
          </h1>
          <p className="mt-1 text-base text-[var(--mache-muted)]">
            {seller.name} · <Link href={`/store/${seller.handle}`} className="text-[var(--mache-primary)] hover:underline">voir la page publique</Link>
            {!isCustom && " · présentation par défaut"}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/seller/vitrine/editeur"
            className="rounded-[6px] bg-[var(--mache-text)] px-4 py-2 text-base font-bold text-white transition-colors hover:bg-black"
          >
            Éditeur visuel
          </Link>

          <form action={vendorLogoutAction}>
            <button type="submit" className="text-sm text-[var(--mache-muted)] hover:underline">
              Se déconnecter
            </button>
          </form>
        </div>
      </div>

      {seller.status !== "active" && (
        <div className="mt-4 rounded-[8px] border border-[#f3d9a5] bg-[#fdf6e8] px-4 py-3 text-base leading-relaxed text-[var(--mache-muted)]">
          Votre boutique est au statut «&nbsp;{seller.status}&nbsp;». Vous pouvez
          préparer votre vitrine dès maintenant ; elle sera visible du public une
          fois la boutique approuvée par MACHÉ.
        </div>
      )}

      {query.error && (
        <div className="mt-4 rounded-[8px] border border-[#f2c2c8] bg-[#fdeaec] px-4 py-3 text-base text-[#b01124]">
          {decodeURIComponent(query.error)}
        </div>
      )}

      {query.success && (
        <div className="mt-4 rounded-[8px] border border-[#b7dfc9] bg-[#f4fbf7] px-4 py-3 text-base text-[#046c4e]">
          {decodeURIComponent(query.success)}
        </div>
      )}

      {/* Blocs */}
      <div className="mt-6 space-y-3">
        {layout.content.map((block, index) => {
          const meta = blockDefinition(block.type);
          const fields: BlockField[] = meta?.fields ?? [];

          return (
            <section
              key={`${block.type}-${index}`}
              className="rounded-[10px] border border-[var(--mache-line)] bg-white"
            >
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--mache-line)] px-4 py-2.5">
                <div>
                  <p className="text-base font-bold text-[var(--mache-text)]">
                    {index + 1}. {meta?.label ?? block.type}
                  </p>
                  {meta && (
                    <p className="mt-0.5 text-xs text-[var(--mache-muted)]">
                      {meta.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <form action={moveBlockAction}>
                    <input type="hidden" name="index" value={index} />
                    <input type="hidden" name="direction" value="up" />
                    <button
                      type="submit"
                      disabled={index === 0}
                      aria-label="Monter ce bloc"
                      className="rounded-[4px] border border-[var(--mache-line)] px-2 py-1 text-sm disabled:opacity-35"
                    >
                      ↑
                    </button>
                  </form>

                  <form action={moveBlockAction}>
                    <input type="hidden" name="index" value={index} />
                    <input type="hidden" name="direction" value="down" />
                    <button
                      type="submit"
                      disabled={index === layout.content.length - 1}
                      aria-label="Descendre ce bloc"
                      className="rounded-[4px] border border-[var(--mache-line)] px-2 py-1 text-sm disabled:opacity-35"
                    >
                      ↓
                    </button>
                  </form>

                  <form action={removeBlockAction}>
                    <input type="hidden" name="index" value={index} />
                    <button
                      type="submit"
                      className="rounded-[4px] border border-[var(--mache-line)] px-2 py-1 text-sm text-[var(--mache-danger)]"
                    >
                      Retirer
                    </button>
                  </form>
                </div>
              </header>

              <form action={updateBlockAction} className="space-y-3 p-4">
                <input type="hidden" name="index" value={index} />

                {fields.map((field) => {
                  const value = block.props[field.name];
                  const defaultValue =
                    field.kind === "faq"
                      ? Array.isArray(value)
                        ? JSON.stringify(value, null, 1)
                        : ""
                      : value === undefined || value === null
                        ? ""
                        : String(value);

                  return (
                    <div key={field.name}>
                      <label htmlFor={`b${index}-${field.name}`} className={label}>
                        {field.label}
                      </label>

                      {field.kind === "textarea" || field.kind === "faq" ? (
                        <textarea
                          id={`b${index}-${field.name}`}
                          name={`prop_${field.name}`}
                          rows={field.kind === "faq" ? 5 : 3}
                          defaultValue={defaultValue}
                          className={input}
                        />
                      ) : field.kind === "select" ? (
                        <select
                          id={`b${index}-${field.name}`}
                          name={`prop_${field.name}`}
                          defaultValue={defaultValue}
                          className={input}
                        >
                          {(field.options ?? []).map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={`b${index}-${field.name}`}
                          name={`prop_${field.name}`}
                          type={
                            field.kind === "number"
                              ? "number"
                              : field.kind === "date"
                                ? "date"
                                : "text"
                          }
                          min={field.min}
                          max={field.max}
                          defaultValue={defaultValue}
                          className={input}
                        />
                      )}

                      {field.kind === "faq" && !field.hint && (
                        <p className="mt-1 text-xs leading-snug text-[var(--mache-muted)]">
                          Format JSON : [&#123;&quot;question&quot;:&quot;…&quot;,&quot;answer&quot;:&quot;…&quot;&#125;]
                        </p>
                      )}

                      {field.hint && (
                        <p className="mt-1 text-xs leading-snug text-[var(--mache-muted)]">
                          {field.hint}
                        </p>
                      )}
                    </div>
                  );
                })}

                <button
                  type="submit"
                  className="rounded-[6px] bg-[var(--mache-text)] px-4 py-2 text-base font-bold text-white hover:bg-black"
                >
                  Enregistrer ce bloc
                </button>
              </form>
            </section>
          );
        })}
      </div>

      {/* Ajouter */}
      <section className="mt-6 rounded-[10px] border border-dashed border-[var(--mache-line)] bg-[var(--mache-bg)] p-4">
        <h2 className="text-md font-bold text-[var(--mache-text)]">
          Ajouter un bloc
        </h2>

        <div className="mt-3 flex flex-wrap gap-2">
          {BLOCK_CATALOG.map((entry) => (
            <form key={entry.type} action={addBlockAction}>
              <input type="hidden" name="type" value={entry.type} />
              <button
                type="submit"
                title={entry.description}
                className="rounded-[6px] border border-[var(--mache-line)] bg-white px-3 py-2 text-sm font-medium text-[var(--mache-text)] hover:border-[var(--mache-primary)] hover:text-[var(--mache-primary)]"
              >
                + {entry.label}
              </button>
            </form>
          ))}
        </div>
      </section>

      <p className="mt-6 text-xs leading-relaxed text-[var(--mache-muted)]">
        Cet éditeur fonctionne sans JavaScript et sur une connexion lente :
        chaque bloc s&apos;enregistre seul. L&apos;éditeur visuel, lui, montre
        la page telle qu&apos;elle sera. Les deux écrivent les mêmes données,
        vous pouvez passer de l&apos;un à l&apos;autre.
      </p>
    </main>
  );
}
