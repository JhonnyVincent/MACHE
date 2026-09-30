/*
  Envoyer un e-mail automatique sans jamais bloquer ni faire échouer ce
  qui l'a déclenché.

  Une commande reste passée, un devis reste envoyé, même si Brevo est
  lent, absent ou refuse le message : l'échec part au journal, avec la
  nature du message mais JAMAIS l'adresse du destinataire (les journaux
  se consultent et se copient).
*/

import { sendEmail } from "./mailer";
import type { RenderedEmail } from "./notification-emails";

type Logger = { info: (m: string) => void; warn: (m: string) => void; error: (m: string) => void };

export async function notify(
  logger: Logger,
  label: string,
  to: string | null | undefined,
  email: RenderedEmail
): Promise<boolean> {
  const address = String(to || "").trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    logger.warn(`E-mail « ${label} » : pas d'adresse valide, rien n'est envoyé.`);
    return false;
  }

  try {
    const result = await sendEmail({ to: address, ...email });

    if (result.sent) {
      logger.info(`E-mail « ${label} » envoyé.`);
      return true;
    }

    if (!result.configured) logger.warn(`E-mail « ${label} » non envoyé : ${result.reason}`);
    else logger.error(`E-mail « ${label} » NON envoyé : ${result.reason}`);

    return false;
  } catch (error) {
    logger.error(`E-mail « ${label} » : erreur inattendue (${error instanceof Error ? error.message : String(error)}).`);
    return false;
  }
}
