CREATE TABLE "abonnements" (
	"id" serial PRIMARY KEY,
	"entreprise_id" integer,
	"statut" text DEFAULT 'essai' NOT NULL,
	"plan" text,
	"montant" double precision DEFAULT 0 NOT NULL,
	"date_debut" text DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD') NOT NULL,
	"date_fin" text NOT NULL,
	"reference" text,
	"maj_at" text DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidats" (
	"id" serial PRIMARY KEY,
	"entreprise_id" integer,
	"nom" text NOT NULL,
	"poste_vise" text,
	"magasin_id" integer,
	"telephone" text,
	"email" text,
	"ville" text,
	"date_naissance" text,
	"date_candidature" text DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD') NOT NULL,
	"source" text,
	"experience_annees" integer DEFAULT 0,
	"formation" text,
	"statut" text DEFAULT 'recu' NOT NULL,
	"date_entretien" text,
	"salaire_propose" double precision DEFAULT 0,
	"motif" text,
	"employe_id" integer,
	"notes" text,
	"created_at" text DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"entreprise_id" integer,
	"id" serial PRIMARY KEY,
	"nom" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"entreprise_id" integer,
	"id" serial PRIMARY KEY,
	"code" text,
	"nom" text NOT NULL,
	"telephone" text,
	"email" text,
	"adresse" text,
	"ville" text,
	"type" text DEFAULT 'particulier',
	"points" integer DEFAULT 0 NOT NULL,
	"created_at" text DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "codes_verification" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"code" text NOT NULL,
	"jeton" text NOT NULL,
	"expire_at" text NOT NULL,
	"utilise_at" text,
	"created_at" text DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commandes_achat" (
	"id" serial PRIMARY KEY,
	"reference" text NOT NULL,
	"fournisseur_id" integer NOT NULL,
	"magasin_id" integer NOT NULL,
	"statut" text DEFAULT 'brouillon' NOT NULL,
	"total" double precision DEFAULT 0 NOT NULL,
	"note" text,
	"user_id" integer,
	"created_at" text DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS') NOT NULL,
	"reception_at" text
);
--> statement-breakpoint
CREATE TABLE "commandes_achat_lignes" (
	"id" serial PRIMARY KEY,
	"commande_id" integer NOT NULL,
	"produit_id" integer NOT NULL,
	"quantite" double precision NOT NULL,
	"prix_unitaire" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents_candidat" (
	"id" serial PRIMARY KEY,
	"entreprise_id" integer,
	"candidat_id" integer NOT NULL,
	"categorie" text DEFAULT 'autre' NOT NULL,
	"nom_original" text NOT NULL,
	"nom_stocke" text NOT NULL,
	"type_mime" text DEFAULT 'application/pdf' NOT NULL,
	"taille" integer DEFAULT 0 NOT NULL,
	"televerse_par" integer,
	"created_at" text DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents_employe" (
	"id" serial PRIMARY KEY,
	"entreprise_id" integer,
	"employe_id" integer NOT NULL,
	"categorie" text DEFAULT 'autre' NOT NULL,
	"nom_original" text NOT NULL,
	"nom_stocke" text NOT NULL,
	"type_mime" text DEFAULT 'application/pdf' NOT NULL,
	"taille" integer DEFAULT 0 NOT NULL,
	"date_document" text,
	"televerse_par" integer,
	"created_at" text DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employes" (
	"id" serial PRIMARY KEY,
	"code" text,
	"nom" text NOT NULL,
	"poste" text,
	"magasin_id" integer,
	"telephone" text,
	"email" text,
	"date_embauche" text,
	"type_contrat" text DEFAULT 'CDI',
	"salaire" double precision DEFAULT 0,
	"actif" integer DEFAULT 1 NOT NULL,
	"created_at" text DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS') NOT NULL,
	"civilite" text DEFAULT 'M.',
	"date_naissance" text,
	"lieu_naissance" text,
	"sexe" text,
	"situation_matrimoniale" text,
	"adresse" text,
	"ville" text,
	"numero_cni" text,
	"numero_cnps" text,
	"numero_ifu" text,
	"contact_urgence_nom" text,
	"contact_urgence_tel" text,
	"formation" text,
	"date_fin_contrat" text,
	"date_sortie" text,
	"motif_sortie" text,
	"notes" text,
	"statut_dossier" text DEFAULT 'complet' NOT NULL,
	"entreprise_id" integer
);
--> statement-breakpoint
CREATE TABLE "entreprises" (
	"id" serial PRIMARY KEY,
	"nom" text NOT NULL,
	"email" text NOT NULL,
	"nom_contact" text,
	"prenom_contact" text,
	"telephone" text,
	"ville" text,
	"pays" text DEFAULT 'Cameroun',
	"date_creation" text,
	"niu" text,
	"logo" text,
	"statut" text DEFAULT 'actif' NOT NULL,
	"notes" text,
	"created_at" text DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "formules" (
	"id" serial PRIMARY KEY,
	"code" text NOT NULL,
	"libelle" text NOT NULL,
	"duree_jours" integer NOT NULL,
	"montant" double precision NOT NULL,
	"actif" integer DEFAULT 1 NOT NULL,
	"ordre" integer DEFAULT 0 NOT NULL,
	"note" text,
	"cree_par" integer,
	"cree_le" text DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS') NOT NULL,
	"maj_le" text
);
--> statement-breakpoint
CREATE TABLE "fournisseurs" (
	"entreprise_id" integer,
	"id" serial PRIMARY KEY,
	"code" text,
	"nom" text NOT NULL,
	"contact" text,
	"telephone" text,
	"email" text,
	"adresse" text,
	"ville" text,
	"categorie" text,
	"created_at" text DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventaires" (
	"id" serial PRIMARY KEY,
	"entreprise_id" integer,
	"magasin_id" integer,
	"libelle" text NOT NULL,
	"statut" text DEFAULT 'brouillon' NOT NULL,
	"commentaire" text,
	"cree_par" integer,
	"cloture_par" integer,
	"created_at" text DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS') NOT NULL,
	"cloture_at" text
);
--> statement-breakpoint
CREATE TABLE "inventaires_lignes" (
	"id" serial PRIMARY KEY,
	"inventaire_id" integer NOT NULL,
	"produit_id" integer NOT NULL,
	"magasin_id" integer,
	"quantite_theorique" double precision DEFAULT 0 NOT NULL,
	"quantite_calculee" double precision DEFAULT 0 NOT NULL,
	"quantite_comptee" double precision,
	"prix_achat" double precision DEFAULT 0 NOT NULL,
	"prix_vente" double precision DEFAULT 0 NOT NULL,
	"compte_par" integer,
	"note" text,
	"maj_at" text DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_evenements" (
	"id" serial PRIMARY KEY,
	"entreprise_id" integer NOT NULL,
	"magasin_id" integer,
	"type" text NOT NULL,
	"libelle" text,
	"montant" double precision,
	"reference" text,
	"user_id" integer,
	"auteur" text,
	"created_at" text DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "magasins" (
	"id" serial PRIMARY KEY,
	"entreprise_id" integer,
	"code" text NOT NULL,
	"nom" text NOT NULL,
	"ville" text,
	"adresse" text,
	"telephone" text,
	"responsable" text,
	"actif" integer DEFAULT 1 NOT NULL,
	"created_at" text DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS') NOT NULL,
	"type" text DEFAULT 'boutique' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mails_envoyes" (
	"id" serial PRIMARY KEY,
	"entreprise_id" integer,
	"destinataire" text NOT NULL,
	"destinataire_nom" text,
	"sujet" text NOT NULL,
	"corps_html" text,
	"corps_texte" text,
	"langue" text DEFAULT 'fr',
	"type" text,
	"statut" text DEFAULT 'en_attente' NOT NULL,
	"erreur" text,
	"smtp_utilise" integer DEFAULT 0,
	"created_at" text DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS') NOT NULL,
	"envoye_at" text
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY,
	"de_user_id" integer,
	"de_nom" text,
	"de_email" text,
	"a_user_id" integer,
	"a_nom" text,
	"a_email" text,
	"entreprise_id" integer,
	"objet" text NOT NULL,
	"corps" text NOT NULL,
	"lu" integer DEFAULT 0 NOT NULL,
	"lu_at" text,
	"created_at" text DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mouvements_stock" (
	"id" serial PRIMARY KEY,
	"produit_id" integer NOT NULL,
	"magasin_id" integer NOT NULL,
	"type" text NOT NULL,
	"quantite" double precision NOT NULL,
	"quantite_avant" double precision DEFAULT 0,
	"quantite_apres" double precision DEFAULT 0,
	"motif" text,
	"reference" text,
	"user_id" integer,
	"created_at" text DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paiements_abonnement" (
	"id" serial PRIMARY KEY,
	"entreprise_id" integer,
	"reference" text NOT NULL,
	"service" text NOT NULL,
	"numero_paiement" text NOT NULL,
	"telephone_payeur" text,
	"nom_payeur" text,
	"plan" text NOT NULL,
	"montant" double precision NOT NULL,
	"duree_jours" integer NOT NULL,
	"statut" text DEFAULT 'en_attente' NOT NULL,
	"message" text,
	"user_id" integer,
	"valide_par" integer,
	"created_at" text DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS') NOT NULL,
	"traite_at" text,
	"psp" text DEFAULT 'manuel',
	"psp_mode" text,
	"psp_reference" text,
	"psp_ticket" text,
	"psp_statut" text,
	"psp_url" text,
	"psp_brut" text,
	"montant_brut" double precision,
	"reduction_id" integer,
	"code_reduction" text,
	"carte_titulaire" text,
	"carte_numero_masque" text,
	"carte_expiration" text
);
--> statement-breakpoint
CREATE TABLE "parametres" (
	"entreprise_id" integer DEFAULT 0,
	"cle" text,
	"valeur" text,
	CONSTRAINT "parametres_pkey" PRIMARY KEY("entreprise_id","cle")
);
--> statement-breakpoint
CREATE TABLE "private_settings" (
	"cle" text PRIMARY KEY,
	"valeur" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "produits" (
	"entreprise_id" integer,
	"id" serial PRIMARY KEY,
	"code" text NOT NULL,
	"code_barres" text,
	"nom" text NOT NULL,
	"categorie_id" integer,
	"unite" text DEFAULT 'pièce',
	"prix_achat" double precision DEFAULT 0 NOT NULL,
	"prix_vente" double precision DEFAULT 0 NOT NULL,
	"tva" double precision DEFAULT 19.25 NOT NULL,
	"seuil_alerte" integer DEFAULT 5 NOT NULL,
	"actif" integer DEFAULT 1 NOT NULL,
	"image" text,
	"created_at" text DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotions_clients" (
	"id" serial PRIMARY KEY,
	"entreprise_id" integer NOT NULL,
	"code" text NOT NULL,
	"type" text NOT NULL,
	"valeur" double precision NOT NULL,
	"client_id" integer,
	"debut" text,
	"fin" text,
	"minimum" double precision DEFAULT 0 NOT NULL,
	"maximum_usages" integer,
	"utilisations" integer DEFAULT 0 NOT NULL,
	"actif" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotions_utilisations" (
	"id" serial PRIMARY KEY,
	"promotion_id" integer NOT NULL,
	"vente_id" integer NOT NULL,
	"remise" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reductions" (
	"id" serial PRIMARY KEY,
	"code" text NOT NULL,
	"libelle" text,
	"type" text DEFAULT 'pourcentage' NOT NULL,
	"valeur" double precision NOT NULL,
	"formule_code" text,
	"max_utilisations" integer,
	"utilisations" integer DEFAULT 0 NOT NULL,
	"actif" integer DEFAULT 1 NOT NULL,
	"debut" text,
	"fin" text,
	"note" text,
	"cree_par" integer,
	"cree_le" text DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY,
	"code" text NOT NULL,
	"nom" text NOT NULL,
	"description" text,
	"permissions" text DEFAULT '[]' NOT NULL,
	"portee" text DEFAULT 'magasin' NOT NULL,
	"systeme" integer DEFAULT 0 NOT NULL,
	"attribuable_boutique" integer DEFAULT 0 NOT NULL,
	"created_at" text DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salaires" (
	"id" serial PRIMARY KEY,
	"entreprise_id" integer,
	"employe_id" integer NOT NULL,
	"periode" text NOT NULL,
	"montant" double precision DEFAULT 0 NOT NULL,
	"primes" double precision DEFAULT 0 NOT NULL,
	"retenues" double precision DEFAULT 0 NOT NULL,
	"net" double precision DEFAULT 0 NOT NULL,
	"date_paiement" text,
	"statut" text DEFAULT 'a_payer' NOT NULL,
	"mode_paiement" text,
	"reference" text,
	"notes" text,
	"saisi_par" integer,
	"created_at" text DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stocks" (
	"id" serial PRIMARY KEY,
	"produit_id" integer NOT NULL,
	"magasin_id" integer NOT NULL,
	"quantite" double precision DEFAULT 0 NOT NULL,
	"maj_at" text DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transferts" (
	"id" serial PRIMARY KEY,
	"reference" text NOT NULL,
	"magasin_source_id" integer NOT NULL,
	"magasin_dest_id" integer NOT NULL,
	"produit_id" integer NOT NULL,
	"quantite" double precision NOT NULL,
	"statut" text DEFAULT 'en_attente' NOT NULL,
	"note" text,
	"user_id" integer,
	"created_at" text DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS') NOT NULL,
	"valide_at" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"entreprise_id" integer,
	"nom" text NOT NULL,
	"email" text NOT NULL,
	"mot_de_passe" text NOT NULL,
	"role" text DEFAULT 'caissier' NOT NULL,
	"magasin_id" integer,
	"actif" integer DEFAULT 1 NOT NULL,
	"dernier_login" text,
	"cree_par" integer,
	"created_at" text DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS') NOT NULL,
	"permissions_extra" text DEFAULT '[]' NOT NULL,
	"permissions_retirees" text DEFAULT '[]' NOT NULL,
	"email_verifie" integer DEFAULT 0 NOT NULL,
	"email_verifie_at" text,
	"langue" text DEFAULT 'fr' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ventes" (
	"id" serial PRIMARY KEY,
	"reference" text NOT NULL,
	"magasin_id" integer NOT NULL,
	"client_id" integer,
	"user_id" integer,
	"sous_total" double precision DEFAULT 0 NOT NULL,
	"remise" double precision DEFAULT 0 NOT NULL,
	"tva" double precision DEFAULT 0 NOT NULL,
	"total" double precision DEFAULT 0 NOT NULL,
	"mode_paiement" text DEFAULT 'especes' NOT NULL,
	"montant_paye" double precision DEFAULT 0 NOT NULL,
	"monnaie" double precision DEFAULT 0 NOT NULL,
	"statut" text DEFAULT 'payee' NOT NULL,
	"note" text,
	"created_at" text DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ventes_lignes" (
	"id" serial PRIMARY KEY,
	"vente_id" integer NOT NULL,
	"produit_id" integer,
	"nom_produit" text NOT NULL,
	"quantite" double precision NOT NULL,
	"prix_unitaire" double precision NOT NULL,
	"remise" double precision DEFAULT 0 NOT NULL,
	"total" double precision NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_candidats_statut" ON "candidats" ("entreprise_id","statut");--> statement-breakpoint
CREATE INDEX "idx_candidats_entreprise" ON "candidats" ("entreprise_id");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_entreprise_id_nom_unique" ON "categories" ("entreprise_id","nom");--> statement-breakpoint
CREATE UNIQUE INDEX "clients_entreprise_id_code_unique" ON "clients" ("entreprise_id","code");--> statement-breakpoint
CREATE INDEX "idx_codes_user" ON "codes_verification" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "commandes_achat_reference_unique" ON "commandes_achat" ("reference");--> statement-breakpoint
CREATE INDEX "idx_documents_employe" ON "documents_employe" ("employe_id");--> statement-breakpoint
CREATE INDEX "idx_documents_employe_entreprise" ON "documents_employe" ("entreprise_id");--> statement-breakpoint
CREATE UNIQUE INDEX "employes_entreprise_id_code_unique" ON "employes" ("entreprise_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "formules_code_unique" ON "formules" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "fournisseurs_entreprise_id_code_unique" ON "fournisseurs" ("entreprise_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "inventaires_lignes_inventaire_id_produit_id_magasin_id_unique" ON "inventaires_lignes" ("inventaire_id","produit_id","magasin_id");--> statement-breakpoint
CREATE INDEX "idx_journal_date" ON "journal_evenements" ("created_at");--> statement-breakpoint
CREATE INDEX "idx_journal_entreprise" ON "journal_evenements" ("entreprise_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "magasins_entreprise_id_code_unique" ON "magasins" ("entreprise_id","code");--> statement-breakpoint
CREATE INDEX "idx_mails_statut" ON "mails_envoyes" ("statut","id");--> statement-breakpoint
CREATE INDEX "idx_mvt_produit" ON "mouvements_stock" ("produit_id","magasin_id");--> statement-breakpoint
CREATE UNIQUE INDEX "paiements_abonnement_reference_unique" ON "paiements_abonnement" ("reference");--> statement-breakpoint
CREATE UNIQUE INDEX "produits_entreprise_id_code_unique" ON "produits" ("entreprise_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "promotions_clients_entreprise_id_code_unique" ON "promotions_clients" ("entreprise_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "promotions_utilisations_vente_id_unique" ON "promotions_utilisations" ("vente_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reductions_code_unique" ON "reductions" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_code_unique" ON "roles" ("code");--> statement-breakpoint
CREATE INDEX "idx_salaires_employe" ON "salaires" ("employe_id","periode");--> statement-breakpoint
CREATE INDEX "idx_salaires_entreprise" ON "salaires" ("entreprise_id");--> statement-breakpoint
CREATE UNIQUE INDEX "salaires_employe_id_periode_unique" ON "salaires" ("employe_id","periode");--> statement-breakpoint
CREATE INDEX "idx_stocks_magasin" ON "stocks" ("magasin_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stocks_produit_id_magasin_id_unique" ON "stocks" ("produit_id","magasin_id");--> statement-breakpoint
CREATE UNIQUE INDEX "transferts_reference_unique" ON "transferts" ("reference");--> statement-breakpoint
CREATE INDEX "idx_users_entreprise" ON "users" ("entreprise_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" ("email");--> statement-breakpoint
CREATE INDEX "idx_ventes_magasin" ON "ventes" ("magasin_id");--> statement-breakpoint
CREATE INDEX "idx_ventes_date" ON "ventes" ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ventes_reference_unique" ON "ventes" ("reference");--> statement-breakpoint
CREATE INDEX "idx_lignes_vente" ON "ventes_lignes" ("vente_id");--> statement-breakpoint
ALTER TABLE "abonnements" ADD CONSTRAINT "abonnements_entreprise_id_fk" FOREIGN KEY ("entreprise_id") REFERENCES "entreprises"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "candidats" ADD CONSTRAINT "candidats_employe_id_fk" FOREIGN KEY ("employe_id") REFERENCES "employes"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "candidats" ADD CONSTRAINT "candidats_magasin_id_fk" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "candidats" ADD CONSTRAINT "candidats_entreprise_id_fk" FOREIGN KEY ("entreprise_id") REFERENCES "entreprises"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_entreprise_id_fk" FOREIGN KEY ("entreprise_id") REFERENCES "entreprises"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_entreprise_id_fk" FOREIGN KEY ("entreprise_id") REFERENCES "entreprises"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commandes_achat" ADD CONSTRAINT "commandes_achat_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "commandes_achat" ADD CONSTRAINT "commandes_achat_magasin_id_fk" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id");--> statement-breakpoint
ALTER TABLE "commandes_achat" ADD CONSTRAINT "commandes_achat_fournisseur_id_fk" FOREIGN KEY ("fournisseur_id") REFERENCES "fournisseurs"("id");--> statement-breakpoint
ALTER TABLE "commandes_achat_lignes" ADD CONSTRAINT "commandes_achat_lignes_produit_id_fk" FOREIGN KEY ("produit_id") REFERENCES "produits"("id");--> statement-breakpoint
ALTER TABLE "commandes_achat_lignes" ADD CONSTRAINT "commandes_achat_lignes_commande_id_fk" FOREIGN KEY ("commande_id") REFERENCES "commandes_achat"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "documents_candidat" ADD CONSTRAINT "documents_candidat_televerse_par_fk" FOREIGN KEY ("televerse_par") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "documents_candidat" ADD CONSTRAINT "documents_candidat_candidat_id_fk" FOREIGN KEY ("candidat_id") REFERENCES "candidats"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "documents_candidat" ADD CONSTRAINT "documents_candidat_entreprise_id_fk" FOREIGN KEY ("entreprise_id") REFERENCES "entreprises"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "documents_employe" ADD CONSTRAINT "documents_employe_televerse_par_fk" FOREIGN KEY ("televerse_par") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "documents_employe" ADD CONSTRAINT "documents_employe_employe_id_fk" FOREIGN KEY ("employe_id") REFERENCES "employes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "documents_employe" ADD CONSTRAINT "documents_employe_entreprise_id_fk" FOREIGN KEY ("entreprise_id") REFERENCES "entreprises"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "employes" ADD CONSTRAINT "employes_entreprise_id_fk" FOREIGN KEY ("entreprise_id") REFERENCES "entreprises"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "formules" ADD CONSTRAINT "formules_cree_par_fk" FOREIGN KEY ("cree_par") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "fournisseurs" ADD CONSTRAINT "fournisseurs_entreprise_id_fk" FOREIGN KEY ("entreprise_id") REFERENCES "entreprises"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "inventaires" ADD CONSTRAINT "inventaires_cloture_par_fk" FOREIGN KEY ("cloture_par") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "inventaires" ADD CONSTRAINT "inventaires_cree_par_fk" FOREIGN KEY ("cree_par") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "inventaires" ADD CONSTRAINT "inventaires_magasin_id_fk" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "inventaires" ADD CONSTRAINT "inventaires_entreprise_id_fk" FOREIGN KEY ("entreprise_id") REFERENCES "entreprises"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "inventaires_lignes" ADD CONSTRAINT "inventaires_lignes_compte_par_fk" FOREIGN KEY ("compte_par") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "inventaires_lignes" ADD CONSTRAINT "inventaires_lignes_magasin_id_fk" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "inventaires_lignes" ADD CONSTRAINT "inventaires_lignes_produit_id_fk" FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "inventaires_lignes" ADD CONSTRAINT "inventaires_lignes_inventaire_id_fk" FOREIGN KEY ("inventaire_id") REFERENCES "inventaires"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "magasins" ADD CONSTRAINT "magasins_entreprise_id_fk" FOREIGN KEY ("entreprise_id") REFERENCES "entreprises"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_a_user_id_fk" FOREIGN KEY ("a_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_de_user_id_fk" FOREIGN KEY ("de_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "mouvements_stock" ADD CONSTRAINT "mouvements_stock_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "mouvements_stock" ADD CONSTRAINT "mouvements_stock_magasin_id_fk" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "mouvements_stock" ADD CONSTRAINT "mouvements_stock_produit_id_fk" FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "paiements_abonnement" ADD CONSTRAINT "paiements_abonnement_valide_par_fk" FOREIGN KEY ("valide_par") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "paiements_abonnement" ADD CONSTRAINT "paiements_abonnement_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "paiements_abonnement" ADD CONSTRAINT "paiements_abonnement_entreprise_id_fk" FOREIGN KEY ("entreprise_id") REFERENCES "entreprises"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "produits" ADD CONSTRAINT "produits_entreprise_id_fk" FOREIGN KEY ("entreprise_id") REFERENCES "entreprises"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "promotions_clients" ADD CONSTRAINT "promotions_clients_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "clients"("id");--> statement-breakpoint
ALTER TABLE "promotions_clients" ADD CONSTRAINT "promotions_clients_entreprise_id_fk" FOREIGN KEY ("entreprise_id") REFERENCES "entreprises"("id");--> statement-breakpoint
ALTER TABLE "promotions_utilisations" ADD CONSTRAINT "promotions_utilisations_vente_id_fk" FOREIGN KEY ("vente_id") REFERENCES "ventes"("id");--> statement-breakpoint
ALTER TABLE "promotions_utilisations" ADD CONSTRAINT "promotions_utilisations_promotion_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "promotions_clients"("id");--> statement-breakpoint
ALTER TABLE "reductions" ADD CONSTRAINT "reductions_cree_par_fk" FOREIGN KEY ("cree_par") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "salaires" ADD CONSTRAINT "salaires_saisi_par_fk" FOREIGN KEY ("saisi_par") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "salaires" ADD CONSTRAINT "salaires_employe_id_fk" FOREIGN KEY ("employe_id") REFERENCES "employes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "salaires" ADD CONSTRAINT "salaires_entreprise_id_fk" FOREIGN KEY ("entreprise_id") REFERENCES "entreprises"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_magasin_id_fk" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_produit_id_fk" FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "transferts" ADD CONSTRAINT "transferts_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "transferts" ADD CONSTRAINT "transferts_produit_id_fk" FOREIGN KEY ("produit_id") REFERENCES "produits"("id");--> statement-breakpoint
ALTER TABLE "transferts" ADD CONSTRAINT "transferts_magasin_dest_id_fk" FOREIGN KEY ("magasin_dest_id") REFERENCES "magasins"("id");--> statement-breakpoint
ALTER TABLE "transferts" ADD CONSTRAINT "transferts_magasin_source_id_fk" FOREIGN KEY ("magasin_source_id") REFERENCES "magasins"("id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_cree_par_fk" FOREIGN KEY ("cree_par") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_magasin_id_fk" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_entreprise_id_fk" FOREIGN KEY ("entreprise_id") REFERENCES "entreprises"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_magasin_id_fk" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ventes_lignes" ADD CONSTRAINT "ventes_lignes_produit_id_fk" FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "ventes_lignes" ADD CONSTRAINT "ventes_lignes_vente_id_fk" FOREIGN KEY ("vente_id") REFERENCES "ventes"("id") ON DELETE CASCADE;