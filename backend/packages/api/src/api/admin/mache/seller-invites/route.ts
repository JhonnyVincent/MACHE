/*
  ROUTE ADMIN : inviter un vendeur.

  Envoie un e-mail avec le lien d'inscription vendeur de MACHE. Le
  vendeur crée lui-même son compte et sa boutique : MACHE ne connaît ni
  ne choisit son mot de passe. L'invitation ne crée rien et n'engage à
  rien ; la boutique reste soumise à votre approbation.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { layout, siteLink } from "../../../../lib/notification-emails";
import { notify } from "../../../../lib/notify";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const email = String(body.email ?? "").trim().toLowerCase();
  const name = String(body.name ?? "").trim().slice(0, 100);
  const note = String(body.note ?? "").trim().slice(0, 600);

  if (!EMAIL.test(email)) return res.status(400).json({ message: "Adresse e-mail non valable." });

  const link = siteLink("/dashboard/seller/inscription");

  if (!link) return res.status(503).json({ message: "STOREFRONT_URL n'est pas configurée : le lien d'inscription est impossible." });

  const sent = await notify(
    req.scope.resolve(ContainerRegistrationKeys.LOGGER),
    "invitation d'un vendeur",
    email,
    layout(
      "Vous êtes invité à vendre sur MACHE",
      [
        { kind: "p", text: name ? `Bonjour ${name},` : "Bonjour," },
        { kind: "p", text: "MACHE, la marketplace haïtienne, vous invite à ouvrir votre boutique et à vendre vos produits." },
        ...(note ? [{ kind: "p" as const, text: note }] : []),
        { kind: "small", text: "Vous créez vous-même votre compte. Votre boutique sera examinée par l'équipe MACHE avant d'apparaître sur le site." },
      ],
      { label: "Ouvrir ma boutique", url: link }
    )
  );

  if (!sent) return res.status(502).json({ message: "L'e-mail n'a pas pu être envoyé. Vérifiez la configuration d'envoi." });

  return res.status(201).json({ ok: true });
}
