const { MysqlAdapter } = require('./mysql-adapter');
function ouvrir(config) {
const db = new MysqlAdapter({
 host:process.env.MYSQL_HOST || config.host || '127.0.0.1',
 port:Number(process.env.MYSQL_PORT || config.port || 3306),
 user:process.env.MYSQL_USER || config.user || 'root',
 password:process.env.MYSQL_PASSWORD ?? config.password ?? '',
 database:process.env.MYSQL_DATABASE || config.database || 'gestion_enterprize',
 ...(process.env.MYSQL_SSL==='true' ? {ssl:{rejectUnauthorized:true,...(process.env.MYSQL_SSL_CA ? {ca:process.env.MYSQL_SSL_CA.replace(/\\n/g,'\n')} : {})}} : {}),
});
const PARAMS_PLATEFORME = {
  devise: 'FCFA',
  tarif_mensuel: '11500',
  tarif_annuel: '132000',
  essai_jours: '7',
  om_numero: '693007397',
  mtn_numero: '654324282',
  om_ussd: '#150#',
  mtn_ussd: '*126#',
  paiement_marchand: 'INVENTA GESTYPRO',
  paiement_instructions: '',
  whatsapp_support: '654324282',
  whatsapp_message: 'Bonjour, j’ai besoin d’aide sur Inventa GestyPro.',
  support_email: 'support@shoppingplus.cm',
};

/** Réglages de marque par défaut d'une nouvelle entreprise. */
function parametresEntreprise(infos = {}) {
  return {
    nom_entreprise: infos.nom || 'Mon entreprise',
    slogan: infos.slogan || 'Gestion de mes magasins',
    adresse: infos.adresse || '',
    telephone: infos.telephone || '',
    email: infos.email || '',
    contribuable: infos.niu || '',
    ville: infos.ville || '',
    tva_defaut: '19.25',
    prefixe_vente: 'VTE',
    objectif_mensuel: '0',
    message_ticket: 'Merci de votre visite et à bientôt ! Aucun échange sans ticket.',
  };
}

/** Écrit (ou met à jour) un paramètre propre à une entreprise. 0 = plateforme. */
const setParam = db.prepare(
  'INSERT INTO parametres (entreprise_id, cle, valeur) VALUES (?, ?, ?) ON CONFLICT(entreprise_id, cle) DO UPDATE SET valeur=excluded.valeur'
);
// Un redémarrage ne doit pas écraser les réglages du propriétaire.
const initialiserParam = db.prepare(
  'INSERT INTO parametres (entreprise_id, cle, valeur) VALUES (0, ?, ?) ON CONFLICT(entreprise_id, cle) DO NOTHING'
);
for (const [k, v] of Object.entries(PARAMS_PLATEFORME)) initialiserParam.run(k, v);

return { db, PARAMS_PLATEFORME, parametresEntreprise, setParam };
}
module.exports = { ouvrir };
