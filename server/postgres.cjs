const { Worker } = require('node:worker_threads');
const path = require('node:path');
let worker;
let requestActive = false;
function call(operation, payload = {}) {
  if (operation === 'finish' && !worker) { requestActive = false; return true; }
  if (!worker) {
    worker = new Worker(path.join(__dirname, 'postgres-worker.mjs'));
    worker.on('error', () => {}); // Report initialization failures through the bounded RPC timeout.
  }
  const buffer = new SharedArrayBuffer(16 * 1024 * 1024);
  const state = new Int32Array(buffer, 0, 2);
  worker.postMessage({ operation, payload, buffer });
  const outcome = Atomics.wait(state, 0, 0, 45000);
  if (outcome === 'timed-out') {
    worker.terminate(); worker = null; requestActive = false; depth = 0;
    throw new Error('Le stockage est temporairement indisponible. Réessayez.');
  }
  const message = JSON.parse(Buffer.from(buffer, 8, state[1]).toString('utf8'));
  if (!message.ok) throw Object.assign(new Error(message.error), { code: message.code });
  if (operation === 'start') requestActive = true;
  if (operation === 'finish') requestActive = false;
  return message.value;
}
let depth = 0;
const db = {
  prepare(source) {
    return {
      run: (...params) => call('query', { source, params, mode: 'run' }),
      get: (...params) => call('query', { source, params, mode: 'get' }),
      all: (...params) => call('query', { source, params, mode: 'all' }),
    };
  },
  // DDL is applied by Netlify migrations, never during a function invocation.
  exec(source) {
    if (/^\s*(CREATE|ALTER|DROP|PRAGMA)\b/i.test(source)) return;
    return call('query', { source, params: [], mode: 'run' });
  },
  pragma() {},
  transaction(fn) {
    return (...args) => {
      const savepoint = `nested_${depth++}`;
      const nested = requestActive || depth > 1;
      let started = false;
      try {
        call('control', { sql: nested ? `SAVEPOINT ${savepoint}` : 'BEGIN' });
        started = true;
        const value = fn(...args);
        if (value && typeof value.then === 'function') throw new Error('Une transaction synchrone ne peut pas contenir de promesse.');
        call('control', { sql: nested ? `RELEASE SAVEPOINT ${savepoint}` : 'COMMIT' });
        return value;
      } catch (error) {
        if (started) call('control', { sql: nested ? `ROLLBACK TO SAVEPOINT ${savepoint}` : 'ROLLBACK' });
        throw error;
      } finally { depth--; }
    };
  },
  close() { if (worker) { worker.terminate(); worker = null; requestActive = false; depth = 0; } },
};
module.exports = { db, call };
