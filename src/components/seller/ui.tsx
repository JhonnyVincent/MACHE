/*
  Primitives de l'espace vendeur.

  Registre visuel : outil de gestion, pas vitrine. Angles quasi droits
  (3 px), traits fins, densité élevée, couleur réservée au statut et aux
  actions. Le rouge de marque ne sert qu'aux actions et aux alertes ;
  partout ailleurs, du gris et du noir.
*/

import Link from "next/link";
import type { ReactNode } from "react";

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
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-[#d5d9d9] pb-3">
      <div>
        <h1 className="text-[20px] font-semibold leading-tight tracking-[-0.01em] text-[#0f1111]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[12.5px] leading-relaxed text-[#565959]">
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
    <section className="rounded-[3px] border border-[#d5d9d9] bg-white">
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e3e6e6] px-4 py-2.5">
          <div>
            {title && (
              <h2 className="text-[13.5px] font-semibold text-[#0f1111]">{title}</h2>
            )}
            {description && (
              <p className="mt-0.5 text-[11.5px] text-[#565959]">{description}</p>
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
    <div className="overflow-hidden rounded-[3px] border border-[#d5d9d9] bg-white">
      <div className="-mb-px -mr-px grid grid-cols-2 [&>*]:border-b [&>*]:border-r [&>*]:border-[#e3e6e6] sm:grid-cols-3 xl:grid-cols-5">
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
    default: "text-[#0f1111]",
    warning: "text-[#b45309]",
    danger: "text-[#b01124]",
    success: "text-[#046c4e]",
  }[tone];

  return (
    <div className="bg-white px-3.5 py-3">
      <p className="text-[10.5px] font-medium uppercase tracking-[0.07em] text-[#565959]">
        {label}
      </p>
      <p className={`tnum mt-1.5 text-[21px] font-semibold leading-none ${toneClass}`}>
        {value}
      </p>
      {hint && <p className="mt-1.5 text-[11px] leading-snug text-[#767676]">{hint}</p>}
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
      <table className="w-full min-w-[560px] border-collapse text-[12.5px]">
        <thead>
          <tr className="border-b border-[#d5d9d9] bg-[#f7f8f8]">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={column.width ? { width: column.width } : undefined}
                className={`px-3 py-2 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#565959] ${
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
    <tr className="border-b border-[#e3e6e6] last:border-0 hover:bg-[#f7fafa]">
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
      } ${strong ? "font-semibold text-[#0f1111]" : muted ? "text-[#565959]" : "text-[#0f1111]"} ${
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
    neutral: "border-[#d5d9d9] bg-[#f7f8f8] text-[#565959]",
    success: "border-[#b7dfc9] bg-[#eefaf3] text-[#046c4e]",
    warning: "border-[#f3d9a5] bg-[#fdf6e8] text-[#946200]",
    danger: "border-[#f2c2c8] bg-[#fdeaec] text-[#b01124]",
    info: "border-[#c2d4f0] bg-[#eef3fc] text-[#1d3357]",
  }[tone];

  return (
    <span
      className={`inline-flex items-center rounded-[2px] border px-1.5 py-0.5 text-[10.5px] font-medium ${toneClass}`}
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
    "inline-flex items-center justify-center gap-1.5 rounded-[3px] font-medium transition-colors whitespace-nowrap";

  const sizeClass = size === "sm" ? "px-2.5 py-1 text-[11.5px]" : "px-3 py-1.5 text-[12.5px]";

  const variantClass = {
    primary: "bg-[#d2162c] text-white hover:bg-[#b01124]",
    secondary:
      "border border-[#8d9096] bg-white text-[#0f1111] hover:bg-[#f7fafa] shadow-[0_1px_0_rgba(0,0,0,0.05)]",
    ghost: "text-[#d2162c] hover:underline",
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
      <p className="text-[13.5px] font-semibold text-[#0f1111]">{title}</p>
      {description && (
        <p className="mx-auto mt-1.5 max-w-md text-[12.5px] leading-relaxed text-[#565959]">
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
    info: "border-[#c2d4f0] bg-[#eef3fc]",
    warning: "border-[#f3d9a5] bg-[#fdf6e8]",
    danger: "border-[#f2c2c8] bg-[#fdeaec]",
  }[tone];

  return (
    <div className={`rounded-[3px] border px-3.5 py-3 ${toneClass}`}>
      <p className="text-[12.5px] font-semibold text-[#0f1111]">{title}</p>
      {children && (
        <div className="mt-1 text-[12px] leading-relaxed text-[#565959]">{children}</div>
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
        ? "bg-[#b01124]"
        : percent >= 80
          ? "bg-[#b45309]"
          : "bg-[#565959]"
      : percent >= 70
        ? "bg-[#046c4e]"
        : percent >= 35
          ? "bg-[#b45309]"
          : "bg-[#b01124]";

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-1.5 w-full overflow-hidden rounded-[2px] bg-[#e3e6e6]"
    >
      <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
    </div>
  );
}
