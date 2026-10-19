import type { Config, Context } from '@netlify/functions';
import serverless from 'serverless-http';
import { verifyRequestOrigin } from '@netlify/identity';
import { createRequire } from 'node:module';
import path from 'node:path';
// These packages are also loaded by the included CommonJS server and its worker.
import 'express';
import 'cors';
import 'bcryptjs';
import 'jsonwebtoken';
import 'nodemailer';
import '@netlify/database';
import '@netlify/blobs';
import 'drizzle-orm/node-postgres';
let queue: Promise<unknown> | undefined;
let handler: ReturnType<typeof serverless> | undefined;

export default async function api(request: Request, context: Context) {
  const require = createRequire(path.join(process.cwd(), 'server', 'index.js'));
  const previous = queue || Promise.resolve();
  let release!: () => void;
  queue = new Promise<void>((resolve) => { release = resolve; });
  await previous;
  let bridge;
  try {
    // Existing CommonJS modules and their database worker share this runtime configuration.
    if (request.method === 'POST' && /^\/api\/(auth\/login|entreprises\/(inscription|verification\/renvoyer)|identity\/(confirm|invite))$/.test(new URL(request.url).pathname)) {
      try { verifyRequestOrigin(request); }
      catch { return Response.json({ erreur: 'Origine de la requête refusée.' }, { status: 403 }); }
    }
    process.env.GESTYPRO_CLOUD = '1';
    for (const name of ['NETLIFY_DB_URL', 'NETLIFY_DB_DRIVER', 'NETLIFY_BLOBS_CONTEXT']) {
      const value = Netlify.env.get(name);
      if (value) process.env[name] = value;
    }
    process.env.APP_URL = new URL(request.url).origin;
    const blobsContext = (globalThis as any).netlifyBlobsContext;
    if (blobsContext) process.env.NETLIFY_BLOBS_CONTEXT = typeof blobsContext === 'string' ? blobsContext : Buffer.from(JSON.stringify(blobsContext)).toString('base64');
    bridge = require('./postgres.cjs');
    bridge.call('start', { blobsContext: process.env.NETLIFY_BLOBS_CONTEXT });
    if (!handler) handler = serverless(require('./index.js'));
    require('./auth.js').invaliderCacheDroits();
    const url = new URL(request.url);
    if (['/api/identity/confirm', '/api/identity/invite'].includes(url.pathname) && request.method === 'POST') {
      let body;
      try { body = await request.json(); } catch { return Response.json({ erreur: 'JSON invalide.' }, { status: 400 }); }
      if (typeof body.token !== 'string') return Response.json({ erreur: 'Lien invalide.' }, { status: 400 });
      try {
        const identity = require('./identity.cjs');
        const result = url.pathname.endsWith('/invite') ? await identity.acceptOwnerInvite(body.token, body.password) : await identity.confirm(body.token);
        return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
      }
      catch { return Response.json({ erreur: 'Le lien de confirmation est expiré ou invalide. Demandez un nouvel email.' }, { status: 400 }); }
    }
    const body = request.method === 'GET' || request.method === 'HEAD' ? '' : Buffer.from(await request.arrayBuffer()).toString('base64');
    const event = {
      httpMethod: request.method, path: url.pathname, rawUrl: request.url, rawPath: url.pathname,
      headers: Object.fromEntries(request.headers),
      queryStringParameters: Object.fromEntries(url.searchParams),
      multiValueQueryStringParameters: Object.fromEntries([...new Set(url.searchParams.keys())].map(key => [key, url.searchParams.getAll(key)])),
      body, isBase64Encoded: true,
      requestContext: { identity: { sourceIp: context.ip } },
    };
    const result = await handler(event, {} as never) as { statusCode: number; headers?: Record<string, string>; multiValueHeaders?: Record<string, string[]>; body: string; isBase64Encoded?: boolean };
    const headers = new Headers(result.headers);
    for (const [key, values] of Object.entries(result.multiValueHeaders || {})) {
      headers.delete(key);
      for (const value of values) headers.append(key, value);
    }
    headers.set('Cache-Control', 'no-store');
    const responseBody = result.isBase64Encoded ? Buffer.from(result.body, 'base64') : result.body;
    return new Response(request.method === 'HEAD' || result.statusCode === 204 ? null : responseBody, { status: result.statusCode, headers });
  } catch {
    console.error('API indisponible', context.requestId);
    return Response.json({ erreur: 'Service temporairement indisponible. Réessayez dans quelques instants.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  } finally {
    try { bridge?.call('finish'); } catch { console.error('Connexion de stockage interrompue', context.requestId); } finally { release(); }
  }
}
export const config: Config = { path: '/api/*' };
