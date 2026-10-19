# Structure de la base de données

Audit du 19 octobre 2026. SQLite, fichier `data/shopmanager.db`, accès par `better-sqlite3`. Aucun serveur MySQL nécessaire.

La base est commune aux entreprises. `entreprise_id` sépare leurs données ; `magasin_id` rattache les opérations aux boutiques/magasins. Les lignes de vente et de commande héritent de ce périmètre par leur document parent. Les rôles sont partagés. Dans `parametres`, entreprise_id = 0 désigne la plateforme. Le propriétaire possède un compte sans entreprise.

Relations principales : entreprise → magasins/utilisateurs/produits/clients/fournisseurs/abonnements ; magasin + produit → stocks ; vente → ventes_lignes → produit ; commande_achat → commandes_achat_lignes ; inventaire → inventaires_lignes ; employé → salaires/documents.

Les fichiers `-wal` et `-shm` accompagnent SQLite en fonctionnement. Utiliser une sauvegarde SQLite pour obtenir une copie cohérente pendant son utilisation.

Intégrité : [{"integrity_check":"ok"}]. Violations de clés étrangères : 0.

## abonnements

1 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| statut | TEXT |  | oui |
| plan | TEXT |  |  |
| montant | REAL |  | oui |
| date_debut | TEXT |  | oui |
| date_fin | TEXT |  | oui |
| reference | TEXT |  |  |
| maj_at | TEXT |  | oui |
| entreprise_id | INTEGER |  |  |

Relations déclarées : `entreprise_id` → `entreprises.id` (CASCADE).

## candidats

3 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| entreprise_id | INTEGER |  |  |
| nom | TEXT |  | oui |
| poste_vise | TEXT |  |  |
| magasin_id | INTEGER |  |  |
| telephone | TEXT |  |  |
| email | TEXT |  |  |
| ville | TEXT |  |  |
| date_naissance | TEXT |  |  |
| date_candidature | TEXT |  | oui |
| source | TEXT |  |  |
| experience_annees | INTEGER |  |  |
| formation | TEXT |  |  |
| statut | TEXT |  | oui |
| date_entretien | TEXT |  |  |
| salaire_propose | REAL |  |  |
| motif | TEXT |  |  |
| employe_id | INTEGER |  |  |
| notes | TEXT |  |  |
| created_at | TEXT |  | oui |

Relations déclarées : `employe_id` → `employes.id` (SET NULL), `magasin_id` → `magasins.id` (SET NULL), `entreprise_id` → `entreprises.id` (CASCADE).

## categories

9 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| entreprise_id | INTEGER |  |  |
| nom | TEXT |  | oui |
| couleur | TEXT |  |  |

Relations déclarées : `entreprise_id` → `entreprises.id` (CASCADE).

## clients

12 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| code | TEXT |  |  |
| nom | TEXT |  | oui |
| telephone | TEXT |  |  |
| email | TEXT |  |  |
| adresse | TEXT |  |  |
| ville | TEXT |  |  |
| type | TEXT |  |  |
| points | INTEGER |  | oui |
| created_at | TEXT |  | oui |
| entreprise_id | INTEGER |  |  |

Relations déclarées : `entreprise_id` → `entreprises.id` (CASCADE).

## codes_verification

0 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| user_id | INTEGER |  | oui |
| code | TEXT |  | oui |
| jeton | TEXT |  | oui |
| expire_at | TEXT |  | oui |
| utilise_at | TEXT |  |  |
| created_at | TEXT |  | oui |

## commandes_achat

12 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| reference | TEXT |  | oui |
| fournisseur_id | INTEGER |  | oui |
| magasin_id | INTEGER |  | oui |
| statut | TEXT |  | oui |
| total | REAL |  | oui |
| note | TEXT |  |  |
| user_id | INTEGER |  |  |
| created_at | TEXT |  | oui |
| reception_at | TEXT |  |  |

Relations déclarées : `user_id` → `users.id` (SET NULL), `magasin_id` → `magasins.id` (NO ACTION), `fournisseur_id` → `fournisseurs.id` (NO ACTION).

## commandes_achat_lignes

