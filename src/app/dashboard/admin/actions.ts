"use server";

/*
  ACTIONS : session d'administration.

  Le jeton n'est jamais renvoyé au navigateur : la couche Medusa le
  dépose dans un cookie httpOnly. Ces actions ne font que router et
  rapporter l'erreur.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  loginAdmin,
  clearAdminSession,
  clearPendingAdmin,
  verifyAdminSecondFactor,
} from "@/lib/medusa/admin";

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

  /*
    Mot de passe juste, mais le compte demande un code à usage unique.
    La session n'est PAS ouverte : seul un jeton en attente a été posé,
    et aucune page d'administration ne le lit.
  */
  if (result.data.needsCode) {
    redirect("/dashboard/admin/connexion/code");
  }

  redirect("/dashboard/admin");
}

/*
  Le second facteur, à la connexion.

  Le code et le code de secours arrivent par le même formulaire. On
  choisit selon ce qui est rempli plutôt que de demander à la personne
  de cocher une case : au moment où l'on cherche son papier de secours,
  on n'a pas envie de choisir un mode d'abord.
*/
export async function adminSecondFactorAction(formData: FormData) {
  const code = String(formData.get("code") || "").trim();
  const recovery = String(formData.get("recovery") || "").trim();

  if (!code && !recovery) {
    redirect(
      `/dashboard/admin/connexion/code?error=${encodeURIComponent(
        "Saisissez le code de votre application, ou un code de secours."
      )}`
    );
  }

  const result = await verifyAdminSecondFactor(
    recovery ? { recovery } : { code }
  );

  if (!result.ok) {
    redirect(
      `/dashboard/admin/connexion/code?error=${encodeURIComponent(result.reason)}`
    );
  }

  revalidatePath("/dashboard/admin", "layout");

  /*
    Un code de secours consommé se signale. Il en reste un de moins, et
    personne ne compte ses papiers tout seul : arriver au dernier sans
    l'avoir vu venir, c'est se retrouver dehors au suivant.
  */
  if (result.data.usedRecovery) {
    redirect(
      `/dashboard/admin/securite?success=${encodeURIComponent(
        `Code de secours utilisé. Il vous en reste ${result.data.recoveryLeft ?? "?"}.`
      )}`
    );
  }

  redirect("/dashboard/admin");
}

export async function adminCancelSecondFactorAction() {
  await clearPendingAdmin();

  redirect("/dashboard/admin/connexion");
}

export async function adminLogoutAction() {
  await clearAdminSession();
  await clearPendingAdmin();

  revalidatePath("/dashboard/admin", "layout");
  redirect("/dashboard/admin/connexion");
}
