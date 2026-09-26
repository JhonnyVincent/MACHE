/*
  L'ENVOI D'E-MAILS DE MACHÉ.

  Pourquoi Brevo, et pas Gmail directement

  L'idée de départ était d'envoyer par le compte Gmail de MACHÉ, en
  SMTP. Le plan gratuit de Render BLOQUE les ports SMTP sortants (25,
  465, 587) : les envois seraient partis dans le vide, chaque message
  attendant un délai d'expiration sans jamais rien dire. Un « mot de
  passe oublié » qui n'envoie rien est pire qu'absent : le client
  attend un message qui ne viendra pas.

  Brevo passe par HTTPS — le port que Render laisse ouvert — et son
  offre gratuite couvre 300 envois par jour. L'adresse d'expédition
  reste celle de MACHÉ (MAIL_FROM) : Brevo exige seulement qu'on
  confirme une fois qu'on en est propriétaire.

  Ce qu'il faut savoir sur une adresse @gmail.com comme expéditrice

  Un message « de » une adresse Gmail, mais envoyé par un autre service
  que Gmail, arrive plus souvent dans les indésirables : les
  messageries vérifient que l'expéditeur est bien celui qu'il prétend.
  C'est acceptable pour commencer. La solution durable est un nom de
  domaine à MACHÉ, authentifié chez Brevo.

  Ce que ce fichier garantit

  - La clé ne vit que dans l'environnement (BREVO_API_KEY). Jamais dans
    le code, jamais dans les journaux.
  - Un envoi ne lève jamais d'exception : il répond envoyé ou pas, et
    pourquoi. Celui qui appelle décide ; un e-mail raté ne doit pas
    faire échouer ce qui l'a déclenché.
  - Un délai maximal, pour qu'un service d'envoi lent ne ralentisse pas
    le reste du serveur.
*/

/*
  BREVO_API_URL ne sert qu'aux essais : elle permet de vérifier toute la
  chaîne — demande, événement, message, lien — contre un faux service,
  sans envoyer un vrai e-mail. En production, on ne la pose pas.
*/
function endpoint(): string {
  return String(process.env.BREVO_API_URL || "").trim() || "https://api.brevo.com/v3/smtp/email";
}

const TIMEOUT_MS = 10_000;

export type Email = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type SendResult =
  | { sent: true }
  | { sent: false; reason: string; configured: boolean };

export function mailConfig() {
  return {
    apiKey: String(process.env.BREVO_API_KEY || "").trim(),
    from: String(process.env.MAIL_FROM || "").trim().toLowerCase(),
    fromName: String(process.env.MAIL_FROM_NAME || "MACHÉ").trim() || "MACHÉ",
  };
}

export async function sendEmail(email: Email): Promise<SendResult> {
  const { apiKey, from, fromName } = mailConfig();

  if (!apiKey || !from) {
    return {
      sent: false,
      configured: false,
      reason: !apiKey
        ? "BREVO_API_KEY absente : aucun service d'envoi n'est configuré."
        : "MAIL_FROM absente : aucune adresse d'expédition n'est configurée.",
    };
  }

  try {
    const response = await fetch(endpoint(), {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { name: fromName, email: from },
        to: [{ email: email.to }],
        subject: email.subject,
        htmlContent: email.html,
        textContent: email.text,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (response.status === 201 || response.ok) return { sent: true };

    /*
      Le message d'erreur de Brevo dit l'essentiel (« sender not
      valid », « unauthorized »…) sans contenir la clé. On le garde
      court : il finit dans les journaux.
    */
    const detail = (await response.text().catch(() => "")).slice(0, 200);

    return {
      sent: false,
      configured: true,
      reason: `Brevo a refusé l'envoi (HTTP ${response.status}) : ${detail}`,
    };
  } catch (error) {
    return {
      sent: false,
      configured: true,
      reason: `Brevo injoignable : ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
