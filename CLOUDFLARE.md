# Cloudflare gratuit : connexion de l’application

Le déploiement Cloudflare comprend désormais un **Worker** en plus de l’interface. Il transmet les routes `/api` et `/healthz` à un backend Node.js/MySQL par HTTPS. Les fichiers de l’interface sont toujours servis par Cloudflare. Les formulaires de connexion et les sessions continuent à utiliser le même domaine Cloudflare.

**Le backend Node.js n’est pas exécuté dans ce Worker gratuit.** Il doit fonctionner sur un serveur distinct, ou sur votre PC derrière un tunnel. Le backend actuel utilise un processus Node.js et des transactions synchrones avec worker_threads ; ce n’est pas un script Workers autonome. Cloudflare Containers permettrait de l’exécuter chez Cloudflare, mais nécessite Workers Paid. Cette configuration n’active aucun service payant.

## Choisir où faire fonctionner le backend

- **Hébergement en ligne** : déployer le backend et MySQL en suivant DEPLOIEMENT.md, importer votre sauvegarde de gestion_enterprize pour garder les entreprises et le propriétaire, puis utiliser l’URL HTTPS du backend.
- **PC WampServer avec tunnel** : laisser WampServer/MySQL et l’application sur le port 3001 en fonctionnement. Un tunnel Cloudflare public HTTPS peut transmettre les appels vers `http://localhost:3001`. Le PC doit rester allumé et connecté ; son arrêt rend la connexion et les fonctions de l’application indisponibles. Le tunnel ne transfère pas la base vers Cloudflare. Sa création et son URL doivent être configurées dans votre compte Cloudflare.

La valeur BACKEND_ORIGIN doit être une origine HTTPS sans chemin, par exemple `https://api.votre-domaine.example`. Ne pas utiliser `localhost`, `127.0.0.1`, l’adresse MySQL ou le domaine du Worker lui-même.

## Configurer et publier Cloudflare

1. Dans **Workers & Pages → votre Worker → Settings → Variables and Secrets**, ajouter `BACKEND_ORIGIN` avec l’URL HTTPS du backend choisi. Cette variable appartient à l’environnement d’exécution du Worker, pas uniquement à la phase de build GitHub.
2. Le dépôt contient `wrangler.jsonc` avec `main=cloudflare/worker.mjs`. Pour un projet connecté à GitHub : installation `npm ci`, commande de déploiement `npm run deploy:cloudflare`. Utiliser un projet **Workers**, pas un déploiement limité au dossier public sur Pages.
3. Sinon, depuis un terminal connecté à votre compte :

```sh
npm ci
npx wrangler login
npx wrangler secret put BACKEND_ORIGIN
npm run deploy:cloudflare
```

4. Ouvrir `https://votre-worker.workers.dev/healthz` : la réponse attendue est `{"ok":true}` avec un statut HTTP 200, provenant de MySQL via le backend. Puis ouvrir le site et se connecter avec les identifiants conservés dans la base.
5. Sur le backend, définir APP_URL vers le domaine Cloudflare pour les liens de vérification d’email. Les variables MySQL et JWT restent privées sur le backend ; elles ne sont pas nécessaires dans le Worker.

Sans BACKEND_ORIGIN valide ou avec un backend arrêté, les routes API renvoient une erreur JSON explicite avec statut 503. Elles ne sont plus remplacées par le HTML de l’interface. La connexion ne peut pas fonctionner avant la disponibilité effective de ce backend.

## Tests locaux

`npm run test:cloudflare` vérifie le routage, le corps de connexion, les jetons et les erreurs. `npm run cloudflare:check` construit le Worker sans le publier. `npm run test:mysql` vérifie aussi le parcours de connexion via cette liaison avec un véritable backend MySQL isolé.

Pour un aperçu Wrangler local, copier `.dev.vars.example` vers `.dev.vars` et renseigner un backend HTTPS de test. Ces variables privées ne sont pas versionnées.

Références officielles : [Workers avec fichiers statiques](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/), [Cloudflare Containers](https://developers.cloudflare.com/containers/), [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/).
