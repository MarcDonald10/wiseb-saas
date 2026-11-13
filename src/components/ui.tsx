"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Inbox, X, type LucideIcon } from "lucide-react";
import { useApp } from "@/lib/store";

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* ---------- Marque ---------- */

/** Monogramme WISED : un W tressé, rappel du motif de marque. */
export function Logo({ taille = 32, className }: { taille?: number; className?: string }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
      <rect width="32" height="32" rx="9" fill="#e7b547" />
      <path d="M7 10.5 11.5 22 16 12.5 20.5 22 25 10.5" stroke="#0a2019" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.2 18.4 16 12.5l2.8 5.9" stroke="#fffefb" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Marque({ clair }: { clair?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <Logo />
      <span className={cn("font-display text-xl font-semibold", clair ? "text-white" : "text-brand-900")}>
        Wised
        <span className="text-accent-400">.</span>
      </span>
    </span>
  );
}

/* ---------- Bouton ---------- */

type BoutonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: "primaire" | "secondaire" | "discret" | "danger";
  taille?: "sm" | "md";
  icone?: LucideIcon;
};
export function Bouton({ variante = "primaire", taille = "md", icone: Icone, className, children, ...props }: BoutonProps) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-medium transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        taille === "sm" ? "h-8 text-[13px]" : "h-10 text-sm",
        children ? (taille === "sm" ? "px-3.5" : "px-5") : taille === "sm" ? "w-8" : "w-10",
        variante === "primaire" && "bg-brand-700 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(10_32_25/0.25)] hover:bg-brand-800",
        variante === "secondaire" && "border border-slate-300 bg-paper text-slate-800 hover:border-slate-400 hover:bg-slate-50",
        variante === "discret" && "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        variante === "danger" && "border border-rose-200 bg-paper text-rose-700 hover:bg-rose-50",
        className,
      )}
    >
      {Icone && <Icone className="h-4 w-4" aria-hidden />}
      {children}
    </button>
  );
}

/* ---------- Badge de statut ---------- */

type Ton = "neutre" | "vert" | "ambre" | "rouge" | "bleu";
const TONS: Record<Ton, [string, string]> = {
  neutre: ["bg-slate-100 text-slate-700 ring-slate-200", "bg-slate-400"],
  vert: ["bg-brand-50 text-brand-800 ring-brand-100", "bg-brand-500"],
  ambre: ["bg-accent-50 text-accent-700 ring-accent-100", "bg-accent-500"],
  rouge: ["bg-rose-50 text-rose-800 ring-rose-100", "bg-rose-500"],
  bleu: ["bg-sky-50 text-sky-800 ring-sky-100", "bg-sky-500"],
};
const TON_STATUT: Record<string, Ton> = {
  Payée: "vert", Accepté: "vert", Approuvé: "vert", Reçue: "vert", Reçu: "vert", Terminé: "vert", Présent: "vert",
  Gagné: "vert", Disponible: "vert", Actif: "vert", Commandée: "vert",
  "En attente": "ambre", Partielle: "ambre", "À valider": "ambre", "En transit": "ambre", "Sous le seuil": "ambre",
  "En revue": "ambre", "Reçue partiellement": "ambre", "En congé": "ambre", Expédié: "ambre",
  "En retard": "rouge", Refusé: "rouge", Rupture: "rouge", Absent: "rouge",
  Envoyé: "bleu", Envoyée: "bleu", Confirmée: "bleu", Validée: "bleu", "En cours": "bleu", Demandé: "bleu",
  "Automatique (seuil)": "bleu", Planifié: "neutre",
};
export function Badge({ children, ton }: { children: string; ton?: Ton }) {
  const [fond, point] = TONS[ton ?? TON_STATUT[children] ?? "neutre"];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", fond)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", point)} aria-hidden />
      {children}
    </span>
  );
}

/* ---------- Carte, en-tête, indicateur ---------- */

export function Carte({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("rounded-2xl border border-slate-200/80 bg-paper shadow-card", className)}>{children}</section>;
}

export function TitreCarte({ titre, aide, action }: { titre: string; aide?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-6 pt-6">
      <div>
        <h2 className="font-display text-lg font-semibold text-slate-900">{titre}</h2>
        {aide && <p className="mt-0.5 text-sm text-slate-500">{aide}</p>}
      </div>
      {action}
    </div>
  );
}

/** Étiquette du périmètre affiché : rappelle partout si l'on voit le groupe ou une agence. */
export function Perimetre({ clair }: { clair?: boolean }) {
  const app = useApp();
  return (
    <p className={cn("flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]", clair ? "text-accent-300" : "text-accent-700")}>
      <span className={cn("h-1.5 w-1.5 rounded-full", clair ? "bg-accent-400" : "bg-accent-500")} aria-hidden />
      {app.consolide ? `Groupe · ${app.agencesVisibles.length} agences` : `Agence ${app.nomAgence(app.agenceId)}`}
    </p>
  );
}

