
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `abonnements` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `statut` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (_utf8mb4'essai'),
  `plan` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `montant` double NOT NULL DEFAULT (0),
  `date_debut` date NOT NULL DEFAULT (curdate()),
  `date_fin` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `reference` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `maj_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `entreprise_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_copie_0` (`entreprise_id`),
  CONSTRAINT `fk_copie_0` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `candidats` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `entreprise_id` bigint DEFAULT NULL,
  `nom` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `poste_vise` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `magasin_id` bigint DEFAULT NULL,
  `telephone` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `email` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `ville` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `date_naissance` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `date_candidature` date NOT NULL DEFAULT (curdate()),
  `source` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `experience_annees` bigint DEFAULT (0),
  `formation` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `statut` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (_utf8mb4'recu'),
  `date_entretien` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `salaire_propose` double DEFAULT (0),
  `motif` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `employe_id` bigint DEFAULT NULL,
  `notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_candidats_0` (`entreprise_id`,`statut`),
  KEY `idx_candidats_1` (`entreprise_id`),
  KEY `fk_copie_1` (`employe_id`),
  KEY `fk_copie_2` (`magasin_id`),
  CONSTRAINT `fk_copie_1` FOREIGN KEY (`employe_id`) REFERENCES `employes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_copie_2` FOREIGN KEY (`magasin_id`) REFERENCES `magasins` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_copie_3` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `entreprise_id` bigint DEFAULT NULL,
  `nom` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `couleur` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_categories_0` (`entreprise_id`,`nom`),
  CONSTRAINT `fk_copie_4` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clients` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `nom` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `telephone` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `email` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `adresse` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `ville` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `type` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT (_utf8mb4'particulier'),
  `points` bigint NOT NULL DEFAULT (0),
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `entreprise_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_clients_0` (`entreprise_id`,`code`),
  CONSTRAINT `fk_copie_5` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codes_verification` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `code` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `jeton` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expire_at` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `utilise_at` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_codes_verification_0` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commandes_achat` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `reference` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `fournisseur_id` bigint NOT NULL,
  `magasin_id` bigint NOT NULL,
  `statut` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (_utf8mb4'brouillon'),
  `total` double NOT NULL DEFAULT (0),
  `note` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `user_id` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reception_at` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_commandes_achat_0` (`reference`),
  KEY `fk_copie_6` (`user_id`),
  KEY `fk_copie_7` (`magasin_id`),
  KEY `fk_copie_8` (`fournisseur_id`),
  CONSTRAINT `fk_copie_6` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_copie_7` FOREIGN KEY (`magasin_id`) REFERENCES `magasins` (`id`),
  CONSTRAINT `fk_copie_8` FOREIGN KEY (`fournisseur_id`) REFERENCES `fournisseurs` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commandes_achat_lignes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `commande_id` bigint NOT NULL,
  `produit_id` bigint NOT NULL,
  `quantite` double NOT NULL,
  `prix_unitaire` double NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_copie_9` (`produit_id`),
  KEY `fk_copie_10` (`commande_id`),
  CONSTRAINT `fk_copie_10` FOREIGN KEY (`commande_id`) REFERENCES `commandes_achat` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_copie_9` FOREIGN KEY (`produit_id`) REFERENCES `produits` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents_candidat` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `entreprise_id` bigint DEFAULT NULL,
  `candidat_id` bigint NOT NULL,
  `categorie` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (_utf8mb4'autre'),
  `nom_original` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `nom_stocke` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `type_mime` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (_utf8mb4'application/pdf'),
  `taille` bigint NOT NULL DEFAULT (0),
  `televerse_par` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_copie_11` (`televerse_par`),
  KEY `fk_copie_12` (`candidat_id`),
  KEY `fk_copie_13` (`entreprise_id`),
  CONSTRAINT `fk_copie_11` FOREIGN KEY (`televerse_par`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_copie_12` FOREIGN KEY (`candidat_id`) REFERENCES `candidats` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_copie_13` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents_employe` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `entreprise_id` bigint DEFAULT NULL,
  `employe_id` bigint NOT NULL,
  `categorie` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (_utf8mb4'autre'),
  `nom_original` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `nom_stocke` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `type_mime` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (_utf8mb4'application/pdf'),
  `taille` bigint NOT NULL DEFAULT (0),
  `date_document` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `televerse_par` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_documents_employe_0` (`employe_id`),
  KEY `idx_documents_employe_1` (`entreprise_id`),
  KEY `fk_copie_14` (`televerse_par`),
  CONSTRAINT `fk_copie_14` FOREIGN KEY (`televerse_par`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_copie_15` FOREIGN KEY (`employe_id`) REFERENCES `employes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_copie_16` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `nom` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `poste` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `magasin_id` bigint DEFAULT NULL,
  `telephone` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `email` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `date_embauche` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `type_contrat` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT (_utf8mb4'CDI'),
  `salaire` double DEFAULT (0),
  `actif` bigint NOT NULL DEFAULT (1),
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `civilite` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT (_utf8mb4'M.'),
  `date_naissance` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `lieu_naissance` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `sexe` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `situation_matrimoniale` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `adresse` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `ville` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `numero_cni` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `numero_cnps` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `numero_ifu` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `contact_urgence_nom` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `contact_urgence_tel` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `formation` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `date_fin_contrat` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `date_sortie` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `motif_sortie` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `statut_dossier` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (_utf8mb4'complet'),
  `entreprise_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_employes_1` (`entreprise_id`,`code`),
  KEY `idx_employes_0` (`entreprise_id`),
  CONSTRAINT `fk_copie_17` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `entreprises` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nom` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `email` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `nom_contact` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `prenom_contact` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `telephone` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `ville` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `pays` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT (_utf8mb4'Cameroun'),
  `date_creation` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `niu` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `logo` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `statut` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (_utf8mb4'actif'),
  `notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `formules` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `libelle` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `duree_jours` bigint NOT NULL,
  `montant` double NOT NULL,
  `actif` bigint NOT NULL DEFAULT (1),
  `ordre` bigint NOT NULL DEFAULT (0),
  `note` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `cree_par` bigint DEFAULT NULL,
  `cree_le` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `maj_le` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_formules_0` (`code`),
  KEY `fk_copie_18` (`cree_par`),
  CONSTRAINT `fk_copie_18` FOREIGN KEY (`cree_par`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fournisseurs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `nom` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `contact` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `telephone` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `email` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `adresse` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `ville` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `categorie` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `entreprise_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_fournisseurs_0` (`entreprise_id`,`code`),
  CONSTRAINT `fk_copie_19` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventaires` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `entreprise_id` bigint DEFAULT NULL,
  `magasin_id` bigint DEFAULT NULL,
  `libelle` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `statut` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (_utf8mb4'brouillon'),
  `commentaire` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `cree_par` bigint DEFAULT NULL,
  `cloture_par` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cloture_at` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`id`),
  KEY `fk_copie_20` (`cloture_par`),
  KEY `fk_copie_21` (`cree_par`),
  KEY `fk_copie_22` (`magasin_id`),
  KEY `fk_copie_23` (`entreprise_id`),
  CONSTRAINT `fk_copie_20` FOREIGN KEY (`cloture_par`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_copie_21` FOREIGN KEY (`cree_par`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_copie_22` FOREIGN KEY (`magasin_id`) REFERENCES `magasins` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_copie_23` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventaires_lignes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `inventaire_id` bigint NOT NULL,
  `produit_id` bigint NOT NULL,
  `magasin_id` bigint DEFAULT NULL,
  `quantite_theorique` double NOT NULL DEFAULT (0),
  `quantite_calculee` double NOT NULL DEFAULT (0),
  `quantite_comptee` double DEFAULT NULL,
  `prix_achat` double NOT NULL DEFAULT (0),
  `prix_vente` double NOT NULL DEFAULT (0),
  `compte_par` bigint DEFAULT NULL,
  `note` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `maj_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_inventaires_lignes_0` (`inventaire_id`,`produit_id`,`magasin_id`),
  KEY `fk_copie_24` (`compte_par`),
  KEY `fk_copie_25` (`magasin_id`),
  KEY `fk_copie_26` (`produit_id`),
  CONSTRAINT `fk_copie_24` FOREIGN KEY (`compte_par`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_copie_25` FOREIGN KEY (`magasin_id`) REFERENCES `magasins` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_copie_26` FOREIGN KEY (`produit_id`) REFERENCES `produits` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_copie_27` FOREIGN KEY (`inventaire_id`) REFERENCES `inventaires` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `journal_evenements` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `entreprise_id` bigint NOT NULL,
  `magasin_id` bigint DEFAULT NULL,
  `type` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `libelle` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `montant` double DEFAULT NULL,
  `reference` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `user_id` bigint DEFAULT NULL,
  `auteur` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_journal_evenements_0` (`created_at`),
  KEY `idx_journal_evenements_1` (`entreprise_id`,`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `magasins` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `entreprise_id` bigint DEFAULT NULL,
  `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `nom` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `ville` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `adresse` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `telephone` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `responsable` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `actif` bigint NOT NULL DEFAULT (1),
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `type` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (_utf8mb4'boutique'),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_magasins_1` (`entreprise_id`,`code`),
  KEY `idx_magasins_0` (`entreprise_id`),
  CONSTRAINT `fk_copie_28` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mails_envoyes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `entreprise_id` bigint DEFAULT NULL,
  `destinataire` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `destinataire_nom` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `sujet` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `corps_html` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `corps_texte` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `langue` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT (_utf8mb4'fr'),
  `type` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `statut` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (_utf8mb4'en_attente'),
  `erreur` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `smtp_utilise` bigint DEFAULT (0),
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `envoye_at` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`id`),
  KEY `idx_mails_envoyes_0` (`statut`,`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `de_user_id` bigint DEFAULT NULL,
  `de_nom` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `de_email` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `a_user_id` bigint DEFAULT NULL,
  `a_nom` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `a_email` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `entreprise_id` bigint DEFAULT NULL,
  `objet` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `corps` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `lu` bigint NOT NULL DEFAULT (0),
  `lu_at` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_copie_29` (`a_user_id`),
  KEY `fk_copie_30` (`de_user_id`),
  CONSTRAINT `fk_copie_29` FOREIGN KEY (`a_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_copie_30` FOREIGN KEY (`de_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mouvements_stock` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `produit_id` bigint NOT NULL,
  `magasin_id` bigint NOT NULL,
  `type` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `quantite` double NOT NULL,
  `quantite_avant` double DEFAULT (0),
  `quantite_apres` double DEFAULT (0),
  `motif` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `reference` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `user_id` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mouvements_stock_0` (`produit_id`,`magasin_id`),
  KEY `fk_copie_31` (`user_id`),
  KEY `fk_copie_32` (`magasin_id`),
  CONSTRAINT `fk_copie_31` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_copie_32` FOREIGN KEY (`magasin_id`) REFERENCES `magasins` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_copie_33` FOREIGN KEY (`produit_id`) REFERENCES `produits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `paiements_abonnement` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `reference` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `service` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `numero_paiement` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `telephone_payeur` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `nom_payeur` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `plan` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `montant` double NOT NULL,
  `duree_jours` bigint NOT NULL,
  `statut` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (_utf8mb4'en_attente'),
  `message` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `user_id` bigint DEFAULT NULL,
  `valide_par` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `traite_at` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `entreprise_id` bigint DEFAULT NULL,
  `psp` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT (_utf8mb4'manuel'),
  `psp_mode` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `psp_reference` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `psp_ticket` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `psp_statut` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `psp_url` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `psp_brut` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `montant_brut` double DEFAULT NULL,
  `reduction_id` bigint DEFAULT NULL,
  `code_reduction` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `carte_titulaire` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `carte_numero_masque` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `carte_expiration` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_paiements_abonnement_0` (`reference`),
  KEY `fk_copie_34` (`entreprise_id`),
  KEY `fk_copie_35` (`valide_par`),
  KEY `fk_copie_36` (`user_id`),
  CONSTRAINT `fk_copie_34` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_copie_35` FOREIGN KEY (`valide_par`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_copie_36` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parametres` (
  `entreprise_id` bigint NOT NULL DEFAULT (0),
  `cle` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `valeur` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`entreprise_id`,`cle`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `produits` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `code_barres` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `nom` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `categorie_id` bigint DEFAULT NULL,
  `unite` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT (_utf8mb4'pièce'),
  `prix_achat` double NOT NULL DEFAULT (0),
  `prix_vente` double NOT NULL DEFAULT (0),
  `tva` double NOT NULL DEFAULT (19.25),
  `seuil_alerte` bigint NOT NULL DEFAULT (5),
  `actif` bigint NOT NULL DEFAULT (1),
  `image` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `entreprise_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_produits_1` (`entreprise_id`,`code`),
  KEY `idx_produits_0` (`entreprise_id`),
  CONSTRAINT `fk_copie_37` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promotions_clients` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `entreprise_id` bigint NOT NULL,
  `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `type` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `valeur` double NOT NULL,
  `client_id` bigint DEFAULT NULL,
  `debut` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `fin` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `minimum` double NOT NULL DEFAULT (0),
  `maximum_usages` bigint DEFAULT NULL,
  `utilisations` bigint NOT NULL DEFAULT (0),
  `actif` bigint NOT NULL DEFAULT (1),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_promotions_clients_0` (`entreprise_id`,`code`),
  KEY `fk_copie_38` (`client_id`),
  CONSTRAINT `fk_copie_38` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`),
  CONSTRAINT `fk_copie_39` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promotions_utilisations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `promotion_id` bigint NOT NULL,
  `vente_id` bigint NOT NULL,
  `remise` double NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_promotions_utilisations_0` (`vente_id`),
  KEY `fk_copie_41` (`promotion_id`),
  CONSTRAINT `fk_copie_40` FOREIGN KEY (`vente_id`) REFERENCES `ventes` (`id`),
  CONSTRAINT `fk_copie_41` FOREIGN KEY (`promotion_id`) REFERENCES `promotions_clients` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reductions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `libelle` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `type` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (_utf8mb4'pourcentage'),
  `valeur` double NOT NULL,
  `formule_code` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `max_utilisations` bigint DEFAULT NULL,
  `utilisations` bigint NOT NULL DEFAULT (0),
  `actif` bigint NOT NULL DEFAULT (1),
  `debut` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `fin` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `note` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `cree_par` bigint DEFAULT NULL,
  `cree_le` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_reductions_0` (`code`),
  KEY `fk_copie_42` (`cree_par`),
  CONSTRAINT `fk_copie_42` FOREIGN KEY (`cree_par`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `nom` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (_utf8mb4'[]'),
  `portee` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (_utf8mb4'magasin'),
  `systeme` bigint NOT NULL DEFAULT (0),
  `attribuable_boutique` bigint NOT NULL DEFAULT (0),
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_roles_0` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salaires` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `entreprise_id` bigint DEFAULT NULL,
  `employe_id` bigint NOT NULL,
  `periode` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `montant` double NOT NULL DEFAULT (0),
  `primes` double NOT NULL DEFAULT (0),
  `retenues` double NOT NULL DEFAULT (0),
  `net` double NOT NULL DEFAULT (0),
  `date_paiement` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `statut` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (_utf8mb4'a_payer'),
  `mode_paiement` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `reference` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `saisi_par` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_salaires_2` (`employe_id`,`periode`),
  KEY `idx_salaires_0` (`employe_id`,`periode`),
  KEY `idx_salaires_1` (`entreprise_id`),
  KEY `fk_copie_43` (`saisi_par`),
  CONSTRAINT `fk_copie_43` FOREIGN KEY (`saisi_par`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_copie_44` FOREIGN KEY (`employe_id`) REFERENCES `employes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_copie_45` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stocks` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `produit_id` bigint NOT NULL,
  `magasin_id` bigint NOT NULL,
  `quantite` double NOT NULL DEFAULT (0),
  `maj_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_stocks_1` (`produit_id`,`magasin_id`),
  KEY `idx_stocks_0` (`magasin_id`),
  CONSTRAINT `fk_copie_46` FOREIGN KEY (`magasin_id`) REFERENCES `magasins` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_copie_47` FOREIGN KEY (`produit_id`) REFERENCES `produits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transferts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `reference` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `magasin_source_id` bigint NOT NULL,
  `magasin_dest_id` bigint NOT NULL,
  `produit_id` bigint NOT NULL,
  `quantite` double NOT NULL,
  `statut` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (_utf8mb4'en_attente'),
  `note` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `user_id` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `valide_at` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_transferts_0` (`reference`),
  KEY `fk_copie_48` (`user_id`),
  KEY `fk_copie_49` (`produit_id`),
  KEY `fk_copie_50` (`magasin_dest_id`),
  KEY `fk_copie_51` (`magasin_source_id`),
  CONSTRAINT `fk_copie_48` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_copie_49` FOREIGN KEY (`produit_id`) REFERENCES `produits` (`id`),
  CONSTRAINT `fk_copie_50` FOREIGN KEY (`magasin_dest_id`) REFERENCES `magasins` (`id`),
  CONSTRAINT `fk_copie_51` FOREIGN KEY (`magasin_source_id`) REFERENCES `magasins` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nom` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `mot_de_passe` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `role` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (_utf8mb4'caissier'),
  `magasin_id` bigint DEFAULT NULL,
  `actif` bigint NOT NULL DEFAULT (1),
  `dernier_login` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `cree_par` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `permissions_extra` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (_utf8mb4'[]'),
  `permissions_retirees` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (_utf8mb4'[]'),
  `entreprise_id` bigint DEFAULT NULL,
  `email_verifie` bigint NOT NULL DEFAULT (0),
  `email_verifie_at` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `langue` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (_utf8mb4'fr'),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_1` (`email`),
  KEY `idx_users_0` (`entreprise_id`),
  KEY `fk_copie_53` (`cree_par`),
  KEY `fk_copie_54` (`magasin_id`),
  CONSTRAINT `fk_copie_52` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_copie_53` FOREIGN KEY (`cree_par`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_copie_54` FOREIGN KEY (`magasin_id`) REFERENCES `magasins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ventes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `reference` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `magasin_id` bigint NOT NULL,
  `client_id` bigint DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `sous_total` double NOT NULL DEFAULT (0),
  `remise` double NOT NULL DEFAULT (0),
  `tva` double NOT NULL DEFAULT (0),
  `total` double NOT NULL DEFAULT (0),
  `mode_paiement` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (_utf8mb4'especes'),
  `montant_paye` double NOT NULL DEFAULT (0),
  `monnaie` double NOT NULL DEFAULT (0),
  `statut` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (_utf8mb4'payee'),
  `note` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_ventes_2` (`reference`),
  KEY `idx_ventes_0` (`magasin_id`),
  KEY `idx_ventes_1` (`created_at`),
  KEY `fk_copie_55` (`user_id`),
  KEY `fk_copie_56` (`client_id`),
  CONSTRAINT `fk_copie_55` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_copie_56` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_copie_57` FOREIGN KEY (`magasin_id`) REFERENCES `magasins` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ventes_lignes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `vente_id` bigint NOT NULL,
  `produit_id` bigint DEFAULT NULL,
  `nom_produit` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `quantite` double NOT NULL,
  `prix_unitaire` double NOT NULL,
  `remise` double NOT NULL DEFAULT (0),
  `total` double NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ventes_lignes_0` (`vente_id`),
  KEY `fk_copie_58` (`produit_id`),
  CONSTRAINT `fk_copie_58` FOREIGN KEY (`produit_id`) REFERENCES `produits` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_copie_59` FOREIGN KEY (`vente_id`) REFERENCES `ventes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
