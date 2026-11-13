"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2, CheckCircle2, FolderKanban, Info, Layers, LayoutDashboard, Lock, LogOut, Menu, Package, Plug, Receipt,
  ShoppingCart, Users, X, type LucideIcon,
} from "lucide-react";
import { useApp } from "@/lib/store";
import type { ModuleId } from "@/lib/types";
import { EtatVide, Marque, cn } from "@/components/ui";

const NAV: { id: ModuleId; libelle: string; icone: LucideIcon; groupe: string }[] = [
  { id: "tableau-de-bord", libelle: "Tableau de bord", icone: LayoutDashboard, groupe: "Pilotage" },
  { id: "ventes", libelle: "Ventes", icone: Receipt, groupe: "Opérations" },
  { id: "achats", libelle: "Achats", icone: ShoppingCart, groupe: "Opérations" },
  { id: "stocks", libelle: "Stocks", icone: Package, groupe: "Opérations" },
  { id: "projets", libelle: "Projets", icone: FolderKanban, groupe: "Opérations" },
  { id: "rh", libelle: "Ressources humaines", icone: Users, groupe: "Équipe" },
  { id: "agences", libelle: "Agences", icone: Building2, groupe: "Administration" },
  { id: "integrations", libelle: "Intégrations", icone: Plug, groupe: "Administration" },
];

