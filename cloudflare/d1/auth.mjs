import {exiger,MetierErreur,uid,parametres} from './db.mjs';
const enc=new TextEncoder();
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const decode=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
async function key(secret){return crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
export async function empreinte(password,salt=crypto.getRandomValues(new Uint8Array(16))){
 exiger(typeof password==='string'&&password.length>=8&&password.length<=256,'Le mot de passe doit contenir entre 8 et 256 caractères.');
 const k=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
 const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},k,256);
 return `pbkdf2-sha256$100000$${b64(salt)}$${b64(bits)}`;
}
export async function verifierMotDePasse(password,hash){
 if(!String(hash).startsWith('pbkdf2-sha256$'))throw new MetierErreur('Ce compte importé doit recevoir un mot de passe compatible avec Cloudflare. Contactez votre administrateur.',409,{code:'MOT_DE_PASSE_A_MIGRER'});
 if(typeof password!=='string'||password.length<8||password.length>256)return false;
 const p=hash.split('$');if(p.length!==4||p[1]!=='100000')return false;
 const candidat=await empreinte(password,decode(p[2]));let diff=0;if(candidat.length!==hash.length)return false;for(let i=0;i<hash.length;i++)diff|=candidat.charCodeAt(i)^hash.charCodeAt(i);return diff===0;
}
export async function signer(user,secret){
 exiger(secret&&secret.length>=32,'Le secret de session doit être configuré par le propriétaire.',503);
 const contenu=b64(enc.encode(JSON.stringify({alg:'HS256',typ:'JWT'})))+'.'+b64(enc.encode(JSON.stringify({sub:String(user.id),iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+43200})));
 return contenu+'.'+b64(await crypto.subtle.sign('HMAC',await key(secret),enc.encode(contenu)));
}
export async function profil(db,u){
 const role=await db.get('SELECT * FROM roles WHERE code=?',u.role);exiger(role,'Ce rôle n’existe plus.',403);
 const parse=s=>{try{return JSON.parse(s||'[]');}catch{return[];}};
 const base=parse(role.permissions),extra=parse(u.permissions_extra),retirees=parse(u.permissions_retirees);
 const permissions=base.includes('*')?base:[...new Set([...base,...extra])].filter(p=>!retirees.includes(p));
 const entreprise=u.entreprise_id?await db.get('SELECT * FROM entreprises WHERE id=?',u.entreprise_id):null;
 const point=u.magasin_id?await db.get('SELECT id,nom,ville FROM magasins WHERE id=?',u.magasin_id):null;
 const p=await parametres(db,0),numero=p.whatsapp_support||'';
 return {id:u.id,nom:u.nom,email:u.email,role:u.role,libelle_role:role.nom,description_role:role.description,permissions,habilitations:{accordees:extra,retirees,du_role:base},portee:u.role==='super_admin'?'plateforme':role.portee,magasin_id:u.magasin_id,magasin:point,entreprise_id:u.entreprise_id,entreprise,plateforme:u.role==='super_admin',email_verifie:u.email_verifie,verification_requise:u.role!=='super_admin'&&!u.email_verifie,langue:u.langue||'fr',support:{numero,affiche:numero,lien:'https://wa.me/'+numero.replace(/\D/g,''),email:p.support_email||''}};
}
export async function authentifier(request,db,env){
 const token=(request.headers.get('Authorization')||'').replace(/^Bearer /,'');exiger(token,'Authentification requise.',401);
 try{
  const parties=token.split('.');if(parties.length!==3)throw Error();
  const header=JSON.parse(new TextDecoder().decode(decode(parties[0])));if(header.alg!=='HS256')throw Error();
  const valide=await crypto.subtle.verify('HMAC',await key(env.JWT_SECRET),decode(parties[2]),enc.encode(parties[0]+'.'+parties[1]));
  const data=JSON.parse(new TextDecoder().decode(decode(parties[1])));if(!valide||!data.exp||data.exp<Date.now()/1000)throw Error();
  const user=await db.get('SELECT * FROM users WHERE id=?',Number(data.sub));if(!user||!user.actif)throw Error();
  return await profil(db,user);
 }catch(e){if(e instanceof MetierErreur)throw e;throw new MetierErreur('Session expirée, veuillez vous reconnecter.',401);}
}
export async function initialiserProprietaire(db,env){
 exiger(env.OWNER_EMAIL&&env.OWNER_PASSWORD&&env.OWNER_PASSWORD.length>=12,'Pour terminer l’installation, renseigner les secrets OWNER_EMAIL et OWNER_PASSWORD.',503);
 const email=env.OWNER_EMAIL.trim().toLowerCase();exiger(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),'OWNER_EMAIL invalide.',503);
 const existant=await db.get("SELECT * FROM users WHERE role='super_admin' AND entreprise_id IS NULL ORDER BY id LIMIT 1");
 if(existant?.mot_de_passe?.startsWith('pbkdf2-sha256$'))return existant;
 if(existant)exiger(existant.email.toLowerCase()===email,'OWNER_EMAIL doit correspondre au propriétaire importé.',409);
 const hash=await empreinte(env.OWNER_PASSWORD);
 if(existant){await db.run("UPDATE users SET mot_de_passe=?,email_verifie=1 WHERE id=? AND mot_de_passe=?",hash,existant.id,existant.mot_de_passe);return existant;}
 exiger(!await db.get('SELECT id FROM users WHERE email=?',email),'Cet email appartient déjà à un compte entreprise.',409);
 await db.run("INSERT INTO users (id,nom,email,mot_de_passe,role,actif,email_verifie) VALUES (?,?,?,?,'super_admin',1,1)",uid(),env.OWNER_NAME||'Propriétaire',email,hash);
 return await db.get('SELECT * FROM users WHERE email=?',email);
}
