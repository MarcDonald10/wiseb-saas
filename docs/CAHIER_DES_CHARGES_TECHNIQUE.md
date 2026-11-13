# ERP WISED — Cahier des charges technique

Version 1.0 · 12 novembre 2026 · Périmètre détaillé : MVP (J50, 21 décembre 2026)

Sources : « Spécifications des 16 modules » v5.0 et « Plan d'exécution 133 jours ».

---

## 1. Résultat de l'analyse

### 1.1 Ce que le projet doit livrer

WISED est un ERP de 16 modules et un assistant IA, livré en 5 phases sur 133 jours. Le MVP (phases 1 et 2) couvre six modules et passe en production à J50 pour une entité pilote :

| Mod. | Module | Dans le MVP | Reporté après le MVP |
|---|---|---|---|
| 11 | Core HR, organisation & temps | Portail employé, congés, badgeage, feuilles de temps (GTA) | — |
| 16 | API Gateway & intégrations | Gateway, authentification, webhooks, moteur de règles, 2 connecteurs | Autres connecteurs |
| 1 | Fournisseurs & achats | Portail fournisseurs, demandes d'achat automatiques sur seuil, commandes | OCR et matching à 3 voies |
| 2 | Clients & ventes | CRM, devis, facturation, liens de paiement | Relances IA, abonnements récurrents |
| 3 | Stocks & logistique | Multi-entrepôts, lots, séries, FIFO/FEFO, application magasinier | — |
| 4 | Projets & rentabilité | Kanban, Gantt, coûts imputés, marge | Valorisation du temps par la paie réelle |

### 1.2 Multi-agences et centralisation des données : ce n'est pas prévu

**Constat.** Aucun des deux documents ne prévoit le cas d'une entreprise à plusieurs agences.

- Les spécifications parlent de « multi-entrepôts » (module 3), de budgets « par département ou par projet » (module 8), de « multi-devises » et « multi-normes » (module 6). Les mots agence, succursale, site, filiale, multi-société et consolidation n'apparaissent nulle part.
- Le plan d'exécution ne vise qu'« une entité pilote ».
- Un entrepôt n'est pas une agence : une agence a aussi ses clients, ses commerciaux, ses salariés, ses projets, sa caisse et ses objectifs.

**Risque.** Le rattachement à une agence touche presque toutes les tables. L'ajouter après coup oblige à reprendre le modèle de données, les droits d'accès, les numérotations et tous les écrans. Il faut donc le poser dans le socle (lot A), avant que le lot B ne construise dessus.

**Décision à prendre tout de suite.** Le lot B démarre à J12, soit le 13 novembre 2026. Le lot A est sur le chemin critique, sans marge. La décision d'intégrer l'axe « agence » doit être prise avant ce démarrage ; le coût estimé est de 2 à 3 jours sur le lot A, à valider avec l'équipe.

**Exigence ajoutée : EX-ORG, organisation multi-agences et centralisation.** Elle est détaillée au chapitre 4.

### 1.3 Autres manques et incohérences relevés

