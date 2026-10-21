import {autoriser,exiger,uid,filtreMagasin,magasin} from './db.mjs';
const configs={clients:{gerer:'clients.gerer',lire:'clients.consulter',colonnes:['nom','telephone','email','adresse','ville','type'],defaut:{type:'particulier'}},fournisseurs:{gerer:'fournisseurs.gerer',lire:'fournisseurs.consulter',colonnes:['nom','contact','telephone','email','adresse','ville','categorie'],defaut:{}},employes:{gerer:'employes.gerer',lire:'employes.consulter',colonnes:['nom','poste','magasin_id','telephone','email','date_embauche','type_contrat','salaire','actif','civilite','date_naissance','lieu_naissance','sexe','situation_matrimoniale','adresse','ville','numero_cni','numero_cnps','numero_ifu','contact_urgence_nom','contact_urgence_tel','formation','date_fin_contrat','date_sortie','motif_sortie','notes','statut_dossier'],defaut:{type_contrat:'CDI',salaire:0,actif:1,civilite:'M.',statut_dossier:'complet'}}};
export async function routesTiers(c){
 const {db,u,p,m,b,q}=c,e=u.entreprise_id,match=p.match(/^\/(?:rh\/)?(clients|fournisseurs|employes)(?:\/(\d+))?$/);if(!match)return undefined;
 const table=match[1],id=Number(match[2]),cfg=configs[table];
 if(m==='GET'){
  autoriser(u,cfg.lire,...(table==='clients'?['caisse.utiliser']:[]));let filtre='',params=[e];if(id){filtre+=' AND t.id=?';params.push(id);}if(q.get('q')){filtre+=' AND (t.nom LIKE ? OR t.telephone LIKE ? OR t.code LIKE ?)';params.push(...Array(3).fill('%'+q.get('q')+'%'));}if(q.get('type')&&table==='clients'){filtre+=' AND t.type=?';params.push(q.get('type'));}if(table==='employes'&&u.portee==='magasin'){filtre+=' AND t.magasin_id=?';params.push(u.magasin_id);}
  const extras=table==='clients'?`,(SELECT COUNT(*) FROM ventes v WHERE v.client_id=t.id AND v.statut='payee') nb_achats,(SELECT IFNULL(SUM(total),0) FROM ventes v WHERE v.client_id=t.id AND v.statut='payee') total_achats,(SELECT MAX(created_at) FROM ventes v WHERE v.client_id=t.id) dernier_achat`:table==='employes'?',m.nom magasin':'';
  const rows=await db.all('SELECT t.*'+extras+' FROM '+table+' t '+(table==='employes'?'LEFT JOIN magasins m ON m.id=t.magasin_id ':'')+'WHERE t.entreprise_id=?'+filtre+' ORDER BY t.nom',...params);
  if(!id){if(table==='employes'&&p.startsWith('/rh/'))return{employes:rows,total:rows.length,stats:{total:rows.length,actifs:rows.filter(r=>r.actif).length,masse_salariale:rows.filter(r=>r.actif).reduce((s,r)=>s+Number(r.salaire||0),0)}};return rows;}
  const r=rows[0];exiger(r,'Fiche introuvable.',404);
  if(table==='clients')r.ventes=await db.all('SELECT v.*,m.nom magasin FROM ventes v JOIN magasins m ON m.id=v.magasin_id WHERE v.client_id=? AND m.entreprise_id=? ORDER BY v.id DESC LIMIT 100',id,e);
  if(table==='fournisseurs')r.commandes=await db.all('SELECT * FROM commandes_achat WHERE fournisseur_id=? ORDER BY id DESC LIMIT 100',id);
  if(table==='employes'&&p.startsWith('/rh/'))return{employe:r,documents:await db.all('SELECT * FROM documents_employe WHERE employe_id=? AND entreprise_id=?',id,e),salaires:await db.all('SELECT * FROM salaires WHERE employe_id=? AND entreprise_id=? ORDER BY periode DESC',id,e),stats:{}};
  return r;
 }
 autoriser(u,cfg.gerer,...(table==='clients'&&m==='POST'?['caisse.utiliser']:[]));
 const ancien=id?await db.get('SELECT * FROM '+table+' WHERE id=? AND entreprise_id=?',id,e):null;if(id)exiger(ancien,'Fiche introuvable.',404);
 if(ancien?.magasin_id)await magasin(db,u,ancien.magasin_id);
 if(m==='DELETE'){
  if(table==='employes'){await db.run('UPDATE employes SET actif=0 WHERE id=?',id);return{ok:true,archive:true};}
  const lie=table==='clients'?await db.get('SELECT COUNT(*) n FROM ventes WHERE client_id=?',id):await db.get('SELECT COUNT(*) n FROM commandes_achat WHERE fournisseur_id=?',id);exiger(!lie.n,'Cette fiche possède un historique et doit être conservée.');await db.run('DELETE FROM '+table+' WHERE id=?',id);return{ok:true};
 }
 if(!['POST','PUT'].includes(m))return undefined;
 const d={...cfg.defaut,...ancien,...b};exiger(d.nom?.trim(),'Le nom est obligatoire.');if(d.email)exiger(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email),'Email invalide.');if(d.magasin_id)await magasin(db,u,Number(d.magasin_id));if(table==='employes')exiger(Number.isFinite(Number(d.salaire||0))&&Number(d.salaire||0)>=0,'Salaire invalide.');
 const identifiant=id||uid(),colonnes=cfg.colonnes,valeurs=colonnes.map(k=>d[k]===undefined||d[k]===''?null:d[k]);
 if(id)await db.run('UPDATE '+table+' SET '+colonnes.map(k=>k+'=?').join(',')+' WHERE id=?',...valeurs,id);
 else await db.run('INSERT INTO '+table+' (id,entreprise_id,code,'+colonnes.join(',')+') VALUES ('+Array(colonnes.length+3).fill('?').join(',')+')',identifiant,e,d.code||(table==='clients'?'CL-':table==='employes'?'EMP-':'FOU-')+identifiant,...valeurs);
 return db.get('SELECT * FROM '+table+' WHERE id=?',identifiant);
}
