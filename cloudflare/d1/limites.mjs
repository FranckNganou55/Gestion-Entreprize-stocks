import {exiger} from './db.mjs';
export async function limiter(db,request,action,max=12,duree=60000){
 const source=request.headers.get('CF-Connecting-IP')||'local';
 const empreinte=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(action+':'+source));
 const cle=Array.from(new Uint8Array(empreinte),b=>b.toString(16).padStart(2,'0')).join(''),periode=Math.floor(Date.now()/duree);
 const ligne=await db.get('INSERT INTO d1_limites_auth(cle,periode,essais) VALUES (?,?,1) ON CONFLICT(cle) DO UPDATE SET essais=CASE WHEN periode=excluded.periode THEN essais+1 ELSE 1 END,periode=excluded.periode RETURNING essais',cle,periode);
 exiger(ligne.essais<=max,'Trop de tentatives. Patientez avant de réessayer.',429);
}
