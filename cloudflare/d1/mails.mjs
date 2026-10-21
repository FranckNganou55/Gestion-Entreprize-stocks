import {limiter} from './limites.mjs';
import {exiger,uid,proprietaire,parametres,assertion} from './db.mjs';
export async function configurationMail(db,env){
 const p=await parametres(db,0),host=env.SMTP_HOST||p.smtp_host||'',port=Number(env.SMTP_PORT||p.smtp_port||587),user=env.SMTP_USER||p.smtp_user||'',pass=env.SMTP_PASS||p.smtp_pass||'',from=env.MAIL_FROM||p.mail_from||user;
 const problemes=[];if(host==='smtp.gmail.com'&&pass.replace(/\s/g,'').length!==16)problemes.push('Le mot de passe d’application Google doit contenir 16 caractères.');
 return{host,port,user,pass,from,configure:!!(host&&user&&pass),problemes};
}
/** SMTP sur socket TLS Cloudflare ; aucun mot de passe n'est envoyé en clair. */
async function smtp(cfg,message){
 exiger(cfg.configure,'Le serveur SMTP n’est pas configuré.',503);exiger(!cfg.problemes.length,cfg.problemes.join(' '),503);exiger([465,587].includes(cfg.port),'Utilisez SMTP TLS sur le port 465 ou 587.');
 exiger(/^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$/i.test(cfg.host)&&!/(localhost|\.local)$/i.test(cfg.host),'Hôte SMTP public invalide.');
 const {connect}=await import('cloudflare:sockets');let socket=connect({hostname:cfg.host,port:cfg.port},{secureTransport:cfg.port===465?'on':'starttls'}),reader,writer,buffer='';
 const enc=new TextEncoder(),dec=new TextDecoder();let timer;
 const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{socket.close().catch(()=>{});reject(Error('Délai de connexion SMTP dépassé.'));},15000);});
 async function execute(){
  function ouvrir(){reader=socket.readable.getReader();writer=socket.writable.getWriter();}
  async function lire(){
   let code;
   for(;;){let n=buffer.indexOf('\r\n');while(n<0){const part=await reader.read();if(part.done)throw Error('Connexion SMTP interrompue.');buffer+=dec.decode(part.value,{stream:true});exiger(buffer.length<65536,'Réponse SMTP trop longue.');n=buffer.indexOf('\r\n');}
    const line=buffer.slice(0,n);buffer=buffer.slice(n+2);exiger(/^\d{3}[- ]/.test(line),'Réponse SMTP invalide.');code=Number(line.slice(0,3));if(line[3]===' ')return code;
   }
  }
  async function commande(text,codes){await writer.write(enc.encode(text+'\r\n'));const code=await lire();if(!codes.includes(code))throw Error(code===535?'Authentification Gmail refusée : vérifiez le mot de passe d’application.':'Le serveur SMTP a refusé l’opération ('+code+').');}
  ouvrir();exiger(await lire()===220,'Le serveur SMTP refuse la connexion.');await commande('EHLO inventa.app',[250]);
  if(cfg.port===587){await commande('STARTTLS',[220]);reader.releaseLock();writer.releaseLock();socket=socket.startTls();buffer='';ouvrir();await commande('EHLO inventa.app',[250]);}
  const b64=s=>Buffer.from(s,'utf8').toString('base64');await commande('AUTH LOGIN',[334]);await commande(b64(cfg.user),[334]);await commande(b64(cfg.pass.replace(cfg.host==='smtp.gmail.com'?/\s/g:/$^/g,'')),[235]);
  if(message){const adresse=s=>{const v=String(s).match(/<([^>]+)>/)?.[1]||s;exiger(/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(v),'Adresse email invalide.');return v;};const from=adresse(cfg.from),to=adresse(message.to);
   await commande('MAIL FROM:<'+from+'>',[250]);await commande('RCPT TO:<'+to+'>',[250,251]);await commande('DATA',[354]);
   const contenu=['From: '+from,'To: '+to,'Subject: =?UTF-8?B?'+b64(message.subject)+'?=','MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',''+b64(message.text).match(/.{1,76}/g).join('\r\n')].join('\r\n');await commande(contenu+'\r\n.',[250]);
  }
  await commande('QUIT',[221]);return{ok:true};
 }
 try{return await Promise.race([execute(),timeout]);}finally{clearTimeout(timer);reader?.releaseLock();writer?.releaseLock();await socket.close().catch(()=>{});}
}
export async function envoyerMail(db,env,{to,subject,text,entreprise_id=null,type='autre'}){
 const id=uid(),cfg=await configurationMail(db,env);await db.run('INSERT INTO mails_envoyes(id,entreprise_id,destinataire,sujet,corps_texte,type,statut,smtp_utilise) VALUES (?,?,?,?,?,?,\'en_attente\',?)',id,entreprise_id,to,subject,text,type,cfg.configure?1:0);
 try{await smtp(cfg,{to,subject,text});await db.run('UPDATE mails_envoyes SET statut=\'envoye\',envoye_at=datetime(\'now\',\'localtime\') WHERE id=?',id);return{ok:true,statut:'envoye',id};}
 catch(error){await db.run('UPDATE mails_envoyes SET statut=\'erreur\',erreur=? WHERE id=?',error.message.slice(0,500),id);return{ok:false,statut:'erreur',erreur:error.message,id};}
}
export async function envoyerVerification(db,env,u){
 const precedent=await db.get('SELECT created_at FROM codes_verification WHERE user_id=? ORDER BY id DESC LIMIT 1',u.id);if(precedent)exiger(Date.now()-new Date(precedent.created_at.replace(' ','T')+'+01:00').getTime()>60000,'Attendez une minute avant de demander un nouveau code.',429);
 const code=String(crypto.getRandomValues(new Uint32Array(1))[0]%900000+100000),jeton=crypto.randomUUID()+crypto.randomUUID(),expire=new Date(Date.now()+30*60000).toISOString();
 await db.batch([['UPDATE codes_verification SET utilise_at=datetime(\'now\',\'localtime\') WHERE user_id=? AND utilise_at IS NULL',u.id],['INSERT INTO codes_verification(id,user_id,code,jeton,expire_at) VALUES (?,?,?,?,?)',uid(),u.id,code,jeton,expire]]);
 return envoyerMail(db,env,{to:u.email,subject:'Vérifiez votre email — Inventa GestyPro',text:'Votre code de vérification : '+code+'. Valable 30 minutes.',entreprise_id:u.entreprise_id,type:'verification'});
}
export async function routesMails(c){
 const {db,u,p,m,b,env}=c;
 if(p==='/entreprises/verification'&&m==='GET'){const cfg=await configurationMail(db,env);return{verifie:!!u.email_verifie,email:u.email,verification_requise:!u.email_verifie&&u.role!=='super_admin',smtp_configure:cfg.configure&&!cfg.problemes.length};}
 if(p==='/entreprises/verification/renvoyer'&&m==='POST'){if(u.email_verifie||u.role==='super_admin')return{ok:true,deja_verifie:true};const r=await envoyerVerification(db,env,u);return{...r,statut_envoi:r.statut,email:u.email};}
 if(p==='/entreprises/verification/valider'&&m==='POST'){
  await limiter(db,c.request,'verification:'+u.id,8,600000);const code=String(b.code||'').trim();exiger(code.length>=6&&code.length<=100,'Code invalide.');const r=await db.get('SELECT * FROM codes_verification WHERE user_id=? AND (code=? OR jeton=?) AND utilise_at IS NULL ORDER BY id DESC LIMIT 1',u.id,code,code);exiger(r&&new Date(r.expire_at).getTime()>Date.now(),'Code invalide ou expiré.');await db.batch([...assertion('EXISTS(SELECT 1 FROM codes_verification WHERE id=? AND utilise_at IS NULL)',[r.id]),['UPDATE codes_verification SET utilise_at=datetime(\'now\',\'localtime\') WHERE id=?',r.id],['UPDATE users SET email_verifie=1,email_verifie_at=datetime(\'now\',\'localtime\') WHERE id=?',u.id]]);return{ok:true,utilisateur:{...u,email_verifie:1,verification_requise:false}};
 }
 if(p==='/plateforme/mails/verifier-connexion'&&m==='POST'){proprietaire(u);return smtp(await configurationMail(db,env));}
 if(p==='/plateforme/mails/tester'&&m==='POST'){proprietaire(u);return envoyerMail(db,env,{to:b.email||u.email,subject:'Test de messagerie Inventa',text:'La connexion SMTP de votre application fonctionne.'});}
}
