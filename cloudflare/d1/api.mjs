import {limiter,limiterConnexion} from './limites.mjs';
import {routesDevises} from './devises.mjs';
import {routesRH} from './rh.mjs';
import {routesMails,envoyerVerification} from './mails.mjs';
import {routesAchats} from './achats.mjs';
import {routesInventaires} from './inventaires.mjs';
import {connexion,json,exiger,MetierErreur,uid,jour,parametres,autoriser,avecIdentifiants} from './db.mjs';
import {authentifier,empreinte,verifierMotDePasse,signer,profil,initialiserProprietaire} from './auth.mjs';
import {routesAbonnement,verifierAcces,tarifs} from './abonnement.mjs';
import {routesCatalogue} from './catalogue.mjs';
import {routesVentes} from './ventes.mjs';
import {routesAdministration} from './administration.mjs';
import {routesTiers} from './tiers.mjs';
import {routesMessages} from './messages.mjs';
import {routesPlateforme} from './plateforme.mjs';
import {routesRapports} from './rapports.mjs';
export async function traiterApi(request,env,ctx){
 const chemin=new URL(request.url).pathname.replace(/\/+$/,'');
 try{return await avecIdentifiants(env.DB,()=>traiterRequete(request,env,ctx),!['GET','HEAD'].includes(request.method)&&chemin!=='/api/auth/login');}
 catch(e){console.error('D1_INIT',e.message);return erreurQuota(e)||json({erreur:e.status?e.message:'Le stockage est temporairement indisponible. Réessayez dans quelques instants.',code:'D1_INDISPONIBLE'},e.status||503);}
}
function erreurQuota(e){
 if(!/exceeded.*daily row (write|read) limit/i.test(e.message||''))return null;
 const ecriture=/daily row write limit/i.test(e.message),reprise=new Date();reprise.setUTCHours(24,0,0,0);
 return json({erreur:'Le quota quotidien gratuit '+(ecriture?'d’écriture':'de lecture')+' Cloudflare est atteint. Il se réinitialise à 1 h du matin, heure locale. Aucun abonnement payant n’a été activé.',code:ecriture?'D1_QUOTA_ECRITURE':'D1_QUOTA_LECTURE',reprise_at:reprise.toISOString()},503);
}
async function traiterRequete(request,env,ctx){
 try{
  const db=connexion(env.DB),url=new URL(request.url),p=url.pathname.replace(/^\/api/,'').replace(/\/$/,'')||'/',m=request.method;
  if(url.pathname==='/healthz'){await db.get('SELECT 1 ok');return json({ok:true,moteur:'d1'});}
  let b={};if(!['GET','HEAD'].includes(m)){const texte=await request.text();exiger(texte.length<=15*1024*1024,'Requête trop volumineuse.',413);try{b=texte?JSON.parse(texte):{};}catch{throw new MetierErreur('Le corps doit être un JSON valide.');}exiger(b&&typeof b==='object'&&!Array.isArray(b),'Objet JSON attendu.');}
  if(p==='/sante')return json({ok:true,application:'Inventa GestyPro',stockage:{moteur:'d1'}});
  if(p==='/installation'&&m==='POST'){await initialiserProprietaire(db,env);return json({ok:true,message:'Propriétaire configuré. Connectez-vous.'});}
  if(p==='/auth/support'){const params=await parametres(db);return json({numero:params.whatsapp_support||'',email:params.support_email||'',lien:'https://wa.me/'+String(params.whatsapp_support||'').replace(/\D/g,'')});}
  if(p==='/entreprises/etat')return json({tarifs:await tarifs(db),support:{},services:{},nb_entreprises:(await db.get('SELECT COUNT(*) n FROM entreprises')).n});
  if(['/auth/email-disponible','/entreprises/email-disponible'].includes(p))return json({email:url.searchParams.get('email'),disponible:!await db.get('SELECT id FROM users WHERE email=?',String(url.searchParams.get('email')||'').trim().toLowerCase())});
  if(p==='/auth/login'&&m==='POST'){
   const email=String(b.email||'').trim().toLowerCase();exiger(email&&typeof b.mot_de_passe==='string','Email et mot de passe obligatoires.');
   await limiterConnexion(env,email);
   const u=await db.get('SELECT * FROM users WHERE email=?',email);exiger(u&&u.actif,'Identifiants incorrects.',401);
   exiger(await verifierMotDePasse(b.mot_de_passe,u.mot_de_passe),'Identifiants incorrects.',401);
   const token=await signer(u,env.JWT_SECRET);return json({token,utilisateur:await profil(db,u)});
  }
  if((p==='/entreprises/inscription'||p==='/entreprises')&&m==='POST'){
   await limiter(db,request,'inscription',5,3600000);const email=String(b.email||'').trim().toLowerCase();exiger(b.nom?.trim()&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),'Nom d’entreprise et email valides requis.');const hash=await empreinte(b.mot_de_passe);exiger(!await db.get('SELECT id FROM users WHERE email=?',email),'Cette adresse possède déjà un compte.');
   const e=uid(),mid=uid(),id=uid(),debut=jour(),fin=new Date(Date.now()+7*86400000).toISOString().slice(0,10),logo=String(b.logo||'');exiger(!logo||logo.startsWith('data:image/')&&logo.length<=900000,'Logo invalide ou trop volumineux.');
   await db.batch([['INSERT INTO entreprises(id,nom,email,nom_contact,prenom_contact,telephone,ville,pays,date_creation,niu,logo) VALUES (?,?,?,?,?,?,?,?,?,?,?)',e,b.nom.trim(),email,b.nom_contact||null,b.prenom_contact||null,b.telephone||null,b.ville||null,b.pays||'Cameroun',b.date_creation||null,b.niu||null,logo||null],['INSERT INTO magasins(id,entreprise_id,code,nom,ville,type) VALUES (?,?,?,?,?,\'boutique\')',mid,e,'BQ-'+mid,b.boutique_nom||b.boutique||'Boutique principale',b.ville||null],['INSERT INTO users(id,entreprise_id,nom,email,mot_de_passe,role,actif,email_verifie) VALUES (?,?,?,?,?,\'admin\',1,0)',id,e,[b.prenom_contact,b.nom_contact].filter(Boolean).join(' ')||b.nom,email,hash],['INSERT INTO abonnements(id,entreprise_id,statut,plan,date_debut,date_fin) VALUES (?,?,\'essai\',\'essai\',?,?)',uid(),e,debut,fin],['INSERT INTO parametres(entreprise_id,cle,valeur) VALUES (?,\'nom_entreprise\',?)',e,b.nom.trim()]]);
   const u=await db.get('SELECT * FROM users WHERE id=?',id);const verification=await envoyerVerification(db,env,u);return json({verification,token:await signer(u,env.JWT_SECRET),utilisateur:await profil(db,u),entreprise:{id:e,nom:b.nom},verification_requise:true},201);
  }
  const u=await authentifier(request,db,env);await verifierAcces(db,u,p);
  if(p==='/auth/me')return json({utilisateur:u});
  if(p==='/auth/deconnexion')return json({ok:true});
  if(p==='/auth/mot-de-passe'&&m==='POST'){const actuel=await db.get('SELECT mot_de_passe FROM users WHERE id=?',u.id);exiger(await verifierMotDePasse(b.ancien,actuel.mot_de_passe),'Mot de passe actuel incorrect.');await db.run('UPDATE users SET mot_de_passe=? WHERE id=?',await empreinte(b.nouveau),u.id);return json({ok:true});}
  if(p==='/auth/profil'&&m==='PUT'){exiger(b.nom?.trim(),'Nom obligatoire.');await db.run('UPDATE users SET nom=?,langue=? WHERE id=?',b.nom.trim(),b.langue||u.langue,u.id);return json({ok:true,utilisateur:await profil(db,await db.get('SELECT * FROM users WHERE id=?',u.id))});}
  if(p==='/entreprises/moi'&&m==='GET')return json({entreprise:u.entreprise,abonnement:await routesAbonnement({db,u,p:'/abonnement/etat',m:'GET'})});
  if(p==='/evenements'||p==='/evenements/etat'){
   const params=u.role==='super_admin'?[]:[u.entreprise_id||-1],filtre=u.role==='super_admin'?'':' WHERE entreprise_id=?',scope=u.portee==='magasin'?' AND (magasin_id=? OR magasin_id IS NULL)':'';if(u.portee==='magasin')params.push(u.magasin_id);
   const clause=filtre+scope,dernier=await db.get('SELECT COUNT(*) nb,IFNULL(MAX(id),0) dernier_id FROM journal_evenements'+clause,...params);if(p.endsWith('/etat'))return json({...dernier,maintenant:new Date().toISOString()});
   const lignes=await db.all('SELECT * FROM journal_evenements'+(clause||' WHERE 1=1')+' AND id>? ORDER BY id LIMIT 100',...params,Number(url.searchParams.get('depuis'))||0);return json({dernier_id:dernier.dernier_id,nb_nouveaux:lignes.length,evenements:lignes,maintenant:new Date().toISOString()});
  }
  if(p==='/entreprises/moi'&&m==='PUT'){
   autoriser(u,'parametres.gerer');exiger(u.entreprise_id,'Entreprise requise.');const cols=['nom','email','nom_contact','prenom_contact','telephone','ville','pays','date_creation','niu','logo'].filter(k=>Object.hasOwn(b,k));exiger(cols.length,'Aucun champ à modifier.');if(b.logo)exiger(String(b.logo).startsWith('data:image/')&&b.logo.length<=900000,'Logo invalide.');if(b.nom!==undefined)exiger(String(b.nom).trim(),'Nom obligatoire.');await db.run('UPDATE entreprises SET '+cols.map(k=>k+'=?').join(',')+' WHERE id=?',...cols.map(k=>b[k]),u.entreprise_id);return json({ok:true,entreprise:await db.get('SELECT * FROM entreprises WHERE id=?',u.entreprise_id)});
  }

  const c={db,u,p,m,b,q:url.searchParams,env,ctx,request};
  for(const route of [routesDevises,routesRH,routesMails,routesPlateforme,routesRapports,routesAchats,routesInventaires,routesAbonnement,routesMessages,routesAdministration,routesCatalogue,routesVentes,routesTiers]){const resultat=await route(c);if(resultat!==undefined)return resultat instanceof Response?resultat:json(resultat,m==='POST'?201:200);}
  throw new MetierErreur('Cette route n’est pas disponible dans la version D1.',404);
 }catch(e){
  const quota=erreurQuota(e);if(quota)return quota;
  if(/UNIQUE constraint failed/i.test(e.message))return json({erreur:'Cet enregistrement existe déjà.'},409);
  if(/CHECK constraint failed/i.test(e.message))return json({erreur:'Les données ont changé pendant l’opération. Actualisez et recommencez.'},409);
  if(e instanceof MetierErreur||e.status)return json({erreur:e.message,...e.details},e.status||400);
  console.error('Erreur D1',e.message);return json({erreur:'Le serveur n’a pas pu terminer cette opération. Contactez le propriétaire.'},500);
 }
}
