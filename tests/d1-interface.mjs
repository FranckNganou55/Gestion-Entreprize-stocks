import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import {JSDOM} from 'jsdom';
import {traiterApi} from '../cloudflare/d1/api.mjs';
import {signer} from '../cloudflare/d1/auth.mjs';
const sqlite=new Database(':memory:');sqlite.pragma('foreign_keys=ON');sqlite.exec(fs.readFileSync('database/d1/0001_schema.sql','utf8'));sqlite.exec('BEGIN;'+fs.readFileSync('data/d1/import.sql','utf8')+'COMMIT;');
sqlite.exec(fs.readFileSync('database/d1/0002_limites_auth.sql','utf8'));
const binding={prepare(sql){let v=[];return{bind(...values){v=values;return this;},async first(){return sqlite.prepare(sql).get(...v)||null;},async all(){return{results:sqlite.prepare(sql).all(...v)};},async run(){return{meta:sqlite.prepare(sql).run(...v)};},_run(){return sqlite.prepare(sql).run(...v);}};},async batch(items){return sqlite.transaction(()=>items.map(s=>s._run()))();}};
const env={DB:binding,JWT_SECRET:'test-interface-secret-private-in-memory-32'};
let dom;
try{
 const html=fs.readFileSync('public/index.html','utf8');dom=new JSDOM(html,{runScripts:'outside-only',url:'http://test.invalid'});const w=dom.window;
 w.alert=()=>{};w.confirm=()=>false;w.fetch=async(url,opt={})=>traiterApi(new Request(new URL(url,'http://test.invalid'),opt),env,{});
 w.setInterval=()=>0;w.requestAnimationFrame=()=>0;
 for(const [,file]of html.matchAll(/<script src="([^"]+)"/g)){vm.runInContext(fs.readFileSync('public/'+file,'utf8'),dom.getInternalVMContext());if(file==='js/app.js')w.App.demarrer=()=>{};}
 const owner=sqlite.prepare("SELECT * FROM users WHERE role='super_admin' LIMIT 1").get(),admin=sqlite.prepare("SELECT * FROM users WHERE role='admin' LIMIT 1").get();
 sqlite.prepare("UPDATE users SET email_verifie=1 WHERE id=?").run(admin.id);sqlite.prepare("INSERT INTO parametres(entreprise_id,cle,valeur) VALUES (?,'acces_sans_abonnement','1') ON CONFLICT(entreprise_id,cle) DO UPDATE SET valeur='1'").run(admin.entreprise_id);
 const api=vm.runInContext('Api',dom.getInternalVMContext());let n=0;
 for(const user of [owner,admin]){
  api.definirToken(await signer(user,env.JWT_SECRET));const response=await api.get('/auth/me');w.App.etat.utilisateur=response.utilisateur;await w.App.chargerContexte();
  const vues=w.App.vues;for(const [nom,vue]of Object.entries(vues)){
   if(['inscription','verification'].includes(nom))continue;
   if(!vue.permissions?.some(p=>user.role==='super_admin'?p.startsWith('plateforme.'):response.utilisateur.permissions.includes('*')||response.utilisateur.permissions.includes(p)))continue;
   if(user.role==='super_admin'&&!nom.startsWith('plateforme')||user.role!=='super_admin'&&nom.startsWith('plateforme'))continue;
   const zone=w.document.createElement('div');w.document.body.append(zone);
   try{await vue.rendre(zone);await new Promise(r=>setTimeout(r,80));assert.ok(zone.innerHTML.length>0,nom+' : page vide');assert.ok(!zone.textContent.includes('Cette route n’est pas disponible'),nom+' : route manquante');n++;console.log('OK '+nom);}
   catch(error){throw new Error('Page '+nom+' : '+error.message,{cause:error});}
   finally{zone.remove();}
  }
 }
 console.log(n+' pages vérifiées avec une copie privée des données importées.');
}finally{dom?.window.close();sqlite.close();}
