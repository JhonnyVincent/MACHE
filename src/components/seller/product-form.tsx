/*
  COMPOSANT : formulaire produit du back-office vendeur.

  Le même formulaire sert à créer et à modifier : deux gabarits distincts
  finissaient toujours par diverger — l'un demandait une image, l'autre
  non, l'un envoyait `image_url`, l'autre `image_urls`. Ici, les champs
  envoyés sont les mêmes des deux côtés, et src/lib/products.ts les lit
  d'une seule façon.

  Le champ « statut » n'existe pas : le vendeur exprime une intention
  (en ligne, en pause, brouillon) et le serveur en déduit le statut réel.
  Un formulaire ne doit pas pouvoir imposer « en ligne » quand MACHÉ exige
  un examen.
*/

import { CATEGORY_OPTIONS, categoryLabel } from "@/lib/categories";
import { PUBLISH_INTENT_LABELS, type PublishIntent } from "@/lib/products";
import { Field, Input, Textarea, Select, Button } from "@/components/seller/ui";

export type ProductFormDefaults = {
  title?: string;
  slug?: string;
  description?: string;
  category?: string;
  price?: number | null;
  stock?: number | null;
  imageUrls?: string[];
  intent?: PublishIntent;
};

export function ProductForm({
  action,
  hidden,
  defaults = {},
  submitLabel,
  storeVerified,
}: {
  action: (formData: FormData) => void | Promise<void>;
  hidden?: Record<string, string>;
  defaults?: ProductFormDefaults;
  submitLabel: string;
  storeVerified: boolean;
}) {
  const images = defaults.imageUrls ?? [];

  return (
    <form action={action} className="max-w-2xl space-y-4">
      {Object.entries(hidden ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      <Field label="Nom du produit" htmlFor="title" required>
        <Input
          id="title"
          name="title"
          required
          maxLength={140}
          defaultValue={defaults.title || ""}
          placeholder="Ex : Robe en coton, taille M"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Prix"
          htmlFor="price"
          required
          hint="En gourdes (HTG), sans espace ni symbole."
        >
          <Input
            id="price"
            name="price"
            type="number"
            min={1}
            step="1"
            required
            inputMode="numeric"
            defaultValue={defaults.price ?? ""}
          />
        </Field>

        <Field
          label="Stock"
          htmlFor="stock"
          hint="Nombre d'exemplaires disponibles à la vente."
        >
          <Input
            id="stock"
            name="stock"
            type="number"
            min={0}
            step="1"
            inputMode="numeric"
            defaultValue={defaults.stock ?? 0}
          />
        </Field>
      </div>

      <Field
        label="Catégorie"
        htmlFor="category"
        required
        hint={
          defaults.category
            ? `Actuellement : ${categoryLabel(defaults.category)}`
            : "Sans catégorie, le produit ne remonte dans aucune rubrique."
        }
      >
        <Select id="category" name="category" required defaultValue={defaults.category || ""}>
          <option value="">Choisir une catégorie</option>
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.slug} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Description"
        htmlFor="description"
        hint="Matière, taille, couleur, état, ce qui est inclus. C'est ce qui évite les retours."
      >
        <Textarea
          id="description"
          name="description"
          rows={6}
          defaultValue={defaults.description || ""}
        />
      </Field>

      <Field
        label="Images"
        htmlFor="image_urls"
        hint="Une adresse par ligne, dix au maximum. La première sert de vignette. L'envoi direct de fichiers demande un espace de stockage qui n'est pas encore raccordé."
      >
        <Textarea
          id="image_urls"
          name="image_urls"
          rows={3}
          defaultValue={images.join("\n")}
          placeholder="https://…"
        />
      </Field>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url) => (
            <span
              key={url}
              className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[3px] border border-[#e3e6e6] bg-[#f7f8f8]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </span>
          ))}
        </div>
      )}

      <Field
        label="Publication"
        htmlFor="intent"
        hint={
          storeVerified
            ? "Un produit mis en ligne devient visible des clients, sauf si MACHÉ impose un examen."
            : "Votre boutique n'étant pas encore vérifiée, un produit mis en ligne passera d'abord par un examen."
        }
      >
        <Select id="intent" name="intent" defaultValue={defaults.intent || "draft"}>
          {(["online", "paused", "draft"] as PublishIntent[]).map((intent) => (
            <option key={intent} value={intent}>
              {PUBLISH_INTENT_LABELS[intent]}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Adresse du produit"
        htmlFor="slug"
        hint="Laissez vide pour la déduire du nom. La modifier casse les liens déjà partagés."
      >
        <Input id="slug" name="slug" defaultValue={defaults.slug || ""} placeholder="robe-coton-m" />
      </Field>

      <Button type="submit" variant="primary">
        {submitLabel}
      </Button>
    </form>
  );
}
