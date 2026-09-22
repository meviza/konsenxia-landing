/**
 * KONSENXIA site Worker
 */
import { handleContact } from './contact-handler.js';

const LOCALES = new Set([
  'en', 'tr', 'ar', 'de', 'es', 'fr', 'nl', 'it', 'pt', 'ru',
  'zh', 'ja', 'ko', 'pl', 'uk', 'vi', 'id', 'hi', 'th'
]);

function tryPaths(pathname) {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const segs = clean.split('/').filter(Boolean);
  if (!segs.length) return ['/index.html', '/index.html'];

  const out = [];
  const first = segs[0];

  if (LOCALES.has(first)) {
    const rest = segs.slice(1).join('/');
    if (!rest) {
      out.push(`/${first}/`, `/${first}/index.html`);
    } else {
      out.push(`/${first}/${rest}/`, `/${first}/${rest}/index.html`, `/${first}/${rest}`);
    }
  } else {
    const page = segs.join('/');
    out.push(`/${page}/`, `/${page}/index.html`, `/${page}`);
  }
  return out;
}

async function resolveAsset(env, request, url) {
  const direct = await env.ASSETS.fetch(request);
  if (direct.status === 200) return direct;

  if (direct.status >= 300 && direct.status < 400) {
    const loc = direct.headers.get('Location');
    if (loc) {
      const followed = await env.ASSETS.fetch(new Request(new URL(loc, url.origin), request));
      if (followed.status === 200) return followed;
    }
  }

  if (!/\.[a-z0-9]{1,8}$/i.test(url.pathname) && url.pathname !== '/') {
    for (const cand of tryPaths(url.pathname)) {
      try {
        const r = await env.ASSETS.fetch(new Request(new URL(cand, url.origin), request));
        if (r.status === 200) return r;
        if (r.status >= 300 && r.status < 400) {
          const loc = r.headers.get('Location');
          if (loc) {
            const followed = await env.ASSETS.fetch(new Request(new URL(loc, url.origin), request));
            if (followed.status === 200) return followed;
          }
        }
      } catch (_) { /* next */ }
    }
  }

  return direct;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact') {
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return handleContact(request, {
        ...env,
        SITE_NAME: 'KONSENXIA',
        FROM_EMAIL: env.FROM_EMAIL || 'noreply@konsenxia.com',
        NOTIFY_EMAIL: env.NOTIFY_EMAIL || 'kerem.newton571@gmail.com'
      });
    }

    if (url.pathname === '/healthz') return new Response('ok');

    return resolveAsset(env, request, url);
  }
};
