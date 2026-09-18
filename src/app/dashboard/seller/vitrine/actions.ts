"use server";

/*
  ACTIONS : vitrine personnalisable.

  L'éditeur manipule la mise en page au format Puck. Chaque action relit
  la mise en page enregistrée, applique UNE modification, puis réenregistre :
  jamais l'inverse. Reconstruire la mise en page depuis le formulaire
  perdrait tout ce que le vendeur aurait modifié dans un autre onglet.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  loginVendor, clearVendorSession, getVendorSeller, saveStorefrontLayout,
} from "@/lib/medusa/vendor";
import {
  parseLayout, sanitizeProps, blockDefinition, BLOCK_CATALOG,
  type Block, type BlockType, type StorefrontLayout,
} from "@/lib/storefront/blocks";

const BASE = "/dashboard/seller/vitrine";

function fail(message: string): never {
  redirect(`${BASE}?error=${encodeURIComponent(message)}`);
}

function done(message?: string): never {
  revalidatePath(BASE);
  /* La vitrine publique doit refléter la modification immédiatement. */
  revalidatePath("/store/[slug]", "page");
  redirect(message ? `${BASE}?success=${encodeURIComponent(message)}` : BASE);
}

export async function vendorLoginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const handle = String(formData.get("store_handle") || "").trim().toLowerCase();

  if (!email || !password || !handle) {
    fail("Renseignez votre adresse e-mail, votre mot de passe et l'adresse de votre boutique.");
  }

  const result = await loginVendor(email, password, handle);

  if (!result.ok) fail(result.reason);

  done();
}

export async function vendorLogoutAction() {
  await clearVendorSession();
  revalidatePath(BASE);
  redirect(BASE);
}

/* Charge la mise en page courante, ou échoue proprement si la session a expiré. */
async function currentLayout(): Promise<{ layout: StorefrontLayout; name: string }> {
  const seller = await getVendorSeller();

  if (!seller) fail("Session vendeur expirée. Reconnectez-vous.");

  const { layout } = parseLayout(seller.metadata, seller.name);

  return { layout, name: seller.name };
}

export async function addBlockAction(formData: FormData) {
  const type = String(formData.get("type") || "") as BlockType;

  if (!BLOCK_CATALOG.some((entry) => entry.type === type)) {
    fail("Ce type de bloc n'existe pas.");
  }

  const { layout } = await currentLayout();

  const content: Block[] = [...layout.content, { type, props: {} }];

  const saved = await saveStorefrontLayout({ ...layout, content });

  if (!saved.ok) fail(saved.reason);

  done("Bloc ajouté. Renseignez son contenu ci-dessous.");
}

export async function removeBlockAction(formData: FormData) {
  const index = Number(formData.get("index"));

  const { layout } = await currentLayout();

  if (!Number.isInteger(index) || index < 0 || index >= layout.content.length) {
    fail("Ce bloc n'existe plus.");
  }

  const content = layout.content.filter((_, position) => position !== index);

  const saved = await saveStorefrontLayout({ ...layout, content });

  if (!saved.ok) fail(saved.reason);

  done("Bloc retiré.");
}

export async function moveBlockAction(formData: FormData) {
  const index = Number(formData.get("index"));
  const direction = String(formData.get("direction") || "");

  const { layout } = await currentLayout();

  const target = direction === "up" ? index - 1 : index + 1;

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= layout.content.length ||
    target < 0 ||
    target >= layout.content.length
  ) {
    /* Déplacement hors limites : sans effet, et sans message d'erreur. */
    done();
  }

  const content = [...layout.content];
  [content[index], content[target]] = [content[target], content[index]];

  const saved = await saveStorefrontLayout({ ...layout, content });

  if (!saved.ok) fail(saved.reason);

  done();
}

export async function updateBlockAction(formData: FormData) {
  const index = Number(formData.get("index"));

  const { layout } = await currentLayout();

  if (!Number.isInteger(index) || index < 0 || index >= layout.content.length) {
    fail("Ce bloc n'existe plus.");
  }

  const type = layout.content[index].type;
  const definition = blockDefinition(type);

  if (!definition) fail("Ce type de bloc n'existe plus.");

  const raw: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("prop_")) continue;

    const name = key.slice(5);
    const text = String(value).trim();

    if (!text) continue;

    if (definition.fields.find((field) => field.name === name)?.kind === "faq") {
      try {
        raw[name] = JSON.parse(text);
      } catch {
        fail("La liste des questions n'est pas un JSON valide.");
      }
      continue;
    }

    raw[name] = text;
  }

  /*
    Le formulaire ne décide pas de ce qui est enregistré : `sanitizeProps`
    ne retient que les champs déclarés pour ce type de bloc, dans le type
    déclaré. Un champ ajouté au formulaire par le navigateur n'atteint pas
    la base.
  */
  const content = [...layout.content];
  content[index] = { type, props: sanitizeProps(type, raw) };

  const saved = await saveStorefrontLayout({ ...layout, content });

  if (!saved.ok) fail(saved.reason);

  done("Bloc enregistré.");
}
