const fs=require('node:fs'),path=require('node:path');
const mysql=require('mysql2/promise'),D=require('better-sqlite3');
(async()=>{
 const conf=JSON.parse(fs.readFileSync('data/database.json','utf8'));
 if(conf.driver!=='mysql'||conf.database!=='gestion_enterprize')throw Error('Configuration MySQL définitive absente.');
 const etat=await(await fetch('http://127.0.0.1:3001/api/sante')).json();
 if(etat.stockage?.moteur!=='mysql')throw Error('Le backend n’utilise pas MySQL.');
 const c=await mysql.createConnection({host:'127.0.0.1',user:'root',password:process.env.MYSQL_ROOT_PASSWORD||''});
 try{
  const source=path.resolve('data/shopmanager.db');
  if(fs.existsSync(source)){
   const db=new D(source);db.pragma('wal_checkpoint(TRUNCATE)');db.close();
   const cible=path.resolve('data/sauvegardes/sqlite-retire-'+new Date().toISOString().replace(/[:.]/g,'-')+'.db');
   // Déplacement d’un fichier nommé, vers le dossier de sauvegarde du projet.
   if(!cible.startsWith(path.resolve('data/sauvegardes')+path.sep))throw Error('Destination invalide.');
   fs.renameSync(source,cible);console.log('Ancienne base archivée : '+path.relative(process.cwd(),cible));
  }
  // Seules les deux copies provisoires créées par cette migration sont retirées.
  for(const [base,rapport] of [['inventa_gestypro','docs/copie-mysql-resultat.json'],['inventa_gestypro_app',null]]){
   if(rapport&&JSON.parse(fs.readFileSync(rapport,'utf8')).base_mysql!==base)throw Error('Copie provisoire non reconnue.');
   const [[r]]=await c.query('SELECT COUNT(*) n FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME=\'entreprises\'',[base]);
   if(r.n)await c.query('DROP DATABASE `'+base+'`');
  }
  console.log('Une seule base applicative conservée : gestion_enterprize.');
 }finally{await c.end();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
