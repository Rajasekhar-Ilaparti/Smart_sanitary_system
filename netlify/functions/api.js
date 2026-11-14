// ============================================================
//  Netlify Function: runs the app's API (/api/...) on Netlify.
//  netlify.toml sends every /api/* request here.
//  Data lives in Supabase - set SUPABASE_URL and SUPABASE_SERVICE_KEY in
//  Netlify -> Site configuration -> Environment variables.
// ============================================================
const { createApp } = require('../../lib/app');
const { createSupabaseStore } = require('../../lib/store-supabase');

let app = null;
function getApp() {
  if (!app) {
    app = createApp(createSupabaseStore({
      url: process.env.SUPABASE_URL,
      serviceKey: process.env.SUPABASE_SERVICE_KEY
    }));
  }
  return app;
}

const json = (statusCode, obj) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  body: JSON.stringify(obj)
});

exports.handler = async (event) => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('SUPABASE_URL / SUPABASE_SERVICE_KEY are not set in Netlify environment variables.');
    return json(500, { error: 'The server is not set up yet (database settings missing).' });
  }
  // The request may arrive as /api/... or /.netlify/functions/api/...
  let path = event.path || '/';
  path = path.replace(/^\/\.netlify\/functions\/api/, '');
  if (!path.startsWith('/api/')) path = '/api' + (path.startsWith('/') ? path : '/' + path);

  const headers = Object.fromEntries(Object.entries(event.headers || {}).map(([k, v]) => [k.toLowerCase(), v]));
  const body = event.body ? (event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body) : '';
  const ip = headers['x-nf-client-connection-ip'] || (headers['x-forwarded-for'] || '').split(',')[0].trim();

  const out = await getApp().handle({ method: event.httpMethod, path: decodeURIComponent(path), headers, body, ip });
  return json(out.status, out.body);
};
