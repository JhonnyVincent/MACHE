/*
  PAGE VENDEUR : « Applications ».

  Un espace pour les outils que MACHE ajoutera au fil du temps
  (statistiques, référencement, livraison…). Chaque carte dit son état :
  « Bientôt » tant que l'outil n'est pas là, « Disponible » avec un lien
  quand il l'est. Rien n'est présenté comme disponible s'il ne l'est pas :
  pour ajouter un outil, on change `status` et `href` dans la liste.
*/

export const config = {
  label: "Applications",
  rank: 10,
};

type App = {
  name: string;
  text: string;
  group: string;
  status: "soon" | "available";
  href?: string;
};

const APPS: App[] = [
  { group: "Statistiques", name: "Google Analytics", text: "Voir d'où viennent vos visiteurs.", status: "soon" },
  { group: "Visibilité", name: "Référencement (SEO)", text: "Mieux apparaître sur Google.", status: "soon" },
  { group: "Livraison", name: "Transporteurs", text: "Expédier avec un transporteur, depuis vos commandes.", status: "soon" },
];

const GROUPS = Array.from(new Set(APPS.map((app) => app.group)));

const ApplicationsPage = () => (
  <div style={{ background: "#f9f7f4", minHeight: "100vh", color: "#111827" }}>
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 48px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Applications</h1>
      <p style={{ marginTop: 8, fontSize: 15, color: "#4b5563" }}>
        Des outils pour mieux vendre. MACHE en ajoutera ici au fur et à mesure.
      </p>

      {GROUPS.map((group) => (
        <section key={group} style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 10px" }}>{group}</h2>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            {APPS.filter((app) => app.group === group).map((app) => (
              <div key={app.name} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px", background: "#ffffff" }}>
                <p style={{ margin: 0, fontWeight: 800 }}>{app.name}</p>
                <p style={{ margin: "4px 0 10px", fontSize: 14, color: "#4b5563" }}>{app.text}</p>
                {app.status === "available" && app.href ? (
                  <a href={app.href} style={{ color: "#d41834", fontWeight: 700, textDecoration: "none" }}>Ouvrir →</a>
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", background: "#f3f4f6", borderRadius: 999, padding: "3px 10px" }}>Bientôt</span>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  </div>
);

export default ApplicationsPage;