55 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| commande_id | INTEGER |  | oui |
| produit_id | INTEGER |  | oui |
| quantite | REAL |  | oui |
| prix_unitaire | REAL |  | oui |

Relations déclarées : `produit_id` → `produits.id` (NO ACTION), `commande_id` → `commandes_achat.id` (CASCADE).

## documents_candidat

0 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| entreprise_id | INTEGER |  |  |
| candidat_id | INTEGER |  | oui |
| categorie | TEXT |  | oui |
| nom_original | TEXT |  | oui |
| nom_stocke | TEXT |  | oui |
| type_mime | TEXT |  | oui |
| taille | INTEGER |  | oui |
| televerse_par | INTEGER |  |  |
| created_at | TEXT |  | oui |

Relations déclarées : `televerse_par` → `users.id` (SET NULL), `candidat_id` → `candidats.id` (CASCADE), `entreprise_id` → `entreprises.id` (CASCADE).

## documents_employe

0 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| entreprise_id | INTEGER |  |  |
| employe_id | INTEGER |  | oui |
| categorie | TEXT |  | oui |
| nom_original | TEXT |  | oui |
| nom_stocke | TEXT |  | oui |
| type_mime | TEXT |  | oui |
| taille | INTEGER |  | oui |
| date_document | TEXT |  |  |
| televerse_par | INTEGER |  |  |
| created_at | TEXT |  | oui |

Relations déclarées : `televerse_par` → `users.id` (SET NULL), `employe_id` → `employes.id` (CASCADE), `entreprise_id` → `entreprises.id` (CASCADE).

## employes

12 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| code | TEXT |  |  |
| nom | TEXT |  | oui |
| poste | TEXT |  |  |
| magasin_id | INTEGER |  |  |
| telephone | TEXT |  |  |
| email | TEXT |  |  |
| date_embauche | TEXT |  |  |
| type_contrat | TEXT |  |  |
| salaire | REAL |  |  |
| actif | INTEGER |  | oui |
| created_at | TEXT |  | oui |
| civilite | TEXT |  |  |
| date_naissance | TEXT |  |  |
| lieu_naissance | TEXT |  |  |
| sexe | TEXT |  |  |
| situation_matrimoniale | TEXT |  |  |
| adresse | TEXT |  |  |
| ville | TEXT |  |  |
| numero_cni | TEXT |  |  |
| numero_cnps | TEXT |  |  |
| numero_ifu | TEXT |  |  |
| contact_urgence_nom | TEXT |  |  |
| contact_urgence_tel | TEXT |  |  |
| formation | TEXT |  |  |
| date_fin_contrat | TEXT |  |  |
| date_sortie | TEXT |  |  |
| motif_sortie | TEXT |  |  |
| notes | TEXT |  |  |
| statut_dossier | TEXT |  | oui |
| entreprise_id | INTEGER |  |  |

Relations déclarées : `entreprise_id` → `entreprises.id` (CASCADE).

## entreprises

1 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| nom | TEXT |  | oui |
| email | TEXT |  | oui |
| nom_contact | TEXT |  |  |
| prenom_contact | TEXT |  |  |
| telephone | TEXT |  |  |
| ville | TEXT |  |  |
| pays | TEXT |  |  |
| date_creation | TEXT |  |  |
| niu | TEXT |  |  |
| logo | TEXT |  |  |
| statut | TEXT |  | oui |
| notes | TEXT |  |  |
| created_at | TEXT |  | oui |

## formules

3 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| code | TEXT |  | oui |
| libelle | TEXT |  | oui |
| duree_jours | INTEGER |  | oui |
| montant | REAL |  | oui |
| actif | INTEGER |  | oui |
| ordre | INTEGER |  | oui |
| note | TEXT |  |  |
| cree_par | INTEGER |  |  |
| cree_le | TEXT |  | oui |
| maj_le | TEXT |  |  |

Relations déclarées : `cree_par` → `users.id` (SET NULL).

## fournisseurs

6 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| code | TEXT |  |  |
| nom | TEXT |  | oui |
| contact | TEXT |  |  |
| telephone | TEXT |  |  |
| email | TEXT |  |  |
| adresse | TEXT |  |  |
| ville | TEXT |  |  |
| categorie | TEXT |  |  |
| created_at | TEXT |  | oui |
| entreprise_id | INTEGER |  |  |

