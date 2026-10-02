/*
  LES E-MAILS AUTOMATIQUES DE MACHE : ce qu'ils disent.

  Jusqu'ici, seul « mot de passe oublié » envoyait un e-mail. Un vendeur
  ne savait pas qu'une commande l'attendait tant qu'il n'ouvrait pas son
  panneau ; un acheteur n'avait aucune trace de ce qu'il avait commandé ;
  une réponse à un devis ou à un message restait sur une page que
  personne ne revenait voir.

  Ce fichier fabrique les messages ; il n'envoie rien et ne lit rien.
  Séparé des abonnés pour se tester sans Medusa.

  Règles communes

  - Tout ce qui vient d'un utilisateur (nom, produit, message) est
    échappé avant d'entrer dans le HTML : un nom de boutique ne doit pas
    pouvoir injecter de lien.
  - Les liens sont construits sur STOREFRONT_URL, jamais sur une donnée
    de requête (voir password-reset-email.ts, même règle).
  - Rien n'est promis que le site ne fasse : ni délai de livraison, ni
    montant de remboursement.
*/

import { storefrontBase } from "./password-reset-email";

export type RenderedEmail = { subject: string; text: string; html: string };

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* Un montant lisible, dans la devise de la commande. */
export function money(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount === null || amount === undefined || !Number.isFinite(Number(amount))) return "—";

  const code = String(currency || "HTG").toUpperCase();

  try {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: code, maximumFractionDigits: 0 }).format(
      Number(amount)
    );
  } catch {
    return `${Math.round(Number(amount))} ${code}`;
  }
}

/* Une adresse du site, ou null si STOREFRONT_URL manque. */
export function siteLink(path: string, base: string | null = storefrontBase()): string | null {
  if (!base) return null;

  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/* Le lien personnel d'une demande de devis, pour un acheteur sans compte. */
export function quoteLink(id: string, token: string, base: string | null = storefrontBase()): string | null {
  return siteLink(`/devis/${encodeURIComponent(id)}?jeton=${encodeURIComponent(token)}`, base);
}

/* Le lien personnel d'une conversation avec MACHE. */
export function threadLink(id: string, token: string, base: string | null = storefrontBase()): string | null {
  return siteLink(`/messages/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`, base);
}

/* Où partent les alertes destinées à l'équipe MACHE. */
export function adminAlertAddress(): string | null {
  const raw = String(process.env.ADMIN_ALERT_EMAIL || process.env.MAIL_FROM || "")
    .trim()
    .toLowerCase();

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? raw : null;
}

type Block = { kind: "p"; text: string } | { kind: "small"; text: string } | { kind: "rows"; rows: Array<[string, string]> };

/*
  La mise en page commune : du texte, un tableau simple, un bouton.
  Des styles en ligne seulement (les messageries retirent les feuilles
  de style), et une version texte complète pour les messageries qui
  n'affichent pas le HTML.
*/
export function layout(
  subject: string,
  blocks: Block[],
  button?: { label: string; url: string | null }
): RenderedEmail {
  const textParts: string[] = [];
  const htmlParts: string[] = [];

  for (const block of blocks) {
    if (block.kind === "rows") {
      textParts.push(block.rows.map(([label, value]) => `${label} : ${value}`).join("\n"));
      htmlParts.push(
        `<table style="border-collapse:collapse;width:100%;margin:12px 0">${block.rows
          .map(
            ([label, value]) =>
              `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;color:#565959;vertical-align:top">${escapeHtml(label)}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;font-weight:bold;white-space:pre-line">${escapeHtml(value)}</td></tr>`
          )
          .join("")}</table>`
      );
    } else if (block.kind === "small") {
      textParts.push(block.text);
      htmlParts.push(`<p style="font-size:13px;color:#565959">${escapeHtml(block.text)}</p>`);
    } else {
      textParts.push(block.text);
      htmlParts.push(`<p>${escapeHtml(block.text)}</p>`);
    }
  }

  if (button?.url) {
    const safe = escapeHtml(button.url);

    textParts.push(`${button.label} : ${button.url}`);
    htmlParts.push(
      `<p><a href="${safe}" style="display:inline-block;background:#d41834;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold">${escapeHtml(button.label)}</a></p>`,
      `<p style="font-size:13px;color:#565959">Le bouton ne s'affiche pas ? Copiez ce lien dans votre navigateur :<br><span style="word-break:break-all">${safe}</span></p>`
    );
  }

  textParts.push("— MACHE");
  htmlParts.push("<p>— MACHE</p>");

  return {
    subject,
    text: textParts.join("\n\n"),
    html: `<!doctype html>
<html lang="fr"><body style="font-family:Arial,sans-serif;color:#0f1111;line-height:1.5;max-width:560px">
${htmlParts.join("\n")}
</body></html>`,
  };
}

