const assert=require('node:assert/strict'),mysql=require('mysql2/promise'),crypto=require('node:crypto'),fs=require('node:fs');
const {spawn,spawnSync}=require('node:child_process');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
let n=0;function ok(label,v){assert.ok(v,label);console.log('OK '+label);n++;}
(async()=>{
 const nom='test_prod_'+Date.now(),user='prod_'+crypto.randomBytes(6).toString('hex'),pass=crypto.randomBytes(24).toString('hex');
 const hote=process.env.TEST_MYSQL_HOST||'127.0.0.1';
 const c=await mysql.createConnection({host:hote,user:'root',password:process.env.TEST_MYSQL_ROOT_PASSWORD||'',multipleStatements:true});
 let serveur;const erreurs=[];const base='http://127.0.0.1:3017';
 const env={...process.env,SP_DB:'',NODE_ENV:'production',HOST:'127.0.0.1',PORT:'3017',MYSQL_HOST:hote,MYSQL_PORT:'3306',MYSQL_DATABASE:nom,MYSQL_USER:user,MYSQL_PASSWORD:pass,JWT_SECRET:crypto.randomBytes(40).toString('hex'),OWNER_EMAIL:'owner@example.test',OWNER_PASSWORD:'Premier-mot-de-passe-test-2026',OWNER_NAME:'Propriétaire test'};
 async function demarrer(e){serveur=spawn(process.execPath,['server/index.js'],{env:e,stdio:['ignore','ignore','pipe']});serveur.stderr.on('data',b=>erreurs.push(b.toString()));for(let i=0;i<100;i++){try{if((await fetch(base+'/healthz')).ok)return;}catch{}await pause(100);}throw Error('Démarrage production impossible : '+erreurs.join(''));}
 async function arreter(){if(serveur){const s=serveur;serveur=null;await new Promise(r=>{s.once('exit',r);s.kill();});}}
 async function login(password){return fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'owner@example.test',mot_de_passe:password})});}
 try{
  await c.query('CREATE DATABASE `'+nom+'` CHARACTER SET utf8mb4 COLLATE utf8mb4_bin');await c.query('USE `'+nom+'`');
  const initEnv={...env,MYSQL_USER:'root',MYSQL_PASSWORD:process.env.TEST_MYSQL_ROOT_PASSWORD||''};
  const initialisation=spawnSync(process.execPath,['scripts/initialiser-mysql.js'],{env:initEnv,encoding:'utf8',timeout:40000});
  ok('Commande db:init installe le schéma sur une base vide',initialisation.status===0||(console.error(initialisation.stderr),false));
  await c.query("CREATE USER ?@'%' IDENTIFIED BY ?",[user,pass]);await c.query("GRANT SELECT,INSERT,UPDATE,DELETE ON `"+nom+"`.* TO ?@'%'",[user]);
  const sansSecret=spawnSync(process.execPath,['server/index.js'],{env:{...env,JWT_SECRET:''},encoding:'utf8',timeout:10000});ok('Production refuse un secret JWT absent',sansSecret.status!==0&&sansSecret.stderr.includes('JWT_SECRET'));
  await demarrer(env);
  ok('Santé production', (await fetch(base+'/healthz')).ok);
  let r=await login(env.OWNER_PASSWORD);ok('Première connexion propriétaire sur une base neuve',r.status===200);let donnees=await r.json();const token=donnees.token;
  r=await fetch(base+'/api/plateforme/resume',{headers:{Authorization:'Bearer '+token}});ok('Console propriétaire accessible',r.status===200);
  const [[compte]]=await c.query("SELECT id,mot_de_passe FROM users WHERE role='super_admin'");
  const [[entreprises]]=await c.query('SELECT COUNT(*) n FROM entreprises');ok('Aucune entreprise de démonstration en production',entreprises.n===0);
  const publicData=await(await fetch(base+'/api/sante')).json();ok('Diagnostic public sans coordonnées de paiement ni données métier',publicData.stockage.moteur==='mysql'&&!publicData.abonnement&&!publicData.base);
  await arreter();await demarrer({...env,OWNER_PASSWORD:'Autre-valeur-ne-doit-pas-ecraser'});
  r=await login(env.OWNER_PASSWORD);ok('Mot de passe conservé après redémarrage',r.status===200);
  const [[apres]]=await c.query("SELECT id,mot_de_passe FROM users WHERE role='super_admin'");ok('Identifiant et empreinte propriétaire inchangés',compte.id===apres.id&&compte.mot_de_passe===apres.mot_de_passe);
  r=await login('Autre-valeur-ne-doit-pas-ecraser');ok('La configuration ne remplace pas le mot de passe existant',r.status===401);
  const [[nb]]=await c.query("SELECT COUNT(*) n FROM users WHERE role='super_admin'");ok('Aucun propriétaire dupliqué',nb.n===1);
  const seconde=spawnSync(process.execPath,['scripts/initialiser-mysql.js'],{env:initEnv,encoding:'utf8',timeout:15000});
  const [[conserve]]=await c.query("SELECT id,mot_de_passe FROM users WHERE role='super_admin'");
  ok('Réinitialisation demandée : données existantes préservées',seconde.status===0&&conserve.id===apres.id&&conserve.mot_de_passe===apres.mot_de_passe);
  const gitignore=fs.readFileSync('.gitignore','utf8');ok('Données privées et environnement exclus de GitHub',gitignore.includes('data/')&&gitignore.includes('.env'));
  const schema=fs.readFileSync('database/schema.sql','utf8');ok('Schéma exportable sans données ni identifiants',!/^INSERT INTO/im.test(schema)&&!schema.includes('Aspirine'));
  console.log(n+'/'+n+' vérifications production réussies.');
 }finally{await arreter();await c.query('DROP DATABASE IF EXISTS `'+nom+'`');await c.query("DROP USER IF EXISTS ?@'%'",[user]);await c.end();}
})().catch(e=>{console.error(e);process.exitCode=1;});
