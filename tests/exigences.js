/** Régressions des parcours demandés. Exécuter uniquement sur une copie : SP_DB. */
const assert = require('node:assert/strict');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const Database = require('better-sqlite3');
if (!process.env.SP_DB || !/verification-demandes\.db$/.test(process.env.SP_DB)) throw new Error('SP_DB doit désigner verification-demandes.db, copie de test.');
const db = new Database(process.env.SP_DB);
const BASE = process.env.BASE_URL || 'http://localhost:3000';
let n = 0;
const ok = (nom, condition) => { assert.ok(condition, nom); n++; console.log('OK ' + nom); };
async function api(token, route, method = 'GET', body) {
 const r = await fetch(BASE + '/api' + route, { method, headers: { 'Content-Type':'application/json', ...(token ? { Authorization:'Bearer ' + token } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
 return { status:r.status, data:await r.json() };
}
async function login(email,password) { const r=await api(null,'/auth/login','POST',{email,mot_de_passe:password});assert.equal(r.status,200);return r.data.token; }
(async()=>{
 const admin=await login('admin@shoppingplus.cm','Admin@2026'), owner=await login('franck06.nganou02oumbe2004@gmail.com','Aspirine46@!'), caisse=await login('caisse1@shoppingplus.cm','Caisse@2026');
 const ab = db.prepare('SELECT * FROM abonnements WHERE entreprise_id=1 ORDER BY id DESC LIMIT 1').get();
 const ancienAcces = db.prepare("SELECT valeur FROM parametres WHERE entreprise_id=1 AND cle='acces_sans_abonnement'").get();
 let pid, bid;
 try {
  db.prepare("UPDATE abonnements SET date_fin=date('now','+7 days') WHERE entreprise_id=1").run();
  const source=(await api(admin,'/magasins')).data.find(m=>m.actif);
  const pr=await api(admin,'/produits','POST',{nom:'TEST exigences '+Date.now()});pid=pr.data.id;
  ok('Produit créé sans prix',pr.status===201 && pr.data.prix_vente===0);
  await api(admin,'/stocks/mouvement','POST',{produit_id:pid,magasin_id:source.id,type:'entree',quantite:5});
  const code='EXI-'+Date.now();
  const corps={code,nom:'TEST exigences boutique',type:'boutique',magasin_source_id:source.id,stock:[{produit_id:pid,quantite:6}]};
  let r=await api(admin,'/magasins','POST',corps);
  ok('Dotation supérieure au stock refusée',r.status===400);
  ok('Création atomique : aucune boutique orpheline',!db.prepare('SELECT id FROM magasins WHERE code=?').get(code));
  r=await api(admin,'/magasins','POST',{...corps,stock:[{produit_id:pid,quantite:2}]});bid=r.data.id;
  ok('Création boutique avec transfert',r.status===201);
  ok('Stock source réellement débité',db.prepare('SELECT quantite FROM stocks WHERE produit_id=? AND magasin_id=?').get(pid,source.id).quantite===3);
  ok('Stock boutique réellement crédité',db.prepare('SELECT quantite FROM stocks WHERE produit_id=? AND magasin_id=?').get(pid,bid).quantite===2);
  ok('Deux mouvements liés au transfert',db.prepare('SELECT COUNT(*) n FROM mouvements_stock WHERE reference=?').get('DOT-'+bid).n===2);
  r=await api(admin,'/magasins/apercu');ok('Aperçu : quantité restante correcte',r.data.points.find(p=>p.id===bid).stock_quantite===2);
  r=await api(caisse,'/inventaires','POST',{libelle:'Interdit'});ok('Inventaire réservé à l’administrateur',r.status===403);
  const user=(await api(caisse,'/auth/me')).data.utilisateur;
  r=await api(caisse,'/dashboard');ok('Dashboard limité à la boutique affectée',r.status===200 && r.data.par_magasin.every(m=>m.id===user.magasin_id));
  r=await api(owner,'/messages');ok('Liste propriétaire : administrateurs uniquement',r.data.destinataires.every(u=>u.role==='admin'));
  r=await api(admin,'/messages');ok('Liste administrateur : entreprise uniquement',r.data.destinataires.every(u=>db.prepare('SELECT entreprise_id FROM users WHERE id=?').get(u.id).entreprise_id===1));
  const message=await api(owner,'/messages','POST',{a_user_id:db.prepare("SELECT id FROM users WHERE role='admin' AND entreprise_id=1").get().id,objet:'TEST réponse propriétaire',corps:'Test local'});
  r=await api(admin,'/messages','POST',{a_user_id:db.prepare("SELECT id FROM users WHERE role='super_admin'").get().id,objet:'TEST réponse',corps:'Réponse locale',en_reponse_a:message.data.id});
  ok('Un administrateur peut répondre au propriétaire',r.status===201);
  db.prepare("UPDATE abonnements SET date_fin='2020-01-01' WHERE entreprise_id=1").run();
  r=await api(admin,'/dashboard');ok('Expiration : lecture métier bloquée',r.status===402);
  r=await api(admin,'/produits','POST',{nom:'Interdit'});ok('Expiration : écriture métier bloquée',r.status===402);
  r=await api(admin,'/messages');ok('Expiration : messagerie disponible pour demander la réactivation',r.status===200);
  r=await api(admin,'/plateforme/entreprises/1/acces-offert','POST',{actif:true});ok('L’administrateur ne peut pas offrir son accès',r.status===403);
  r=await api(owner,'/plateforme/entreprises/1/acces-offert','POST',{actif:true});ok('Le propriétaire peut réactiver sans abonnement',r.status===200 && r.data.etat.acces_sans_abonnement);
  r=await api(admin,'/dashboard');ok('Accès offert : exploitation rétablie',r.status===200);
  r=await api(owner,'/plateforme/entreprises/1');ok('Monitoring : stocks, ventes et activité disponibles',Array.isArray(r.data.stocks)&&Array.isArray(r.data.ventes_recentes)&&Array.isArray(r.data.activite));
  r=await api(admin,'/parametres');ok('Marque : nom réel de l’entreprise',r.data.nom_entreprise===db.prepare('SELECT nom FROM entreprises WHERE id=1').get().nom);
  const dom=new JSDOM('<html><body></body></html>',{runScripts:'outside-only',url:BASE});const w=dom.window;
  w.eval(['i18n','i18n-extra','devises'].map(file => fs.readFileSync('public/js/'+file+'.js','utf8')).join('\n'));
  for(const c of ['es','de','zh','ar','ru','it']){w.I18n.langue=c;w.I18n.appliquer();ok('Langue '+c+' et sens de lecture',w.I18n.t('Tableau de bord')!=='Tableau de bord' && w.document.documentElement.dir===(c==='ar'?'rtl':'ltr'));}
  w.Devises.config({devise:'EUR',change:r.data.change});ok('Conversion FCFA → EUR',Math.abs(w.Devises.versAffichage(655.957)-1)<0.00001);ok('Conversion saisie EUR → FCFA',Math.abs(w.Devises.versBase(1)-655.96)<0.001);
  ok('Huit langues enregistrées',Object.keys(w.LANGUES).length===8);
  ok('Carte : aucune collecte de numéro ou cryptogramme',!/name="cb-(?:n[1-4]|cvv)"/.test(fs.readFileSync('public/js/views/abonnement.js','utf8')));
  ok('Produit : prix facultatif dans le formulaire',!/<input[^>]*name="prix_vente"[^>]*required/.test(fs.readFileSync('public/js/views/produits.js','utf8')));
  dom.window.close();
 } finally {
  db.prepare('UPDATE abonnements SET statut=?,date_fin=? WHERE id=?').run(ab.statut,ab.date_fin,ab.id);
  db.prepare("DELETE FROM parametres WHERE entreprise_id=1 AND cle='acces_sans_abonnement'").run();
  if(ancienAcces)db.prepare("INSERT INTO parametres(entreprise_id,cle,valeur) VALUES(1,'acces_sans_abonnement',?)").run(ancienAcces.valeur);
  if(bid){db.prepare('DELETE FROM mouvements_stock WHERE magasin_id=?').run(bid);db.prepare('DELETE FROM stocks WHERE magasin_id=?').run(bid);db.prepare('DELETE FROM magasins WHERE id=?').run(bid);}
  if(pid){db.prepare('DELETE FROM mouvements_stock WHERE produit_id=?').run(pid);db.prepare('DELETE FROM stocks WHERE produit_id=?').run(pid);db.prepare('DELETE FROM produits WHERE id=?').run(pid);}
  db.prepare("DELETE FROM messages WHERE objet LIKE 'TEST réponse%'").run();db.close();
 }
 console.log(n+'/'+n+' vérifications réussies.');
})().catch(e=>{console.error(e);process.exitCode=1;});
