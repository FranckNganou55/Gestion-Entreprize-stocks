import {empreinte} from './auth.mjs';
import {configurationMail} from './mails.mjs';
import {exiger,uid,proprietaire,parametres,jour,assertion} from './db.mjs';
import {etat,tarifs,prolonger} from './abonnement.mjs';
const statsSQL=`SELECT e.*,
 (SELECT COUNT(*) FROM magasins m WHERE m.entreprise_id=e.id) nb_magasins,
 (SELECT COUNT(*) FROM users u WHERE u.entreprise_id=e.id) nb_comptes,
 (SELECT COUNT(*) FROM produits p WHERE p.entreprise_id=e.id) nb_produits,
 (SELECT COUNT(*) FROM clients c WHERE c.entreprise_id=e.id) nb_clients,
 (SELECT COUNT(*) FROM ventes v JOIN magasins m ON m.id=v.magasin_id WHERE m.entreprise_id=e.id AND v.statut='payee') nb_ventes,
 (SELECT IFNULL(SUM(v.total),0) FROM ventes v JOIN magasins m ON m.id=v.magasin_id WHERE m.entreprise_id=e.id AND v.statut='payee') ca_total,
 (SELECT IFNULL(SUM(v.total),0) FROM ventes v JOIN magasins m ON m.id=v.magasin_id WHERE m.entreprise_id=e.id AND v.statut='payee' AND strftime('%Y-%m',v.created_at)=strftime('%Y-%m','now','localtime')) ca_mois,
 (SELECT IFNULL(SUM(v.total),0) FROM ventes v JOIN magasins m ON m.id=v.magasin_id WHERE m.entreprise_id=e.id AND v.statut='payee' AND date(v.created_at)=date('now','localtime')) ca_jour,
 (SELECT IFNULL(SUM(s.quantite*p.prix_vente),0) FROM stocks s JOIN produits p ON p.id=s.produit_id WHERE p.entreprise_id=e.id) valeur_stock,
 (SELECT IFNULL(SUM(montant),0) FROM paiements_abonnement a WHERE a.entreprise_id=e.id AND a.statut='valide') total_paye
 FROM entreprises e`;
