CREATE TABLE IF NOT EXISTS abonnements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  statut TEXT NOT NULL DEFAULT 'essai',      -- essai | actif
  plan TEXT,                                 -- mensuel | annuel
  montant REAL NOT NULL DEFAULT 0,
  date_debut TEXT NOT NULL DEFAULT (date('now','+1 hour')),
  date_fin TEXT NOT NULL,
  reference TEXT,
  maj_at TEXT NOT NULL DEFAULT (datetime('now','+1 hour'))
, entreprise_id INTEGER REFERENCES entreprises(id) ON DELETE CASCADE);

CREATE TABLE IF NOT EXISTS candidats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entreprise_id INTEGER REFERENCES entreprises(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  poste_vise TEXT,
  magasin_id INTEGER REFERENCES magasins(id) ON DELETE SET NULL,
  telephone TEXT,
  email TEXT,
  ville TEXT,
  date_naissance TEXT,
  date_candidature TEXT NOT NULL DEFAULT (date('now','+1 hour')),
  source TEXT,                                -- annonce | spontanee | recommendation | agence
  experience_annees INTEGER DEFAULT 0,
  formation TEXT,
  statut TEXT NOT NULL DEFAULT 'recu',        -- recu | entretien | retenu | embauche | refuse
  date_entretien TEXT,
  salaire_propose REAL DEFAULT 0,
  motif TEXT,                                 -- motif de refus ou note de décision
  employe_id INTEGER REFERENCES employes(id) ON DELETE SET NULL,  -- rempli à l'embauche
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','+1 hour'))
);

CREATE TABLE IF NOT EXISTS "categories" (
id INTEGER PRIMARY KEY AUTOINCREMENT,
  entreprise_id INTEGER REFERENCES entreprises(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  couleur TEXT,
  UNIQUE (entreprise_id, nom)
);

CREATE TABLE IF NOT EXISTS "clients" (
id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT,
  nom TEXT NOT NULL,
  telephone TEXT,
  email TEXT,
  adresse TEXT,
  ville TEXT,
  type TEXT DEFAULT 'particulier',
  points INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now','+1 hour')),
  entreprise_id INTEGER REFERENCES entreprises(id) ON DELETE CASCADE,
  UNIQUE (entreprise_id, code)
);

CREATE TABLE IF NOT EXISTS codes_verification (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    code TEXT NOT NULL,
    jeton TEXT NOT NULL,
    expire_at TEXT NOT NULL,
    utilise_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now','+1 hour'))
  );

CREATE TABLE IF NOT EXISTS commandes_achat (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  fournisseur_id INTEGER NOT NULL REFERENCES fournisseurs(id),
  magasin_id INTEGER NOT NULL REFERENCES magasins(id),
  statut TEXT NOT NULL DEFAULT 'brouillon',   -- brouillon | commandee | recue | annulee
  total REAL NOT NULL DEFAULT 0,
  note TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now','+1 hour')),
  reception_at TEXT
);

CREATE TABLE IF NOT EXISTS commandes_achat_lignes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  commande_id INTEGER NOT NULL REFERENCES commandes_achat(id) ON DELETE CASCADE,
  produit_id INTEGER NOT NULL REFERENCES produits(id),
  quantite REAL NOT NULL,
  prix_unitaire REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS documents_candidat (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entreprise_id INTEGER REFERENCES entreprises(id) ON DELETE CASCADE,
  candidat_id INTEGER NOT NULL REFERENCES candidats(id) ON DELETE CASCADE,
  categorie TEXT NOT NULL DEFAULT 'autre',
  nom_original TEXT NOT NULL,
  nom_stocke TEXT NOT NULL,
  type_mime TEXT NOT NULL DEFAULT 'application/pdf',
  taille INTEGER NOT NULL DEFAULT 0,
  televerse_par INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now','+1 hour'))
);

CREATE TABLE IF NOT EXISTS documents_employe (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entreprise_id INTEGER REFERENCES entreprises(id) ON DELETE CASCADE,
  employe_id INTEGER NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
  categorie TEXT NOT NULL DEFAULT 'autre',    -- cni | diplome | cv | contrat | attestation | autre
  nom_original TEXT NOT NULL,
  nom_stocke TEXT NOT NULL,                   -- fichier sur disque (data/documents/…)
  type_mime TEXT NOT NULL DEFAULT 'application/pdf',
  taille INTEGER NOT NULL DEFAULT 0,
  date_document TEXT,
  televerse_par INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now','+1 hour'))
);

CREATE TABLE IF NOT EXISTS "employes" (
id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT,
  nom TEXT NOT NULL,
  poste TEXT,
  magasin_id INTEGER,
  telephone TEXT,
  email TEXT,
  date_embauche TEXT,
  type_contrat TEXT DEFAULT 'CDI',
  salaire REAL DEFAULT 0,
  actif INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now','+1 hour')),
  civilite TEXT DEFAULT 'M.',
  date_naissance TEXT,
  lieu_naissance TEXT,
  sexe TEXT,
  situation_matrimoniale TEXT,
  adresse TEXT,
  ville TEXT,
  numero_cni TEXT,
  numero_cnps TEXT,
  numero_ifu TEXT,
  contact_urgence_nom TEXT,
  contact_urgence_tel TEXT,
  formation TEXT,
  date_fin_contrat TEXT,
  date_sortie TEXT,
  motif_sortie TEXT,
  notes TEXT,
  statut_dossier TEXT NOT NULL DEFAULT 'complet',
  entreprise_id INTEGER REFERENCES entreprises(id) ON DELETE CASCADE,
  UNIQUE (entreprise_id, code)
);

CREATE TABLE IF NOT EXISTS entreprises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  email TEXT NOT NULL,                        -- email professionnel du responsable
  nom_contact TEXT,
  prenom_contact TEXT,
  telephone TEXT,
  ville TEXT,
  pays TEXT DEFAULT 'Cameroun',
  date_creation TEXT,                         -- date de creation de l entreprise
  niu TEXT,                                   -- numero contribuable
  logo TEXT,                                  -- image du logo (data URL)
  statut TEXT NOT NULL DEFAULT 'actif',       -- actif | suspendu
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','+1 hour'))
);

