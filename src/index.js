/**
 * KONSENXIA site Worker
 * - Serves static assets from ./public
 * - POST /api/contact → validate → send_email binding → kerem.newton571@gmail.com
 */
import { handleContact } from './contact-handler.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact') {
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      const siteEnv = {
        ...env,
        SITE_NAME: 'KONSENXIA',
        FROM_EMAIL: env.FROM_EMAIL || 'noreply@konsenxia.com',
        NOTIFY_EMAIL: env.NOTIFY_EMAIL || 'kerem.newton571@gmail.com'
      };
      return handleContact(request, siteEnv);
    }

    if (url.pathname === '/healthz') {
      return new Response('ok', { status: 200 });
    }

    return env.ASSETS.fetch(request);
  }
};