Relations déclarées : `entreprise_id` → `entreprises.id` (CASCADE).

## inventaires

1 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| entreprise_id | INTEGER |  |  |
| magasin_id | INTEGER |  |  |
| libelle | TEXT |  | oui |
| statut | TEXT |  | oui |
| commentaire | TEXT |  |  |
| cree_par | INTEGER |  |  |
| cloture_par | INTEGER |  |  |
| created_at | TEXT |  | oui |
| cloture_at | TEXT |  |  |

Relations déclarées : `cloture_par` → `users.id` (SET NULL), `cree_par` → `users.id` (SET NULL), `magasin_id` → `magasins.id` (CASCADE), `entreprise_id` → `entreprises.id` (CASCADE).

## inventaires_lignes

54 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| inventaire_id | INTEGER |  | oui |
| produit_id | INTEGER |  | oui |
| magasin_id | INTEGER |  |  |
| quantite_theorique | REAL |  | oui |
| quantite_calculee | REAL |  | oui |
| quantite_comptee | REAL |  |  |
| prix_achat | REAL |  | oui |
| prix_vente | REAL |  | oui |
| compte_par | INTEGER |  |  |
| note | TEXT |  |  |
| maj_at | TEXT |  | oui |

Relations déclarées : `compte_par` → `users.id` (SET NULL), `magasin_id` → `magasins.id` (CASCADE), `produit_id` → `produits.id` (CASCADE), `inventaire_id` → `inventaires.id` (CASCADE).

## journal_evenements

1341 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| entreprise_id | INTEGER |  | oui |
| magasin_id | INTEGER |  |  |
| type | TEXT |  | oui |
| libelle | TEXT |  |  |
| montant | REAL |  |  |
| reference | TEXT |  |  |
| user_id | INTEGER |  |  |
| auteur | TEXT |  |  |
| created_at | TEXT |  | oui |

## magasins

5 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| entreprise_id | INTEGER |  |  |
| code | TEXT |  | oui |
| nom | TEXT |  | oui |
| ville | TEXT |  |  |
| adresse | TEXT |  |  |
| telephone | TEXT |  |  |
| responsable | TEXT |  |  |
| actif | INTEGER |  | oui |
| created_at | TEXT |  | oui |
| type | TEXT |  | oui |

Relations déclarées : `entreprise_id` → `entreprises.id` (CASCADE).

## mails_envoyes

95 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| entreprise_id | INTEGER |  |  |
| destinataire | TEXT |  | oui |
| destinataire_nom | TEXT |  |  |
| sujet | TEXT |  | oui |
| corps_html | TEXT |  |  |
| corps_texte | TEXT |  |  |
| langue | TEXT |  |  |
| type | TEXT |  |  |
| statut | TEXT |  | oui |
| erreur | TEXT |  |  |
| smtp_utilise | INTEGER |  |  |
| created_at | TEXT |  | oui |
| envoye_at | TEXT |  |  |

## messages

0 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| de_user_id | INTEGER |  |  |
| de_nom | TEXT |  |  |
| de_email | TEXT |  |  |
| a_user_id | INTEGER |  |  |
| a_nom | TEXT |  |  |
| a_email | TEXT |  |  |
| entreprise_id | INTEGER |  |  |
| objet | TEXT |  | oui |
| corps | TEXT |  | oui |
| lu | INTEGER |  | oui |
| lu_at | TEXT |  |  |
| created_at | TEXT |  | oui |

Relations déclarées : `a_user_id` → `users.id` (SET NULL), `de_user_id` → `users.id` (SET NULL).

## mouvements_stock

13653 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| produit_id | INTEGER |  | oui |
| magasin_id | INTEGER |  | oui |
| type | TEXT |  | oui |
| quantite | REAL |  | oui |
| quantite_avant | REAL |  |  |
| quantite_apres | REAL |  |  |
| motif | TEXT |  |  |
| reference | TEXT |  |  |
| user_id | INTEGER |  |  |
| created_at | TEXT |  | oui |

Relations déclarées : `user_id` → `users.id` (SET NULL), `magasin_id` → `magasins.id` (CASCADE), `produit_id` → `produits.id` (CASCADE).