CREATE TABLE IF NOT EXISTS formules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,                 -- mensuel | annuel | trimestre…
  libelle TEXT NOT NULL,
  duree_jours INTEGER NOT NULL,
  montant REAL NOT NULL,
  actif INTEGER NOT NULL DEFAULT 1,
  ordre INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  cree_par INTEGER REFERENCES users(id) ON DELETE SET NULL,
  cree_le TEXT NOT NULL DEFAULT (datetime('now','+1 hour')),
  maj_le TEXT
);

CREATE TABLE IF NOT EXISTS "fournisseurs" (
id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT,
  nom TEXT NOT NULL,
  contact TEXT,
  telephone TEXT,
  email TEXT,
  adresse TEXT,
  ville TEXT,
  categorie TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','+1 hour')),
  entreprise_id INTEGER REFERENCES entreprises(id) ON DELETE CASCADE,
  UNIQUE (entreprise_id, code)
);

CREATE TABLE IF NOT EXISTS inventaires (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entreprise_id INTEGER REFERENCES entreprises(id) ON DELETE CASCADE,
  magasin_id INTEGER REFERENCES magasins(id) ON DELETE CASCADE,
  libelle TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'brouillon',      -- brouillon | cloture
  commentaire TEXT,
  cree_par INTEGER REFERENCES users(id) ON DELETE SET NULL,
  cloture_par INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now','+1 hour')),
  cloture_at TEXT
);

CREATE TABLE IF NOT EXISTS inventaires_lignes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inventaire_id INTEGER NOT NULL REFERENCES inventaires(id) ON DELETE CASCADE,
  produit_id INTEGER NOT NULL REFERENCES produits(id) ON DELETE CASCADE,
  magasin_id INTEGER REFERENCES magasins(id) ON DELETE CASCADE,
  quantite_theorique REAL NOT NULL DEFAULT 0,
  quantite_calculee REAL NOT NULL DEFAULT 0,
  quantite_comptee REAL,
  prix_achat REAL NOT NULL DEFAULT 0,
  prix_vente REAL NOT NULL DEFAULT 0,
  compte_par INTEGER REFERENCES users(id) ON DELETE SET NULL,
  note TEXT,
  maj_at TEXT NOT NULL DEFAULT (datetime('now','+1 hour')),
  UNIQUE (inventaire_id, produit_id, magasin_id)
);

