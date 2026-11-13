/**
 * Données de test de l'ERP WISED (MVP). Générées de façon déterministe :
 * même jeu à chaque chargement, aucune donnée réelle.
 */
import { TODAY, addDays, diffDays } from "./format";
import type {
  Agence, Article, CleApi, Client, CommandeFournisseur, Conge, Connecteur, DemandeAchat, Devis, Employe,
  Entrepot, Etape, Facture, Fournisseur, Mouvement, Opportunite, Pointage, Profil, Projet, Regle, Stock,
  Tache, Transfert, Webhook,
} from "./types";

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(2026);
const int = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const pick = <T,>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)];
const day = (offset: number) => addDays(TODAY, offset);

/* ---------- Organisation ---------- */

export const agences: Agence[] = [
  { id: "dla", code: "DLA", nom: "Douala (Siège)", ville: "Douala", responsable: "Marc Essomba", siege: true },
  { id: "yde", code: "YDE", nom: "Yaoundé", ville: "Yaoundé", responsable: "Aïcha Njoya", siege: false },
  { id: "baf", code: "BAF", nom: "Bafoussam", ville: "Bafoussam", responsable: "Hervé Kamga", siege: false },
  { id: "gra", code: "GRA", nom: "Garoua", ville: "Garoua", responsable: "Fadimatou Bello", siege: false },
];

export const entrepots: Entrepot[] = [
  { id: "e1", agenceId: "dla", nom: "Entrepôt Bonabéri" },
  { id: "e2", agenceId: "dla", nom: "Magasin Akwa" },
  { id: "e3", agenceId: "yde", nom: "Entrepôt Mvan" },
  { id: "e4", agenceId: "baf", nom: "Dépôt Bafoussam" },
  { id: "e5", agenceId: "gra", nom: "Dépôt Garoua" },
];

const TOUS: Profil["modules"] = ["tableau-de-bord", "ventes", "achats", "stocks", "projets", "rh", "integrations", "agences"];

export const profils: Profil[] = [
  { id: "u1", nom: "Marc Essomba", role: "Direction générale", scope: "all", modules: TOUS },
  { id: "u2", nom: "Aïcha Njoya", role: "Direction d'agence · Yaoundé", scope: ["yde"],
    modules: ["tableau-de-bord", "ventes", "achats", "stocks", "projets", "rh", "agences"] },
  { id: "u3", nom: "Paul Tchoua", role: "Équipe commerciale · Douala", scope: ["dla"],
    modules: ["tableau-de-bord", "ventes", "stocks", "rh"] },
  { id: "u4", nom: "Brice Fotso", role: "Magasin · Bafoussam", scope: ["baf"],
    modules: ["tableau-de-bord", "achats", "stocks", "rh"] },
];

const AG_POIDS = ["dla", "dla", "dla", "dla", "yde", "yde", "yde", "baf", "baf", "gra"] as const;
const agenceAuHasard = () => pick(AG_POIDS);

const compteurs: Record<string, number> = {};
function numero(type: string, agenceId: string) {
  const k = `${type}-${agenceId.toUpperCase()}`;
  compteurs[k] = (compteurs[k] ?? 0) + 1;
  return `${k}-2026-${String(compteurs[k]).padStart(5, "0")}`;
}
/** Numéro suivant pour un document créé dans l'interface (numérotation par agence, ORG-07). */
export function numeroSuivant(type: string, agenceId: string, existants: { numero: string }[]) {
  const prefixe = `${type}-${agenceId.toUpperCase()}-2026-`;
  const n = existants.filter((e) => e.numero.startsWith(prefixe)).length + 1;
  return `${prefixe}${String(n).padStart(5, "0")}`;
}

/* ---------- RH ---------- */

