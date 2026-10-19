/**
 * Abonnement d'une entreprise cliente : état, formules, demande de paiement
 * Mobile Money (Orange Money / MTN MoMo) et historique.
 *
 * La validation des paiements se fait côté propriétaire de la plateforme
 * (voir /api/plateforme/paiements/:id/valider).
 */
const express = require('express');
const { db } = require('../db');
const { auth, requirePerm, requirePlateforme, peut } = require('../auth');
const { wrap } = require('../utils');
const { journaliser } = require('../evenements');
const PSP = require('../psp');
const A = require('../abonnement');

const router = express.Router();

/** Le propriétaire de la plateforme voit tout ; un compte d'entreprise voit la sienne. */
function entrepriseDuCompte(req) {
  return req.user && req.user.role === 'super_admin' ? null : (req.user ? req.user.entreprise_id : null);
}

/** Vérifie qu'un paiement appartient bien à l'entreprise du compte connecté. */
function paiementAutorise(req, id) {
  const p = db.prepare('SELECT * FROM paiements_abonnement WHERE id=?').get(Number(id));
  if (!p) throw Object.assign(new Error('Demande de paiement introuvable'), { statut: 404 });
  const limite = entrepriseDuCompte(req);
  if (limite !== null && p.entreprise_id !== limite) {
    throw Object.assign(new Error('Ce paiement appartient à une autre entreprise'), { statut: 403 });
  }
  return p;
}

/** Réglages publics de la plateforme (écran de connexion, page d'inscription). */
router.get('/etat', (req, res, next) => req.headers.authorization ? auth(req, res, next) : next(), wrap((req, res) => {
  const t = A.tarifs();
  const c = A.coordonneesPaiement();
  res.json({
    ...(req.user && req.user.entreprise_id ? A.etat(req.user.entreprise_id) : {}),
    tarifs: t,
    marchand: c.marchand,
    services: Object.values(c.services).map((s) => ({
      service: s.service, nom: s.nom, numero: s.numero, ussd: s.ussd, lien: s.lien,
      /* Coordonnées bancaires du paiement par carte (MasterCard). */
      reseau: s.reseau || null, banque: s.banque || null,
      titulaire: s.titulaire || null, pays: s.pays || null, devise: s.devise || null,
    })),
    compte_bancaire: c.compte_bancaire,
  });
}));

/** État détaillé de l'abonnement de l'entreprise connectée. */
router.get('/', auth, wrap((req, res) => {
  const entrepriseId = req.user.entreprise_id;
  if (!entrepriseId) {
    return res.json({ plateforme: true, tarifs: A.tarifs(), paiement: A.coordonneesPaiement(),
      historique: [], totaux: { encaisse: 0, nb_paiements: 0 }, peut_gerer: true });
  }
  const e = A.etat(entrepriseId);
  const historique = db.prepare(`
    SELECT p.*, u.nom AS utilisateur, v.nom AS valide_par_nom
    FROM paiements_abonnement p
    LEFT JOIN users u ON u.id = p.user_id
    LEFT JOIN users v ON v.id = p.valide_par
    WHERE p.entreprise_id = ?
    ORDER BY p.id DESC LIMIT 60`).all(entrepriseId);
  const services = Object.fromEntries(Object.entries(e.paiement.services).map(([code,v]) => [code,{service:code,nom:v.nom,actif:v.actif}]));
  res.json({
    ...e,
    paiement: { services, marchand: 'Inventa GestyPro' },
    psp: { configure: PSP.pretPourPaiement(), code: PSP.actif() },
    entreprise_id: entrepriseId,
    peut_gerer: !!req.user.plateforme,
    historique: historique.map(({ numero_paiement, ...ligne }) => ligne),
    en_attente: historique.filter((p) => p.statut === 'en_attente'),
    totaux: {
      encaisse: historique.filter((p) => p.statut === 'valide').reduce((s, p) => s + p.montant, 0),
      nb_paiements: historique.filter((p) => p.statut === 'valide').length,
    },
  });
}));

