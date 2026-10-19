# Diagnostic de l’envoi des emails — 19 octobre 2026

Constats sur la base principale et les journaux :

- Le serveur enregistré était smtp.gmail.com avec le port 2525. Port corrigé à 587, STARTTLS.
- Les échecs enregistrés comportaient EACCES avant même l’authentification SMTP. Les ports 587 et 465 étaient refusés dans le processus restreint et accessibles depuis un processus Windows autorisé. Le backend principal a été relancé avec cet accès réseau sur localhost:3001.
- Le secret enregistré comporte 14 caractères, au lieu des 16 caractères du mot de passe d’application Google. Sa valeur n’a été affichée ni modifiée. Le contrôle actuel retourne explicitement cette anomalie, sans essayer d’envoyer un email.

Correctifs supplémentaires : refus d’un port Gmail autre que 465 ou 587, validation de la longueur du nouveau mot de passe d’application, diagnostic visible dans les paramètres et messages compréhensibles pour les refus réseau et d’authentification. Les erreurs de configuration sont vérifiées avant l’envoi.

Validation : 25/25 contrôles de vérification et paramètres passent sur la copie de test. Aucun email réel n’a été envoyé par l’agent.

Action restante : ouvrir les paramètres du propriétaire, remplacer le secret par le mot de passe d’application Google complet, enregistrer puis vérifier la connexion. Ne pas renseigner le mot de passe habituel de la boîte Gmail. Documentation : https://support.google.com/mail/answer/185833?hl=fr
