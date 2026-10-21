import {traiterApi} from './api.mjs';
export default {
 async fetch(request,env,ctx){
  const p=new URL(request.url).pathname;
  if(p==='/healthz'||p==='/api'||p.startsWith('/api/'))return traiterApi(request,env,ctx);
  return env.ASSETS.fetch(request);
 }
};