/** Historique des paiements de l'entreprise connectée (toutes s'il est propriétaire). */
router.get('/paiements', auth, requirePerm('abonnement.consulter'), wrap((req, res) => {
  const limite = entrepriseDuCompte(req);
  const sql = `SELECT p.*, u.nom AS utilisateur, v.nom AS valide_par_nom
               FROM paiements_abonnement p
               LEFT JOIN users u ON u.id = p.user_id
               LEFT JOIN users v ON v.id = p.valide_par
               ${limite === null ? '' : 'WHERE p.entreprise_id = ?'}
               ORDER BY p.id DESC LIMIT 200`;
  res.json(limite === null ? db.prepare(sql).all() : db.prepare(sql).all(limite));
}));

/** Validation d'un paiement reçu (par l'administrateur du compte ou le propriétaire). */
router.post('/paiements/:id/valider', auth, requirePlateforme, wrap((req, res) => {
  try {
    paiementAutorise(req, req.params.id);
    const r = A.validerPaiement(Number(req.params.id), req.user.id);
    res.json({ ok: true, ...r, montant: r.paiement.montant, etat: A.etat(r.paiement.entreprise_id),
      message: `Paiement validé — abonnement actif jusqu'au ${A.etat(r.paiement.entreprise_id).date_fin}` });
  } catch (e) { res.status(e.statut || 500).json({ erreur: e.message }); }
}));

/** Rejet d'un paiement (mauvais montant, transfert non reçu…). */
router.post('/paiements/:id/rejeter', auth, requirePlateforme, wrap((req, res) => {
  try {
    paiementAutorise(req, req.params.id);
    const p = A.rejeterPaiement(Number(req.params.id), req.user.id, req.body && req.body.motif);
    res.json({ ok: true, paiement: p, message: `Paiement ${p.reference} rejeté` });
  } catch (e) { res.status(e.statut || 500).json({ erreur: e.message }); }
}));

/** Simulation d'échéance (démonstration) : avance ou recule la date de fin. */
router.post('/essai', auth, requirePerm('abonnement.gerer'), wrap((req, res) => {
  const entrepriseId = req.user && req.user.entreprise_id;
  if (!entrepriseId) return res.status(400).json({ erreur: 'Aucune entreprise rattachée à ce compte' });
  const jours = req.body && req.body.jours !== undefined ? Number(req.body.jours) : A.tarifs().essai_jours;
  if (!Number.isFinite(jours) || Math.abs(jours) > 400) {
    return res.status(400).json({ erreur: 'Nombre de jours invalide (entre -400 et 400)' });
  }
  const abonnement = A.demarrerEssai(entrepriseId, jours);
  res.json({ ok: true, abonnement, etat: A.etat(entrepriseId), message: jours >= 0
    ? `Essai gratuit de ${jours} jour(s) enregistré`
    : `Échéance simulée : abonnement expiré depuis ${Math.abs(jours)} jour(s)` });
}));

/** Supprime une ligne de l'historique de paiement (saisie erronée ou test). */
router.delete('/paiements/:id', auth, requirePlateforme, wrap((req, res) => {
  try {
    paiementAutorise(req, req.params.id);
    const p = A.supprimerPaiement(Number(req.params.id));
    res.json({ ok: true, paiement: p, message: `Ligne ${p.reference} supprimée` });
  } catch (e) { res.status(e.statut || 500).json({ erreur: e.message }); }
}));

/** Demande de paiement : le client envoie le montant par Mobile Money. */
router.post('/demande', auth, requirePerm('abonnement.gerer'), wrap((req, res) => {
  const { service, plan, telephone_payeur, nom_payeur, code_reduction } = req.body || {};
  if (!req.user.entreprise_id) return res.status(400).json({ erreur: 'Aucune entreprise rattachée à ce compte' });
  const utilisateur = db.prepare('SELECT nom, email FROM users WHERE id=?').get(req.user.id);
  let r;
  try {
    r = A.demanderPaiement({
      entreprise_id: req.user.entreprise_id,
      service, plan,
      telephone_payeur: telephone_payeur || null,
      nom_payeur: nom_payeur || (utilisateur ? utilisateur.nom : null),
      code_reduction: code_reduction || null,
      user_id: req.user.id,
    });
  } catch (e) {
    return res.status(e.statut || 400).json({ erreur: e.message });
  }
  journaliser({
    entreprise_id: req.user.entreprise_id, type: 'plateforme', reference: r.paiement.reference,
    montant: r.paiement.montant, user_id: req.user.id,
    libelle: `Paiement d’abonnement déclaré — ${r.paiement.reference} (${Number(r.paiement.montant).toLocaleString('fr-FR')} FCFA)`,
  });
  res.status(201).json({
    ok: true,
    id: r.paiement.id,
    reference: r.paiement.reference,
    montant: r.montant,
    montant_brut: r.montant_brut,
    remise: r.remise,
    code_reduction: r.paiement.code_reduction || null,
    duree_jours: r.duree,
    plan: r.paiement.plan,
    service: { code: r.service.service, nom: r.service.nom, numero: r.service.numero, ussd: r.service.ussd, lien: r.service.lien },
    marchand: A.coordonneesPaiement().marchand,
    message_validation: r.message,
    instructions: r.instruction,
    statut: r.paiement.statut,
    created_at: r.paiement.created_at,
  });
}));

