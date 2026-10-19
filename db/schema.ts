import { sql } from 'drizzle-orm';
import { pgTable, serial, integer, doublePrecision, text, primaryKey, uniqueIndex, index, foreignKey, type AnyPgColumn } from 'drizzle-orm/pg-core';

export const abonnements = pgTable('abonnements', {
  id: serial('id').primaryKey(),
  entreprise_id: integer('entreprise_id'),
  statut: text('statut').notNull().default(sql`'essai'`),
  plan: text('plan'),
  montant: doublePrecision('montant').notNull().default(sql`0`),
  date_debut: text('date_debut').notNull().default(sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD')`),
  date_fin: text('date_fin').notNull(),
  reference: text('reference'),
  maj_at: text('maj_at').notNull().default(sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS')`),
}, (t) => [
  foreignKey({ columns: [t.entreprise_id], foreignColumns: [entreprises.id], name: 'abonnements_entreprise_id_fk' }).onDelete('cascade'),
]);

export const candidats = pgTable('candidats', {
  id: serial('id').primaryKey(),
  entreprise_id: integer('entreprise_id'),
  nom: text('nom').notNull(),
  poste_vise: text('poste_vise'),
  magasin_id: integer('magasin_id'),
  telephone: text('telephone'),
  email: text('email'),
  ville: text('ville'),
  date_naissance: text('date_naissance'),
  date_candidature: text('date_candidature').notNull().default(sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD')`),
  source: text('source'),
  experience_annees: integer('experience_annees').default(sql`0`),
  formation: text('formation'),
  statut: text('statut').notNull().default(sql`'recu'`),
  date_entretien: text('date_entretien'),
  salaire_propose: doublePrecision('salaire_propose').default(sql`0`),
  motif: text('motif'),
  employe_id: integer('employe_id'),
  notes: text('notes'),
  created_at: text('created_at').notNull().default(sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS')`),
}, (t) => [
  index('idx_candidats_statut').on(t.entreprise_id, t.statut),
  index('idx_candidats_entreprise').on(t.entreprise_id),
  foreignKey({ columns: [t.employe_id], foreignColumns: [employes.id], name: 'candidats_employe_id_fk' }).onDelete('set null'),
  foreignKey({ columns: [t.magasin_id], foreignColumns: [magasins.id], name: 'candidats_magasin_id_fk' }).onDelete('set null'),
  foreignKey({ columns: [t.entreprise_id], foreignColumns: [entreprises.id], name: 'candidats_entreprise_id_fk' }).onDelete('cascade'),
]);

export const categories = pgTable('categories', {
  entreprise_id: integer('entreprise_id'),
  id: serial('id').primaryKey(),
  nom: text('nom').notNull(),
  description: text('description'),
}, (t) => [
  uniqueIndex('categories_entreprise_id_nom_unique').on(t.entreprise_id, t.nom),
  foreignKey({ columns: [t.entreprise_id], foreignColumns: [entreprises.id], name: 'categories_entreprise_id_fk' }).onDelete('cascade'),
]);

export const clients = pgTable('clients', {
  entreprise_id: integer('entreprise_id'),
  id: serial('id').primaryKey(),
  code: text('code'),
  nom: text('nom').notNull(),
  telephone: text('telephone'),
  email: text('email'),
  adresse: text('adresse'),
  ville: text('ville'),
  type: text('type').default(sql`'particulier'`),
  points: integer('points').notNull().default(sql`0`),
  created_at: text('created_at').notNull().default(sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS')`),
}, (t) => [
  uniqueIndex('clients_entreprise_id_code_unique').on(t.entreprise_id, t.code),
  foreignKey({ columns: [t.entreprise_id], foreignColumns: [entreprises.id], name: 'clients_entreprise_id_fk' }).onDelete('cascade'),
]);

export const codes_verification = pgTable('codes_verification', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull(),
  code: text('code').notNull(),
  jeton: text('jeton').notNull(),
  expire_at: text('expire_at').notNull(),
  utilise_at: text('utilise_at'),
  created_at: text('created_at').notNull().default(sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS')`),
}, (t) => [
  index('idx_codes_user').on(t.user_id),
]);

export const commandes_achat = pgTable('commandes_achat', {
  id: serial('id').primaryKey(),
  reference: text('reference').notNull(),
  fournisseur_id: integer('fournisseur_id').notNull(),
  magasin_id: integer('magasin_id').notNull(),
  statut: text('statut').notNull().default(sql`'brouillon'`),
  total: doublePrecision('total').notNull().default(sql`0`),
  note: text('note'),
  user_id: integer('user_id'),
  created_at: text('created_at').notNull().default(sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS')`),
  reception_at: text('reception_at'),
}, (t) => [
  uniqueIndex('commandes_achat_reference_unique').on(t.reference),
  foreignKey({ columns: [t.user_id], foreignColumns: [users.id], name: 'commandes_achat_user_id_fk' }).onDelete('set null'),
  foreignKey({ columns: [t.magasin_id], foreignColumns: [magasins.id], name: 'commandes_achat_magasin_id_fk' }).onDelete('no action'),
  foreignKey({ columns: [t.fournisseur_id], foreignColumns: [fournisseurs.id], name: 'commandes_achat_fournisseur_id_fk' }).onDelete('no action'),
]);

export const commandes_achat_lignes = pgTable('commandes_achat_lignes', {
  id: serial('id').primaryKey(),
  commande_id: integer('commande_id').notNull(),
  produit_id: integer('produit_id').notNull(),
  quantite: doublePrecision('quantite').notNull(),
  prix_unitaire: doublePrecision('prix_unitaire').notNull(),
}, (t) => [
  foreignKey({ columns: [t.produit_id], foreignColumns: [produits.id], name: 'commandes_achat_lignes_produit_id_fk' }).onDelete('no action'),
  foreignKey({ columns: [t.commande_id], foreignColumns: [commandes_achat.id], name: 'commandes_achat_lignes_commande_id_fk' }).onDelete('cascade'),
]);

export const documents_candidat = pgTable('documents_candidat', {
  id: serial('id').primaryKey(),
  entreprise_id: integer('entreprise_id'),
  candidat_id: integer('candidat_id').notNull(),
  categorie: text('categorie').notNull().default(sql`'autre'`),
  nom_original: text('nom_original').notNull(),
  nom_stocke: text('nom_stocke').notNull(),
  type_mime: text('type_mime').notNull().default(sql`'application/pdf'`),
  taille: integer('taille').notNull().default(sql`0`),
  televerse_par: integer('televerse_par'),
  created_at: text('created_at').notNull().default(sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS')`),
}, (t) => [
  foreignKey({ columns: [t.televerse_par], foreignColumns: [users.id], name: 'documents_candidat_televerse_par_fk' }).onDelete('set null'),
  foreignKey({ columns: [t.candidat_id], foreignColumns: [candidats.id], name: 'documents_candidat_candidat_id_fk' }).onDelete('cascade'),
  foreignKey({ columns: [t.entreprise_id], foreignColumns: [entreprises.id], name: 'documents_candidat_entreprise_id_fk' }).onDelete('cascade'),
]);

export const documents_employe = pgTable('documents_employe', {
  id: serial('id').primaryKey(),
  entreprise_id: integer('entreprise_id'),
  employe_id: integer('employe_id').notNull(),
  categorie: text('categorie').notNull().default(sql`'autre'`),
  nom_original: text('nom_original').notNull(),
  nom_stocke: text('nom_stocke').notNull(),
  type_mime: text('type_mime').notNull().default(sql`'application/pdf'`),
  taille: integer('taille').notNull().default(sql`0`),
  date_document: text('date_document'),
  televerse_par: integer('televerse_par'),
  created_at: text('created_at').notNull().default(sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS')`),
}, (t) => [
  index('idx_documents_employe').on(t.employe_id),
  index('idx_documents_employe_entreprise').on(t.entreprise_id),
  foreignKey({ columns: [t.televerse_par], foreignColumns: [users.id], name: 'documents_employe_televerse_par_fk' }).onDelete('set null'),
  foreignKey({ columns: [t.employe_id], foreignColumns: [employes.id], name: 'documents_employe_employe_id_fk' }).onDelete('cascade'),
  foreignKey({ columns: [t.entreprise_id], foreignColumns: [entreprises.id], name: 'documents_employe_entreprise_id_fk' }).onDelete('cascade'),
]);

export const employes = pgTable('employes', {
  id: serial('id').primaryKey(),
  code: text('code'),
  nom: text('nom').notNull(),
  poste: text('poste'),
  magasin_id: integer('magasin_id'),
  telephone: text('telephone'),
  email: text('email'),
  date_embauche: text('date_embauche'),
  type_contrat: text('type_contrat').default(sql`'CDI'`),
  salaire: doublePrecision('salaire').default(sql`0`),
  actif: integer('actif').notNull().default(sql`1`),
  created_at: text('created_at').notNull().default(sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS')`),
  civilite: text('civilite').default(sql`'M.'`),
  date_naissance: text('date_naissance'),
  lieu_naissance: text('lieu_naissance'),
  sexe: text('sexe'),
  situation_matrimoniale: text('situation_matrimoniale'),
  adresse: text('adresse'),
  ville: text('ville'),
  numero_cni: text('numero_cni'),
  numero_cnps: text('numero_cnps'),
  numero_ifu: text('numero_ifu'),
  contact_urgence_nom: text('contact_urgence_nom'),
  contact_urgence_tel: text('contact_urgence_tel'),
  formation: text('formation'),
  date_fin_contrat: text('date_fin_contrat'),
  date_sortie: text('date_sortie'),
  motif_sortie: text('motif_sortie'),
  notes: text('notes'),
  statut_dossier: text('statut_dossier').notNull().default(sql`'complet'`),
  entreprise_id: integer('entreprise_id'),
}, (t) => [
  uniqueIndex('employes_entreprise_id_code_unique').on(t.entreprise_id, t.code),
  foreignKey({ columns: [t.entreprise_id], foreignColumns: [entreprises.id], name: 'employes_entreprise_id_fk' }).onDelete('cascade'),
]);

export const entreprises = pgTable('entreprises', {
  id: serial('id').primaryKey(),
  nom: text('nom').notNull(),
  email: text('email').notNull(),
  nom_contact: text('nom_contact'),
  prenom_contact: text('prenom_contact'),
  telephone: text('telephone'),
  ville: text('ville'),
  pays: text('pays').default(sql`'Cameroun'`),
  date_creation: text('date_creation'),
  niu: text('niu'),
  logo: text('logo'),
  statut: text('statut').notNull().default(sql`'actif'`),
  notes: text('notes'),
  created_at: text('created_at').notNull().default(sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS')`),
}, (t) => [
]);

export const formules = pgTable('formules', {
  id: serial('id').primaryKey(),
  code: text('code').notNull(),
  libelle: text('libelle').notNull(),
  duree_jours: integer('duree_jours').notNull(),
  montant: doublePrecision('montant').notNull(),
  actif: integer('actif').notNull().default(sql`1`),
  ordre: integer('ordre').notNull().default(sql`0`),
  note: text('note'),
  cree_par: integer('cree_par'),
  cree_le: text('cree_le').notNull().default(sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS')`),
  maj_le: text('maj_le'),
}, (t) => [
  uniqueIndex('formules_code_unique').on(t.code),
  foreignKey({ columns: [t.cree_par], foreignColumns: [users.id], name: 'formules_cree_par_fk' }).onDelete('set null'),
]);

export const fournisseurs = pgTable('fournisseurs', {
  entreprise_id: integer('entreprise_id'),
  id: serial('id').primaryKey(),
  code: text('code'),
  nom: text('nom').notNull(),
  contact: text('contact'),
  telephone: text('telephone'),
  email: text('email'),
  adresse: text('adresse'),
  ville: text('ville'),
  categorie: text('categorie'),
  created_at: text('created_at').notNull().default(sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS')`),
}, (t) => [
  uniqueIndex('fournisseurs_entreprise_id_code_unique').on(t.entreprise_id, t.code),
  foreignKey({ columns: [t.entreprise_id], foreignColumns: [entreprises.id], name: 'fournisseurs_entreprise_id_fk' }).onDelete('cascade'),
]);

export const inventaires = pgTable('inventaires', {
  id: serial('id').primaryKey(),
  entreprise_id: integer('entreprise_id'),
  magasin_id: integer('magasin_id'),
  libelle: text('libelle').notNull(),
  statut: text('statut').notNull().default(sql`'brouillon'`),
  commentaire: text('commentaire'),
  cree_par: integer('cree_par'),
  cloture_par: integer('cloture_par'),
  created_at: text('created_at').notNull().default(sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS')`),
  cloture_at: text('cloture_at'),
}, (t) => [
  foreignKey({ columns: [t.cloture_par], foreignColumns: [users.id], name: 'inventaires_cloture_par_fk' }).onDelete('set null'),
  foreignKey({ columns: [t.cree_par], foreignColumns: [users.id], name: 'inventaires_cree_par_fk' }).onDelete('set null'),
  foreignKey({ columns: [t.magasin_id], foreignColumns: [magasins.id], name: 'inventaires_magasin_id_fk' }).onDelete('cascade'),
  foreignKey({ columns: [t.entreprise_id], foreignColumns: [entreprises.id], name: 'inventaires_entreprise_id_fk' }).onDelete('cascade'),
]);

export const inventaires_lignes = pgTable('inventaires_lignes', {
  id: serial('id').primaryKey(),
  inventaire_id: integer('inventaire_id').notNull(),
  produit_id: integer('produit_id').notNull(),
  magasin_id: integer('magasin_id'),
  quantite_theorique: doublePrecision('quantite_theorique').notNull().default(sql`0`),
  quantite_calculee: doublePrecision('quantite_calculee').notNull().default(sql`0`),
  quantite_comptee: doublePrecision('quantite_comptee'),
  prix_achat: doublePrecision('prix_achat').notNull().default(sql`0`),
  prix_vente: doublePrecision('prix_vente').notNull().default(sql`0`),
  compte_par: integer('compte_par'),
  note: text('note'),
  maj_at: text('maj_at').notNull().default(sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS')`),
}, (t) => [
  uniqueIndex('inventaires_lignes_inventaire_id_produit_id_magasin_id_unique').on(t.inventaire_id, t.produit_id, t.magasin_id),
  foreignKey({ columns: [t.compte_par], foreignColumns: [users.id], name: 'inventaires_lignes_compte_par_fk' }).onDelete('set null'),
  foreignKey({ columns: [t.magasin_id], foreignColumns: [magasins.id], name: 'inventaires_lignes_magasin_id_fk' }).onDelete('cascade'),
  foreignKey({ columns: [t.produit_id], foreignColumns: [produits.id], name: 'inventaires_lignes_produit_id_fk' }).onDelete('cascade'),
  foreignKey({ columns: [t.inventaire_id], foreignColumns: [inventaires.id], name: 'inventaires_lignes_inventaire_id_fk' }).onDelete('cascade'),
]);

export const journal_evenements = pgTable('journal_evenements', {
  id: serial('id').primaryKey(),
  entreprise_id: integer('entreprise_id').notNull(),
  magasin_id: integer('magasin_id'),
  type: text('type').notNull(),
  libelle: text('libelle'),
  montant: doublePrecision('montant'),
  reference: text('reference'),
  user_id: integer('user_id'),
  auteur: text('auteur'),
  created_at: text('created_at').notNull().default(sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS')`),
}, (t) => [
  index('idx_journal_date').on(t.created_at),
  index('idx_journal_entreprise').on(t.entreprise_id, t.id),
]);

export const magasins = pgTable('magasins', {
  id: serial('id').primaryKey(),
  entreprise_id: integer('entreprise_id'),
  code: text('code').notNull(),
  nom: text('nom').notNull(),
  ville: text('ville'),
  adresse: text('adresse'),
  telephone: text('telephone'),
  responsable: text('responsable'),
  actif: integer('actif').notNull().default(sql`1`),
  created_at: text('created_at').notNull().default(sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS')`),
  type: text('type').notNull().default(sql`'boutique'`),
}, (t) => [
  uniqueIndex('magasins_entreprise_id_code_unique').on(t.entreprise_id, t.code),
  foreignKey({ columns: [t.entreprise_id], foreignColumns: [entreprises.id], name: 'magasins_entreprise_id_fk' }).onDelete('cascade'),
]);

export const mails_envoyes = pgTable('mails_envoyes', {
  id: serial('id').primaryKey(),
  entreprise_id: integer('entreprise_id'),
  destinataire: text('destinataire').notNull(),
  destinataire_nom: text('destinataire_nom'),
  sujet: text('sujet').notNull(),
  corps_html: text('corps_html'),
  corps_texte: text('corps_texte'),
  langue: text('langue').default(sql`'fr'`),
  type: text('type'),
  statut: text('statut').notNull().default(sql`'en_attente'`),
  erreur: text('erreur'),
  smtp_utilise: integer('smtp_utilise').default(sql`0`),
  created_at: text('created_at').notNull().default(sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS')`),
  envoye_at: text('envoye_at'),
}, (t) => [
  index('idx_mails_statut').on(t.statut, t.id),
]);

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  de_user_id: integer('de_user_id'),
  de_nom: text('de_nom'),
  de_email: text('de_email'),
  a_user_id: integer('a_user_id'),
  a_nom: text('a_nom'),
  a_email: text('a_email'),
  entreprise_id: integer('entreprise_id'),
  objet: text('objet').notNull(),
  corps: text('corps').notNull(),
  lu: integer('lu').notNull().default(sql`0`),
  lu_at: text('lu_at'),
  created_at: text('created_at').notNull().default(sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS')`),
}, (t) => [
  foreignKey({ columns: [t.a_user_id], foreignColumns: [users.id], name: 'messages_a_user_id_fk' }).onDelete('set null'),
  foreignKey({ columns: [t.de_user_id], foreignColumns: [users.id], name: 'messages_de_user_id_fk' }).onDelete('set null'),
]);

export const mouvements_stock = pgTable('mouvements_stock', {
  id: serial('id').primaryKey(),
  produit_id: integer('produit_id').notNull(),
  magasin_id: integer('magasin_id').notNull(),
  type: text('type').notNull(),
  quantite: doublePrecision('quantite').notNull(),
  quantite_avant: doublePrecision('quantite_avant').default(sql`0`),
  quantite_apres: doublePrecision('quantite_apres').default(sql`0`),
  motif: text('motif'),
  reference: text('reference'),
  user_id: integer('user_id'),
  created_at: text('created_at').notNull().default(sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS')`),
}, (t) => [
  index('idx_mvt_produit').on(t.produit_id, t.magasin_id),
  foreignKey({ columns: [t.user_id], foreignColumns: [users.id], name: 'mouvements_stock_user_id_fk' }).onDelete('set null'),
  foreignKey({ columns: [t.magasin_id], foreignColumns: [magasins.id], name: 'mouvements_stock_magasin_id_fk' }).onDelete('cascade'),
  foreignKey({ columns: [t.produit_id], foreignColumns: [produits.id], name: 'mouvements_stock_produit_id_fk' }).onDelete('cascade'),
]);

export const paiements_abonnement = pgTable('paiements_abonnement', {
  id: serial('id').primaryKey(),
  entreprise_id: integer('entreprise_id'),
  reference: text('reference').notNull(),
  service: text('service').notNull(),
  numero_paiement: text('numero_paiement').notNull(),
  telephone_payeur: text('telephone_payeur'),
  nom_payeur: text('nom_payeur'),
  plan: text('plan').notNull(),
  montant: doublePrecision('montant').notNull(),
  duree_jours: integer('duree_jours').notNull(),
  statut: text('statut').notNull().default(sql`'en_attente'`),
  message: text('message'),
  user_id: integer('user_id'),
  valide_par: integer('valide_par'),
  created_at: text('created_at').notNull().default(sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS')`),
  traite_at: text('traite_at'),
  psp: text('psp').default(sql`'manuel'`),
  psp_mode: text('psp_mode'),
  psp_reference: text('psp_reference'),
  psp_ticket: text('psp_ticket'),
  psp_statut: text('psp_statut'),
  psp_url: text('psp_url'),
  psp_brut: text('psp_brut'),
  montant_brut: doublePrecision('montant_brut'),
  reduction_id: integer('reduction_id'),
  code_reduction: text('code_reduction'),
  carte_titulaire: text('carte_titulaire'),
  carte_numero_masque: text('carte_numero_masque'),
  carte_expiration: text('carte_expiration'),
}, (t) => [
  uniqueIndex('paiements_abonnement_reference_unique').on(t.reference),
  foreignKey({ columns: [t.valide_par], foreignColumns: [users.id], name: 'paiements_abonnement_valide_par_fk' }).onDelete('set null'),
  foreignKey({ columns: [t.user_id], foreignColumns: [users.id], name: 'paiements_abonnement_user_id_fk' }).onDelete('set null'),
  foreignKey({ columns: [t.entreprise_id], foreignColumns: [entreprises.id], name: 'paiements_abonnement_entreprise_id_fk' }).onDelete('cascade'),
]);

export const parametres = pgTable('parametres', {
  entreprise_id: integer('entreprise_id').notNull().default(sql`0`),
  cle: text('cle').notNull(),
  valeur: text('valeur'),
}, (t) => [
  primaryKey({ columns: [t.entreprise_id, t.cle] }),
]);

export const produits = pgTable('produits', {
  entreprise_id: integer('entreprise_id'),
  id: serial('id').primaryKey(),
  code: text('code').notNull(),
  code_barres: text('code_barres'),
  nom: text('nom').notNull(),
  categorie_id: integer('categorie_id'),
  unite: text('unite').default(sql`'pièce'`),
  prix_achat: doublePrecision('prix_achat').notNull().default(sql`0`),
  prix_vente: doublePrecision('prix_vente').notNull().default(sql`0`),
  tva: doublePrecision('tva').notNull().default(sql`19.25`),
  seuil_alerte: integer('seuil_alerte').notNull().default(sql`5`),
  actif: integer('actif').notNull().default(sql`1`),
  image: text('image'),
  created_at: text('created_at').notNull().default(sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS')`),
}, (t) => [
  uniqueIndex('produits_entreprise_id_code_unique').on(t.entreprise_id, t.code),
  foreignKey({ columns: [t.entreprise_id], foreignColumns: [entreprises.id], name: 'produits_entreprise_id_fk' }).onDelete('cascade'),
]);

export const promotions_clients = pgTable('promotions_clients', {
  id: serial('id').primaryKey(),
  entreprise_id: integer('entreprise_id').notNull(),
  code: text('code').notNull(),
  type: text('type').notNull(),
  valeur: doublePrecision('valeur').notNull(),
  client_id: integer('client_id'),
  debut: text('debut'),
  fin: text('fin'),
  minimum: doublePrecision('minimum').notNull().default(sql`0`),
  maximum_usages: integer('maximum_usages'),
  utilisations: integer('utilisations').notNull().default(sql`0`),
  actif: integer('actif').notNull().default(sql`1`),
}, (t) => [
  uniqueIndex('promotions_clients_entreprise_id_code_unique').on(t.entreprise_id, t.code),
  foreignKey({ columns: [t.client_id], foreignColumns: [clients.id], name: 'promotions_clients_client_id_fk' }).onDelete('no action'),
  foreignKey({ columns: [t.entreprise_id], foreignColumns: [entreprises.id], name: 'promotions_clients_entreprise_id_fk' }).onDelete('no action'),
]);

export const promotions_utilisations = pgTable('promotions_utilisations', {
  id: serial('id').primaryKey(),
  promotion_id: integer('promotion_id').notNull(),
  vente_id: integer('vente_id').notNull(),
  remise: doublePrecision('remise').notNull(),
}, (t) => [
  uniqueIndex('promotions_utilisations_vente_id_unique').on(t.vente_id),
  foreignKey({ columns: [t.vente_id], foreignColumns: [ventes.id], name: 'promotions_utilisations_vente_id_fk' }).onDelete('no action'),
  foreignKey({ columns: [t.promotion_id], foreignColumns: [promotions_clients.id], name: 'promotions_utilisations_promotion_id_fk' }).onDelete('no action'),
]);

export const reductions = pgTable('reductions', {
  id: serial('id').primaryKey(),
  code: text('code').notNull(),
  libelle: text('libelle'),
  type: text('type').notNull().default(sql`'pourcentage'`),
  valeur: doublePrecision('valeur').notNull(),
  formule_code: text('formule_code'),
  max_utilisations: integer('max_utilisations'),
  utilisations: integer('utilisations').notNull().default(sql`0`),
  actif: integer('actif').notNull().default(sql`1`),
  debut: text('debut'),
  fin: text('fin'),
  note: text('note'),
  cree_par: integer('cree_par'),
  cree_le: text('cree_le').notNull().default(sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS')`),
}, (t) => [
  uniqueIndex('reductions_code_unique').on(t.code),
  foreignKey({ columns: [t.cree_par], foreignColumns: [users.id], name: 'reductions_cree_par_fk' }).onDelete('set null'),
]);

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  code: text('code').notNull(),
  nom: text('nom').notNull(),
  description: text('description'),
  permissions: text('permissions').notNull().default(sql`'[]'`),
  portee: text('portee').notNull().default(sql`'magasin'`),
  systeme: integer('systeme').notNull().default(sql`0`),
  attribuable_boutique: integer('attribuable_boutique').notNull().default(sql`0`),
  created_at: text('created_at').notNull().default(sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS')`),
}, (t) => [
  uniqueIndex('roles_code_unique').on(t.code),
]);

export const salaires = pgTable('salaires', {
  id: serial('id').primaryKey(),
  entreprise_id: integer('entreprise_id'),
  employe_id: integer('employe_id').notNull(),
  periode: text('periode').notNull(),
  montant: doublePrecision('montant').notNull().default(sql`0`),
  primes: doublePrecision('primes').notNull().default(sql`0`),
  retenues: doublePrecision('retenues').notNull().default(sql`0`),
  net: doublePrecision('net').notNull().default(sql`0`),
  date_paiement: text('date_paiement'),
  statut: text('statut').notNull().default(sql`'a_payer'`),
  mode_paiement: text('mode_paiement'),
  reference: text('reference'),
  notes: text('notes'),
  saisi_par: integer('saisi_par'),
  created_at: text('created_at').notNull().default(sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS')`),
}, (t) => [
  index('idx_salaires_employe').on(t.employe_id, t.periode),
  index('idx_salaires_entreprise').on(t.entreprise_id),
  uniqueIndex('salaires_employe_id_periode_unique').on(t.employe_id, t.periode),
  foreignKey({ columns: [t.saisi_par], foreignColumns: [users.id], name: 'salaires_saisi_par_fk' }).onDelete('set null'),
  foreignKey({ columns: [t.employe_id], foreignColumns: [employes.id], name: 'salaires_employe_id_fk' }).onDelete('cascade'),
  foreignKey({ columns: [t.entreprise_id], foreignColumns: [entreprises.id], name: 'salaires_entreprise_id_fk' }).onDelete('cascade'),
]);

export const stocks = pgTable('stocks', {
  id: serial('id').primaryKey(),
  produit_id: integer('produit_id').notNull(),
  magasin_id: integer('magasin_id').notNull(),
  quantite: doublePrecision('quantite').notNull().default(sql`0`),
  maj_at: text('maj_at').notNull().default(sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS')`),
}, (t) => [
  index('idx_stocks_magasin').on(t.magasin_id),
  uniqueIndex('stocks_produit_id_magasin_id_unique').on(t.produit_id, t.magasin_id),
  foreignKey({ columns: [t.magasin_id], foreignColumns: [magasins.id], name: 'stocks_magasin_id_fk' }).onDelete('cascade'),
  foreignKey({ columns: [t.produit_id], foreignColumns: [produits.id], name: 'stocks_produit_id_fk' }).onDelete('cascade'),
]);

export const transferts = pgTable('transferts', {
  id: serial('id').primaryKey(),
  reference: text('reference').notNull(),
  magasin_source_id: integer('magasin_source_id').notNull(),
  magasin_dest_id: integer('magasin_dest_id').notNull(),
  produit_id: integer('produit_id').notNull(),
  quantite: doublePrecision('quantite').notNull(),
  statut: text('statut').notNull().default(sql`'en_attente'`),
  note: text('note'),
  user_id: integer('user_id'),
  created_at: text('created_at').notNull().default(sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS')`),
  valide_at: text('valide_at'),
}, (t) => [
  uniqueIndex('transferts_reference_unique').on(t.reference),
  foreignKey({ columns: [t.user_id], foreignColumns: [users.id], name: 'transferts_user_id_fk' }).onDelete('set null'),
  foreignKey({ columns: [t.produit_id], foreignColumns: [produits.id], name: 'transferts_produit_id_fk' }).onDelete('no action'),
  foreignKey({ columns: [t.magasin_dest_id], foreignColumns: [magasins.id], name: 'transferts_magasin_dest_id_fk' }).onDelete('no action'),
  foreignKey({ columns: [t.magasin_source_id], foreignColumns: [magasins.id], name: 'transferts_magasin_source_id_fk' }).onDelete('no action'),
]);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  entreprise_id: integer('entreprise_id'),
  nom: text('nom').notNull(),
  email: text('email').notNull(),
  mot_de_passe: text('mot_de_passe').notNull(),
  role: text('role').notNull().default(sql`'caissier'`),
  magasin_id: integer('magasin_id'),
  actif: integer('actif').notNull().default(sql`1`),
  dernier_login: text('dernier_login'),
  cree_par: integer('cree_par'),
  created_at: text('created_at').notNull().default(sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS')`),
  permissions_extra: text('permissions_extra').notNull().default(sql`'[]'`),
  permissions_retirees: text('permissions_retirees').notNull().default(sql`'[]'`),
  email_verifie: integer('email_verifie').notNull().default(sql`0`),
  email_verifie_at: text('email_verifie_at'),
  langue: text('langue').notNull().default(sql`'fr'`),
}, (t) => [
  index('idx_users_entreprise').on(t.entreprise_id),
  uniqueIndex('users_email_unique').on(t.email),
  foreignKey({ columns: [t.cree_par], foreignColumns: [users.id], name: 'users_cree_par_fk' }).onDelete('set null'),
  foreignKey({ columns: [t.magasin_id], foreignColumns: [magasins.id], name: 'users_magasin_id_fk' }).onDelete('set null'),
  foreignKey({ columns: [t.entreprise_id], foreignColumns: [entreprises.id], name: 'users_entreprise_id_fk' }).onDelete('cascade'),
]);

export const ventes = pgTable('ventes', {
  id: serial('id').primaryKey(),
  reference: text('reference').notNull(),
  magasin_id: integer('magasin_id').notNull(),
  client_id: integer('client_id'),
  user_id: integer('user_id'),
  sous_total: doublePrecision('sous_total').notNull().default(sql`0`),
  remise: doublePrecision('remise').notNull().default(sql`0`),
  tva: doublePrecision('tva').notNull().default(sql`0`),
  total: doublePrecision('total').notNull().default(sql`0`),
  mode_paiement: text('mode_paiement').notNull().default(sql`'especes'`),
  montant_paye: doublePrecision('montant_paye').notNull().default(sql`0`),
  monnaie: doublePrecision('monnaie').notNull().default(sql`0`),
  statut: text('statut').notNull().default(sql`'payee'`),
  note: text('note'),
  created_at: text('created_at').notNull().default(sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala', 'YYYY-MM-DD HH24:MI:SS')`),
}, (t) => [
  index('idx_ventes_magasin').on(t.magasin_id),
  index('idx_ventes_date').on(t.created_at),
  uniqueIndex('ventes_reference_unique').on(t.reference),
  foreignKey({ columns: [t.user_id], foreignColumns: [users.id], name: 'ventes_user_id_fk' }).onDelete('set null'),
  foreignKey({ columns: [t.client_id], foreignColumns: [clients.id], name: 'ventes_client_id_fk' }).onDelete('set null'),
  foreignKey({ columns: [t.magasin_id], foreignColumns: [magasins.id], name: 'ventes_magasin_id_fk' }).onDelete('restrict'),
]);

export const ventes_lignes = pgTable('ventes_lignes', {
  id: serial('id').primaryKey(),
  vente_id: integer('vente_id').notNull(),
  produit_id: integer('produit_id'),
  nom_produit: text('nom_produit').notNull(),
  quantite: doublePrecision('quantite').notNull(),
  prix_unitaire: doublePrecision('prix_unitaire').notNull(),
  remise: doublePrecision('remise').notNull().default(sql`0`),
  total: doublePrecision('total').notNull(),
}, (t) => [
  index('idx_lignes_vente').on(t.vente_id),
  foreignKey({ columns: [t.produit_id], foreignColumns: [produits.id], name: 'ventes_lignes_produit_id_fk' }).onDelete('set null'),
  foreignKey({ columns: [t.vente_id], foreignColumns: [ventes.id], name: 'ventes_lignes_vente_id_fk' }).onDelete('cascade'),
]);

export const private_settings = pgTable('private_settings', { cle: text('cle').primaryKey(), valeur: text('valeur').notNull() });