export type OrderLine = { title: string; quantity: number };

export type OrderSummary = {
  displayId: number | string;
  sellerName: string;
  lines: OrderLine[];
  total: number | null;
  currency: string | null;
};

function linesText(lines: OrderLine[]): string {
  return lines.map((line) => `${line.quantity} × ${line.title}`).join("\n") || "—";
}

/*
  Le mode de paiement, dit tel qu'il est. `null` : on ne le sait pas, et
  le message n'en parle pas plutôt que de deviner.
*/
export function paymentRows(cashOnDelivery: boolean | null): Array<[string, string]> {
  if (cashOnDelivery === null) return [];

  return [["Paiement", cashOnDelivery ? "À régler à la livraison, en main propre" : "Payé en ligne"]];
}

/* 1. Au VENDEUR : une commande l'attend. */
export function orderForSellerEmail(input: {
  order: OrderSummary;
  customerName: string;
  phone: string | null;
  address: string;
  cashOnDelivery: boolean | null;
  international?: boolean;
}): RenderedEmail {
  const { order } = input;

  return layout(
    `${input.international ? "Commande internationale" : "Nouvelle commande"} n° ${order.displayId} — ${order.sellerName}`,
    [
      { kind: "p", text: `Bonjour ${order.sellerName},` },
      input.international
        ? {
            kind: "p",
            text: "Une commande vient d'être passée dans votre boutique MACHE, pour une livraison HORS D'HAÏTI. Préparez les articles, mais N'EXPÉDIEZ RIEN avant la confirmation de MACHE : les frais d'expédition et le paiement sont d'abord convenus avec le client.",
          }
        : { kind: "p", text: "Une nouvelle commande vient d'être passée dans votre boutique MACHE. Préparez-la et contactez le client pour la livraison." },
      {
        kind: "rows",
        rows: [
          ["Commande", `n° ${order.displayId}`],
          ["Articles", linesText(order.lines)],
          ["Total", input.international ? `${money(order.total, order.currency)} (hors frais d'expédition)` : money(order.total, order.currency)],
          ...(input.international ? [["Paiement", "Convenu avec le client avant l'envoi"] as [string, string]] : paymentRows(input.cashOnDelivery)),
          ["Client", input.customerName || "—"],
          ["Téléphone", input.phone || "—"],
          ["Adresse de livraison", input.address || "—"],
        ],
      },
      { kind: "small", text: "Les détails, l'expédition et le suivi se gèrent depuis votre panneau vendeur." },
    ],
    { label: "Ouvrir mon espace vendeur", url: siteLink("/dashboard/seller") }
  );
}

/* 2. À l'ACHETEUR : la confirmation de ce qu'il a commandé. */
export function orderConfirmationEmail(input: {
  customerName: string;
  orders: OrderSummary[];
  cashOnDelivery: boolean | null;
  international?: boolean;
}): RenderedEmail {
  const blocks: Block[] = [
    { kind: "p", text: input.customerName ? `Bonjour ${input.customerName},` : "Bonjour," },
    {
      kind: "p",
      text:
        input.orders.length > 1
          ? `Votre commande est enregistrée. Elle concerne ${input.orders.length} boutiques : chacune prépare et livre sa partie.`
          : "Votre commande est enregistrée et a été transmise au vendeur.",
    },
  ];

  for (const order of input.orders) {
    blocks.push({
      kind: "rows",
      rows: [
        ["Commande", `n° ${order.displayId} — ${order.sellerName}`],
        ["Articles", linesText(order.lines)],
        ["Total", money(order.total, order.currency)],
      ],
    });
  }

  if (input.international) {
    blocks.push({
      kind: "p",
      text: "Livraison hors d'Haïti : les frais d'expédition ne sont pas encore comptés. MACHE vous écrit pour vous indiquer leur montant et le moyen de paiement. Rien n'est expédié, et rien ne vous est demandé, avant votre accord.",
    });

    return layout("Votre commande MACHE est enregistrée — frais d'expédition à confirmer", blocks, {
      label: "Suivre mes commandes",
      url: siteLink("/dashboard/buyer/orders"),
    });
  }

  const payment = paymentRows(input.cashOnDelivery);

  if (payment.length) blocks.push({ kind: "rows", rows: payment });

  if (input.cashOnDelivery === true) {
    blocks.push({
      kind: "small",
      text: "Rien n'a été prélevé. Vous réglez à la réception, après avoir vérifié le colis. Le vendeur vous contactera au numéro indiqué pour la livraison.",
    });
  }

  return layout("Votre commande MACHE est enregistrée", blocks, {
    label: "Suivre mes commandes",
    url: siteLink("/dashboard/buyer/orders"),
  });
}