/* Paiement par carte bancaire (MasterCard / Visa). Le formulaire est traité ici ;
   sans passerelle de paiement configurée côté plateforme, le débit est consigné
   « en attente » et validé par le propriétaire (le virement vers son compte bancaire
   est alors confirmé manuellement). Avec une passerelle, le débit serait immédiat. */
/**
 * Paiement par carte bancaire — débit réel via le PSP (CinetPay).
 *
 * Le numéro de carte complet et le cryptogramme ne sont JAMAIS manipulés ici :
 * le client est redirigé vers la page de paiement hébergée et certifiée du PSP,
 * qui effectue le débit puis reverse les fonds sur le compte bancaire du
 * propriétaire. Sans clé PSP, la demande reste « en attente » de validation.
 */
router.post('/checkout', auth, requirePerm('abonnement.gerer'), wrap(require('../checkout').creerSession));
router.post('/payer-carte', auth, requirePerm('abonnement.gerer'), wrap((req,res) => {
  req.body = { ...req.body, service: 'mastercard' };
  return require('../checkout').creerSession(req,res);
}));

/** Formules d'abonnement disponibles + état du PSP (lecture, sans restriction forte). */
router.get('/formules', auth, wrap((req, res) => {
  res.json({
    formules: A.formules(),
    tarifs: A.tarifs(),
    psp: { ...PSP.etat(), prestataires: PSP.liste() },
    reduction_possible: true,
  });
}));

/** Vérifie un code de réduction et renvoie le montant net (sans créer de paiement). */
router.post('/reduction/verifier', auth, wrap((req, res) => {
  const { code, plan } = req.body || {};
  const f = A.formule(plan);
  if (!f) return res.status(400).json({ erreur: 'Formule inconnue' });
  try {
    const r = A.appliquerReduction(code, f.code, Number(f.montant));
    res.json({
      ok: true, code: r.reduction ? r.reduction.code : null,
      libelle: r.reduction ? (r.reduction.libelle || r.reduction.code) : null,
      montant_brut: Math.round(Number(f.montant)), remise: r.remise, montant: r.montant,
    });
  } catch (e) {
    res.status(e.statut || 400).json({ erreur: e.message });
  }
}));

/** État des prestataires de paiement : lequel est actif, et lesquels sont prêts. */
router.get('/psp', auth, wrap((req, res) => res.json({
  actif: PSP.actif(),
  prestataire: PSP.etat().prestataire,
  configure: PSP.estConfigure(),
  message: PSP.etat().message,
  prestataires: PSP.liste(),
})));

/** Tarifs et coordonnées de paiement : réglages de la plateforme, réservés au propriétaire. */
router.put('/parametres', auth, requirePerm('parametres.gerer'), wrap((req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      erreur: 'Les tarifs et les numéros de paiement sont fixés par l’éditeur de l’application : contactez l’assistance WhatsApp.',
    });
  }
  const CLES = ['tarif_mensuel', 'tarif_annuel', 'essai_jours', 'paiement_marchand',
    'om_numero', 'om_ussd', 'mtn_numero', 'mtn_ussd'];
  const maj = db.prepare(`INSERT INTO parametres (entreprise_id,cle,valeur) VALUES (0,?,?)
                          ON CONFLICT(entreprise_id,cle) DO UPDATE SET valeur=excluded.valeur`);
  Object.entries(req.body || {}).forEach(([cle, valeur]) => {
    if (CLES.includes(cle) && valeur !== undefined && valeur !== null) maj.run(cle, String(valeur));
  });
  res.json({ ok: true, tarifs: A.tarifs(), paiement: A.coordonneesPaiement(), message: 'Réglages de la plateforme enregistrés' });
}));

module.exports = router;
