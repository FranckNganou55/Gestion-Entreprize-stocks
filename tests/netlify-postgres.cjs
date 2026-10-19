// Isolated Postgres engine and mocked mail provider; never reads the local business database.
process.env.GESTYPRO_CLOUD = '1';
process.env.GESTYPRO_TEST_POSTGRES = '1';
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const serverless = require('serverless-http');
const bridge = require('../server/postgres.cjs');
let assertions = 0;
async function main() {
  bridge.call('start');
  const app = require('../server/index');
  const handler = serverless(app);
  const { db } = require('../server/db');
  const identity = require('../server/identity.cjs');
  identity.register = async () => ({ confirmedAt: null });
  identity.resend = async () => {};
  let token;
  async function request(method, address, body, expected = 200, auth = token) {
    require('../server/auth').invaliderCacheDroits();
    const url = new URL(address, 'https://example.test');
    const result = await handler({ httpMethod: method, path: url.pathname, headers: { 'content-type': 'application/json', ...(auth ? { authorization: `Bearer ${auth}` } : {}) }, queryStringParameters: Object.fromEntries(url.searchParams), body: body ? JSON.stringify(body) : '', isBase64Encoded: false }, {});
    const parsed = result.headers['content-type']?.includes('json') ? JSON.parse(result.body) : result.body;
    assert.equal(result.statusCode, expected, `${method} ${address}: ${parsed.erreur || 'Statut HTTP inattendu.'}`);
    assertions++;
    return parsed;
  }
  assert.equal(db.prepare('SELECT COUNT(*) c FROM entreprises').get().c, 0);
  assert.equal(db.prepare('SELECT COUNT(*) c FROM users').get().c, 0);
  assertions += 2;
  await request('GET', '/api/sante');
  // Unknown protected APIs require authentication before resolving routes.
  await request('GET', '/api/produits', null, 401);
  await request('POST', '/api/auth/login', {}, 400);
  const password = randomBytes(24).toString('base64url');
  await request('POST', '/api/entreprises/inscription', { nom: 'Reserved', email: require('../server/entreprises').PROPRIETAIRE.email, mot_de_passe: password }, 400);
  const signup = await request('POST', '/api/entreprises/inscription', { nom: 'Entreprise test', email: 'business@example.test', mot_de_passe: password, nom_contact: 'Test' }, 201);
  token = signup.token;
  assert.ok(token); assertions++;
  await request('GET', '/api/auth/me');
  await request('GET', '/api/produits', null, 403);
  await request('POST', '/api/entreprises/verification/renvoyer', {});
  db.prepare('UPDATE users SET email_verifie=1 WHERE entreprise_id=?').run(signup.entreprise.id);
  await request('POST', '/api/auth/login', { email: 'business@example.test', mot_de_passe: password });
  const paths = ['/api/dashboard','/api/produits','/api/categories',`/api/stocks?magasin_id=${signup.magasin.id}`,'/api/stocks/alertes','/api/magasins','/api/magasins/apercu','/api/clients','/api/fournisseurs','/api/employes','/api/rh/employes','/api/rh/candidats','/api/rh/salaires','/api/ventes','/api/achats','/api/transferts','/api/inventaires','/api/messages','/api/abonnement/etat','/api/parametres','/api/rapports/ventes','/api/rapports/produits','/api/rapports/stocks','/api/evenements'];
  const failures = [];
  for (const path of paths) {
    try { await request('GET', path); } catch(error) { failures.push(error.message); }
  }
  for (const entity of ['ventes', 'stocks', 'produits', 'clients', 'journal']) {
    try { await request('GET', `/api/export.csv?type=${entity}&debut=2026-01-01&fin=2026-12-31`); } catch(error) { failures.push(error.message); }
  }
  if (failures.length) throw new Error(failures.join('\n'));
  const product = await request('POST', '/api/produits', { code: 'P-TEST', nom: 'Article test', prix_achat: 50, prix_vente: 100, seuil_alerte: 2 }, 201);
  assert.ok(product.id); assertions++;
  await request('POST', '/api/stocks/mouvement', { produit_id: product.id, magasin_id: signup.magasin.id, type: 'entree', quantite: 10, motif: 'Test' }, 200);
  await request('POST', '/api/ventes', { magasin_id: signup.magasin.id, lignes: [{ produit_id: product.id, quantite: 2, prix_unitaire: 100 }], mode_paiement: 'especes', montant_paye: 200 }, 201);
  assert.equal(db.prepare('SELECT quantite FROM stocks WHERE produit_id=? AND magasin_id=?').get(product.id, signup.magasin.id).quantite, 8); assertions++;
  await request('GET', '/api/dashboard');
  const csv = await request('GET', '/api/export.csv?type=stocks');
  assert.ok(csv.includes('P-TEST') && csv.includes('Article test')); assertions++;
  await request('POST', '/api/inventaires', { magasin_id: signup.magasin.id, libelle: 'Inventaire test' }, 201);
  // Roll back both a normal transaction and a nested savepoint.
  const before = db.prepare('SELECT COUNT(*) c FROM clients').get().c;
  assert.throws(() => db.transaction(() => {
    db.prepare('INSERT INTO clients (entreprise_id, code, nom) VALUES (?, ?, ?)').run(signup.entreprise.id, 'ROLLBACK', 'Rollback');
    db.transaction(() => { throw new Error('rollback'); })();
  })());
  assert.equal(db.prepare('SELECT COUNT(*) c FROM clients').get().c, before); assertions += 2;
  const second = await request('POST', '/api/entreprises/inscription', { nom: 'Autre entreprise', email: 'other@example.test', mot_de_passe: password }, 201, null);
  db.prepare('UPDATE users SET email_verifie=1 WHERE entreprise_id=?').run(second.entreprise.id);
  await request('GET', `/api/produits/${product.id}`, null, 404, second.token);
  // Exercise the platform queries without importing or provisioning a real owner.
  db.prepare("INSERT INTO users (nom,email,mot_de_passe,role,actif,email_verifie) VALUES (?,?,?,'super_admin',1,1)").run('Test owner','owner@example.test', 'not-a-password');
  const owner = db.prepare('SELECT * FROM users WHERE email=?').get('owner@example.test');
  token = require('../server/auth').sign(owner);
  for (const path of ['/api/plateforme/resume','/api/plateforme/entreprises',`/api/plateforme/entreprises/${signup.entreprise.id}`,'/api/plateforme/paiements','/api/plateforme/classement','/api/plateforme/formules','/api/plateforme/ventes']) await request('GET', path);
  console.log(`${assertions} vérifications PostgreSQL réussies : base vide, inscription, permissions, pages, vente, stock, inventaire, transactions et isolation.`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => bridge.db.close());
