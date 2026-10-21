/** MySQL en production ; SQLite réservé aux anciens tests avec SP_DB explicite. */
const fs = require('node:fs');
require('./configuration');
const path = require('node:path');
const fichier = path.join(__dirname,'../data/database.json');
const config = fs.existsSync(fichier) ? JSON.parse(fs.readFileSync(fichier,'utf8')) : {};
const moteur = process.env.SP_DB ? 'sqlite' : process.env.DB_CLIENT || config.driver || 'mysql';
if (moteur === 'sqlite') module.exports = require('./db-sqlite');
else if (moteur === 'mysql') module.exports = require('./db-mysql').ouvrir(config);
else throw Error('Moteur de base de données inconnu : '+moteur);
