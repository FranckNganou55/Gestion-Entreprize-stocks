import {AsyncLocalStorage} from 'node:async_hooks';
const ids=new AsyncLocalStorage();
export class MetierErreur extends Error {constructor(message,status=400,details={}){super(message);this.status=status;this.details=details;}}
export const exiger=(condition,message,status=400)=>{if(!condition)throw new MetierErreur(message,status);};
export const entier=v=>Number.isSafeInteger(Number(v))?Number(v):0;
export const uid=()=>{const ctx=ids.getStore();if(!ctx||ctx.prochain>=ctx.fin)throw new Error('Bloc d’identifiants indisponible.');return ctx.prochain++;};
export async function avecIdentifiants(binding,action,necessaire){
 if(!necessaire)return action();
 const row=await binding.prepare("UPDATE d1_sequences SET valeur=valeur+4096 WHERE nom='ids' RETURNING valeur").first();
 if(!row)throw new MetierErreur('La migration D1 doit être appliquée.',503);
 return ids.run({prochain:Number(row.valeur)-4096,fin:Number(row.valeur)},action);
}
export const jour=()=>new Date(Date.now()+3600000).toISOString().slice(0,10);
export function connexion(binding){
 exiger(binding,'La base D1 doit être configurée par le propriétaire.',503);
 const statement=(sql,params=[])=>binding.prepare(sql.replace(/'localtime'/g,"'+1 hour'")).bind(...params.map(v=>v===undefined?null:typeof v==='boolean'?Number(v):v));
 return {binding,statement,
  async all(sql,...params){return(await statement(sql,params).all()).results||[];},
  async get(sql,...params){return statement(sql,params).first();},
  async run(sql,...params){return statement(sql,params).run();},
  async batch(queries){return binding.batch(queries.map(q=>statement(q[0],q.slice(1))));}
 };
}
export async function parametres(db,entreprise=0){const r=await db.all('SELECT cle,valeur FROM parametres WHERE entreprise_id=?',entreprise);return Object.fromEntries(r.map(v=>[v.cle,v.valeur]));}
export function permission(u,code){return u?.role==='super_admin'||u?.permissions?.includes('*')||u?.permissions?.includes(code);}
export function autoriser(u,...codes){exiger(codes.some(c=>permission(u,c)),'Cette opération ne fait pas partie de vos habilitations.',403);}
export function administrateur(u){exiger(u.role==='admin','Réservé à l’administrateur de l’entreprise.',403);}
export function proprietaire(u){exiger(u.role==='super_admin','Réservé au propriétaire de la plateforme.',403);}
export async function magasin(db,u,id){const m=await db.get('SELECT * FROM magasins WHERE id=? AND entreprise_id=?',entier(id),u.entreprise_id);exiger(m,'Boutique ou magasin introuvable.',404);if(u.portee==='magasin')exiger(m.id===u.magasin_id,'Ce point de vente ne vous est pas attribué.',403);return m;}
export function filtreMagasin(u,alias='m'){return u.portee==='magasin'?{sql:` AND ${alias}.id=?`,params:[u.magasin_id]}:{sql:'',params:[]};}
export function assertion(condition,params=[]){const id=crypto.randomUUID();return[['INSERT INTO d1_assertions (id,condition) SELECT ?,CASE WHEN '+condition+' THEN 1 ELSE 0 END',id,...params],['DELETE FROM d1_assertions WHERE id=?',id]];}
export function json(value,status=200){return Response.json(value,{status,headers:{'Cache-Control':'no-store'}});}
