import {autoriser,exiger,uid,jour,magasin,assertion} from './db.mjs';
import {routesTiers} from './tiers.mjs';
const categories=[{code:'cni',libelle:'Pièce d’identité'},{code:'cv',libelle:'CV'},{code:'diplome',libelle:'Diplôme'},{code:'contrat',libelle:'Contrat'},{code:'autre',libelle:'Autre'}];
export async function routesRH(c){
 const {db,u,p,m,b,q}=c,e=u.entreprise_id;if(!p.startsWith('/rh/'))return;
 const periode=String(b.periode||q.get('periode')||jour().slice(0,7));
 const employe=async id=>{const r=await db.get('SELECT * FROM employes WHERE id=? AND entreprise_id=?',Number(id),e);exiger(r,'Employé introuvable.',404);if(r.magasin_id)await magasin(db,u,r.magasin_id);return r;};
 if(p==='/rh/salaires'&&m==='GET'){
  autoriser(u,'salaires.consulter');exiger(/^\d{4}-(0[1-9]|1[0-2])$/.test(periode),'Période invalide.');const mid=u.portee==='magasin'?u.magasin_id:Number(q.get('magasin_id'))||null;if(mid)await magasin(db,u,mid);
  const employes=await db.all('SELECT e.*,m.nom magasin FROM employes e LEFT JOIN magasins m ON m.id=e.magasin_id WHERE e.entreprise_id=? AND e.actif=1'+(mid?' AND e.magasin_id=?':'')+' ORDER BY e.nom',e,...(mid?[mid]:[]));
  const versements=await db.all('SELECT * FROM salaires WHERE entreprise_id=? AND periode=?',e,periode);const index=new Map(versements.map(v=>[v.employe_id,v]));
  const lignes=employes.map(r=>{const v=index.get(r.id);return{employe_id:r.id,code:r.code,nom:r.nom,poste:r.poste,magasin:r.magasin,type_contrat:r.type_contrat,salaire_reference:r.salaire,versement:v||null,primes:v?.primes||0,retenues:v?.retenues||0,net:v?.net??r.salaire,statut:v?.statut||'a_payer',date_paiement:v?.date_paiement||null,mode_paiement:v?.mode_paiement||null};});
  const totaux={masse_salariale:0,total_primes:0,total_retenues:0,total_net:0,nb_payes:0,nb_a_payer:0,montant_paye:0,montant_a_payer:0};for(const l of lignes){totaux.masse_salariale+=l.salaire_reference;totaux.total_primes+=l.primes;totaux.total_retenues+=l.retenues;if(l.statut==='paye'){totaux.nb_payes++;totaux.total_net+=l.net;totaux.montant_paye+=l.net;}else{totaux.nb_a_payer++;totaux.montant_a_payer+=l.net;}}
  return{periode,lignes,totaux,nb_employes:lignes.length,periode_courante:jour().slice(0,7),periodes:await db.all('SELECT periode,COUNT(*) nb,SUM(statut=\'paye\') nb_payes,SUM(net) total FROM salaires WHERE entreprise_id=? GROUP BY periode ORDER BY periode DESC',e),evolution:await db.all('SELECT periode,SUM(net) total FROM salaires WHERE entreprise_id=? GROUP BY periode ORDER BY periode DESC LIMIT 12',e)};
 }
 if(p==='/rh/salaires'&&m==='POST'){
  autoriser(u,'salaires.gerer');const r=await employe(b.employe_id),montant=Number(b.montant??r.salaire),primes=Number(b.primes||0),retenues=Number(b.retenues||0);exiger(/^\d{4}-(0[1-9]|1[0-2])$/.test(periode)&&[montant,primes,retenues].every(v=>Number.isFinite(v)&&v>=0),'Période ou montants invalides.');
  const statut=b.statut==='paye'?'paye':'a_payer';await db.run('INSERT INTO salaires(id,entreprise_id,employe_id,periode,montant,primes,retenues,net,statut,date_paiement,mode_paiement,reference,notes,saisi_par) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(employe_id,periode) DO UPDATE SET montant=excluded.montant,primes=excluded.primes,retenues=excluded.retenues,net=excluded.net,statut=excluded.statut,date_paiement=excluded.date_paiement,mode_paiement=excluded.mode_paiement,reference=excluded.reference,notes=excluded.notes,saisi_par=excluded.saisi_par',uid(),e,r.id,periode,montant,primes,retenues,Math.max(0,montant+primes-retenues),statut,statut==='paye'?b.date_paiement||jour():null,b.mode_paiement||null,b.reference||null,b.notes||null,u.id);return db.get('SELECT * FROM salaires WHERE employe_id=? AND periode=?',r.id,periode);
 }
 if(p==='/rh/salaires/payer-periode'&&m==='POST'){
  autoriser(u,'salaires.gerer');exiger(/^\d{4}-(0[1-9]|1[0-2])$/.test(periode),'Période invalide.');
  await db.run('INSERT INTO salaires(entreprise_id,employe_id,periode,montant,net,statut,date_paiement,mode_paiement,saisi_par) SELECT ?,id,?,salaire,salaire,\'paye\',?,?,? FROM employes WHERE entreprise_id=? AND actif=1'+(u.portee==='magasin'?' AND magasin_id=?':'')+' ON CONFLICT(employe_id,periode) DO UPDATE SET statut=\'paye\',date_paiement=excluded.date_paiement,mode_paiement=excluded.mode_paiement,saisi_par=excluded.saisi_par',e,periode,jour(),b.mode_paiement||'especes',u.id,e,...(u.portee==='magasin'?[u.magasin_id]:[]));return{ok:true};
 }
 const salaire=p.match(/^\/rh\/salaires\/(\d+)$/);if(salaire&&m==='DELETE'){autoriser(u,'salaires.gerer');const s=await db.get('SELECT * FROM salaires WHERE id=? AND entreprise_id=?',Number(salaire[1]),e);exiger(s,'Versement introuvable.',404);await employe(s.employe_id);await db.run('DELETE FROM salaires WHERE id=?',s.id);return{ok:true};}
 const sortie=p.match(/^\/rh\/employes\/(\d+)\/(sortie|renvoyer)$/);if(sortie&&m==='POST'){autoriser(u,'employes.gerer');const r=await employe(sortie[1]);await db.run('UPDATE employes SET actif=0,date_sortie=?,motif_sortie=? WHERE id=?',b.date_sortie||jour(),b.motif_sortie||b.motif||null,r.id);return{ok:true,id:r.id};}
 const candidature=p.match(/^\/rh\/candidats(?:\/(\d+)(?:\/(statut|embaucher))?)?$/);
 if(candidature){
  autoriser(u,m==='GET'?'recrutement.consulter':'recrutement.gerer');const id=Number(candidature[1]),r=id?await db.get('SELECT * FROM candidats WHERE id=? AND entreprise_id=?',id,e):null;if(id){exiger(r,'Candidature introuvable.',404);if(r.magasin_id)await magasin(db,u,r.magasin_id);}
  if(m==='GET'&&!id){const mid=u.portee==='magasin'?u.magasin_id:Number(q.get('magasin_id'))||null;const rows=await db.all('SELECT c.*,m.nom magasin FROM candidats c LEFT JOIN magasins m ON m.id=c.magasin_id WHERE c.entreprise_id=?'+(mid?' AND c.magasin_id=?':'')+(q.get('statut')?' AND c.statut=?':'')+' ORDER BY c.id DESC LIMIT 500',e,...(mid?[mid]:[]),...(q.get('statut')?[q.get('statut')]:[]));return{candidats:rows,total:rows.length,stats:{total:rows.length,recu:rows.filter(r=>r.statut==='recu').length,entretien:rows.filter(r=>r.statut==='entretien').length,retenu:rows.filter(r=>r.statut==='retenu').length,embauche:rows.filter(r=>r.statut==='embauche').length}};}
  if(m==='GET')return{candidat:r,documents:await db.all('SELECT * FROM documents_candidat WHERE candidat_id=? AND entreprise_id=?',id,e)};
  if(m==='DELETE'){exiger(r.statut!=='embauche','Conservez la candidature liée à un employé.');await db.run('DELETE FROM candidats WHERE id=?',id);return{ok:true};}
  if(candidature[2]==='statut'&&m==='POST'){exiger(['recu','entretien','retenu','refuse'].includes(b.statut),'Statut invalide.');exiger(r.statut!=='embauche','Candidat déjà embauché.');await db.run('UPDATE candidats SET statut=?,motif=?,date_entretien=? WHERE id=?',b.statut,b.motif||null,b.date_entretien||null,id);return{ok:true};}
  if(candidature[2]==='embaucher'&&m==='POST'){
   autoriser(u,'employes.gerer');exiger(!r.employe_id&&r.statut!=='embauche','Candidat déjà embauché.');const mid=Number(b.magasin_id||r.magasin_id)||null;if(mid)await magasin(db,u,mid);const salaire=Number(b.salaire??r.salaire_propose??0);exiger(Number.isFinite(salaire)&&salaire>=0,'Salaire invalide.');const eid=uid();await db.batch([...assertion('EXISTS(SELECT 1 FROM candidats WHERE id=? AND employe_id IS NULL AND statut<>\'embauche\')',[id]),['INSERT INTO employes(id,entreprise_id,code,nom,poste,magasin_id,telephone,email,date_embauche,type_contrat,salaire,actif) VALUES (?,?,?,?,?,?,?,?,?,?,?,1)',eid,e,'EMP-'+eid,r.nom,b.poste||r.poste_vise,mid,r.telephone,r.email,b.date_embauche||jour(),b.type_contrat||'CDI',salaire],['UPDATE candidats SET statut=\'embauche\',employe_id=? WHERE id=?',eid,id]]);return{ok:true,employe:await db.get('SELECT * FROM employes WHERE id=?',eid)};
  }
  if(['POST','PUT'].includes(m)){
   const d={...r,...b};exiger(d.nom?.trim(),'Nom obligatoire.');if(d.magasin_id)await magasin(db,u,Number(d.magasin_id));if(u.portee==='magasin')d.magasin_id=u.magasin_id;
   const cols=['nom','poste_vise','magasin_id','telephone','email','ville','date_naissance','date_candidature','source','experience_annees','formation','salaire_propose','notes'],values=cols.map(k=>d[k]??(k==='date_candidature'?jour():['experience_annees','salaire_propose'].includes(k)?0:null));
   if(id)await db.run('UPDATE candidats SET '+cols.map(k=>k+'=?').join(',')+' WHERE id=?',...values,id);else await db.run('INSERT INTO candidats(id,entreprise_id,'+cols.join(',')+') VALUES ('+Array(cols.length+2).fill('?').join(',')+')',uid(),e,...values);return{ok:true};
  }
 }
 const documents=p.match(/^\/rh\/(employes|candidats)\/(\d+)\/documents$/),doc=p.match(/^\/rh\/(documents|documents-candidat)\/(\d+)$/);
 if(p==='/rh/documents-categories'&&m==='GET'){autoriser(u,'recrutement.consulter');return{categories,taille_max_mo:10};}
 if(documents){
  const candidat=documents[1]==='candidats',table=candidat?'documents_candidat':'documents_employe',fk=candidat?'candidat_id':'employe_id',id=Number(documents[2]);autoriser(u,m==='GET'?'recrutement.consulter':'recrutement.gerer');
  const parent=candidat?await db.get('SELECT * FROM candidats WHERE id=? AND entreprise_id=?',id,e):await employe(id);exiger(parent,'Dossier introuvable.',404);if(parent.magasin_id)await magasin(db,u,parent.magasin_id);
  if(m==='GET')return{documents:await db.all('SELECT * FROM '+table+' WHERE '+fk+'=? AND entreprise_id=?',id,e),categories,taille_max_mo:10};
  if(m==='POST'){
   const contenu=String(b.contenu||'').replace(/^data:application\/pdf;base64,/,''),bytes=Buffer.from(contenu,'base64');exiger(bytes.length>4&&bytes.length<=10*1024*1024&&bytes.subarray(0,5).toString()==='%PDF-','PDF invalide ou supérieur à 10 Mo.');const did=uid(),nom=crypto.randomUUID()+'.pdf',queries=[];
   queries.push(['INSERT INTO '+table+'(id,entreprise_id,'+fk+',categorie,nom_original,nom_stocke,type_mime,taille,televerse_par) VALUES (?,?,?,?,?,?,\'application/pdf\',?,?)',did,e,id,categories.some(c=>c.code===b.categorie)?b.categorie:'autre',String(b.nom||'document.pdf').slice(0,200),nom,bytes.length,u.id]);
   for(let i=0;i<bytes.length;i+=500000)queries.push(['INSERT INTO d1_documents_chunks(nom_stocke,position,contenu) VALUES (?,?,?)',nom,i,Uint8Array.from(bytes.subarray(i,i+500000)).buffer]);await db.batch(queries);return{ok:true,id:did};
  }
 }
 if(doc){
  autoriser(u,m==='DELETE'?'recrutement.gerer':'recrutement.consulter');const candidat=doc[1]==='documents-candidat',table=candidat?'documents_candidat':'documents_employe',r=await db.get('SELECT * FROM '+table+' WHERE id=? AND entreprise_id=?',Number(doc[2]),e);exiger(r,'Document introuvable.',404);const parent=candidat?await db.get('SELECT magasin_id FROM candidats WHERE id=?',r.candidat_id):await employe(r.employe_id);if(parent?.magasin_id)await magasin(db,u,parent.magasin_id);
  if(m==='DELETE'){await db.batch([['DELETE FROM d1_documents_chunks WHERE nom_stocke=?',r.nom_stocke],['DELETE FROM '+table+' WHERE id=?',r.id]]);return{ok:true};}
  if(m==='GET'){const chunks=await db.all('SELECT contenu FROM d1_documents_chunks WHERE nom_stocke=? ORDER BY position',r.nom_stocke);exiger(chunks.length,'Le fichier doit être réimporté dans D1.',404);return new Response(new Blob(chunks.map(c=>Uint8Array.from(c.contenu))),{headers:{'Content-Type':'application/pdf','Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(r.nom_original),'Cache-Control':'no-store'}});}
 }
}
