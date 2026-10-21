/* Connexion MySQL isolée pour conserver les transactions synchrones existantes. */
const { workerData } = require('node:worker_threads');
const mysql = require('mysql2/promise');
const port = workerData.port;
let connexion, profondeur = 0;
async function connecter() {
  if (!connexion) {
    connexion = await mysql.createConnection({ ...workerData.config, dateStrings:true, decimalNumbers:true, supportBigNumbers:true, bigNumberStrings:false, multipleStatements:false, charset:'utf8mb4', connectTimeout:10000 });
    connexion.on('error',()=>{connexion=null;});
    await connexion.query("SET time_zone='+01:00'");
    // Les rapports historiques utilisent le GROUP BY permissif de SQLite.
    await connexion.query("SET SESSION sql_mode=REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY','')");
  }
  return connexion;
}
let file = Promise.resolve();
port.on('message', message => { file = file.then(async()=>{
  const signal = new Int32Array(message.signal);
  let reponse;
  try {
    const c=await connecter();
    if(message.op==='close'){await c.end();connexion=null;reponse={resultat:true};}
    else if(message.op==='begin') { await c.query(profondeur ? 'SAVEPOINT sp_'+profondeur : 'START TRANSACTION'); profondeur++; reponse={resultat:true}; }
    else if(message.op==='commit') { profondeur--; await c.query(profondeur ? 'RELEASE SAVEPOINT sp_'+profondeur : 'COMMIT'); reponse={resultat:true}; }
    else if(message.op==='rollback') { profondeur--; await c.query(profondeur ? 'ROLLBACK TO SAVEPOINT sp_'+profondeur : 'ROLLBACK'); reponse={resultat:true}; }
    else {const [r]=await c.execute(message.sql,message.params||[]); reponse={resultat:Array.isArray(r)?r.map(x=>({...x})):{changes:r.affectedRows,lastInsertRowid:r.insertId}};}
  } catch(e) { reponse={erreur:{message:e.message,code:e.code}}; }
  port.postMessage(reponse); Atomics.store(signal,0,1); Atomics.notify(signal,0);
}).catch(()=>{}); });
