/** Date de référence des données de test (pas d'horloge réelle : rendu stable). */
export const TODAY = "2026-11-12";

const group = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export const nombre = (n: number) => group(n);
export const fcfa = (n: number) => `${group(n)} FCFA`;

/** Montant abrégé : 12,4 M FCFA */
export function fcfaCourt(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2).replace(".", ",")} Md FCFA`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1).replace(".", ",")} M FCFA`;
  if (abs >= 1e3) return `${Math.round(n / 1e3)} k FCFA`;
  return fcfa(n);
}

export const pct = (n: number) => `${(n * 100).toFixed(1).replace(".", ",")} %`;

export function date(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
export const moisCourt = (ym: string) => MOIS[Number(ym.slice(5, 7)) - 1];
export const dateCourte = (iso: string) => `${Number(iso.slice(8, 10))} ${MOIS[Number(iso.slice(5, 7)) - 1]}`;

export function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export const diffDays = (a: string, b: string) =>
  Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
