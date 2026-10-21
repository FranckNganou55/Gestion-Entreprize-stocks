const fs=require('node:fs'),path=require('node:path');
const env=path.join(__dirname,'../.env');
if(fs.existsSync(env))process.loadEnvFile(env);
function verifierProduction(){
 if(process.env.NODE_ENV!=='production')return;
 if(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32)throw Error('Production : JWT_SECRET privé de 32 caractères minimum requis.');
 if(process.env.SP_DB||process.env.DB_CLIENT==='sqlite')throw Error('Production : MySQL obligatoire, retirer SP_DB.');
 if(!process.env.MYSQL_DATABASE||!process.env.MYSQL_USER||!process.env.MYSQL_HOST)throw Error('Production : renseigner MYSQL_HOST, MYSQL_DATABASE et MYSQL_USER.');
 if(!process.env.MYSQL_PASSWORD)throw Error('Production : MYSQL_PASSWORD requis.');
}
module.exports={verifierProduction};
