const { Worker, MessageChannel, receiveMessageOnPort } = require('node:worker_threads');
const path = require('node:path');

function traduire(sql) {
  let s=sql;
  // Les paramètres utilisateur restent liés, jamais interpolés dans ces transformations.
  s=s.replace(/\b(datetime|date)\(\s*'now'\s*(?:,\s*'localtime'\s*)?(?:,\s*'(-?\d+)\s+(day|month|year)s?'\s*)?\)/gi,(_,fn,n,unite)=>n?`DATE_ADD(${fn.toLowerCase()==='date'?'CURDATE()':'NOW()'}, INTERVAL ${Number(n)} ${unite.toUpperCase()})`:fn.toLowerCase()==='date'?'CURDATE()':'NOW()');
  s=s.replace(/strftime\(\s*'([^']+)'\s*,\s*'now'\s*(?:,\s*'localtime')?\s*\)/gi,(_,fmt)=>`DATE_FORMAT(NOW(), '${fmt.replace(/%M/g,'%i')}')`);
  s=s.replace(/strftime\(\s*'([^']+)'\s*,\s*([\w.]+)\s*\)/gi,(_,fmt,col)=>`DATE_FORMAT(${col}, '${fmt.replace(/%M/g,'%i')}')`);
  s=s.replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi,'INSERT IGNORE INTO');
  s=s.replace(/ON\s+CONFLICT\s*\([^)]*\)\s+DO\s+UPDATE\s+SET/gi,'ON DUPLICATE KEY UPDATE');
  s=s.replace(/excluded\.([\w]+)/gi,'VALUES(`$1`)');
  if(/ON\s+CONFLICT\s*\([^)]*\)\s+DO\s+NOTHING/i.test(s)) s=s.replace(/INSERT\s+INTO/i,'INSERT IGNORE INTO').replace(/ON\s+CONFLICT\s*\([^)]*\)\s+DO\s+NOTHING/i,'');
  // SQLite concatène avec || ; seules les expressions SQL connues l'utilisent.
  s=s.replace(/COALESCE\(note\s*\|\|\s*'([^']*)',\s*''\)\s*\|\|\s*\?/gi,"CONCAT(COALESCE(CONCAT(note, '$1'), ''), ?)");
  return s;
}

class MysqlAdapter {
  constructor(config) {
    this.moteur='mysql';this.database=config.database;this.ferme=false;
    const {port1,port2}=new MessageChannel();this.port=port1;
    this.worker=new Worker(path.join(__dirname,'mysql-worker.js'),{workerData:{config,port:port2},transferList:[port2]});
    this.worker.on('error',e=>{this.erreurWorker=e;});
    this.worker.unref();this.port.unref();
    this.prepare('SELECT 1 AS ok').get();
  }
  appel(op,sql,params) {
    if(this.ferme) throw Error('Connexion MySQL fermée.');
    if(this.erreurWorker) throw this.erreurWorker;
    const signal=new SharedArrayBuffer(4), vue=new Int32Array(signal);
    this.port.postMessage({op,sql,params,signal});
    if(Atomics.wait(vue,0,0,30000)==='timed-out') {
      this.ferme=true;this.worker.terminate();
      throw Error('Délai MySQL dépassé. Redémarrez le backend après vérification du serveur MySQL.');
    }
    const r=receiveMessageOnPort(this.port).message;
    if(r.erreur){const e=Object.assign(new Error(r.erreur.message),{code:r.erreur.code}); if(e.code==='ER_DUP_ENTRY')e.message='UNIQUE constraint failed: enregistrement déjà existant';throw e;}
    return r.resultat;
  }
  prepare(sql) {
    const adapter=this;
    function executer(args){
      let s=traduire(sql), params;
      if(args.length===1 && args[0] && typeof args[0]==='object' && !Array.isArray(args[0]) && !Buffer.isBuffer(args[0])) {
        params=[];s=s.replace(/[@:$]([a-zA-Z_]\w*)/g,(_,nom)=>{if(!(nom in args[0]))throw Error('Paramètre SQL absent : '+nom);params.push(args[0][nom]);return '?';});
      } else params=args.length===1&&Array.isArray(args[0])?args[0]:args;
      params=params.map(v=>v===undefined?null:typeof v==='boolean'?Number(v):v);
      return adapter.appel('query',s,params);
    }
    return {all(...args){return executer(args);},get(...args){return executer(args)[0];},run(...args){return executer(args);}};
  }
  exec(sql) {
    // Le schéma MySQL est installé par la migration contrôlée, pas par du DDL SQLite.
    for(const brut of sql.split(';')){
      const s=brut.trim();if(!s)continue;
      const table=s.match(/^CREATE TABLE IF NOT EXISTS\s+([\w]+)/i);
      if(table){if(!this.prepare('SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME=?').get(this.database,table[1]))throw Error('Migration MySQL manquante : '+table[1]);continue;}
      const index=s.match(/^CREATE INDEX IF NOT EXISTS\s+(\w+)\s+ON\s+(\w+)\s*\(([^)]+)\)/i);
      if(index){continue;} // Index intégralement repris depuis le schéma source vérifié.
      this.prepare(s).run();
    }
    return this;
  }
  transaction(fn) {
    const adapter=this;
    return function(...args){adapter.appel('begin');try{const r=fn.apply(this,args);if(r&&typeof r.then==='function')throw Error('Transaction synchrone attendue.');adapter.appel('commit');return r;}catch(e){try{adapter.appel('rollback');}catch{}throw e;}};
  }
  pragma(sql){if(/^wal_checkpoint/i.test(sql))return [];throw Error('PRAGMA SQLite indisponible en MySQL : '+sql);}
  close(){if(!this.ferme){this.appel('close');this.ferme=true;this.port.close();this.worker.terminate();}}
}
module.exports={MysqlAdapter,traduire};
