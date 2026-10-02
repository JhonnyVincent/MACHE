/*
  PAGE : l'habillage du site (couleurs de fête), avec le mode automatique.

  Même règle qu'avant : l'administrateur choisit une clé dans une liste
  fermée, jamais une couleur libre. Le site met jusqu'à cinq minutes à
  refléter un changement.
*/
import { useState } from "react";
import { Badge, Btn, Feedback, Flex, Grid, Loading, Muted, Notice, Page, Panel, api, useAction, useLoad } from "../../lib/kit";

export const config = { label: "Apparence du site", rank: 13, nested: "/mache" };

type Theme = { key: string; label: string; description: string; banner: string | null; variables: Record<string, string> };
type Data = {
  mode: "auto" | "manual";
  today: string;
  active: string;
  calendar: { key: string; label: string; from: string; to: string }[];
  themes: Theme[];
};

const SWATCH = ["--mache-primary", "--mache-primary-strong", "--mache-primary-dark", "--mache-primary-soft", "--mache-bg-2", "--mache-line"];

export default function AppearancePage() {
  const { data, error, loading, reload } = useLoad<Data>("/admin/mache/theme");
  const action = useAction();
  const [pending, setPending] = useState<string | null>(null);

  const choose = async (key: string, success: string) => {
    setPending(key);
    if (await action.run(() => api("/admin/mache/theme", { method: "POST", body: { theme: key } }), success)) reload();
    setPending(null);
  };

  return (
    <Page title="Apparence du site" subtitle="L'habillage saisonnier, visible par tous les visiteurs.">
      <Feedback message={action.message} />
      <Loading error={error} loading={loading} />
      {data && (
        <>
          <Panel
            title="Calendrier automatique"
            description={
              data.mode === "auto"
                ? "Mode automatique actif : le site se met aux couleurs de la fête en cours, et revient à MACHE entre deux fêtes."
                : "Mode manuel : l'habillage ne change que si vous le changez. Activez l'automatique pour suivre ce calendrier."
            }
          >
            <div style={{ marginBottom: 14 }}>
              {data.mode === "auto" ? (
                <Btn variant="secondary" disabled={!!pending} onClick={() => choose("default", "Retour au manuel (couleurs MACHE).")}>
                  Revenir au manuel (couleurs MACHE)
                </Btn>
              ) : (
                <Btn disabled={!!pending} onClick={() => choose("auto", "Mode automatique activé.")}>Activer le mode automatique</Btn>
              )}
            </div>
            <Grid>
              {data.calendar.map((w) => (
                <Flex key={w.key} between>
                  <strong style={{ fontSize: 14 }}>{w.label}</strong>
                  <Muted>{w.from === w.to ? w.from : `${w.from} → ${w.to}`}</Muted>
                </Flex>
              ))}
            </Grid>
            <p style={{ marginTop: 12 }}>
              <Muted>
                Dates de la fête des mères et des pères : à vérifier pour Haïti avant le lancement (règle utilisée : dernier dimanche de mai et
                troisième dimanche de juin).
              </Muted>
            </p>
          </Panel>

          <Grid>
            {data.themes.map((theme) => {
              const active = data.mode === "manual" && theme.key === data.active;
              const swatches = SWATCH.filter((name) => theme.variables[name]);

              return (
                <Panel key={theme.key}>
                  <Flex between>
                    <h3 style={{ margin: 0, fontSize: 17 }}>{theme.label}</h3>
                    {active && <Badge tone="ok">Actif</Badge>}
                  </Flex>
                  <p style={{ fontSize: 14, color: "var(--fg-subtle)" }}>{theme.description}</p>
                  {swatches.length > 0 ? (
                    <div style={{ display: "flex", gap: 6, margin: "10px 0" }}>
                      {swatches.map((name) => (
                        <span key={name} title={`${name} — ${theme.variables[name]}`} style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid var(--border-base)", background: theme.variables[name] }} />
                      ))}
                    </div>
                  ) : (
                    <Muted>Les couleurs habituelles de MACHE, inchangées.</Muted>
                  )}
                  {theme.banner ? (
                    <p style={{ background: theme.variables["--mache-primary"] ?? "#d41834", color: "#fff", textAlign: "center", borderRadius: 6, padding: "6px 10px", fontSize: 14, fontWeight: 600 }}>{theme.banner}</p>
                  ) : (
                    <Muted>Aucun bandeau.</Muted>
                  )}
                  {!active && (
                    <div style={{ marginTop: 10 }}>
                      <Btn variant="secondary" disabled={!!pending} onClick={() => choose(theme.key, `Habillage « ${theme.label} » appliqué.`)}>
                        Activer {theme.label}
                      </Btn>
                    </div>
                  )}
                </Panel>
              );
            })}
          </Grid>

          <Notice tone="neutral" title="À savoir">
            Aucune couleur libre : chaque habillage a été relu en entier (contraste du texte, des boutons). Choisir un habillage ici repasse en
            manuel. Le changement met jusqu&apos;à cinq minutes à toucher tous les visiteurs.
          </Notice>
        </>
      )}
    </Page>
  );
}