| # | Constat | Hypothèse retenue |
|---|---|---|
| 1 | Rôles et permissions absents des spécifications | Matrice de rôles définie au chapitre 3 |
| 2 | Pays cible non nommé. SYSCOHADA, DSF, Mobile Money et le férié du 11 février désignent la zone OHADA, vraisemblablement le Cameroun | Devise XAF (FCFA), langue française, anglais prévu en option |
| 3 | Module 4 : le temps passé est valorisé « via le module Paie », livré seulement à J93 | Taux horaire interne par salarié jusqu'à la paie (déjà noté dans le plan) |
| 4 | Aucune exigence non fonctionnelle : performance, disponibilité, sécurité, sauvegarde, hors-ligne | Chapitre 7 |
| 5 | Mode SaaS multi-clients ou installation par client : non précisé | SaaS multi-tenant, un tenant par entreprise cliente |
| 6 | Application magasinier : native ou web ? | PWA dans le MVP, avec file d'attente hors-ligne |
| 7 | Les 2 connecteurs prioritaires du MVP ne sont pas nommés | WhatsApp Business et Slack, à confirmer |
| 8 | Prestataires de paiement non nommés | Agrégateur Mobile Money (MTN MoMo, Orange Money) et carte, à choisir |
| 9 | Reprise des données : format et volumes non précisés | Import CSV/Excel pour articles, tiers, salariés, avec rapport d'erreurs |
| 10 | Plan, page 9 : une puce est tronquée (« nder dès J1 ») | À compléter par l'auteur du plan |
| 11 | Plan : le lot E s'appelle « Gestion budgétaire & trésorerie » mais ne contient que le module 8 ; la trésorerie (module 7) est dans le lot D | Renommer le lot E « Budget & analytique » |
| 12 | Plan : le réseau PERT donne 74 jours de marge au lot R, le tableau le dit critique pour le MVP | Les deux sont vrais selon l'échéance visée ; l'indiquer sur le schéma |
| 13 | Facturation électronique « conforme aux réglementations locales » : la norme n'est pas citée | Mentions légales et numérotation continue par agence dans le MVP ; raccordement au portail fiscal avec le lot G |

---

## 2. Objectifs et périmètre

- **Objectif.** Donner à une PME ou un groupe multi-agences un seul outil pour vendre, acheter, stocker, piloter ses projets et gérer son personnel, avec des données centralisées et consultables par agence ou en consolidé.
- **Utilisateurs.** De 20 à 500 utilisateurs par entreprise, peu techniques, souvent sur mobile, avec une connexion parfois lente.
- **Hors périmètre du MVP.** Comptabilité, trésorerie, budget, paie, juridique, fiscalité, GPEC, OKR, rapports IA, RSE, assistant IA.

---

## 3. Rôles et permissions

Chaque utilisateur a un rôle et un **périmètre** : le groupe entier, ou une ou plusieurs agences.

| Rôle | Périmètre type | Ventes | Achats | Stocks | Projets | RH | Intégrations | Agences |
|---|---|---|---|---|---|---|---|---|
| Direction générale | Groupe | Lecture, écriture | Lecture, écriture | Lecture, écriture | Lecture, écriture | Lecture, écriture | Lecture | Lecture, écriture |
| Administrateur | Groupe | Lecture | Lecture | Lecture | Lecture | Lecture | Lecture, écriture | Lecture, écriture |
| Directeur d'agence | Son agence | Lecture, écriture | Lecture, écriture | Lecture, écriture | Lecture, écriture | Lecture, validation | — | Lecture (la sienne) |
| Commercial | Son agence | Lecture, écriture | — | Lecture | Lecture | Self-service | — | — |
| Acheteur | Son agence | — | Lecture, écriture | Lecture | Lecture | Self-service | — | — |
| Magasinier | Son agence | — | Réception | Lecture, écriture | — | Self-service | — | — |
| Chef de projet | Son agence | Lecture | Demandes d'achat | Lecture | Lecture, écriture | Self-service | — | — |
| Responsable RH | Groupe ou agence | — | — | — | — | Lecture, écriture | — | — |
| Employé | Lui-même | — | — | — | Ses tâches | Self-service | — | — |
| Fournisseur (portail) | Ses documents | — | Ses devis, commandes, factures | — | — | — | — | — |

Règles :

- Les droits sont vérifiés côté serveur à chaque requête. Le masquage dans l'interface n'est qu'un confort.
- Le filtre par agence est appliqué par la base de données (Row-Level Security), pas par le code applicatif.
- Toute lecture consolidée et tout changement de droits sont journalisés.

---

## 4. EX-ORG — Organisation multi-agences et centralisation

### 4.1 Modèle d'organisation

```
Tenant (entreprise cliente)
└── Société (entité juridique ; une seule dans le MVP)
    └── Agence (Siège, agences régionales)
        ├── Entrepôts
        ├── Départements
        └── Salariés, caisses, séries de numérotation
```

