import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import {traiterApi} from '../cloudflare/d1/api.mjs';
const sqlite=new Database(':memory:');
sqlite.pragma('foreign_keys=ON');
sqlite.exec(fs.readFileSync(new URL('../database/d1/0001_schema.sql',import.meta.url),'utf8'));
sqlite.exec(fs.readFileSync('database/d1/0002_limites_auth.sql','utf8'));
let count=0,avantLot=null;
const binding={prepare(sql){let values=[];return{bind(...p){values=p.map(v=>v instanceof ArrayBuffer?Buffer.from(v):v);return this;},async first(){count++;return sqlite.prepare(sql).get(...values)||null;},async all(){count++;return{results:sqlite.prepare(sql).all(...values)};},async run(){count++;return{meta:sqlite.prepare(sql).run(...values)};},_run(){count++;return sqlite.prepare(sql).run(...values);}};},async batch(items){if(avantLot){const action=avantLot;avantLot=null;action();}return sqlite.transaction(()=>items.map(s=>s._run()))();}};
const env={DB:binding,JWT_SECRET:'test-session-secret-native-d1-at-least-32',OWNER_EMAIL:'owner@example.test',OWNER_PASSWORD:'Test-Owner-2026!'};
async function call(path,method='GET',body,token){count=0;const r=await traiterApi(new Request('https://test.invalid'+path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})}),env,{});const data=await r.json();assert.ok(count<=50,`${path}: ${count} queries exceeds Free limit`);return{status:r.status,data};}
try{
 assert.equal((await call('/healthz')).status,200);
 assert.equal((await call('/api/installation','POST',{})).status,200);
 assert.equal((await call('/api/installation','POST',{})).status,200);
 assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM users WHERE role='super_admin'").get().n,1);
 assert.equal((await call('/api/auth/login','POST',{email:env.OWNER_EMAIL,mot_de_passe:'wrong-password'})).status,401);
 const login=await call('/api/auth/login','POST',{email:env.OWNER_EMAIL,mot_de_passe:env.OWNER_PASSWORD});assert.equal(login.status,200,JSON.stringify(login.data));const owner=login.data.token;
 assert.equal((await call('/api/plateforme/entreprises','GET',null,owner)).status,200);
 const registration=await call('/api/entreprises/inscription','POST',{nom:'Entreprise test',email:'admin@example.test',mot_de_passe:'Test-Admin-2026!'});assert.equal(registration.status,201,JSON.stringify(registration.data));const admin=registration.data.token;
 const user=sqlite.prepare("SELECT * FROM users WHERE email='admin@example.test'").get();sqlite.prepare('UPDATE users SET email_verifie=1 WHERE id=?').run(user.id);
 assert.equal((await call('/api/plateforme/entreprises','GET',null,admin)).status,403);
 for(const path of ['/api/auth/me','/api/magasins','/api/produits','/api/clients','/api/abonnement/etat','/api/messages','/api/parametres','/api/dashboard','/api/rapports/ventes','/api/rapports/produits','/api/rapports/stocks']){const r=await call(path,'GET',null,admin);assert.equal(r.status,200,path+' '+JSON.stringify(r.data));}
 const mid=sqlite.prepare('SELECT id FROM magasins WHERE entreprise_id=?').get(user.entreprise_id).id;
 for(let i=1;i<=150;i++){sqlite.prepare('INSERT INTO produits(id,entreprise_id,code,nom,prix_vente,prix_achat) VALUES (?,?,?,?,100,50)').run(i,user.entreprise_id,'P'+i,'Produit '+i);sqlite.prepare('INSERT INTO stocks(produit_id,magasin_id,quantite) VALUES (?,?,10)').run(i,mid);}
 const panier={magasin_id:mid,lignes:Array.from({length:150},(_,i)=>({produit_id:i+1,quantite:1})),montant_paye:15000};
 const vente=await call('/api/ventes','POST',panier,admin);assert.equal(vente.status,201,JSON.stringify(vente.data));assert.equal(vente.data.total,15000);assert.equal(sqlite.prepare('SELECT MIN(quantite) q FROM stocks').get().q,9);
 // Une seule ligne insuffisante annule la totalité du panier.
 const ventesAvant=sqlite.prepare('SELECT COUNT(*) n FROM ventes').get().n;
 const rejet=await call('/api/ventes','POST',{...panier,lignes:[{produit_id:1,quantite:1},{produit_id:2,quantite:100}]},admin);assert.ok([400,409].includes(rejet.status));assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM ventes').get().n,ventesAvant);assert.equal(sqlite.prepare('SELECT quantite FROM stocks WHERE produit_id=1').get().quantite,9);
 const inventaire=await call('/api/inventaires','POST',{libelle:'Comptage test',magasin_id:mid},admin);assert.equal(inventaire.status,201,JSON.stringify(inventaire.data));assert.equal(inventaire.data.lignes.length,150);
 const idinv=inventaire.data.inventaire.id;sqlite.prepare('UPDATE inventaires_lignes SET quantite_comptee=8 WHERE inventaire_id=?').run(idinv);
 assert.equal((await call('/api/inventaires/'+idinv+'/cloturer','POST',{},admin)).status,201);
 const ajustement=await call('/api/inventaires/'+idinv+'/appliquer','POST',{},admin);assert.equal(ajustement.status,201,JSON.stringify(ajustement.data));assert.equal(ajustement.data.appliques,150);assert.equal(sqlite.prepare('SELECT MIN(quantite) q FROM stocks').get().q,8);
 assert.equal((await call('/api/inventaires/'+idinv+'/appliquer','POST',{},admin)).status,400);
 sqlite.prepare('INSERT INTO fournisseurs(id,entreprise_id,nom) VALUES (1,?,?)').run(user.entreprise_id,'Fournisseur test');
 const achat=await call('/api/achats','POST',{fournisseur_id:1,magasin_id:mid,lignes:[{produit_id:1,quantite:5,prix_unitaire:40}]},admin);assert.equal(achat.status,201,JSON.stringify(achat.data));
 assert.equal((await call('/api/achats/'+achat.data.id+'/statut','POST',{statut:'recue'},admin)).status,201);
 assert.equal(sqlite.prepare('SELECT quantite FROM stocks WHERE produit_id=1').get().quantite,13);
 assert.equal((await call('/api/achats/'+achat.data.id+'/statut','POST',{statut:'recue'},admin)).status,400);
 avantLot=()=>sqlite.prepare('UPDATE stocks SET quantite=quantite-1 WHERE produit_id=1 AND magasin_id=?').run(mid);
 const conflit=await call('/api/ventes','POST',{magasin_id:mid,lignes:[{produit_id:1,quantite:1}],montant_paye:100},admin);assert.equal(conflit.status,409);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM ventes').get().n,ventesAvant);
 const dotation=await call('/api/magasins','POST',{code:'BQ-2',nom:'Deuxième boutique',type:'boutique',magasin_source_id:mid,stock:Array.from({length:150},(_,i)=>({produit_id:i+1,quantite:1}))},admin);assert.equal(dotation.status,201,JSON.stringify(dotation.data));assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM stocks WHERE magasin_id=?').get(dotation.data.id).n,150);
 const stockAjuste=await call('/api/stocks/ajustement','POST',{produit_id:1,magasin_id:mid,quantite_reelle:20,motif:'Comptage'},admin);assert.equal(stockAjuste.status,201,JSON.stringify(stockAjuste.data));assert.equal(sqlite.prepare('SELECT quantite FROM stocks WHERE produit_id=1 AND magasin_id=?').get(mid).quantite,20);
 const autre=await call('/api/entreprises/inscription','POST',{nom:'Autre entreprise',email:'autre@example.test',mot_de_passe:'Test-Autre-2026!'});assert.equal(autre.status,201);sqlite.prepare('UPDATE users SET email_verifie=1 WHERE email=?').run('autre@example.test');
 assert.equal((await call('/api/produits/1','GET',null,autre.data.token)).status,404);
 assert.equal((await call('/api/inventaires/'+idinv,'GET',null,autre.data.token)).status,404);
 const nouveau='Nouveau-Admin-2026!';assert.equal((await call('/api/plateforme/utilisateurs/'+user.id+'/mot-de-passe','POST',{mot_de_passe:nouveau},autre.data.token)).status,403);assert.equal((await call('/api/plateforme/utilisateurs/'+user.id+'/mot-de-passe','POST',{mot_de_passe:nouveau},owner)).status,201);
 assert.equal((await call('/api/auth/login','POST',{email:user.email,mot_de_passe:nouveau})).status,200);
 const employe=await call('/api/rh/employes','POST',{nom:'Employé test',magasin_id:mid,salaire:100000},admin);assert.equal(employe.status,201,JSON.stringify(employe.data));
 const salaire=await call('/api/rh/salaires','POST',{employe_id:employe.data.id,periode:'2026-10',montant:100000,primes:5000,retenues:2000},admin);assert.equal(salaire.status,201,JSON.stringify(salaire.data));assert.equal(salaire.data.net,103000);
 const contenu=Buffer.from('%PDF-1.4\nDocument de test\n%%EOF').toString('base64');const doc=await call('/api/rh/employes/'+employe.data.id+'/documents','POST',{nom:'test.pdf',contenu},admin);assert.equal(doc.status,201,JSON.stringify(doc.data));assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM d1_documents_chunks').get().n,1);
 assert.equal((await call('/api/rh/documents/'+doc.data.id,'DELETE',{},admin)).status,200);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM d1_documents_chunks').get().n,0);
 console.log('D1 : connexion, isolation des entreprises, droits, ventes et dotation de 150 articles, concurrence, inventaires, achats, salaires et documents vérifiés (limite 50 requêtes par appel).');
}finally{sqlite.close();}
