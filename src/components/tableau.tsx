"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Download, Search, SearchX } from "lucide-react";
import { Bouton, EtatVide, cn } from "./ui";

export type Colonne<T> = {
  id: string;
  titre: string;
  cellule: (ligne: T) => React.ReactNode;
  /** valeur de tri et d'export CSV ; sans elle, la colonne n'est ni triable ni exportée */
  valeur?: (ligne: T) => string | number;
  droite?: boolean;
  /** masquée dans le tableau sous 1440 px de large ; toujours visible dans les cartes mobiles */
  secondaire?: boolean;
};

type Props<T> = {
  lignes: T[];
  colonnes: Colonne<T>[];
  cle: (ligne: T) => string;
  /** texte dans lequel la recherche s'applique */
  texte?: (ligne: T) => string;
  rechercher?: string;
  filtres?: React.ReactNode;
  parPage?: number;
  vide?: { titre: string; texte?: string; action?: React.ReactNode };
  onLigne?: (ligne: T) => void;
  exportNom?: string;
};

const normaliser = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const CLASSE_FILTRE =
  "h-9 rounded-full border border-slate-300 bg-paper px-3.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100";

export function Tableau<T>({ lignes, colonnes, cle, texte, rechercher = "Rechercher…", filtres, parPage = 10, vide, onLigne, exportNom }: Props<T>) {
  const [q, setQ] = useState("");
  const [tri, setTri] = useState<{ id: string; asc: boolean } | null>(null);
  const [page, setPage] = useState(0);

  const resultat = useMemo(() => {
    let r = lignes;
    const terme = normaliser(q.trim());
    if (terme && texte) r = r.filter((l) => normaliser(texte(l)).includes(terme));
    const col = tri && colonnes.find((c) => c.id === tri.id);
    if (col?.valeur) {
      const v = col.valeur;
      r = [...r].sort((a, b) => {
        const x = v(a), y = v(b);
        const d = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "fr");
        return tri!.asc ? d : -d;
      });
    }
    return r;
  }, [lignes, q, tri, colonnes, texte]);

  const pages = Math.max(1, Math.ceil(resultat.length / parPage));
  const p = Math.min(page, pages - 1);
  const visibles = resultat.slice(p * parPage, (p + 1) * parPage);

  // Cartes mobiles : la première colonne sert de titre, le statut va en haut à droite, les actions en bas.
  const principale = colonnes[0];
  const colStatut = colonnes.find((c) => c.id === "statut" || c.id === "etat");
  const colActions = colonnes.find((c) => c.id === "actions");
  const details = colonnes.filter((c) => c !== principale && c !== colStatut && c !== colActions);

  function exporter() {
    const cols = colonnes.filter((c) => c.valeur);
    const echapper = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [cols.map((c) => echapper(c.titre)).join(";"), ...resultat.map((l) => cols.map((c) => echapper(c.valeur!(l))).join(";"))].join("\r\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportNom}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-paper shadow-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 p-3 sm:p-4">
        {texte && (
          <label className="relative min-w-40 flex-1 sm:max-w-xs">
            <span className="sr-only">{rechercher}</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(0); }}
              placeholder={rechercher}
              className={cn(CLASSE_FILTRE, "w-full pl-10 placeholder:text-slate-400")}
            />
          </label>
        )}
        {filtres}
        {exportNom && (
          <Bouton variante="secondaire" taille="sm" icone={Download} onClick={exporter} className="ml-auto h-9" disabled={resultat.length === 0}>
            Exporter
          </Bouton>
        )}
      </div>

      {resultat.length === 0 ? (
        lignes.length === 0 ? (
          <EtatVide titre={vide?.titre ?? "Aucune donnée"} texte={vide?.texte} action={vide?.action} />
        ) : (
          <EtatVide
            icone={SearchX}
            titre="Aucun résultat"
            texte="Aucune ligne ne correspond à votre recherche."
            action={<Bouton variante="secondaire" taille="sm" onClick={() => setQ("")}>Effacer la recherche</Bouton>}
          />
        )
      ) : (
        <>
          {/* Mobile : une carte par ligne */}
          <ul className="divide-y divide-slate-100 md:hidden">
            {visibles.map((l) => {
              const actions = colActions?.cellule(l);
              return (
                <li key={cle(l)} className="p-4">
                  <div
                    className={cn("flex items-start justify-between gap-3", onLigne && "cursor-pointer")}
                    onClick={onLigne ? () => onLigne(l) : undefined}
                    onKeyDown={onLigne ? (e) => { if (e.key === "Enter") onLigne(l); } : undefined}
                    role={onLigne ? "button" : undefined}
                    tabIndex={onLigne ? 0 : undefined}
                  >
                    <div className="min-w-0 text-sm">{principale.cellule(l)}</div>
                    {colStatut && <div className="shrink-0">{colStatut.cellule(l)}</div>}
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
                    {details.map((c) => (
                      <div key={c.id} className="min-w-0">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">{c.titre}</dt>
                        <dd className="mt-0.5 text-sm tabular-nums text-slate-800">{c.cellule(l)}</dd>
                      </div>
                    ))}
                  </dl>
                  {actions && <div className="mt-3 flex justify-end">{actions}</div>}
                </li>
              );
            })}
          </ul>

          {/* Écrans moyens et grands : tableau triable */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 text-[11px] uppercase tracking-[0.1em] text-slate-500">
                  {colonnes.map((c) => {
                    const actif = tri?.id === c.id;
                    return (
                      <th
                        key={c.id}
                        scope="col"
                        aria-sort={actif ? (tri!.asc ? "ascending" : "descending") : undefined}
                        className={cn("whitespace-nowrap px-4 py-3 font-semibold first:pl-6 last:pr-6", c.droite && "text-right", c.secondaire && "hidden min-[1440px]:table-cell")}
                      >
                        {c.valeur ? (
                          <button
                            type="button"
                            onClick={() => setTri(actif ? (tri!.asc ? { id: c.id, asc: false } : null) : { id: c.id, asc: true })}
                            className={cn("group inline-flex items-center gap-1 uppercase tracking-[0.1em] hover:text-slate-900", actif && "text-brand-700")}
                          >
                            {c.titre}
                            {actif
                              ? (tri!.asc ? <ArrowUp className="h-3 w-3" aria-hidden /> : <ArrowDown className="h-3 w-3" aria-hidden />)
                              : <ChevronsUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60" aria-hidden />}
                          </button>
                        ) : (
                          c.titre
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibles.map((l) => (
                  <tr
                    key={cle(l)}
                    onClick={onLigne ? () => onLigne(l) : undefined}
                    onKeyDown={onLigne ? (e) => { if (e.key === "Enter" && e.target === e.currentTarget) onLigne(l); } : undefined}
                    tabIndex={onLigne ? 0 : undefined}
                    className={cn("text-slate-700 transition-colors hover:bg-slate-50/70", onLigne && "cursor-pointer")}
                  >
                    {colonnes.map((c) => (
                      <td key={c.id} className={cn("px-4 py-3.5 align-middle first:pl-6 last:pr-6", c.droite && "whitespace-nowrap text-right tabular-nums", c.secondaire && "hidden min-[1440px]:table-cell")}>
                        {c.cellule(l)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {resultat.length > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-slate-200/80 px-5 py-3 text-sm text-slate-500">
          <p className="tabular-nums">
            {p * parPage + 1}–{Math.min((p + 1) * parPage, resultat.length)} sur {resultat.length}
          </p>
          {pages > 1 && (
            <div className="flex items-center gap-1">
              <Bouton variante="discret" taille="sm" icone={ChevronLeft} onClick={() => setPage(p - 1)} disabled={p === 0} aria-label="Page précédente" />
              <span className="px-1 tabular-nums">{p + 1} / {pages}</span>
              <Bouton variante="discret" taille="sm" icone={ChevronRight} onClick={() => setPage(p + 1)} disabled={p >= pages - 1} aria-label="Page suivante" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Liste déroulante compacte pour les filtres de tableau. */
export function Filtre({ libelle, valeur, onChange, options }: {
  libelle: string; valeur: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <label>
      <span className="sr-only">{libelle}</span>
      <select value={valeur} onChange={(e) => onChange(e.target.value)} className={CLASSE_FILTRE}>
        <option value="">{libelle} : tous</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
