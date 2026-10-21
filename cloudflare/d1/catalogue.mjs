import {mouvementsLot} from './stock-lot.mjs';
import {autoriser,exiger,uid,magasin,filtreMagasin,permission,assertion} from './db.mjs';
export async function mouvement(db,u,{produit_id,magasin_id,quantite,type,motif='',reference=''}){
 const q=Number(quantite);exiger(Number.isFinite(q)&&q!==0,'Quantité invalide.');
 await magasin(db,u,magasin_id);exiger(await db.get('SELECT id FROM produits WHERE id=? AND entreprise_id=?',produit_id,u.entreprise_id),'Produit introuvable.',404);
 const stock=await db.get('SELECT * FROM stocks WHERE produit_id=? AND magasin_id=?',produit_id,magasin_id),avant=Number(stock?.quantite||0),apres=avant+q;
 exiger(apres>=0,'Stock insuffisant.');
 const guard=stock?assertion('(SELECT quantite FROM stocks WHERE id=?)=?',[stock.id,avant]):assertion('NOT EXISTS(SELECT 1 FROM stocks WHERE produit_id=? AND magasin_id=?)',[produit_id,magasin_id]);
 return [...guard,[`INSERT INTO stocks(id,produit_id,magasin_id,quantite) VALUES (?,?,?,?) ON CONFLICT(produit_id,magasin_id) DO UPDATE SET quantite=excluded.quantite,maj_at=datetime('now','localtime')`,stock?.id||uid(),produit_id,magasin_id,apres],['INSERT INTO mouvements_stock(id,produit_id,magasin_id,type,quantite,quantite_avant,quantite_apres,motif,reference,user_id) VALUES (?,?,?,?,?,?,?,?,?,?)',uid(),produit_id,magasin_id,type,q,avant,apres,motif,reference,u.id]];
}
export async function routesCatalogue(c){
 const {db,u,p,m,b,q}=c,e=u.entreprise_id;
 if(p==='/categories'&&m==='GET'){autoriser(u,'produits.consulter','caisse.utiliser');return db.all('SELECT * FROM categories WHERE entreprise_id=? ORDER BY nom',e);}
 if(p==='/categories'&&m==='POST'){autoriser(u,'produits.gerer');exiger(b.nom?.trim(),'Nom obligatoire.');const id=uid();await db.run('INSERT INTO categories(id,entreprise_id,nom,couleur) VALUES (?,?,?,?)',id,e,b.nom.trim(),b.couleur||'#0f766e');return db.get('SELECT * FROM categories WHERE id=?',id);}
 const cat=p.match(/^\/categories\/(\d+)$/);
 if(cat){autoriser(u,'produits.gerer');const id=Number(cat[1]);exiger(await db.get('SELECT id FROM categories WHERE id=? AND entreprise_id=?',id,e),'Catégorie introuvable.',404);if(m==='PUT'){await db.run('UPDATE categories SET nom=?,couleur=? WHERE id=?',b.nom,b.couleur||'#0f766e',id);return{ok:true};}if(m==='DELETE'){await db.run('UPDATE produits SET categorie_id=NULL WHERE categorie_id=? AND entreprise_id=?',id,e);await db.run('DELETE FROM categories WHERE id=?',id);return{ok:true};}}
 if(p==='/produits'&&m==='GET'){
  autoriser(u,'produits.consulter','caisse.utiliser');const mid=u.portee==='magasin'?u.magasin_id:Number(q.get('magasin_id'))||0;if(mid)await magasin(db,u,mid);
  const params=[mid,e];let sql=`SELECT p.*,c.nom categorie,c.couleur categorie_couleur,IFNULL((SELECT SUM(s.quantite) FROM stocks s WHERE s.produit_id=p.id),0) stock_total,IFNULL((SELECT SUM(s.quantite) FROM stocks s WHERE s.produit_id=p.id AND s.magasin_id=?),0) stock_magasin FROM produits p LEFT JOIN categories c ON c.id=p.categorie_id WHERE p.entreprise_id=?`;
  if(q.has('actif')){sql+=' AND p.actif=?';params.push(Number(q.get('actif')));}
  if(q.get('categorie_id')){sql+=' AND p.categorie_id=?';params.push(Number(q.get('categorie_id')));}
  if(q.get('q')){sql+=' AND (p.nom LIKE ? OR p.code LIKE ? OR p.code_barres LIKE ?)';params.push(...Array(3).fill('%'+q.get('q')+'%'));}
  const rows=await db.all(sql+' ORDER BY p.nom',...params);if(!permission(u,'prix.consulter'))rows.forEach(r=>{delete r.prix_achat;delete r.prix_vente;});return rows;
 }
 const prod=p.match(/^\/produits\/(\d+)$/);
 if((p==='/produits'&&m==='POST')||prod&&m==='PUT'){
  autoriser(u,'produits.gerer');const ancien=prod?await db.get('SELECT * FROM produits WHERE id=? AND entreprise_id=?',Number(prod[1]),e):null;if(prod)exiger(ancien,'Produit introuvable.',404);const d={...ancien,...b};exiger(d.nom?.trim(),'Nom obligatoire.');
  const id=ancien?.id||uid(),code=d.code||'P-'+id;const achat=Number(d.prix_achat||0),vente=Number(d.prix_vente||0);exiger(Number.isFinite(achat)&&achat>=0&&Number.isFinite(vente)&&vente>=0,'Prix invalide.');
  if(d.categorie_id)exiger(await db.get('SELECT id FROM categories WHERE id=? AND entreprise_id=?',d.categorie_id,e),'Catégorie inconnue.');
  const valeurs=[code,d.code_barres||null,d.nom.trim(),d.categorie_id||null,d.unite||'pièce',achat,vente,Number(d.tva||0),Number(d.seuil_alerte||0),d.actif===undefined?1:Number(d.actif),d.image||null];
  if(ancien)await db.run('UPDATE produits SET code=?,code_barres=?,nom=?,categorie_id=?,unite=?,prix_achat=?,prix_vente=?,tva=?,seuil_alerte=?,actif=?,image=? WHERE id=?',...valeurs,id);
  else await db.run('INSERT INTO produits(code,code_barres,nom,categorie_id,unite,prix_achat,prix_vente,tva,seuil_alerte,actif,image,id,entreprise_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',...valeurs,id,e);
  return db.get('SELECT * FROM produits WHERE id=?',id);
 }
 if(prod&&m==='GET'){
  autoriser(u,'produits.consulter');const r=await db.get('SELECT p.*,c.nom categorie FROM produits p LEFT JOIN categories c ON c.id=p.categorie_id WHERE p.id=? AND p.entreprise_id=?',Number(prod[1]),e);exiger(r,'Produit introuvable.',404);
  const f=filtreMagasin(u);r.stocks=await db.all('SELECT s.*,m.nom magasin FROM stocks s JOIN magasins m ON m.id=s.magasin_id WHERE s.produit_id=? AND m.entreprise_id=?'+f.sql,r.id,e,...f.params);r.mouvements=await db.all('SELECT ms.*,m.nom magasin,u.nom utilisateur FROM mouvements_stock ms JOIN magasins m ON m.id=ms.magasin_id LEFT JOIN users u ON u.id=ms.user_id WHERE ms.produit_id=? AND m.entreprise_id=?'+f.sql+' ORDER BY ms.id DESC LIMIT 100',r.id,e,...f.params);r.ventes_recentes=[];if(!permission(u,'prix.consulter')){delete r.prix_achat;delete r.prix_vente;}return r;
 }
 if(prod&&m==='DELETE'){autoriser(u,'produits.gerer');await db.run('UPDATE produits SET actif=0 WHERE id=? AND entreprise_id=?',Number(prod[1]),e);return{ok:true,desactive:true};}
 if(['/stocks','/stocks/alertes'].includes(p)&&m==='GET'){
  autoriser(u,'stock.consulter');const f=filtreMagasin(u),params=[e,...f.params];let filtre=f.sql;
  if(u.portee!=='magasin'&&q.get('magasin_id')){await magasin(db,u,Number(q.get('magasin_id')));filtre+=' AND m.id=?';params.push(Number(q.get('magasin_id')));}
  if(q.get('q')){filtre+=' AND (p.nom LIKE ? OR p.code LIKE ?)';params.push('%'+q.get('q')+'%','%'+q.get('q')+'%');}
  if(p.endsWith('/alertes'))filtre+=' AND s.quantite<=p.seuil_alerte';
  const rows=await db.all('SELECT s.*,p.nom produit,p.code,p.unite,p.prix_achat,p.prix_vente,p.seuil_alerte,c.nom categorie,m.nom magasin,m.type FROM stocks s JOIN produits p ON p.id=s.produit_id JOIN magasins m ON m.id=s.magasin_id LEFT JOIN categories c ON c.id=p.categorie_id WHERE m.entreprise_id=? AND p.actif=1'+filtre+' ORDER BY p.nom',...params);
  if(!permission(u,'prix.consulter'))rows.forEach(r=>{delete r.prix_achat;delete r.prix_vente;});return rows;
 }
 if(['/stocks/mouvement','/stocks/ajustement','/stocks/reception'].includes(p)&&m==='POST'){
  const ajustement=p.endsWith('/ajustement'),type=ajustement?'ajustement':b.type||'entree';exiger(['entree','sortie','ajustement'].includes(type),'Type de mouvement invalide.');autoriser(u,ajustement?'stock.ajuster':type==='sortie'?'stock.sortie':'stock.entree');const mid=u.portee==='magasin'?u.magasin_id:Number(b.magasin_id),reference='STK-'+uid();
  let lignes=(Array.isArray(b.lignes)?b.lignes:[b]).map(l=>({...l,produit_id:Number(l.produit_id),quantite:type==='sortie'?-Math.abs(Number(l.quantite)):Number(l.quantite)}));
  if(ajustement){const stocks=await db.all('SELECT produit_id,quantite FROM stocks WHERE magasin_id=?',mid);lignes=lignes.map(l=>{exiger(Number.isFinite(l.quantite)&&l.quantite>=0,'Stock cible invalide.');return{...l,quantite:l.quantite-(stocks.find(s=>s.produit_id===l.produit_id)?.quantite||0)};}).filter(l=>l.quantite!==0);}
  if(!lignes.length)return{ok:true,reference};if(type==='entree')exiger(lignes.every(l=>l.quantite>0),'Une entrée doit être positive.');
  const queries=await mouvementsLot(db,u,mid,lignes,{type,reference,motif:b.motif||''});
  await db.batch(queries);return{ok:true,reference};
 }
 if(p==='/transferts'&&m==='GET'){autoriser(u,'transferts.consulter');return db.all(`SELECT t.*,p.nom produit,s.nom source,d.nom destination FROM transferts t JOIN produits p ON p.id=t.produit_id JOIN magasins s ON s.id=t.magasin_source_id JOIN magasins d ON d.id=t.magasin_dest_id WHERE s.entreprise_id=? ${u.portee==='magasin'?'AND (s.id=? OR d.id=?)':''} ORDER BY t.id DESC LIMIT 200`,e,...(u.portee==='magasin'?[u.magasin_id,u.magasin_id]:[]));}
 if(p==='/transferts'&&m==='POST'){
  autoriser(u,'transferts.creer');await magasin(db,u,b.magasin_source_id);const dest=await db.get('SELECT * FROM magasins WHERE id=? AND entreprise_id=?',b.magasin_dest_id,e);exiger(dest&&dest.actif,'Destination inconnue.');exiger(Number(b.magasin_source_id)!==Number(b.magasin_dest_id),'Choisissez deux points différents.');exiger(Number(b.quantite)>0,'Quantité invalide.');exiger(await db.get('SELECT id FROM produits WHERE id=? AND entreprise_id=?',b.produit_id,e),'Produit inconnu.');const id=uid();await db.run('INSERT INTO transferts(id,reference,magasin_source_id,magasin_dest_id,produit_id,quantite,note,user_id) VALUES (?,?,?,?,?,?,?,?)',id,'TRF-'+id,b.magasin_source_id,b.magasin_dest_id,b.produit_id,Number(b.quantite),b.note||null,u.id);return db.get('SELECT * FROM transferts WHERE id=?',id);
 }
 const tr=p.match(/^\/transferts\/(\d+)\/(valider|annuler)$/);
 if(tr&&m==='POST'){
  autoriser(u,'transferts.valider');const t=await db.get('SELECT t.* FROM transferts t JOIN magasins m ON m.id=t.magasin_source_id WHERE t.id=? AND m.entreprise_id=?',Number(tr[1]),e);exiger(t&&t.statut==='en_attente','Transfert introuvable ou déjà traité.');await magasin(db,u,t.magasin_source_id);
  const guard=assertion("(SELECT statut FROM transferts WHERE id=?)='en_attente'",[t.id]),queries=[...guard];
  if(tr[2]==='valider'){queries.push(...await mouvement(db,u,{produit_id:t.produit_id,magasin_id:t.magasin_source_id,quantite:-t.quantite,type:'transfert_sortie',reference:t.reference}));const reseau={...u,portee:'reseau'};queries.push(...await mouvement(db,reseau,{produit_id:t.produit_id,magasin_id:t.magasin_dest_id,quantite:t.quantite,type:'transfert_entree',reference:t.reference}));}
  queries.push(["UPDATE transferts SET statut=?,valide_at=datetime('now','localtime') WHERE id=?",tr[2]==='valider'?'valide':'annule',t.id]);await db.batch(queries);return{ok:true};
 }
 return undefined;
}