### 4.2 Exigences

| Réf. | Exigence | Livraison |
|---|---|---|
| ORG-01 | Créer, modifier, désactiver une agence (code, nom, ville, responsable, devise, fuseau) | MVP, lot A |
| ORG-02 | Tout enregistrement opérationnel porte un `agence_id` obligatoire : devis, facture, commande, mouvement de stock, projet, salarié, pointage | MVP, lot A |
| ORG-03 | Référentiels partagés par défaut au niveau du groupe : articles, clients, fournisseurs. Un tiers peut être restreint à certaines agences | MVP, lot B |
| ORG-04 | Sélecteur d'agence permanent dans l'interface : « Toutes les agences (consolidé) » ou une agence. Tous les écrans et indicateurs suivent ce choix | MVP |
| ORG-05 | En vue consolidée, chaque liste affiche la colonne Agence et chaque indicateur peut être ventilé par agence | MVP |
| ORG-06 | Tableau de bord groupe : chiffre d'affaires, achats, valeur du stock, marge des projets, effectif, par agence et au total | MVP |
| ORG-07 | Numérotation des documents par agence, par exemple `FAC-DLA-2026-00042` | MVP, lot B |
| ORG-08 | Transfert de stock inter-agences avec statuts : demandé, expédié, en transit, reçu. Le stock en transit n'appartient à aucun entrepôt | MVP, lot B |
| ORG-09 | Un salarié est rattaché à une agence ; le détachement temporaire dans une autre est possible | MVP, lot A |
| ORG-10 | Un projet appartient à une agence et peut recevoir des temps et des achats d'autres agences | MVP, lot C |
| ORG-11 | Droits par périmètre : un utilisateur ne voit que ses agences ; la vue consolidée est réservée aux rôles groupe | MVP, lot A |
| ORG-12 | Comptabilité analytique par agence, comptes de liaison et élimination des flux inter-agences | Lot D |
| ORG-13 | Budgets par agence, paie par établissement, déclarations fiscales par établissement si la loi l'exige | Lots E, F, G |
| ORG-14 | Multi-sociétés (plusieurs entités juridiques, consolidation légale) | Après J133 ; le modèle le prévoit dès le MVP par le champ `societe_id` |
| ORG-15 | Agence temporairement hors-ligne : saisie locale sur les applications mobiles (pointage, magasinier), synchronisation au retour du réseau, conflits résolus par horodatage serveur et journal | MVP pour ces deux applications |

### 4.3 Principe de centralisation

Une seule base de données centrale, pas une base par agence à synchroniser. La centralisation est donc native : la vue consolidée est une simple requête sans filtre d'agence. Le cloisonnement est assuré par les droits. Ce choix évite les réplications et les écarts entre agences, au prix d'une dépendance au réseau, traitée par ORG-15.

---

## 5. Exigences fonctionnelles du MVP

### 5.1 Module 11 — Core HR, organisation & temps

| Réf. | Exigence |
|---|---|
| RH-01 | Fiche salarié : identité, poste, département, agence, responsable, type de contrat, date d'entrée, taux horaire interne |
| RH-02 | Organigramme par agence et par département |
| RH-03 | Portail employé web et mobile : mise à jour de ses informations, solde de congés, demandes |
| RH-04 | Demande de congé avec circuit de validation (responsable, puis RH) et décompte du solde |
| RH-05 | Badgeage virtuel : entrée et sortie, avec géolocalisation facultative et contrôle du périmètre de l'agence |
| RH-06 | Feuilles de temps hebdomadaires, imputées par projet et par tâche, soumises à validation |
| RH-07 | Calcul automatique des heures supplémentaires et de nuit selon des règles paramétrables |
| RH-08 | Export des variables de temps, en préparation de la paie (lot F) |

### 5.2 Module 16 — API Gateway & intégrations