CREATE TABLE IF NOT EXISTS journal_evenements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entreprise_id INTEGER NOT NULL,
    magasin_id INTEGER,
    type TEXT NOT NULL,              -- vente | stock | transfert | compte | tiers | achat | plateforme
    libelle TEXT,                    -- texte lisible (« Vente VTE-000123 — 25 000 FCFA »)
    montant REAL,                    -- montant éventuel (CA, valeur du mouvement)
    reference TEXT,                  -- référence métier (VTE-…, REC-…, TRF-…)
    user_id INTEGER,
    auteur TEXT,                     -- nom de l'utilisateur à l'origine
    created_at TEXT NOT NULL DEFAULT (datetime('now','+1 hour'))
  );

CREATE TABLE IF NOT EXISTS "magasins" (
id INTEGER PRIMARY KEY AUTOINCREMENT,
  entreprise_id INTEGER REFERENCES entreprises(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  nom TEXT NOT NULL,
  ville TEXT,
  adresse TEXT,
  telephone TEXT,
  responsable TEXT,
  actif INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now','+1 hour')), type TEXT NOT NULL DEFAULT 'boutique',
  UNIQUE (entreprise_id, code)
);

CREATE TABLE IF NOT EXISTS mails_envoyes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entreprise_id INTEGER,
    destinataire TEXT NOT NULL,
    destinataire_nom TEXT,
    sujet TEXT NOT NULL,
    corps_html TEXT,
    corps_texte TEXT,
    langue TEXT DEFAULT 'fr',
    type TEXT,                       -- verification | identifiants | paiement | autre
    statut TEXT NOT NULL DEFAULT 'en_attente',   -- en_attente | envoye | erreur | simule
    erreur TEXT,
    smtp_utilise INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now','+1 hour')),
    envoye_at TEXT
  );

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  de_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  de_nom TEXT, de_email TEXT,
  a_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  a_nom TEXT, a_email TEXT,
  entreprise_id INTEGER,           -- entreprise de l'expéditeur (0 pour le propriétaire)
  objet TEXT NOT NULL,
  corps TEXT NOT NULL,
  lu INTEGER NOT NULL DEFAULT 0,
  lu_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','+1 hour'))
);

CREATE TABLE IF NOT EXISTS mouvements_stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  produit_id INTEGER NOT NULL REFERENCES produits(id) ON DELETE CASCADE,
  magasin_id INTEGER NOT NULL REFERENCES magasins(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                        -- entree | sortie | vente | ajustement | transfert_entree | transfert_sortie | retour
  quantite REAL NOT NULL,
  quantite_avant REAL DEFAULT 0,
  quantite_apres REAL DEFAULT 0,
  motif TEXT,
  reference TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now','+1 hour'))
);

CREATE TABLE IF NOT EXISTS paiements_abonnement (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  service TEXT NOT NULL,                     -- orange_money | mtn_momo
  numero_paiement TEXT NOT NULL,             -- numéro marchand à créditer
  telephone_payeur TEXT,
  nom_payeur TEXT,
  plan TEXT NOT NULL,                        -- mensuel | annuel
  montant REAL NOT NULL,
  duree_jours INTEGER NOT NULL,
  statut TEXT NOT NULL DEFAULT 'en_attente', -- en_attente | valide | rejete
  message TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  valide_par INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now','+1 hour')),
  traite_at TEXT
, entreprise_id INTEGER REFERENCES entreprises(id) ON DELETE CASCADE, psp TEXT DEFAULT 'manuel', psp_mode TEXT, psp_reference TEXT, psp_ticket TEXT, psp_statut TEXT, psp_url TEXT, psp_brut TEXT, montant_brut REAL, reduction_id INTEGER, code_reduction TEXT, carte_titulaire TEXT, carte_numero_masque TEXT, carte_expiration TEXT);

CREATE TABLE IF NOT EXISTS "parametres" (
      entreprise_id INTEGER NOT NULL DEFAULT 0,
      cle TEXT NOT NULL,
      valeur TEXT,
      PRIMARY KEY (entreprise_id, cle)
    );

CREATE TABLE IF NOT EXISTS "produits" (
id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  code_barres TEXT,
  nom TEXT NOT NULL,
  categorie_id INTEGER,
  unite TEXT DEFAULT 'pièce',
  prix_achat REAL NOT NULL DEFAULT 0,
  prix_vente REAL NOT NULL DEFAULT 0,
  tva REAL NOT NULL DEFAULT 19.25,
  seuil_alerte INTEGER NOT NULL DEFAULT 5,
  actif INTEGER NOT NULL DEFAULT 1,
  image TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','+1 hour')),
  entreprise_id INTEGER REFERENCES entreprises(id) ON DELETE CASCADE,
  UNIQUE (entreprise_id, code)
);

