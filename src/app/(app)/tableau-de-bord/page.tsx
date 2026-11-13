"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, ArrowUpRight, Banknote, CalendarClock, ClipboardCheck, Package, Truck, Users, Wallet } from "lucide-react";
import { indicateurs, rentabilite } from "@/lib/calculs";
import { fcfaCourt, moisCourt, nombre, pct } from "@/lib/format";
import { useApp } from "@/lib/store";
import { Badge, Carte, Indicateur, Perimetre, Progression, TitreCarte, cn } from "@/components/ui";

const MOIS = ["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"];
const EN_COURS = "2026-11";
/** 12,4 M FCFA -> ["12,4", "M FCFA"] pour composer chiffre et unité séparément. */
const scinder = (n: number): [string, string] => {
  const [valeur, ...unite] = fcfaCourt(n).split(" ");
  return [valeur, unite.join(" ")];
};

export default function TableauDeBord() {
  const app = useApp();
  const { data, dansPerimetre, consolide, peut } = app;
  const k = indicateurs(data, dansPerimetre);

  const factures = app.filtrer(data.factures);
  const parMois = MOIS.map((m) => ({ mois: m, total: factures.filter((f) => f.date.startsWith(m)).reduce((s, f) => s + f.montant, 0) }));
  const maxMois = Math.max(1, ...parMois.map((m) => m.total));
  const meilleur = parMois.reduce((a, b) => (b.total > a.total ? b : a));

  const parAgence = app.agencesVisibles
    .map((a) => ({ agence: a, k: indicateurs(data, (id) => id === a.id) }))
    .sort((a, b) => b.k.ca - a.k.ca);
  const maxAgence = Math.max(1, ...parAgence.map((x) => x.k.ca));
  const projets = app.filtrer(data.projets).filter((p) => p.statut === "En cours" || p.statut === "En retard");

  const aVenir = k.reste - k.retardMontant;
  const part = (n: number) => (k.ca ? (n / k.ca) * 100 : 0);
  const [caValeur, caUnite] = scinder(k.ca);
  const [resteValeur, resteUnite] = scinder(k.reste);
  const [stockValeur, stockUnite] = scinder(k.valeurStock);

  const alertes = [
    { module: "ventes" as const, n: k.retardNb, texte: "factures en retard de paiement", detail: fcfaCourt(k.retardMontant), icone: AlertTriangle, rouge: true },
    { module: "stocks" as const, n: k.sousSeuil, texte: "lignes de stock sous le seuil", icone: Package, rouge: true },
    { module: "achats" as const, n: app.filtrer(data.demandesAchat).filter((d) => d.statut === "À valider").length, texte: "demandes d'achat à valider", icone: ClipboardCheck },
    { module: "rh" as const, n: app.filtrer(data.conges).filter((c) => c.statut === "En attente").length, texte: "demandes de congé en attente", icone: CalendarClock },
    { module: "stocks" as const, n: data.transferts.filter((t) => t.statut !== "Reçu" && (dansPerimetre(t.deAgenceId) || dansPerimetre(t.versAgenceId))).length, texte: "transferts inter-agences en cours", icone: Truck },
  ].filter((a) => a.n > 0 && peut(a.module));

  return (
    <>
      {/* Bandeau : le chiffre du périmètre, son encaissement, sa tendance */}
      <section className="motif monte relative overflow-hidden rounded-3xl p-6 text-white shadow-card sm:p-8">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <Perimetre clair />
            <h1 className="mt-3 font-display text-3xl font-medium sm:text-4xl">
              Bonjour {app.user!.nom.split(" ")[0]}<span className="text-accent-400">.</span>
            </h1>

            <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-200/80">Chiffre d&apos;affaires facturé depuis juin</p>
            <p className="mt-2 flex items-baseline gap-2.5">
              <span className="font-display text-6xl font-medium leading-none sm:text-7xl">{caValeur}</span>
              <span className="text-lg font-medium text-brand-200">{caUnite}</span>
            </p>

            {/* Répartition du facturé : encaissé, à venir, en retard */}
            <div className="mt-8 flex h-2.5 gap-[2px]" role="img" aria-label={`Encaissé ${pct(part(k.encaisse) / 100)}, à venir ${pct(part(aVenir) / 100)}, en retard ${pct(part(k.retardMontant) / 100)}`}>
              <span className="rounded-l-full bg-brand-300" style={{ width: `${part(k.encaisse)}%` }} />
              <span className="bg-white/35" style={{ width: `${part(aVenir)}%` }} />
              <span className="rounded-r-full bg-accent-400" style={{ width: `${part(k.retardMontant)}%` }} />
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-4 text-sm">
              {[
                { libelle: "Encaissé", valeur: k.encaisse, point: "bg-brand-300" },
                { libelle: "À venir", valeur: aVenir, point: "bg-white/50" },
                { libelle: "En retard", valeur: k.retardMontant, point: "bg-accent-400" },
              ].map((s) => (
                <div key={s.libelle}>
                  <dt className="flex items-center gap-1.5 text-brand-100/80">
                    <span className={cn("h-2 w-2 rounded-[3px]", s.point)} aria-hidden />
                    {s.libelle}
                  </dt>
                  <dd className="mt-1 font-medium tabular-nums text-white">
                    {fcfaCourt(s.valeur).replace(" FCFA", "")} <span className="whitespace-nowrap text-brand-200/70 max-sm:block">{Math.round(part(s.valeur))} %</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Facturation mensuelle : une série, étiquettes sur le meilleur mois et le mois en cours */}
          <div className="flex flex-col">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-200/80">Facturation mensuelle · M FCFA</h2>
              <p className="flex items-center gap-1.5 text-xs text-brand-200/80">
                <span className="hachures h-2.5 w-2.5 rounded-[3px] text-accent-300" aria-hidden /> mois en cours
              </p>
            </div>
            <div className="mt-4 flex min-h-48 flex-1 items-end gap-2 border-b border-white/15 sm:gap-3">
              {parMois.map((m) => {
                const enCours = m.mois === EN_COURS;
                const etiquette = enCours || m.mois === meilleur.mois;
                return (
                  <div key={m.mois} tabIndex={0} aria-label={`${moisCourt(m.mois)} : ${fcfaCourt(m.total)}`} className="group relative flex h-full flex-1 flex-col items-center justify-end outline-offset-4">
                    <span className={cn("mb-1.5 text-xs font-medium tabular-nums text-white transition-opacity", !etiquette && "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100")}>
                      {(m.total / 1e6).toFixed(0)}
                    </span>
                    <div
                      className={cn("w-full max-w-12 rounded-t-[4px] transition-colors", enCours ? "hachures text-accent-300" : "bg-brand-300 group-hover:bg-brand-200")}
                      style={{ height: `${Math.max(2, (m.total / maxMois) * 82)}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex gap-2 sm:gap-3">
              {parMois.map((m) => (
                <span key={m.mois} className="flex-1 text-center text-xs text-brand-200/80">{moisCourt(m.mois)}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicateur libelle="Reste à encaisser" valeur={resteValeur} unite={resteUnite} detail={`${k.retardNb} factures en retard`} icone={Wallet} alerte={k.retardNb > 0} />
        <Indicateur libelle="Valeur du stock" valeur={stockValeur} unite={stockUnite} detail={`${k.sousSeuil} lignes sous le seuil`} icone={Package} />
        <Indicateur libelle="Marge des projets" valeur={pct(k.tauxMarge).replace(" %", "")} unite="%" detail={`${k.projetsActifs} projets en cours`} icone={Banknote} />
        <Indicateur libelle="Présence aujourd'hui" valeur={`${k.presents}`} unite={`/ ${k.effectif} salariés`} jauge={k.effectif ? k.presents / k.effectif : 0} icone={Users} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {consolide ? (
          <Carte className="xl:col-span-2">
            <TitreCarte titre="Classement des agences" aide="Par chiffre d'affaires facturé. Cliquez sur une agence pour passer sur son périmètre." />
            <ol className="mt-4 divide-y divide-slate-100">
              {parAgence.map(({ agence, k: ka }, i) => (
                <li key={agence.id}>
                  <button type="button" onClick={() => app.choisirAgence(agence.id)} className="group grid w-full grid-cols-[2.5rem_1fr_auto] items-center gap-x-4 px-6 py-4 text-left transition-colors hover:bg-slate-50/80">
                    <span className="font-display text-2xl font-medium text-accent-500">{String(i + 1).padStart(2, "0")}</span>
                    <span className="min-w-0">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="truncate font-semibold text-slate-900">{agence.nom}</span>
                        <span className="shrink-0 text-sm font-medium tabular-nums text-slate-900">
                          {fcfaCourt(ka.ca)} <span className="font-normal text-slate-500">· {pct(k.ca ? ka.ca / k.ca : 0)}</span>
                        </span>
                      </span>
                      <span className="mt-2 block h-1.5 rounded-full bg-slate-100">
                        <span className="block h-1.5 rounded-full bg-brand-500" style={{ width: `${(ka.ca / maxAgence) * 100}%` }} />
                      </span>
                      <span className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs tabular-nums text-slate-500">
                        <span>À encaisser <strong className="font-medium text-slate-700">{fcfaCourt(ka.reste)}</strong></span>
                        <span>Stock <strong className="font-medium text-slate-700">{fcfaCourt(ka.valeurStock)}</strong></span>
                        <span>Marge projets <strong className="font-medium text-slate-700">{ka.projetsActifs ? pct(ka.tauxMarge) : "—"}</strong></span>
                        <span>Effectif <strong className="font-medium text-slate-700">{nombre(ka.effectif)}</strong></span>
                      </span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-brand-700" aria-hidden />
                  </button>
                </li>
              ))}
            </ol>
          </Carte>
        ) : (
          <Carte className="xl:col-span-2">
            <TitreCarte
              titre="Projets en cours"
              aide="Avancement et marge prévue à terminaison"
              action={peut("projets") ? <Link href="/projets" className="text-sm font-medium text-brand-700 underline-offset-4 hover:underline">Tout voir</Link> : undefined}
            />
            {projets.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-slate-500">Aucun projet en cours dans cette agence.</p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100">
                {projets.map((p) => {
                  const r = rentabilite(p);
                  return (
                    <li key={p.id} className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 px-6 py-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{p.nom}</p>
                        <p className="text-xs text-slate-500">{p.code} · {p.chef}</p>
                      </div>
                      <Badge>{p.statut}</Badge>
                      <Progression valeur={p.avancement} alerte={p.statut === "En retard"} />
                      <p className="text-right text-sm tabular-nums text-slate-700">{Math.round(p.avancement * 100)} % · marge {pct(r.taux)}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Carte>
        )}

        <Carte>
          <TitreCarte titre="À traiter" aide="Dans le périmètre affiché" />
          {alertes.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-500">Rien à traiter pour le moment.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100 pb-2">
              {alertes.map((a) => (
                <li key={a.texte}>
                  <Link href={`/${a.module}`} className="group flex items-center gap-3.5 px-6 py-3.5 transition-colors hover:bg-slate-50/80">
                    <span className={cn("rounded-full p-2.5", a.rouge ? "bg-rose-50 text-rose-700" : "bg-accent-50 text-accent-700")}>
                      <a.icone className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 text-sm text-slate-600">
                      <strong className="font-display text-lg font-semibold text-slate-900">{a.n}</strong> {a.texte}
                      {a.detail && <span className="block text-xs text-slate-500">{a.detail}</span>}
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-brand-700" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Carte>
      </div>
    </>
  );
}