const PRENOMS = ["Marc", "Aïcha", "Paul", "Brice", "Hervé", "Fadimatou", "Carine", "Yannick", "Estelle", "Serge", "Nadège", "Ibrahim", "Solange", "Thierry", "Mireille", "Joël", "Clarisse", "Oumarou"];
const NOMS = ["Essomba", "Njoya", "Tchoua", "Fotso", "Kamga", "Bello", "Mbarga", "Ngono", "Talla", "Abena", "Wamba", "Hamadou", "Ekani", "Nkeng", "Djomo", "Atangana", "Simo", "Moussa", "Biya'a", "Kouam", "Ndzie", "Tagne", "Onana"];
const POSTES: [string, string][] = [
  ["Direction d'agence", "Direction"], ["Commercial", "Ventes"], ["Commercial", "Ventes"], ["Acheteur", "Achats"],
  ["Magasinier", "Logistique"], ["Magasinier", "Logistique"], ["Technicien installation", "Projets"],
  ["Technicien installation", "Projets"], ["Chef de projet", "Projets"], ["Assistant RH", "Ressources humaines"],
  ["Comptable", "Finance"], ["Chauffeur-livreur", "Logistique"],
];

const nomComplet = (i: number) => `${PRENOMS[i % PRENOMS.length]} ${NOMS[(i * 7 + 3) % NOMS.length]}`;

export const employes: Employe[] = Array.from({ length: 38 }, (_, i) => {
  const agenceId = i < 15 ? "dla" : i < 26 ? "yde" : i < 33 ? "baf" : "gra";
  const rang = i < 15 ? i : i < 26 ? i - 15 : i < 33 ? i - 26 : i - 33;
  const [poste, departement] = POSTES[rang % POSTES.length];
  const responsable = agences.find((a) => a.id === agenceId)!.responsable;
  const tirage = rnd();
  return {
    id: `emp${i + 1}`,
    agenceId,
    nom: rang === 0 ? responsable : nomComplet(i + 5),
    poste, departement,
    contrat: tirage < 0.75 ? "CDI" : tirage < 0.93 ? "CDD" : "Stage",
    dateEntree: day(-int(60, 2400)),
    tauxHoraire: int(18, 70) * 100,
    statut: rang === 0 ? "Présent" : tirage > 0.9 ? "En congé" : tirage > 0.84 ? "Absent" : "Présent",
  };
});

const TYPES_CONGE = ["Congé annuel", "Congé annuel", "Congé maladie", "Permission exceptionnelle", "Congé sans solde"];
export const conges: Conge[] = Array.from({ length: 16 }, (_, i) => {
  const e = employes[(i * 5 + 2) % employes.length];
  const debut = day(int(-20, 35));
  const jours = int(1, 12);
  return {
    id: `cg${i + 1}`, agenceId: e.agenceId, employeId: e.id, type: pick(TYPES_CONGE), debut, fin: addDays(debut, jours - 1), jours,
    statut: i < 6 ? "En attente" : i < 14 ? "Approuvé" : "Refusé",
  };
});

export const pointages: Pointage[] = [];
for (let j = 0; j < 4; j++) {
  for (const e of employes) {
    if (e.statut !== "Présent" && j === 0) continue;
    if (rnd() < 0.05) continue;
    const hEntree = 7 + (rnd() < 0.8 ? 0 : 1);
    const mEntree = int(20, 59);
    const enCours = j === 0;
    const heures = enCours ? 0 : int(70, 100) / 10;
    const totalMin = hEntree * 60 + mEntree + Math.round(heures * 60) + 60;
    pointages.push({
      id: `pt${pointages.length + 1}`, agenceId: e.agenceId, employeId: e.id, date: day(-j),
      entree: `${String(hEntree).padStart(2, "0")}:${String(mEntree).padStart(2, "0")}`,
      sortie: enCours ? null : `${String(Math.floor(totalMin / 60)).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`,
      heures, heuresSup: Math.max(0, Math.round((heures - 8) * 10) / 10),
    });
  }
}

