"use server";

/*
  ACTIONS : session d'administration.

  Le jeton n'est jamais renvoyé au navigateur : la couche Medusa le
  dépose dans un cookie httpOnly. Ces actions ne font que router et
  rapporter l'erreur.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { loginAdmin, clearAdminSession } from "@/lib/medusa/admin";

export async function adminLoginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect(
      `/dashboard/admin/connexion?error=${encodeURIComponent(
        "Renseignez votre adresse e-mail et votre mot de passe."
      )}`
    );
  }

  const result = await loginAdmin(email, password);

  if (!result.ok) {
    redirect(
      `/dashboard/admin/connexion?error=${encodeURIComponent(result.reason)}`
    );
  }

  revalidatePath("/dashboard/admin", "layout");
  redirect("/dashboard/admin");
}

export async function adminLogoutAction() {
  await clearAdminSession();

  revalidatePath("/dashboard/admin", "layout");
  redirect("/dashboard/admin/connexion");
}
