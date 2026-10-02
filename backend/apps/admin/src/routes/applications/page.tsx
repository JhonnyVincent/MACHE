/* PAGE : les applications que les vendeurs voudraient relier à leur boutique. */
import { Empty, Loading, Muted, Page, Panel, List, Row, useLoad } from "../../lib/kit";

export const config = { label: "Applications demandées", rank: 8, nested: "/mache" };

const NAMES: Record<string, string> = {
  shopify: "Shopify",
  woocommerce: "WooCommerce",
  alibaba: "Alibaba.com",
  aliexpress: "AliExpress",
  cjdropshipping: "CJ Dropshipping",
  syncee: "Syncee",
  spocket: "Spocket",
  printful: "Printful / Printify",
  transporteurs: "Transporteurs",
  analytics: "Google Analytics",
  seo: "Référencement (SEO)",
};

type Data = { apps?: { app: string; count: number; sellers: { name: string }[] }[] };

export default function AppsPage() {
  const { data, error, loading } = useLoad<Data>("/admin/mache/apps");
  const apps = data?.apps ?? [];

  return (
    <Page title="Applications demandées" subtitle="Les outils que les vendeurs voudraient relier à leur boutique, du plus demandé au moins demandé.">
      <Loading error={error} loading={loading} />
      {data && (apps.length === 0 ? (
        <Empty title="Aucune demande pour l'instant." />
      ) : (
        <Panel>
          <List>
            {apps.map((entry) => (
              <Row key={entry.app}>
                <strong>{NAMES[entry.app] ?? entry.app}</strong> <Muted>· {entry.count} boutique{entry.count > 1 ? "s" : ""}</Muted>
                <div style={{ marginTop: 4 }}><Muted>{entry.sellers.map((seller) => seller.name).join(", ")}</Muted></div>
              </Row>
            ))}
          </List>
        </Panel>
      ))}
    </Page>
  );
}
