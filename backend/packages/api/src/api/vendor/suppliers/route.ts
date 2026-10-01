/*
  ROUTE : l'annuaire des fournisseurs, pour le panneau vendeur.

  Un vendeur — particulier, boutique, marque ou grossiste — qui cherche
  de quoi revendre trouve ici les grossistes et les marques de MACHE.
  Le même annuaire existe sur le site (« Trouver un fournisseur ») ; cette
  route le sert au panneau, où le vendeur travaille.

  Réservée à un vendeur connecté (Mercur refuse l'accès sans session
  vendeur). Le PROFIL est une déclaration du vendeur, pas un contrôle de
  MACHE : l'écran le dit.

  Ne renvoie que les boutiques ouvertes, et jamais la boutique du
  vendeur qui demande : on ne se cherche pas soi-même comme fournisseur.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { storefrontBase } from "../../../lib/password-reset-email";

type Raw = Record<string, unknown>;

const SUPPLIER_PROFILES = ["fournisseur", "marque"] as const;

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const me = (req as unknown as { seller_context?: { seller_id?: string } }).seller_context?.seller_id;

  if (!me) return res.status(401).json({ message: "Boutique non identifiée." });

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (args: unknown) => Promise<{ data: unknown }>;
  };

  const { data } = await query.graph({
    entity: "seller",
    fields: ["id", "name", "handle", "description", "logo", "status", "metadata"],
    pagination: { take: 500 },
  });

  const base = storefrontBase();

  const suppliers = ((data ?? []) as Raw[])
    .filter((seller) => seller.id !== me && seller.status === "open")
    .map((seller) => {
      const metadata = (seller.metadata as Raw | null) ?? {};
      const profile = typeof metadata.profile === "string" ? metadata.profile : null;

      return { seller, profile, minimum: Math.max(0, Math.floor(Number(metadata.min_order)) || 0) };
    })
    .filter((entry) => (SUPPLIER_PROFILES as readonly string[]).includes(entry.profile ?? ""))
    .map(({ seller, profile, minimum }) => ({
      id: String(seller.id),
      name: String(seller.name ?? ""),
      handle: String(seller.handle ?? ""),
      description: typeof seller.description === "string" ? seller.description : null,
      logo: typeof seller.logo === "string" ? seller.logo : null,
      profile,
      minimum_order: minimum > 0 ? minimum : null,
      url: base && seller.handle ? `${base}/store/${encodeURIComponent(String(seller.handle))}` : null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));

  return res.json({ suppliers, storefront_url: base });
}