/* 3. Au VENDEUR : une demande de devis. */
export function quoteRequestEmail(input: {
  sellerName: string;
  displayId: number | string;
  productTitle: string;
  quantity: number;
  buyerName: string;
  buyerCompany: string | null;
  message: string | null;
}): RenderedEmail {
  const rows: Array<[string, string]> = [
    ["Demande", `n° ${input.displayId}`],
    ["Article", input.productTitle],
    ["Quantité", String(input.quantity)],
    ["De la part de", input.buyerCompany ? `${input.buyerName} (${input.buyerCompany})` : input.buyerName],
  ];

  if (input.message) rows.push(["Message", input.message]);

  return layout(
    `Demande de devis n° ${input.displayId} : ${input.quantity} × ${input.productTitle}`,
    [
      { kind: "p", text: `Bonjour ${input.sellerName},` },
      { kind: "p", text: "Un acheteur vous demande un prix pour une quantité. Répondez depuis votre panneau vendeur, rubrique « Devis » : il sera prévenu par e-mail." },
      { kind: "rows", rows },
    ],
    { label: "Répondre au devis", url: siteLink("/dashboard/seller") }
  );
}

/* 4. À l'ACHETEUR : le vendeur a répondu à son devis. */
export function quoteAnsweredEmail(input: {
  buyerName: string;
  displayId: number | string;
  productTitle: string;
  accepted: boolean;
  link: string | null;
}): RenderedEmail {
  return layout(
    `Réponse à votre demande de devis n° ${input.displayId}`,
    [
      { kind: "p", text: input.buyerName ? `Bonjour ${input.buyerName},` : "Bonjour," },
      {
        kind: "p",
        text: input.accepted
          ? `Le vendeur a répondu à votre demande de devis pour « ${input.productTitle} » avec une proposition de prix.`
          : `Le vendeur a répondu à votre demande de devis pour « ${input.productTitle} » : il ne peut pas y donner suite.`,
      },
      { kind: "small", text: "Rien n'est réservé ni payé tant que vous n'avez pas accepté." },
    ],
    { label: "Voir la réponse", url: input.link }
  );
}

/* 5. Au DEMANDEUR : MACHE a répondu à son message. */
export function messageReplyEmail(input: {
  name: string;
  displayId: number | string;
  subject: string;
  link: string | null;
}): RenderedEmail {
  return layout(
    `MACHE a répondu à votre message n° ${input.displayId}`,
    [
      { kind: "p", text: input.name ? `Bonjour ${input.name},` : "Bonjour," },
      { kind: "p", text: `L'équipe MACHE a répondu à votre message « ${input.subject} ».` },
      { kind: "small", text: "Pour des raisons de confidentialité, la réponse ne figure pas dans cet e-mail : ouvrez la conversation pour la lire et y répondre." },
    ],
    { label: "Lire la réponse", url: input.link }
  );
}

/* 6. Au VENDEUR : sa boutique est approuvée. */
export function sellerApprovedEmail(input: { sellerName: string; handle: string | null }): RenderedEmail {
  return layout(
    `Votre boutique « ${input.sellerName} » est en ligne sur MACHE`,
    [
      { kind: "p", text: `Bonjour ${input.sellerName},` },
      { kind: "p", text: "Bonne nouvelle : MACHE a approuvé votre boutique. Elle est maintenant visible dans le catalogue, avec les produits que vous y avez mis en vente." },
      { kind: "small", text: input.handle ? `Adresse de votre vitrine : ${siteLink(`/store/${input.handle}`) ?? ""}` : "Ajoutez vos produits depuis votre espace vendeur." },
    ],
    { label: "Ouvrir mon espace vendeur", url: siteLink("/dashboard/seller") }
  );
}

/* 7. À l'ÉQUIPE MACHE : quelque chose attend une décision. */
/*
  Lien vers une page du PANNEAU d'administration (backend, `/dashboard`).
  L'administration n'est plus sur le site public : l'adresse du panneau
  n'est donc écrite que dans ces e-mails, adressés à l'équipe.
*/
export function panelLink(path: string): string {
  const base = String(process.env.RENDER_EXTERNAL_URL || process.env.FILE_BACKEND_URL || "http://localhost:9000").replace(/\/+$/, "");

  return `${base}/dashboard${path.startsWith("/") ? path : `/${path}`}`;
}

export function adminAlertEmail(input: {
  subject: string;
  intro: string;
  rows: Array<[string, string]>;
  path: string;
  label: string;
}): RenderedEmail {
  return layout(
    `[MACHE] ${input.subject}`,
    [
      { kind: "p", text: input.intro },
      { kind: "rows", rows: input.rows },
    ],
    { label: input.label, url: panelLink(input.path) }
  );
}
