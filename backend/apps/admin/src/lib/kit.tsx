/*
  BOÎTE À OUTILS DES PAGES MACHE DU PANNEAU ADMIN.

  Les pages de l'ancien « MACHE Pilote » (qui vivaient sur le site public)
  sont désormais ici, dans le panneau d'administration : une seule porte,
  une seule connexion, et rien de visible sur le site.

  Ce fichier ne contient aucune règle métier : seulement des appels au
  backend et de quoi dessiner. Les couleurs viennent des variables du
  panneau, pour suivre son mode clair ou sombre.
*/

import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";

declare const __BACKEND_URL__: string;

export type Raw = Record<string, unknown>;

export async function api<T = Raw>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const base = typeof __BACKEND_URL__ === "string" ? __BACKEND_URL__ : "";

  const response = await fetch(`${base}${path}`, {
    method: init.method ?? "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  const payload = (await response.json().catch(() => ({}))) as Raw;

  if (!response.ok) {
    const message = typeof payload.message === "string" ? payload.message : `Le serveur a répondu ${response.status}.`;
    throw new Error(message);
  }

  return payload as T;
}

export function useLoad<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!path) return;
    let alive = true;
    setLoading(true);
    api<T>(path)
      .then((d) => alive && (setData(d), setError(null)))
      .catch((e: Error) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [path, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return { data, error, loading, reload };
}

/* Lance une action, garde son message de réussite ou d'échec. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const run = useCallback(async (job: () => Promise<unknown>, success: string) => {
    setBusy(true);
    setMessage(null);
    try {
      await job();
      setMessage({ tone: "ok", text: success });
      return true;
    } catch (e) {
      setMessage({ tone: "error", text: (e as Error).message });
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, message, run, clear: () => setMessage(null) };
}

export const s = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
export const n = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

/* ------------------------------ composants ------------------------------ */

const card: CSSProperties = {
  background: "var(--bg-base)",
  border: "1px solid var(--border-base)",
  borderRadius: 10,
};

export function Page({ title, subtitle, actions, children }: { title: string; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px 56px", color: "var(--fg-base)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{title}</h1>
          {subtitle && <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--fg-subtle)" }}>{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div style={{ display: "grid", gap: 16 }}>{children}</div>
    </div>
  );
}

export function Panel({ title, description, children }: { title?: string; description?: ReactNode; children: ReactNode }) {
  return (
    <section style={{ ...card, padding: 18 }}>
      {title && <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h2>}
      {description && <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--fg-subtle)" }}>{description}</p>}
      <div style={{ marginTop: title ? 14 : 0 }}>{children}</div>
    </section>
  );
}

const TONES = {
  neutral: { bg: "var(--tag-neutral-bg)", fg: "var(--tag-neutral-text)" },
  ok: { bg: "var(--tag-green-bg)", fg: "var(--tag-green-text)" },
  warn: { bg: "var(--tag-orange-bg)", fg: "var(--tag-orange-text)" },
  error: { bg: "var(--tag-red-bg)", fg: "var(--tag-red-text)" },
  info: { bg: "var(--tag-blue-bg)", fg: "var(--tag-blue-text)" },
};

export type Tone = keyof typeof TONES;

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span style={{ background: TONES[tone].bg, color: TONES[tone].fg, borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

export function Notice({ tone = "info", title, children }: { tone?: Tone; title?: string; children?: ReactNode }) {
  return (
    <div style={{ background: TONES[tone].bg, color: TONES[tone].fg, borderRadius: 10, padding: "12px 16px", fontSize: 14, lineHeight: 1.5 }}>
      {title && <strong style={{ display: "block", marginBottom: 2 }}>{title}</strong>}
      {children}
    </div>
  );
}

export function Feedback({ message }: { message: { tone: "ok" | "error"; text: string } | null }) {
  if (!message) return null;
  return <Notice tone={message.tone === "ok" ? "ok" : "error"}>{message.text}</Notice>;
}

export function Loading({ error, loading }: { error: string | null; loading: boolean }) {
  if (error) return <Notice tone="error" title="Ça ne s'affiche pas">{error}</Notice>;
  if (loading) return <p style={{ color: "var(--fg-subtle)", fontSize: 14 }}>Chargement…</p>;
  return null;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div style={{ ...card, padding: 28, textAlign: "center" }}>
      <strong>{title}</strong>
      {children && <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--fg-subtle)" }}>{children}</p>}
    </div>
  );
}

export function Btn({
  children,
  onClick,
  href,
  variant = "primary",
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const style: CSSProperties = {
    display: "inline-block",
    padding: "7px 14px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    textDecoration: "none",
    border: "1px solid var(--border-strong)",
    background: variant === "primary" ? "var(--button-inverted)" : variant === "danger" ? "var(--button-danger)" : "var(--button-neutral)",
    color: variant === "secondary" ? "var(--fg-base)" : "var(--fg-on-inverted)",
  };
  if (href) return <a href={href} style={style}>{children}</a>;
  return <button type={type} onClick={onClick} disabled={disabled} style={style}>{children}</button>;
}

const fieldStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid var(--border-strong)",
  background: "var(--bg-field)",
  color: "var(--fg-base)",
  fontSize: 14,
};

export function Field({
  label,
  hint,
  value,
  onChange,
  placeholder,
  multiline,
  type = "text",
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  type?: string;
}) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={5} style={{ ...fieldStyle, resize: "vertical" }} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={fieldStyle} />
      )}
      {hint && <span style={{ display: "block", fontSize: 12, color: "var(--fg-subtle)", marginTop: 3 }}>{hint}</span>}
    </label>
  );
}

export function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={fieldStyle}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

export function Grid({ cols = 2, children }: { cols?: number; children: ReactNode }) {
  return <div style={{ display: "grid", gap: 12, gridTemplateColumns: `repeat(auto-fit, minmax(${cols > 2 ? 160 : 260}px, 1fr))` }}>{children}</div>;
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div style={{ ...card, padding: 14 }}>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--fg-subtle)" }}>{label}</p>
      <p style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 700 }}>{value}</p>
      {hint && <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--fg-subtle)" }}>{hint}</p>}
    </div>
  );
}

export function Row({ children, highlight }: { children: ReactNode; highlight?: boolean }) {
  return (
    <li style={{ ...card, padding: 12, listStyle: "none", background: highlight ? "var(--tag-orange-bg)" : "var(--bg-base)" }}>
      {children}
    </li>
  );
}

export const List = ({ children }: { children: ReactNode }) => (
  <ul style={{ margin: 0, padding: 0, display: "grid", gap: 8 }}>{children}</ul>
);

export const Flex = ({ children, gap = 8, between }: { children: ReactNode; gap?: number; between?: boolean }) => (
  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap, justifyContent: between ? "space-between" : undefined }}>{children}</div>
);

export const Muted = ({ children }: { children: ReactNode }) => (
  <span style={{ fontSize: 13, color: "var(--fg-subtle)" }}>{children}</span>
);