CREATE TABLE IF NOT EXISTS promotions_clients (
 id INTEGER PRIMARY KEY AUTOINCREMENT, entreprise_id INTEGER NOT NULL REFERENCES entreprises(id),
 code TEXT NOT NULL, type TEXT NOT NULL CHECK(type IN ('pourcentage','montant')), valeur REAL NOT NULL,
 client_id INTEGER REFERENCES clients(id), debut TEXT, fin TEXT, minimum REAL NOT NULL DEFAULT 0,
 maximum_usages INTEGER, utilisations INTEGER NOT NULL DEFAULT 0, actif INTEGER NOT NULL DEFAULT 1,
 UNIQUE(entreprise_id,code));

CREATE TABLE IF NOT EXISTS promotions_utilisations (
 id INTEGER PRIMARY KEY AUTOINCREMENT, promotion_id INTEGER NOT NULL REFERENCES promotions_clients(id),
 vente_id INTEGER NOT NULL UNIQUE REFERENCES ventes(id), remise REAL NOT NULL);

CREATE TABLE IF NOT EXISTS reductions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  libelle TEXT,
  type TEXT NOT NULL DEFAULT 'pourcentage',   -- pourcentage | montant
  valeur REAL NOT NULL,                       -- 10 => 10 % ; 2000 => 2 000 FCFA
  formule_code TEXT,                          -- NULL = toutes les formules
  max_utilisations INTEGER,
  utilisations INTEGER NOT NULL DEFAULT 0,
  actif INTEGER NOT NULL DEFAULT 1,
  debut TEXT,
  fin TEXT,
  note TEXT,
  cree_par INTEGER REFERENCES users(id) ON DELETE SET NULL,
  cree_le TEXT NOT NULL DEFAULT (datetime('now','+1 hour'))
);

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  description TEXT,
  permissions TEXT NOT NULL DEFAULT '[]',   -- tableau JSON de permissions
  portee TEXT NOT NULL DEFAULT 'magasin',   -- reseau | magasin
  systeme INTEGER NOT NULL DEFAULT 0,       -- 1 = rôle livré avec l'application
  attribuable_boutique INTEGER NOT NULL DEFAULT 0, -- 1 = un responsable de boutique peut l'attribuer
  created_at TEXT NOT NULL DEFAULT (datetime('now','+1 hour'))
);

CREATE TABLE IF NOT EXISTS salaires (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entreprise_id INTEGER REFERENCES entreprises(id) ON DELETE CASCADE,
  employe_id INTEGER NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
  periode TEXT NOT NULL,                      -- 'AAAA-MM'
  montant REAL NOT NULL DEFAULT 0,            -- montant versé ce mois-là
  primes REAL NOT NULL DEFAULT 0,
  retenues REAL NOT NULL DEFAULT 0,
  net REAL NOT NULL DEFAULT 0,
  date_paiement TEXT,
  statut TEXT NOT NULL DEFAULT 'a_payer',     -- a_payer | paye
  mode_paiement TEXT,                         -- especes | mobile_money | virement
  reference TEXT,
  notes TEXT,
  saisi_par INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now','+1 hour')),
  UNIQUE (employe_id, periode)
);

CREATE TABLE IF NOT EXISTS stocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  produit_id INTEGER NOT NULL REFERENCES produits(id) ON DELETE CASCADE,
  magasin_id INTEGER NOT NULL REFERENCES magasins(id) ON DELETE CASCADE,
  quantite REAL NOT NULL DEFAULT 0,
  maj_at TEXT NOT NULL DEFAULT (datetime('now','+1 hour')),
  UNIQUE (produit_id, magasin_id)
);

CREATE TABLE IF NOT EXISTS transferts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  magasin_source_id INTEGER NOT NULL REFERENCES magasins(id),
  magasin_dest_id INTEGER NOT NULL REFERENCES magasins(id),
  produit_id INTEGER NOT NULL REFERENCES produits(id),
  quantite REAL NOT NULL,
  statut TEXT NOT NULL DEFAULT 'en_attente',  -- en_attente | valide | annule
  note TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now','+1 hour')),
  valide_at TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  mot_de_passe TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'caissier',     -- référence roles.code
  magasin_id INTEGER REFERENCES magasins(id) ON DELETE SET NULL,  -- boutique d'affectation
  actif INTEGER NOT NULL DEFAULT 1,
  dernier_login TEXT,
  cree_par INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now','+1 hour'))