export function EnTete({ titre, description, action }: { titre: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="monte mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <Perimetre />
        <h1 className="mt-2 font-display text-3xl font-semibold text-slate-900 sm:text-[2.25rem] sm:leading-tight">{titre}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-slate-500">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function Indicateur({ libelle, valeur, unite, detail, icone: Icone, alerte, jauge }: {
  libelle: string; valeur: string; unite?: string; detail?: string; icone: LucideIcon; alerte?: boolean;
  /** part entre 0 et 1, affichée en jauge fine sous la valeur */
  jauge?: number;
}) {
  return (
    <Carte className="relative overflow-hidden p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{libelle}</p>
        <span className={cn("rounded-full p-2", alerte ? "bg-rose-50 text-rose-700" : "bg-brand-50 text-brand-700")}>
          <Icone className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <p className="mt-3 flex items-baseline gap-1.5">
        <span className="font-display text-[2rem] font-semibold leading-none text-slate-900">{valeur}</span>
        {unite && <span className="text-sm font-medium text-slate-500">{unite}</span>}
      </p>
      {jauge !== undefined && (
        <div className="mt-3 h-1.5 rounded-full bg-slate-100">
          <div className={cn("h-1.5 rounded-full", alerte ? "bg-rose-500" : "bg-brand-500")} style={{ width: `${Math.round(Math.min(1, Math.max(0, jauge)) * 100)}%` }} />
        </div>
      )}
      {detail && <p className="mt-2.5 text-sm text-slate-500">{detail}</p>}
    </Carte>
  );
}

/* ---------- Onglets ---------- */