## paiements_abonnement

3 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| reference | TEXT |  | oui |
| service | TEXT |  | oui |
| numero_paiement | TEXT |  | oui |
| telephone_payeur | TEXT |  |  |
| nom_payeur | TEXT |  |  |
| plan | TEXT |  | oui |
| montant | REAL |  | oui |
| duree_jours | INTEGER |  | oui |
| statut | TEXT |  | oui |
| message | TEXT |  |  |
| user_id | INTEGER |  |  |
| valide_par | INTEGER |  |  |
| created_at | TEXT |  | oui |
| traite_at | TEXT |  |  |
| entreprise_id | INTEGER |  |  |
| psp | TEXT |  |  |
| psp_mode | TEXT |  |  |
| psp_reference | TEXT |  |  |
| psp_ticket | TEXT |  |  |
| psp_statut | TEXT |  |  |
| psp_url | TEXT |  |  |
| psp_brut | TEXT |  |  |
| montant_brut | REAL |  |  |
| reduction_id | INTEGER |  |  |
| code_reduction | TEXT |  |  |
| carte_titulaire | TEXT |  |  |
| carte_numero_masque | TEXT |  |  |
| carte_expiration | TEXT |  |  |

Relations déclarées : `entreprise_id` → `entreprises.id` (CASCADE), `valide_par` → `users.id` (SET NULL), `user_id` → `users.id` (SET NULL).

## parametres

26 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| entreprise_id | INTEGER | oui | oui |
| cle | TEXT | oui | oui |
| valeur | TEXT |  |  |

## produits

54 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| code | TEXT |  | oui |
| code_barres | TEXT |  |  |
| nom | TEXT |  | oui |
| categorie_id | INTEGER |  |  |
| unite | TEXT |  |  |
| prix_achat | REAL |  | oui |
| prix_vente | REAL |  | oui |
| tva | REAL |  | oui |
| seuil_alerte | INTEGER |  | oui |
| actif | INTEGER |  | oui |
| image | TEXT |  |  |
| created_at | TEXT |  | oui |
| entreprise_id | INTEGER |  |  |

Relations déclarées : `entreprise_id` → `entreprises.id` (CASCADE).

## reductions

1 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| code | TEXT |  | oui |
| libelle | TEXT |  |  |
| type | TEXT |  | oui |
| valeur | REAL |  | oui |
| formule_code | TEXT |  |  |
| max_utilisations | INTEGER |  |  |
| utilisations | INTEGER |  | oui |
| actif | INTEGER |  | oui |
| debut | TEXT |  |  |
| fin | TEXT |  |  |
| note | TEXT |  |  |
| cree_par | INTEGER |  |  |
| cree_le | TEXT |  | oui |

Relations déclarées : `cree_par` → `users.id` (SET NULL).

## roles

7 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| code | TEXT |  | oui |
| nom | TEXT |  | oui |
| description | TEXT |  |  |
| permissions | TEXT |  | oui |
| portee | TEXT |  | oui |
| systeme | INTEGER |  | oui |
| attribuable_boutique | INTEGER |  | oui |
| created_at | TEXT |  | oui |

## salaires

12 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| entreprise_id | INTEGER |  |  |
| employe_id | INTEGER |  | oui |
| periode | TEXT |  | oui |
| montant | REAL |  | oui |
| primes | REAL |  | oui |
| retenues | REAL |  | oui |
| net | REAL |  | oui |
| date_paiement | TEXT |  |  |
| statut | TEXT |  | oui |
| mode_paiement | TEXT |  |  |
| reference | TEXT |  |  |
| notes | TEXT |  |  |
| saisi_par | INTEGER |  |  |
| created_at | TEXT |  | oui |

Relations déclarées : `saisi_par` → `users.id` (SET NULL), `employe_id` → `employes.id` (CASCADE), `entreprise_id` → `entreprises.id` (CASCADE).

## stocks

270 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| produit_id | INTEGER |  | oui |
| magasin_id | INTEGER |  | oui |
| quantite | REAL |  | oui |
| maj_at | TEXT |  | oui |

Relations déclarées : `magasin_id` → `magasins.id` (CASCADE), `produit_id` → `produits.id` (CASCADE).

