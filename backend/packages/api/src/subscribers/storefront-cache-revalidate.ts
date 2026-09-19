import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  OfferWorkflowEvents,
  ProductWorkflowEvents,
} from "@mercurjs/core/workflows"

type EventPayload = {
  id?: string
  product_id?: string
  seller_id?: string
}

const resolveProductHandle = async (
  container: SubscriberArgs["container"],
  productId?: string
): Promise<string | undefined> => {
  if (!productId) {
    return undefined
  }

  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "product",
      fields: ["handle"],
      filters: { id: productId },
    })
    return data?.[0]?.handle
  } catch {
    return undefined
  }
}

/*
  Les étiquettes envoyées au site.

  Leur orthographe est celle qu'emploie le site dans
  `src/lib/medusa/catalog.ts`. Next ne vide que ce qui porte exactement
  le nom reçu : une étiquette « product-<handle> » envoyée à un site qui
  range sous « product:<handle> » ne correspond à rien, sans erreur et
  sans journal. C'était le cas, et le cache ne se vidait donc jamais au
  niveau d'une fiche produit.

  Toute modification ici doit être reportée là-bas.
*/
/*
  La boutique à laquelle appartient une offre.

  L'évènement ne transporte que l'identifiant de l'offre : le vendeur
  doit être relu. Sans lui, la page de la boutique gardait en cache une
  liste de produits que l'offre venait de changer.
*/
const resolveOfferSeller = async (
  container: SubscriberArgs["container"],
  offerId?: string
): Promise<string | undefined> => {
  if (!offerId) {
    return undefined
  }

  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "offer",
      fields: ["seller_id"],
      filters: { id: offerId },
    })
    return data?.[0]?.seller_id
  } catch {
    return undefined
  }
}

const buildTags = async (
  container: SubscriberArgs["container"],
  eventName: string,
  payload: EventPayload
): Promise<string[]> => {
  const tags = new Set<string>(["products"])

  const isOffer = eventName.startsWith("offer.")
  const productId = isOffer ? payload.product_id : payload.id

  const handle = await resolveProductHandle(container, productId)
  if (handle) {
    tags.add(`product:${handle}`)
  }

  if (isOffer) {
    /*
      Une offre qui change modifie aussi ce que la boutique propose : sa
      page liste ses produits à partir de ses offres.
    */
    tags.add("offers")

    const sellerId =
      payload.seller_id ?? (await resolveOfferSeller(container, payload.id))

    if (sellerId) {
      tags.add(`seller-id:${sellerId}`)
    }
  }

  return [...tags]
}

/*
  Où appeler pour invalider le cache du site.

  Le chemin est fixé par le site, pas par une variable d'environnement.
  STOREFRONT_REVALIDATE_URL se renseignait avec l'adresse du site tout
  court — c'est ce que disait la documentation de déploiement — et les
  appels partaient alors sur la page d'accueil, qui répond 200 sans rien
  invalider. La panne était donc parfaitement invisible : aucune erreur
  dans les journaux, et un cache qui ne se vidait jamais. Constaté ici en
  la reproduisant.

  Une adresse sans chemin est donc complétée. Une adresse qui en porte un
  est respectée telle quelle : c'est le cas d'un site servi depuis un
  sous-chemin, où deviner serait pire que de laisser faire.
*/
const REVALIDATE_PATH = "/api/revalidate"

/* Au-delà, le site ne répond pas : attendre davantage ne sert à rien. */
const REVALIDATE_TIMEOUT_MS = 3_000

/* Compte les échecs consécutifs, pour ne pas répéter la même erreur. */
let failures = 0

const resolveRevalidateUrl = (): string => {
  const explicit = (process.env.STOREFRONT_REVALIDATE_URL || "").trim()

  if (explicit) {
    try {
      const parsed = new URL(explicit)

      if (parsed.pathname === "/" || parsed.pathname === "") {
        parsed.pathname = REVALIDATE_PATH
        return parsed.toString()
      }

      return explicit
    } catch {
      /* Adresse inexploitable : on retombe sur celle du site. */
    }
  }

  const storefront = (process.env.STOREFRONT_URL || "").replace(/\/+$/, "")

  return storefront ? `${storefront}${REVALIDATE_PATH}` : ""
}

export default async function storefrontCacheRevalidateHandler({
  event,
  container,
}: SubscriberArgs<EventPayload | EventPayload[]>) {
  const url = resolveRevalidateUrl()
  const secret = process.env.STOREFRONT_REVALIDATE_SECRET

  if (!url || !secret) {
    return
  }

  const payloads = Array.isArray(event.data) ? event.data : [event.data]

  const tagSet = new Set<string>()
  for (const payload of payloads) {
    const tags = await buildTags(container, event.name, payload ?? {})
    tags.forEach((tag) => tagSet.add(tag))
  }

  if (tagSet.size === 0) {
    return
  }

  /*
    Un appel sans délai maximal rend le moteur commerce dépendant de la
    vitesse du site. Trois secondes suffisent largement pour une purge de
    cache ; au-delà, c'est que le site ne répond pas, et l'attente ne
    servirait qu'à ralentir la suite.

    Constaté au chargement du catalogue de démonstration : deux cent
    quarante-quatre offres créées, deux cent quarante-quatre appels vers
    un site absent, chacun attendant l'expiration par défaut du système.
  */
  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": secret,
      },
      body: JSON.stringify({ tags: [...tagSet] }),
      signal: AbortSignal.timeout(REVALIDATE_TIMEOUT_MS),
    })

    failures = 0
  } catch (error) {
    failures += 1

    /*
      On ne répète pas la même erreur cent fois. Les trois premières
      sont écrites, puis une sur cinquante : un journal qui se répète
      cache ce qui s'y passe d'autre, et le chargement d'un catalogue
      complet le remplissait à lui seul.
    */
    if (failures <= 3 || failures % 50 === 0) {
      console.error(
        `[storefront-cache-revalidate] échec n°${failures} vers ${url} :`,
        error instanceof Error ? error.message : error
      )
    }
  }
}

export const config: SubscriberConfig = {
  event: [
    OfferWorkflowEvents.CREATED,
    OfferWorkflowEvents.UPDATED,
    OfferWorkflowEvents.DELETED,
    ProductWorkflowEvents.PUBLISHED,
    ProductWorkflowEvents.REJECTED,
    "product.updated",
  ],
  context: {
    subscriberId: "storefront-cache-revalidate-handler",
  },
}
