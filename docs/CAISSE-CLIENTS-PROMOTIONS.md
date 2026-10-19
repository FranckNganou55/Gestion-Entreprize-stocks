# Clients et codes promo dans le panier

Dans **Caisse → Panier**, le bouton **Ajouter un client** ouvre le formulaire nom, téléphone, email et adresse. Après création, le client est sélectionné automatiquement et les articles du panier sont conservés. Cette création est accessible aux utilisateurs autorisés à utiliser la caisse.

Dans **Clients → Codes promo clients**, l’administrateur de l’entreprise peut créer un code, le désactiver ou le réactiver. Il choisit une remise en pourcentage ou un montant fixe en FCFA, éventuellement un bénéficiaire, des dates de validité, un minimum de panier et une limite globale d’utilisations. Les dates de fin sont inclusives. Le code est ensuite à communiquer au client.

La caissière sélectionne le client, ajoute les articles et saisit le code dans **Code promo du client**, puis clique sur **Vérifier le code promo**. Un code valide affiche le pourcentage ou le montant et la remise calculée ; le total à encaisser est mis à jour. Un code invalide indique la raison du refus. Il faut le retirer ou le vérifier avec succès pour poursuivre.

Une modification du montant du panier ou du client exige une nouvelle vérification. La remise est recalculée côté serveur au moment de la vente : le montant fourni par le navigateur ne fait pas foi. Le code ne se cumule pas avec une remise manuelle. Son utilisation est enregistrée dans la même transaction que la vente, avec sa remise et sa référence dans la note de vente. Une annulation ultérieure ne rétablit pas automatiquement une utilisation.

Ces promotions sont propres à chaque entreprise et distinctes des réductions d’abonnement de la plateforme. Les caissières peuvent vérifier les codes ; leur création et leur activation sont réservées à l’administrateur.

## Vérification

`npm run test:caisse` : **24/24 vérifications réussies**, sur copie de la base. Création client en caisse, droits, cloisonnement des entreprises, remise fixe/pourcentage, bénéficiaire, expiration, désactivation, minimum, limite d’utilisation, refus du cumul, application réelle sur une vente et mise à jour de l’interface sont vérifiés. Le parcours administrateur puis vérification d’un code a également été essayé dans le navigateur, sur la base de test.
