/** Codes commerciaux des entreprises, distincts des réductions d'abonnement. */
const { db } = require('./db');
db.exec(`CREATE TABLE IF NOT EXISTS promotions_clients (
 id INTEGER PRIMARY KEY AUTOINCREMENT, entreprise_id INTEGER NOT NULL REFERENCES entreprises(id),
 code TEXT NOT NULL, type TEXT NOT NULL CHECK(type IN ('pourcentage','montant')), valeur REAL NOT NULL,
 client_id INTEGER REFERENCES clients(id), debut TEXT, fin TEXT, minimum REAL NOT NULL DEFAULT 0,
 maximum_usages INTEGER, utilisations INTEGER NOT NULL DEFAULT 0, actif INTEGER NOT NULL DEFAULT 1,
 UNIQUE(entreprise_id,code));
 CREATE TABLE IF NOT EXISTS promotions_utilisations (
 id INTEGER PRIMARY KEY AUTOINCREMENT, promotion_id INTEGER NOT NULL REFERENCES promotions_clients(id),
 vente_id INTEGER NOT NULL UNIQUE REFERENCES ventes(id), remise REAL NOT NULL);`);

function verifier(entreprise, code, client, montant) {
  const p = db.prepare('SELECT * FROM promotions_clients WHERE entreprise_id=? AND code=?')
    .get(entreprise, String(code || '').trim().toUpperCase());
  if (!p || !p.actif) throw new Error('Code promo inconnu ou désactivé.');
  const jour = db.prepare("SELECT date('now','localtime') jour").get().jour;
  if (p.debut && p.debut > jour) throw new Error('Ce code promo n’est pas encore valable.');
  if (p.fin && p.fin < jour) throw new Error('Ce code promo a expiré.');
  if (p.client_id && Number(client) !== p.client_id) throw new Error('Ce code promo est réservé à un autre client. Sélectionnez le bénéficiaire.');
  if (p.maximum_usages && p.utilisations >= p.maximum_usages) throw new Error('La limite d’utilisation de ce code promo est atteinte.');
  if (!Number.isFinite(montant) || montant <= 0) throw new Error('Ajoutez des articles avec un prix avant de vérifier le code.');
  if (montant < p.minimum) throw new Error('Le montant du panier est inférieur au minimum requis : ' + p.minimum + ' FCFA.');
  const remise = Math.min(montant, Math.round(p.type === 'pourcentage' ? montant * p.valeur / 100 : p.valeur));
  return { id: p.id, code: p.code, type: p.type, valeur: p.valeur, remise, total: Math.max(0, montant - remise) };
}
module.exports = { verifier };
