/** Cloudflare gratuit : interface statique et liaison HTTPS au backend Node/MySQL. */
function erreur(message, statut=503) {
  return Response.json({erreur:message},{status:statut,headers:{'Cache-Control':'no-store'}});
}

export async function gererRequete(request,env,fetchBackend=fetch) {
  const url=new URL(request.url);
  const api=url.pathname==='/api'||url.pathname.startsWith('/api/')||url.pathname==='/healthz';
  if(!api)return env.ASSETS.fetch(request);
  if(!env.BACKEND_ORIGIN)return erreur('Le serveur de connexion n’est pas encore configuré. Contactez le propriétaire.');
  let origine;
  try{
    origine=new URL(env.BACKEND_ORIGIN);
    if(origine.protocol!=='https:'||origine.username||origine.password||origine.search||origine.hash||origine.pathname!=='/'||origine.host===url.host
      ||['localhost','127.0.0.1','[::1]','0.0.0.0'].includes(origine.hostname))throw Error('Origine incorrecte');
  }catch{return erreur('La configuration du serveur de connexion doit être corrigée par le propriétaire.');}
  const cible=new URL(origine.origin);cible.pathname=url.pathname;cible.search=url.search;
  try{
    const transmis=new Request(cible,request);
    transmis.headers.delete('host');
    const reponse=await fetchBackend(transmis,{redirect:'manual',signal:AbortSignal.timeout(25000)});
    if((reponse.headers.get('content-type')||'').includes('text/html')){
      await reponse.body?.cancel();
      return erreur('Le serveur n’a pas répondu correctement. Réessayez dans un instant.',reponse.status===404?404:502);
    }
    const headers=new Headers(reponse.headers);headers.set('Cache-Control','no-store');
    const location=headers.get('location');
    if(location){
      const redirection=new URL(location,cible);
      if(redirection.origin===origine.origin){redirection.protocol=url.protocol;redirection.host=url.host;headers.set('location',redirection.href);}
    }
    return new Response(reponse.body,{status:reponse.status,statusText:reponse.statusText,headers});
  }catch{return erreur('Le serveur est momentanément inaccessible. Réessayez dans un instant.');}
}

export default {fetch(request,env){return gererRequete(request,env);}};
