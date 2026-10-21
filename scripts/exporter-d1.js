/** Export privé MySQL -> D1. Aucune modification de la base source. */
require('../server/configuration');
const fs=require('node:fs'),path=require('node:path'),mysql=require('mysql2/promise'),D=require('better-sqlite3');
async function main(){
 const cfg=JSON.parse(fs.readFileSync(path.resolve('data/database.json'),'utf8'));
 const source=await mysql.createConnection({host:process.env.MYSQL_HOST||cfg.host||'127.0.0.1',port:Number(process.env.MYSQL_PORT||cfg.port||3306),user:process.env.MYSQL_USER||cfg.user,password:process.env.MYSQL_PASSWORD??cfg.password,database:process.env.MYSQL_DATABASE||cfg.database,dateStrings:true});
 const destination=new D(':memory:');destination.pragma('foreign_keys=ON');destination.exec(fs.readFileSync('database/d1/0001_schema.sql','utf8'));
 const noms=destination.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'd1_%' ORDER BY name").all().map(r=>r.name);
 const tables=[],vus=new Set(),enCours=new Set();
 function ajouter(table){if(vus.has(table))return;if(enCours.has(table))throw Error('Dépendance cyclique entre tables : '+table);enCours.add(table);for(const fk of destination.prepare('PRAGMA foreign_key_list("'+table+'")').all())if(fk.table!==table&&noms.includes(fk.table))ajouter(fk.table);enCours.delete(table);vus.add(table);tables.push(table);}
 noms.forEach(ajouter);
 const identifier=s=>'"'+s.replace(/"/g,'""')+'"';
 const literal=v=>v===null||v===undefined?'NULL':Buffer.isBuffer(v)?"X'"+v.toString('hex')+"'":typeof v==='number'?String(v):"'"+String(v).replace(/'/g,"''")+"'";
 const empreintes=fs.existsSync('data/d1/empreintes.json')?JSON.parse(fs.readFileSync('data/d1/empreintes.json','utf8')):{};
 const statements=['-- Données privées : ne pas publier sur GitHub.','PRAGMA defer_foreign_keys=ON;'];
 const rapport={date:new Date().toISOString(),source:'gestion_enterprize',tables:{},comptes_a_adapter:0};
 let snapshot=false;
 try{
  await source.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');await source.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');snapshot=true;
  destination.exec('BEGIN; PRAGMA defer_foreign_keys=ON;');
  for(const table of tables){
   let [rows]=await source.query('SELECT * FROM `'+table+'`');
   const self=destination.prepare('PRAGMA foreign_key_list("'+table+'")').all().filter(fk=>fk.table===table);
   if(self.length){const ordered=[],done=new Set(),pending=[...rows];while(pending.length){const i=pending.findIndex(r=>self.every(fk=>r[fk.from]===null||r[fk.from]===r[fk.to]||done.has(r[fk.from])));if(i<0)throw Error('Dépendance cyclique entre lignes : '+table);const [row]=pending.splice(i,1);ordered.push(row);done.add(row.id);}rows=ordered;}
   const columns=destination.prepare('PRAGMA table_info('+identifier(table)+')').all().map(c=>c.name);
   rapport.tables[table]=rows.length;
   if(!rows.length)continue;
   const fields=columns.filter(c=>Object.hasOwn(rows[0],c));
   const sql=(table==='roles'?'INSERT OR REPLACE INTO ':'INSERT INTO ')+identifier(table)+' ('+fields.map(identifier).join(',')+') VALUES ('+fields.map(()=>'?').join(',')+')';
   const insert=destination.prepare(sql);
   for(const row of rows){
    if(table==='users'&&empreintes[String(row.id)]?.email===row.email){const hash=empreintes[String(row.id)].empreinte;if(!/^pbkdf2-sha256\$100000\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/.test(hash))throw Error('Empreinte privée invalide.');row.mot_de_passe=hash;}
    const values=fields.map(c=>row[c]);insert.run(...values);
    const line=(table==='roles'?'INSERT OR REPLACE INTO ':'INSERT INTO ')+identifier(table)+' ('+fields.map(identifier).join(',')+') VALUES ('+values.map(literal).join(',')+');';
    if(Buffer.byteLength(line)>95000)throw Error('Une ligne dépasse la taille SQL de D1 : '+table+'. Export annulé sans modification de MySQL.');
    statements.push(line);
   }
  }
  // Les rôles personnalisés importés sont attribués à leur entreprise d'origine.
  const isolate="UPDATE roles SET entreprise_id=(SELECT MIN(entreprise_id) FROM users WHERE users.role=roles.code) WHERE systeme=0 AND (SELECT COUNT(DISTINCT entreprise_id) FROM users WHERE users.role=roles.code)=1";
  destination.exec(isolate);statements.push(isolate+';');
  const foreign=destination.pragma('foreign_key_check');if(foreign.length)throw Error('Références invalides dans l’export : '+foreign.length);
  destination.exec('COMMIT');
  rapport.comptes_a_adapter=destination.prepare("SELECT COUNT(*) n FROM users WHERE actif=1 AND mot_de_passe NOT LIKE 'pbkdf2-sha256$%'").get().n;
  rapport.integrite=destination.pragma('integrity_check',{simple:true});
  if(rapport.integrite!=='ok')throw Error('Intégrité non validée.');
  const target=path.resolve('data/d1');fs.mkdirSync(target,{recursive:true});
  fs.writeFileSync(path.join(target,'import.sql'),statements.join('\n')+'\n');
  fs.writeFileSync(path.join(target,'rapport.json'),JSON.stringify(rapport,null,2)+'\n');
  console.log('Export privé validé : '+Object.values(rapport.tables).reduce((a,b)=>a+b,0)+' lignes dans '+tables.length+' tables.');
  console.log('Fichier : data/d1/import.sql (exclu de Git). Comptes nécessitant adaptation du mot de passe : '+rapport.comptes_a_adapter+'.');
 }finally{if(snapshot)await source.rollback();await source.end();destination.close();}
}
main().catch(e=>{console.error('Export D1 interrompu : '+e.message);process.exitCode=1;});
