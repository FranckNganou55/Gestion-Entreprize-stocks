/** Installation locale : compte applicatif limité à la base demandée. */
const mysql=require('mysql2/promise'),fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path'),D=require('better-sqlite3');
(async()=>{
 const c=await mysql.createConnection({host:'127.0.0.1',user:'root',password:process.env.MYSQL_ROOT_PASSWORD||'',dateStrings:true,decimalNumbers:true});
 try{
  const rapport=JSON.parse(fs.readFileSync('docs/migration-mysql-resultat.json','utf8'));
  if(rapport.base_mysql!=='gestion_enterprize'||rapport.exclusions.length)throw Error('Migration intégrale gestion_enterprize non terminée.');
  const source=new D('data/shopmanager.db',{readonly:true}),copie=new D(path.resolve(rapport.sauvegarde),{readonly:true});
  try{
   for(const {table} of rapport.tables){
    const hash=(db)=>crypto.createHash('sha256').update(JSON.stringify(db.prepare('SELECT * FROM `'+table+'` ORDER BY rowid').all())).digest('hex');
    if(hash(source)!==hash(copie))throw Error('La source a changé depuis la migration : '+table+'. Refaire une migration intégrale vers une nouvelle base avant la bascule.');
   }
   const proprio=source.prepare("SELECT id,mot_de_passe,role,actif FROM users WHERE role='super_admin' ORDER BY id").all();
   const [cibles]=await c.query("SELECT id,mot_de_passe,role,actif FROM gestion_enterprize.users WHERE role='super_admin' ORDER BY id");
   if(JSON.stringify(proprio)!==JSON.stringify(cibles))throw Error('Le compte propriétaire ne correspond pas à la source.');
  }finally{source.close();copie.close();}
  const configFile=path.resolve('data/database.json');if(fs.existsSync(configFile))throw Error('Configuration déjà présente, pas de remplacement automatique.');
  const utilisateur='gestion_app',motDePasse=crypto.randomBytes(36).toString('base64url');
  const [[existe]]=await c.query("SELECT COUNT(*) n FROM mysql.user WHERE user=? AND host='127.0.0.1'",[utilisateur]);
  if(existe.n)throw Error('Compte MySQL gestion_app déjà présent : aucun changement de ses identifiants.');
  await c.query("CREATE USER ?@'127.0.0.1' IDENTIFIED BY ?",[utilisateur,motDePasse]);
  await c.query("GRANT SELECT, INSERT, UPDATE, DELETE ON gestion_enterprize.* TO ?@'127.0.0.1'",[utilisateur]);
  fs.writeFileSync(configFile,JSON.stringify({driver:'mysql',host:'127.0.0.1',port:3306,database:'gestion_enterprize',user:utilisateur,password:motDePasse},null,2)+'\n',{flag:'wx',mode:0o600});
  console.log('MySQL activé : gestion_enterprize. Compte applicatif limité créé. Source et propriétaire vérifiés.');
 }finally{await c.end();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
