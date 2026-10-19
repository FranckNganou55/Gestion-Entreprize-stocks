# Utiliser GestyPro en ligne

Le déploiement Netlify publie uniquement `public`. L’interface est accessible à
l’adresse HTTPS du site. Les écrans utilisent les liens existants, par exemple
`/#/inscription`, `/#/connexion`, `/#/dashboard`, `/#/produits` et `/#/stocks`.
Les écrans de gestion restent réservés aux comptes connectés et autorisés.

Les appels `/api/*` sont pris en charge par la fonction Netlify `api`. Les données
métier sont conservées dans Netlify Database (PostgreSQL), avec un schéma Drizzle
et des migrations dans `netlify/database/migrations`. Les documents PDF sont
stockés dans Netlify Blobs et téléchargés après les contrôles d’accès habituels.
Les comptes et données SQLite du dépôt ne sont pas importés. Le nouveau stockage
contient uniquement les réglages et rôles nécessaires au fonctionnement ; les
entreprises, produits, stocks et ventes se créent depuis l’application.

## Première entreprise

Ouvrir `/#/inscription`, renseigner son entreprise puis confirmer l’adresse email
en cliquant sur le lien reçu. Le service Netlify Identity envoie la confirmation,
sans configuration SMTP supplémentaire pour cette étape. Le lien ouvre
l’application et active le compte correspondant. La connexion habituelle de
l’application reste disponible pour l’entreprise et ses employés.

Les notifications commerciales et messages métiers utilisent toujours le SMTP
configurable dans la console du propriétaire. Un prestataire de paiement doit
également être configuré pour les paiements automatiques. Ces services ne sont
pas nécessaires pour afficher les pages ou utiliser l’essai gratuit après
confirmation de l’adresse email.

## Accès du propriétaire

Aucun compte propriétaire de démonstration n’est créé en ligne. Le premier accès
se prépare dans la gestion des utilisateurs Netlify Identity : inviter le
propriétaire et lui attribuer le rôle `admin`. Son adresse doit correspondre à
celle du propriétaire configurée dans le projet ; la variable serveur
`OWNER_EMAIL` permet de choisir une autre adresse. Utiliser une adresse distincte
de celle d’un administrateur d’entreprise.

Le lien d’invitation ouvre un formulaire pour choisir son mot de passe. L’accès
à la console est accordé uniquement à une identité confirmée qui possède le rôle
`admin` et l’adresse attendue. Les connexions suivantes utilisent l’écran de
connexion normal. L’adresse seule ne permet jamais d’obtenir cet accès.

## Vérifications

`npm run test:netlify` vérifie les migrations et les parcours API sur un moteur
PostgreSQL isolé, puis le point d’entrée de la fonction et l’interface. Le service
d’envoi d’emails est simulé dans ces tests : aucun email réel n’est envoyé et la
base du site n’est pas modifiée. Le déploiement applique les migrations et active
Identity ; vérifier ensuite une inscription réelle, le lien reçu et une vente
sur le déploiement publié.

Pour un développement local avec les services Netlify, utiliser
`netlify dev --port 8889`.
`npm start` reste disponible pour le fonctionnement historique sur SQLite local.
