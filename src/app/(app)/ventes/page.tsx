"use client";

import { useState } from "react";
import { Link2, Plus } from "lucide-react";
import { TODAY, addDays, date, fcfaCourt, nombre } from "@/lib/format";
import { numeroSuivant } from "@/lib/mock";
import { useApp } from "@/lib/store";
import type { Client, Devis, Etape, Facture } from "@/lib/types";
import { useChampAgence, useColonneAgence } from "@/components/agence";
import { Filtre, Tableau, type Colonne } from "@/components/tableau";
import { Badge, Bouton, EnTete, FormulaireModale, Onglets } from "@/components/ui";

type Onglet = "factures" | "devis" | "pipeline" | "clients";
const ETAPES: Etape[] = ["Prospect", "Qualifié", "Proposition", "Négociation", "Gagné"];

export default function Ventes() {
  const app = useApp();
  const { data, maj, toast } = app;
  const [onglet, setOnglet] = useState<Onglet>("factures");
  const [form, setForm] = useState<"devis" | "client" | null>(null);
  const [statutFacture, setStatutFacture] = useState("");
  const [statutDevis, setStatutDevis] = useState("");

  const champAgence = useChampAgence();
  const client = (id: string) => data.clients.find((c) => c.id === id)?.nom ?? "—";
  const clients = app.filtrer(data.clients);
  const devis = app.filtrer(data.devis).filter((d) => !statutDevis || d.statut === statutDevis).reverse();
  const factures = app.filtrer(data.factures).filter((f) => !statutFacture || f.statut === statutFacture).reverse();
  const opportunites = app.filtrer(data.opportunites);

  const colAgenceFacture = useColonneAgence<Facture>();
  const colAgenceDevis = useColonneAgence<Devis>();
  const colAgenceClient = useColonneAgence<Client>();

  function encaisser(f: Facture) {
    maj((d) => ({ ...d, factures: d.factures.map((x) => (x.id === f.id ? { ...x, paye: x.montant, statut: "Payée" as const } : x)) }));
    toast(`Facture ${f.numero} marquée comme payée.`);
  }

  const colFactures: Colonne<Facture>[] = [
    { id: "numero", titre: "Facture", cellule: (f) => <span className="whitespace-nowrap font-medium text-slate-900">{f.numero}</span>, valeur: (f) => f.numero },
    { id: "client", titre: "Client", cellule: (f) => client(f.clientId), valeur: (f) => client(f.clientId) },
    ...colAgenceFacture,
    { id: "echeance", titre: "Échéance", cellule: (f) => date(f.echeance), valeur: (f) => f.echeance, secondaire: true },
    { id: "montant", titre: "Montant (FCFA)", cellule: (f) => nombre(f.montant), valeur: (f) => f.montant, droite: true },
    { id: "reste", titre: "Reste dû", cellule: (f) => (f.montant - f.paye ? nombre(f.montant - f.paye) : "—"), valeur: (f) => f.montant - f.paye, droite: true, secondaire: true },
    { id: "statut", titre: "Statut", cellule: (f) => <Badge>{f.statut}</Badge>, valeur: (f) => f.statut },
    {
      id: "actions", titre: "", droite: true,
      cellule: (f) =>
        f.statut === "Payée" ? null : (
          <span className="flex justify-end gap-1">
            <Bouton variante="discret" taille="sm" icone={Link2} aria-label={`Copier le lien de paiement de ${f.numero}`} title="Copier le lien de paiement"
              onClick={() => toast(`Lien de paiement de ${f.numero} copié (${f.moyen}).`, "info")} />
            <Bouton variante="secondaire" taille="sm" onClick={() => encaisser(f)}>Encaisser</Bouton>
          </span>
        ),
    },
  ];

  const colDevis: Colonne<Devis>[] = [
    { id: "numero", titre: "Devis", cellule: (d) => <span className="whitespace-nowrap font-medium text-slate-900">{d.numero}</span>, valeur: (d) => d.numero },
    { id: "client", titre: "Client", cellule: (d) => client(d.clientId), valeur: (d) => client(d.clientId) },
    ...colAgenceDevis,
    { id: "date", titre: "Date", cellule: (d) => date(d.date), valeur: (d) => d.date, secondaire: true },
    { id: "montant", titre: "Montant (FCFA)", cellule: (d) => nombre(d.montant), valeur: (d) => d.montant, droite: true },
    { id: "statut", titre: "Statut", cellule: (d) => <Badge>{d.statut}</Badge>, valeur: (d) => d.statut },
    {
      id: "actions", titre: "", droite: true,
      cellule: (d) =>
        d.statut === "Brouillon" ? (
          <Bouton variante="secondaire" taille="sm" onClick={() => {
            maj((x) => ({ ...x, devis: x.devis.map((y) => (y.id === d.id ? { ...y, statut: "Envoyé" as const } : y)) }));
            toast(`Devis ${d.numero} envoyé au client.`);
          }}>Envoyer</Bouton>
        ) : d.statut === "Envoyé" ? (
          <Bouton variante="secondaire" taille="sm" onClick={() => {
            maj((x) => ({
              ...x,
              devis: x.devis.map((y) => (y.id === d.id ? { ...y, statut: "Accepté" as const } : y)),
              factures: [...x.factures, {
                id: `fa${x.factures.length + 1}`, numero: numeroSuivant("FAC", d.agenceId, x.factures), agenceId: d.agenceId, clientId: d.clientId,
                date: TODAY, echeance: addDays(TODAY, 30), montant: d.montant, paye: 0, statut: "En attente" as const, moyen: "Mobile Money",
              }],
            }));
            toast(`Devis ${d.numero} accepté : facture créée.`);
          }}>Facturer</Bouton>
        ) : null,
    },
  ];

  const colClients: Colonne<Client>[] = [
    { id: "nom", titre: "Client", cellule: (c) => <span className="whitespace-nowrap font-medium text-slate-900">{c.nom}</span>, valeur: (c) => c.nom },
    { id: "secteur", titre: "Secteur", cellule: (c) => c.secteur, valeur: (c) => c.secteur, secondaire: true },
    ...colAgenceClient,
    { id: "contact", titre: "Contact", cellule: (c) => c.contact, valeur: (c) => c.contact },
    { id: "telephone", titre: "Téléphone", cellule: (c) => c.telephone, valeur: (c) => c.telephone, secondaire: true },
    {
      id: "encours", titre: "Encours", droite: true,
      cellule: (c) => fcfaCourt(data.factures.filter((f) => f.clientId === c.id).reduce((s, f) => s + f.montant - f.paye, 0)),
      valeur: (c) => data.factures.filter((f) => f.clientId === c.id).reduce((s, f) => s + f.montant - f.paye, 0),
    },
  ];

  return (
    <>
      <EnTete
        titre="Ventes"
        description="Clients, opportunités, devis et factures."
        action={
          <>
            <Bouton variante="secondaire" icone={Plus} onClick={() => setForm("client")}>Client</Bouton>
            <Bouton icone={Plus} onClick={() => setForm("devis")}>Nouveau devis</Bouton>
          </>
        }
      />

      <Onglets
        valeur={onglet}
        onChange={setOnglet}
        onglets={[
          { id: "factures", libelle: "Factures", compte: app.filtrer(data.factures).length },
          { id: "devis", libelle: "Devis", compte: app.filtrer(data.devis).length },
          { id: "pipeline", libelle: "Pipeline", compte: opportunites.length },
          { id: "clients", libelle: "Clients", compte: clients.length },
        ]}
      />

      {onglet === "factures" && (
        <Tableau
          lignes={factures} colonnes={colFactures} cle={(f) => f.id} exportNom="factures"
          texte={(f) => `${f.numero} ${client(f.clientId)}`} rechercher="Rechercher une facture ou un client…"
          filtres={<Filtre libelle="Statut" valeur={statutFacture} onChange={setStatutFacture} options={["En attente", "Partielle", "En retard", "Payée"]} />}
          vide={{ titre: "Aucune facture", texte: "Les factures apparaissent ici dès qu'un devis est accepté." }}
        />
      )}

      {onglet === "devis" && (
        <Tableau
          lignes={devis} colonnes={colDevis} cle={(d) => d.id} exportNom="devis"
          texte={(d) => `${d.numero} ${client(d.clientId)}`} rechercher="Rechercher un devis ou un client…"
          filtres={<Filtre libelle="Statut" valeur={statutDevis} onChange={setStatutDevis} options={["Brouillon", "Envoyé", "Accepté", "Refusé"]} />}
          vide={{ titre: "Aucun devis", texte: "Créez votre premier devis.", action: <Bouton icone={Plus} onClick={() => setForm("devis")}>Nouveau devis</Bouton> }}
        />
      )}

      {onglet === "pipeline" && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {ETAPES.map((etape) => {
            const cartes = opportunites.filter((o) => o.etape === etape);
            return (
              <section key={etape} aria-label={etape} className="w-72 shrink-0 rounded-2xl bg-slate-200/45 p-3 ring-1 ring-inset ring-slate-200/70">
                <header className="mb-3 flex items-baseline justify-between px-1">
                  <h2 className="text-sm font-semibold text-slate-800">{etape} <span className="font-normal text-slate-500">({cartes.length})</span></h2>
                  <span className="text-xs tabular-nums text-slate-500">{fcfaCourt(cartes.reduce((s, o) => s + o.montant, 0))}</span>
                </header>
                <ul className="space-y-2">
                  {cartes.map((o) => (
                    <li key={o.id} className="rounded-xl border border-slate-200/80 bg-paper p-3.5 shadow-xs">
                      <p className="text-sm font-medium text-slate-900">{o.titre}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{client(o.clientId)}</p>
                      <p className="mt-2 text-sm font-semibold tabular-nums text-slate-900">{fcfaCourt(o.montant)}</p>
                      <p className="mt-1 text-xs text-slate-500">{o.commercial}{app.consolide && ` · ${app.nomAgence(o.agenceId)}`}</p>
                      <label className="mt-2 block">
                        <span className="sr-only">Étape de l&apos;opportunité {o.titre}</span>
                        <select
                          value={o.etape}
                          onChange={(e) => {
                            const cible = e.target.value as Etape;
                            maj((d) => ({ ...d, opportunites: d.opportunites.map((x) => (x.id === o.id ? { ...x, etape: cible } : x)) }));
                            toast(`Opportunité déplacée vers « ${cible} ».`);
                          }}
                          className="h-8 w-full rounded-full border border-slate-300 bg-paper px-2.5 text-xs text-slate-700"
                        >
                          {ETAPES.map((e) => <option key={e} value={e}>{e}</option>)}
                        </select>
                      </label>
                    </li>
                  ))}
                  {cartes.length === 0 && <li className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">Aucune opportunité</li>}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {onglet === "clients" && (
        <Tableau
          lignes={clients} colonnes={colClients} cle={(c) => c.id} exportNom="clients"
          texte={(c) => `${c.nom} ${c.secteur} ${c.contact}`} rechercher="Rechercher un client…"
          vide={{ titre: "Aucun client", texte: "Ajoutez votre premier client.", action: <Bouton icone={Plus} onClick={() => setForm("client")}>Client</Bouton> }}
        />
      )}

      <FormulaireModale
        titre="Nouveau devis" ouverte={form === "devis"} onFermer={() => setForm(null)} libelleValider="Créer le devis"
        champs={[
          { nom: "clientId", libelle: "Client", type: "choix", options: clients.map((c) => ({ valeur: c.id, libelle: c.nom })) },
          { nom: "montant", libelle: "Montant TTC (FCFA)", type: "nombre", placeholder: "Ex. 2500000" },
        ]}
        onValider={(v) => {
          const c = data.clients.find((x) => x.id === v.clientId)!;
          const numero = numeroSuivant("DEV", c.agenceId, data.devis);
          maj((d) => ({ ...d, devis: [...d.devis, { id: `dv${d.devis.length + 1}`, numero, agenceId: c.agenceId, clientId: c.id, date: TODAY, montant: Number(v.montant), statut: "Brouillon" as const }] }));
          setForm(null);
          setOnglet("devis");
          toast(`Devis ${numero} créé en brouillon.`);
        }}
      />

      <FormulaireModale
        titre="Nouveau client" ouverte={form === "client"} onFermer={() => setForm(null)} libelleValider="Ajouter le client"
        champs={[
          { nom: "nom", libelle: "Raison sociale" },
          { nom: "secteur", libelle: "Secteur d'activité" },
          champAgence,
          { nom: "contact", libelle: "Nom du contact" },
          { nom: "telephone", libelle: "Téléphone", requis: false, placeholder: "+237 6…" },
        ]}
        onValider={(v) => {
          maj((d) => ({
            ...d,
            clients: [{ id: `cl${d.clients.length + 1}`, agenceId: v.agenceId, nom: v.nom, secteur: v.secteur, ville: app.nomAgence(v.agenceId), contact: v.contact, telephone: v.telephone || "—" }, ...d.clients],
          }));
          setForm(null);
          setOnglet("clients");
          toast(`Client « ${v.nom} » ajouté.`);
        }}
      />
    </>
  );
}
