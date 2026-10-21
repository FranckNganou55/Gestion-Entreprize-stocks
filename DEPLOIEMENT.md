# Inventa GestyPro — GitHub et déploiement

Le déploiement Cloudflare par défaut utilise **Workers + D1**, avec l’interface et l’API sur le même domaine. Il ne dépend pas du PC WampServer. Voir [CLOUDFLARE.md](CLOUDFLARE.md) pour les commandes, la migration et la conservation des accès.

La version locale Node.js/MySQL reste disponible sur le port 3001. Les étapes suivantes décrivent cet autre mode d’hébergement, si vous souhaitez utiliser MySQL sur un serveur Node.js ou Docker.

## Retrouver vos entreprises et le propriétaire en ligne

1. Publier les fichiers du projet dans GitHub. Ne pas ajouter manuellement `.env`, `data/`, les sauvegardes SQL ni les captures locales : ils sont exclus du dépôt.
2. Créer une base MySQL 8 `gestion_enterprize` chez l’hébergeur.
3. Sur votre PC, lancer `npm run backup:mysql`, puis importer la sauvegarde SQL dans le MySQL distant via phpMyAdmin ou le client MySQL. Transférer cette sauvegarde en privé, jamais dans GitHub. Une base WampServer sur votre PC n’est pas automatiquement disponible sur un serveur cloud.
4. Dans les paramètres privés de l’hébergeur, définir les variables de `.env.example` : `NODE_ENV=production`, `DB_CLIENT=mysql`, `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE=gestion_enterprize`, `MYSQL_USER`, `MYSQL_PASSWORD` et un `JWT_SECRET` privé stable d’au moins 32 caractères. Ne pas définir `SP_DB`. Si le fournisseur exige TLS, définir `MYSQL_SSL=true` et son certificat dans `MYSQL_SSL_CA` si nécessaire ; la vérification du certificat reste activée.
5. Choisir Node.js 24. Installation : `npm ci`. Démarrage : `npm start`. Le serveur respecte le `PORT` de l’hébergeur et écoute sur `0.0.0.0` par défaut. L’interface utilise `/api` sur le même domaine : aucune adresse localhost à modifier.
6. Associer un domaine HTTPS. Sonde de santé : `/healthz`. Définir `APP_URL` vers votre domaine pour les emails. Monter un disque persistant et définir `DOCUMENTS_DIR` vers ce disque, puis y copier les fichiers de `data/documents/` s’il y en a.
7. Se connecter avec votre email et votre mot de passe propriétaire actuels. Ils sont conservés dans la sauvegarde MySQL. Les déploiements suivants ne remplacent ni le compte ni son mot de passe.

## Installation neuve, sans données importées

Créer d’abord une base vide sur le serveur MySQL. Renseigner les variables de connexion, puis `OWNER_EMAIL`, `OWNER_PASSWORD` (12 caractères minimum) et `OWNER_NAME` :

```sh
npm ci
npm run db:init
npm start
```

`db:init` installe uniquement une base vide et conserve les bases déjà remplies. Le propriétaire est créé au premier démarrage seulement ; aucune entreprise de démonstration n’est ajoutée en production. Un propriétaire déjà présent est conservé même si les variables OWNER changent. Le compte utilisé pour l’installation doit avoir les droits de création de tables ; le compte du serveur peut ensuite être limité à SELECT, INSERT, UPDATE et DELETE. Pour une base partiellement installée, corriger la migration sans supprimer les données.

## Docker Compose

Copier `.env.example` vers `.env`, renseigner `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD` et `JWT_SECRET`. Pour une installation neuve, renseigner aussi OWNER_EMAIL et OWNER_PASSWORD.

```sh
docker compose up -d --build
```

Compose attend MySQL, initialise le schéma si nécessaire puis lance l’application. Les volumes `mysql_data` et `documents` sont persistants. Un proxy HTTPS doit exposer l’application, liée côté serveur à `127.0.0.1:3001`.

Pour reprendre vos données existantes, importer la sauvegarde avant le premier démarrage de l’application :

```sh
docker compose up -d mysql
# Attendre que MySQL soit sain, puis importer le fichier privé :
docker compose exec -T mysql sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql -uroot gestion_enterprize' < sauvegarde.sql
docker compose up -d --build
```

Pour mettre à jour : sauvegarder, récupérer le code puis relancer `docker compose up -d --build`. Ne pas utiliser `docker compose down -v` : cette option supprime les volumes.

## Local, sauvegardes et tests

- Local : démarrer WampServer puis `demarrer.bat`, ouvrir http://localhost:3001. `data/database.json` reste privé. Un `.env` est chargé automatiquement sans remplacer les variables du système.
- `npm run backup:mysql` crée une sauvegarde privée. Pour MySQL distant, prévoir aussi les sauvegardes du fournisseur ou un client mysqldump disponible sur le serveur.
- `npm run test:production` vérifie une base neuve, la connexion et la conservation du propriétaire après redémarrage. Utilise une base et un compte temporaires via le root MySQL local ; `TEST_MYSQL_ROOT_PASSWORD` est disponible pour la CI.
- `npm run test:mysql` vérifie les opérations métier sur une copie isolée du MySQL WampServer actuel.
- GitHub Actions lance le test de production puis construit l’image Docker lors des futurs push et pull requests.

Les emails demandent un SMTP valide. Les paiements demandent un compte marchand et des URLs HTTPS publiques. Ces services ne sont pas activés par la publication du code.

Avant d’exposer une ancienne base de démonstration en ligne, remplacer depuis les profils les mots de passe initiaux des comptes de démonstration conservés dans cette base. La migration ne modifie volontairement aucun de vos mots de passe. Les anciens tests basés sur une copie du propriétaire peuvent recevoir son mot de passe via `TEST_OWNER_PASSWORD`, sans l’inscrire dans les fichiers.

Références : [environnement Node.js](https://nodejs.org/api/process.html#processloadenvfilepath), [démarrage Docker Compose](https://docs.docker.com/compose/how-tos/startup-order/).
