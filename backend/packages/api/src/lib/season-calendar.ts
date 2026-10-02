/*
  LE CALENDRIER DES HABILLAGES : quelle fête est en cours un jour donné.

  Le propriétaire peut choisir « Automatique » : le site prend alors
  l'habillage de la fête en cours, et revient à l'habituel hors fête.
  Rien n'est caché : la page Apparence du site affiche ce calendrier.

  Les dates

  - fixes : 1er janvier, 14 février, 18 mai, 28 octobre, 1er-2 novembre,
    18 novembre, 1er-25 décembre…
  - mobiles : calculées à partir de Pâques (Carnaval, Semaine sainte,
    Pâques), du dernier dimanche de mai (fête des mères), du 3e dimanche
    de juin (fête des pères) et du Thanksgiving américain (Black Friday).
    Les fêtes des mères et des pères sont à VÉRIFIER pour Haïti ; si la
    date change, elle se corrige ici, à un seul endroit.

  Quand deux périodes se chevauchent (Octobre rose et Halloween), la plus
  COURTE l'emporte : la fête précise passe avant le mois entier.

  Le jour est celui d'Haïti (America/Port-au-Prince), pas celui du
  serveur : le 1er janvier à minuit à Port-au-Prince n'est pas le
  1er janvier à Paris.
*/

import type { ThemeKey } from "../api/mache-themes";

export type SeasonWindow = { key: ThemeKey; from: string; to: string };

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));
const shift = (d: Date, days: number) => new Date(d.getTime() + days * 86_400_000);

/* Dimanche de Pâques (calendrier grégorien), algorithme de Meeus/Jones/Butcher. */
export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return utc(year, month, day);
}

/* Le n-ième dimanche d'un mois (n = 1, 2, 3…), ou le dernier (n = -1). */
function sunday(year: number, month: number, n: number): Date {
  if (n > 0) {
    const first = utc(year, month, 1);
    const offset = (7 - first.getUTCDay()) % 7;
    return utc(year, month, 1 + offset + 7 * (n - 1));
  }

  const last = utc(year, month + 1, 0);

  return shift(last, -last.getUTCDay());
}

export function seasonWindows(year: number): SeasonWindow[] {
  const easter = easterSunday(year);

  /* Thanksgiving : 4e jeudi de novembre. Black Friday = le vendredi suivant, jusqu'au lundi (Cyber Monday). */
  const novFirst = utc(year, 11, 1);
  const thanksgiving = utc(year, 11, 1 + ((11 - novFirst.getUTCDay()) % 7) + 21);
  const blackFriday = shift(thanksgiving, 1);

  const mothers = sunday(year, 5, -1);
  const fathers = sunday(year, 6, 3);

  const w = (key: ThemeKey, from: Date, to: Date): SeasonWindow => ({ key, from: iso(from), to: iso(to) });

  return [
    w("independance", utc(year, 1, 1), utc(year, 1, 2)),
    w("saint-valentin", utc(year, 2, 7), utc(year, 2, 14)),
    w("carnaval", shift(easter, -49), shift(easter, -47)),
    w("semaine-sainte", shift(easter, -7), shift(easter, -1)),
    w("paques", easter, shift(easter, 1)),
    w("drapeau", utc(year, 5, 17), utc(year, 5, 18)),
    w("fete-des-meres", shift(mothers, -7), mothers),
    w("fete-des-peres", shift(fathers, -7), fathers),
    w("ete", utc(year, 7, 1), utc(year, 8, 31)),
    w("rentree", utc(year, 9, 1), utc(year, 9, 30)),
    w("octobre-rose", utc(year, 10, 1), utc(year, 10, 26)),
    w("journee-creole", utc(year, 10, 27), utc(year, 10, 28)),
    w("halloween", utc(year, 10, 29), utc(year, 10, 31)),
    w("toussaint-gede", utc(year, 11, 1), utc(year, 11, 2)),
    w("vertieres", utc(year, 11, 17), utc(year, 11, 18)),
    w("black-friday", blackFriday, shift(blackFriday, 3)),
    w("noel", utc(year, 12, 1), utc(year, 12, 25)),
    w("bonne-annee", utc(year, 12, 26), utc(year, 12, 31)),
  ];
}

/* La date du jour à Port-au-Prince, « AAAA-MM-JJ ». */
export function portAuPrinceDate(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Port-au-Prince",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  return parts;
}

/* La fête en cours à une date « AAAA-MM-JJ », ou null. La plus courte période l'emporte. */
export function seasonOn(date: string): ThemeKey | null {
  const year = Number(date.slice(0, 4));

  const days = (w: SeasonWindow) => (Date.parse(w.to) - Date.parse(w.from)) / 86_400_000;

  const matching = seasonWindows(year)
    .filter((window) => window.from <= date && date <= window.to)
    .sort((a, b) => days(a) - days(b));

  return matching[0]?.key ?? null;
}
