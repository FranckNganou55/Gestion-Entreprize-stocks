/**
 * Point d'entrée du serveur : Inventa GestyPro
 * Application de gestion d'une entreprise de shopping multi-magasins.
 *
 * Démarrage :  npm start        (port 3000 par défaut)
 * Réinitialiser les données de démonstration : npm run seed
 */
const path = require('path');
const { cloud } = require('./runtime');
const express = require('express');
const cors = require('cors');
const { db } = require('./db');
const { seedDatabase } = require('./seed');
const { synchroniserRoles, TOUTES_PERMISSIONS } = require('./auth');
const Abonnement = require('./abonnement');
const Entreprises = require('./entreprises');
const Evenements = require('./evenements');
const Mails = require('./mails');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(express.json({ limit: '2mb' }));

/* --- Rôles & permissions (synchronisés à chaque démarrage) --- */
synchroniserRoles();
console.log(`  ↳ Rôles synchronisés : ${db.prepare('SELECT COUNT(*) c FROM roles').get().c} rôles, ${TOUTES_PERMISSIONS.length} permissions disponibles.`);

/* --- Propriétaire de la plateforme (monitoring de toutes les entreprises) --- */
if (!cloud()) Entreprises.assurerProprietaire();

/* --- Journal des opérations (rafraîchissement en temps réel des écrans) --- */
Evenements.installer();

/* --- E-mails : vérification d'inscription + identifiants des comptes créés --- */
Mails.installer();

/* --- Première initialisation : données de démonstration --- */
const cree = !cloud() && seedDatabase();
if (cree) console.log('  ↳ Données de démonstration créées (entreprise, 5 magasins, produits, 120 jours de ventes).');

// L'alerte est également envoyée si aucun utilisateur n'ouvre une page métier.
const verifierExpirations = () => {
  try { Abonnement.notifierExpirations(); } catch (e) { console.error('Vérification des abonnements :', e.message); }
};
verifierExpirations();
if (!cloud()) setInterval(verifierExpirations, 60000).unref();

/* --- API : état du service (publique) --- */
app.get('/api/sante', (req, res) => {
  res.json({
    ok: true,
    application: 'Inventa GestyPro',
    version: '1.0.0',
    base: {
      magasins: db.prepare('SELECT COUNT(*) c FROM magasins').get().c,
      produits: db.prepare('SELECT COUNT(*) c FROM produits').get().c,
      ventes: db.prepare('SELECT COUNT(*) c FROM ventes').get().c,
      clients: db.prepare('SELECT COUNT(*) c FROM clients').get().c,
      employes: db.prepare('SELECT COUNT(*) c FROM employes').get().c,
    },
    entreprises: db.prepare('SELECT COUNT(*) c FROM entreprises').get().c,
    tarifs: Abonnement.tarifs(),
    /* Abonnement des entreprises clientes : sert aux autres postes pour afficher les tarifs. */
    abonnement: { tarifs: Abonnement.tarifs(), paiement: Abonnement.coordonneesPaiement() },
    support: { whatsapp: String(require('./utils').param('whatsapp_support', '654324282')) },
    dernier_evenement: Evenements.dernierId(null),
    smtp: Mails.configSmtp().configure ? 'configure' : 'non_configure',
    date: new Date().toISOString(),
  });
});

/* --- API : authentification et abonnement (toujours accessibles) --- */
app.use('/api/auth', require('./routes/auth'));
app.use('/api/abonnement', require('./routes/abonnement'));
app.use('/api/entreprises', require('./routes/entreprises'));
/* Notifications du prestataire de paiement (CinetPay) : publiques, montées avant
   le contrôle d'abonnement pour rester joignables même si l'abonnement est expiré. */
app.use('/api/psp', require('./routes/psp'));

/* --- Contrôle d'accès global : l'application se bloque quand l'abonnement a expiré --- */
app.use('/api', Abonnement.exigerAbonnement);

/* --- Console du propriétaire de la plateforme --- */
app.use('/api/plateforme', require('./routes/plateforme'));

/* --- API métier --- */
app.use('/api', require('./routes/admin'));
app.use('/api', require('./routes/catalogue'));
app.use('/api', require('./routes/ventes'));
app.use('/api', require('./routes/tiers'));
app.use('/api', require('./routes/achats'));
app.use('/api', require('./routes/rapports'));
app.use('/api/inventaires', require('./routes/inventaires'));   // comptages physiques et écarts
app.use('/api/messages', require('./routes/messages'));         // messagerie interne (email)
app.use('/api', require('./routes/rh'));            // personnel, salaires, recrutement
app.use('/api/evenements', Evenements.router);

app.use('/api', (req, res) => res.status(404).json({ erreur: 'Route API introuvable.' }));

/* --- Fichiers statiques (interface) --- */
app.use(express.static(path.join(__dirname, '..', 'public')));

/* --- Toute autre route renvoie l'application (SPA) --- */
app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

/* --- Gestion centralisée des erreurs --- */
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const msg = String(err.message || '');
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erreur: 'Le corps de la requête doit être un JSON valide.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ erreur: 'Le contenu envoyé dépasse la taille autorisée.' });
  }
  /* Une erreur métier porte son code HTTP (ex. 400 pour un champ invalide) :
     on le respecte au lieu de tout remonter en 500. */
  const statut = Number(err.statut) >= 400 && Number(err.statut) <= 599 ? Number(err.statut) : null;
  if (!statut) console.error('[ERREUR]', req.method, req.path, err.code || 'INTERNAL');
  if (msg.includes('UNIQUE constraint failed')) {
    return res.status(400).json({ erreur: 'Cet enregistrement existe déjà (code ou email en doublon).' });
  }
  if (statut) return res.status(statut).json({ erreur: msg });
  res.status(500).json({ erreur: 'Service temporairement indisponible. Réessayez.' });
});

/* --- Arrêt propre : on regroupe tout dans le fichier .db (mode WAL) --- */
function arreter(signal) {
  try {
    db.pragma('wal_checkpoint(TRUNCATE)');
    db.close();
    console.log(`\n  Arrêt propre du serveur (${signal}) — base consolidée dans data/shopmanager.db`);
  } catch (e) { /* rien */ }
  process.exit(0);
}
if (require.main === module) {
  process.on('SIGINT', () => arreter('SIGINT'));
  process.on('SIGTERM', () => arreter('SIGTERM'));
  app.listen(PORT, HOST, () => console.log('Serveur GestyPro démarré.'));
}
module.exports = app;
