import {mouvementsLot} from './stock-lot.mjs';
import {autoriser,administrateur,exiger,uid,magasin,filtreMagasin,assertion,jour} from './db.mjs';
import {mouvement} from './catalogue.mjs';
export async function promo(db,e,code,client,montant){
 const p=await db.get('SELECT * FROM promotions_clients WHERE entreprise_id=? AND code=?',e,String(code||'').trim().toUpperCase());exiger(p&&p.actif,'Code promo inconnu ou désactivé.');exiger(!p.debut||p.debut<=jour(),'Ce code n’est pas encore valable.');exiger(!p.fin||p.fin>=jour(),'Ce code est expiré.');exiger(!p.client_id||p.client_id===Number(client),'Ce code est réservé à un autre client.');exiger(!p.maximum_usages||p.utilisations<p.maximum_usages,'La limite d’utilisation est atteinte.');exiger(Number.isFinite(montant)&&montant>0&&montant>=p.minimum,'Le panier n’atteint pas le montant minimum.');const remise=Math.min(montant,Math.round(p.type==='pourcentage'?montant*p.valeur/100:p.valeur));return{...p,remise,total:montant-remise};
}
export async function routesVentes(c){
 const {db,u,p,m,b,q}=c,e=u.entreprise_id;
 if(p==='/promotions-clients'&&m==='GET'){administrateur(u);return db.all('SELECT p.*,c.nom client FROM promotions_clients p LEFT JOIN clients c ON c.id=p.client_id WHERE p.entreprise_id=? ORDER BY p.id DESC',e);}
 if(p==='/promotions-clients'&&m==='POST'){
  administrateur(u);const code=String(b.code||'').trim().toUpperCase(),v=Number(b.valeur),minimum=Number(b.minimum||0),max=b.maximum_usages?Number(b.maximum_usages):null;
  exiger(/^[A-Z0-9_-]{3,40}$/.test(code)&&['montant','pourcentage'].includes(b.type)&&Number.isFinite(v)&&v>0&&(b.type!=='pourcentage'||v<=100),'Code ou remise invalide.');exiger(Number.isFinite(minimum)&&minimum>=0&&(!max||Number.isInteger(max)&&max>0),'Minimum ou limite invalide.');
  for(const date of [b.debut,b.fin])if(date)exiger(/^\d{4}-\d{2}-\d{2}$/.test(date)&&new Date(date).toISOString().slice(0,10)===date,'Date invalide.');exiger(!b.debut||!b.fin||b.debut<=b.fin,'Période invalide.');
  if(b.client_id)exiger(await db.get('SELECT id FROM clients WHERE id=? AND entreprise_id=?',Number(b.client_id),e),'Client inconnu.');
  const id=uid();await db.run('INSERT INTO promotions_clients(id,entreprise_id,code,type,valeur,client_id,debut,fin,minimum,maximum_usages) VALUES (?,?,?,?,?,?,?,?,?,?)',id,e,code,b.type,v,b.client_id||null,b.debut||null,b.fin||null,minimum,max);return db.get('SELECT * FROM promotions_clients WHERE id=?',id);
 }
 const pr=p.match(/^\/promotions-clients\/(\d+)$/);if(pr&&m==='PUT'){administrateur(u);await db.run('UPDATE promotions_clients SET actif=? WHERE id=? AND entreprise_id=?',b.actif?1:0,Number(pr[1]),e);return{ok:true};}
 if(p==='/caisse/promo/verifier'&&m==='POST'){autoriser(u,'caisse.utiliser');const r=await promo(db,e,b.code,b.client_id,Number(b.montant));return{id:r.id,code:r.code,type:r.type,valeur:r.valeur,remise:r.remise,total:r.total};}
 if(p==='/caisse/session'&&m==='GET'){
  autoriser(u,'caisse.utiliser');const mid=u.portee==='magasin'?u.magasin_id:Number(q.get('magasin_id'));await magasin(db,u,mid);
  return{jour:await db.get("SELECT COUNT(*) nb,IFNULL(SUM(total),0) ca FROM ventes WHERE magasin_id=? AND statut='payee' AND date(created_at)=date('now','localtime')",mid),derniere:await db.all('SELECT reference,total,mode_paiement,created_at FROM ventes WHERE magasin_id=? ORDER BY id DESC LIMIT 5',mid)};
 }
 if(p==='/ventes'&&m==='GET'){
  autoriser(u,'ventes.consulter');const f=filtreMagasin(u),params=[e,...f.params];let filtre=f.sql;
  for(const [key,col] of [['client_id','v.client_id'],['user_id','v.user_id'],['statut','v.statut'],['mode_paiement','v.mode_paiement']])if(q.get(key)){filtre+=' AND '+col+'=?';params.push(q.get(key));}
  for(const [key,cmp] of [['debut','>='],['fin','<=']])if(q.get(key)){filtre+=' AND date(v.created_at)'+cmp+'date(?)';params.push(q.get(key));}
  if(q.get('magasin_id')&&u.portee!=='magasin'){filtre+=' AND m.id=?';params.push(Number(q.get('magasin_id')));}
  const rows=await db.all('SELECT v.*,m.nom magasin,c.nom client,u.nom caissier,(SELECT SUM(quantite) FROM ventes_lignes l WHERE l.vente_id=v.id) nb_articles FROM ventes v JOIN magasins m ON m.id=v.magasin_id LEFT JOIN clients c ON c.id=v.client_id LEFT JOIN users u ON u.id=v.user_id WHERE m.entreprise_id=?'+filtre+' ORDER BY v.id DESC LIMIT 500',...params);return{ventes:rows,total_affiche:rows.filter(r=>r.statut==='payee').reduce((s,r)=>s+r.total,0)};
 }
 const detail=p.match(/^\/ventes\/(\d+)$/);
 if(detail&&m==='GET'){
  autoriser(u,'ventes.consulter');const r=await db.get('SELECT v.*,m.nom magasin,m.adresse magasin_adresse,m.telephone magasin_tel,c.nom client,c.telephone client_tel,u.nom caissier FROM ventes v JOIN magasins m ON m.id=v.magasin_id LEFT JOIN clients c ON c.id=v.client_id LEFT JOIN users u ON u.id=v.user_id WHERE v.id=? AND m.entreprise_id=?',Number(detail[1]),e);exiger(r,'Vente introuvable.',404);await magasin(db,u,r.magasin_id);r.lignes=await db.all('SELECT * FROM ventes_lignes WHERE vente_id=?',r.id);r.parametres=Object.fromEntries((await db.all('SELECT cle,valeur FROM parametres WHERE entreprise_id IN (0,?) ORDER BY entreprise_id',e)).filter(x=>!(/smtp|pass|secret|apikey|private|token|master_key/i.test(x.cle))).map(x=>[x.cle,x.valeur]));return r;
 }
 if(p==='/ventes'&&m==='POST'){
  autoriser(u,'caisse.utiliser');const mid=u.portee==='magasin'?u.magasin_id:Number(b.magasin_id),point=await magasin(db,u,mid);exiger(point.actif&&point.type==='boutique','Cette boutique ne peut pas encaisser.');exiger(Array.isArray(b.lignes)&&b.lignes.length&&b.lignes.length<=150,'Panier vide ou trop volumineux.');
  if(b.client_id)exiger(await db.get('SELECT id FROM clients WHERE id=? AND entreprise_id=?',b.client_id,e),'Client inconnu.');
  const catalogue=await db.all("SELECT p.id,p.nom,p.prix_vente,p.actif,IFNULL(s.quantite,0) stock FROM produits p LEFT JOIN stocks s ON s.produit_id=p.id AND s.magasin_id=? WHERE p.entreprise_id=? AND p.id IN(SELECT CAST(value AS INTEGER) FROM json_each(?))",mid,e,JSON.stringify(b.lignes.map(l=>Number(l.produit_id))));
  const details=[],produits=new Set();let sousTotal=0,remises=0;
  for(const l of b.lignes){const pid=Number(l.produit_id);exiger(!produits.has(pid),'Regroupez les quantités de chaque produit.');produits.add(pid);const produit=catalogue.find(p=>p.id===pid&&p.actif);exiger(produit,'Produit inconnu.');
   const quantite=Number(l.quantite),prix=(['admin','gestionnaire'].includes(u.role)||!produit.prix_vente)&&l.prix_unitaire!==undefined?Number(l.prix_unitaire):Number(produit.prix_vente),remise=Number(l.remise||0);exiger(Number.isFinite(quantite)&&quantite>0&&Number.isFinite(prix)&&prix>0&&Number.isFinite(remise)&&remise>=0&&remise<=prix*quantite,'Prix, quantité ou remise invalide.');exiger(produit.stock>=quantite,'Stock insuffisant.');details.push({produit,quantite,prix,remise});sousTotal+=prix*quantite;remises+=remise;
  }
  let promotion;if(b.code_promo){promotion=await promo(db,e,b.code_promo,b.client_id,sousTotal);exiger(!remises&&!Number(b.remise),'Le code ne se cumule pas avec une remise manuelle.');}
  const globale=promotion?promotion.remise:Number(b.remise||0);exiger(Number.isFinite(globale)&&globale>=0&&globale+remises<=sousTotal,'Remise invalide.');
  const total=sousTotal-remises-globale,mode=['especes','mobile_money','carte','credit'].includes(b.mode_paiement)?b.mode_paiement:'especes',paye=mode==='credit'?0:Number(b.montant_paye??total);exiger(Number.isFinite(paye)&&paye>=0&&(mode==='credit'||paye>=total),'Montant reçu insuffisant.');
  const id=uid(),reference='VTE-'+id,queries=[];
  const articles=JSON.stringify(details.map(d=>({ligne_id:uid(),mouvement_id:uid(),pid:d.produit.id,nom:d.produit.nom,q:d.quantite,prix:d.prix,origine:d.produit.prix_vente,stock:d.produit.stock,remise:d.remise})));
  queries.push(...assertion("(SELECT COUNT(*) FROM json_each(?) j JOIN stocks s ON s.produit_id=json_extract(j.value,'$.pid') AND s.magasin_id=? JOIN produits p ON p.id=s.produit_id WHERE s.quantite=json_extract(j.value,'$.stock') AND s.quantite>=json_extract(j.value,'$.q') AND p.actif=1 AND p.entreprise_id=? AND p.prix_vente=json_extract(j.value,'$.origine'))=? AND EXISTS(SELECT 1 FROM magasins WHERE id=? AND actif=1 AND type='boutique')",[articles,mid,e,details.length,mid]));
  if(promotion){queries.push(...assertion('(SELECT utilisations FROM promotions_clients WHERE id=?)=? AND (SELECT actif FROM promotions_clients WHERE id=?)=1',[promotion.id,promotion.utilisations,promotion.id]));queries.push(['UPDATE promotions_clients SET utilisations=utilisations+1 WHERE id=?',promotion.id]);}
  queries.push(['INSERT INTO ventes(id,reference,magasin_id,client_id,user_id,sous_total,remise,tva,total,mode_paiement,montant_paye,monnaie,statut,note) VALUES (?,?,?,?,?,?,?,0,?,?,?,?,\'payee\',?)',id,reference,mid,b.client_id||null,u.id,sousTotal,remises+globale,total,mode,paye,Math.max(0,paye-total),[b.note,promotion?'Code promo : '+promotion.code:''].filter(Boolean).join(' · ')||null]);
  queries.push(["INSERT INTO ventes_lignes(id,vente_id,produit_id,nom_produit,quantite,prix_unitaire,remise,total) SELECT json_extract(value,'$.ligne_id'),?,json_extract(value,'$.pid'),json_extract(value,'$.nom'),json_extract(value,'$.q'),json_extract(value,'$.prix'),json_extract(value,'$.remise'),json_extract(value,'$.q')*json_extract(value,'$.prix')-json_extract(value,'$.remise') FROM json_each(?)",id,articles]);
  queries.push(["INSERT INTO mouvements_stock(id,produit_id,magasin_id,type,quantite,quantite_avant,quantite_apres,motif,reference,user_id) SELECT json_extract(value,'$.mouvement_id'),json_extract(value,'$.pid'),?,'vente',-json_extract(value,'$.q'),json_extract(value,'$.stock'),json_extract(value,'$.stock')-json_extract(value,'$.q'),?,?,? FROM json_each(?)",mid,'Vente '+reference,reference,u.id,articles]);
  queries.push(["UPDATE stocks SET quantite=quantite-(SELECT json_extract(value,'$.q') FROM json_each(?) WHERE json_extract(value,'$.pid')=stocks.produit_id),maj_at=datetime('now','localtime') WHERE magasin_id=? AND produit_id IN(SELECT json_extract(value,'$.pid') FROM json_each(?))",articles,mid,articles]);
  queries.push(["UPDATE produits SET prix_vente=(SELECT json_extract(value,'$.prix') FROM json_each(?) WHERE json_extract(value,'$.pid')=produits.id) WHERE entreprise_id=? AND prix_vente=0 AND id IN(SELECT json_extract(value,'$.pid') FROM json_each(?))",articles,e,articles]);
  if(b.client_id)queries.push(['UPDATE clients SET points=points+? WHERE id=?',Math.floor(total/5000),b.client_id]);
  if(promotion)queries.push(['INSERT INTO promotions_utilisations(id,promotion_id,vente_id,remise) VALUES (?,?,?,?)',uid(),promotion.id,id,promotion.remise]);
  queries.push(['INSERT INTO journal_evenements(id,entreprise_id,magasin_id,type,libelle,montant,reference,user_id,auteur) VALUES (?,?,?,\'vente\',?,?,?,?,?)',uid(),e,mid,'Vente '+reference,total,reference,u.id,u.nom]);await db.batch(queries);return db.get('SELECT * FROM ventes WHERE id=?',id);
 }
 const ann=p.match(/^\/ventes\/(\d+)\/annuler$/);if(ann&&m==='POST'){
  autoriser(u,'ventes.annuler');const v=await db.get('SELECT v.* FROM ventes v JOIN magasins m ON m.id=v.magasin_id WHERE v.id=? AND m.entreprise_id=?',Number(ann[1]),e);exiger(v&&v.statut==='payee','Vente introuvable ou déjà annulée.');await magasin(db,u,v.magasin_id);const lignes=await db.all('SELECT * FROM ventes_lignes WHERE vente_id=?',v.id),queries=[...assertion("(SELECT statut FROM ventes WHERE id=?)='payee'",[v.id])];if(lignes.some(l=>l.produit_id))queries.push(...await mouvementsLot(db,u,v.magasin_id,lignes.filter(l=>l.produit_id),{type:'retour',reference:v.reference,motif:'Annulation de vente'}));queries.push(["UPDATE ventes SET statut='annulee' WHERE id=?",v.id]);if(v.client_id)queries.push(['UPDATE clients SET points=MAX(0,points-?) WHERE id=?',Math.floor(v.total/5000),v.client_id]);await db.batch(queries);return{ok:true};
 }
 return undefined;
}
