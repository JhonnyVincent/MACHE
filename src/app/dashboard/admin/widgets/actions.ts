"use server";

/*
  ACTIONS : blocs de contenu du site public.

  Reprises du routeur générique, avec la même garde : le rôle est relu en
  base à chaque appel. Une modification est répercutée sur les pages
  publiques concernées, sans quoi le bloc reste invisible jusqu'au prochain
  déploiement.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminForWrite } from "@/lib/admin";

const BASE = "/dashboard/admin/widgets";

function fail(message: string): never {
  redirect(`${BASE}?error=${encodeURIComponent(message)}`);
}

function done(code: string, page: string): never {
  revalidatePath(BASE);
  revalidatePath(page === "home" ? "/" : `/${page}`);
  redirect(`${BASE}?success=${code}`);
}

export async function createWidgetAction(formData: FormData) {
  const { supabase, uid } = await requireAdminForWrite(BASE);

  const page = String(formData.get("page") || "home").trim() || "home";
  const zone = String(formData.get("zone") || "").trim();
  const type = String(formData.get("type") || "text_block").trim() || "text_block";
  const title = String(formData.get("title") || "").trim();
  const subtitle = String(formData.get("subtitle") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const imageUrl = String(formData.get("image_url") || "").trim();
  const buttonText = String(formData.get("button_text") || "").trim();
  const buttonHref = String(formData.get("button_href") || "").trim();
  const position = Number(formData.get("position") || 0);

  if (!zone) fail("Indiquez la zone où ce bloc doit apparaître.");
  if (!title) fail("Indiquez un titre.");

  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
    fail("L'adresse de l'image doit commencer par http:// ou https://");
  }

  /* Un bouton sans lien ne mène nulle part : autant ne pas l'afficher. */
  if (buttonText && !buttonHref) {
    fail("Ce bouton n'a pas de lien : indiquez-en un, ou retirez son texte.");
  }

  const { error } = await supabase.from("site_widgets").insert({
    page,
    zone,
    type,
    title,
    subtitle: subtitle || null,
    description: description || null,
    image_url: imageUrl || null,
    button_text: buttonText || null,
    button_href: buttonHref || null,
    position: Number.isFinite(position) ? position : 0,
    is_active: true,
    created_by: uid,
    updated_by: uid,
  });

  if (error) fail(error.message);

  done("created", page);
}

export async function toggleWidgetAction(formData: FormData) {
  const { supabase, uid } = await requireAdminForWrite(BASE);

  const widgetId = String(formData.get("widget_id") || "").trim();
  const page = String(formData.get("page") || "home").trim();

  if (!widgetId) fail("Bloc inconnu.");

  /* L'état est relu en base : celui du formulaire peut être périmé. */
  const { data: widget } = await supabase
    .from("site_widgets")
    .select("id, is_active")
    .eq("id", widgetId)
    .maybeSingle();

  if (!widget) fail("Ce bloc n'existe plus.");

  const { error } = await supabase
    .from("site_widgets")
    .update({
      is_active: !widget.is_active,
      updated_by: uid,
      updated_at: new Date().toISOString(),
    })
    .eq("id", widgetId);

  if (error) fail(error.message);

  done("updated", page);
}

export async function deleteWidgetAction(formData: FormData) {
  const { supabase } = await requireAdminForWrite(BASE);

  const widgetId = String(formData.get("widget_id") || "").trim();
  const page = String(formData.get("page") || "home").trim();

  if (!widgetId) fail("Bloc inconnu.");

  const { error } = await supabase.from("site_widgets").delete().eq("id", widgetId);

  if (error) fail(error.message);

  done("deleted", page);
}
