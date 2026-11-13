"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { etatStock } from "@/lib/calculs";
import { TODAY, date, fcfa, fcfaCourt, nombre } from "@/lib/format";
import { numeroSuivant } from "@/lib/mock";
import { useApp } from "@/lib/store";
import type { Article, Mouvement, Transfert } from "@/lib/types";
import { useChampAgence, useColonneAgence } from "@/components/agence";
import { Filtre, Tableau, type Colonne } from "@/components/tableau";
import { Badge, Bouton, Definition, EnTete, FormulaireModale, Modale, Onglets } from "@/components/ui";

type Onglet = "articles" | "transferts" | "mouvements";
type Ligne = Article & { physique: number; reserve: number; seuil: number; etat: string; valeur: number };

export default function Stocks() {
  const app = useApp();
  const { data, maj, toast, dansPerimetre } = app;
  const [onglet, setOnglet] = useState<Onglet>("articles");
  const [form, setForm] = useState(false);
  const [etat, setEtat] = useState("");
  const [type, setType] = useState("");
  const [detail, setDetail] = useState<Ligne | null>(null);
  const champVers = useChampAgence("Agence de destination");

  const entrepots = useMemo(() => data.entrepots.filter((e) => dansPerimetre(e.agenceId)), [data.entrepots, dansPerimetre]);
  const lignes = useMemo<Ligne[]>(() => {
    const ids = entrepots.map((e) => e.id);
    return data.articles.map((a) => {
      const s = data.stocks.filter((x) => x.articleId === a.id && ids.includes(x.entrepotId));
      const physique = s.reduce((t, x) => t + x.physique, 0);
      const reserve = s.reduce((t, x) => t + x.reserve, 0);
      const seuil = s.reduce((t, x) => t + x.seuil, 0);
      // En consolidé, un article est signalé si au moins un entrepôt est sous son seuil.
      const alerte = s.some((x) => x.physique < x.seuil);
      const e = etatStock(physique, reserve, seuil);
      return { ...a, physique, reserve, seuil, etat: e === "Disponible" && alerte ? "Sous le seuil" : e, valeur: physique * a.prixAchat };
    });
  }, [data.articles, data.stocks, entrepots]);

  const article = (id: string) => data.articles.find((a) => a.id === id);
  const nomEntrepot = (id: string) => data.entrepots.find((e) => e.id === id)?.nom ?? "—";
  const transferts = data.transferts.filter((t) => dansPerimetre(t.deAgenceId) || dansPerimetre(t.versAgenceId));
  const mouvements = app.filtrer(data.mouvements).filter((m) => !type || m.type === type);

  const colArticles: Colonne<Ligne>[] = [
    {
      id: "article", titre: "Article", valeur: (l) => l.nom,
      cellule: (l) => (<><span className="block font-medium text-slate-900">{l.nom}</span><span className="text-xs text-slate-500">{l.ref} · {l.categorie}</span></>),
    },
    { id: "physique", titre: "Physique", cellule: (l) => nombre(l.physique), valeur: (l) => l.physique, droite: true },
    { id: "reserve", titre: "Réservé", cellule: (l) => nombre(l.reserve), valeur: (l) => l.reserve, droite: true, secondaire: true },
    { id: "dispo", titre: "Disponible", cellule: (l) => <strong className="font-semibold text-slate-900">{nombre(l.physique - l.reserve)}</strong>, valeur: (l) => l.physique - l.reserve, droite: true },
    { id: "seuil", titre: "Seuil", cellule: (l) => nombre(l.seuil), valeur: (l) => l.seuil, droite: true, secondaire: true },
    { id: "valeur", titre: "Valeur", cellule: (l) => fcfaCourt(l.valeur), valeur: (l) => l.valeur, droite: true, secondaire: true },
    { id: "etat", titre: "État", cellule: (l) => <Badge>{l.etat}</Badge>, valeur: (l) => l.etat },
  ];

  const colTransferts: Colonne<Transfert>[] = [
    { id: "numero", titre: "Transfert", cellule: (t) => <span className="whitespace-nowrap font-medium text-slate-900">{t.numero}</span>, valeur: (t) => t.numero },
    {
      id: "trajet", titre: "Trajet", valeur: (t) => `${app.nomAgence(t.deAgenceId)} > ${app.nomAgence(t.versAgenceId)}`,
      cellule: (t) => (
        <span className="inline-flex flex-wrap items-center gap-1.5">
          {app.nomAgence(t.deAgenceId)} <ArrowRight className="h-3.5 w-3.5 text-slate-400" aria-label="vers" /> {app.nomAgence(t.versAgenceId)}
        </span>
      ),
    },
    { id: "article", titre: "Article", cellule: (t) => article(t.articleId)?.nom, valeur: (t) => article(t.articleId)?.nom ?? "", secondaire: true },
    { id: "quantite", titre: "Quantité", cellule: (t) => nombre(t.quantite), valeur: (t) => t.quantite, droite: true },
    { id: "date", titre: "Date", cellule: (t) => date(t.date), valeur: (t) => t.date, secondaire: true },
    { id: "statut", titre: "Statut", cellule: (t) => <Badge>{t.statut}</Badge>, valeur: (t) => t.statut },
    {
      id: "actions", titre: "", droite: true,
      cellule: (t) => {
        // L'agence d'origine expédie, l'agence de destination réceptionne.
        if (t.statut === "Demandé" && dansPerimetre(t.deAgenceId)) return <Bouton variante="secondaire" taille="sm" onClick={() => avancer(t, "En transit")}>Expédier</Bouton>;
        if ((t.statut === "Expédié" || t.statut === "En transit") && dansPerimetre(t.versAgenceId)) return <Bouton variante="secondaire" taille="sm" onClick={() => avancer(t, "Reçu")}>Réceptionner</Bouton>;
        return null;
      },
    },
  ];

  function avancer(t: Transfert, statut: Transfert["statut"]) {
    maj((d) => ({ ...d, transferts: d.transferts.map((x) => (x.id === t.id ? { ...x, statut } : x)) }));
    toast(statut === "Reçu" ? `Transfert ${t.numero} réceptionné.` : `Transfert ${t.numero} expédié : stock en transit.`);
  }

  const colMouvements: Colonne<Mouvement>[] = [
    { id: "date", titre: "Date", cellule: (m) => date(m.date), valeur: (m) => m.date },
    { id: "type", titre: "Type", cellule: (m) => <Badge ton={m.type === "Entrée" ? "vert" : m.type === "Sortie" ? "bleu" : m.type === "Transfert" ? "ambre" : "neutre"}>{m.type}</Badge>, valeur: (m) => m.type },
    { id: "article", titre: "Article", cellule: (m) => article(m.articleId)?.nom, valeur: (m) => article(m.articleId)?.nom ?? "" },
    { id: "entrepot", titre: "Entrepôt", cellule: (m) => nomEntrepot(m.entrepotId), valeur: (m) => nomEntrepot(m.entrepotId), secondaire: true },
    ...useColonneAgence<Mouvement>(),
    {
      id: "quantite", titre: "Quantité", droite: true, valeur: (m) => (m.type === "Sortie" ? -m.quantite : m.quantite),
      cellule: (m) => { const q = m.type === "Sortie" ? -m.quantite : m.quantite; return q > 0 ? `+${q}` : `${q}`; },
    },
    { id: "reference", titre: "Référence", cellule: (m) => m.reference, valeur: (m) => m.reference, secondaire: true },
  ];

  const sousSeuil = lignes.filter((l) => l.etat !== "Disponible").length;

  return (
    <>
      <EnTete
        titre="Stocks"
        description={`${entrepots.length} entrepôt${entrepots.length > 1 ? "s" : ""} · ${fcfaCourt(lignes.reduce((s, l) => s + l.valeur, 0))} de stock · ${sousSeuil} article${sousSeuil > 1 ? "s" : ""} à réapprovisionner`}
        action={<Bouton icone={Plus} onClick={() => setForm(true)}>Nouveau transfert</Bouton>}
      />

      <Onglets
        valeur={onglet}
        onChange={setOnglet}
        onglets={[
          { id: "articles", libelle: "Articles", compte: lignes.length },
          { id: "transferts", libelle: "Transferts inter-agences", compte: transferts.filter((t) => t.statut !== "Reçu").length },
          { id: "mouvements", libelle: "Mouvements" },
        ]}
      />

      {onglet === "articles" && (
        <Tableau
          lignes={lignes.filter((l) => !etat || l.etat === etat)} colonnes={colArticles} cle={(l) => l.id} exportNom="stock" onLigne={setDetail}
          texte={(l) => `${l.nom} ${l.ref} ${l.categorie}`} rechercher="Rechercher un article ou une référence…"
          filtres={<Filtre libelle="État" valeur={etat} onChange={setEtat} options={["Disponible", "Sous le seuil", "Rupture"]} />}
        />
      )}
      {onglet === "transferts" && (
        <Tableau
          lignes={transferts} colonnes={colTransferts} cle={(t) => t.id} exportNom="transferts"
          texte={(t) => `${t.numero} ${article(t.articleId)?.nom} ${app.nomAgence(t.deAgenceId)} ${app.nomAgence(t.versAgenceId)}`} rechercher="Rechercher un transfert…"
          vide={{ titre: "Aucun transfert", texte: "Demandez un transfert pour approvisionner une agence depuis une autre.", action: <Bouton icone={Plus} onClick={() => setForm(true)}>Nouveau transfert</Bouton> }}
        />
      )}
      {onglet === "mouvements" && (
        <Tableau
          lignes={mouvements} colonnes={colMouvements} cle={(m) => m.id} exportNom="mouvements-stock"
          texte={(m) => `${article(m.articleId)?.nom} ${m.reference} ${nomEntrepot(m.entrepotId)}`} rechercher="Rechercher un mouvement…"
          filtres={<Filtre libelle="Type" valeur={type} onChange={setType} options={["Entrée", "Sortie", "Transfert", "Ajustement"]} />}
        />
      )}

      <Modale titre={detail?.nom ?? ""} ouverte={!!detail} onFermer={() => setDetail(null)} large>
        {detail && (
          <>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Definition libelle="Référence">{detail.ref}</Definition>
              <Definition libelle="Suivi">{detail.suivi === "Aucun" ? "Quantité seule" : `Par ${detail.suivi.toLowerCase()}`}</Definition>
              <Definition libelle="Prix d'achat">{fcfa(detail.prixAchat)}</Definition>
              <Definition libelle="Prix de vente">{fcfa(detail.prixVente)}</Definition>
            </dl>
            <h3 className="mb-2 mt-6 text-sm font-semibold text-slate-900">Répartition par entrepôt</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                    <th scope="col" className="px-3 py-2 font-medium">Entrepôt</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Physique</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Réservé</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Seuil</th>
                    <th scope="col" className="px-3 py-2 font-medium">État</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums">
                  {entrepots.map((e) => {
                    const s = data.stocks.find((x) => x.articleId === detail.id && x.entrepotId === e.id);
                    if (!s) return null;
                    return (
                      <tr key={e.id}>
                        <th scope="row" className="px-3 py-2.5 font-normal">
                          <span className="block text-slate-900">{e.nom}</span>
                          <span className="text-xs text-slate-500">{app.nomAgence(e.agenceId)}</span>
                        </th>
                        <td className="px-3 py-2.5 text-right">{nombre(s.physique)}</td>
                        <td className="px-3 py-2.5 text-right">{nombre(s.reserve)}</td>
                        <td className="px-3 py-2.5 text-right">{nombre(s.seuil)}</td>
                        <td className="px-3 py-2.5"><Badge>{etatStock(s.physique, s.reserve, s.seuil)}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Modale>

      <FormulaireModale
        titre="Nouveau transfert inter-agences" ouverte={form} onFermer={() => setForm(false)} libelleValider="Demander le transfert"
        champs={[
          { nom: "articleId", libelle: "Article", type: "choix", options: data.articles.map((a) => ({ valeur: a.id, libelle: `${a.ref} · ${a.nom}` })) },
          { nom: "quantite", libelle: "Quantité", type: "nombre" },
          { nom: "deAgenceId", libelle: "Agence d'origine", type: "choix", options: data.agences.map((a) => ({ valeur: a.id, libelle: a.nom })), aide: "L'agence d'origine devra confirmer l'expédition." },
          { ...champVers, nom: "versAgenceId" },
        ]}
        onValider={(v) => {
          if (v.deAgenceId === v.versAgenceId) {
            toast("L'agence d'origine et l'agence de destination doivent être différentes.", "info");
            return;
          }
          const numero = numeroSuivant("TRF", v.deAgenceId, data.transferts);
          maj((d) => ({
            ...d,
            transferts: [{ id: `tr${d.transferts.length + 1}`, numero, deAgenceId: v.deAgenceId, versAgenceId: v.versAgenceId, articleId: v.articleId, quantite: Number(v.quantite), statut: "Demandé" as const, date: TODAY }, ...d.transferts],
          }));
          setForm(false);
          setOnglet("transferts");
          toast(`Transfert ${numero} demandé.`);
        }}
      />
    </>
  );
}
