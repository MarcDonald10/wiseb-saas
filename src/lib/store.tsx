"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { donneesInitiales, profils, type Donnees } from "./mock";
import type { Agence, ModuleId, Profil } from "./types";

/* ---------- Session (démo : conservée dans le navigateur) ---------- */

const CLE = "wised.session";
const ecouteurs = new Set<() => void>();
let memoire = ""; // repli si localStorage est indisponible

function lire(): string {
  try {
    return window.localStorage.getItem(CLE) ?? "";
  } catch {
    return memoire;
  }
}
function ecrire(valeur: string) {
  memoire = valeur;
  try {
    if (valeur) window.localStorage.setItem(CLE, valeur);
    else window.localStorage.removeItem(CLE);
  } catch {
    /* stockage indisponible : la session reste en mémoire */
  }
  ecouteurs.forEach((f) => f());
}
function abonner(f: () => void) {
  ecouteurs.add(f);
  return () => {
    ecouteurs.delete(f);
  };
}

/* ---------- Contexte ---------- */

type Toast = { id: number; message: string; ton: "succes" | "info" };

type App = {
  /** false tant que la session n'a pas été lue (premier rendu) */
  pret: boolean;
  user: Profil | null;
  connecter: (profilId: string) => void;
  deconnecter: () => void;
  /** "all" = vue consolidée */
  agenceId: string;
  choisirAgence: (id: string) => void;
  agencesVisibles: Agence[];
  consolide: boolean;
  peutConsolider: boolean;
  /** vrai si l'enregistrement appartient au périmètre affiché */
  dansPerimetre: (agenceId: string) => boolean;
  filtrer: <T extends { agenceId: string }>(liste: T[]) => T[];
  nomAgence: (id: string) => string;
  /** agence par défaut pour une création */
  agenceParDefaut: string;
  peut: (module: ModuleId) => boolean;
  data: Donnees;
  maj: (f: (d: Donnees) => Donnees) => void;
  toast: (message: string, ton?: Toast["ton"]) => void;
  toasts: Toast[];
};

const Ctx = createContext<App | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const brut = useSyncExternalStore(abonner, lire, () => null);
  const [data, setData] = useState<Donnees>(donneesInitiales);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const compteur = useRef(0);

  const session = useMemo(() => {
    if (!brut) return { u: "", a: "all" };
    try {
      const s = JSON.parse(brut) as { u?: string; a?: string };
      return { u: s.u ?? "", a: s.a ?? "all" };
    } catch {
      return { u: "", a: "all" };
    }
  }, [brut]);

  const user = useMemo(() => profils.find((p) => p.id === session.u) ?? null, [session.u]);

  const toast = useCallback((message: string, ton: Toast["ton"] = "succes") => {
    const id = ++compteur.current;
    setToasts((t) => [...t, { id, message, ton }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const valeur = useMemo<App>(() => {
    const scope = user?.scope ?? [];
    const agencesVisibles = scope === "all" ? data.agences : data.agences.filter((a) => scope.includes(a.id));
    const ids = agencesVisibles.map((a) => a.id);
    const peutConsolider = agencesVisibles.length > 1;
    const agenceId = ids.includes(session.a) ? session.a : peutConsolider ? "all" : (ids[0] ?? "all");
    const dansPerimetre = (id: string) => (agenceId === "all" ? ids.includes(id) : id === agenceId);
    return {
      pret: brut !== null,
      user,
      connecter: (profilId) => ecrire(JSON.stringify({ u: profilId, a: "all" })),
      deconnecter: () => ecrire(""),
      agenceId,
      choisirAgence: (id) => ecrire(JSON.stringify({ u: session.u, a: id })),
      agencesVisibles,
      consolide: agenceId === "all",
      peutConsolider,
      dansPerimetre,
      filtrer: (liste) => liste.filter((x) => dansPerimetre(x.agenceId)),
      nomAgence: (id) => data.agences.find((a) => a.id === id)?.nom ?? "—",
      agenceParDefaut: agenceId === "all" ? (ids[0] ?? "") : agenceId,
      peut: (m) => !!user?.modules.includes(m),
      data,
      maj: (f) => setData(f),
      toast,
      toasts,
    };
  }, [brut, user, session, data, toast, toasts]);

  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp doit être utilisé dans <AppProvider>");
  return ctx;
}