/* ---------- Tiers ---------- */

const NOMS_CLIENTS: [string, string][] = [
  ["Brasseries du Littoral", "Agroalimentaire"], ["Clinique Sainte-Anne", "Santé"], ["Hôtel Le Wouri", "Hôtellerie"],
  ["Cimenterie du Sud", "Industrie"], ["Collège Polyvalent Excellence", "Éducation"], ["Transports Nkam Express", "Transport"],
  ["Supermarché Bon Prix", "Distribution"], ["Minoterie Centrale", "Agroalimentaire"], ["Pharmacie de la Paix", "Santé"],
  ["Coopérative Cacao Mbam", "Agriculture"], ["Imprimerie Moderne", "Services"], ["Résidence Les Palmiers", "Immobilier"],
  ["Laiterie des Hauts Plateaux", "Agroalimentaire"], ["Garage Auto Plus", "Automobile"], ["Mairie de Dschang", "Secteur public"],
  ["Hôtel Bénoué Palace", "Hôtellerie"], ["Coton du Nord", "Agriculture"], ["Station Service Sahel", "Énergie"],
  ["Boulangerie La Mie Dorée", "Agroalimentaire"], ["Institut Supérieur du Golfe", "Éducation"], ["Scierie de l'Est", "Industrie"],
  ["Centre Médical Espoir", "Santé"], ["Quincaillerie Générale", "Distribution"], ["Ferme Avicole du Noun", "Agriculture"],
];
const AG_CLIENTS = ["dla", "yde", "dla", "dla", "yde", "dla", "yde", "dla", "yde", "yde", "dla", "dla", "baf", "dla", "baf", "gra", "gra", "gra", "baf", "dla", "yde", "baf", "yde", "baf"];

export const clients: Client[] = NOMS_CLIENTS.map(([nom, secteur], i) => {
  const agenceId = AG_CLIENTS[i];
  return {
    id: `cl${i + 1}`, agenceId, nom, secteur, ville: agences.find((a) => a.id === agenceId)!.ville,
    contact: nomComplet(i * 3 + 1), telephone: `+237 6${int(50, 99)} ${int(10, 99)} ${int(10, 99)} ${int(10, 99)}`,
  };
});
const clientDe = (agenceId: string) => pick(clients.filter((c) => c.agenceId === agenceId));
const commercialDe = (agenceId: string) =>
  pick(employes.filter((e) => e.agenceId === agenceId && (e.departement === "Ventes" || e.departement === "Direction"))).nom;

export const fournisseurs: Fournisseur[] = [
  { id: "f1", nom: "SolarTech Afrique", categorie: "Panneaux & onduleurs", ville: "Douala", delaiJours: 12, note: 4.6 },
  { id: "f2", nom: "Câbleries du Cameroun", categorie: "Câbles", ville: "Douala", delaiJours: 5, note: 4.2 },
  { id: "f3", nom: "ElectroDistrib SA", categorie: "Appareillage", ville: "Yaoundé", delaiJours: 7, note: 3.9 },
  { id: "f4", nom: "Batteries Sahel", categorie: "Batteries", ville: "Garoua", delaiJours: 15, note: 4.0 },
  { id: "f5", nom: "Import Lumière SARL", categorie: "Éclairage", ville: "Douala", delaiJours: 21, note: 3.5 },
  { id: "f6", nom: "Quincaillerie de l'Ouest", categorie: "Fixations & outillage", ville: "Bafoussam", delaiJours: 3, note: 4.4 },
  { id: "f7", nom: "Shenzhen Power Co.", categorie: "Panneaux & onduleurs", ville: "Import (Chine)", delaiJours: 45, note: 4.1 },
  { id: "f8", nom: "Générale Électrique du Centre", categorie: "Appareillage", ville: "Yaoundé", delaiJours: 6, note: 3.8 },
];

/* ---------- Stocks ---------- */

