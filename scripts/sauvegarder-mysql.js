require('../server/configuration');
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const fichier=path.join(__dirname,'../data/database.json');
const config=fs.existsSync(fichier)?JSON.parse(fs.readFileSync(fichier,'utf8')):{};
const repertoire=path.join(__dirname,'../data/sauvegardes');fs.mkdirSync(repertoire,{recursive:true});
const cible=path.join(repertoire,'gestion_enterprize-'+new Date().toISOString().replace(/[:.]/g,'-')+'.sql');
const binaire=process.env.MYSQLDUMP_EXE || (process.platform==='win32'?'C:/wamp64/bin/mysql/mysql8.3.0/bin/mysqldump.exe':'mysqldump');
const r=spawnSync(binaire,['--host='+(process.env.MYSQL_HOST||config.host||'127.0.0.1'),'--port='+(process.env.MYSQL_PORT||config.port||3306),'--user='+(process.env.MYSQL_USER||config.user||'root'),'--single-transaction','--skip-lock-tables','--skip-triggers','--no-tablespaces','--set-gtid-purged=OFF','--default-character-set=utf8mb4',process.env.MYSQL_DATABASE||config.database||'gestion_enterprize'],{encoding:'utf8',env:{...process.env,MYSQL_PWD:process.env.MYSQL_PASSWORD??config.password??''},maxBuffer:128*1024*1024,windowsHide:true});
if(r.error||r.status!==0){console.error(r.error?r.error.message:r.stderr);process.exitCode=1;}
else{fs.writeFileSync(cible,r.stdout,'utf8');console.log('Sauvegarde MySQL créée : '+cible);}
