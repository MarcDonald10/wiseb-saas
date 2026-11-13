"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";
import { rentabilite } from "@/lib/calculs";
import { TODAY, date, fcfaCourt, pct } from "@/lib/format";
import { useApp } from "@/lib/store";
import { useChampAgence } from "@/components/agence";
import { Filtre } from "@/components/tableau";
import { Badge, Bouton, Carte, EnTete, EtatVide, FormulaireModale, Progression } from "@/components/ui";

export default function Projets() {
  const app = useApp();
  const { data, maj, toast } = app;
  const [form, setForm] = useState(false);
  const [statut, setStatut] = useState("");
  const champAgence = useChampAgence();

  const tous = app.filtrer(data.projets);
  const projets = tous.filter((p) => !statut || p.statut === statut);
  const client = (id: string) => data.clients.find((c) => c.id === id)?.nom ?? "—";

  return (
    <>
      <EnTete
        titre="Projets"
        description="Avancement, coûts imputés et marge de chaque projet."
        action={<Bouton icone={Plus} onClick={() => setForm(true)}>Nouveau projet</Bouton>}
      />

      <div className="mb-4">
        <Filtre libelle="Statut" valeur={statut} onChange={setStatut} options={["En cours", "En retard", "Planifié", "Terminé"]} />
      </div>

      {projets.length === 0 ? (
        <Carte>
          <EtatVide
            icone={FolderKanban}
            titre={tous.length === 0 ? "Aucun projet" : "Aucun projet avec ce statut"}
            texte={tous.length === 0 ? "Créez un projet pour suivre ses tâches, ses coûts et sa marge." : undefined}
            action={tous.length === 0 ? <Bouton icone={Plus} onClick={() => setForm(true)}>Nouveau projet</Bouton> : <Bouton variante="secondaire" onClick={() => setStatut("")}>Voir tous les projets</Bouton>}
          />
        </Carte>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projets.map((p) => {
            const r = rentabilite(p);
            return (
              <li key={p.id}>
                <Link href={`/projets/${p.id}`} className="block h-full rounded-2xl border border-slate-200/80 bg-paper p-6 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-300">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">{p.code}{app.consolide && ` · ${app.nomAgence(p.agenceId)}`}</p>
                      <h2 className="mt-1 font-display text-xl font-semibold text-slate-900">{p.nom}</h2>
                      <p className="text-sm text-slate-500">{client(p.clientId)}</p>
                    </div>
                    <Badge>{p.statut}</Badge>
                  </div>
                  <div className="mt-4">
                    <div className="mb-1.5 flex justify-between text-xs text-slate-500">
                      <span>Avancement</span>
                      <span className="tabular-nums">{Math.round(p.avancement * 100)} %</span>
                    </div>
                    <Progression valeur={p.avancement} alerte={p.statut === "En retard"} />
                  </div>
                  <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-sm">
                    <div>
                      <dt className="text-xs text-slate-500">Vente</dt>
                      <dd className="font-medium tabular-nums text-slate-900">{fcfaCourt(p.prixVente).replace(" FCFA", "")}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Coût réel</dt>
                      <dd className="font-medium tabular-nums text-slate-900">{fcfaCourt(r.coutReel).replace(" FCFA", "")}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Marge prévue</dt>
                      <dd className={`font-medium tabular-nums ${r.depassement ? "text-rose-700" : "text-brand-700"}`}>{pct(r.taux)}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-xs text-slate-500">{p.chef} · fin prévue le {date(p.fin)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <FormulaireModale
        titre="Nouveau projet" ouverte={form} onFermer={() => setForm(false)} libelleValider="Créer le projet"
        champs={[
          { nom: "nom", libelle: "Nom du projet" },
          { nom: "clientId", libelle: "Client", type: "choix", options: app.filtrer(data.clients).map((c) => ({ valeur: c.id, libelle: c.nom })) },
          champAgence,
          { nom: "prixVente", libelle: "Prix de vente (FCFA)", type: "nombre" },
          { nom: "budget", libelle: "Budget de coûts (FCFA)", type: "nombre" },
          { nom: "fin", libelle: "Date de fin prévue", type: "date" },
        ]}
        onValider={(v) => {
          maj((d) => ({
            ...d,
            projets: [...d.projets, {
              id: `pr${d.projets.length + 1}`, code: `PRJ-${v.agenceId.toUpperCase()}-${String(d.projets.length + 1).padStart(3, "0")}`, nom: v.nom,
              agenceId: v.agenceId, clientId: v.clientId, chef: app.user!.nom, debut: TODAY, fin: v.fin, budget: Number(v.budget), prixVente: Number(v.prixVente),
              coutTemps: 0, coutAchats: 0, avancement: 0, statut: "Planifié" as const,
            }],
          }));
          setForm(false);
          toast(`Projet « ${v.nom} » créé.`);
        }}
      />
    </>
  );
}
