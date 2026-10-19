# Vérification du backend — 19 octobre 2026

Le backend Express / Node.js fonctionne sur http://localhost:3001 avec la base réelle `data/shopmanager.db`. La route `/api/sante` répond HTTP 200. Le serveur de tests utilise une copie distincte `data/audit-tests.db` sur le port 3000.

## Corrections effectuées

- Mise à jour de better-sqlite3 de la branche 11 vers 12.11.1 après plusieurs plantages natifs observés sous Node.js 24.20.0.
- Installation de jsdom comme dépendance de développement pour rendre les tests reproductibles.
- Conservation des paramètres personnalisés au redémarrage : auparavant les valeurs par défaut remplaçaient les tarifs et coordonnées enregistrés.
- Correction du fuseau des dates d'expiration des codes de vérification. Les anciennes dates UTC sans suffixe sont aussi reconnues.
- Les requêtes JSON invalides retournent désormais 400 et les charges trop volumineuses 413, au lieu de 500.
- Les tests qui ouvraient directement `data/shopmanager.db` respectent désormais SP_DB. Le parcours propriétaire respecte BASE_URL.
- Le lanceur signale les suites sans bilan au lieu de laisser disparaître leur erreur.

## Vérifications ciblées

- Intégrité SQLite : OK ; aucune violation déclarée de clés étrangères.
- Paramètre personnalisé conservé après deux exécutions distinctes : OK, testé dans une base séparée.
- JSON invalide : HTTP 400 ; corps de plus de 2 Mo : HTTP 413.
- Base principale : 1 entreprise, 5 points de vente, 54 produits, 3 909 ventes, 12 clients et 12 employés.
- Les résultats de la suite complète sont dans `resultats-tests.txt`.

## Points encore à traiter

- L'abonnement de la base principale est un essai expiré le 13 octobre 2026. Les refus d'écriture HTTP 402 sont donc attendus. Aucun renouvellement artificiel n'a été appliqué à cette base.
- SMTP non configuré : les emails sont consignés dans la base, sans livraison réelle.
- Le secret JWT possède une valeur de repli fixe dans `server/auth.js` : définir JWT_SECRET avant un déploiement réel.
- Le compte propriétaire et son mot de passe initial sont codés dans `server/entreprises.js`. `assurerProprietaire()` réimpose ce mot de passe au démarrage si celui de la base diffère. Il faut remplacer cette initialisation de démonstration avant une exploitation publique.
- Les identifiants de démonstration figurent dans la documentation et les journaux de démarrage. Le journal des emails peut contenir des identifiants provisoires.

La vérification par tests ne garantit pas l'absence de tout bug. Les paiements et livraisons SMTP réels ne sont pas validés par cet audit local.

## Relancer localement

Dans PowerShell à la racine du projet :

```powershell
npm start
```

Port par défaut : 3000. Pour garder le port utilisé par cet audit :

```powershell
$env:PORT = '3001'
$env:HOST = '127.0.0.1'
npm start
```

Ne pas utiliser `npm run seed` pour démarrer : cette commande réinitialise les données.

Pour tester une copie, définir SP_DB vers le fichier de copie aussi bien pour le serveur que pour le processus `npm test`, et BASE_URL si le port diffère de 3000. Plusieurs suites créent, modifient ou suppriment des données.

## Résultat final

Les 16 suites passent : **589/589 vérifications**, code de sortie 0 (`npm test`, base de copie). Le backend principal a aussi répondu à 100/100 requêtes de santé HTTP 200 après correction. L'intégrité finale de la base principale reste OK, sans violation de clé étrangère.
