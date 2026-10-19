const assert = require('node:assert/strict');
const path = require('path');
const D = require('better-sqlite3');
const { spawn } = require('child_process');
const { JSDOM, VirtualConsole } = require('jsdom');
const pause = ms => new Promise(r => setTimeout(r, ms));
let n = 0;
function ok(nom, v) { assert.ok(v, nom); console.log('OK ' + nom); n++; }
(async () => {
  const fichier = path.resolve('data/test-caisse-promotions.db');
  const src = new D('data/verification-demandes.db', { readonly: true });
  await src.backup(fichier); src.close();
  const db = new D(fichier);
  db.prepare("DELETE FROM parametres WHERE cle LIKE 'smtp_%'").run();
  const base = 'http://127.0.0.1:3014';
  const serveur = spawn(process.execPath, ['server/index.js'], { env: { ...process.env, SP_DB: fichier, PORT: '3014', HOST: '127.0.0.1' }, stdio: 'ignore' });
  let dom;
  async function api(route, method, body, token) {
    const r = await fetch(base + '/api' + route, { method: method || 'GET', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: r.status, data: await r.json() };
  }
  try {
    for (let i=0;i<100;i++) { try { if ((await fetch(base+'/api/sante')).ok) break; } catch {} await pause(100); }
    const admin = (await api('/auth/login','POST',{email:'admin@shoppingplus.cm',mot_de_passe:'Admin@2026'})).data.token;
    const caisse = (await api('/auth/login','POST',{email:'caisse1@shoppingplus.cm',mot_de_passe:'Caisse@2026'})).data.token;
    ok('Connexion administrateur et caissière', admin && caisse);
    let r = await api('/clients','POST',{nom:'Client panier test',telephone:'699112233'},caisse);
    ok('Caissière : création du client',r.status===201); const client=r.data;
    r=await api('/clients',null,undefined,caisse);ok('Client disponible dans la liste',r.data.some(c=>c.id===client.id));
    const code='PANIER'+Date.now();
    const p={code,type:'pourcentage',valeur:10,client_id:client.id,maximum_usages:1};
    r=await api('/promotions-clients','POST',p,caisse);ok('La caissière ne peut pas créer un code',r.status===403);
    r=await api('/promotions-clients','POST',p,admin);ok('Administrateur : création du code',r.status===201);const promo=r.data;
    r=await api('/promotions-clients','POST',p,admin);ok('Doublon refusé',r.status===409);
    r=await api('/caisse/promo/verifier','POST',{code,client_id:client.id,montant:10000},caisse);ok('Code valide : pourcentage, remise et total',r.status===200&&r.data.remise===1000&&r.data.total===9000);
    r=await api('/caisse/promo/verifier','POST',{code,montant:10000},caisse);ok('Client bénéficiaire obligatoire',r.status===400);
    r=await api('/caisse/promo/verifier','POST',{code:'INEXISTANT',montant:10000},caisse);ok('Code inconnu refusé',r.status===400);
    const ent=db.prepare('SELECT entreprise_id FROM clients WHERE id=?').get(client.id).entreprise_id;
    const stock=db.prepare(`SELECT s.*,p.prix_vente FROM stocks s JOIN produits p ON p.id=s.produit_id JOIN magasins m ON m.id=s.magasin_id WHERE s.magasin_id=1 AND m.entreprise_id=? AND s.quantite>=3 AND p.prix_vente>0 LIMIT 1`).get(ent);
    assert.ok(stock);
    const vente={magasin_id:1,client_id:client.id,lignes:[{produit_id:stock.produit_id,quantite:1}],code_promo:code,montant_paye:10000000};
    r=await api('/ventes','POST',{...vente,remise:999},caisse);ok('Cumul avec remise manuelle refusé',r.status===400);
    r=await api('/ventes','POST',vente,caisse);ok('Vente : remise recalculée côté serveur',r.status===201&&r.data.remise===Math.round(stock.prix_vente*.1));
    ok('Utilisation enregistrée avec la vente',db.prepare('SELECT COUNT(*) n FROM promotions_utilisations WHERE promotion_id=?').get(promo.id).n===1);
    r=await api('/ventes','POST',vente,caisse);ok('Code épuisé refusé à l’encaissement',r.status===400);
    const fixe=await api('/promotions-clients','POST',{code:code+'F',type:'montant',valeur:50000,minimum:100},admin);
    r=await api('/caisse/promo/verifier','POST',{code:fixe.data.code,montant:1000},caisse);ok('Montant fixe plafonné au panier',r.data.remise===1000&&r.data.total===0);
    r=await api('/caisse/promo/verifier','POST',{code:fixe.data.code,montant:50},caisse);ok('Minimum du panier respecté',r.status===400);
    await api('/promotions-clients/'+fixe.data.id,'PUT',{actif:false},admin);
    r=await api('/caisse/promo/verifier','POST',{code:fixe.data.code,montant:1000},caisse);ok('Code désactivé refusé',r.status===400);
    await api('/promotions-clients','POST',{code:code+'E',type:'montant',valeur:100,fin:'2020-01-01'},admin);
    r=await api('/caisse/promo/verifier','POST',{code:code+'E',montant:1000},caisse);ok('Code expiré refusé',r.status===400);
    const other=db.prepare('SELECT id FROM entreprises WHERE id<>? LIMIT 1').get(ent);
    if(other){db.prepare('UPDATE promotions_clients SET entreprise_id=? WHERE id=?').run(other.id,fixe.data.id);r=await api('/caisse/promo/verifier','POST',{code:fixe.data.code,montant:1000},caisse);ok('Code autre entreprise inaccessible',r.status===400);}
    dom=await JSDOM.fromURL(base+'/#/caisse',{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,virtualConsole:new VirtualConsole(),beforeParse(w){w.localStorage.setItem('sp_token',caisse);w.fetch=(u,o)=>fetch(new URL(u,base),o);w.alert=()=>{};}});
    const w=dom.window;
    for(let i=0;i<100&&!w.document.querySelector('#pos-nouveau-client');i++)await pause(100);
    ok('Panier : création client accessible aux caissières',!!w.document.querySelector('#pos-nouveau-client'));
    w.document.querySelector('#pos-nouveau-client').click();
    w.document.querySelector('.modale input[name=nom]').value='Client créé depuis le panier';
    w.document.querySelector('[data-ajouter]').click();
    for(let i=0;i<50&&w.document.querySelector('[data-ajouter]');i++)await pause(100);
    const sel=w.document.querySelector('#pos-client');ok('Client créé et sélectionné sans quitter le panier',sel.selectedOptions[0].textContent.includes('Client créé depuis le panier'));
    w.document.querySelector('.pos-produit:not([disabled])').click();
    const inp=w.document.querySelector('#pos-promo');inp.value=code+'E';inp.dispatchEvent(new w.Event('input'));w.document.querySelector('#pos-verifier-promo').click();
    for(let i=0;i<50&&!w.document.querySelector('#pos-resultat-promo').textContent.includes('expiré');i++)await pause(100);
    ok('Caisse : motif d’invalidité visible et encaissement bloqué',w.document.querySelector('#pos-resultat-promo').textContent.includes('expiré')&&w.document.querySelector('#pos-valider').disabled);
    w.document.querySelector('#pos-retirer-promo').click();ok('Retirer un code permet de poursuivre sans réduction',!w.document.querySelector('#pos-valider').disabled);
    await api('/promotions-clients','POST',{code:code+'UI',type:'pourcentage',valeur:15},admin);
    const champ=w.document.querySelector('#pos-promo');champ.value=code+'UI';champ.dispatchEvent(new w.Event('input'));w.document.querySelector('#pos-verifier-promo').click();
    for(let i=0;i<50&&!w.document.querySelector('#pos-resultat-promo').textContent.includes('15 %');i++)await pause(100);
    ok('Code valide : remise visible et montant appliqué dans le panier',w.document.querySelector('#pos-resultat-promo').textContent.includes('15 %')&&Number(w.document.querySelector('#pos-remise').value)>0&&w.document.querySelector('#pos-remise').disabled);
    w.document.querySelector('[data-plus]').click();ok('Panier modifié : nouvelle vérification exigée',w.document.querySelector('#pos-resultat-promo').textContent.includes('vérifiez à nouveau')&&w.document.querySelector('#pos-valider').disabled);
    console.log(n+'/'+n+' vérifications réussies.');
  } finally { if(dom)dom.window.close();serveur.kill();db.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
