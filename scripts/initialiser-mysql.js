require('../server/configuration');
const fs=require('node:fs'),path=require('node:path'),mysql=require('mysql2/promise');
(async()=>{
 const fichier=path.join(__dirname,'../data/database.json');
 const local=fs.existsSync(fichier)?JSON.parse(fs.readFileSync(fichier,'utf8')):{};
 const c=await mysql.createConnection({host:process.env.MYSQL_HOST||local.host||'127.0.0.1',port:Number(process.env.MYSQL_PORT||local.port||3306),user:process.env.MYSQL_USER||local.user,password:process.env.MYSQL_PASSWORD??local.password,database:process.env.MYSQL_DATABASE||local.database||'gestion_enterprize',multipleStatements:true,...(process.env.MYSQL_SSL==='true'?{ssl:{rejectUnauthorized:true,...(process.env.MYSQL_SSL_CA?{ca:process.env.MYSQL_SSL_CA.replace(/\\n/g,'\n')}:{})}}:{})});
 try{
  const [[verrou]]=await c.query("SELECT GET_LOCK(CONCAT(DATABASE(), ':schema'),30) acquis");
  if(!verrou.acquis)throw Error('Initialisation déjà en cours : réessayer.');
  const [[r]]=await c.query('SELECT COUNT(*) n FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()');
  if(r.n){console.log('Base existante conservée ; aucune table ni donnée remplacée.');return;}
  await c.query(fs.readFileSync(path.join(__dirname,'../database/schema.sql'),'utf8'));
  console.log('Schéma MySQL installé. Au démarrage, le propriétaire sera créé depuis OWNER_EMAIL et OWNER_PASSWORD.');
 }finally{await c.query("SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':schema'))");await c.end();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
