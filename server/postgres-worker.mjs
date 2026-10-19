import { parentPort } from 'node:worker_threads';
import { getDatabase } from '@netlify/database';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { getStore } from '@netlify/blobs';
import { compile } from './postgres-sql.cjs';
let client, orm, pool;
async function connect() {
  if (client) return;
  if (process.env.GESTYPRO_TEST_POSTGRES === '1') {
    const { PGlite } = await import('@electric-sql/pglite');
    const { readFileSync, readdirSync } = await import('node:fs');
    const test = new PGlite();
    for (const dir of readdirSync('netlify/database/migrations').filter(n => /^\d/.test(n))) {
      await test.exec(readFileSync(`netlify/database/migrations/${dir}/migration.sql`, 'utf8'));
    }
    client = { query: (q, values) => test.query(typeof q === 'string' ? q : q.text, values), release() {} };
  } else {
    pool ||= getDatabase().pool;
    client = await pool.connect();
  }
  orm = drizzle({ client });
}
async function perform(operation, payload) {
  if (operation === 'blob') {
    const store = getStore({ name: 'gestypro-documents', consistency: 'strong' });
    if (payload.method === 'put') { await store.set(payload.key, Buffer.from(payload.content, 'base64')); return true; }
    if (payload.method === 'delete') { await store.delete(payload.key); return true; }
    const result = await store.get(payload.key, { type: 'arrayBuffer' });
    return result ? Buffer.from(result).toString('base64') : null;
  }
  await connect();
  if (operation === 'secret') {
    const { randomBytes } = await import('node:crypto');
    await client.query("INSERT INTO private_settings (cle, valeur) VALUES ('jwt', $1) ON CONFLICT (cle) DO NOTHING", [randomBytes(48).toString('base64url')]);
    return (await client.query("SELECT valeur FROM private_settings WHERE cle='jwt'")).rows[0].valeur;
  }
  if (operation === 'control') { await client.query(payload.sql); return true; }
  if (operation === 'start') {
    if (payload.blobsContext) process.env.NETLIFY_BLOBS_CONTEXT = payload.blobsContext;
    // Transaction locks also work with the managed connection pooler.
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(73910421)');
    return true; }
  if (operation === 'finish') {
    try { await client.query('COMMIT'); }
    finally {
      if (process.env.GESTYPRO_TEST_POSTGRES !== '1') { client.release(); client = null; orm = null; }
    }
    return true;
  }
  const { query, params, hasId } = compile(payload.source, payload.params);
  const pieces = query.split(/(\$\d+)/g).map(piece => /^\$\d+$/.test(piece) ? sql`${params[Number(piece.slice(1))-1]}` : sql.raw(piece));
  const result = await orm.execute(sql.join(pieces, sql.raw('')));
  const rows = result.rows || result;
  // SQLite returns counts as numbers; Postgres represents bigint aggregates as strings.
  const numericFields = new Set((result.fields || []).filter(field => [20, 1700].includes(field.dataTypeID)).map(field => field.name));
  for (const row of rows) {
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === 'string' && (numericFields.has(key) || /^(c|n|nb|m|nb_\w+|nb[A-Z]\w*)$/.test(key)) && /^-?\d+(?:\.\d+)?$/.test(value)) row[key] = Number(value);
    }
  }
  if (payload.mode === 'get') return rows[0] ?? null;
  if (payload.mode === 'all') return rows;
  return { changes: result.rowCount ?? result.affectedRows ?? rows.length, lastInsertRowid: hasId ? rows[0]?.id ?? 0 : 0 };
}
parentPort.on('message', async ({ operation, payload, buffer }) => {
  const state = new Int32Array(buffer, 0, 2);
  let response;
  try { response = { ok: true, value: await perform(operation, payload) }; }
  catch (error) {
    const code = error.cause?.code || error.code;
    response = { ok: false, code, error: code === '23505' ? 'UNIQUE constraint failed' : 'Une opération de stockage a échoué.' };
    if (process.env.GESTYPRO_TEST_POSTGRES === '1') response.error = error.cause?.message || error.message;
  }
  let bytes = Buffer.from(JSON.stringify(response));
  if (bytes.length > buffer.byteLength - 8) bytes = Buffer.from(JSON.stringify({ ok: false, error: 'La réponse est trop volumineuse. Réduisez la période ou les filtres.' }));
  new Uint8Array(buffer, 8, bytes.length).set(bytes);
  Atomics.store(state, 1, bytes.length);
  Atomics.store(state, 0, 1);
  Atomics.notify(state, 0);
});