| Réf. | Exigence |
|---|---|
| API-01 | Authentification OIDC, jetons courts, renouvellement, double facteur facultatif |
| API-02 | API REST versionnée (`/v1`) documentée en OpenAPI ; toute fonction de l'interface passe par l'API |
| API-03 | Clés d'API par application tierce, avec périmètre (scopes, agences), quota et révocation |
| API-04 | Webhooks sortants signés (HMAC), avec reprises et journal des livraisons |
| API-05 | Moteur de règles « quand, si, alors » sur les événements métier |
| API-06 | Deux connecteurs No-Code : WhatsApp Business et Slack (à confirmer) |
| API-07 | Bus d'événements interne : chaque écriture métier publie un événement, consommé plus tard par la comptabilité (lot D) |

### 5.3 Module 1 — Fournisseurs & achats

| Réf. | Exigence |
|---|---|
| ACH-01 | Fiche fournisseur : coordonnées, conditions de paiement, délais, évaluation |
| ACH-02 | Portail fournisseur : réponse aux demandes de prix, suivi des commandes, dépôt des factures |
| ACH-03 | Demande d'achat manuelle ou générée automatiquement quand un article passe sous son seuil dans un entrepôt |
| ACH-04 | Circuit de validation selon le montant et l'agence |
| ACH-05 | Bon de commande, réception partielle ou totale, rapprochement manuel de la facture |
| ACH-06 | Imputation d'une ligne d'achat à un code projet |

### 5.4 Module 2 — Clients & ventes

| Réf. | Exigence |
|---|---|
| VTE-01 | Fiche client et contacts, historique des échanges |
| VTE-02 | Pipeline d'opportunités par étapes, montant et probabilité |
| VTE-03 | Devis avec lignes, remises, taxes, validité ; envoi par e-mail ou WhatsApp ; transformation en commande puis en facture |
| VTE-04 | Facture électronique numérotée en continu par agence, au format PDF |
| VTE-05 | Lien de paiement : virement, carte, Mobile Money ; encaissement partiel accepté |
| VTE-06 | Suivi des encaissements et balance âgée ; relance manuelle |
| VTE-07 | La validation d'une commande réserve le stock ; la livraison le sort |

### 5.5 Module 3 — Stocks & logistique

| Réf. | Exigence |
|---|---|
| STK-01 | Articles : référence, unité, catégorie, prix d'achat et de vente, seuil et quantité de réapprovisionnement par entrepôt |
| STK-02 | Stock en temps réel par entrepôt : physique, réservé, disponible, en transit |
| STK-03 | Mouvements : entrée, sortie, transfert, ajustement d'inventaire, tous tracés |
| STK-04 | Suivi par lot (avec date de péremption) et par numéro de série ; sortie FIFO ou FEFO |
| STK-05 | Application magasinier (PWA) : lecture de codes-barres et QR codes, réception, transfert, inventaire tournant, mode hors-ligne |
| STK-06 | Valorisation au coût moyen pondéré |
| STK-07 | Alertes de rupture et de péremption |

### 5.6 Module 4 — Projets & rentabilité

| Réf. | Exigence |
|---|---|
| PRJ-01 | Projet : client, agence, chef de projet, dates, budget, prix de vente |
| PRJ-02 | Tâches en Kanban, avec responsable, échéance et charge estimée |
| PRJ-03 | Gantt interactif avec dépendances et jalons |
| PRJ-04 | Coûts réels : temps passés valorisés au taux interne et achats imputés |
| PRJ-05 | Marge brute en temps réel, budget contre réel, projection à terminaison |

---

## 6. Architecture technique

### 6.1 Vue d'ensemble

```
Web (Next.js) ─┐
PWA magasinier ├─► API Gateway ─► Services métier ─► PostgreSQL (RLS tenant + agence)
Portail fourn. ┘        │                │
Tiers (API, webhooks) ──┘                └─► Bus d'événements ─► Webhooks, règles, compta (lot D)
```

### 6.2 Choix proposés

