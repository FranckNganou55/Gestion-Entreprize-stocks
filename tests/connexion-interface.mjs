import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
const html=fs.readFileSync('public/index.html','utf8'),dom=new JSDOM(html,{runScripts:'outside-only',url:'https://application.example'});
try{
 const w=dom.window;w.fetch=async()=>({ok:true,json:async()=>({}),text:async()=>'{}'});w.setInterval=()=>0;
 for(const [,src]of html.matchAll(/<script src="([^"]+)"/g)){vm.runInContext(fs.readFileSync('public/'+src,'utf8'),dom.getInternalVMContext());if(src==='js/app.js')w.App.demarrer=()=>{};}
 w.App.afficherConnexion();
 assert.equal(w.document.querySelector('#form-connexion [name=email]').value,'');
 assert.equal(w.document.querySelector('#form-connexion [name=mot_de_passe]').value,'');
 assert.equal(w.document.querySelector('.comptes-demo'),null);
 assert.equal(w.document.querySelector('[data-mdp]'),null);
 assert.ok(!w.document.querySelector('#racine').textContent.includes('Comptes de démonstration'));
 console.log('Connexion : formulaire vide, aucun compte de démonstration ni mot de passe proposé.');
}finally{dom.window.close();}