const A = (ref: string, nom: string, categorie: string, unite: string, prixAchat: number, suivi: Article["suivi"]): Article => ({
  id: ref.toLowerCase(), ref, nom, categorie, unite, prixAchat, prixVente: Math.round((prixAchat * 1.32) / 500) * 500, suivi,
});
export const articles: Article[] = [
  A("PAN-450", "Panneau solaire monocristallin 450 W", "Panneaux", "pièce", 92000, "Série"),
  A("PAN-330", "Panneau solaire polycristallin 330 W", "Panneaux", "pièce", 64000, "Série"),
  A("OND-5K", "Onduleur hybride 5 kVA", "Onduleurs", "pièce", 485000, "Série"),
  A("OND-3K", "Onduleur hybride 3 kVA", "Onduleurs", "pièce", 310000, "Série"),
  A("BAT-200", "Batterie gel 200 Ah 12 V", "Batteries", "pièce", 168000, "Lot"),
  A("BAT-LI5", "Batterie lithium 5 kWh", "Batteries", "pièce", 890000, "Série"),
  A("REG-60", "Régulateur de charge MPPT 60 A", "Régulation", "pièce", 74000, "Série"),
  A("CAB-6", "Câble solaire 6 mm² (rouleau 100 m)", "Câbles", "rouleau", 58000, "Lot"),
  A("CAB-16", "Câble souple 16 mm² (rouleau 50 m)", "Câbles", "rouleau", 96000, "Lot"),
  A("DIS-32", "Disjoncteur DC 32 A", "Appareillage", "pièce", 6500, "Aucun"),
  A("COF-12", "Coffret de protection 12 modules", "Appareillage", "pièce", 18500, "Aucun"),
  A("MC4-PR", "Connecteurs MC4 (paire)", "Appareillage", "paire", 900, "Aucun"),
  A("STR-AL", "Structure de fixation aluminium", "Fixations", "kit", 42000, "Aucun"),
  A("LED-50", "Projecteur LED 50 W", "Éclairage", "pièce", 9500, "Lot"),
  A("LAM-SOL", "Lampadaire solaire autonome 60 W", "Éclairage", "pièce", 135000, "Série"),
  A("PAR-T2", "Parafoudre DC type 2", "Appareillage", "pièce", 27000, "Aucun"),
];

export const stocks: Stock[] = articles.flatMap((a, i) =>
  entrepots.map((e, j) => {
    const base = a.prixAchat > 200000 ? 12 : a.prixAchat > 50000 ? 40 : 260;
    const facteur = [1, 0.35, 0.7, 0.4, 0.25][j];
    const seuil = Math.max(2, Math.round(base * facteur * 0.3));
    const bas = (i * 3 + j * 5) % 11 === 0;
    const physique = bas ? int(0, seuil - 1) : Math.round(base * facteur * (0.5 + rnd()));
    return { articleId: a.id, entrepotId: e.id, physique, reserve: Math.min(physique, int(0, Math.ceil(physique * 0.25))), seuil };
  }),
);

const TYPES_MVT = ["Entrée", "Sortie", "Sortie", "Sortie", "Transfert", "Ajustement"] as const;
export const mouvements: Mouvement[] = Array.from({ length: 70 }, (_, i) => {
  const e = pick(entrepots);
  const type = pick(TYPES_MVT);
  const prefixe = { Entrée: "REC", Sortie: "BL", Transfert: "TRF", Ajustement: "INV" }[type];
  return {
    id: `mv${i + 1}`, date: day(-Math.floor(i / 3)), agenceId: e.agenceId, entrepotId: e.id, articleId: pick(articles).id, type,
    quantite: type === "Ajustement" ? int(-3, 3) || 1 : int(1, 40), reference: `${prefixe}-${String(1200 - i).padStart(5, "0")}`,
  };
});

