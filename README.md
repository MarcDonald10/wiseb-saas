# ERP WISED — interface web du MVP

Interface du MVP (modules 11, 16, 1, 2, 3, 4) avec gestion multi-agences et vue consolidée.
Elle fonctionne sans serveur métier : toutes les données sont des données de test, générées dans `src/lib/mock.ts`.
Les modifications faites à l'écran sont perdues au rechargement de la page.

## Lancer

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000 et choisir un profil de démonstration.

| Profil | Périmètre | Modules |
|---|---|---|
| Direction générale | Toutes les agences, vue consolidée | Tous |
| Direction d'agence · Yaoundé | Yaoundé | Tous sauf Intégrations |
| Équipe commerciale · Douala | Douala | Tableau de bord, Ventes, Stocks, RH |
| Magasin · Bafoussam | Bafoussam | Tableau de bord, Achats, Stocks, RH |

## Organisation du code

| Dossier | Contenu |
|---|---|
| `docs/CAHIER_DES_CHARGES_TECHNIQUE.md` | Analyse du projet et cahier des charges technique |
| `src/app/login` | Connexion (choix d'un profil) |
| `src/app/(app)` | Écrans : tableau de bord, ventes, achats, stocks, projets, RH, intégrations, agences |
| `src/components` | Design system (`ui.tsx`), tableau de données (`tableau.tsx`), aides multi-agences (`agence.tsx`) |
| `src/lib/store.tsx` | Session, périmètre d'agences, droits, données en mémoire, notifications |
| `src/lib/mock.ts` | Données de test |
| `src/lib/calculs.ts` | Indicateurs, rentabilité des projets, état du stock |

## Brancher le serveur métier

Les écrans lisent et écrivent par `useApp()` : `data`, `maj`, `filtrer`. Pour passer à l'API, remplacer ces accès par des appels à `/v1/...` en transmettant l'agence choisie (voir le chapitre 6.4 du cahier des charges). Les droits affichés ici ne sont qu'un confort d'interface : ils doivent être vérifiés par le serveur.
