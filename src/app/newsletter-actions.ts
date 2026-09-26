"use server";

import { medusaBackendUrl, medusaPublishableKey } from "@/lib/medusa/config";
import { backendTimeoutSignal, isTimeout, TIMEOUT_MESSAGE } from "@/lib/medusa/timeout";

export type NewsletterState = { status: "idle" | "ok" | "error"; message: string };

/*
  S'ABONNER : le site relaie au backend, qui inscrit l'adresse chez
  Brevo. Le message affiché dit exactement ce qui s'est passé — y
  compris « pas encore ouvert » quand Brevo n'est pas configuré, plutôt
  qu'un « merci » pour une inscription qui n'a eu lieu nulle part.
*/
export async function subscribeAction(
  _previous: NewsletterState,
  formData: FormData
): Promise<NewsletterState> {
  const email = String(formData.get("email") || "").trim();
  const url = medusaBackendUrl();

  if (!url) return { status: "error", message: "L'abonnement n'est pas disponible pour le moment." };

  try {
    const response = await fetch(`${url}/store/newsletter`, {
      method: "POST",
      signal: backendTimeoutSignal(),
      headers: {
        "content-type": "application/json",
        "x-publishable-api-key": medusaPublishableKey(),
      },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
      confirmation?: boolean;
    };

    if (response.ok) {
      return {
        status: "ok",
        message: payload.confirmation
          ? "Presque fini : cliquez sur le lien de confirmation que nous venons de vous envoyer."
          : "C'est noté. Vous recevrez les nouvelles de MACHÉ.",
      };
    }

    return { status: "error", message: payload.message ?? "L'abonnement n'a pas pu être enregistré." };
  } catch (error) {
    return {
      status: "error",
      message: isTimeout(error) ? TIMEOUT_MESSAGE : "Le serveur n'a pas répondu. Réessayez dans un instant.",
    };
  }
}
