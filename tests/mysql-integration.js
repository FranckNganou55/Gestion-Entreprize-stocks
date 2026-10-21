/** Tests réels sur une copie MySQL isolée, aucun email ni paiement externe. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const mysql=require('mysql2/promise'),{spawn,spawnSync}=require('node:child_process');
const jwt=require('jsonwebtoken');
const {JSDOM,VirtualConsole}=require('jsdom');
const base='http://127.0.0.1:3016', nom='inventa_test_'+Date.now(), bin='C:/wamp64/bin/mysql/mysql8.3.0/bin/';
const secret='test-migration-mysql-local', pause=ms=>new Promise(r=>setTimeout(r,ms));
let n=0;function ok(label,v){assert.ok(v,label);n++;console.log('OK '+label);}
(async()=>{
 const c=await mysql.createConnection({host:'127.0.0.1',user:'root',password:'',multipleStatements:true,dateStrings:true,decimalNumbers:true});
 let serveur,dom;const log=[];
 try{
  await c.query('CREATE DATABASE `'+nom+'` CHARACTER SET utf8mb4 COLLATE utf8mb4_bin');
  const dump=spawnSync(bin+'mysqldump.exe',['--host=127.0.0.1','--user=root','--skip-lock-tables','--no-tablespaces','--set-gtid-purged=OFF','gestion_enterprize'],{encoding:'utf8',maxBuffer:64*1024*1024,windowsHide:true});
  assert.equal(dump.status,0,dump.stderr);
  const imp=spawnSync(bin+'mysql.exe',['--host=127.0.0.1','--user=root','--default-character-set=utf8mb4',nom],{input:dump.stdout,encoding:'utf8',maxBuffer:64*1024*1024,windowsHide:true});assert.equal(imp.status,0,imp.stderr);
  await c.query('USE `'+nom+'`');await c.query("DELETE FROM parametres WHERE cle LIKE 'smtp_%'");
  serveur=spawn(process.execPath,['server/index.js'],{env:{...process.env,SP_DB:'',DB_CLIENT:'mysql',MYSQL_DATABASE:nom,MYSQL_USER:'root',MYSQL_PASSWORD:'',PORT:'3016',HOST:'127.0.0.1',JWT_SECRET:secret},stdio:['ignore','pipe','pipe']});
  serveur.stderr.on('data',b=>log.push(b.toString()));
  for(let i=0;i<100;i++){try{if((await fetch(base+'/api/sante')).ok)break;}catch{}await pause(100);}
  async function api(route,method,body,token){const r=await fetch(base+'/api'+route,{method:method||'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)});const texte=await r.text();let data;try{data=JSON.parse(texte);}catch{data=texte;}return{status:r.status,data};}
  let r=await api('/sante');ok('Backend réellement connecté à MySQL',r.data.stockage.moteur==='mysql'&&r.data.base.ventes>0);
  r=await api('/auth/login','POST',{email:'admin@shoppingplus.cm',mot_de_passe:'Admin@2026'});ok('Connexion administrateur après migration',r.status===200);const admin=r.data.token,ent=r.data.utilisateur.entreprise_id;
  const {gererRequete}=await import('../cloudflare/worker.mjs');
  const cfEnv={BACKEND_ORIGIN:'https://backend.example.test'};
  const pont=requete=>{const u=new URL(requete.url);const locale=new URL(base);u.protocol=locale.protocol;u.host=locale.host;return fetch(new Request(u,requete));};
  const cfLogin=await gererRequete(new Request('https://application.example.test/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'admin@shoppingplus.cm',mot_de_passe:'Admin@2026'})}),cfEnv,pont);
  const cfSession=await cfLogin.json();ok('Liaison Cloudflare : connexion réelle au backend MySQL',cfLogin.status===200&&!!cfSession.token);
  const cfProfil=await gererRequete(new Request('https://application.example.test/api/auth/me',{headers:{Authorization:'Bearer '+cfSession.token}}),cfEnv,pont);
  ok('Liaison Cloudflare : session authentifiée utilisable',cfProfil.status===200&&(await cfProfil.json()).utilisateur.entreprise_id===ent);
  const [[owner]]=await c.query("SELECT id,email,role,magasin_id,nom,entreprise_id FROM users WHERE role='super_admin' LIMIT 1");const tokenOwner=jwt.sign(owner,secret,{expiresIn:'10m'});
  for(const route of ['/auth/me','/plateforme/resume','/plateforme/entreprises','/plateforme/entreprises/'+ent,'/plateforme/parametres','/plateforme/paiements','/plateforme/classement','/plateforme/formules','/plateforme/mails']){
   r=await api(route,null,undefined,tokenOwner);ok('Propriétaire : '+route,r.status===200||(console.error(r.data),false));
  }
  for(const route of ['/dashboard','/produits?magasin_id=1','/produits/1','/categories','/stocks?magasin_id=1','/stocks/alertes','/clients','/fournisseurs','/employes','/magasins','/magasins/apercu','/utilisateurs','/roles','/parametres','/ventes','/ventes/1','/caisse/session?magasin_id=1','/rapports/ventes','/rapports/produits','/rapports/stocks','/abonnement','/messages','/inventaires','/transferts']){
   r=await api(route,null,undefined,admin);ok('Lecture MySQL : '+route,r.status===200||(console.error(r.data),false));
  }
  r=await api('/clients','POST',{nom:'Client test MySQL',telephone:'699112233'},admin);ok('Écriture client dans MySQL',r.status===201);const client=r.data;
  const [[persist]]=await c.query('SELECT nom FROM clients WHERE id=?',[client.id]);ok('Écriture confirmée par connexion MySQL indépendante',persist.nom===client.nom);
  const code='MYSQL'+Date.now();r=await api('/promotions-clients','POST',{code,type:'pourcentage',valeur:10,client_id:client.id,maximum_usages:1},admin);ok('Création code promo sur MySQL',r.status===201);
  r=await api('/caisse/promo/verifier','POST',{code,client_id:client.id,montant:10000},admin);ok('Vérification code promo sur MySQL',r.status===200&&r.data.remise===1000);
  const [[stock]]=await c.query('SELECT s.*,p.prix_vente FROM stocks s JOIN produits p ON p.id=s.produit_id WHERE s.magasin_id=1 AND s.quantite>2 AND p.prix_vente>0 LIMIT 1');
  r=await api('/ventes','POST',{magasin_id:1,client_id:client.id,lignes:[{produit_id:stock.produit_id,quantite:1}],code_promo:code,montant_paye:10000000},admin);ok('Vente transactionnelle avec code promo',r.status===201&&r.data.remise===Math.round(stock.prix_vente/10));
  const [[apres]]=await c.query('SELECT quantite FROM stocks WHERE id=?',[stock.id]);ok('Stock décrémenté dans MySQL',apres.quantite===stock.quantite-1);
  const [[usage]]=await c.query('SELECT utilisations FROM promotions_clients WHERE code=?',[code]);ok('Code consommé dans la transaction MySQL',usage.utilisations===1);
  // Tester le rollback du même adaptateur utilisé par l'application.
  const essai=spawnSync(process.execPath,['-e',`const assert=require('node:assert/strict');const {db}=require('./server/db');const n=db.prepare('SELECT COUNT(*) n FROM clients').get().n;try{db.transaction(()=>{db.prepare('INSERT INTO clients (nom,entreprise_id) VALUES (?,?)').run('Rollback',${ent});throw Error('test')})()}catch(e){}assert.equal(db.prepare('SELECT COUNT(*) n FROM clients').get().n,n);db.transaction(()=>{db.transaction(()=>{db.prepare('SELECT 1 ok').get()})();})();db.close();console.log('ok')`],{env:{...process.env,SP_DB:'',DB_CLIENT:'mysql',MYSQL_DATABASE:nom,MYSQL_USER:'root',MYSQL_PASSWORD:''},encoding:'utf8',timeout:40000});
  ok('Rollback réel et transactions imbriquées',essai.status===0||(console.error(essai.stderr),false));
  dom=await JSDOM.fromURL(base+'/#/caisse',{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,virtualConsole:new VirtualConsole(),beforeParse(w){w.localStorage.setItem('sp_token',admin);w.fetch=(u,o)=>fetch(new URL(u,base),o);w.alert=()=>{}}});
  for(let i=0;i<100&&!dom.window.document.querySelector('#pos-promo');i++)await pause(100);
  ok('Interface panier chargée depuis MySQL',!!dom.window.document.querySelector('#pos-nouveau-client')&&!!dom.window.document.querySelector('#pos-promo'));
  fs.writeFileSync('docs/tests-mysql-resultat.json',JSON.stringify({date:new Date().toISOString(),tests:n,reussis:n,base_isolee:true,emails_reels:false,paiements_reels:false},null,2));
  console.log(n+'/'+n+' vérifications réussies.');
 }finally{if(dom)dom.window.close();if(serveur)serveur.kill();await pause(200);await c.query('DROP DATABASE `'+nom+'`');await c.end();if(log.length)fs.writeFileSync('data/mysql-test-erreurs.log',log.join(''));}
})().catch(e=>{console.error(e);process.exitCode=1;});