const STATUTS_TRF = ["Demandé", "Expédié", "En transit", "En transit", "Reçu", "Reçu", "Reçu", "Reçu"] as const;
const AUTRES = ["yde", "baf", "gra"];
export const transferts: Transfert[] = STATUTS_TRF.map((statut, i) => {
  const versSiege = i % 4 === 3;
  const autre = AUTRES[i % 3];
  const agenceId = versSiege ? autre : "dla";
  return {
    id: `tr${i + 1}`, numero: numero("TRF", agenceId), deAgenceId: agenceId, versAgenceId: versSiege ? "dla" : autre,
    articleId: articles[(i * 3) % articles.length].id, quantite: int(4, 60), statut, date: day(-i * 2 - 1),
  };
});

/* ---------- Ventes ---------- */

const ETAPES: Etape[] = ["Prospect", "Qualifié", "Proposition", "Négociation", "Gagné"];
const OBJETS = ["Installation solaire 20 kWc", "Kit autonome site isolé", "Éclairage public solaire", "Extension parc batteries", "Maintenance annuelle", "Fourniture onduleurs", "Centrale hybride toiture", "Pompage solaire"];
export const opportunites: Opportunite[] = Array.from({ length: 24 }, (_, i) => {
  const agenceId = agenceAuHasard();
  return {
    id: `op${i + 1}`, agenceId, clientId: clientDe(agenceId).id, titre: OBJETS[i % OBJETS.length],
    montant: int(8, 220) * 250000, etape: ETAPES[i % 5], commercial: commercialDe(agenceId),
  };
});

export const devis: Devis[] = Array.from({ length: 42 }, (_, i) => {
  const agenceId = agenceAuHasard();
  const age = 42 - i;
  const t = rnd();
  return {
    id: `dv${i + 1}`, numero: numero("DEV", agenceId), agenceId, clientId: clientDe(agenceId).id, date: day(-age * 2),
    montant: int(4, 160) * 125000,
    statut: age < 4 ? (t < 0.5 ? "Brouillon" : "Envoyé") : t < 0.55 ? "Accepté" : t < 0.8 ? "Envoyé" : "Refusé",
  };
});

const MOYENS = ["Virement", "Mobile Money", "Carte", "Mobile Money", "Virement"];
export const factures: Facture[] = Array.from({ length: 96 }, (_, i) => {
  const agenceId = agenceAuHasard();
  const age = Math.round((96 - i) * 1.55);
  const dateF = day(-age);
  const montant = int(4, 150) * 125000;
  const t = rnd();
  let statut: Facture["statut"];
  if (age > 30) statut = t < 0.78 ? "Payée" : t < 0.86 ? "Partielle" : "En retard";
  else statut = t < 0.3 ? "Payée" : t < 0.42 ? "Partielle" : "En attente";
  const paye = statut === "Payée" ? montant : statut === "Partielle" ? Math.round((montant * int(3, 6)) / 10) : 0;
  return {
    id: `fa${i + 1}`, numero: numero("FAC", agenceId), agenceId, clientId: clientDe(agenceId).id, date: dateF,
    echeance: addDays(dateF, 30), montant, paye, statut, moyen: pick(MOYENS),
  };
});

/* ---------- Achats ---------- */

const sousSeuil = stocks.filter((s) => s.physique < s.seuil);
export const demandesAchat: DemandeAchat[] = [
  ...sousSeuil.slice(0, 10).map((s, i): DemandeAchat => {
    const agenceId = entrepots.find((e) => e.id === s.entrepotId)!.agenceId;
    return {
      id: `da${i + 1}`, numero: numero("DA", agenceId), agenceId, articleId: s.articleId, quantite: s.seuil * 3,
      origine: "Automatique (seuil)", statut: i < 5 ? "À valider" : i < 8 ? "Validée" : "Commandée", date: day(-i), demandeur: "Système",
    };
  }),
  ...Array.from({ length: 6 }, (_, i): DemandeAchat => {
    const agenceId = agenceAuHasard();
    return {
      id: `da${i + 11}`, numero: numero("DA", agenceId), agenceId, articleId: pick(articles).id, quantite: int(5, 80),
      origine: "Manuelle", statut: (["À valider", "Validée", "Commandée"] as const)[i % 3], date: day(-i * 2 - 1),
      demandeur: pick(employes.filter((e) => e.agenceId === agenceId)).nom,
    };
  }),
];

