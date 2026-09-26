/*
  ROUTE : s'abonner aux nouvelles de MACHÉ.

  Où vont les adresses

  Dans une liste de contacts Brevo — le même service qui envoie déjà les
  liens « mot de passe oublié ». MACHÉ n'a pas à tenir sa propre base
  d'abonnés, ni à écrire un outil d'envoi : les lettres se composent et
  s'envoient depuis Brevo, qui gère aussi le désabonnement, obligatoire
  dans chaque envoi.

  La double confirmation

  Avec BREVO_DOI_TEMPLATE_ID, Brevo envoie d'abord un e-mail « confirmez
  votre inscription », et n'ajoute l'adresse à la liste qu'après le
  clic. C'est ce qui empêche d'inscrire l'adresse de quelqu'un d'autre —
  et c'est ce que les règles européennes attendent pour les abonnés de
  la diaspora. Sans ce modèle, l'adresse est ajoutée directement.

  Rien n'est promis de ce côté : sans BREVO_API_KEY ou sans
  BREVO_NEWSLETTER_LIST_ID, la route répond franchement que
  l'abonnement n'est pas ouvert, et le site le dit.

  Trois demandes par adresse et par heure : assez pour se tromper une
  fois, trop peu pour s'en servir comme d'une arme.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const WINDOW_MS = 60 * 60 * 1000;
const PER_EMAIL = 3;
const recent = new Map<string, { count: number; resetAt: number }>();

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function limited(email: string, now: number): boolean {
  if (recent.size > 10_000) recent.clear();
  const bucket = recent.get(email);
  if (!bucket || bucket.resetAt <= now) {
    recent.set(email, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > PER_EMAIL;
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as { email?: unknown };
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";

  if (!EMAIL.test(email)) {
    return res.status(400).json({ message: "Cette adresse e-mail n'est pas valable." });
  }

  const apiKey = String(process.env.BREVO_API_KEY || "").trim();
  const listId = Number(process.env.BREVO_NEWSLETTER_LIST_ID);

  if (!apiKey || !Number.isInteger(listId) || listId <= 0) {
    return res.status(503).json({
      message: "L'abonnement aux nouvelles de MACHÉ n'est pas encore ouvert.",
      configured: false,
    });
  }

  if (limited(email, Date.now())) {
    return res.status(429).json({ message: "Plusieurs demandes pour cette adresse. Réessayez dans une heure." });
  }

  const template = Number(process.env.BREVO_DOI_TEMPLATE_ID);
  const site = String(process.env.STOREFRONT_URL || "").replace(/\/+$/, "");
  const doubleOptIn = Number.isInteger(template) && template > 0 && /^https?:\/\//.test(site);

  const base = String(process.env.BREVO_API_URL_BASE || "https://api.brevo.com/v3").replace(/\/+$/, "");

  try {
    const response = await fetch(
      doubleOptIn ? `${base}/contacts/doubleOptinConfirmation` : `${base}/contacts`,
      {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json", "api-key": apiKey },
        body: JSON.stringify(
          doubleOptIn
            ? {
                email,
                includeListIds: [listId],
                templateId: template,
                redirectionUrl: `${site}/?abonnement=confirme`,
              }
            : { email, listIds: [listId], updateEnabled: true }
        ),
        signal: AbortSignal.timeout(10_000),
      }
    );

    /* 204 : l'adresse était déjà inscrite ; ce n'est pas une erreur. */
    if (response.ok || response.status === 204) {
      return res.json({ subscribed: true, confirmation: doubleOptIn });
    }

    const detail = (await response.text().catch(() => "")).slice(0, 200);
    req.scope.resolve("logger").error(`Abonnement : Brevo a refusé (HTTP ${response.status}) : ${detail}`);
  } catch (error) {
    req.scope
      .resolve("logger")
      .error(`Abonnement : Brevo injoignable : ${error instanceof Error ? error.message : String(error)}`);
  }

  return res.status(502).json({ message: "L'abonnement n'a pas pu être enregistré. Réessayez dans un instant." });
}
