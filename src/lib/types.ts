export type ModuleId =
  | "tableau-de-bord"
  | "ventes"
  | "achats"
  | "stocks"
  | "projets"
  | "rh"
  | "integrations"
  | "agences";

export type Agence = { id: string; code: string; nom: string; ville: string; responsable: string; siege: boolean };
export type Entrepot = { id: string; agenceId: string; nom: string };

export type Profil = {
  id: string;
  nom: string;
  role: string;
  /** "all" = périmètre groupe (vue consolidée autorisée), sinon liste d'agences */
  scope: "all" | string[];
  modules: ModuleId[];
};

export type Employe = {
  id: string; agenceId: string; nom: string; poste: string; departement: string;
  contrat: "CDI" | "CDD" | "Stage"; dateEntree: string; tauxHoraire: number;
  statut: "Présent" | "Absent" | "En congé";
};
export type Conge = {
  id: string; agenceId: string; employeId: string; type: string; debut: string; fin: string; jours: number;
  statut: "En attente" | "Approuvé" | "Refusé";
};
export type Pointage = {
  id: string; agenceId: string; employeId: string; date: string; entree: string; sortie: string | null;
  heures: number; heuresSup: number;
};

export type Client = {
  id: string; agenceId: string; nom: string; secteur: string; ville: string; contact: string; telephone: string;
};
export type Etape = "Prospect" | "Qualifié" | "Proposition" | "Négociation" | "Gagné";
export type Opportunite = {
  id: string; agenceId: string; clientId: string; titre: string; montant: number; etape: Etape; commercial: string;
};
export type Devis = {
  id: string; numero: string; agenceId: string; clientId: string; date: string; montant: number;
  statut: "Brouillon" | "Envoyé" | "Accepté" | "Refusé";
};
export type Facture = {
  id: string; numero: string; agenceId: string; clientId: string; date: string; echeance: string;
  montant: number; paye: number; statut: "Payée" | "Partielle" | "En attente" | "En retard"; moyen: string;
};

export type Fournisseur = { id: string; nom: string; categorie: string; ville: string; delaiJours: number; note: number };
export type DemandeAchat = {
  id: string; numero: string; agenceId: string; articleId: string; quantite: number;
  origine: "Automatique (seuil)" | "Manuelle"; statut: "À valider" | "Validée" | "Commandée"; date: string; demandeur: string;
};
export type CommandeFournisseur = {
  id: string; numero: string; agenceId: string; fournisseurId: string; date: string; livraisonPrevue: string;
  montant: number; statut: "Envoyée" | "Confirmée" | "Reçue partiellement" | "Reçue";
};

export type Article = {
  id: string; ref: string; nom: string; categorie: string; unite: string; prixAchat: number; prixVente: number;
  suivi: "Lot" | "Série" | "Aucun";
};
export type Stock = { articleId: string; entrepotId: string; physique: number; reserve: number; seuil: number };
export type Mouvement = {
  id: string; date: string; agenceId: string; entrepotId: string; articleId: string;
  type: "Entrée" | "Sortie" | "Transfert" | "Ajustement"; quantite: number; reference: string;
};
export type Transfert = {
  id: string; numero: string; deAgenceId: string; versAgenceId: string; articleId: string; quantite: number;
  statut: "Demandé" | "Expédié" | "En transit" | "Reçu"; date: string;
};

export type Projet = {
  id: string; code: string; nom: string; agenceId: string; clientId: string; chef: string; debut: string; fin: string;
  budget: number; prixVente: number; coutTemps: number; coutAchats: number; avancement: number;
  statut: "En cours" | "En retard" | "Terminé" | "Planifié";
};
export type StatutTache = "À faire" | "En cours" | "En revue" | "Terminé";
export type Tache = {
  id: string; projetId: string; titre: string; responsable: string; statut: StatutTache; debut: string; fin: string;
};

export type Connecteur = { id: string; nom: string; description: string; actif: boolean; mvp: boolean };
export type Webhook = { id: string; url: string; evenement: string; actif: boolean; derniereLivraison: string; succes: number };
export type Regle = { id: string; nom: string; quand: string; alors: string; actif: boolean; executions: number };
export type CleApi = { id: string; nom: string; prefixe: string; perimetre: string; creeLe: string; dernierUsage: string };
