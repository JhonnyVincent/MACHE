"use server";

/*
  ACTIONS : avancement d'une expédition par l'agent.

  Règle de sécurité : rien de ce qui vient du formulaire n'est cru.
  L'expédition est relue en base, son agent_id comparé au compte connecté,
  et la transition demandée vérifiée contre l'enchaînement autorisé. Un
  agent ne peut donc ni toucher la course d'un autre, ni déclarer livré un
  colis qu'il n'a jamais récupéré, quel que soit le bouton envoyé.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";
import { AGENT_NEXT_STATUS } from "@/lib/agents";

function back(message: string, key: "error" | "success"): never {
  redirect(`/dashboard/agent?${key}=${encodeURIComponent(message)}`);
}

export async function advanceShipmentAction(formData: FormData) {
  const shipmentId = String(formData.get("shipment_id") || "");
  const nextStatus = String(formData.get("next_status") || "");
  const reason = String(formData.get("reason") || "").trim();

  if (!shipmentId || !nextStatus) {
    back("Course ou étape manquante.", "error");
  }

  if (!supabaseConfigured()) {
    back(
      "L'espace agent n'est pas relié à sa base de comptes : la course ne peut pas être mise à jour.",
      "error"
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login?next=/dashboard/agent");
  }

  const uid = userData.user.id;

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", uid)
    .maybeSingle();

  if (String(profile?.role || "").trim() !== "agent") {
    redirect("/dashboard");
  }

  /* État réel de la course, relu en base. */
  const { data: shipment, error: readError } = await supabase
    .from("shipments")
    .select("id, agent_id, status")
    .eq("id", shipmentId)
    .eq("agent_id", uid)
    .maybeSingle();

  if (readError) back(readError.message, "error");

  if (!shipment) {
    back("Cette course ne vous est pas assignée.", "error");
  }

  const allowed = AGENT_NEXT_STATUS[String(shipment.status)] ?? [];

  if (!allowed.includes(nextStatus)) {
    back(
      `Passage impossible de « ${shipment.status} » à « ${nextStatus} ».`,
      "error"
    );
  }

  if (nextStatus === "failed" && !reason) {
    back("Indiquez la raison de l'échec de livraison.", "error");
  }

  const patch: Record<string, unknown> = {
    status: nextStatus,
    updated_at: new Date().toISOString(),
  };

  if (nextStatus === "picked_up") patch.picked_up_at = new Date().toISOString();
  if (nextStatus === "delivered") patch.delivered_at = new Date().toISOString();
  if (nextStatus === "failed") patch.failure_reason = reason;

  /*
    Le filtre sur le statut attendu évite d'écraser une mise à jour faite
    entre-temps : si la course a bougé depuis l'affichage de la page, la
    modification ne s'applique pas plutôt que d'écraser en silence.
  */
  const { data: updated, error } = await supabase
    .from("shipments")
    .update(patch)
    .eq("id", shipmentId)
    .eq("agent_id", uid)
    .eq("status", shipment.status)
    .select("id")
    .maybeSingle();

  if (error) back(error.message, "error");

  if (!updated) {
    back("Cette course a changé entre-temps. Rechargez la page.", "error");
  }

  revalidatePath("/dashboard/agent", "layout");
  back("Course mise à jour.", "success");
}
