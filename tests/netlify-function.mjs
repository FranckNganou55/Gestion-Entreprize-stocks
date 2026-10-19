process.env.GESTYPRO_TEST_POSTGRES = '1';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
globalThis.Netlify = { env: { get: () => undefined } };
const { default: api } = await import('../netlify/functions/api.mts');
const context = { ip: '127.0.0.1', requestId: 'isolated-function-test' };
try {
  const responses = await Promise.all(Array.from({ length: 3 }, () => api(new Request('https://example.test/api/sante'), context)));
  for (const response of responses) {
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.entreprises, 0);
  }
  const missing = await api(new Request('https://example.test/api/auth/login', { method: 'POST', headers: { origin: 'https://example.test', 'content-type': 'application/json' }, body: '{}' }), context);
  assert.equal(missing.status, 400);
  const denied = await api(new Request('https://example.test/api/auth/login', { method: 'POST', headers: { origin: 'https://untrusted.test', 'content-type': 'application/json' }, body: '{}' }), context);
  assert.equal(denied.status, 403);
  console.log('Fonction Netlify vérifiée : réponse HTTP, requêtes simultanées, JSON et contrôle d’origine.');
} finally { require('../server/postgres.cjs').db.close(); }
