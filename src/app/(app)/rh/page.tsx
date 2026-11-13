"use client";

import { useState } from "react";
import { Clock, LogIn, LogOut, Plus } from "lucide-react";
import { TODAY, date, diffDays, fcfa } from "@/lib/format";
import { useApp } from "@/lib/store";
import type { Conge, Employe, Pointage } from "@/lib/types";
import { useColonneAgence } from "@/components/agence";
import { Filtre, Tableau, type Colonne } from "@/components/tableau";
import { Badge, Bouton, Carte, EnTete, FormulaireModale, Onglets } from "@/components/ui";

type Onglet = "pointage" | "conges" | "salaries";
const heure = () => new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const duree = (h: number) => (h ? `${Math.floor(h)} h ${String(Math.round((h % 1) * 60)).padStart(2, "0")}` : "—");

export default function RessourcesHumaines() {
  const app = useApp();
  const { data, maj, toast } = app;
  const [onglet, setOnglet] = useState<Onglet>("pointage");
  const [form, setForm] = useState(false);
  const [jour, setJour] = useState(TODAY);
  const [statutConge, setStatutConge] = useState("");
  const [departement, setDepartement] = useState("");
  const [badge, setBadge] = useState<{ entree: string | null; sortie: string | null }>({ entree: null, sortie: null });

  // Les rôles de direction valident les congés et voient les taux horaires.
  const gestion = app.peut("agences");
  const employes = app.filtrer(data.employes);
  const employe = (id: string) => data.employes.find((e) => e.id === id);
  const conges = app.filtrer(data.conges).filter((c) => !statutConge || c.statut === statutConge);
  const pointages = app.filtrer(data.pointages).filter((p) => p.date === jour);
  const jours = [...new Set(data.pointages.map((p) => p.date))].sort().reverse();

  function decider(c: Conge, statut: Conge["statut"]) {
    maj((d) => ({ ...d, conges: d.conges.map((x) => (x.id === c.id ? { ...x, statut } : x)) }));
    toast(`Congé de ${employe(c.employeId)?.nom} ${statut === "Approuvé" ? "approuvé" : "refusé"}.`);
  }

  const colPointages: Colonne<Pointage>[] = [
    {
      id: "salarie", titre: "Salarié", valeur: (p) => employe(p.employeId)?.nom ?? "",
      cellule: (p) => (<><span className="block font-medium text-slate-900">{employe(p.employeId)?.nom}</span><span className="text-xs text-slate-500">{employe(p.employeId)?.poste}</span></>),
    },
    ...useColonneAgence<Pointage>(),
    { id: "entree", titre: "Entrée", cellule: (p) => p.entree, valeur: (p) => p.entree, droite: true },
    { id: "sortie", titre: "Sortie", cellule: (p) => p.sortie ?? <Badge ton="vert">En poste</Badge>, valeur: (p) => p.sortie ?? "", droite: true },
    { id: "heures", titre: "Heures", cellule: (p) => duree(p.heures), valeur: (p) => p.heures, droite: true, secondaire: true },
    { id: "sup", titre: "Heures sup.", cellule: (p) => (p.heuresSup ? <span className="font-medium text-amber-700">+{duree(p.heuresSup)}</span> : "—"), valeur: (p) => p.heuresSup, droite: true, secondaire: true },
  ];

  const colConges: Colonne<Conge>[] = [
    { id: "salarie", titre: "Salarié", cellule: (c) => <span className="whitespace-nowrap font-medium text-slate-900">{employe(c.employeId)?.nom}</span>, valeur: (c) => employe(c.employeId)?.nom ?? "" },
    ...useColonneAgence<Conge>(),
    { id: "type", titre: "Type", cellule: (c) => c.type, valeur: (c) => c.type, secondaire: true },
    { id: "periode", titre: "Période", cellule: (c) => `${date(c.debut)} → ${date(c.fin)}`, valeur: (c) => c.debut },
    { id: "jours", titre: "Jours", cellule: (c) => c.jours, valeur: (c) => c.jours, droite: true },
    { id: "statut", titre: "Statut", cellule: (c) => <Badge>{c.statut}</Badge>, valeur: (c) => c.statut },
    ...(gestion
      ? [{
          id: "actions", titre: "", droite: true,
          cellule: (c: Conge) =>
            c.statut === "En attente" ? (
              <span className="flex justify-end gap-1">
                <Bouton variante="danger" taille="sm" onClick={() => decider(c, "Refusé")}>Refuser</Bouton>
                <Bouton variante="secondaire" taille="sm" onClick={() => decider(c, "Approuvé")}>Approuver</Bouton>
              </span>
            ) : null,
        } satisfies Colonne<Conge>]
      : []),
  ];

  const colSalaries: Colonne<Employe>[] = [
    { id: "nom", titre: "Salarié", cellule: (e) => <span className="whitespace-nowrap font-medium text-slate-900">{e.nom}</span>, valeur: (e) => e.nom },
    { id: "poste", titre: "Poste", cellule: (e) => e.poste, valeur: (e) => e.poste },
    { id: "departement", titre: "Département", cellule: (e) => e.departement, valeur: (e) => e.departement, secondaire: true },
    ...useColonneAgence<Employe>(),
    { id: "contrat", titre: "Contrat", cellule: (e) => e.contrat, valeur: (e) => e.contrat, secondaire: true },
    { id: "entree", titre: "Entrée", cellule: (e) => date(e.dateEntree), valeur: (e) => e.dateEntree, secondaire: true },
    ...(gestion ? [{ id: "taux", titre: "Taux horaire", cellule: (e: Employe) => fcfa(e.tauxHoraire), valeur: (e: Employe) => e.tauxHoraire, droite: true, secondaire: true } satisfies Colonne<Employe>] : []),
    { id: "statut", titre: "Aujourd'hui", cellule: (e) => <Badge>{e.statut}</Badge>, valeur: (e) => e.statut },
  ];

  const enPoste = badge.entree && !badge.sortie;

  return (
    <>
      <EnTete
        titre="Ressources humaines"
        description={`${employes.filter((e) => e.statut === "Présent").length} salariés présents sur ${employes.length}.`}
        action={<Bouton icone={Plus} onClick={() => setForm(true)}>Demander un congé</Bouton>}
      />

      <Onglets
        valeur={onglet}
        onChange={setOnglet}
        onglets={[
          { id: "pointage", libelle: "Pointage" },
          { id: "conges", libelle: "Congés", compte: app.filtrer(data.conges).filter((c) => c.statut === "En attente").length },
          { id: "salaries", libelle: "Salariés", compte: employes.length },
        ]}
      />

      {onglet === "pointage" && (
        <>
          <Carte className="mb-5 flex flex-wrap items-center gap-4 p-5">
            <span className="rounded-2xl bg-brand-700 p-3 text-accent-300"><Clock className="h-6 w-6" aria-hidden /></span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">Mon badgeage du jour</p>
              <p className="text-sm text-slate-500" aria-live="polite">
                {!badge.entree ? "Vous n'avez pas encore badgé aujourd'hui."
                  : enPoste ? `Entrée enregistrée à ${badge.entree}.`
                  : `Journée terminée : ${badge.entree} → ${badge.sortie}.`}
              </p>
            </div>
            {enPoste ? (
              <Bouton variante="secondaire" icone={LogOut} onClick={() => { const h = heure(); setBadge((b) => ({ ...b, sortie: h })); toast(`Sortie enregistrée à ${h}.`); }}>Badger la sortie</Bouton>
            ) : (
              <Bouton icone={LogIn} disabled={!!badge.sortie} onClick={() => { const h = heure(); setBadge({ entree: h, sortie: null }); toast(`Entrée enregistrée à ${h}.`); }}>Badger l&apos;entrée</Bouton>
            )}
          </Carte>
          <Tableau
            lignes={pointages} colonnes={colPointages} cle={(p) => p.id} exportNom={`pointages-${jour}`}
            texte={(p) => `${employe(p.employeId)?.nom} ${employe(p.employeId)?.poste}`} rechercher="Rechercher un salarié…"
            filtres={
              <label>
                <span className="sr-only">Jour</span>
                <select value={jour} onChange={(e) => setJour(e.target.value)} className="h-9 rounded-full border border-slate-300 bg-paper px-3.5 text-sm text-slate-700">
                  {jours.map((j) => <option key={j} value={j}>{j === TODAY ? "Aujourd'hui" : date(j)}</option>)}
                </select>
              </label>
            }
            vide={{ titre: "Aucun pointage ce jour-là" }}
          />
        </>
      )}

      {onglet === "conges" && (
        <Tableau
          lignes={conges} colonnes={colConges} cle={(c) => c.id} exportNom="conges"
          texte={(c) => `${employe(c.employeId)?.nom} ${c.type}`} rechercher="Rechercher un salarié…"
          filtres={<Filtre libelle="Statut" valeur={statutConge} onChange={setStatutConge} options={["En attente", "Approuvé", "Refusé"]} />}
          vide={{ titre: "Aucune demande de congé", action: <Bouton icone={Plus} onClick={() => setForm(true)}>Demander un congé</Bouton> }}
        />
      )}

      {onglet === "salaries" && (
        <Tableau
          lignes={employes.filter((e) => !departement || e.departement === departement)} colonnes={colSalaries} cle={(e) => e.id} exportNom="salaries"
          texte={(e) => `${e.nom} ${e.poste} ${e.departement}`} rechercher="Rechercher un salarié ou un poste…"
          filtres={<Filtre libelle="Département" valeur={departement} onChange={setDepartement} options={[...new Set(data.employes.map((e) => e.departement))].sort()} />}
        />
      )}

      <FormulaireModale
        titre="Demander un congé" ouverte={form} onFermer={() => setForm(false)} libelleValider="Envoyer la demande"
        champs={[
          { nom: "employeId", libelle: "Salarié", type: "choix", options: employes.map((e) => ({ valeur: e.id, libelle: e.nom })) },
          { nom: "type", libelle: "Type de congé", type: "choix", options: ["Congé annuel", "Congé maladie", "Permission exceptionnelle", "Congé sans solde"].map((t) => ({ valeur: t, libelle: t })) },
          { nom: "debut", libelle: "Premier jour", type: "date", defaut: TODAY },
          { nom: "fin", libelle: "Dernier jour", type: "date", defaut: TODAY },
        ]}
        onValider={(v) => {
          const jours = diffDays(v.debut, v.fin) + 1;
          if (jours < 1) {
            toast("Le dernier jour doit être postérieur ou égal au premier jour.", "info");
            return;
          }
          const e = employe(v.employeId)!;
          maj((d) => ({
            ...d,
            conges: [{ id: `cg${d.conges.length + 1}`, agenceId: e.agenceId, employeId: e.id, type: v.type, debut: v.debut, fin: v.fin, jours, statut: "En attente" as const }, ...d.conges],
          }));
          setForm(false);
          setOnglet("conges");
          toast(`Demande de congé envoyée (${jours} jour${jours > 1 ? "s" : ""}).`);
        }}
      />
    </>
  );
}
