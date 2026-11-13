import type { Donnees } from "./mock";
import type { Projet } from "./types";

/** Rentabilité d'un projet : coût réel, projection à terminaison, marge. */
export function rentabilite(p: Projet) {
  const coutReel = p.coutTemps + p.coutAchats;
  const aTerminaison = p.avancement > 0.05 ? Math.round(coutReel / p.avancement) : p.budget;
  const marge = p.prixVente - aTerminaison;
  return { coutReel, aTerminaison, marge, taux: marge / p.prixVente, depassement: aTerminaison > p.budget };
}

export function etatStock(physique: number, reserve: number, seuil: number) {
  if (physique - reserve <= 0) return "Rupture";
  if (physique < seuil) return "Sous le seuil";
  return "Disponible";
}

/** Indicateurs d'un ensemble d'agences (une seule ou plusieurs pour le consolidé). */
export function indicateurs(d: Donnees, dans: (agenceId: string) => boolean) {
  const factures = d.factures.filter((f) => dans(f.agenceId));
  const ca = factures.reduce((s, f) => s + f.montant, 0);
  const encaisse = factures.reduce((s, f) => s + f.paye, 0);
  const retard = factures.filter((f) => f.statut === "En retard");

  const entrepots = d.entrepots.filter((e) => dans(e.agenceId)).map((e) => e.id);
  const lignes = d.stocks.filter((s) => entrepots.includes(s.entrepotId));
  const prix = new Map(d.articles.map((a) => [a.id, a.prixAchat]));
  const valeurStock = lignes.reduce((s, l) => s + l.physique * (prix.get(l.articleId) ?? 0), 0);
  const sousSeuil = lignes.filter((l) => l.physique < l.seuil).length;

  const projets = d.projets.filter((p) => dans(p.agenceId));
  const actifs = projets.filter((p) => p.statut === "En cours" || p.statut === "En retard");
  const vente = actifs.reduce((s, p) => s + p.prixVente, 0);
  const marge = actifs.reduce((s, p) => s + rentabilite(p).marge, 0);

  const employes = d.employes.filter((e) => dans(e.agenceId));

  return {
    ca, encaisse, reste: ca - encaisse,
    retardNb: retard.length, retardMontant: retard.reduce((s, f) => s + f.montant - f.paye, 0),
    valeurStock, sousSeuil,
    projetsActifs: actifs.length, tauxMarge: vente ? marge / vente : 0,
    effectif: employes.length, presents: employes.filter((e) => e.statut === "Présent").length,
    achats: d.commandesFournisseurs.filter((c) => dans(c.agenceId)).reduce((s, c) => s + c.montant, 0),
  };
}