export const commandesFournisseurs: CommandeFournisseur[] = Array.from({ length: 22 }, (_, i) => {
  const agenceId = agenceAuHasard();
  const f = pick(fournisseurs);
  const age = (22 - i) * 3;
  const dateC = day(-age);
  return {
    id: `cf${i + 1}`, numero: numero("BC", agenceId), agenceId, fournisseurId: f.id, date: dateC,
    livraisonPrevue: addDays(dateC, f.delaiJours), montant: int(6, 240) * 100000,
    statut: age > f.delaiJours + 6 ? "Reçue" : age > f.delaiJours ? "Reçue partiellement" : age > 3 ? "Confirmée" : "Envoyée",
  };
});

/* ---------- Projets ---------- */

const DEF_PROJETS: [string, string, number, number, number][] = [
  // nom, agence, prix de vente, début (jours), durée (jours)
  ["Centrale solaire 60 kWc", "dla", 78000000, -70, 120],
  ["Éclairage solaire du campus", "dla", 31500000, -45, 80],
  ["Autonomie énergétique clinique", "yde", 46000000, -60, 90],
  ["Toiture solaire supermarché", "yde", 39000000, -85, 80],
  ["Pompage solaire coopérative", "yde", 18500000, -20, 70],
  ["Mini-réseau laiterie", "baf", 27000000, -50, 100],
  ["Éclairage public mairie", "baf", 22000000, -110, 100],
  ["Kit hybride hôtel", "gra", 34000000, -30, 85],
  ["Alimentation usine coton", "gra", 52000000, 6, 110],
];
const TITRES_TACHES = ["Étude technique et relevés", "Commande du matériel", "Préparation du site", "Pose des structures", "Installation des panneaux", "Câblage et protections", "Mise en service", "Formation et réception"];

export const projets: Projet[] = [];
export const taches: Tache[] = [];
DEF_PROJETS.forEach(([nom, agenceId, prixVente, debutJ, duree], i) => {
  const debut = day(debutJ);
  const fin = addDays(debut, duree);
  const ecoule = Math.min(1, Math.max(0, -debutJ / duree));
  const retard = i === 3 || i === 6;
  const avancement = retard ? Math.max(0, ecoule - 0.22) : Math.min(1, ecoule * (0.92 + rnd() * 0.1));
  const budget = Math.round(prixVente * 0.72);
  const derive = retard ? 1.24 : 0.9 + rnd() * 0.18;
  const coutReel = Math.round(budget * avancement * derive);
  const id = `pr${i + 1}`;
  const deLAgence = employes.filter((e) => e.agenceId === agenceId);
  const dediee = deLAgence.filter((e) => e.departement === "Projets");
  const equipe = dediee.length > 0 ? dediee : deLAgence;
  projets.push({
    id, code: `PRJ-${agenceId.toUpperCase()}-${String(i + 1).padStart(3, "0")}`, nom, agenceId, clientId: clientDe(agenceId).id,
    chef: (equipe.find((e) => e.poste === "Chef de projet") ?? equipe[0]).nom, debut, fin, budget, prixVente,
    coutTemps: Math.round(coutReel * 0.34), coutAchats: Math.round(coutReel * 0.66), avancement,
    statut: debutJ > 0 ? "Planifié" : ecoule >= 1 && !retard ? "Terminé" : retard ? "En retard" : "En cours",
  });
  const pas = duree / TITRES_TACHES.length;
  TITRES_TACHES.forEach((titre, k) => {
    const tDebut = addDays(debut, Math.round(k * pas));
    const tFin = addDays(tDebut, Math.round(pas * 1.25));
    const part = (k + 1) / TITRES_TACHES.length;
    const statut: Tache["statut"] =
      part <= avancement ? "Terminé" : part - avancement < 0.13 ? "En revue" : diffDays(tDebut, TODAY) >= 0 ? "En cours" : "À faire";
    taches.push({ id: `${id}-t${k + 1}`, projetId: id, titre, responsable: equipe[k % equipe.length].nom, statut, debut: tDebut, fin: tFin });
  });
});