| Couche | Choix | Raison |
|---|---|---|
| Interface web | Next.js (App Router), React, TypeScript, Tailwind CSS | Rendu serveur, responsive, un seul code pour web et PWA |
| Mobile | PWA dans le MVP | Délai de 50 jours ; application native à réévaluer ensuite |
| API | Monolithe modulaire TypeScript (NestJS), REST et OpenAPI | Une équipe par module sans le coût des microservices ; découpage possible plus tard |
| Base de données | PostgreSQL, Row-Level Security sur `tenant_id` et `agence_id` | Intégrité transactionnelle indispensable à un ERP ; cloisonnement garanti par la base |
| Événements | Table « outbox » et file de messages (Redis Streams ou RabbitMQ) | Aucun événement perdu ; socle des écritures comptables automatiques |
| Authentification | Keycloak ou service OIDC équivalent | Double facteur, SSO, gestion des rôles |
| Fichiers | Stockage objet compatible S3 | PDF, pièces jointes, photos de réception |
| Recherche et rapports | Vues matérialisées PostgreSQL | Suffisant pour le MVP ; entrepôt de données avec le lot I |
| Hébergement | Conteneurs Docker, intégration et déploiement continus, environnements dev, recette, production | Bascule et retour arrière rapides |

Le skill de conception propose Firebase par défaut. Il est écarté ici : un ERP exige des transactions multi-tables, des requêtes d'agrégation et un cloisonnement par ligne que PostgreSQL traite nativement.

### 6.3 Modèle de données (entités principales du MVP)

- **Organisation** : `tenant`, `societe`, `agence`, `departement`, `entrepot`, `utilisateur`, `role`, `perimetre_utilisateur`
- **RH** : `salarie`, `conge`, `pointage`, `feuille_temps`, `ligne_temps`
- **Tiers** : `client`, `contact`, `fournisseur`
- **Ventes** : `opportunite`, `devis`, `commande_client`, `facture`, `paiement`, et leurs lignes
- **Achats** : `demande_achat`, `commande_fournisseur`, `reception`, `facture_fournisseur`, et leurs lignes
- **Stocks** : `article`, `lot`, `numero_serie`, `stock` (article, entrepôt, lot), `mouvement_stock`, `transfert`
- **Projets** : `projet`, `tache`, `dependance`, `cout_projet`
- **Intégration** : `cle_api`, `webhook`, `livraison_webhook`, `regle`, `connecteur`, `evenement`
- **Transversal** : `journal_audit`, `sequence_numerotation` (par agence et type de document), `piece_jointe`

Colonnes communes à toutes les tables métier : `id` (UUID), `tenant_id`, `societe_id`, `agence_id`, `cree_par`, `cree_le`, `modifie_le`, `version` (verrou optimiste).

### 6.4 Conventions d'API

- Chemins : `/v1/{ressource}` ; filtre d'agence par l'en-tête `X-Agence-Id` ou le paramètre `agence_id` ; absence de filtre = vue consolidée, si le rôle l'autorise.
- Pagination par curseur, tri et filtres normalisés, erreurs au format RFC 9457.
- Opérations d'écriture idempotentes grâce à l'en-tête `Idempotency-Key`, pour les reprises sur réseau instable.

---

## 7. Exigences non fonctionnelles

| Domaine | Exigence |
|---|---|
| Performance | Affichage d'une page en moins de 2,5 s en 3G rapide ; réponse de l'API en moins de 500 ms au 95e centile ; listes paginées côté serveur |
| Disponibilité | 99,5 % pendant les heures ouvrées ; maintenance annoncée |
| Sauvegarde | Sauvegarde continue, perte maximale de 15 minutes, restauration en moins de 4 heures, test de restauration mensuel |
| Sécurité | TLS, chiffrement au repos, mots de passe hachés (Argon2), double facteur pour les rôles groupe, protections OWASP Top 10, test d'intrusion avant J133 |
| Traçabilité | Journal d'audit non modifiable : qui, quoi, quand, quelle agence, avant et après |
| Données personnelles | Conformité à la loi locale sur les données personnelles ; droits d'accès, de rectification et d'effacement |
| Accessibilité | WCAG 2.1 niveau AA : navigation au clavier, contrastes, libellés |
| Compatibilité | Deux dernières versions de Chrome, Edge, Firefox, Safari ; Android 9 et plus pour la PWA |
| Langues | Français au MVP, architecture prête pour l'anglais |
| Réseau faible | Mode hors-ligne pour le pointage et l'application magasinier ; reprise automatique des envois |
| Qualité | Tests unitaires sur les règles métier (stock, numérotation, droits), tests de bout en bout sur les cycles achat-paiement et commande-encaissement |

