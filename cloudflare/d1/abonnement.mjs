import {exiger,uid,jour,parametres,proprietaire} from './db.mjs';
export async function formules(db){return(await db.all('SELECT * FROM formules WHERE actif=1 ORDER BY ordre,duree_jours')).map(f=>({...f,montant_par_mois:Math.round(f.montant/(f.duree_jours/30)),duree_libelle:f.duree_jours+' jours'}));}
export async function tarifs(db){const f=await formules(db),p=await parametres(db);return{mensuel:Number(p.tarif_mensuel||11500),annuel:Number(p.tarif_annuel||132000),essai_jours:Number(p.essai_jours||7),formules:f,economie_annuelle:6000,mensuel_equivalent_annuel:11000};}
export async function etat(db,entreprise){
 const row=entreprise?await db.get('SELECT * FROM abonnements WHERE entreprise_id=? ORDER BY id DESC LIMIT 1',entreprise):null;
 if(!entreprise)return{plateforme:true,expire:false,actif:true,statut:'actif',jours_restants:0,acces_sans_abonnement:true};
 const p=await parametres(db,entreprise),offert=p.acces_sans_abonnement==='1';
 const delai=row?new Date(row.date_fin+'T23:59:59+01:00').getTime()-Date.now():-1;
 const reste=Math.ceil(delai/86400000),expire=!offert&&(!row||delai<0);const statut=offert?'offert':expire?'expire':row.statut;
 return{...row,expire:!offert&&(!row||delai<0),actif:offert||!!row&&delai>=0,jours_restants:Math.max(0,reste),acces_sans_abonnement:offert,statut,en_essai:!offert&&!expire&&row?.statut==='essai',statut_libelle:offert?'Accès offert par le propriétaire':expire?'Abonnement expiré':row?.statut==='essai'?'Essai gratuit':'Abonnement actif',alerte_bientot:!offert&&!expire&&reste<=3,tarifs:await tarifs(db)};
}
export async function verifierAcces(db,u,chemin){
 if(u.role==='super_admin')return;
 exiger(u.entreprise?.statut!=='suspendu','Cette entreprise est suspendue.',403);
 if(!u.email_verifie&&!/^\/(auth|entreprises|abonnement|messages|parametres)/.test(chemin))exiger(false,'Vérifiez votre email pour activer votre espace.',403);
 if(!/^\/(auth|entreprises|abonnement|messages)/.test(chemin)){const e=await etat(db,u.entreprise_id);if(e.expire){const error=new Error('Votre abonnement est expiré. Veuillez le renouveler.');error.status=402;error.details={code:'ABONNEMENT_EXPIRE',etat:e};throw error;}}
}
export async function routesAbonnement(c){
 const {db,u,p,m,b}=c;
 if(p==='/abonnement/etat'&&m==='GET')return await etat(db,u.entreprise_id);
 if(p==='/abonnement'&&m==='GET'){
  const abonnement=await etat(db,u.entreprise_id),paiements=await db.all('SELECT * FROM paiements_abonnement WHERE entreprise_id=? ORDER BY id DESC LIMIT 100',u.entreprise_id),totaux=await db.get("SELECT IFNULL(SUM(CASE WHEN statut='valide' THEN montant ELSE 0 END),0) encaisse,SUM(statut='valide') nb_paiements FROM paiements_abonnement WHERE entreprise_id=?",u.entreprise_id);
  return{...abonnement,etat:abonnement,totaux,paiement_en_attente:paiements.find(p=>p.statut==='en_attente')||null,paiements,historique:paiements,tarifs:await tarifs(db),formules:await formules(db),paiement:{services:{orange_money:{actif:true,nom:'Orange Money'},mtn_momo:{actif:true,nom:'MTN Mobile Money'},mastercard:{actif:true,nom:'Visa / Mastercard'}}},psp:{configure:false,disponible:false}};
 }

 if(p==='/abonnement/reduction/verifier'&&m==='POST'){
  const r=await db.get('SELECT * FROM reductions WHERE code=? AND actif=1',String(b.code||'').trim().toUpperCase());exiger(r,'Code inconnu ou désactivé.');exiger(!r.fin||r.fin>=jour(),'Code expiré.');exiger(!r.debut||r.debut<=jour(),'Code pas encore actif.');
  const f=await db.get('SELECT * FROM formules WHERE code=? AND actif=1',b.plan);exiger(f,'Formule inconnue.');const remise=Math.min(f.montant,r.type==='pourcentage'?Math.round(f.montant*r.valeur/100):r.valeur);return{ok:true,code:r.code,libelle:r.libelle,montant_brut:f.montant,remise,montant:f.montant-remise};
 }
 if(['/abonnement/checkout','/abonnement/payer-carte'].includes(p)&&m==='POST'){const e=new Error('Les paiements en ligne doivent être configurés pour cette version Cloudflare. Aucun prélèvement n’a été effectué.');e.status=503;throw e;}
 return undefined;
}
export async function prolonger(db,id,b,user){
 const e=await db.get('SELECT id FROM entreprises WHERE id=?',id);exiger(e,'Entreprise introuvable.',404);
 const ancien=await db.get('SELECT * FROM abonnements WHERE entreprise_id=? ORDER BY id DESC LIMIT 1',id);
 const f=b.plan?await db.get('SELECT * FROM formules WHERE code=?',b.plan):null;
 const jours=Number(b.jours||f?.duree_jours||30);exiger(Number.isInteger(jours)&&jours>0&&jours<=3660,'Durée invalide.');
 const debut=ancien?.date_fin>jour()?ancien.date_fin:jour(),fin=new Date(new Date(debut+'T12:00:00Z').getTime()+jours*86400000).toISOString().slice(0,10);
 if(ancien)await db.run("UPDATE abonnements SET statut='actif',plan=?,date_fin=?,maj_at=datetime('now','localtime') WHERE id=?",b.plan||ancien.plan||'offert',fin,ancien.id);
 else await db.run("INSERT INTO abonnements (id,entreprise_id,statut,plan,date_debut,date_fin) VALUES (?,?,'actif',?,?,?)",uid(),id,b.plan||'offert',jour(),fin);
 return await etat(db,id);
}
