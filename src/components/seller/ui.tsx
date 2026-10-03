/*
  Primitives de l'espace vendeur.

  Registre visuel : outil de gestion, pas vitrine. Angles quasi droits
  (3 px), traits fins, densité élevée, couleur réservée au statut et aux
  actions. Le rouge de marque ne sert qu'aux actions et aux alertes ;
  partout ailleurs, du gris et du noir.
*/

import { Link } from "next-view-transitions";
import type {
  ReactNode,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
} from "react";

/* -------------------------------------------------------------------------- */
/* Structure de page                                                          */
/* -------------------------------------------------------------------------- */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--mache-line)] pb-3">
      <div>
        <h1 className="text-xl font-semibold leading-tight tracking-tight text-[var(--mache-text)]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm leading-relaxed text-[var(--mache-muted)]">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  padded = true,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <section className="rounded-[4px] border border-[var(--mache-line)] bg-white">
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--mache-line)] px-4 py-2.5">
          <div>
            {title && (
              <h2 className="text-base font-semibold text-[var(--mache-text)]">{title}</h2>
            )}
            {description && (
              <p className="mt-0.5 text-xs text-[var(--mache-muted)]">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={padded ? "p-4" : ""}>{children}</div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Indicateurs                                                                */
/* -------------------------------------------------------------------------- */

/*
  Les séparateurs sont portés par les cellules, et non par un fond gris
  visible à travers un `gap`. Sinon, quand le nombre d'indicateurs ne
  tombe pas juste sur le nombre de colonnes — cinq indicateurs sur deux
  colonnes en mobile — la place inoccupée apparaît comme une case grise
  vide. Le débord est masqué par `overflow-hidden`.
*/
export function StatRow({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[4px] border border-[var(--mache-line)] bg-white">
      <div className="-mb-px -mr-px grid grid-cols-2 [&>*]:border-b [&>*]:border-r [&>*]:border-[var(--mache-line)] sm:grid-cols-3 xl:grid-cols-5">
        {children}
      </div>
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const toneClass = {
    default: "text-[var(--mache-text)]",
    warning: "text-[var(--mache-warn-text)]",
    danger: "text-[var(--mache-danger-text)]",
    success: "text-[var(--mache-success)]",
  }[tone];

  return (
    <div className="bg-white px-3.5 py-3">
      <p className="text-2xs font-medium tracking-label text-[var(--mache-muted)]">
        {label}
      </p>
      <p className={`tnum mt-1.5 text-xl font-semibold leading-none ${toneClass}`}>
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs leading-snug text-[var(--mache-muted)]">{hint}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tableaux                                                                   */
/* -------------------------------------------------------------------------- */

export function Table({
  columns,
  children,
}: {
  columns: { key: string; label: string; align?: "left" | "right" | "center"; width?: string }[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--mache-line)] bg-[var(--mache-bg-2)]">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={column.width ? { width: column.width } : undefined}
                className={`px-3 py-2 text-2xs font-semibold tracking-label text-[var(--mache-muted)] ${
                  column.align === "right"
                    ? "text-right"
                    : column.align === "center"
                      ? "text-center"
                      : "text-left"
                }`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return (
    <tr className="border-b border-[var(--mache-line)] last:border-0 hover:bg-[var(--mache-bg-2)]">
      {children}
    </tr>
  );
}

export function Cell({
  children,
  align = "left",
  strong,
  muted,
  numeric,
}: {
  children: ReactNode;
  align?: "left" | "right" | "center";
  strong?: boolean;
  muted?: boolean;
  numeric?: boolean;
}) {
  return (
    <td
      className={`px-3 py-2.5 align-middle ${
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
      } ${strong ? "font-semibold text-[var(--mache-text)]" : muted ? "text-[var(--mache-muted)]" : "text-[var(--mache-text)]"} ${
        numeric ? "tnum" : ""
      }`}
    >
      {children}
    </td>
  );
}

/* -------------------------------------------------------------------------- */
/* Éléments                                                                   */
/* -------------------------------------------------------------------------- */

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const toneClass = {
    neutral: "border-[var(--mache-line)] bg-[var(--mache-bg-2)] text-[var(--mache-muted)]",
    success: "border-[var(--mache-success-line)] bg-[var(--mache-success-soft)] text-[var(--mache-success)]",
    warning: "border-[var(--mache-warn-line)] bg-[var(--mache-warn-soft)] text-[var(--mache-warn-text)]",
    danger: "border-[var(--mache-danger-line)] bg-[var(--mache-danger-soft)] text-[var(--mache-danger-text)]",
    info: "border-[var(--mache-info-line)] bg-[var(--mache-info-soft)] text-[#1d3357]",
  }[tone];

  return (
    <span
      className={`inline-flex items-center rounded-[4px] border px-1.5 py-0.5 text-2xs font-medium ${toneClass}`}
    >
      {children}
    </span>
  );
}

export function Button({
  href,
  children,
  variant = "secondary",
  type,
  size = "md",
}: {
  href?: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  type?: "submit" | "button";
  size?: "sm" | "md";
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-[4px] font-medium transition-colors whitespace-nowrap";

  const sizeClass = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";

  const variantClass = {
    primary: "bg-[var(--mache-primary)] text-white hover:bg-[var(--mache-danger-text)]",
    secondary:
      "border border-[var(--mache-light)] bg-white text-[var(--mache-text)] hover:bg-[var(--mache-bg-2)] shadow-soft",
    ghost: "text-[var(--mache-primary)] hover:underline",
  }[variant];

  const className = `${base} ${sizeClass} ${variantClass}`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type || "button"} className={className}>
      {children}
    </button>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-4 py-10 text-center">
      <p className="text-base font-semibold text-[var(--mache-text)]">{title}</p>
      {description && (
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-[var(--mache-muted)]">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Notice({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warning" | "danger";
  title: string;
  children?: ReactNode;
}) {
  const toneClass = {
    info: "border-[var(--mache-info-line)] bg-[var(--mache-info-soft)]",
    warning: "border-[var(--mache-warn-line)] bg-[var(--mache-warn-soft)]",
    danger: "border-[var(--mache-danger-line)] bg-[var(--mache-danger-soft)]",
  }[tone];

  return (
    <div className={`rounded-[4px] border px-3.5 py-3 ${toneClass}`}>
      <p className="text-sm font-semibold text-[var(--mache-text)]">{title}</p>
      {children && (
        <div className="mt-1 text-sm leading-relaxed text-[var(--mache-muted)]">{children}</div>
      )}
    </div>
  );
}

/*
  Barre de progression sobre : un trait, pas un ruban coloré.

  `intent` dit comment lire le remplissage, faute de quoi la couleur ment :

  - "progress" : plus c'est rempli, mieux c'est (avancement d'un dossier) ;
  - "capacity" : plus c'est rempli, plus la limite approche (quota de
    boutiques ou de produits). Une jauge pleine y est un avertissement,
    pas une réussite.
*/
export function Meter({
  value,
  max = 100,
  intent = "progress",
}: {
  value: number;
  max?: number;
  intent?: "progress" | "capacity";
}) {
  const percent = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0));

  const color =
    intent === "capacity"
      ? percent >= 100
        ? "bg-[var(--mache-danger-text)]"
        : percent >= 80
          ? "bg-[var(--mache-warn-text)]"
          : "bg-[var(--mache-muted)]"
      : percent >= 70
        ? "bg-[var(--mache-success)]"
        : percent >= 35
          ? "bg-[var(--mache-warn-text)]"
          : "bg-[var(--mache-danger-text)]";

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-1.5 w-full overflow-hidden rounded-[4px] bg-[var(--mache-line)]"
    >
      <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Formulaires                                                                */
/* -------------------------------------------------------------------------- */

/*
  Les pages vendeur qui écrivent en base (boutique, apparence, documents)
  partagent le même gabarit de champ : libellé au-dessus, aide en dessous,
  contrôle au trait fin. Le définir ici évite que chaque formulaire
  réinvente ses marges et que l'espace vendeur se mette à ressembler à
  cinq applications différentes.
*/
export function Field({
  label,
  htmlFor,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-semibold text-[var(--mache-text)]"
      >
        {label}
        {required && <span className="ml-1 text-[var(--mache-danger-text)]">*</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1.5 text-xs leading-snug text-[var(--mache-muted)]">{hint}</p>}
    </div>
  );
}

const CONTROL_CLASS =
  "w-full rounded-[4px] border border-[var(--mache-light)] bg-white px-2.5 py-1.5 text-sm text-[var(--mache-text)] outline-none transition-colors placeholder:text-[var(--mache-light)] focus:border-[var(--mache-primary)] focus:ring-1 focus:ring-[var(--mache-primary)]/30 disabled:bg-[var(--mache-bg-2)] disabled:text-[var(--mache-muted)]";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input {...rest} className={`${CONTROL_CLASS} ${className || ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return (
    <textarea {...rest} className={`${CONTROL_CLASS} leading-relaxed ${className || ""}`} />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, children, ...rest } = props;
  return (
    <select {...rest} className={`${CONTROL_CLASS} ${className || ""}`}>
      {children}
    </select>
  );
}

/*
  Bandeau de retour d'une action serveur. Les actions vendeur communiquent
  par `?success=` / `?error=` : un seul composant les rend, sinon chaque
  page invente son propre message.
*/
export function FormFeedback({
  success,
  error,
  successMessages,
}: {
  success?: string;
  error?: string;
  successMessages?: Record<string, string>;
}) {
  if (error) {
    return (
      <Notice tone="danger" title="Modification refusée">
        {decodeURIComponent(error)}
      </Notice>
    );
  }

  if (success) {
    return (
      <Notice tone="info" title="Enregistré">
        {successMessages?.[success] || "Les modifications ont été enregistrées."}
      </Notice>
    );
  }

  return null;
}
