const assert=require('node:assert/strict');const fs=require('fs');const D=require('better-sqlite3');const {JSDOM,VirtualConsole}=require('jsdom');const {spawnSync}=require('child_process');
if(!process.env.SP_DB || !/verification-demandes\.db$/.test(process.env.SP_DB))throw Error('Exécuter sur verification-demandes.db uniquement');
const db=new D(process.env.SP_DB), BASE=process.env.BASE_URL||'http://localhost:3000';let nb=0;const ok=(nom,v)=>{assert.ok(v,nom);nb++;console.log('OK '+nom)};
async function api(token,path,method='GET',body){const r=await fetch(BASE+'/api'+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)});return{status:r.status,data:await r.json()};}
async function login(email,password){const r=await api(null,'/auth/login','POST',{email,mot_de_passe:password});assert.equal(r.status,200);return r.data;}
const pause=ms=>new Promise(r=>setTimeout(r,ms));async function jusqua(f){for(let i=0;i<100;i++){if(f())return;await pause(60)}throw Error('Attente interface expirée');}
(async()=>{
const owner=await login('franck06.nganou02oumbe2004@gmail.com',(process.env.TEST_OWNER_PASSWORD || 'Proprietaire-test-uniquement-2026'));const admin=await login('admin@shoppingplus.cm','Admin@2026');
const sauvegarde=db.prepare("SELECT * FROM parametres WHERE entreprise_id=0 AND (cle LIKE 'smtp_%' OR cle IN ('mail_from','app_url'))").all();const ownerVerif=db.prepare('SELECT email_verifie FROM users WHERE id=?').get(owner.utilisateur.id).email_verifie;
let dom;
try{
 db.prepare("DELETE FROM parametres WHERE entreprise_id=0 AND (cle LIKE 'smtp_%' OR cle IN ('mail_from','app_url'))").run();
 db.prepare('UPDATE users SET email_verifie=0 WHERE id=?').run(owner.utilisateur.id);
 let r=await api(owner.token,'/auth/me');ok('Le propriétaire est exempté de vérification',r.data.utilisateur.verification_requise===false);
 const avant=db.prepare('SELECT COUNT(*) n FROM codes_verification WHERE user_id=?').get(owner.utilisateur.id).n;
 r=await api(owner.token,'/entreprises/verification/renvoyer','POST',{});ok('Aucun code inutile créé pour le propriétaire',r.data.verification_requise===false&&db.prepare('SELECT COUNT(*) n FROM codes_verification WHERE user_id=?').get(owner.utilisateur.id).n===avant);
 r=await api(owner.token,'/plateforme/parametres');ok('Paramètres accessibles sans vérification propriétaire',r.status===200&&!r.data.smtp.configure);
 r=await api(admin.token,'/plateforme/parametres');ok('Paramètres plateforme interdits à l’administrateur client',r.status===403);
 r=await api(owner.token,'/plateforme/mails/verifier-connexion','POST',{});ok('Connexion non configurée signalée sans succès fictif',r.status===400);
 r=await api(owner.token,'/plateforme/parametres','PUT',{smtp_host:'smtp.gmail.com',smtp_port:'587',smtp_secure:'false',smtp_user:'essai@example.invalid',smtp_pass:'aaaa bbbb cccc dddd',mail_from:'essai@example.invalid',app_url:'http://localhost:3001'});ok('Configuration Gmail enregistrée',r.status===200&&r.data.smtp.configure);
 ok('Mot de passe jamais renvoyé dans la réponse',r.data.valeurs.smtp_pass===''&&!JSON.stringify(r.data).includes('aaaabbbbccccdddd'));
 ok('Espaces du mot de passe Google normalisés',db.prepare("SELECT valeur FROM parametres WHERE cle='smtp_pass' AND entreprise_id=0").get().valeur==='aaaabbbbccccdddd');
 r=await api(owner.token,'/plateforme/parametres','PUT',{smtp_port:'2525'});ok('Port Gmail 2525 refusé',r.status===400);
 r=await api(owner.token,'/plateforme/parametres','PUT',{smtp_pass:'12345678901234'});ok('Mot de passe Google incomplet refusé',r.status===400);
 r=await api(owner.token,'/plateforme/parametres','PUT',{smtp_pass:'',smtp_port:'587'});ok('Mot de passe conservé quand le champ est vide',r.data.smtp.mot_de_passe_defini);
 r=await api(owner.token,'/plateforme/parametres','PUT',{smtp_port:'invalide'});ok('Port invalide refusé',r.status===400);
 r=await api(owner.token,'/plateforme/parametres','PUT',{app_url:'javascript:alert(1)'});ok('URL d’application invalide refusée',r.status===400);
 db.prepare("DELETE FROM parametres WHERE entreprise_id=0 AND cle LIKE 'smtp_%'").run();
 dom=await JSDOM.fromURL(BASE+'/#/verification',{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,virtualConsole:new VirtualConsole(),beforeParse(w){w.localStorage.setItem('sp_token',owner.token);w.fetch=(u,o)=>fetch(new URL(u,BASE),o);w.alert=()=>{};}});
 const w=dom.window;await jusqua(()=>w.document.getElementById('pp-form-smtp'));
 ok('Ancienne URL vérification redirigée vers les paramètres',w.location.hash==='#/plateforme-parametres');
 ok('Pas de saisie de code pour le propriétaire',!w.document.getElementById('form-verification'));
 ok('Page Paramètres présente dans le menu',!!w.document.querySelector('nav a[data-vue="plateforme-parametres"]'));
 ok('Pas de badge abonnement pour le propriétaire',!w.document.getElementById('badge-abonnement'));
 ok('Gmail présélectionné',w.document.getElementById('pp-smtp_host').value==='smtp.gmail.com'&&w.document.getElementById('pp-smtp_port').value==='587');
 ok('Champ du mot de passe masqué',w.document.getElementById('pp-smtp_pass').type==='password');
 const ancienAdmin = db.prepare('SELECT email_verifie FROM users WHERE id=?').get(admin.utilisateur.id).email_verifie;
 let domAdmin;
 try {
  db.prepare('UPDATE users SET email_verifie=0 WHERE id=?').run(admin.utilisateur.id);
  domAdmin=await JSDOM.fromURL(BASE+'/#/verification',{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,virtualConsole:new VirtualConsole(),beforeParse(f){f.localStorage.setItem('sp_token',admin.token);f.fetch=(u,o)=>fetch(new URL(u,BASE),o);f.alert=()=>{};}});
  const a=domAdmin.window;await jusqua(()=>a.document.getElementById('v-renvoyer'));
  a.document.getElementById('v-renvoyer').click();await jusqua(()=>/Aucun email envoyé/.test(a.document.getElementById('v-message').textContent));
  ok('Sans SMTP, le renvoi affiche Aucun email envoyé',/Aucun email envoyé/.test(a.document.getElementById('v-message').textContent));
  ok('Sans SMTP, aucun succès de livraison fictif',!/Nouveau code envoyé/.test(a.document.getElementById('v-message').textContent));
  ok('Un compte client non vérifié reste protégé',db.prepare('SELECT email_verifie FROM users WHERE id=?').get(admin.utilisateur.id).email_verifie===0);
 } finally {if(domAdmin)domAdmin.window.close();db.prepare('UPDATE users SET email_verifie=? WHERE id=?').run(ancienAdmin,admin.utilisateur.id);}
 const ancienSecret = db.prepare('SELECT mot_de_passe FROM users WHERE id=?').get(owner.utilisateur.id).mot_de_passe;
 try {
  db.prepare('UPDATE users SET mot_de_passe=? WHERE id=?').run('hash-personnalise-de-test',owner.utilisateur.id);
  const relance=spawnSync(process.execPath,['-e',"require('./server/entreprises').assurerProprietaire(); require('./server/db').db.close()"],{env:process.env,encoding:'utf8'});
  ok('Le mot de passe propriétaire est conservé au redémarrage',relance.status===0&&db.prepare('SELECT mot_de_passe FROM users WHERE id=?').get(owner.utilisateur.id).mot_de_passe==='hash-personnalise-de-test');
 } finally {db.prepare('UPDATE users SET mot_de_passe=? WHERE id=?').run(ancienSecret,owner.utilisateur.id);}
 const unit=spawnSync(process.execPath,['-e',`const assert=require('node:assert/strict');const nodemailer=require('nodemailer');let appels=[];nodemailer.createTransport=options=>{appels.push(options);return{verify:async()=>{},sendMail:async()=>({})}};const M=require('./server/mails');(async()=>{await M.testerSmtp();process.env.SMTP_PASS='nouveau';await M.testerSmtp();assert.equal(appels.length,2);assert.equal(appels[0].requireTLS,true);process.env.SMTP_SECURE='1';await M.testerSmtp();assert.equal(appels[2].secure,true);const r=await M.envoyer({destinataire:'test@example.invalid',type:'test',donnees:{}});assert.equal(r.statut,'envoye');delete process.env.SMTP_HOST;delete process.env.SMTP_USER;delete process.env.SMTP_PASS;const s=await M.envoyer({destinataire:'test@example.invalid',type:'test',donnees:{}});assert.equal(s.statut,'simule');assert.equal(M.urlApplication(),'http://localhost:3001');require('./server/db').db.close()})().catch(e=>{console.error(e);process.exitCode=1})`],{cwd:process.cwd(),env:{...process.env,SMTP_HOST:'smtp.example.invalid',SMTP_PORT:'587',SMTP_SECURE:'false',SMTP_USER:'test@example.invalid',SMTP_PASS:'ancien'},encoding:'utf8'});
 ok('Transport SMTP : TLS, rotation du secret et statuts d’envoi vérifiés sans envoi externe',unit.status===0 || (console.error(unit.stderr),false));
 const verification=fs.readFileSync('public/js/views/verification.js','utf8');ok('Renvoi : message distinct pour un email non expédié',verification.includes("r.statut_envoi === 'envoye'")&&verification.includes('Aucun email envoyé'));
}finally{if(dom)dom.window.close();db.prepare("DELETE FROM parametres WHERE entreprise_id=0 AND (cle LIKE 'smtp_%' OR cle IN ('mail_from','app_url'))").run();const inserer=db.prepare('INSERT INTO parametres(entreprise_id,cle,valeur) VALUES(0,?,?)');sauvegarde.forEach(r=>inserer.run(r.cle,r.valeur));db.prepare('UPDATE users SET email_verifie=? WHERE id=?').run(ownerVerif,owner.utilisateur.id);db.close();}
console.log(nb+'/'+nb+' vérifications réussies.');
})().catch(e=>{console.error(e);process.exitCode=1});
