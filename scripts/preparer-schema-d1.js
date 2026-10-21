/** Produit uniquement le schéma public, sans données d'entreprise. */
const fs=require('node:fs'),path=require('node:path'),D=require('better-sqlite3');
const dossier=path.resolve('data/sauvegardes');
const fichier=process.env.D1_SCHEMA_SOURCE||fs.readdirSync(dossier).filter(f=>/^sqlite-retire-.*\.db$/.test(f)).sort().at(-1);
if(!fichier)throw Error('Archive SQLite de référence absente.');
const db=new D(path.isAbsolute(fichier)?fichier:path.join(dossier,fichier),{readonly:true});
try{
 const schema=db.prepare("SELECT sql FROM sqlite_master WHERE type IN ('table','index') AND name NOT LIKE 'sqlite_%' AND sql IS NOT NULL ORDER BY type DESC,name").all().map(r=>r.sql.replace(/^CREATE TABLE /,'CREATE TABLE IF NOT EXISTS ').replace(/^CREATE INDEX /,'CREATE INDEX IF NOT EXISTS ').replace(/'localtime'/g,"'+1 hour'")+';').join('\n\n');
 const roles=db.prepare('SELECT * FROM roles WHERE systeme=1').all();
 const lit=v=>v===null?'NULL':typeof v==='number'?String(v):"'"+String(v).replace(/'/g,"''")+"'";
 const seed=roles.map(r=>'INSERT OR IGNORE INTO roles ('+Object.keys(r).map(k=>'"'+k+'"').join(',')+') VALUES ('+Object.values(r).map(lit).join(',')+');').join('\n');
 fs.mkdirSync('database/d1',{recursive:true});
 fs.writeFileSync('database/d1/0001_schema.sql',schema+'\n\n'+seed+`\nCREATE TABLE IF NOT EXISTS d1_assertions (id TEXT PRIMARY KEY,condition INTEGER NOT NULL CHECK(condition=1));
CREATE TABLE IF NOT EXISTS d1_documents_chunks (nom_stocke TEXT NOT NULL,position INTEGER NOT NULL,contenu BLOB NOT NULL,PRIMARY KEY(nom_stocke,position));
CREATE TABLE IF NOT EXISTS d1_installation (cle TEXT PRIMARY KEY,valeur TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS d1_sequences (nom TEXT PRIMARY KEY,valeur INTEGER NOT NULL);
INSERT OR IGNORE INTO d1_sequences(nom,valeur) VALUES ('ids',1000000000000);
ALTER TABLE roles ADD COLUMN entreprise_id INTEGER;
`);
 console.log('Schéma D1 public généré, sans données métier ni identifiants.');
}finally{db.close();}
