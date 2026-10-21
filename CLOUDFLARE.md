# Cloudflare gratuit : Workers et D1

Le déploiement par défaut utilise le backend natif `cloudflare/d1/worker.mjs`, les fichiers de `public/` et la base D1 `gestion_enterprize`. L’API et l’interface partagent le même domaine. Le PC WampServer n’a pas besoin de rester allumé.

La version locale `npm start` reste Node.js/MySQL. Après migration, les bases locale et cloud sont indépendantes : aucune synchronisation automatique des nouvelles ventes.

## Publier une mise à jour

```sh
npm ci
npm run test:cloudflare
npm run cloudflare:check
npm run db:d1:migrate
npm run deploy:cloudflare
```

Connecter le compte avec `npx wrangler login`. Dans l’intégration GitHub Workers : installation `npm ci`, déploiement `npm run deploy:cloudflare`. Appliquer les nouvelles migrations avant le déploiement. Ne jamais réimporter les données à chaque build.

Le secret `JWT_SECRET` reste dans les secrets Cloudflare, avec au moins 32 caractères aléatoires. Le conserver entre les déploiements. Pour un autre compte Cloudflare, créer sa propre base D1 et remplacer son identifiant dans wrangler.jsonc.

## Migration privée depuis MySQL

`npm run export:d1` lit MySQL sans le modifier et produit `data/d1/import.sql` et un rapport. L’export ordonne les tables et comptes selon leurs dépendances et vérifie l’intégrité sur une copie locale. Tout `data/` est exclu de Git.

Sur une nouvelle base D1 vide uniquement, appliquer les migrations puis importer une seule fois :

```sh
npx wrangler d1 execute gestion_enterprize --remote --file data/d1/import.sql
```

Ne pas réimporter sur une base utilisée. Avant une nouvelle migration, sauvegarder, figer les écritures et comparer les données. Une erreur D1 durant l’import annule l’import ; vérifier les comptes avant de relancer. L’export contient des données privées et des paramètres SMTP : ne jamais le publier ni le placer sous public/.

## Conserver les accès

L’identifiant et l’email du propriétaire sont conservés. MySQL utilise bcrypt ; Workers utilise PBKDF2 via Web Crypto pour respecter le budget CPU gratuit.

`node scripts/preparer-acces-cloudflare.js` fournit un formulaire privé sur http://127.0.0.1:3012. Il vérifie les identifiants propriétaire contre MySQL et produit une empreinte compatible, sans enregistrer le mot de passe. Après confirmation :

```sh
npx wrangler d1 execute gestion_enterprize --remote --file data/d1/acces-proprietaire.sql
```

Les autres comptes importés utilisant bcrypt doivent recevoir un mot de passe Cloudflare : dans la fiche d’entreprise du propriétaire, cliquer sur **Définir le mot de passe** à côté du compte concerné. L’administrateur peut ensuite gérer ses collaborateurs dans **Comptes & rôles**. Les comptes créés directement en ligne sont immédiatement compatibles. Les données métier restent intactes.

Pour une installation neuve sans import : définir les secrets OWNER_EMAIL et OWNER_PASSWORD (12 caractères minimum), appeler POST /api/installation avec un objet JSON vide, puis retirer OWNER_PASSWORD. Un propriétaire PBKDF2 existant n’est pas remplacé.

## Services et limites

- Gmail/Workspace : renseigner SMTP dans les paramètres propriétaire, port 465/TLS ou 587/STARTTLS, avec un mot de passe d’application Google valide de 16 caractères. Les erreurs figurent dans **E-mails** ; un message journalisé n’est pas un email livré. Les paramètres SMTP peuvent aussi être des secrets Workers.
- La messagerie interne reste disponible si l’envoi email échoue. Les codes et tentatives de vérification sont limités.
- Les prélèvements restent indisponibles sans compte marchand connecté. La version D1 refuse explicitement le paiement et ne simule aucune confirmation. Les anciens paiements et leur suivi sont conservés.
- Les nouveaux PDF RH sont enregistrés dans D1 en fragments de 500 Ko, avec une limite de 10 Mo par document. Les fichiers historiques sur disque demandent un transfert distinct s’il en existe. Leur stockage consomme les quotas D1.
- Les inventaires réseau peuvent être consultés ; pour appliquer les écarts, effectuer un inventaire par magasin. La fermeture des entreprises et points de vente conserve l’historique.

## Vérifications

`npm run test:d1` vérifie installation, connexion, droits, vente de 150 articles, refus atomique d’un panier insuffisant, inventaire et réception d’achat. Les lots restent sous 50 requêtes D1 par appel dans ces tests.

Après export privé, `npm run test:d1:interface` contrôle 28 pages sur une copie des données. Il ne modifie ni MySQL ni D1 distant. `npm run cloudflare:check` compile sans publier. `/healthz` doit répondre `{"ok":true,"moteur":"d1"}`.

Le gratuit comporte des plafonds CPU, requêtes, lectures, écritures et stockage : suivre la consommation dans Cloudflare. Références officielles : [Workers](https://developers.cloudflare.com/workers/platform/limits/), [D1](https://developers.cloudflare.com/d1/platform/limits/), [lots atomiques](https://developers.cloudflare.com/d1/worker-api/d1-database/), [sockets TLS](https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets/).
