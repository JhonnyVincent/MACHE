"use server";

/*
  ACTIONS : créer un point de retrait, l'ouvrir, le fermer, désigner
  qui le tient.

  AUCUNE NE SUPPRIME

  Un point fermé garde les livraisons qui y ont transité. Effacer la
  ligne rendrait illisible un suivi qui dirait « déposé chez » suivi de
  rien. Fermer retire le point du choix des vendeurs et des clients à
  l'instant même, et c'est réversible — c'est tout ce qu'on veut.

  Le code n'est pas modifiable après coup : il est imprimé sur des
  colis et répété au téléphone. Le renommer ferait pointer ces
  références vers rien.

  La session est revérifiée dans chaque action : entre l'affichage de
  la page et le clic, elle a pu expirer.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  getAdminUser,
  createRelayPoint,
  setRelayPointOpen,
  setRelayPointKeeper,
} from "@/lib/medusa/admin";
import { isControlFlow, reasonOf } from "@/lib/safe-action";

const PAGE = "/dashboard/admin/points-de-retrait";

function done(params: Record<string, string>): never {
  redirect(`${PAGE}?${new URLSearchParams(params).toString()}`);
}

function field(formData: FormData, name: string): string {
  return String(formData.get(name) || "").trim();
}

export async function createRelayPointAction(formData: FormData) {
  const name = field(formData, "name");
  const code = field(formData, "code");
  const department = field(formData, "department");
  const address = field(formData, "address");

  if (!name || !department || !address) {
    done({
      erreur:
        "Un point de retrait a besoin d'un nom, d'un département et d'une adresse : c'est ce qu'un client lira pour s'y rendre.",
    });
  }

  if (!code) {
    done({
      erreur:
        "Le code court est obligatoire — par exemple PAP-DEL-02. C'est lui que le client répète au téléphone.",
    });
  }

  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  try {
    const result = await createRelayPoint({
      name,
      code,
      department,
      address,
      commune: field(formData, "commune"),
      landmark: field(formData, "landmark"),
      phonePublic: field(formData, "phone_public"),
      openingHours: field(formData, "opening_hours"),
      agentCustomerId: field(formData, "agent_customer_id"),
      note: field(formData, "note"),
    });

    if (!result.ok) done({ erreur: result.reason });

    revalidatePath(PAGE);

    done({
      fait: `Point « ${result.data.name} » ouvert sous le code ${result.data.code}. Les vendeurs peuvent désormais y envoyer des colis.`,
    });
  } catch (error) {
    if (isControlFlow(error)) throw error;

    done({ erreur: reasonOf(error) });
  }
}

export async function setOpenAction(formData: FormData) {
  const id = field(formData, "relay_point_id");
  const open = field(formData, "open") === "true";

  if (!id) done({ erreur: "Point de retrait manquant." });

  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  try {
    const result = await setRelayPointOpen(id, open);

    if (!result.ok) done({ erreur: result.reason });

    revalidatePath(PAGE);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    done({ erreur: reasonOf(error) });
  }

  done({
    fait: open
      ? "Point rouvert. Il réapparaît dans le choix des vendeurs et des clients."
      : "Point fermé. Il disparaît du choix des vendeurs, et les livraisons qui y ont transité restent lisibles.",
  });
}

export async function setKeeperAction(formData: FormData) {
  const id = field(formData, "relay_point_id");
  const keeper = field(formData, "agent_customer_id");

  if (!id) done({ erreur: "Point de retrait manquant." });

  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  try {
    /*
      Un champ vide RETIRE le tenant, il ne le laisse pas en place. Un
      point sans tenant désigné est un état normal : les colis qui y
      attendent ne bougent pas pour autant.
    */
    const result = await setRelayPointKeeper(id, keeper || null);

    if (!result.ok) done({ erreur: result.reason });

    revalidatePath(PAGE);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    done({ erreur: reasonOf(error) });
  }

  done({
    fait: keeper
      ? "Tenant enregistré."
      : "Tenant retiré. Le point reste ouvert, et les colis qui y attendent n'ont pas bougé.",
  });
}
