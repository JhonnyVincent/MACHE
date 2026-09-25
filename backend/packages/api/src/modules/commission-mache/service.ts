/*
  FOURNISSEUR DE COMMISSION : celui de MACHÉ.

  CE QU'IL NE FAIT PAS : recalculer les taux.

  Il DÉLÈGUE au fournisseur `system` de Mercur — correspondance des
  taux, règles, spécificité, devises, taxes, frais de port — puis
  corrige une seule chose : ce que MACHÉ a décidé de financer.

  Réécrire cette logique reviendrait à entretenir une copie du travail
  de Mercur qui prendrait du retard à chaque mise à jour, sur le calcul
  qui détermine ce que chaque vendeur est payé. Ici, si Mercur corrige
  sa correspondance de taux, MACHÉ en bénéficie sans rien faire.

  LA RÈGLE, EN UNE LIGNE

      commission = (ce que Mercur calcule)  −  m × D

  où D est la remise appliquée à l'article et m la part que MACHÉ a
  décidé de porter (0 = le vendeur, 1 = MACHÉ, entre les deux = partagé).

  Pourquoi c'est exactement ce qu'il faut

  Mercur calcule déjà sa commission sur le prix PLEIN, remise ignorée.
  Donc :

  - Promo du VENDEUR (m = 0) : rien ne change. Le vendeur encaisse moins
    et supporte seul sa remise ; le chiffre d'affaires de MACHÉ n'est
    pas touché. C'est la décision prise pour MACHÉ, et elle a le mérite
    de ne rien modifier au cas courant.

  - Promo de MACHÉ (m = 1) : on retire la remise entière de la
    commission. Le vendeur touche alors exactement ce qu'il aurait
    touché sans promo — son chiffre d'affaires est intact, c'est MACHÉ
    qui paie. La commission peut devenir NÉGATIVE : c'est le geste
    commercial, et il est enregistré tel quel.

  Vérifié : Mercur ne ramène pas une commission négative à zéro. Ni le
  fournisseur, ni le service, ni l'étape, ni l'enregistrement ne
  plafonnent, et la colonne est un `numeric` qui accepte les négatifs.
  Si ce n'était pas le cas, une promo MACHÉ serait silencieusement
  payée par le vendeur — exactement ce que ce fichier existe pour
  empêcher.

  D'OÙ VIENT LA REMISE FINANCÉE

  Pas des champs standards : le contexte de calcul ne transporte pas
  les promotions appliquées. Mercur prévoit `additional_context`,
  rempli par le hook `setCommissionContext`, pour précisément ce genre
  de données. Le hook y dépose, par article, le montant que MACHÉ
  finance ; ce fichier ne fait que le lire.
*/

import { MathBN } from "@medusajs/framework/utils";

/* La clé sous laquelle le hook dépose sa contribution. */
export const MACHE_FUNDING_KEY = "mache_funded_discounts";

/* Par article : le montant, dans la devise de la commande, que MACHÉ porte. */
export type MacheFunding = Record<string, number>;

type CommissionLine = {
  item_id?: string | null;
  shipping_method_id?: string | null;
  commission_rate_id?: string | null;
  provider_id?: string;
  code: string;
  rate: number;
  amount: number | string;
  description?: string | null;
  data?: Record<string, unknown> | null;
};

type Context = {
  currency_code: string;
  order_id?: string;
  seller_id?: string;
  items?: { id: string }[];
  shipping_methods?: { id: string }[];
  additional_context?: Record<string, unknown>;
};

type Delegate = {
  getCommissionLines: (context: Context) => Promise<CommissionLine[]>;
};

/*
  Le fournisseur de Mercur est déjà enregistré dans le conteneur sous
  ce nom par son propre chargeur, qui s'exécute avant les fournisseurs
  déclarés en options. On le résout plutôt que de l'instancier : ainsi
  il reçoit les mêmes dépendances, et un changement de sa construction
  ne casse rien ici.
*/
const SYSTEM_PROVIDER_KEY = "cp_system";

export class MacheCommissionProvider {
  static identifier = "mache";

  private readonly container_: Record<string, unknown>;

  constructor(container: Record<string, unknown>) {
    this.container_ = container;
  }

  private system(): Delegate {
    const provider = this.container_[SYSTEM_PROVIDER_KEY] as Delegate | undefined;

    if (!provider?.getCommissionLines) {
      /*
        Échouer bruyamment. Retomber sur un calcul maison ici
        produirait des commissions silencieusement différentes de
        celles de Mercur — et personne ne s'en apercevrait avant de
        comparer des relevés.
      */
      throw new Error(
        "Le fournisseur de commission de Mercur est introuvable. MACHÉ délègue son calcul : il ne peut pas s'en passer."
      );
    }

    return provider;
  }

  /*
    Signer la ligne.

    Le fournisseur de Mercur inscrit lui-même `provider_id: "system"`
    sur chaque ligne qu'il fabrique. Comme on les relaie, cette
    étiquette survivrait à la délégation : la commission serait
    attribuée à un fournisseur qui n'a pas produit le montant final, et
    `commission_line.provider_id` — qui ne sert qu'à ça — mentirait.
    C'est aussi la seule façon de vérifier de l'extérieur quel
    fournisseur est réellement actif.
  */
  private sign(line: CommissionLine): CommissionLine {
    return { ...line, provider_id: MacheCommissionProvider.identifier };
  }

  async getCommissionLines(context: Context): Promise<CommissionLine[]> {
    const lines = await this.system().getCommissionLines(context);

    const funded = (context.additional_context?.[MACHE_FUNDING_KEY] ??
      {}) as MacheFunding;

    /* Aucune promo financée par MACHÉ : on rend le calcul de Mercur tel quel. */
    if (!funded || Object.keys(funded).length === 0) {
      return lines.map((line) => this.sign(line));
    }

    return lines.map((line) => {
      /*
        Seules les lignes d'article portent une remise. Une ligne de
        frais de port n'en porte pas, et lui en retirer une reviendrait
        à faire payer deux fois la même remise à MACHÉ.
      */
      if (!line.item_id) return this.sign(line);

      const contribution = Number(funded[line.item_id]);

      if (!Number.isFinite(contribution) || contribution <= 0) {
        return this.sign(line);
      }

      const amount = MathBN.sub(line.amount, contribution);

      return {
        ...this.sign(line),
        amount: MathBN.convert(amount).toNumber(),
        /*
          La contribution est inscrite sur la ligne. Sans cela, une
          commission de −240 serait un chiffre inexplicable six mois
          plus tard : on saurait qu'on a payé, pas pourquoi.
        */
        data: {
          ...(line.data ?? {}),
          mache_funded_discount: contribution,
          mache_commission_before_funding: Number(line.amount),
        },
        description:
          line.description ??
          `Commission réduite de ${contribution} : promotion financée par MACHÉ`,
      };
    });
  }
}

export default MacheCommissionProvider;
