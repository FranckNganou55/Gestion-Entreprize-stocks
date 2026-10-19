# Propriétaire et codes email — 19 octobre 2026

Page : http://localhost:3001/#/plateforme-parametres

## Corrections

- Le propriétaire de la plateforme n'est pas soumis à la vérification imposée aux comptes d'entreprise. Son ancienne URL `#/verification` ouvre désormais ses paramètres ; aucune confirmation de propriété de son email n'est fabriquée.
- La page Paramètres du propriétaire rassemble Gmail/SMTP, URL de connexion, coordonnées d'assistance, moyens de paiement et apparence, avec accès au journal des emails et aux tarifs.
- Le renvoi d'un code distingue un message transmis au serveur SMTP, un échec d'envoi et un email uniquement consigné. Sans SMTP, l'interface affiche « Aucun email envoyé ».
- Connexion SMTP et envoi d'un email de test sont deux actions séparées. Aucun envoi de test réel n'a été effectué pendant ces vérifications.
- Le mot de passe SMTP n'est plus renvoyé par l'API de paramètres. Un champ vide conserve le secret enregistré. Les mots de passe d'application Google saisis avec des espaces sont normalisés.
- La modification du mot de passe SMTP recrée le transporteur. Connexions chiffrées et délais d'attente sont configurés.
- Le mot de passe propriétaire personnalisé est désormais conservé lors d'un redémarrage.
- Les liens inclus dans les emails utilisent l'URL de l'application renseignée dans les paramètres ; sur cette installation, le formulaire propose http://localhost:3001.
- La traduction utilise les expressions longues avant les mots isolés : « Renvoyer le code » n'est plus transformé en une action de licenciement en anglais.

## Activer Gmail

1. Recharger l'application (Ctrl+F5), puis ouvrir Paramètres dans le compte propriétaire.
2. Activer la validation en deux étapes et créer un mot de passe d'application dans le [compte Google](https://myaccount.google.com/apppasswords), selon l'[aide officielle](https://support.google.com/mail/answer/185833?hl=fr).
3. Renseigner l'adresse Gmail complète et ce mot de passe directement dans le formulaire. Le serveur proposé est smtp.gmail.com, port 587, STARTTLS.
4. Enregistrer, vérifier la connexion puis envoyer un email de test vers l'adresse choisie. Une acceptation SMTP ne garantit pas le placement dans la boîte de réception : vérifier aussi les courriers indésirables.
5. Les administrateurs d'entreprise pourront ensuite demander un nouveau code de vérification. Le propriétaire n'en a pas besoin pour utiliser sa console.

Si les mots de passe d'application sont désactivés par la politique Google Workspace, l'administrateur de cette organisation doit fournir une méthode SMTP compatible. Aucun identifiant Google n'a été inventé ni configuré à votre place.

## Validation

Tests sur une copie distincte `data/verification-demandes.db` :

- Vérification / paramètres propriétaire : 23/23.
- Nouvelles options : 64/64.
- Console propriétaire : 30/30.
- Parcours propriétaire : 25/25.
- Apparence / traductions : 14/14.

Le backend principal répond HTTP 200. Le SMTP reste non configuré tant que le mot de passe d'application n'est pas renseigné ; aucune livraison réelle n'est annoncée.
