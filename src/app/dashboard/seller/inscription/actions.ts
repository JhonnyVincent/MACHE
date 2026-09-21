"use server";

/*
  ACTION : ouvrir une boutique sur MACHÉ.

  Ce que le serveur vérifie, et pourquoi il le refait

  Le navigateur valide déjà les champs — un champ requis, une longueur
  minimale. Cela ne compte pas : rien n'oblige à passer par le
  formulaire. Tout est donc revérifié ici, avant le moindre appel au
  backend.

  L'adresse de la boutique

  C'est la partie qui apparaîtra dans « /store/… ». Elle se déduit du
  nom, mais reste modifiable : un commerçant peut vouloir une adresse
  plus courte que son enseigne. Elle est normalisée — minuscules, sans
  accents, tirets — parce qu'elle vit dans une URL.
*/

import { redirect } from "next/navigation";
import { registerVendor } from "@/lib/medusa/vendor";
import { toHandle } from "@/lib/handle";

const BASE = "/dashboard/seller/inscription";


export async function registerVendorAction(formData: FormData) {
  const shopName = String(formData.get("shop_name") || "").trim();
  const rawHandle = String(formData.get("handle") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const firstName = String(formData.get("first_name") || "").trim();
  const lastName = String(formData.get("last_name") || "").trim();
  const description = String(formData.get("description") || "").trim();

  const fail = (message: string) =>
    redirect(`${BASE}?error=${encodeURIComponent(message)}`);

  if (shopName.length < 2) {
    fail("Donnez un nom à votre boutique.");
  }

  if (!email.includes("@")) {
    fail("Indiquez une adresse e-mail valide.");
  }

  /*
    Huit caractères. Ce n'est pas beaucoup, mais c'est le seuil en
    dessous duquel un mot de passe ne protège plus rien, et ce compte
    donne accès au catalogue et aux commandes d'une boutique.
  */
  if (password.length < 8) {
    fail("Le mot de passe doit faire au moins 8 caractères.");
  }

  const handle = toHandle(rawHandle || shopName);

  if (handle.length < 2) {
    fail(
      "L'adresse de la boutique doit contenir au moins deux lettres ou chiffres."
    );
  }

  const result = await registerVendor({
    shopName,
    handle,
    email,
    password,
    firstName,
    lastName,
    description: description.slice(0, 500),
  });

  if (!result.ok) {
    fail(result.reason);
  }

  /*
    On arrive dans l'espace vendeur, connecté. Le paramètre dit que la
    boutique vient d'être créée : l'écran d'accueil explique alors
    l'attente d'approbation, plutôt que de laisser le vendeur chercher
    sa boutique dans un catalogue où elle n'est pas encore.
  */
  redirect("/dashboard/seller?bienvenue=1");
}