, permissions_extra TEXT NOT NULL DEFAULT '[]', permissions_retirees TEXT NOT NULL DEFAULT '[]', entreprise_id INTEGER REFERENCES entreprises(id) ON DELETE CASCADE, email_verifie INTEGER NOT NULL DEFAULT 0, email_verifie_at TEXT, langue TEXT NOT NULL DEFAULT 'fr');

CREATE TABLE IF NOT EXISTS ventes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  magasin_id INTEGER NOT NULL REFERENCES magasins(id) ON DELETE RESTRICT,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  sous_total REAL NOT NULL DEFAULT 0,
  remise REAL NOT NULL DEFAULT 0,
  tva REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  mode_paiement TEXT NOT NULL DEFAULT 'especes',  -- especes | mobile_money | carte | credit
  montant_paye REAL NOT NULL DEFAULT 0,
  monnaie REAL NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'payee',           -- payee | annulee
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','+1 hour'))
);

CREATE TABLE IF NOT EXISTS ventes_lignes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vente_id INTEGER NOT NULL REFERENCES ventes(id) ON DELETE CASCADE,
  produit_id INTEGER REFERENCES produits(id) ON DELETE SET NULL,
  nom_produit TEXT NOT NULL,
  quantite REAL NOT NULL,
  prix_unitaire REAL NOT NULL,
  remise REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_candidats_entreprise ON candidats(entreprise_id);

CREATE INDEX IF NOT EXISTS idx_candidats_statut ON candidats(entreprise_id, statut);

CREATE INDEX IF NOT EXISTS idx_codes_user ON codes_verification(user_id);

CREATE INDEX IF NOT EXISTS idx_documents_employe ON documents_employe(employe_id);

CREATE INDEX IF NOT EXISTS idx_documents_employe_entreprise ON documents_employe(entreprise_id);

CREATE INDEX IF NOT EXISTS idx_employes_entreprise ON employes(entreprise_id);

CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_evenements(created_at);

CREATE INDEX IF NOT EXISTS idx_journal_entreprise ON journal_evenements(entreprise_id, id);

CREATE INDEX IF NOT EXISTS idx_lignes_vente ON ventes_lignes(vente_id);

CREATE INDEX IF NOT EXISTS idx_magasins_entreprise ON magasins(entreprise_id);

CREATE INDEX IF NOT EXISTS idx_mails_statut ON mails_envoyes(statut, id);

CREATE INDEX IF NOT EXISTS idx_mvt_produit ON mouvements_stock(produit_id, magasin_id);

CREATE INDEX IF NOT EXISTS idx_produits_entreprise ON produits(entreprise_id);

CREATE INDEX IF NOT EXISTS idx_salaires_employe ON salaires(employe_id, periode);

CREATE INDEX IF NOT EXISTS idx_salaires_entreprise ON salaires(entreprise_id);

CREATE INDEX IF NOT EXISTS idx_stocks_magasin ON stocks(magasin_id);

CREATE INDEX IF NOT EXISTS idx_users_entreprise ON users(entreprise_id);

CREATE INDEX IF NOT EXISTS idx_ventes_date ON ventes(created_at);

CREATE INDEX IF NOT EXISTS idx_ventes_magasin ON ventes(magasin_id);