async function entreprises(db){
 const liste=await db.all(statsSQL+' ORDER BY e.nom'),subs=await db.all('SELECT * FROM abonnements ORDER BY id DESC'),offerts=await db.all("SELECT entreprise_id FROM parametres WHERE cle='acces_sans_abonnement' AND valeur='1'"),shops=await db.all('SELECT id,entreprise_id,nom,ville,type,actif FROM magasins'),admins=await db.all("SELECT entreprise_id,nom,email FROM users WHERE role='admin' AND actif=1");
 return liste.map(e=>{const a=subs.find(a=>a.entreprise_id===e.id),offert=offerts.some(x=>x.entreprise_id===e.id),expire=!offert&&(!a||a.date_fin<jour()),jours_restants=a?Math.max(0,Math.ceil((new Date(a.date_fin+'T23:59:59+01:00')-Date.now())/86400000)):0;return{...e,magasins:shops.filter(s=>s.entreprise_id===e.id),responsable:admins.find(u=>u.entreprise_id===e.id)||null,abonnement:{...a,expire,actif:!expire,acces_sans_abonnement:offert,jours_restants,statut:offert?'offert':expire?'expire':a.statut,en_essai:!expire&&a?.statut==='essai',alerte_bientot:!offert&&!expire&&jours_restants<=3,statut_libelle:offert?'Accès offert':expire?'Abonnement expiré':a?.statut==='essai'?'Essai gratuit':'Abonnement actif'}};});
}
async function paiements(db,q){let sql='SELECT p.*,e.nom entreprise,e.logo entreprise_logo,e.statut entreprise_statut,u.nom utilisateur,v.nom valide_par_nom FROM paiements_abonnement p LEFT JOIN entreprises e ON e.id=p.entreprise_id LEFT JOIN users u ON u.id=p.user_id LEFT JOIN users v ON v.id=p.valide_par WHERE 1=1',params=[];for(const key of['statut','service','entreprise_id'])if(q?.get(key)){sql+=' AND p.'+key+'=?';params.push(q.get(key));}return db.all(sql+' ORDER BY p.id DESC LIMIT 500',...params);}
export async function routesPlateforme(c){
 const {db,u,p,m,b,q}=c;if(!p.startsWith('/plateforme'))return undefined;proprietaire(u);
 if(p==='/plateforme/entreprises'&&m==='GET'){let r=await entreprises(db);if(q.get('q')){const t=q.get('q').toLowerCase();r=r.filter(e=>(e.nom+' '+e.email+' '+(e.niu||'')).toLowerCase().includes(t));}if(q.get('statut'))r=r.filter(e=>e.statut===q.get('statut'));return r;}
 if(p==='/plateforme/resume'&&m==='GET'){
  const e=await entreprises(db),pay=await db.get("SELECT IFNULL(SUM(CASE WHEN statut='valide' THEN montant ELSE 0 END),0) encaisse,SUM(statut='valide') valides,IFNULL(SUM(CASE WHEN statut='en_attente' THEN montant ELSE 0 END),0) attente,SUM(statut='en_attente') attente_nb FROM paiements_abonnement"),somme=cle=>e.reduce((s,r)=>s+Number(r[cle]||0),0);
  return{nb_entreprises:e.length,nb_actives:e.filter(x=>x.statut==='actif').length,nb_suspendues:e.filter(x=>x.statut==='suspendu').length,nb_essai:e.filter(x=>x.abonnement.en_essai).length,nb_abonnes:e.filter(x=>x.abonnement.statut==='actif').length,nb_expirees:e.filter(x=>x.abonnement.expire).length,nb_magasins:somme('nb_magasins'),nb_comptes:somme('nb_comptes'),nb_produits:somme('nb_produits'),nb_ventes:somme('nb_ventes'),ca_reseau:somme('ca_total'),ca_mois:somme('ca_mois'),encaisse:pay.encaisse,nb_paiements_valides:pay.valides||0,attente_montant:pay.attente,attente_nb:pay.attente_nb||0,mrr_estime:e.filter(x=>x.abonnement.statut==='actif').length*11500,tarifs:await tarifs(db),entreprises:e};
 }
 const reset=p.match(/^\/plateforme\/utilisateurs\/(\d+)\/mot-de-passe$/);
 if(reset&&m==='POST'){const cible=await db.get("SELECT id FROM users WHERE id=? AND entreprise_id IS NOT NULL AND role<>'super_admin'",Number(reset[1]));exiger(cible,'Compte entreprise introuvable.',404);await db.run('UPDATE users SET mot_de_passe=? WHERE id=?',await empreinte(b.mot_de_passe),cible.id);return{ok:true,message:'Mot de passe Cloudflare enregistré.'};}
 const ent=p.match(/^\/plateforme\/entreprises\/(\d+)(?:\/(statut|acces-offert|abonnement))?$/);
 if(ent){const id=Number(ent[1]),e=await db.get(statsSQL+' WHERE e.id=?',id);exiger(e,'Entreprise introuvable.',404);
  if(!ent[2]&&m==='GET'){
   const magasins=await db.all("SELECT m.*,(SELECT COUNT(*) FROM users u WHERE u.magasin_id=m.id) nb_comptes,(SELECT IFNULL(SUM(v.total),0) FROM ventes v WHERE v.magasin_id=m.id AND v.statut='payee') ca_total,(SELECT IFNULL(SUM(v.total),0) FROM ventes v WHERE v.magasin_id=m.id AND v.statut='payee' AND date(v.created_at)=date('now','localtime')) ca_jour,(SELECT IFNULL(SUM(s.quantite*p.prix_vente),0) FROM stocks s JOIN produits p ON p.id=s.produit_id WHERE s.magasin_id=m.id) valeur_stock FROM magasins m WHERE m.entreprise_id=? ORDER BY m.nom",id);
   return{entreprise:e,abonnement:await etat(db,id),magasins,utilisateurs:await db.all('SELECT u.id,u.nom,u.email,u.role,u.actif,u.dernier_login,u.created_at,CASE WHEN u.mot_de_passe LIKE \'pbkdf2-sha256$%\' THEN 0 ELSE 1 END mot_de_passe_a_adapter,m.nom magasin FROM users u LEFT JOIN magasins m ON m.id=u.magasin_id WHERE u.entreprise_id=?',id),paiements:await db.all('SELECT * FROM paiements_abonnement WHERE entreprise_id=? ORDER BY id DESC',id),abonnements:await db.all('SELECT * FROM abonnements WHERE entreprise_id=?',id),top_produits:await db.all("SELECT l.nom_produit nom,SUM(l.quantite) quantite,SUM(l.total) ca FROM ventes_lignes l JOIN ventes v ON v.id=l.vente_id JOIN magasins m ON m.id=v.magasin_id WHERE m.entreprise_id=? AND v.statut='payee' GROUP BY l.nom_produit ORDER BY ca DESC LIMIT 8",id),ventes_recentes:await db.all('SELECT v.*,m.nom magasin FROM ventes v JOIN magasins m ON m.id=v.magasin_id WHERE m.entreprise_id=? ORDER BY v.id DESC LIMIT 20',id),activite:await db.all('SELECT * FROM journal_evenements WHERE entreprise_id=? ORDER BY id DESC LIMIT 30',id),stocks:await db.all('SELECT m.id,m.nom,m.type,IFNULL(SUM(s.quantite),0) quantite FROM magasins m LEFT JOIN stocks s ON s.magasin_id=m.id WHERE m.entreprise_id=? GROUP BY m.id',id)};
  }
  if(ent[2]==='statut'&&m==='POST'){exiger(['actif','suspendu'].includes(b.statut),'État invalide.');await db.run('UPDATE entreprises SET statut=? WHERE id=?',b.statut,id);return{ok:true,message:'État de l’entreprise mis à jour.'};}
  if(ent[2]==='acces-offert'&&m==='POST'){await db.run("INSERT INTO parametres(entreprise_id,cle,valeur) VALUES (?,'acces_sans_abonnement',?) ON CONFLICT(entreprise_id,cle) DO UPDATE SET valeur=excluded.valeur",id,b.actif?'1':'0');return{ok:true,etat:await etat(db,id)};}
  if(ent[2]==='abonnement'&&m==='POST')return{ok:true,etat:await prolonger(db,id,b,u)};
  if(!ent[2]&&m==='DELETE'){await db.run("UPDATE entreprises SET statut='suspendu' WHERE id=?",id);return{ok:true,message:'Entreprise désactivée. L’historique est conservé.'};}
 }
 if(['/plateforme/paiements','/plateforme/ventes'].includes(p)&&m==='GET'){const rows=await paiements(db,q);if(p.endsWith('/ventes')){const somme=st=>rows.filter(r=>r.statut===st).reduce((s,r)=>s+r.montant,0),nb=st=>rows.filter(r=>r.statut===st).length;return{ventes:rows,paiements:rows,nb_resultats:rows.length,totaux:{encaisse:somme('valide'),nb_valides:nb('valide'),attente:somme('en_attente'),nb_attente:nb('en_attente'),rejete:somme('rejete'),nb_rejetes:nb('rejete'),brut_total:somme('valide')+somme('en_attente'),remise_accordee:rows.reduce((s,r)=>s+Math.max(0,(r.montant_brut||r.montant)-r.montant),0)}}};return rows;}
 const pay=p.match(/^\/plateforme\/paiements\/(\d+)(?:\/(valider|rejeter))?$/);
 if(pay){const row=await db.get('SELECT * FROM paiements_abonnement WHERE id=?',Number(pay[1]));exiger(row,'Paiement introuvable.',404);
  if(pay[2]==='rejeter'&&m==='POST'){exiger(row.statut!=='valide','Un paiement validé ne peut pas être rejeté.');await db.run("UPDATE paiements_abonnement SET statut='rejete',message=?,valide_par=?,traite_at=datetime('now','localtime') WHERE id=? AND statut<>'valide'",b.motif||'Rejeté par le propriétaire',u.id,row.id);return{ok:true};}
  if(pay[2]==='valider'&&m==='POST'){
   if(row.statut==='valide')return{ok:true,deja_valide:true};const a=await db.get('SELECT * FROM abonnements WHERE entreprise_id=? ORDER BY id DESC LIMIT 1',row.entreprise_id),debut=a?.date_fin>jour()?a.date_fin:jour(),fin=new Date(new Date(debut+'T12:00:00Z').getTime()+Number(row.duree_jours)*86400000).toISOString().slice(0,10);
   const queries=[...assertion("(SELECT statut FROM paiements_abonnement WHERE id=?)<>'valide'",[row.id]),["UPDATE paiements_abonnement SET statut='valide',valide_par=?,traite_at=datetime('now','localtime') WHERE id=?",u.id,row.id]];
   if(a)queries.push(...assertion('(SELECT date_fin FROM abonnements WHERE id=?)=?',[a.id,a.date_fin]));
   queries.push(a?["UPDATE abonnements SET statut='actif',plan=?,date_fin=?,montant=?,reference=? WHERE id=?",row.plan,fin,row.montant,row.reference,a.id]:["INSERT INTO abonnements(id,entreprise_id,statut,plan,date_debut,date_fin,montant,reference) VALUES (?,?,'actif',?,?,?,?,?)",uid(),row.entreprise_id,row.plan,jour(),fin,row.montant,row.reference]);await db.batch(queries);return{ok:true,etat:await etat(db,row.entreprise_id)};
  }
  if(!pay[2]&&m==='DELETE'){exiger(row.statut!=='valide','Conservez les paiements validés.');await db.run('DELETE FROM paiements_abonnement WHERE id=?',row.id);return{ok:true};}
 }
 if(p==='/plateforme/parametres'&&m==='GET'){
  const valeurs=await parametres(db),secrets=['smtp_pass','paydunya_master_key','paydunya_private_key','paydunya_token','cinetpay_apikey'];const cfg=await configurationMail(db,c.env),smtp={configure:cfg.configure,problemes:cfg.problemes,hote:cfg.host,port:cfg.port,secure:cfg.port===465,mot_de_passe_defini:!!cfg.pass,environnement:['SMTP_HOST','SMTP_PORT','SMTP_USER','SMTP_PASS','MAIL_FROM'].filter(k=>c.env[k])};for(const cle of secrets)delete valeurs[cle];return{valeurs,smtp};
 }
 if(p==='/plateforme/parametres'&&m==='PUT'){
  const autorises=/^(smtp_(host|port|secure|user|pass)|mail_from|app_url|nom_application|logo_application|support_email|whatsapp_support|whatsapp_message|paiement_marchand|paiement_instructions|om_numero|mtn_numero|tarif_mensuel|tarif_annuel|essai_jours|cb_\w+|paydunya_\w+|cinetpay_\w+|psp_actif)$/;
  const queries=Object.entries(b).filter(([k,v])=>autorises.test(k)&&!(k==='smtp_pass'&&!v)).map(([k,v])=>['INSERT INTO parametres(entreprise_id,cle,valeur) VALUES (0,?,?) ON CONFLICT(entreprise_id,cle) DO UPDATE SET valeur=excluded.valeur',k,String(v??'')]);if(queries.length)await db.batch(queries);return{ok:true,message:'Paramètres enregistrés.'};
 }
 if(p==='/plateforme/formules'&&m==='GET')return{formules:await db.all('SELECT * FROM formules ORDER BY ordre,id'),reductions:await db.all('SELECT * FROM reductions ORDER BY id DESC'),tarifs:await tarifs(db),psp:{configure:false,actif:'non_configure',prestataires:[]}};
 const formule=p.match(/^\/plateforme\/formules(?:\/([^/]+))?$/);
 if(formule&&['POST','PUT','DELETE'].includes(m)){
  const ancien=formule[1]?await db.get('SELECT * FROM formules WHERE code=? OR id=?',formule[1],Number(formule[1])||0):null;if(formule[1])exiger(ancien,'Formule introuvable.',404);
  if(m==='DELETE'){await db.run('UPDATE formules SET actif=0 WHERE id=?',ancien.id);return{ok:true};}
  const d={...ancien,...b},code=String(d.code||'').trim().toLowerCase();exiger(/^[a-z0-9_-]{2,40}$/.test(code)&&d.libelle&&Number(d.montant)>0&&Number.isInteger(Number(d.duree_jours))&&Number(d.duree_jours)>0,'Formule invalide.');
  if(ancien)await db.run('UPDATE formules SET libelle=?,montant=?,duree_jours=?,actif=?,ordre=? WHERE id=?',d.libelle,Number(d.montant),Number(d.duree_jours),Number(d.actif??1),Number(d.ordre||0),ancien.id);
  else await db.run('INSERT INTO formules(id,code,libelle,montant,duree_jours,actif,ordre,cree_par) VALUES (?,?,?,?,?,?,?,?)',uid(),code,d.libelle,Number(d.montant),Number(d.duree_jours),Number(d.actif??1),Number(d.ordre||0),u.id);return{ok:true,formule:await db.get('SELECT * FROM formules WHERE code=?',ancien?.code||code)};
 }
 const reduction=p.match(/^\/plateforme\/reductions(?:\/(\d+))?$/);
 if(reduction&&['POST','PUT','DELETE'].includes(m)){
  const ancien=reduction[1]?await db.get('SELECT * FROM reductions WHERE id=?',Number(reduction[1])):null;if(reduction[1])exiger(ancien,'Code introuvable.',404);if(m==='DELETE'){await db.run('UPDATE reductions SET actif=0 WHERE id=?',ancien.id);return{ok:true};}
  const d={...ancien,...b},code=String(d.code||'').trim().toUpperCase();exiger(/^[A-Z0-9_-]{3,40}$/.test(code)&&['pourcentage','montant'].includes(d.type)&&Number(d.valeur)>0&&(d.type!=='pourcentage'||Number(d.valeur)<=100),'Réduction invalide.');
  if(ancien)await db.run('UPDATE reductions SET libelle=?,type=?,valeur=?,actif=?,debut=?,fin=?,max_utilisations=?,formule_code=? WHERE id=?',d.libelle||code,d.type,Number(d.valeur),Number(d.actif??1),d.debut||null,d.fin||null,d.max_utilisations?Number(d.max_utilisations):null,d.formule_code||null,ancien.id);
  else await db.run('INSERT INTO reductions(id,code,libelle,type,valeur,debut,fin,max_utilisations,formule_code,cree_par) VALUES (?,?,?,?,?,?,?,?,?,?)',uid(),code,d.libelle||code,d.type,Number(d.valeur),d.debut||null,d.fin||null,d.max_utilisations?Number(d.max_utilisations):null,d.formule_code||null,u.id);return{ok:true};
 }
 if(p==='/plateforme/mails'&&m==='GET'){const liste=await db.all('SELECT * FROM mails_envoyes ORDER BY id DESC LIMIT 200');const cfg=await configurationMail(db,c.env);return{messages:liste,mails:liste,total:liste.length,validite_codes_minutes:30,smtp:{configure:cfg.configure,problemes:cfg.problemes,hote:cfg.host,port:cfg.port,utilisateur:cfg.user,expediteur:cfg.from,secure:cfg.port===465},stats:{total:liste.length,envoyes:liste.filter(x=>x.statut==='envoye').length,erreurs:liste.filter(x=>x.statut==='erreur').length}};}
 if(p==='/plateforme/classement'&&m==='GET'){const e=(await entreprises(db)).sort((a,b)=>b.ca_total-a.ca_total).map((r,i)=>({...r,rang:i+1,score:Math.round(r.ca_total)}));return{classement:e,entreprises:e,nb_entreprises:e.length,nb_abonnes:e.filter(r=>r.abonnement.actif&&!r.abonnement.en_essai).length,nb_essai:e.filter(r=>r.abonnement.en_essai).length,total_encaisse:e.reduce((s,r)=>s+r.total_paye,0),moyenne_score:e.length?Math.round(e.reduce((s,r)=>s+r.score,0)/e.length):0,poids:{paiements:40,activite:60},total:e.length};}
 return undefined;
}
