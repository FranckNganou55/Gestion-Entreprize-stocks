const { db, setParam } = require('./db');
const DEVISES = { XAF: 'FCFA', EUR: 'Euro', USD: 'Dollar américain', CAD: 'Dollar canadien', CNY: 'Yuan chinois', NGN: 'Naira nigérian', RUB: 'Rouble russe', GBP: 'Livre sterling', CHF: 'Franc suisse', JPY: 'Yen japonais', SAR: 'Riyal saoudien' };
function taux() {
  const ligne = db.prepare("SELECT valeur FROM parametres WHERE entreprise_id=0 AND cle='taux_change'").get();
  let cache = {}; try { cache = JSON.parse(ligne ? ligne.valeur : '{}'); } catch (_) {}
  return { base: 'XAF', source: cache.source || 'BEAC (parité EUR)', date: cache.date || null, rates: { ...(cache.rates || {}), XAF: 1, EUR: 1 / 655.957 }, devises: DEVISES };
}
async function actualiser() {
  const response = await fetch('https://api.frankfurter.dev/v2/rates?base=EUR&quotes=USD,CAD,CNY,NGN,RUB,GBP,CHF,JPY,SAR', { signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error('Source de change indisponible');
  const rows = await response.json();
  if (!Array.isArray(rows) || !rows.length) throw new Error('Réponse de change invalide');
  const rates = {}, dates = [];
  for (const row of rows) {
    const code = String(row.quote || '').toUpperCase();
    if (DEVISES[code] && Number.isFinite(row.rate) && row.rate > 0) { rates[code] = row.rate / 655.957; dates.push(row.date); }
  }
  if (!Object.keys(rates).length) throw new Error('Aucun taux valide reçu');
  setParam.run(0, 'taux_change', JSON.stringify({ rates, date: dates.sort()[0], source: 'Frankfurter — banques centrales' }));
  return taux();
}
module.exports = { DEVISES, taux, actualiser };
