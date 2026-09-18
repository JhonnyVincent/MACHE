"use server";

/*
  ACTIONS : habilitation des agents MACHÉ.

  Ce qui se décide ici engage la sécurité des clients : un code enregistré
  comme « actif » fait répondre « agent habilité » à la page publique de
  vérification, et un client remettra alors son colis ou son argent. Les
  écritures sont donc réservées au personnel, revérifié en base à chaque
  appel, et le rattachement à un compte impose que ce compte ait bien le
  rôle agent.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminForWrite } from "@/lib/admin";

const BASE = "/dashboard/admin/agents";

function fail(message: string): never {
  redirect(`${BASE}?error=${encodeURIComponent(message)}`);
}

function done(code: string): never {
  revalidatePath(BASE);
  revalidatePath("/verify-agent");
  redirect(`${BASE}?success=${encodeURIComponent(code)}`);
}

function normalizeCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export async function createAgentAction(formData: FormData) {
  const { supabase } = await requireAdminForWrite(BASE);

  const code = normalizeCode(String(formData.get("code") || ""));
  const displayName = String(formData.get("display_name") || "").trim();
  const zone = String(formData.get("zone") || "").trim();
  const phonePublic = String(formData.get("phone_public") || "").trim();
  const photoUrl = String(formData.get("photo_url") || "").trim();
  const validUntil = String(formData.get("valid_until") || "").trim();
  const userEmail = String(formData.get("user_email") || "").trim().toLowerCase();

  if (!code) fail("Le code de l'agent est obligatoire.");
  if (!/^[A-Z0-9-]{4,32}$/.test(code)) {
    fail("Le code ne peut contenir que des lettres, des chiffres et des tirets.");
  }
  if (!displayName) fail("Le nom affiché est obligatoire.");

  if (photoUrl && !/^https?:\/\//i.test(photoUrl)) {
    fail("L'adresse de la photo doit commencer par http:// ou https://");
  }

  const { data: existing } = await supabase
    .from("agent_profiles")
    .select("id")
    .eq("code", code)
    .maybeSingle();

  if (existing) fail(`Le code ${code} est déjà attribué.`);

  /*
    Rattachement facultatif à un compte. Il n'est accepté que si ce compte
    porte le rôle agent : rattacher la carte à un client ou à un vendeur
    lui ouvrirait l'espace agent et les adresses de livraison.
  */
  let userId: string | null = null;

  if (userEmail) {
    const { data: account } = await supabase
      .from("users")
      .select("id, role")
      .eq("email", userEmail)
      .maybeSingle();

    if (!account) fail(`Aucun compte ne correspond à ${userEmail}.`);

    if (String(account.role || "").trim() !== "agent") {
      fail(
        `Le compte ${userEmail} n'a pas le rôle agent. Changez son rôle avant de lui attribuer une carte.`
      );
    }

    userId = String(account.id);
  }

  const { error } = await supabase.from("agent_profiles").insert({
    code,
    display_name: displayName,
    zone: zone || null,
    phone_public: phonePublic || null,
    photo_url: photoUrl || null,
    valid_until: validUntil || null,
    user_id: userId,
    // Une carte naît « en cours d'habilitation » : l'activer est une
    // décision distincte, prise en connaissance de cause.
    status: "pending",
    official_badge: false,
  });

  if (error) fail(error.message);

  done("created");
}

export async function setAgentStatusAction(formData: FormData) {
  const { supabase } = await requireAdminForWrite(BASE);

  const agentId = String(formData.get("agent_id") || "");
  const status = String(formData.get("status") || "");

  if (!agentId) fail("Agent inconnu.");

  if (!["pending", "active", "suspended", "revoked"].includes(status)) {
    fail("Statut d'habilitation inconnu.");
  }

  const { data: updated, error } = await supabase
    .from("agent_profiles")
    .update({
      status,
      // Le badge officiel ne survit pas à une habilitation retirée.
      ...(status === "revoked" ? { official_badge: false } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", agentId)
    .select("id")
    .maybeSingle();

  if (error) fail(error.message);
  if (!updated) fail("Cette carte n'existe plus.");

  done("status");
}

export async function setAgentBadgeAction(formData: FormData) {
  const { supabase } = await requireAdminForWrite(BASE);

  const agentId = String(formData.get("agent_id") || "");
  const badge = String(formData.get("badge") || "") === "true";

  if (!agentId) fail("Agent inconnu.");

  const { data: agent } = await supabase
    .from("agent_profiles")
    .select("id, status")
    .eq("id", agentId)
    .maybeSingle();

  if (!agent) fail("Cette carte n'existe plus.");

  if (badge && String(agent.status) !== "active") {
    fail("Le badge officiel ne s'accorde qu'à une carte active.");
  }

  const { error } = await supabase
    .from("agent_profiles")
    .update({ official_badge: badge, updated_at: new Date().toISOString() })
    .eq("id", agentId);

  if (error) fail(error.message);

  done("badge");
}
