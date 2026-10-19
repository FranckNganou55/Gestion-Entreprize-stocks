/** Compatibility for the existing SQL queries; values always remain bound parameters. */
const tables = require('../db/tables.json');
function compile(source, input = []) {
  let query = source.trim().replace(/;\s*$/, '');
  const params = [];
  const named = input.length === 1 && input[0] && typeof input[0] === 'object' && !Array.isArray(input[0]) ? input[0] : null;
  const positional = input.flat();
  let offset = 0;
  // Tokenize literals before changing placeholders or dialect keywords.
  const literals = [];
  query = query.replace(/'(?:''|[^'])*'/g, value => `__L${literals.push(value)-1}__`);
  query = query.replace(/\?|[@:]([a-zA-Z_]\w*)/g, (token, name) => {
    if (token.startsWith(':')) return token;
    params.push(name ? named?.[name] ?? null : positional[offset++] ?? null);
    return `$${params.length}`;
  });
  query = query.replace(/__L(\d+)__/g, (_, i) => literals[Number(i)]);
  const clock = "(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala')";
  query = query.replace(/\b(datetime|date|strftime)\(\s*(?:'(%Y-%m|%Y|%m|%d)'\s*,\s*)?'now'(?:\s*,\s*'localtime')?(?:\s*,\s*'([+-]?\d+) (day|days|month|months|year|years)')?\s*\)/gi,
    (_, fn, fmt, amount, unit) => `to_char(${clock}${amount ? ` + interval '${amount} ${unit}'` : ''}, '${fmt ? fmt.replace('%Y','YYYY').replace('%m','MM').replace('%d','DD') : fn.toLowerCase()==='date' ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH24:MI:SS'}')`);
  query = query.replace(/\bstrftime\(\s*'(%Y-%m|%Y|%m|%d)'\s*,\s*([\w.]+|\$\d+)\s*\)/gi, (_, fmt, expr) => `substring(CAST(${expr} AS text), ${fmt === '%m' ? 6 : fmt === '%d' ? 9 : 1}, ${fmt === '%Y-%m' ? 7 : fmt === '%Y' ? 4 : 2})`);
  query = query.replace(/\bdate\(\s*([\w.]+|\$\d+)\s*\)/gi, (_, expr) => `substring(CAST(${expr} AS text), 1, 10)`);
  query = query.replace(/\btime\(\s*([\w.]+)\s*\)/gi, (_, expr) => `substring(CAST(${expr} AS text), 12, 8)`);
  query = query.replace(/ROUND\(([^,()]+),\s*(\d+)\)/gi, 'ROUND(CAST(($1) AS numeric), $2)');
  query = query.replace(/\bAS\s+([A-Z][a-zA-Z_]*)(?=\s*[,\n]|\s+FROM)/g, 'AS "$1"');
  query = query.replace(/\bIFNULL\s*\(/gi, 'COALESCE(').replace(/\bLIKE\b/gi, 'ILIKE');
  query = query.replace(/SUM\(\s*(\w+(?:\.\w+)?\s*=\s*'[^']*')\s*\)/gi, 'SUM(CAST(($1) AS integer))');
  query = query.replace(/\bAS\s+'([^']+)'/gi, (_, alias) => `AS "${alias.replace(/"/g, '""')}"`);
  const ignored = /^INSERT OR IGNORE\b/i.test(query);
  query = query.replace(/^INSERT OR IGNORE\b/i, 'INSERT');
  if (ignored && !/ON CONFLICT/i.test(query)) query += ' ON CONFLICT DO NOTHING';
  const inserted = query.match(/^INSERT INTO\s+(\w+)/i);
  const hasId = inserted && tables[inserted[1]]?.id;
  if (hasId && !/\bRETURNING\b/i.test(query)) query += ' RETURNING id';
  return { query, params, hasId: !!hasId };
}
module.exports = { compile };
