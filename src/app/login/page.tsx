"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { agences, profils } from "@/lib/mock";
import { useApp } from "@/lib/store";
import { Bouton, Marque, cn } from "@/components/ui";

export default function Connexion() {
  const { pret, user, connecter } = useApp();
  const router = useRouter();
  const [choix, setChoix] = useState(profils[0].id);

  useEffect(() => {
    if (pret && user) router.replace("/tableau-de-bord");
  }, [pret, user, router]);

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <div className="motif relative hidden flex-col justify-between overflow-hidden p-14 text-white lg:flex">
        <Marque clair />
        <div className="monte">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-300">ERP multi-agences</p>
          <h1 className="mt-5 font-display text-[3.4rem] font-medium leading-[1.05]">
            Toutes vos agences.
            <br />
            <span className="italic text-accent-300">Une seule</span> vérité.
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-brand-100/80">
            Ventes, achats, stocks, projets et équipes : pilotez chaque agence ou l&apos;ensemble du groupe depuis le même écran, sur les mêmes chiffres.
          </p>
          <ul className="mt-10 flex flex-wrap gap-2">
            {agences.map((a) => (
              <li key={a.id} className="flex items-center gap-2 rounded-full bg-white/[0.07] py-1.5 pl-2 pr-3.5 text-sm text-brand-100 ring-1 ring-inset ring-white/10">
                <span className="rounded-md bg-white/10 px-1.5 py-px font-mono text-[10px] font-semibold tracking-wider text-accent-300">{a.code}</span>
                {a.ville}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-brand-200/70">Version de démonstration du MVP · données de test</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <form
          className="monte w-full max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            connecter(choix);
          }}
        >
          <div className="mb-10 lg:hidden"><Marque /></div>
          <h2 className="font-display text-4xl font-semibold text-slate-900">Bon retour.</h2>
          <p className="mt-2 text-sm text-slate-500">
            Choisissez un profil de démonstration. Chacun a son périmètre d&apos;agences et ses modules.
          </p>

          <fieldset className="mt-8 space-y-2.5">
            <legend className="sr-only">Profil de démonstration</legend>
            {profils.map((p) => {
              const actif = choix === p.id;
              return (
                <label
                  key={p.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3.5 rounded-2xl border bg-paper p-4 transition-all has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-500",
                    actif ? "border-brand-600 shadow-card ring-4 ring-brand-100" : "border-slate-200 hover:border-slate-300",
                  )}
                >
                  <input type="radio" name="profil" value={p.id} checked={actif} onChange={() => setChoix(p.id)} className="sr-only" />
                  <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold", actif ? "bg-brand-700 text-accent-300" : "bg-slate-100 text-slate-600")}>
                    {p.nom.split(" ").map((m) => m[0]).join("")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-900">{p.nom}</span>
                    <span className="block truncate text-sm text-slate-500">{p.role}</span>
                  </span>
                  <span className={cn("hidden shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium sm:inline", p.scope === "all" ? "bg-accent-50 text-accent-700" : "bg-slate-100 text-slate-600")}>
                    {p.scope === "all" ? "Groupe" : "1 agence"}
                  </span>
                  <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border", actif ? "border-brand-700 bg-brand-700 text-white" : "border-slate-300")}>
                    {actif && <Check className="h-3 w-3" aria-hidden />}
                  </span>
                </label>
              );
            })}
          </fieldset>

          <Bouton type="submit" className="mt-8 h-12 w-full text-base" disabled={!pret}>
            Se connecter <ArrowRight className="h-4 w-4" aria-hidden />
          </Bouton>
        </form>
      </div>
    </main>
  );
}