---

## 8. Interface web : arborescence du MVP

| Écran | Contenu | Action principale |
|---|---|---|
| Connexion | Identifiant, mot de passe | Se connecter |
| Tableau de bord | Indicateurs du périmètre choisi, comparaison par agence, alertes | Ouvrir une alerte |
| Ventes | Clients, pipeline, devis, factures | Nouveau devis |
| Achats | Fournisseurs, demandes d'achat, commandes | Nouvelle demande |
| Stocks | Articles et niveaux par entrepôt, mouvements, transferts inter-agences | Nouveau transfert |
| Projets | Liste, puis fiche avec Kanban, Gantt et rentabilité | Nouveau projet |
| Ressources humaines | Salariés, congés, pointage et feuilles de temps | Demander un congé |
| Intégrations | Connecteurs, webhooks, règles, clés d'API | Ajouter un webhook |
| Agences | Liste des agences, comparaison, création | Nouvelle agence |

Le sélecteur d'agence est présent sur tous les écrans, dans la barre supérieure.

---

## 9. Reprise des données et mise en service

1. Import des agences, entrepôts et utilisateurs.
2. Import des articles, clients, fournisseurs, salariés depuis des fichiers CSV ou Excel, avec rapport d'erreurs ligne par ligne.
3. Stock initial par entrepôt, saisi par inventaire.
4. Soldes de congés et encours clients et fournisseurs à la date de bascule.
5. Répétition de la bascule en recette à J46, bascule réelle à J49, mise en service à J50.

---

## 10. Critères d'acceptation du MVP

- Un cycle achat-paiement et un cycle commande-encaissement exécutés sur des données réelles, dans deux agences différentes.
- Un transfert de stock entre deux agences, de la demande à la réception.
- Un directeur d'agence ne voit aucune donnée d'une autre agence ; la direction générale voit le consolidé et le détail par agence.
- Un projet pilote suivi de la planification à la marge réelle.
- Un salarié pointe, pose un congé et le fait valider depuis son téléphone.
- Un webhook reçu par un système tiers à la validation d'une facture.
- Aucune anomalie bloquante ouverte.

---

## 11. Risques

| Risque | Effet | Parade |
|---|---|---|
| Axe agence ajouté trop tard | Reprise du modèle et des écrans | Décision avant J12, intégration au lot A |
| Lots A, B, R sans marge | Le MVP glisse | Gel du périmètre à J44, report des options (connecteurs, portail fournisseur complet) |
| Fêtes de fin d'année autour de J50 | Utilisateurs pilotes indisponibles pour la recette | Réserver les utilisateurs clés dès maintenant |
| Réseau instable en agence | Saisies perdues, rejet de l'outil | ORG-15, idempotence, mode hors-ligne |
| Prestataire de paiement non choisi | Liens de paiement absents à J50 | Choix avant J20, sinon virement seul au MVP |
| Qualité des données reprises | Stocks et encours faux dès le départ | Inventaire de bascule, rapports d'erreurs d'import |

---

## 12. Décisions attendues

1. Valider l'exigence EX-ORG et son intégration au lot A (avant le 13 novembre 2026).
2. Confirmer le pays et la devise cibles.
3. Nommer les 2 connecteurs et le prestataire de paiement du MVP.
4. Confirmer le mode SaaS multi-tenant.
5. Confirmer que le multi-sociétés reste hors du plan de 133 jours.
6. Valider la stack du chapitre 6.
