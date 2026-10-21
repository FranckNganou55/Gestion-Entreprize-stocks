/** Assistant temporaire, lié uniquement à 127.0.0.1. Ne publie jamais les mots de passe. */
require('../server/configuration');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),mysql=require('mysql2/promise'),bcrypt=require('bcryptjs');
const cfg=JSON.parse(fs.readFileSync('data/database.json','utf8')),nonce=crypto.randomBytes(32).toString('hex');
const dossier=path.resolve('data/d1');fs.mkdirSync(dossier,{recursive:true});
const server=http.createServer(async(req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Frame-Options','DENY');res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'");
 if(req.method==='GET'&&req.url==='/'){
  res.setHeader('Content-Type','text/html; charset=utf-8');res.end(`<!doctype html><html lang="fr"><meta charset="utf-8"><title>Préparer mon accès Cloudflare</title><style>body{font:17px system-ui;background:#f1f5f9;color:#172033;max-width:560px;margin:8vh auto;padding:24px}form{background:white;padding:28px;border-radius:16px}input,button{box-sizing:border-box;display:block;width:100%;padding:14px;margin:8px 0 20px;border:1px solid #cbd5e1;border-radius:8px}button{background:#087f83;color:white;font-weight:bold}p{line-height:1.6}</style><h1>Conserver mon accès propriétaire</h1><p>Confirmez vos identifiants actuels de l’application locale. Cette opération prépare votre accès Cloudflare sans changer votre mot de passe local. Le mot de passe ne sera ni enregistré ni publié.</p><form method="post"><input type="hidden" name="nonce" value="${nonce}"><label>Email du propriétaire<input name="email" type="email" autocomplete="username" required></label><label>Mot de passe actuel<input name="password" type="password" autocomplete="current-password" required minlength="8"></label><button>Préparer mon accès Cloudflare</button></form></html>`);return;
 }
 if(req.method!=='POST'||req.url!=='/'){res.writeHead(404);res.end();return;}
 if(req.headers.origin!=='http://127.0.0.1:3012'){res.writeHead(403);res.end('Origine refusée.');return;}
 let db;
 try{
  let body='';for await(const chunk of req){body+=chunk;if(body.length>4000)throw Error('Requête trop longue.');}const f=new URLSearchParams(body);if(f.get('nonce')!==nonce)throw Error('Rechargez la page.');
  db=await mysql.createConnection({host:cfg.host,port:cfg.port,user:cfg.user,password:cfg.password,database:cfg.database});const [rows]=await db.execute("SELECT id,email,mot_de_passe FROM users WHERE email=? AND role='super_admin' AND entreprise_id IS NULL AND actif=1",[String(f.get('email')||'').trim().toLowerCase()]);const owner=rows[0],password=f.get('password')||'';
  if(!owner||!await bcrypt.compare(password,owner.mot_de_passe))throw Error('Identifiants du propriétaire incorrects.');
  const {empreinte}=await import('../cloudflare/d1/auth.mjs');const hash=await empreinte(password),mapping=fs.existsSync(path.join(dossier,'empreintes.json'))?JSON.parse(fs.readFileSync(path.join(dossier,'empreintes.json'),'utf8')):{};
  mapping[String(owner.id)]={email:owner.email,empreinte:hash};fs.writeFileSync(path.join(dossier,'empreintes.json'),JSON.stringify(mapping,null,2));
  // Le WHERE conserve l'identité et évite de modifier un compte qui aurait changé depuis l'export.
  const lit=v=>"'"+String(v).replace(/'/g,"''")+"'";fs.writeFileSync(path.join(dossier,'acces-proprietaire.sql'),'UPDATE users SET mot_de_passe='+lit(hash)+' WHERE id='+Number(owner.id)+' AND email='+lit(owner.email)+" AND role='super_admin';\n");
  res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<h1>Accès préparé</h1><p>Votre identité et votre mot de passe sont conservés pour Cloudflare. Vous pouvez fermer cette page.</p>');console.log('Accès propriétaire préparé dans data/d1 (empreinte uniquement, aucun mot de passe enregistré).');server.close();
 }catch(error){res.writeHead(400,{'Content-Type':'text/plain; charset=utf-8'});res.end(error.message);}finally{if(db)await db.end();}
});
server.listen(3012,'127.0.0.1',()=>console.log('Assistant privé : http://127.0.0.1:3012'));
