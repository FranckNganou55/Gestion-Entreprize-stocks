import {autoriser,permission,exiger,uid,magasin,assertion} from './db.mjs';
import {mouvementsLot} from './stock-lot.mjs';
export async function routesAchats(c){
 const {db,u,p,m,b,q}=c;if(!p.startsWith('/achats'))return;
 autoriser(u,'achats.consulter','achats.creer','achats.receptionner');const e=u.entreprise_id;
 const match=p.match(/^\/achats\/(\d+)(?:\/(statut))?$/);
 const base='SELECT c.*,f.nom fournisseur,m.nom magasin FROM commandes_achat c JOIN fournisseurs f ON f.id=c.fournisseur_id JOIN magasins m ON m.id=c.magasin_id WHERE m.entreprise_id=?';
 if(p==='/achats'&&m==='GET'){
  const mid=u.portee==='magasin'?u.magasin_id:Number(q.get('magasin_id'))||null;if(mid)await magasin(db,u,mid);
  const rows=await db.all(base+(mid?' AND c.magasin_id=?':'')+(q.get('statut')?' AND c.statut=?':'')+' ORDER BY c.id DESC LIMIT 300',e,...(mid?[mid]:[]),...(q.get('statut')?[q.get('statut')]:[]));if(!permission(u,'prix.consulter'))rows.forEach(r=>r.total=null);return rows;
 }
 if(p==='/achats'&&m==='POST'){
  autoriser(u,'achats.creer');const mid=Number(b.magasin_id);await magasin(db,u,mid);exiger(await db.get('SELECT id FROM fournisseurs WHERE id=? AND entreprise_id=?',b.fournisseur_id,e),'Fournisseur inconnu.');exiger(Array.isArray(b.lignes)&&b.lignes.length&&b.lignes.length<=150,'Ajoutez entre 1 et 150 articles.');
  const produits=await db.all('SELECT id,prix_achat FROM produits WHERE entreprise_id=? AND id IN (SELECT value FROM json_each(?))',e,JSON.stringify(b.lignes.map(l=>Number(l.produit_id))));const index=new Map(produits.map(p=>[p.id,p]));
  const lignes=b.lignes.map(l=>{const produit=index.get(Number(l.produit_id)),q=Number(l.quantite),prix=Number(l.prix_unitaire??produit?.prix_achat);exiger(produit&&Number.isFinite(q)&&q>0&&Number.isFinite(prix)&&prix>=0,'Article, quantité ou prix invalide.');return{id:uid(),pid:produit.id,q,prix};});exiger(new Set(lignes.map(l=>l.pid)).size===lignes.length,'Regroupez les articles identiques.');
  const id=uid(),ref='CMD-'+id,total=lignes.reduce((s,l)=>s+l.q*l.prix,0);
  await db.batch([['INSERT INTO commandes_achat(id,reference,fournisseur_id,magasin_id,statut,total,note,user_id) VALUES (?,?,?,?,?,?,?,?)',id,ref,b.fournisseur_id,mid,b.statut==='commandee'?'commandee':'brouillon',total,b.note||null,u.id],['INSERT INTO commandes_achat_lignes(id,commande_id,produit_id,quantite,prix_unitaire) SELECT json_extract(value,\'$.id\'),?,json_extract(value,\'$.pid\'),json_extract(value,\'$.q\'),json_extract(value,\'$.prix\') FROM json_each(?)',id,JSON.stringify(lignes)]]);return db.get('SELECT * FROM commandes_achat WHERE id=?',id);
 }
 if(!match)return;const commande=await db.get(base+' AND c.id=?',e,Number(match[1]));exiger(commande,'Commande introuvable.',404);await magasin(db,u,commande.magasin_id);
 if(m==='GET'){commande.lignes=await db.all('SELECT l.*,p.nom produit,p.code code_produit FROM commandes_achat_lignes l JOIN produits p ON p.id=l.produit_id WHERE commande_id=?',commande.id);if(!permission(u,'prix.consulter')){commande.total=null;commande.lignes.forEach(l=>l.prix_unitaire=null);}return commande;}
 if(match[2]&&['POST','PUT'].includes(m)){
  autoriser(u,b.statut==='recue'?'achats.receptionner':'achats.creer');exiger(['brouillon','commandee','recue','annulee'].includes(b.statut),'Statut invalide.');exiger(!['recue','annulee'].includes(commande.statut),'Commande déjà terminée.');
  const queries=[...assertion('(SELECT statut FROM commandes_achat WHERE id=?)=?',[commande.id,commande.statut])];
  if(b.statut==='recue'){const lignes=await db.all('SELECT * FROM commandes_achat_lignes WHERE commande_id=?',commande.id);queries.push(...await mouvementsLot(db,u,commande.magasin_id,lignes,{type:'entree',reference:commande.reference,motif:'Réception commande'}));queries.push(['UPDATE produits SET prix_achat=(SELECT prix_unitaire FROM commandes_achat_lignes l WHERE l.commande_id=? AND l.produit_id=produits.id) WHERE entreprise_id=? AND id IN(SELECT produit_id FROM commandes_achat_lignes WHERE commande_id=? AND prix_unitaire>0)',commande.id,e,commande.id]);}
  queries.push(['UPDATE commandes_achat SET statut=?,reception_at=CASE WHEN ?=\'recue\' THEN datetime(\'now\',\'localtime\') ELSE reception_at END WHERE id=?',b.statut,b.statut,commande.id]);await db.batch(queries);return{ok:true,statut:b.statut};
 }
 if(m==='DELETE'){autoriser(u,'achats.creer');exiger(commande.statut!=='recue','Une commande reçue ne peut être supprimée.');await db.batch([...assertion('(SELECT statut FROM commandes_achat WHERE id=?)<>\'recue\'',[commande.id]),['DELETE FROM commandes_achat WHERE id=?',commande.id]]);return{ok:true};}
}
