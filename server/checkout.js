const { db } = require('./db');
const A = require('./abonnement');
const PSP = require('./psp');

/** Le serveur ne reçoit jamais de numéro de carte, CVC ou code secret Mobile Money. */
async function creerSession(req, res) {
  const b = req.body || {}, entrepriseId = req.user.entreprise_id;
  if (!entrepriseId) return res.status(400).json({ erreur: 'Le paiement est réservé aux entreprises clientes.' });
  if (['numero_carte','card_number','cvv','cvc','pin','code_secret'].some(k => b[k] !== undefined)) return res.status(400).json({ erreur: 'Saisissez les informations de carte ou le code secret uniquement sur le portail sécurisé du prestataire.' });
  const service = b.service;
  if (!['mastercard','orange_money','mtn_momo'].includes(service) || !A.serviceActif(service)) return res.status(400).json({ erreur: 'Moyen de paiement indisponible.' });
  if (!PSP.estConfigure()) return res.status(503).json({ erreur: 'Le paiement en ligne n’est pas encore activé. Le propriétaire doit configurer le prestataire dans Abonnements & tarifs.', code: 'PSP_NON_CONFIGURE' });
  if (!PSP.pretPourPaiement()) return res.status(503).json({ erreur: 'Le paiement sécurisé est indisponible : le propriétaire doit configurer les adresses HTTPS publiques de notification et de retour.', code: 'PSP_URLS_MANQUANTES' });
  const telephone = String(b.telephone || '').replace(/[\s().-]/g, '');
  if (service !== 'mastercard' && !/^(?:\+?237)?6\d{8}$/.test(telephone)) return res.status(400).json({ erreur: 'Renseignez le numéro Orange Money ou MTN à débiter : 9 chiffres, avec ou sans +237.' });
  const cle = String(b.cle_idempotence || '');
  if (!/^[a-zA-Z0-9-]{16,80}$/.test(cle)) return res.status(400).json({ erreur: 'Identifiant de session de paiement invalide.' });
  const existant = db.prepare('SELECT * FROM paiements_abonnement WHERE entreprise_id=? AND psp_reference=?').get(entrepriseId, 'req:' + cle);
  if (existant) {
    if (existant.service !== service || existant.plan !== b.plan) return res.status(409).json({ erreur: 'Cette session correspond à un autre paiement.' });
    if (existant.psp_url && existant.statut === 'en_attente') return res.json({ reference: existant.reference, url_paiement: existant.psp_url, montant: existant.montant, devise: 'XAF', statut: 'redirection' });
    return res.status(409).json({ erreur: 'Cette session est déjà traitée ou en cours. Consultez l’historique avant de réessayer.', reference: existant.reference });
  }
  const ent = db.prepare('SELECT * FROM entreprises WHERE id=?').get(entrepriseId);
  const facturation = b.facturation || {};
  const client = { id: entrepriseId, email: String(facturation.email || req.user.email || ent.email), telephone: telephone || ent.telephone || '',
    nom: String(facturation.nom || ent.nom_contact || req.user.nom || ent.nom), prenom: String(facturation.prenom || ent.prenom_contact || ''),
    ville: String(facturation.ville || ent.ville || ''), adresse: String(facturation.adresse || ''), region: String(facturation.region || ''), code_postal: String(facturation.code_postal || '') };
  if (service === 'mastercard' && PSP.actif() === 'cinetpay' && (!client.telephone || !client.prenom || !client.ville || !client.adresse || !client.region || !client.code_postal)) return res.status(400).json({ erreur: 'Complétez les coordonnées de facturation : prénom, téléphone, adresse, ville, région et code postal.' });
  let r;
  try {
    r = A.demanderPaiement({ entreprise_id: entrepriseId, service, plan: b.plan, code_reduction: b.code_reduction || null,
      telephone_payeur: telephone || null, nom_payeur: req.user.nom, user_id: req.user.id });
    db.prepare("UPDATE paiements_abonnement SET numero_paiement='',message='Paiement sécurisé : en attente de confirmation du prestataire',psp=?,psp_reference=? WHERE id=?")
      .run(PSP.actif(), 'req:' + cle, r.paiement.id);
    const session = await PSP.initierPaiement({ reference: r.paiement.reference, montant: r.montant, description: r.formule.libelle,
      client, service, metadata: { entreprise_id: entrepriseId, service, user_id: req.user.id } });
    if (!/^https:\/\//i.test(session.url || '')) throw new Error('Le prestataire n’a pas fourni de page HTTPS sécurisée.');
    db.prepare("UPDATE paiements_abonnement SET psp_url=?,psp_ticket=?,psp_mode=?,psp_statut='en_attente' WHERE id=?")
      .run(session.url, session.jeton || null, session.mode || null, r.paiement.id);
    res.status(201).json({ reference: r.paiement.reference, url_paiement: session.url, montant: r.montant, devise: 'XAF', statut: 'redirection' });
  } catch(e) {
    if (r) db.prepare("UPDATE paiements_abonnement SET psp_statut='erreur',message='Impossible d’ouvrir la session de paiement' WHERE id=?").run(r.paiement.id);
    res.status(e.statut || 502).json({ erreur: r ? 'Impossible d’ouvrir le paiement sécurisé. Aucun paiement confirmé. Consultez l’historique avant de réessayer.' : e.message, reference: r ? r.paiement.reference : undefined });
  }
}
module.exports = { creerSession };
