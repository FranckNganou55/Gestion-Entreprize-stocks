const assert=require('node:assert/strict');
(async()=>{
 const {gererRequete}=await import('../cloudflare/worker.mjs');let n=0,appels=0;
 const ok=(texte,v)=>{assert.ok(v,texte);n++;console.log('OK '+texte);};
 const env={ASSETS:{fetch:async()=>new Response('interface',{headers:{'Content-Type':'text/html'}})},BACKEND_ORIGIN:'https://backend.example.test'};
 let r=await gererRequete(new Request('https://app.example.test/'),env);ok('Interface servie par Cloudflare',await r.text()==='interface');
 r=await gererRequete(new Request('https://app.example.test/api/auth/login'),{...env,BACKEND_ORIGIN:''});ok('Backend absent : erreur JSON, jamais une fausse page de connexion',r.status===503&&(await r.json()).erreur);
 for(const origine of ['http://backend.example.test','https://localhost','https://127.0.0.1','https://app.example.test','https://backend.example.test/prefixe','https://user:password@backend.example.test']){
  r=await gererRequete(new Request('https://app.example.test/api/auth/me'),{...env,BACKEND_ORIGIN:origine},async()=>{appels++;});ok('Configuration invalide refusée : '+new URL(origine).hostname,r.status===503);
 }
 ok('Aucun appel envoyé aux origines invalides',appels===0);
 const corps={email:'client@example.test',mot_de_passe:'mot-de-passe-de-test'};
 r=await gererRequete(new Request('https://app.example.test/api/auth/login?source=test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(corps)}),env,async requete=>{
  ok('Chemin, paramètres et méthode préservés',requete.url==='https://backend.example.test/api/auth/login?source=test'&&requete.method==='POST');
  ok('Coordonnées de connexion transmises intactes',JSON.stringify(await requete.json())===JSON.stringify(corps));return Response.json({token:'jeton-test'});
 });ok('Réponse de connexion retournée au navigateur',(await r.json()).token==='jeton-test'&&r.headers.get('Cache-Control')==='no-store');
 r=await gererRequete(new Request('https://app.example.test/api/auth/me',{headers:{Authorization:'Bearer jeton-test'}}),env,async requete=>{ok('Jeton de session transmis',requete.headers.get('Authorization')==='Bearer jeton-test');return Response.json({ok:true});});
 r=await gererRequete(new Request('https://app.example.test/api/auth/login'),env,async()=>Response.json({erreur:'Identifiants incorrects'},{status:401}));ok('Refus du backend conservé',r.status===401);
 r=await gererRequete(new Request('https://app.example.test/api/ventes'),env,async()=>new Response('<html>SPA</html>',{headers:{'Content-Type':'text/html'}}));ok('Une page HTML ne masque pas une API manquante',r.status===502);
 r=await gererRequete(new Request('https://app.example.test/api/auth/login'),env,async()=>{throw Error('indisponible');});ok('Panne backend explicitement signalée',r.status===503);
 const fichier=require('node:fs').readFileSync('wrangler.jsonc','utf8');const config=JSON.parse(fichier);ok('Wrangler exécute le Worker avant la SPA sur /api',config.assets.run_worker_first.includes('/api/*')&&config.main==='cloudflare/worker.mjs');
 console.log(n+'/'+n+' vérifications Cloudflare réussies.');
})().catch(e=>{console.error(e);process.exitCode=1;});
