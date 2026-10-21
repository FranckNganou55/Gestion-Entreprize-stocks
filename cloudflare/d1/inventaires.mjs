import {administrateur,autoriser,exiger,uid,magasin,assertion,parametres} from './db.mjs';
import {mouvementsLot} from './stock-lot.mjs';
export async function routesInventaires(c){
 const {db,u,p,m,b,q}=c;if(!p.startsWith('/inventaires'))return;administrateur(u);const e=u.entreprise_id;
 if(p==='/inventaires'&&m==='GET')return{inventaires:await db.all('SELECT i.*,m.nom magasin_nom,(SELECT COUNT(*) FROM inventaires_lignes l WHERE l.inventaire_id=i.id) nb_lignes,(SELECT COUNT(*) FROM inventaires_lignes l WHERE l.inventaire_id=i.id AND quantite_comptee IS NOT NULL) nb_comptees FROM inventaires i LEFT JOIN magasins m ON m.id=i.magasin_id WHERE i.entreprise_id=? ORDER BY i.id DESC',e),peut_gerer:true};
 if(p==='/inventaires'&&m==='POST'){
  exiger(b.libelle?.trim(),'Libellé obligatoire.');const mid=Number(b.magasin_id)||null;if(mid)await magasin(db,u,mid);const id=uid();
  await db.batch([['INSERT INTO inventaires(id,entreprise_id,magasin_id,libelle,commentaire,cree_par) VALUES (?,?,?,?,?,?)',id,e,mid,b.libelle.trim(),b.commentaire||null,u.id],['INSERT INTO inventaires_lignes(inventaire_id,produit_id,magasin_id,quantite_theorique,quantite_calculee,prix_achat,prix_vente) SELECT ?,p.id,?,IFNULL((SELECT SUM(quantite) FROM stocks s WHERE s.produit_id=p.id AND (? IS NULL OR s.magasin_id=?)),0),IFNULL((SELECT SUM(quantite) FROM mouvements_stock ms WHERE ms.produit_id=p.id AND (? IS NULL OR ms.magasin_id=?)),0),p.prix_achat,p.prix_vente FROM produits p WHERE p.entreprise_id=? AND p.actif=1',id,mid,mid,mid,mid,mid,e]]);return detail(db,id);
 }
 const match=p.match(/^\/inventaires\/(\d+)(?:\/(lignes\/(\d+)|cloturer|appliquer|export.csv))?$/);if(!match)return;const id=Number(match[1]);const inv=await db.get('SELECT * FROM inventaires WHERE id=? AND entreprise_id=?',id,e);exiger(inv,'Inventaire introuvable.',404);
 const details=async()=>({...await detail(db,id),peut_gerer:true,peut_voir_prix:true,parametres:await parametres(db,e)});
 if(m==='GET'&&!match[2])return details();
 if(m==='GET'&&match[2]==='export.csv'){
  const d=await detail(db,id),quote=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const rows=[['Produit','Référence','Théorique','Compté','Écart','Valeur'],...d.lignes.map(l=>[l.produit,l.produit_reference,l.quantite_theorique,l.quantite_comptee,l.ecart_quantite,l.ecart_valeur])];return new Response('\uFEFF'+rows.map(l=>l.map(quote).join(';')).join('\r\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="inventaire-'+id+'.csv"'}});
 }
 if(m==='PUT'&&match[3]){
  exiger(inv.statut==='brouillon','Inventaire clôturé.');const quantite=b.quantite_comptee===null||b.quantite_comptee===''?null:Number(b.quantite_comptee);exiger(quantite===null||Number.isFinite(quantite)&&quantite>=0,'Quantité invalide.');
  exiger(await db.get('SELECT id FROM inventaires_lignes WHERE id=? AND inventaire_id=?',Number(match[3]),id),'Ligne inconnue.',404);await db.batch([...assertion('(SELECT statut FROM inventaires WHERE id=?)=\'brouillon\'',[id]),['UPDATE inventaires_lignes SET quantite_comptee=?,note=?,compte_par=?,maj_at=datetime(\'now\',\'localtime\') WHERE id=?',quantite,b.note||null,u.id,Number(match[3])]]);return details();
 }
 if(m==='POST'&&match[2]==='cloturer'){
  exiger(inv.statut==='brouillon','Inventaire déjà clôturé.');await db.batch([...assertion('(SELECT statut FROM inventaires WHERE id=?)=\'brouillon\' AND NOT EXISTS(SELECT 1 FROM inventaires_lignes WHERE inventaire_id=? AND quantite_comptee IS NULL)',[id,id]),['UPDATE inventaires SET statut=\'cloture\',cloture_par=?,cloture_at=datetime(\'now\',\'localtime\') WHERE id=?',u.id,id]]);return details();
 }
 if(m==='POST'&&match[2]==='appliquer'){
  exiger(inv.statut==='cloture','Clôturez l’inventaire avant son application.');exiger(inv.magasin_id,'Appliquez les écarts par magasin : créez un inventaire pour chaque point de stock.');
  const reference='INV-'+id;exiger(!await db.get('SELECT id FROM mouvements_stock WHERE reference=? LIMIT 1',reference),'Écarts déjà appliqués.');const lignes=await db.all('SELECT produit_id,quantite_comptee-quantite_theorique quantite FROM inventaires_lignes WHERE inventaire_id=? AND quantite_comptee IS NOT NULL AND ROUND(quantite_comptee-quantite_theorique,3)<>0',id);if(!lignes.length)return{appliques:0,message:'Aucun écart.'};
  await db.batch([...assertion('NOT EXISTS(SELECT 1 FROM mouvements_stock WHERE reference=?)',[reference]),...await mouvementsLot(db,u,inv.magasin_id,lignes,{reference,type:'ajustement',motif:'Inventaire '+inv.libelle})]);return{appliques:lignes.length,message:'Écarts appliqués au stock.'};
 }
 if(m==='DELETE'){await db.run('DELETE FROM inventaires WHERE id=? AND entreprise_id=?',id,e);return{ok:true};}
}
async function detail(db,id) {
  const inv = (await db.get(`SELECT i.*, m.nom AS magasin_nom, u.nom AS cree_par_nom,
      c.nom AS cloture_par_nom
    FROM inventaires i
    LEFT JOIN magasins m ON m.id = i.magasin_id
    LEFT JOIN users u ON u.id = i.cree_par
    LEFT JOIN users c ON c.id = i.cloture_par
    WHERE i.id = ?`,Number(id)));
  if (!inv) return null;

  const lignes = (await db.all(`SELECT l.*, p.nom AS produit, p.code AS produit_reference,
      p.unite, m.nom AS magasin_nom
    FROM inventaires_lignes l
    JOIN produits p ON p.id = l.produit_id
    LEFT JOIN magasins m ON m.id = l.magasin_id
    WHERE l.inventaire_id = ? ORDER BY p.nom`,Number(id)));

  lignes.forEach((l) => {
    l.ecart_quantite = l.quantite_comptee === null || l.quantite_comptee === undefined
      ? null : Math.round((Number(l.quantite_comptee) - Number(l.quantite_theorique)) * 1000) / 1000;
    l.ecart_valeur = l.ecart_quantite === null ? null : Math.round(l.ecart_quantite * Number(l.prix_achat));
    l.ecart_valeur_vente = l.ecart_quantite === null ? null : Math.round(l.ecart_quantite * Number(l.prix_vente));
    l.valeur_theorique = Math.round(Number(l.quantite_theorique) * Number(l.prix_achat));
    l.valeur_comptee = l.quantite_comptee === null || l.quantite_comptee === undefined
      ? null : Math.round(Number(l.quantite_comptee) * Number(l.prix_achat));
    l.valeur_vente_comptee = l.quantite_comptee === null || l.quantite_comptee === undefined
      ? null : Math.round(Number(l.quantite_comptee) * Number(l.prix_vente));
    /* Écart entre ce que le système annonce et ce que les mouvements racontent. */
    l.ecart_integrite = Math.round((Number(l.quantite_theorique) - Number(l.quantite_calculee)) * 1000) / 1000;
  });

  const comptes = lignes.filter((l) => l.quantite_comptee !== null && l.quantite_comptee !== undefined);
  const somme = (f) => comptes.reduce((s, l) => s + (f(l) || 0), 0);
  const total = (f) => lignes.reduce((s, l) => s + (f(l) || 0), 0);

  return {
    inventaire: inv,
    lignes,
    comptes: {
      nb_produits: lignes.length,
      nb_comptes: comptes.length,
      nb_restants: lignes.length - comptes.length,
      progression: lignes.length ? Math.round((comptes.length / lignes.length) * 100) : 0,
      /* 3. Le stock qu'on devait avoir */
      quantite_theorique: total((l) => Number(l.quantite_theorique)),
      quantite_calculee: total((l) => Number(l.quantite_calculee)),
      valeur_theorique: total((l) => l.valeur_theorique),
      /* 1. Le stock réellement compté */
      quantite_comptee: somme((l) => Number(l.quantite_comptee)),
      valeur_comptee: somme((l) => l.valeur_comptee),
      /* 2. Le montant généré (valeur de revente du stock compté) */
      valeur_vente_comptee: somme((l) => l.valeur_vente_comptee),
      marge_potentielle: somme((l) => (l.valeur_vente_comptee || 0) - (l.valeur_comptee || 0)),
      /* 4. La comparaison */
      ecart_quantite: somme((l) => l.ecart_quantite),
      ecart_valeur: somme((l) => l.ecart_valeur),
      ecart_valeur_vente: somme((l) => l.ecart_valeur_vente),
      nb_ecarts: comptes.filter((l) => Math.abs(l.ecart_quantite || 0) > 0.0001).length,
      nb_manquants: comptes.filter((l) => (l.ecart_quantite || 0) < 0).length,
      nb_excedents: comptes.filter((l) => (l.ecart_quantite || 0) > 0).length,
      nb_incoherences_systeme: lignes.filter((l) => Math.abs(l.ecart_integrite) > 0.0001).length,
    },
  };
}

