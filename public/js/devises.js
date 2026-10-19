/* Les montants de référence restent en XAF ; le change ne réécrit pas l’historique. */
const Devises = {
  code: 'XAF', rates: { XAF: 1, EUR: 1 / 655.957 }, date: null,
  noms: { XAF: 'FCFA', EUR: 'EUR', USD: 'USD', CAD: 'CAD', CNY: 'CNY', NGN: 'NGN', RUB: 'RUB', GBP: 'GBP', CHF: 'CHF', JPY: 'JPY', SAR: 'SAR' },
  parLangue: { fr: 'EUR', en: 'USD', es: 'EUR', de: 'EUR', it: 'EUR', zh: 'CNY', ar: 'SAR', ru: 'RUB' },
  lire(cle) { try { return localStorage.getItem(cle); } catch (_) { return null; } },
  sauver(cle, valeur) { try { localStorage.setItem(cle, valeur); } catch (_) {} },
  automatique() { return this.parLangue[window.I18n ? I18n.langue : 'fr'] || 'XAF'; },
  options() {
    const mode = this.lire('sp_devise_mode') || 'auto';
    return '<option value="auto" ' + (mode === 'auto' ? 'selected' : '') + '>Auto · ' + this.automatique() + '</option>'
      + Object.keys(this.noms).map(c => '<option value="' + c + '" ' + (mode === 'manuel' && this.code === c ? 'selected' : '') + (this.rates[c] > 0 ? '' : ' disabled') + '>' + this.noms[c] + '</option>').join('');
  },
  choisir(code) {
    this.sauver('sp_devise_mode', code === 'auto' ? 'auto' : 'manuel');
    if (code !== 'auto') this.sauver('sp_devise', code);
    this.config({ change: { rates: this.rates, date: this.date } });
  },
  config(p) {
    const change = p.change || {};
    this.rates = { ...this.rates, ...(change.rates || {}) };
    const mode = this.lire('sp_devise_mode') || 'auto';
    const demande = mode === 'auto' ? this.automatique() : (this.lire('sp_devise') || p.devise || 'XAF');
    this.code = this.rates[demande] > 0 ? demande : 'XAF'; this.date = change.date;
  },
  versAffichage(n) { return Number(n) * (this.rates[this.code] || 1); },
  versBase(n) { return Math.round(Number(n) / (this.rates[this.code] || 1) * 100) / 100; },
  saisie(n) { return Number(this.versAffichage(n).toFixed(['XAF','JPY'].includes(this.code) ? 0 : 2)); },
  libelle() { return this.noms[this.code] || this.code; },
  formater(n, unite = true) {
    if (n === null || n === undefined) return '—';
    const locale = window.I18n ? (window.LANGUES[I18n.langue] || {}).html || 'fr' : 'fr';
    const valeur = this.versAffichage(Number(n) || 0);
    if (!unite) return valeur.toLocaleString(locale, { maximumFractionDigits: ['XAF','JPY'].includes(this.code) ? 0 : 2 });
    return new Intl.NumberFormat(locale, { style: 'currency', currency: this.code, currencyDisplay: 'code' }).format(valeur).replace(/\bXAF\b/g, 'FCFA');
  }
};
window.Devises = Devises;
