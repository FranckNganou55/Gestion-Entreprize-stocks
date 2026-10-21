import {envoyerMail} from './mails.mjs';
import {exiger,uid} from './db.mjs';
export async function destinataires(db,u){
 if(u.role==='super_admin')return db.all("SELECT id,nom,email,role FROM users WHERE role='admin' AND actif=1 AND entreprise_id IS NOT NULL ORDER BY nom");
 if(['admin','gestionnaire'].includes(u.role))return db.all('SELECT id,nom,email,role FROM users WHERE entreprise_id=? AND actif=1 AND id<>? ORDER BY nom',u.entreprise_id,u.id);
 return db.all("SELECT id,nom,email,role FROM users WHERE entreprise_id=? AND actif=1 AND (role IN ('admin','gestionnaire') OR id=(SELECT cree_par FROM users WHERE id=?)) AND id<>? ORDER BY nom",u.entreprise_id,u.id,u.id);
}
export async function routesMessages(c){
 const {db,u,p,m,b}=c;
 if(p==='/messages/non-lus'&&m==='GET')return{non_lus:(await db.get('SELECT COUNT(*) n FROM messages WHERE a_user_id=? AND lu=0',u.id)).n};
 if(['/messages','/messages/destinataires'].includes(p)&&m==='GET'){
  const liste=await destinataires(db,u);if(p.endsWith('/destinataires'))return liste;
  return{recus:await db.all('SELECT * FROM messages WHERE a_user_id=? ORDER BY id DESC LIMIT 200',u.id),envoyes:await db.all('SELECT * FROM messages WHERE de_user_id=? ORDER BY id DESC LIMIT 200',u.id),non_lus:(await db.get('SELECT COUNT(*) n FROM messages WHERE a_user_id=? AND lu=0',u.id)).n,destinataires:liste};
 }
 if(p==='/messages'&&m==='POST'){
  const liste=await destinataires(db,u),cible=liste.find(d=>d.id===Number(b.a_user_id||b.destinataire_id)||d.email.toLowerCase()===String(b.email||b.destinataire_email||'').trim().toLowerCase());exiger(cible,'Destinataire non autorisé.',403);exiger(String(b.objet||'').trim()&&String(b.corps||'').trim(),'Objet et message obligatoires.');exiger(String(b.corps).length<=20000,'Message trop long.');
  const id=uid();await db.run('INSERT INTO messages(id,de_user_id,de_nom,de_email,a_user_id,a_nom,a_email,entreprise_id,objet,corps) VALUES (?,?,?,?,?,?,?,?,?,?)',id,u.id,u.nom,u.email,cible.id,cible.nom,cible.email,u.entreprise_id||0,String(b.objet).trim().slice(0,200),String(b.corps).trim());const envoi=await envoyerMail(db,c.env,{to:cible.email,subject:String(b.objet).slice(0,200),text:String(b.corps),entreprise_id:u.entreprise_id,type:'message'});return{ok:true,id,envoi,message:envoi.ok?'Message enregistré et transmis par email.':'Message enregistré. L’email n’a pas pu être envoyé.'};
 }
 const lu=p.match(/^\/messages\/(\d+)\/(?:lu|lire)$/);if(lu&&m==='POST'){await db.run("UPDATE messages SET lu=1,lu_at=datetime('now','localtime') WHERE id=? AND a_user_id=?",Number(lu[1]),u.id);return{ok:true};}
 return undefined;
}