## transferts

18 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| reference | TEXT |  | oui |
| magasin_source_id | INTEGER |  | oui |
| magasin_dest_id | INTEGER |  | oui |
| produit_id | INTEGER |  | oui |
| quantite | REAL |  | oui |
| statut | TEXT |  | oui |
| note | TEXT |  |  |
| user_id | INTEGER |  |  |
| created_at | TEXT |  | oui |
| valide_at | TEXT |  |  |

Relations déclarées : `user_id` → `users.id` (SET NULL), `produit_id` → `produits.id` (NO ACTION), `magasin_dest_id` → `magasins.id` (NO ACTION), `magasin_source_id` → `magasins.id` (NO ACTION).

## users

11 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| nom | TEXT |  | oui |
| email | TEXT |  | oui |
| mot_de_passe | TEXT |  | oui |
| role | TEXT |  | oui |
| magasin_id | INTEGER |  |  |
| actif | INTEGER |  | oui |
| dernier_login | TEXT |  |  |
| cree_par | INTEGER |  |  |
| created_at | TEXT |  | oui |
| permissions_extra | TEXT |  | oui |
| permissions_retirees | TEXT |  | oui |
| entreprise_id | INTEGER |  |  |
| email_verifie | INTEGER |  | oui |
| email_verifie_at | TEXT |  |  |
| langue | TEXT |  | oui |

Relations déclarées : `entreprise_id` → `entreprises.id` (CASCADE), `cree_par` → `users.id` (SET NULL), `magasin_id` → `magasins.id` (SET NULL).

## ventes

3909 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| reference | TEXT |  | oui |
| magasin_id | INTEGER |  | oui |
| client_id | INTEGER |  |  |
| user_id | INTEGER |  |  |
| sous_total | REAL |  | oui |
| remise | REAL |  | oui |
| tva | REAL |  | oui |
| total | REAL |  | oui |
| mode_paiement | TEXT |  | oui |
| montant_paye | REAL |  | oui |
| monnaie | REAL |  | oui |
| statut | TEXT |  | oui |
| note | TEXT |  |  |
| created_at | TEXT |  | oui |

Relations déclarées : `user_id` → `users.id` (SET NULL), `client_id` → `clients.id` (SET NULL), `magasin_id` → `magasins.id` (RESTRICT).

## ventes_lignes

12925 enregistrements lors de l’audit.

| Colonne | Type | Clé primaire | Obligatoire |
|---|---|---|---|
| id | INTEGER | oui |  |
| vente_id | INTEGER |  | oui |
| produit_id | INTEGER |  |  |
| nom_produit | TEXT |  | oui |
| quantite | REAL |  | oui |
| prix_unitaire | REAL |  | oui |
| remise | REAL |  | oui |
| total | REAL |  | oui |

Relations déclarées : `produit_id` → `produits.id` (SET NULL), `vente_id` → `ventes.id` (CASCADE).


## Lire la base

SQLite est un fichier local : il n'y a pas d'hôte MySQL, d'utilisateur SQL ni de mot de passe SQL à renseigner. Les comptes applicatifs sont dans `users` ; leur champ `mot_de_passe` contient un hachage bcrypt. Les documents RH sont référencés dans les tables de documents et leurs fichiers sont gérés par `server/rh.js`.

| Domaine | Tables |
|---|---|
| Entreprises et accès | entreprises, magasins, users, roles |
| Catalogue et stock | categories, produits, stocks, mouvements_stock, transferts |
| Commerce | clients, fournisseurs, ventes, ventes_lignes, commandes_achat, commandes_achat_lignes |
| Inventaires | inventaires, inventaires_lignes |
| Ressources humaines | employes, salaires, candidats, documents_employe, documents_candidat |
| Abonnements | abonnements, paiements_abonnement, formules, reductions |
| Réglages et communication | parametres, messages, mails_envoyes, codes_verification, journal_evenements |

Le schéma initial et les migrations sont dans `server/db.js`. Les tables de journal et d'emails sont aussi créées par `server/evenements.js` et `server/mails.js`. Les contraintes SQL aident à préserver les relations ; le contrôle d'accès par entreprise est assuré par le backend, notamment `server/portee.js` et les routes.
