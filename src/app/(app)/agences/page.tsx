"use client";

import { useState } from "react";
import { Building2, MapPin, Plus, Warehouse } from "lucide-react";
import { indicateurs } from "@/lib/calculs";
import { fcfaCourt, pct } from "@/lib/format";
import { useApp } from "@/lib/store";
import { Badge, Barres, Bouton, Carte, EnTete, FormulaireModale, TitreCarte } from "@/components/ui";

export default function Agences() {
  const app = useApp();
  const { data, maj, toast } = app;
  const [form, setForm] = useState(false);
  const groupe = app.user!.scope === "all";

  const lignes = app.agencesVisibles.map((a) => ({ agence: a, k: indicateurs(data, (id) => id === a.id), entrepots: data.entrepots.filter((e) => e.agenceId === a.id) }));

  return (
    <>
      <EnTete
        titre="Agences"
        description={groupe ? "Toutes les agences du groupe partagent la même base de données." : "Votre agence. Les autres agences du groupe ne vous sont pas visibles."}
        action={groupe ? <Bouton icone={Plus} onClick={() => setForm(true)}>Nouvelle agence</Bouton> : undefined}
      />

      <ul className="grid gap-4 md:grid-cols-2">
        {lignes.map(({ agence: a, k, entrepots }) => (
          <li key={a.id}>
            <Carte className="h-full p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-brand-50 p-2.5 text-brand-600"><Building2 className="h-5 w-5" aria-hidden /></span>
                  <div>
                    <h2 className="font-display text-xl font-semibold text-slate-900">{a.nom}</h2>
                    <p className="flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-3.5 w-3.5" aria-hidden />{a.ville} · code {a.code}</p>
                  </div>
                </div>
                {a.siege && <Badge ton="bleu">Siège</Badge>}
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
                <div><dt className="text-xs text-slate-500">Facturé</dt><dd className="font-display text-xl font-semibold text-slate-900">{fcfaCourt(k.ca).replace(" FCFA", "")}</dd></div>
                <div><dt className="text-xs text-slate-500">Stock</dt><dd className="font-display text-xl font-semibold text-slate-900">{fcfaCourt(k.valeurStock).replace(" FCFA", "")}</dd></div>
                <div><dt className="text-xs text-slate-500">Projets actifs</dt><dd className="font-display text-xl font-semibold text-slate-900">{k.projetsActifs}</dd></div>
                <div><dt className="text-xs text-slate-500">Effectif</dt><dd className="font-display text-xl font-semibold text-slate-900">{k.effectif}</dd></div>
              </dl>
              <p className="mt-4 flex items-start gap-1.5 border-t border-slate-100 pt-3 text-sm text-slate-600">
                <Warehouse className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                {entrepots.length ? entrepots.map((e) => e.nom).join(", ") : "Aucun entrepôt pour le moment"}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-slate-500">Responsable : {a.responsable}</p>
                {app.peutConsolider && (
                  <Bouton variante="secondaire" taille="sm" onClick={() => { app.choisirAgence(a.id); toast(`Périmètre : ${a.nom}.`, "info"); }} disabled={app.agenceId === a.id}>
                    {app.agenceId === a.id ? "Périmètre actuel" : "Voir cette agence"}
                  </Bouton>
                )}
              </div>
            </Carte>
          </li>
        ))}
      </ul>

      {lignes.length > 1 && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Carte>
            <TitreCarte titre="Reste à encaisser par agence" />
            <div className="p-5">
              <Barres lignes={lignes.map(({ agence, k }) => ({ libelle: agence.nom, valeur: k.reste, affichage: fcfaCourt(k.reste), detail: k.retardNb ? `${k.retardNb} en retard` : undefined }))} />
            </div>
          </Carte>
          <Carte>
            <TitreCarte titre="Taux de présence par agence" aide="Salariés présents aujourd'hui" />
            <div className="p-5">
              <Barres lignes={lignes.map(({ agence, k }) => ({ libelle: agence.nom, valeur: k.effectif ? k.presents / k.effectif : 0, affichage: k.effectif ? pct(k.presents / k.effectif) : "—", detail: `${k.presents}/${k.effectif}` }))} />
            </div>
          </Carte>
        </div>
      )}

      <FormulaireModale
        titre="Nouvelle agence" ouverte={form} onFermer={() => setForm(false)} libelleValider="Créer l'agence"
        champs={[
          { nom: "ville", libelle: "Ville", placeholder: "Ex. Kribi" },
          { nom: "code", libelle: "Code (3 lettres)", placeholder: "Ex. KBI", aide: "Utilisé dans la numérotation des documents : FAC-KBI-2026-00001." },
          { nom: "responsable", libelle: "Responsable" },
        ]}
        onValider={(v) => {
          const code = v.code.trim().toUpperCase();
          if (!/^[A-Z]{3}$/.test(code)) {
            toast("Le code doit comporter exactement 3 lettres.", "info");
            return;
          }
          if (data.agences.some((a) => a.code === code)) {
            toast(`Le code ${code} est déjà utilisé par une autre agence.`, "info");
            return;
          }
          maj((d) => ({ ...d, agences: [...d.agences, { id: code.toLowerCase(), code, nom: v.ville, ville: v.ville, responsable: v.responsable, siege: false }] }));
          setForm(false);
          toast(`Agence ${v.ville} créée. Elle apparaît dans le sélecteur de périmètre.`);
        }}
      />
    </>
  );
}
