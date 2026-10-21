/** Copie de consultation SQLite -> MySQL. Ne modifie pas la base de l'application. */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const D = require('better-sqlite3');
const racine = path.resolve(__dirname, '..');
const mysql = process.env.MYSQL_EXE || 'C:/wamp64/bin/mysql/mysql8.3.0/bin/mysql.exe';
const cible = process.env.MYSQL_COPIE_BASE || 'inventa_gestypro';
const complet = process.env.MYSQL_MIGRATION_COMPLETE === '1';
if (!/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(cible)) throw Error('Nom de base invalide.');
const q = s => '`' + String(s).replace(/`/g, '``') + '`';
const str = x => x === null ? 'NULL' : typeof x === 'number' ? String(x) : 'CONVERT(0x' + Buffer.from(String(x), 'utf8').toString('hex') + ' USING utf8mb4)';
const sqlValeur = x => x === '' ? "''" : str(x);
function executer(sql, base) {
  const args = ['--host='+(process.env.MYSQL_HOST||'127.0.0.1'), '--port='+(process.env.MYSQL_PORT||'3306'), '--user='+(process.env.MYSQL_USER||'root'), '--default-character-set=utf8mb4', '--batch', '--raw', '--skip-column-names'];
  // Mot de passe par environnement MYSQL_PWD, jamais dans les arguments ou le rapport.
  if(base) args.push('--database='+base);
  const r = spawnSync(mysql,args,{input:sql,encoding:'utf8',maxBuffer:64*1024*1024,windowsHide:true});
  if(r.error) throw r.error;
  if(r.status!==0) throw Error((r.stderr||'Erreur MySQL').replace(/password[^\r\n]*/gi,'[information masquée]'));
  return r.stdout.trim();
}
(async()=>{
  const source = process.env.SQLITE_SOURCE ? path.resolve(process.env.SQLITE_SOURCE) : path.join(racine,'data/shopmanager.db');
  const repertoire = path.join(racine,'data/sauvegardes'); fs.mkdirSync(repertoire,{recursive:true});
  const stamp = new Date().toISOString().replace(/[:.]/g,'-');
  const copie = path.join(repertoire,'avant-copie-mysql-'+stamp+'.db');
  const vivant = new D(source,{readonly:true}); await vivant.backup(copie); vivant.close();
  const db = new D(copie,{readonly:true});
  try {
    if(db.pragma('integrity_check',{simple:true})!=='ok') throw Error('Intégrité de la source incorrecte.');
    const fkSource = db.pragma('foreign_key_check');
    if(fkSource.length) throw Error('Liens invalides dans la source : '+JSON.stringify(fkSource));
    const existe = executer("SELECT COUNT(*) FROM information_schema.SCHEMATA WHERE SCHEMA_NAME="+str(cible)+';');
    if(Number(existe)) throw Error('La base '+cible+' existe déjà. Aucun remplacement automatique. Choisissez MYSQL_COPIE_BASE avec un nouveau nom.');
    const owners = new Set(db.prepare("SELECT id FROM users WHERE role='super_admin'").all().map(u=>u.id));
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(t=>t.name);
    const schemas = new Map(), donnees = new Map(), liaisons = [];
    const rapport = { date:new Date().toISOString(), base_mysql:cible, hote:process.env.MYSQL_HOST||'127.0.0.1', port:process.env.MYSQL_PORT||'3306', application:complet?'Migration intégrale pour utilisation MySQL':'SQLite inchangé', sauvegarde:path.relative(racine,copie), tables:[], proprietaires_conserves:owners.size, exclusions:complet?[]:['Comptes super_admin','Paramètres plateforme (SMTP, clés de paiement, etc.)','Emails archivés et codes de vérification','Empreintes des mots de passe remplacées par un marqueur inutilisable dans la copie'] };
    for(const t of tables){
      const cols=db.pragma('table_info('+JSON.stringify(t)+')');
      const indices=db.pragma('index_list('+JSON.stringify(t)+')').filter(i=>!i.partial);
      const idx=indices.map(i=>({...i,cols:db.pragma('index_info('+JSON.stringify(i.name)+')').map(c=>c.name)})).filter(i=>i.cols.every(Boolean));
      const indexees=new Set([...cols.filter(c=>c.pk).map(c=>c.name),...idx.flatMap(i=>i.cols)]);
      const pk=cols.filter(c=>c.pk).sort((a,b)=>a.pk-b.pk).map(c=>c.name);
      const definitions=cols.map(c=>{
        const dateHeure=complet&&/datetime\('now'/i.test(c.dflt_value||''), dateJour=complet&&!dateHeure&&/date\('now'/i.test(c.dflt_value||'');
        const type=dateHeure?'DATETIME':dateJour?'DATE':/INT/i.test(c.type)?'BIGINT':/REAL|FLOAT|DOUBLE|NUMERIC/i.test(c.type)?'DOUBLE':/BLOB/i.test(c.type)?'LONGBLOB':indexees.has(c.name)?'VARCHAR(255) COLLATE utf8mb4_bin':'LONGTEXT COLLATE utf8mb4_bin';
        const auto=pk.length===1&&c.pk&&/INT/i.test(c.type);
        let def='';
        if(complet&&!auto&&c.dflt_value!==null) def=dateHeure?' DEFAULT CURRENT_TIMESTAMP':dateJour?' DEFAULT (CURRENT_DATE)':' DEFAULT ('+c.dflt_value+')';
        return q(c.name)+' '+type+(c.notnull||c.pk?' NOT NULL':' NULL')+(auto?' AUTO_INCREMENT':'')+def;
      });
      if(pk.length) definitions.push('PRIMARY KEY ('+pk.map(q).join(',')+')');
      idx.filter(i=>i.origin!=='pk').forEach((i,n)=>definitions.push((i.unique?'UNIQUE ':'')+'KEY '+q('idx_'+t+'_'+n)+' ('+i.cols.map(q).join(',')+')'));
      schemas.set(t,'CREATE TABLE '+q(t)+' ('+definitions.join(',')+') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;');
      const fks=db.pragma('foreign_key_list('+JSON.stringify(t)+')');
      for(const fk of fks) liaisons.push({enfant:t,...fk});
      let rows=db.prepare('SELECT * FROM '+q(t)).all();
      if(!complet&&t==='users') rows=rows.filter(r=>!owners.has(r.id)).map(r=>({...r,mot_de_passe:'!copie-consultation-sans-authentification'}));
      if(!complet&&t==='parametres') rows=rows.filter(r=>r.entreprise_id>0);
      if(!complet&&['mails_envoyes','codes_verification'].includes(t)) rows=[];
      rows=rows.map(row=>{
        const r={...row};
        for(const fk of fks) if(!complet&&fk.table==='users'&&owners.has(r[fk.from])) r[fk.from]=null;
        if(!complet&&t==='journal_evenements'&&owners.has(r.user_id)) r.user_id=null;
        // Champs PSP de suivi : aucun jeton de session de paiement exporté.
        if(!complet&&t==='paiements_abonnement') for(const k of ['psp_ticket','psp_url','psp_brut']) if(k in r) r[k]=null;
        return r;
      });
      for(const c of cols) if(indexees.has(c.name)&&/TEXT/i.test(c.type)&&rows.some(r=>r[c.name]&&String(r[c.name]).length>255)) throw Error('Valeur indexée trop longue : '+t+'.'+c.name);
      donnees.set(t,{cols,rows});
    }
    executer('CREATE DATABASE '+q(cible)+' CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;');
    executer([...schemas.values()].join('\n'),cible);
    if(!complet) executer('CREATE TABLE copie_informations (cle VARCHAR(100) PRIMARY KEY, valeur LONGTEXT); INSERT INTO copie_informations VALUES (\'usage\',\'Copie de consultation uniquement. Application sur SQLite.\'),(\'date_utc\','+str(rapport.date)+');',cible);
    for(const [t,{cols,rows}] of donnees){
      const insertions=[];
      for(let i=0;i<rows.length;i+=150){
        const lot=rows.slice(i,i+150);
        insertions.push('INSERT INTO '+q(t)+' ('+cols.map(c=>q(c.name)).join(',')+') VALUES '+lot.map(r=>'('+cols.map(c=>sqlValeur(r[c.name])).join(',')+')').join(',')+';');
      }
      if(insertions.length) executer('START TRANSACTION;\n'+insertions.join('\n')+'\nCOMMIT;',cible);
      const compte=Number(executer('SELECT COUNT(*) FROM '+q(t)+';',cible));
      if(compte!==rows.length) throw Error('Nombre de lignes différent pour '+t);
      // Comparaison intégrale des valeurs transformées : texte en hex UTF-8 et nombres normalisés.
      const valeurs=cols.map(c=>'IF('+q(c.name)+' IS NULL,\'NULL\',HEX(CAST('+q(c.name)+' AS CHAR CHARACTER SET utf8mb4)))');
      const mysqlRows=executer('SELECT CONCAT_WS(\'|\','+valeurs.join(',')+') FROM '+q(t)+';',cible);
      const sourceRows=rows.map(r=>cols.map(c=>r[c.name]===null?'NULL':Buffer.from(String(r[c.name]),'utf8').toString('hex').toUpperCase()).join('|'));
      const normalize=x=>x.split('|').map((v,i)=>/REAL|FLOAT|DOUBLE|NUMERIC/i.test(cols[i].type)&&v!=='NULL'?String(Number(Buffer.from(v,'hex').toString('utf8'))):v).join('|');
      const attendu=sourceRows.map(normalize).sort(), obtenu=(mysqlRows?mysqlRows.split(/\r?\n/):[]).map(normalize).sort();
      const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
      if(hash(attendu)!==hash(obtenu)) throw Error('Valeurs différentes pour '+t);
      rapport.tables.push({table:t,lignes:compte,contenu_verifie:true});
      console.log(t+' : '+compte+' lignes vérifiées');
    }
    for(const [i,fk] of liaisons.entries()){
      const orphelins=Number(executer('SELECT COUNT(*) FROM '+q(fk.enfant)+' c LEFT JOIN '+q(fk.table)+' p ON p.'+q(fk.to)+'=c.'+q(fk.from)+' WHERE c.'+q(fk.from)+' IS NOT NULL AND p.'+q(fk.to)+' IS NULL;',cible));
      if(orphelins) throw Error('Référence invalide : '+fk.enfant+'.'+fk.from);
      const action=['CASCADE','SET NULL','RESTRICT','NO ACTION'].includes(fk.on_delete)?fk.on_delete:'RESTRICT';
      executer('ALTER TABLE '+q(fk.enfant)+' ADD CONSTRAINT '+q('fk_copie_'+i)+' FOREIGN KEY ('+q(fk.from)+') REFERENCES '+q(fk.table)+' ('+q(fk.to)+') ON DELETE '+action+';',cible);
    }
    rapport.liaisons_verifiees=liaisons.length;
    rapport.total_lignes=rapport.tables.reduce((s,t)=>s+t.lignes,0);
    const fichierRapport=path.join(racine,complet?'docs/migration-mysql-resultat.json':'docs/copie-mysql-resultat.json');fs.writeFileSync(fichierRapport,JSON.stringify(rapport,null,2)+'\n');
    console.log('Copie terminée : '+cible+' — '+rapport.total_lignes+' lignes.');
  } finally {db.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
