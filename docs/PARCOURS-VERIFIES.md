# Parcours de gestion et abonnement — vérification du 19 octobre 2026

Application principale : http://localhost:3001. Base de test séparée : `data/verification-demandes.db`, serveur sur le port 3000.

## Fonctionnement livré

| Demande | Fonctionnement |
|---|---|
| Abonnement et logos | Logos proportionnés dans des cartes homogènes, adaptation mobile, choix de formule et réduction vérifiés côté serveur. |
| Carte bancaire | Redirection vers la page HTTPS du prestataire configuré. Aucun numéro de carte ni cryptogramme demandé dans l’application. Sans prestataire, alternative de virement avec validation manuelle clairement indiquée. |
| Orange Money / MTN | Instructions et bénéficiaire vérifiables, ouverture du menu USSD, déclaration puis vérification par le propriétaire. La déclaration seule n’active jamais l’abonnement. |
| Dotation d’une boutique | Choix du stock source, contrôle des produits et quantités, débit de la source et crédit de la destination dans une transaction unique. Aucune boutique orpheline si la dotation échoue. Le formulaire de création d’une boutique demande sa dotation. |
| Caisse et habilitations | Après création, affectation du caissier et choix du rôle/habilitations. Les rôles existants et personnalisés sont conservés. |
| Dashboard boutique | Les ventes, stocks, employés et synthèses par point de vente sont limités au magasin affecté pour les comptes de boutique. |
| Aperçu réseau | Quantités restantes, ventes journalières des boutiques, entrées/sorties des magasins. Une boutique fermée ne peut plus encaisser. |
| Suppression d’un point | Suppression si aucun historique ni stock ne doit être préservé ; sinon fermeture avec conservation des données. |
| Messages sur les pages | Accès dans l’en-tête et dans le menu, compteur de non-lus. Le propriétaire choisit les administrateurs actifs ; l’administrateur choisit les profils actifs de son entreprise. Réponse au propriétaire possible depuis un message reçu, sans ouvrir la liste des autres entreprises. |
| Inventaires | Gestion, clôture, application et suppression réservées au rôle administrateur, même si une habilitation est accordée à un autre rôle. Rapport imprimable avec le logo applicatif existant et le logo de l’entreprise en dessous, ainsi que son logo dans l’en-tête. |
| Prix du produit | Prix de vente facultatif dans le formulaire et dans l’API ; saisie du prix lors de la vente. |
| Expiration | Lectures et écritures métier bloquées pour tous les profils de l’entreprise. Abonnement, aide et messagerie restent disponibles. Un message et un email de rappel sont générés au plus une fois par jour ; contrôle automatique chaque minute tant que le serveur fonctionne. |
| Réactivation offerte | Dans Entreprises → Fiche complète → Réactiver sans abonnement. Seul le propriétaire peut accorder ou retirer cet accès. Les clients détectent le changement automatiquement. |
| Marque de l’entreprise | Le nom de l’entreprise vient de sa fiche, accompagné de son logo lorsqu’il existe. Le logo applicatif fourni dans le projet est conservé. |
| Langues | Français, anglais, mandarin, espagnol, allemand, arabe, russe et italien. Dictionnaires des nouvelles langues pour la navigation, les actions et les principaux parcours ; prise en charge du sens droite-à-gauche pour l’arabe. Les libellés secondaires non présents dans les dictionnaires conservent le français. |
| Devises | FCFA/XAF, EUR, USD, CAD, CNY, NGN, RUB, GBP, CHF et JPY. Paramètres → Devise d’affichage → Actualiser les taux. Conversion de l’affichage et de la saisie en caisse. Les données de référence, les autres champs explicitement libellés FCFA et les exports comptables restent en FCFA. |
| Monitoring propriétaire | Clic sur une entreprise du dashboard → fiche détaillée : contacts, abonnement, points de vente, comptes, paiements, stocks, dernières ventes et activité récente. |

## Validation

- Suite existante : **589/589**, code de sortie 0 (`resultats-demandes.txt`).
- Nouveaux contrôles métier : **32/32**, code de sortie 0 (`resultats-exigences.txt`).
- Après les ajustements finaux : suites temps réel (14/14), boutiques (18/18) et nouveaux contrôles (32/32) rejouées avec succès.
- Vérification visuelle du formulaire d’abonnement sur un écran étroit : logos, cartes et en-tête sans débordement.
- Base principale : intégrité OK et aucune violation de clés étrangères.
- L’essai de la base principale reste expiré au 13 octobre 2026 ; aucun accès gratuit n’a été accordé artificiellement à cette entreprise.

## Configuration externe nécessaire

L’envoi effectif des emails nécessite le SMTP ; à défaut, les messages sont disponibles dans l’application et les emails sont consignés. L’encaissement automatique nécessite les clés marchand et les URLs de notification publiques du prestataire. Les adaptateurs sont testés sur des réponses simulées ; aucun débit réel n’a été effectué.

Les taux publics ont été récupérés le 19 octobre 2026 via [Frankfurter](https://frankfurter.dev/). La parité EUR/XAF utilisée est de 655,957 FCFA pour un euro, selon la [BEAC](https://www.beac.int/billets-pieces/histoire-franc-cfa/). Les autres taux sont datés et actualisables ; en cas d’indisponibilité réseau, les derniers taux conservés restent utilisables.

## Rejouer les nouveaux contrôles

Définir SP_DB vers une copie nommée `verification-demandes.db` côté serveur et côté test, puis lancer `npm run test:exigences`. Les suites effectuent des écritures : ne pas les diriger vers la base principale.

Ajustements finaux : surveillance des expirations sans connexion utilisateur, rafraîchissement automatique de l’accès et des messages non lus, refus des ventes dans un point fermé, conservation du stock lors d’une fermeture et adaptation des fenêtres sur mobile. Contrôles complémentaires : messagerie 18/18 et apparence 14/14.
