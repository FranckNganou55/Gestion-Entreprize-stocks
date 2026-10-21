import {exiger,uid,magasin,assertion} from './db.mjs';
/** Une seule lecture et un lot atomique, quel que soit le nombre d'articles. */
export async function mouvementsLot(db,u,mid,lignes,{type,reference,motif}={}){
 await magasin(db,u,mid);exiger(lignes.length>0&&lignes.length<=500,'Entre 1 et 500 articles sont attendus.');
 const pids=lignes.map(l=>Number(l.produit_id));exiger(new Set(pids).size===pids.length,'Un produit ne peut apparaître qu’une fois.');
 const produits=await db.all('SELECT p.id,IFNULL(s.quantite,0) stock FROM produits p LEFT JOIN stocks s ON s.produit_id=p.id AND s.magasin_id=? WHERE p.entreprise_id=? AND p.id IN(SELECT value FROM json_each(?))',mid,u.entreprise_id,JSON.stringify(pids));
 const index=new Map(produits.map(p=>[p.id,p]));
 const lignesStock=lignes.map(l=>{const p=index.get(Number(l.produit_id)),q=Number(l.quantite);exiger(p,'Produit hors de votre entreprise.');exiger(Number.isFinite(q)&&q!==0,'Quantité invalide.');exiger(p.stock+q>=0,'Stock insuffisant.');return{pid:p.id,q,avant:p.stock,apres:p.stock+q,sid:uid(),id:uid()};});
 const data=JSON.stringify(lignesStock);
 return [
 ...assertion('NOT EXISTS(SELECT 1 FROM json_each(?) j WHERE IFNULL((SELECT quantite FROM stocks WHERE produit_id=json_extract(j.value,\'$.pid\') AND magasin_id=?),0)<>json_extract(j.value,\'$.avant\'))',[data,mid]),
 ['INSERT INTO stocks(id,produit_id,magasin_id,quantite) SELECT json_extract(value,\'$.sid\'),json_extract(value,\'$.pid\'),?,json_extract(value,\'$.apres\') FROM json_each(?) WHERE 1 ON CONFLICT(produit_id,magasin_id) DO UPDATE SET quantite=excluded.quantite,maj_at=datetime(\'now\',\'localtime\')',mid,data],
 ['INSERT INTO mouvements_stock(id,produit_id,magasin_id,type,quantite,quantite_avant,quantite_apres,reference,motif,user_id) SELECT json_extract(value,\'$.id\'),json_extract(value,\'$.pid\'),?,?,json_extract(value,\'$.q\'),json_extract(value,\'$.avant\'),json_extract(value,\'$.apres\'),?,?,? FROM json_each(?)',mid,type||'ajustement',reference||null,motif||null,u.id,data]
 ];
}
