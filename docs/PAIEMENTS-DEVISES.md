# Paiements et devises

Les fenêtres Visa / Mastercard et Orange Money / MTN utilisent désormais un parcours de paiement hébergé. Les coordonnées bancaires du propriétaire ne sont plus affichées dans ces fenêtres.

Pour les cartes, les coordonnées de facturation sont demandées dans l’application. Le numéro de carte, la date d’expiration et le cryptogramme sont saisis uniquement sur la page HTTPS du prestataire de paiement.

Pour le mobile money, le client renseigne le numéro du compte à débiter. La validation sur téléphone dépend du prestataire et des opérateurs disponibles sur son compte marchand. L’application active l’abonnement uniquement après vérification du résultat auprès du prestataire et contrôle du montant. Elle envoie alors un message interne aux administrateurs de l’entreprise et au propriétaire. L’envoi par email dépend également d’une configuration SMTP valide.

## Situation actuelle et activation

Vous avez indiqué ne pas encore avoir de compte marchand. Les débits et demandes de confirmation sur téléphone sont donc indisponibles. Les formulaires l’indiquent et empêchent de lancer un paiement sans configuration opérationnelle.

Pour activer les paiements réels :

1. Ouvrir un compte marchand auprès d’un prestataire compatible avec les cartes et les opérateurs camerounais souhaités ; vérifier sa couverture Orange Money / MTN et XAF.
2. Renseigner ses clés dans les paramètres de paiement du propriétaire, sans les transmettre dans la conversation.
3. Publier l’application avec des adresses HTTPS publiques pour le retour client et les notifications du prestataire. Une adresse localhost ne suffit pas.
4. Effectuer les essais du prestataire en environnement de test, puis activer les identifiants de production.

Adaptateurs présents : CinetPay et PayDunya. La disponibilité exacte des moyens de paiement dépend du pays et du contrat marchand. Références : [CinetPay](https://docs.cinetpay.com/api/1.0-fr/checkout/initialisation), [PayDunya](https://developers.paydunya.com/doc/EN/http_json).

## Devises

Un sélecteur « Devise » est visible dans la barre supérieure. Il permet le mode automatique ou un choix manuel, notamment FCFA, EUR, USD, CAD, CNY, NGN, RUB et SAR.

| Langue | Devise automatique retenue |
| --- | --- |
| Français | EUR — France |
| Anglais | USD — États-Unis |
| Espagnol | EUR — Espagne |
| Allemand | EUR — Allemagne |
| Italien | EUR — Italie |
| Mandarin | CNY — Chine |
| Arabe | SAR — Arabie saoudite |
| Russe | RUB — Russie |

Une langue pouvant concerner plusieurs pays, ces valeurs sont des choix par défaut. Changer de langue rétablit le mode automatique ; le sélecteur permet ensuite de choisir une autre devise. Les montants sont affichés selon le format de la langue sélectionnée.

La comptabilité reste en XAF. Le montant exact facturé en XAF est indiqué dans le paiement ; les autres devises sont des conversions d’affichage selon les taux disponibles, et non une promesse de règlement dans cette devise.

## Vérifications

- 35/35 vérifications ciblées : sessions de paiement, absence de coordonnées du propriétaire, rejet des données de carte locales, montant calculé côté serveur, protection contre les doublons, refus des notifications non vérifiées, notifications internes et devises.
- 28/28 vérifications de l’adaptateur PayDunya.
- Vérification visuelle des fenêtres carte et mobile money et du changement automatique vers USD en anglais.

Ces essais utilisent une base copiée et un prestataire simulé : aucun prélèvement réel ni email réel n’a été envoyé. Ils ne remplacent pas un essai du futur compte marchand.