INSERT OR IGNORE INTO roles ("id","code","nom","description","permissions","portee","systeme","attribuable_boutique","created_at") VALUES (1,'super_admin','Propriétaire de la plateforme','Surveille toutes les entreprises clientes, leurs magasins, leurs comptes et leurs paiements.','["*"]','plateforme',1,0,'2026-10-05 12:08:08');
INSERT OR IGNORE INTO roles ("id","code","nom","description","permissions","portee","systeme","attribuable_boutique","created_at") VALUES (2,'admin','Administrateur général','Accès total : réseau, comptes utilisateurs, rôles et paramètres.','["*"]','reseau',1,0,'2026-10-05 12:08:08');
INSERT OR IGNORE INTO roles ("id","code","nom","description","permissions","portee","systeme","attribuable_boutique","created_at") VALUES (3,'gestionnaire','Gestionnaire réseau','Pilote tout le réseau (ventes, stocks, achats, tiers, rapports) et peut créer les comptes de boutique.','["dashboard.consulter","caisse.utiliser","ventes.consulter","ventes.annuler","produits.consulter","produits.gerer","prix.consulter","stock.consulter","stock.entree","stock.sortie","stock.ajuster","journal.consulter","inventaire.consulter","inventaire.gerer","transferts.consulter","transferts.creer","transferts.valider","achats.consulter","achats.creer","achats.receptionner","clients.consulter","clients.gerer","fournisseurs.consulter","fournisseurs.gerer","employes.consulter","employes.gerer","salaires.consulter","salaires.gerer","recrutement.consulter","recrutement.gerer","rapports.consulter","plateforme.consulter","plateforme.gerer","abonnement.consulter","magasins.consulter","utilisateurs.gerer_boutique","parametres.gerer"]','reseau',1,0,'2026-10-05 12:08:08');
INSERT OR IGNORE INTO roles ("id","code","nom","description","permissions","portee","systeme","attribuable_boutique","created_at") VALUES (4,'chef_boutique','Responsable de boutique','Gère sa boutique de A à Z, y compris les comptes (vendeurs, agents de stock) de son magasin.','["dashboard.consulter","caisse.utiliser","ventes.consulter","ventes.annuler","abonnement.consulter","produits.consulter","prix.consulter","stock.consulter","stock.entree","stock.sortie","stock.ajuster","journal.consulter","inventaire.consulter","transferts.consulter","transferts.creer","transferts.valider","achats.consulter","achats.creer","achats.receptionner","clients.consulter","clients.gerer","fournisseurs.consulter","fournisseurs.gerer","employes.consulter","employes.gerer","salaires.consulter","salaires.gerer","recrutement.consulter","recrutement.gerer","rapports.consulter","magasins.consulter","utilisateurs.gerer_boutique"]','magasin',1,0,'2026-10-05 12:08:08');
INSERT OR IGNORE INTO roles ("id","code","nom","description","permissions","portee","systeme","attribuable_boutique","created_at") VALUES (5,'caissier','Caissier / Vendeur','Enregistre les ventes journalières de sa boutique et gère les clients au comptoir.','["dashboard.consulter","caisse.utiliser","ventes.consulter","abonnement.consulter","produits.consulter","prix.consulter","stock.consulter","clients.consulter","clients.gerer"]','magasin',1,1,'2026-10-05 12:08:08');
INSERT OR IGNORE INTO roles ("id","code","nom","description","permissions","portee","systeme","attribuable_boutique","created_at") VALUES (6,'magasinier','Agent de stock (entrées + sorties)','Enregistre les entrées, les sorties et les inventaires de sa boutique. Aucun prix ne lui est demandé.','["dashboard.consulter","abonnement.consulter","produits.consulter","stock.consulter","stock.entree","stock.sortie","stock.ajuster","journal.consulter","inventaire.consulter","transferts.consulter","transferts.creer","transferts.valider","achats.consulter","achats.receptionner","fournisseurs.consulter"]','magasin',1,1,'2026-10-05 12:08:08');
INSERT OR IGNORE INTO roles ("id","code","nom","description","permissions","portee","systeme","attribuable_boutique","created_at") VALUES (7,'receptionnaire','Agent de réception (entrées uniquement)','Réceptionne les livraisons fournisseurs et enregistre uniquement les entrées de stock.','["dashboard.consulter","abonnement.consulter","produits.consulter","stock.consulter","stock.entree","journal.consulter","inventaire.consulter","achats.consulter","achats.receptionner","fournisseurs.consulter"]','magasin',1,1,'2026-10-05 12:08:08');
CREATE TABLE IF NOT EXISTS d1_assertions (id TEXT PRIMARY KEY,condition INTEGER NOT NULL CHECK(condition=1));
CREATE TABLE IF NOT EXISTS d1_documents_chunks (nom_stocke TEXT NOT NULL,position INTEGER NOT NULL,contenu BLOB NOT NULL,PRIMARY KEY(nom_stocke,position));
CREATE TABLE IF NOT EXISTS d1_installation (cle TEXT PRIMARY KEY,valeur TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS d1_sequences (nom TEXT PRIMARY KEY,valeur INTEGER NOT NULL);
INSERT OR IGNORE INTO d1_sequences(nom,valeur) VALUES ('ids',1000000000000);
ALTER TABLE roles ADD COLUMN entreprise_id INTEGER;
