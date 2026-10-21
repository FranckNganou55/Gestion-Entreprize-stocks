import {parametres,autoriser,exiger} from './db.mjs';
const devises={XAF:'FCFA',EUR:'Euro',USD:'Dollar américain',CAD:'Dollar canadien',CNY:'Yuan chinois',NGN:'Naira nigérian',RUB:'Rouble russe',GBP:'Livre sterling',CHF:'Franc suisse',JPY:'Yen japonais',SAR:'Riyal saoudien'};
export async function taux(db){const p=await parametres(db);let cache={};try{cache=JSON.parse(p.taux_change||'{}');}catch{}return{base:'XAF',source:cache.source||'BEAC (parité EUR)',date:cache.date||null,rates:{...cache.rates,XAF:1,EUR:1/655.957},devises};}
export async function routesDevises(c){
 if(c.p!=='/devises/actualiser'||c.m!=='POST')return;autoriser(c.u,'parametres.gerer');
 const r=await fetch('https://api.frankfurter.dev/v2/rates?base=EUR&quotes=USD,CAD,CNY,NGN,RUB,GBP,CHF,JPY,SAR',{signal:AbortSignal.timeout(10000)});exiger(r.ok,'Source de change indisponible.',502);const rows=await r.json(),rates={},dates=[];exiger(Array.isArray(rows),'Réponse de change invalide.',502);
 for(const row of rows)if(devises[row.quote]&&Number.isFinite(row.rate)&&row.rate>0){rates[row.quote]=row.rate/655.957;dates.push(row.date);}exiger(Object.keys(rates).length,'Aucun taux valide reçu.',502);
 await c.db.run('INSERT INTO parametres(entreprise_id,cle,valeur) VALUES (0,\'taux_change\',?) ON CONFLICT(entreprise_id,cle) DO UPDATE SET valeur=excluded.valeur',JSON.stringify({rates,date:dates.sort()[0],source:'Frankfurter — banques centrales'}));return taux(c.db);
}
