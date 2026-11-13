"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, SearchX } from "lucide-react";
import { rentabilite } from "@/lib/calculs";
import { TODAY, date, dateCourte, diffDays, fcfa, fcfaCourt, pct } from "@/lib/format";
import { useApp } from "@/lib/store";
import type { StatutTache } from "@/lib/types";
import { Badge, Barres, Carte, Definition, EtatVide, Onglets, Progression, TitreCarte, cn } from "@/components/ui";

const COLONNES: StatutTache[] = ["À faire", "En cours", "En revue", "Terminé"];
type Onglet = "kanban" | "gantt" | "rentabilite";

export default function FicheProjet() {
  const { id } = useParams<{ id: string }>();
  const app = useApp();
  const { data, maj, toast } = app;
  const [onglet, setOnglet] = useState<Onglet>("kanban");

  const p = data.projets.find((x) => x.id === id);
  const retour = (
    <Link href="/projets" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900">
      <ChevronLeft className="h-4 w-4" aria-hidden /> Projets
    </Link>
  );

  if (!p || !app.agencesVisibles.some((a) => a.id === p.agenceId)) {
    return (
      <>
        {retour}
        <Carte>
          <EtatVide icone={SearchX} titre="Projet introuvable" texte="Ce projet n'existe pas ou n'appartient pas à vos agences." />
        </Carte>
      </>
    );
  }

  const r = rentabilite(p);
  const taches = data.taches.filter((t) => t.projetId === p.id);
  const duree = Math.max(1, diffDays(p.debut, p.fin));
  const position = (iso: string) => Math.min(100, Math.max(0, (diffDays(p.debut, iso) / duree) * 100));
  const aujourdHui = diffDays(p.debut, TODAY) / duree;

  return (
    <>
      {retour}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{p.code} · {app.nomAgence(p.agenceId)}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-slate-900 sm:text-4xl">{p.nom}</h1>
        </div>
        <Badge>{p.statut}</Badge>
      </div>

      <Carte className="mb-6 p-5">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Definition libelle="Client">{data.clients.find((c) => c.id === p.clientId)?.nom}</Definition>
          <Definition libelle="Chef de projet">{p.chef}</Definition>
          <Definition libelle="Période">{date(p.debut)} → {date(p.fin)}</Definition>
          <Definition libelle="Prix de vente">{fcfaCourt(p.prixVente)}</Definition>
          <Definition libelle="Coût réel / budget">{fcfaCourt(r.coutReel)} / {fcfaCourt(p.budget)}</Definition>
          <Definition libelle="Marge à terminaison">
            <span className={cn("font-semibold", r.depassement ? "text-rose-700" : "text-brand-700")}>{pct(r.taux)}</span>
          </Definition>
        </dl>
        <div className="mt-5">
          <div className="mb-1.5 flex justify-between text-xs text-slate-500">
            <span>Avancement</span>
            <span className="tabular-nums">{Math.round(p.avancement * 100)} %</span>
          </div>
          <Progression valeur={p.avancement} alerte={p.statut === "En retard"} />
        </div>
      </Carte>

      <Onglets
        valeur={onglet}
        onChange={setOnglet}
        onglets={[
          { id: "kanban", libelle: "Kanban", compte: taches.length },
          { id: "gantt", libelle: "Gantt" },
          { id: "rentabilite", libelle: "Rentabilité" },
        ]}
      />

      {taches.length === 0 && onglet !== "rentabilite" ? (
        <Carte>
          <EtatVide titre="Aucune tâche" texte="Ce projet n'a pas encore de tâches planifiées." />
        </Carte>
      ) : onglet === "kanban" ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {COLONNES.map((col) => {
            const cartes = taches.filter((t) => t.statut === col);
            return (
              <section key={col} aria-label={col} className="w-64 shrink-0 rounded-2xl bg-slate-200/45 p-3 ring-1 ring-inset ring-slate-200/70 lg:w-auto lg:flex-1">
                <h2 className="mb-3 px-1 text-sm font-semibold text-slate-800">{col} <span className="font-normal text-slate-500">({cartes.length})</span></h2>
                <ul className="space-y-2">
                  {cartes.map((t) => (
                    <li key={t.id} className="rounded-xl border border-slate-200/80 bg-paper p-3.5 shadow-xs">
                      <p className="text-sm font-medium text-slate-900">{t.titre}</p>
                      <p className="mt-1 text-xs text-slate-500">{t.responsable} · {dateCourte(t.debut)} → {dateCourte(t.fin)}</p>
                      <label className="mt-2 block">
                        <span className="sr-only">Statut de la tâche {t.titre}</span>
                        <select
                          value={t.statut}
                          onChange={(e) => {
                            const statut = e.target.value as StatutTache;
                            maj((d) => ({ ...d, taches: d.taches.map((x) => (x.id === t.id ? { ...x, statut } : x)) }));
                            toast(`Tâche déplacée vers « ${statut} ».`);
                          }}
                          className="h-8 w-full rounded-full border border-slate-300 bg-paper px-2.5 text-xs text-slate-700"
                        >
                          {COLONNES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </label>
                    </li>
                  ))}
                  {cartes.length === 0 && <li className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">Aucune tâche</li>}
                </ul>
              </section>
            );
          })}
        </div>
      ) : onglet === "gantt" ? (
        <Carte className="overflow-x-auto p-5">
          <div className="min-w-[640px]">
            <div className="mb-2 flex justify-between pl-56 text-xs text-slate-500">
              <span>{dateCourte(p.debut)}</span>
              <span>{dateCourte(p.fin)}</span>
            </div>
            <ul className="relative space-y-2">
              {taches.map((t) => {
                const gauche = position(t.debut);
                const largeur = Math.max(3, position(t.fin) - gauche);
                return (
                  <li key={t.id} className="flex items-center">
                    <span className="w-56 shrink-0 truncate pr-3 text-sm text-slate-700" title={t.titre}>{t.titre}</span>
                    <div className="relative h-8 flex-1 rounded-md bg-slate-100/70">
                      <div
                        className={cn(
                          "absolute inset-y-1.5 rounded-[4px]",
                          t.statut === "Terminé" ? "bg-brand-500" : t.statut === "À faire" ? "bg-slate-300" : "bg-accent-400",
                        )}
                        style={{ left: `${gauche}%`, width: `${largeur}%` }}
                        title={`${t.titre} : ${date(t.debut)} → ${date(t.fin)} (${t.statut})`}
                      />
                      {aujourdHui >= 0 && aujourdHui <= 1 && (
                        <div className="absolute inset-y-0 w-px bg-rose-500" style={{ left: `${aujourdHui * 100}%` }} aria-hidden />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 pl-56 text-xs text-slate-600">
              <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-brand-500" /> Terminé</li>
              <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-accent-400" /> En cours ou en revue</li>
              <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-slate-300" /> À faire</li>
              <li className="flex items-center gap-1.5"><span className="h-3 w-px bg-rose-500" /> Aujourd&apos;hui</li>
            </ul>
          </div>
        </Carte>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Carte>
            <TitreCarte titre="Budget contre réel" aide="Coûts imputés au code projet" />
            <div className="p-5">
              <Barres
                lignes={[
                  { libelle: "Budget de coûts", valeur: p.budget, affichage: fcfa(p.budget) },
                  { libelle: "Coût réel à ce jour", valeur: r.coutReel, affichage: fcfa(r.coutReel) },
                  { libelle: "Projection à terminaison", valeur: r.aTerminaison, affichage: fcfa(r.aTerminaison) },
                ]}
              />
              {r.depassement && (
                <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
                  Dépassement prévu de {fcfa(r.aTerminaison - p.budget)} par rapport au budget.
                </p>
              )}
            </div>
          </Carte>
          <Carte>
            <TitreCarte titre="Composition du coût réel" />
            <div className="p-5">
              <Barres
                lignes={[
                  { libelle: "Achats imputés", valeur: p.coutAchats, affichage: fcfa(p.coutAchats) },
                  { libelle: "Temps passé (taux interne)", valeur: p.coutTemps, affichage: fcfa(p.coutTemps) },
                ]}
              />
              <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <Definition libelle="Marge à terminaison">{fcfa(r.marge)}</Definition>
                <Definition libelle="Taux de marge">{pct(r.taux)}</Definition>
              </dl>
              <p className="mt-4 text-xs text-slate-500">
                Le temps passé est valorisé au taux horaire interne de chaque salarié, en attendant le module Paie.
              </p>
            </div>
          </Carte>
        </div>
      )}
    </>
  );
}
