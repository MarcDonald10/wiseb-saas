"use client";

import { useState } from "react";
import { Plus, Star } from "lucide-react";
import { TODAY, addDays, date, nombre } from "@/lib/format";
import { numeroSuivant } from "@/lib/mock";
import { useApp } from "@/lib/store";
import type { CommandeFournisseur, DemandeAchat, Fournisseur } from "@/lib/types";
import { useChampAgence, useColonneAgence } from "@/components/agence";
import { Filtre, Tableau, type Colonne } from "@/components/tableau";
import { Badge, Bouton, EnTete, FormulaireModale, Onglets } from "@/components/ui";

type Onglet = "demandes" | "commandes" | "fournisseurs";

export default function Achats() {
  const app = useApp();
  const { data, maj, toast } = app;
  const [onglet, setOnglet] = useState<Onglet>("demandes");
  const [form, setForm] = useState(false);
  const [statut, setStatut] = useState("");
  const champAgence = useChampAgence();

  const article = (id: string) => data.articles.find((a) => a.id === id);
  const fournisseur = (id: string) => data.fournisseurs.find((f) => f.id === id)?.nom ?? "—";
  const demandes = app.filtrer(data.demandesAchat).filter((d) => !statut || d.statut === statut);
  const commandes = app.filtrer(data.commandesFournisseurs).reverse();

  function valider(d: DemandeAchat) {
    maj((x) => ({ ...x, demandesAchat: x.demandesAchat.map((y) => (y.id === d.id ? { ...y, statut: "Validée" as const } : y)) }));
    toast(`Demande ${d.numero} validée.`);
  }
  function commander(d: DemandeAchat) {
    const a = article(d.articleId)!;
    const f = data.fournisseurs.find((x) => x.categorie.toLowerCase().includes(a.categorie.toLowerCase().slice(0, 5))) ?? data.fournisseurs[0];
    const numero = numeroSuivant("BC", d.agenceId, data.commandesFournisseurs);
    maj((x) => ({
      ...x,
      demandesAchat: x.demandesAchat.map((y) => (y.id === d.id ? { ...y, statut: "Commandée" as const } : y)),
      commandesFournisseurs: [...x.commandesFournisseurs, {
        id: `cf${x.commandesFournisseurs.length + 1}`, numero, agenceId: d.agenceId, fournisseurId: f.id, date: TODAY,
        livraisonPrevue: addDays(TODAY, f.delaiJours), montant: d.quantite * a.prixAchat, statut: "Envoyée" as const,
      }],
    }));
    toast(`Bon de commande ${numero} envoyé à ${f.nom}.`);
  }

  const colDemandes: Colonne<DemandeAchat>[] = [
    { id: "numero", titre: "Demande", cellule: (d) => <span className="whitespace-nowrap font-medium text-slate-900">{d.numero}</span>, valeur: (d) => d.numero },
    {
      id: "article", titre: "Article", valeur: (d) => article(d.articleId)?.nom ?? "",
      cellule: (d) => (<><span className="block text-slate-900">{article(d.articleId)?.nom}</span><span className="text-xs text-slate-500">{article(d.articleId)?.ref}</span></>),
    },
    ...useColonneAgence<DemandeAchat>(),
    { id: "quantite", titre: "Quantité", cellule: (d) => `${nombre(d.quantite)} ${article(d.articleId)?.unite ?? ""}`, valeur: (d) => d.quantite, droite: true },
    { id: "origine", titre: "Origine", cellule: (d) => <Badge>{d.origine}</Badge>, valeur: (d) => d.origine, secondaire: true },
    { id: "date", titre: "Date", cellule: (d) => date(d.date), valeur: (d) => d.date, secondaire: true },
    { id: "statut", titre: "Statut", cellule: (d) => <Badge>{d.statut}</Badge>, valeur: (d) => d.statut },
    {
      id: "actions", titre: "", droite: true,
      cellule: (d) =>
        d.statut === "À valider" ? <Bouton variante="secondaire" taille="sm" onClick={() => valider(d)}>Valider</Bouton>
        : d.statut === "Validée" ? <Bouton variante="secondaire" taille="sm" onClick={() => commander(d)}>Commander</Bouton>
        : null,
    },
  ];

  const colCommandes: Colonne<CommandeFournisseur>[] = [
    { id: "numero", titre: "Commande", cellule: (c) => <span className="whitespace-nowrap font-medium text-slate-900">{c.numero}</span>, valeur: (c) => c.numero },
    { id: "fournisseur", titre: "Fournisseur", cellule: (c) => fournisseur(c.fournisseurId), valeur: (c) => fournisseur(c.fournisseurId) },
    ...useColonneAgence<CommandeFournisseur>(),
    { id: "date", titre: "Date", cellule: (c) => date(c.date), valeur: (c) => c.date, secondaire: true },
    { id: "livraison", titre: "Livraison prévue", cellule: (c) => date(c.livraisonPrevue), valeur: (c) => c.livraisonPrevue, secondaire: true },
    { id: "montant", titre: "Montant (FCFA)", cellule: (c) => nombre(c.montant), valeur: (c) => c.montant, droite: true },
    { id: "statut", titre: "Statut", cellule: (c) => <Badge>{c.statut}</Badge>, valeur: (c) => c.statut },
    {
      id: "actions", titre: "", droite: true,
      cellule: (c) =>
        c.statut === "Reçue" ? null : (
          <Bouton variante="secondaire" taille="sm" onClick={() => {
            maj((x) => ({ ...x, commandesFournisseurs: x.commandesFournisseurs.map((y) => (y.id === c.id ? { ...y, statut: "Reçue" as const } : y)) }));
            toast(`Réception de ${c.numero} enregistrée.`);
          }}>Réceptionner</Bouton>
        ),
    },
  ];

  const colFournisseurs: Colonne<Fournisseur>[] = [
    { id: "nom", titre: "Fournisseur", cellule: (f) => <span className="whitespace-nowrap font-medium text-slate-900">{f.nom}</span>, valeur: (f) => f.nom },
    { id: "categorie", titre: "Catégorie", cellule: (f) => f.categorie, valeur: (f) => f.categorie },
    { id: "ville", titre: "Ville", cellule: (f) => f.ville, valeur: (f) => f.ville, secondaire: true },
    { id: "delai", titre: "Délai moyen", cellule: (f) => `${f.delaiJours} j`, valeur: (f) => f.delaiJours, droite: true },
    {
      id: "note", titre: "Évaluation", valeur: (f) => f.note, droite: true,
      cellule: (f) => (<span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />{f.note.toFixed(1).replace(".", ",")} / 5</span>),
    },
    {
      id: "encours", titre: "Commandes en cours", droite: true, secondaire: true,
      cellule: (f) => app.filtrer(data.commandesFournisseurs).filter((c) => c.fournisseurId === f.id && c.statut !== "Reçue").length,
      valeur: (f) => app.filtrer(data.commandesFournisseurs).filter((c) => c.fournisseurId === f.id && c.statut !== "Reçue").length,
    },
  ];

  return (
    <>
      <EnTete
        titre="Achats"
        description="Demandes d'achat, commandes et fournisseurs. Les demandes automatiques naissent d'un stock passé sous son seuil."
        action={<Bouton icone={Plus} onClick={() => setForm(true)}>Nouvelle demande</Bouton>}
      />

      <Onglets
        valeur={onglet}
        onChange={setOnglet}
        onglets={[
          { id: "demandes", libelle: "Demandes d'achat", compte: app.filtrer(data.demandesAchat).filter((d) => d.statut === "À valider").length },
          { id: "commandes", libelle: "Commandes", compte: commandes.filter((c) => c.statut !== "Reçue").length },
          { id: "fournisseurs", libelle: "Fournisseurs", compte: data.fournisseurs.length },
        ]}
      />

      {onglet === "demandes" && (
        <Tableau
          lignes={demandes} colonnes={colDemandes} cle={(d) => d.id} exportNom="demandes-achat"
          texte={(d) => `${d.numero} ${article(d.articleId)?.nom} ${article(d.articleId)?.ref}`} rechercher="Rechercher une demande ou un article…"
          filtres={<Filtre libelle="Statut" valeur={statut} onChange={setStatut} options={["À valider", "Validée", "Commandée"]} />}
          vide={{ titre: "Aucune demande d'achat", texte: "Aucun article n'est sous son seuil dans ce périmètre." }}
        />
      )}
      {onglet === "commandes" && (
        <Tableau
          lignes={commandes} colonnes={colCommandes} cle={(c) => c.id} exportNom="commandes-fournisseurs"
          texte={(c) => `${c.numero} ${fournisseur(c.fournisseurId)}`} rechercher="Rechercher une commande ou un fournisseur…"
          vide={{ titre: "Aucune commande", texte: "Validez une demande d'achat pour créer une commande." }}
        />
      )}
      {onglet === "fournisseurs" && (
        <>
          <p className="mb-3 text-sm text-slate-500">Le référentiel fournisseurs est partagé par toutes les agences.</p>
          <Tableau
            lignes={data.fournisseurs} colonnes={colFournisseurs} cle={(f) => f.id} exportNom="fournisseurs"
            texte={(f) => `${f.nom} ${f.categorie} ${f.ville}`} rechercher="Rechercher un fournisseur…"
          />
        </>
      )}

      <FormulaireModale
        titre="Nouvelle demande d'achat" ouverte={form} onFermer={() => setForm(false)} libelleValider="Créer la demande"
        champs={[
          { nom: "articleId", libelle: "Article", type: "choix", options: data.articles.map((a) => ({ valeur: a.id, libelle: `${a.ref} · ${a.nom}` })) },
          { nom: "quantite", libelle: "Quantité", type: "nombre" },
          champAgence,
        ]}
        onValider={(v) => {
          const numero = numeroSuivant("DA", v.agenceId, data.demandesAchat);
          maj((d) => ({
            ...d,
            demandesAchat: [{ id: `da${d.demandesAchat.length + 1}`, numero, agenceId: v.agenceId, articleId: v.articleId, quantite: Number(v.quantite), origine: "Manuelle" as const, statut: "À valider" as const, date: TODAY, demandeur: app.user!.nom }, ...d.demandesAchat],
          }));
          setForm(false);
          setOnglet("demandes");
          toast(`Demande ${numero} créée, en attente de validation.`);
        }}
      />
    </>
  );
}