export default function Coquille({ children }: { children: React.ReactNode }) {
  const app = useApp();
  const { pret, user } = app;
  const chemin = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (pret && !user) router.replace("/login");
  }, [pret, user, router]);

  if (!pret || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status" aria-live="polite">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
        <span className="sr-only">Chargement…</span>
      </div>
    );
  }

  const actuel = NAV.find((n) => chemin === `/${n.id}` || chemin.startsWith(`/${n.id}/`));
  const autorise = !actuel || app.peut(actuel.id);
  const liens = NAV.filter((n) => app.peut(n.id));
  const groupes = [...new Set(liens.map((n) => n.groupe))];

  const navigation = (
    <nav aria-label="Navigation principale" className="sans-barre flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {groupes.map((g) => (
        <div key={g}>
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-300/70">{g}</p>
          <ul className="space-y-0.5">
            {liens.filter((n) => n.groupe === g).map((n) => {
              const actif = actuel?.id === n.id;
              return (
                <li key={n.id}>
                  <Link
                    href={`/${n.id}`}
                    onClick={() => setMenu(false)}
                    aria-current={actif ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      actif ? "bg-white/10 text-white" : "text-brand-100/75 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    {actif && <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-accent-400" aria-hidden />}
                    <n.icone className={cn("h-[18px] w-[18px] shrink-0", actif && "text-accent-300")} aria-hidden />
                    {n.libelle}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const pied = (
    <div className="p-3">
      <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] p-3 ring-1 ring-inset ring-white/10">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-400 text-sm font-semibold text-ink">
          {user.nom.split(" ").map((m) => m[0]).join("")}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{user.nom}</p>
          <p className="truncate text-xs text-brand-200/80">{user.role}</p>
        </div>
        <button type="button" onClick={app.deconnecter} aria-label="Se déconnecter" title="Se déconnecter" className="rounded-full p-2 text-brand-200 hover:bg-white/10 hover:text-white">
          <LogOut className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );

  // Sélecteur de périmètre : le groupe, puis une pastille par agence.
  const pastille = (id: string, libelle: string, code?: string) => {
    const actif = app.agenceId === id;
    return (
      <button
        key={id}
        type="button"
        role="radio"
        aria-checked={actif}
        data-agence={id}
        onClick={() => app.choisirAgence(id)}
        className={cn(
          "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
          actif ? "bg-brand-700 text-white shadow-xs" : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900",
        )}
      >
        {code ? (
          <span className={cn("rounded-md px-1.5 py-px font-mono text-[10px] font-semibold tracking-wider", actif ? "bg-white/15 text-accent-300" : "bg-slate-200 text-slate-600")}>{code}</span>
        ) : (
          <Layers className={cn("h-4 w-4", actif && "text-accent-300")} aria-hidden />
        )}
        {libelle}
      </button>
    );
  };

  return (
    <div className="min-h-dvh lg:pl-[17rem]">
      {/* Barre latérale (ordinateur) */}
      <aside className="motif fixed inset-y-0 left-0 hidden w-[17rem] flex-col lg:flex">
        <div className="flex h-[4.5rem] items-center px-6"><Marque clair /></div>
        {navigation}
        {pied}
      </aside>

      {/* Tiroir (mobile) */}
      {menu && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-[2px]" onClick={() => setMenu(false)} aria-hidden />
          <aside className="motif absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col">
            <div className="flex h-[4.5rem] items-center justify-between pl-6 pr-3">
              <Marque clair />
              <button type="button" onClick={() => setMenu(false)} aria-label="Fermer le menu" className="rounded-full p-2 text-brand-100 hover:bg-white/10">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            {navigation}
            {pied}
          </aside>
        </div>
      )}

      {/* Barre supérieure : périmètre d'agences, toujours visible */}
      <header className="sticky top-0 z-30 flex h-[4.5rem] items-center gap-3 border-b border-slate-200/80 bg-ivory/85 px-4 backdrop-blur-md sm:px-8">
        <button type="button" onClick={() => setMenu(true)} aria-label="Ouvrir le menu" className="rounded-full p-2 text-slate-700 hover:bg-slate-200/70 lg:hidden">
          <Menu className="h-5 w-5" aria-hidden />
        </button>
        {app.peutConsolider ? (
          <div role="radiogroup" aria-label="Périmètre affiché" className="sans-barre flex min-w-0 gap-0.5 overflow-x-auto rounded-full bg-slate-200/50 p-1 ring-1 ring-inset ring-slate-200">
            {pastille("all", "Groupe")}
            {app.agencesVisibles.map((a) => pastille(a.id, a.ville, a.code))}
          </div>
        ) : (
          <p className="flex min-w-0 items-center gap-2 rounded-full bg-slate-200/50 py-1.5 pl-2 pr-4 text-sm font-medium text-slate-800 ring-1 ring-inset ring-slate-200">
            <span className="rounded-md bg-brand-700 px-1.5 py-px font-mono text-[10px] font-semibold tracking-wider text-accent-300">{app.agencesVisibles[0]?.code}</span>
            <span className="truncate">{app.agencesVisibles[0]?.nom}</span>
            <Lock className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-label="Accès limité à votre agence" />
          </p>
        )}
        <div className="ml-auto hidden shrink-0 items-center gap-3 md:flex">
          <span className="text-sm text-slate-500">Jeudi 12 novembre 2026</span>
          <span className="rounded-full bg-accent-50 px-2.5 py-1 text-xs font-medium text-accent-700 ring-1 ring-inset ring-accent-100">Données de test</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[84rem] px-4 py-7 sm:px-8 lg:py-9">
        {autorise ? (
          children
        ) : (
          <div className="rounded-2xl border border-slate-200/80 bg-paper shadow-card">
            <EtatVide
              icone={Lock}
              titre="Accès refusé"
              texte={`Votre profil (${user.role}) n'a pas accès au module « ${actuel?.libelle} ».`}
              action={<Link href="/tableau-de-bord" className="text-sm font-medium text-brand-700 underline-offset-4 hover:underline">Retour au tableau de bord</Link>}
            />
          </div>
        )}
      </main>

      {/* Notifications */}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
        {app.toasts.map((t) => (
          <div key={t.id} className="toast-in pointer-events-auto flex max-w-md items-center gap-2.5 rounded-full bg-ink py-3 pl-4 pr-5 text-sm text-white shadow-xl ring-1 ring-white/10">
            {t.ton === "succes" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-300" aria-hidden /> : <Info className="h-4 w-4 shrink-0 text-accent-300" aria-hidden />}
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