export function Onglets<T extends string>({ onglets, valeur, onChange }: {
  onglets: { id: T; libelle: string; compte?: number }[]; valeur: T; onChange: (id: T) => void;
}) {
  return (
    <div className="sans-barre -mx-4 mb-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div role="tablist" className="inline-flex gap-1 rounded-full bg-slate-200/60 p-1">
        {onglets.map((o) => {
          const actif = valeur === o.id;
          return (
            <button
              key={o.id}
              role="tab"
              type="button"
              aria-selected={actif}
              onClick={() => onChange(o.id)}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                actif ? "bg-paper text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900",
              )}
            >
              {o.libelle}
              {o.compte !== undefined && (
                <span className={cn("rounded-full px-1.5 text-xs tabular-nums", actif ? "bg-brand-700 text-white" : "bg-slate-300/70 text-slate-700")}>
                  {o.compte}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- État vide ---------- */

export function EtatVide({ titre, texte, action, icone: Icone = Inbox }: {
  titre: string; texte?: string; action?: React.ReactNode; icone?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="rounded-2xl bg-brand-50 p-3.5 text-brand-700 ring-1 ring-inset ring-brand-100">
        <Icone className="h-6 w-6" aria-hidden />
      </span>
      <p className="mt-4 font-display text-lg font-semibold text-slate-900">{titre}</p>
      {texte && <p className="mt-1 max-w-sm text-sm text-slate-500">{texte}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------- Barres horizontales (comparaison, une seule série) ---------- */

export function Barres({ lignes }: { lignes: { libelle: string; valeur: number; affichage: string; detail?: string }[] }) {
  const max = Math.max(1, ...lignes.map((l) => l.valeur));
  return (
    <ul className="space-y-4">
      {lignes.map((l) => (
        <li key={l.libelle}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium text-slate-700">{l.libelle}</span>
            <span className="shrink-0 tabular-nums text-slate-900">
              {l.affichage}
              {l.detail && <span className="ml-2 text-slate-500">{l.detail}</span>}
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-slate-100">
            <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${Math.max(1.5, (l.valeur / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Progression({ valeur, alerte }: { valeur: number; alerte?: boolean }) {
  const p = Math.round(Math.min(1, Math.max(0, valeur)) * 100);
  return (
    <div className="h-1.5 rounded-full bg-slate-100" role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-1.5 rounded-full", alerte ? "bg-rose-500" : "bg-brand-500")} style={{ width: `${p}%` }} />
    </div>
  );
}

/* ---------- Fenêtre modale ---------- */

export function Modale({ titre, ouverte, onFermer, children, large }: {
  titre: string; ouverte: boolean; onFermer: () => void; children: React.ReactNode; large?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const idTitre = useId();
  useEffect(() => {
    if (!ouverte) return;
    const precedent = document.activeElement as HTMLElement | null;
    const cible = ref.current?.querySelector<HTMLElement>("input, select, textarea, button:not([data-fermer])");
    (cible ?? ref.current)?.focus();
    const surTouche = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    document.addEventListener("keydown", surTouche);
    return () => {
      document.removeEventListener("keydown", surTouche);
      precedent?.focus();
    };
  }, [ouverte, onFermer]);

  if (!ouverte) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" onClick={onFermer} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitre}
        tabIndex={-1}
        className={cn("monte relative max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-paper shadow-2xl sm:rounded-3xl", large ? "sm:max-w-2xl" : "sm:max-w-md")}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-paper px-6 py-4">
          <h2 id={idTitre} className="font-display text-xl font-semibold text-slate-900">{titre}</h2>
          <button type="button" data-fermer onClick={onFermer} aria-label="Fermer" className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Formulaire générique en modale ---------- */

export type Champ = {
  nom: string;
  libelle: string;
  type?: "texte" | "nombre" | "date" | "choix";
  options?: { valeur: string; libelle: string }[];
  requis?: boolean;
  defaut?: string;
  aide?: string;
  placeholder?: string;
};

export const CLASSE_CHAMP =
  "h-11 w-full rounded-xl border bg-paper px-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-shadow focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100";

export function FormulaireModale({ titre, ouverte, onFermer, champs, onValider, libelleValider = "Enregistrer" }: {
  titre: string; ouverte: boolean; onFermer: () => void; champs: Champ[];
  onValider: (valeurs: Record<string, string>) => void; libelleValider?: string;
}) {
  return (
    <Modale titre={titre} ouverte={ouverte} onFermer={onFermer}>
      {ouverte && <Formulaire champs={champs} onValider={onValider} onAnnuler={onFermer} libelleValider={libelleValider} />}
    </Modale>
  );
}

function Formulaire({ champs, onValider, onAnnuler, libelleValider }: {
  champs: Champ[]; onValider: (v: Record<string, string>) => void; onAnnuler: () => void; libelleValider: string;
}) {
  const [valeurs, setValeurs] = useState<Record<string, string>>(() =>
    Object.fromEntries(champs.map((c) => [c.nom, c.defaut ?? (c.type === "choix" ? (c.options?.[0]?.valeur ?? "") : "")])),
  );
  const [touches, setTouches] = useState<Record<string, boolean>>({});
  const [soumis, setSoumis] = useState(false);
  const base = useId();

  const erreur = (c: Champ): string | null => {
    const v = (valeurs[c.nom] ?? "").trim();
    if (c.requis !== false && !v) return "Ce champ est obligatoire.";
    if (c.type === "nombre" && v && !(Number(v) > 0)) return "Saisissez un nombre supérieur à 0.";
    return null;
  };

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setSoumis(true);
        if (champs.some((c) => erreur(c))) return;
        onValider(valeurs);
      }}
      className="space-y-4"
    >
      {champs.map((c) => {
        const id = `${base}-${c.nom}`;
        const err = (soumis || touches[c.nom]) && erreur(c);
        const commun = {
          id,
          value: valeurs[c.nom] ?? "",
          "aria-invalid": !!err,
          "aria-describedby": err ? `${id}-err` : undefined,
          onBlur: () => setTouches((t) => ({ ...t, [c.nom]: true })),
          className: cn(CLASSE_CHAMP, "mt-1.5", err ? "border-rose-400" : "border-slate-300"),
        };
        const changer = (v: string) => setValeurs((x) => ({ ...x, [c.nom]: v }));
        return (
          <div key={c.nom}>
            <label htmlFor={id} className="text-sm font-medium text-slate-800">
              {c.libelle}
              {c.requis === false && <span className="font-normal text-slate-400"> (facultatif)</span>}
            </label>
            {c.type === "choix" ? (
              <select {...commun} onChange={(e) => changer(e.target.value)}>
                {c.options?.map((o) => <option key={o.valeur} value={o.valeur}>{o.libelle}</option>)}
              </select>
            ) : (
              <input
                {...commun}
                type={c.type === "date" ? "date" : "text"}
                inputMode={c.type === "nombre" ? "numeric" : undefined}
                placeholder={c.placeholder}
                onChange={(e) => changer(e.target.value)}
              />
            )}
            {c.aide && !err && <p className="mt-1.5 text-xs text-slate-500">{c.aide}</p>}
            {err && <p id={`${id}-err`} className="mt-1.5 text-xs font-medium text-rose-700">{err}</p>}
          </div>
        );
      })}
      <div className="flex justify-end gap-2 pt-3">
        <Bouton variante="secondaire" onClick={onAnnuler}>Annuler</Bouton>
        <Bouton type="submit">{libelleValider}</Bouton>
      </div>
    </form>
  );
}

/** Définition « libellé : valeur » pour les fiches de détail. */
export function Definition({ libelle, children }: { libelle: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{libelle}</dt>
      <dd className="mt-1 text-sm text-slate-900">{children}</dd>
    </div>
  );
}