/* ---------- Intégrations ---------- */

export const connecteurs: Connecteur[] = [
  { id: "c1", nom: "WhatsApp Business", description: "Envoi des devis, factures et liens de paiement aux clients.", actif: true, mvp: true },
  { id: "c2", nom: "Slack", description: "Alertes de rupture de stock et validations dans vos canaux.", actif: true, mvp: true },
  { id: "c3", nom: "Microsoft Teams", description: "Notifications et validations dans Teams.", actif: false, mvp: false },
  { id: "c4", nom: "Shopify", description: "Synchronisation du catalogue, des commandes et du stock.", actif: false, mvp: false },
  { id: "c5", nom: "Salesforce", description: "Synchronisation des comptes et des opportunités.", actif: false, mvp: false },
];
export const webhooks: Webhook[] = [
  { id: "w1", url: "https://compta.exemple.cm/hooks/factures", evenement: "facture.validee", actif: true, derniereLivraison: "Aujourd'hui 09:42", succes: 0.998 },
  { id: "w2", url: "https://logistique.exemple.cm/hooks/stock", evenement: "stock.sous_seuil", actif: true, derniereLivraison: "Aujourd'hui 08:15", succes: 0.981 },
  { id: "w3", url: "https://bi.exemple.cm/ingest", evenement: "paiement.recu", actif: false, derniereLivraison: "03/11/2026 17:20", succes: 0.912 },
];
export const regles: Regle[] = [
  { id: "r1", nom: "Réapprovisionnement automatique", quand: "Stock d'un article sous son seuil", alors: "Créer une demande d'achat pour l'agence concernée", actif: true, executions: 46 },
  { id: "r2", nom: "Alerte facture en retard", quand: "Facture échue depuis plus de 7 jours", alors: "Notifier le commercial sur Slack", actif: true, executions: 19 },
  { id: "r3", nom: "Envoi du lien de paiement", quand: "Facture validée", alors: "Envoyer le lien de paiement par WhatsApp", actif: true, executions: 88 },
  { id: "r4", nom: "Transfert reçu", quand: "Transfert inter-agences reçu", alors: "Notifier l'agence d'origine", actif: false, executions: 0 },
];
export const clesApi: CleApi[] = [
  { id: "k1", nom: "Site e-commerce", prefixe: "wsd_live_8f2a", perimetre: "Ventes, Stocks · toutes agences", creeLe: "2026-11-03", dernierUsage: "Aujourd'hui 10:02" },
  { id: "k2", nom: "Application magasinier", prefixe: "wsd_live_c41d", perimetre: "Stocks · toutes agences", creeLe: "2026-11-05", dernierUsage: "Aujourd'hui 09:58" },
  { id: "k3", nom: "Tests d'intégration", prefixe: "wsd_test_17be", perimetre: "Tous modules · Douala", creeLe: "2026-11-09", dernierUsage: "10/11/2026 16:31" },
];

export const donneesInitiales = {
  agences, entrepots, employes, conges, pointages, clients, opportunites, devis, factures, fournisseurs,
  demandesAchat, commandesFournisseurs, articles, stocks, mouvements, transferts, projets, taches,
  connecteurs, webhooks, regles, clesApi,
};
export type Donnees = typeof donneesInitiales;
