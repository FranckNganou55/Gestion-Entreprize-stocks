function env(name) { return globalThis.Netlify?.env?.get(name) ?? process.env[name]; }
function cloud() { return env('GESTYPRO_CLOUD') === '1' || !!env('NETLIFY_DB_URL'); }
module.exports = { env, cloud };
