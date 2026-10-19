process.env.GESTYPRO_CLOUD = '1';
process.env.GESTYPRO_TEST_POSTGRES = '1';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
const serverless = require('serverless-http');
const bridge = require('../server/postgres.cjs');
const root = path.join(__dirname, '..', 'public');
class Assets extends ResourceLoader {
  fetch(address) {
    const local = path.join(root, new URL(address).pathname);
    return local.startsWith(root + path.sep) && fs.existsSync(local) ? Promise.resolve(fs.readFileSync(local)) : null;
  }
}
async function until(fn) {
  for (let i = 0; i < 100; i++) { if (fn()) return; await new Promise(resolve => setTimeout(resolve, 30)); }
  throw new Error('Écran attendu non affiché.');
}
let dom;
let requests = 0;
async function settle() {
  await until(() => requests === 0);
  await new Promise(resolve => setTimeout(resolve, 60));
  await until(() => requests === 0);
}
async function main() {
  bridge.call('start');
  const handler = serverless(require('../server/index'));
  require('../server/identity.cjs').register = async () => ({ confirmedAt: null });
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error.message));
  dom = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), {
    url: 'https://example.test/#/inscription', runScripts: 'dangerously', resources: new Assets(), pretendToBeVisual: true, virtualConsole,
    beforeParse(window) {
      window.fetch = async (address, options = {}) => {
        const url = new URL(address, window.location.href);
        requests++;
        try {
        const result = await handler({ httpMethod: options.method || 'GET', path: url.pathname, headers: options.headers || {}, queryStringParameters: Object.fromEntries(url.searchParams), body: options.body || '', isBase64Encoded: false }, {});
        return new Response(result.isBase64Encoded ? Buffer.from(result.body, 'base64') : result.body, { status: result.statusCode, headers: result.headers });
        } finally { requests--; }
      };
      window.open = () => ({ document: { write() {}, close() {} }, focus() {}, print() {} });
      window.alert = () => {};
    },
  });
  const { window } = dom;
  await until(() => window.document.querySelector('#form-inscription'));
  const form = window.document.querySelector('#form-inscription');
  const password = randomBytes(24).toString('base64url');
  for (const [name, value] of Object.entries({ nom: 'Entreprise interface', email: 'ui@example.test', nom_contact: 'Test', prenom_contact: 'Interface', mot_de_passe: password, confirmation: password, date_creation: '2026-01-01' })) {
    const field = form.querySelector(`[name="${name}"]`);
    if (field) field.value = value;
  }
  form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await until(() => window.document.querySelector('#form-verification'));
  assert.ok(window.document.querySelector('[name=code]').disabled, 'Confirmation par lien au lieu d’un code SMTP');
  const { db } = require('../server/db');
  db.prepare('UPDATE users SET email_verifie=1 WHERE email=?').run('ui@example.test');
  window.history.replaceState(null, '', '#/dashboard');
  await window.App.demarrer();
  await until(() => window.document.querySelector('nav a'));
  for (const page of ['dashboard', 'produits', 'stocks', 'caisse', 'ventes']) {
    await window.App.monter(page);
    await settle();
    assert.equal(window.location.hash, `#/${page}`);
    assert.ok(window.document.querySelector('#contenu').textContent.trim());
  }
  await settle();
  assert.deepEqual(errors, []);
  window.App.deconnecter();
  assert.ok(window.document.querySelector('#form-connexion'));
  window.App.afficherInvitation('test-invitation');
  assert.ok(window.document.querySelector('#form-invitation'));
  await settle();
  console.log('Interface vérifiée : inscription, email, tableau de bord, produits, stocks, caisse, ventes, déconnexion et invitation.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => { dom?.window.close(); bridge.db.close(); });
