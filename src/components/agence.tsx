"use client";

import { useApp } from "@/lib/store";
import type { Colonne } from "./tableau";
import type { Champ } from "./ui";

/** Colonne « Agence », affichée seulement en vue consolidée (ORG-05). */
export function useColonneAgence<T extends { agenceId: string }>(): Colonne<T>[] {
  const { consolide, nomAgence } = useApp();
  if (!consolide) return [];
  return [{ id: "agence", titre: "Agence", cellule: (l) => nomAgence(l.agenceId), valeur: (l) => nomAgence(l.agenceId), secondaire: true }];
}

/** Champ de formulaire « Agence », limité au périmètre de l'utilisateur. */
export function useChampAgence(libelle = "Agence"): Champ {
  const { agencesVisibles, agenceParDefaut } = useApp();
  return {
    nom: "agenceId", libelle, type: "choix", defaut: agenceParDefaut,
    options: agencesVisibles.map((a) => ({ valeur: a.id, libelle: a.nom })),
  };
}
