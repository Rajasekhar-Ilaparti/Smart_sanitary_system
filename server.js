// ============================================================
//  Clean Gudlavalleru - Waste Reporting System (local server)
//  Runs with plain Node.js - no extra packages needed.
//  Start:  node server.js     then open http://localhost:3000
//
//  Data is kept in data/db.json. If a .env file with SUPABASE_URL and
//  SUPABASE_SERVICE_KEY exists, the online Supabase database is used instead.
//  On Netlify the same app runs from netlify/functions/api.js.
// ============================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const CONFIG = require('./config');
const { createApp } = require('./lib/app');
const { createFileStore } = require('./lib/store-file');
const { createSupabaseStore } = require('./lib/store-supabase');

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');

// Read settings from a .env file, if there is one (KEY=value per line)
const envFile = path.join(ROOT, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const useSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
const fileStore = useSupabase ? null : createFileStore(path.join(ROOT, 'data'));
const store = useSupabase
  ? createSupabaseStore({ url: process.env.SUPABASE_URL, serviceKey: process.env.SUPABASE_SERVICE_KEY })
  : fileStore;
const app = createApp(store);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json'
};
function serveFile(res, baseDir, rel) {
  const filePath = path.normalize(path.join(baseDir, rel));
  if (!filePath.startsWith(baseDir)) { res.writeHead(403); return res.end(); }
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}
function readRaw(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > 10 * 1024 * 1024) { reject(new Error('too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
function sendJson(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const pathname = decodeURIComponent(url.pathname);
  try {
    if (pathname.startsWith('/api/')) {
      let body;
      try { body = await readRaw(req); } catch { return sendJson(res, 413, { error: 'Upload too large.' }); }
      const out = await app.handle({
        method: req.method, path: pathname, headers: req.headers, body,
        ip: (req.socket.remoteAddress || '').replace('::ffff:', '')
      });
      return sendJson(res, out.status, out.body);
    }
    if (pathname.startsWith('/uploads/') && fileStore) return serveFile(res, fileStore.uploadDir, pathname.slice('/uploads/'.length));
    const pages = { '/': 'index.html', '/report': 'report.html', '/track': 'report.html', '/department': 'department.html', '/worker': 'worker.html', '/film': 'film.html' };
    return serveFile(res, PUBLIC_DIR, pages[pathname] || pathname.slice(1));
  } catch (e) {
    console.error(e);
    return sendJson(res, 500, { error: 'Something went wrong on the server.' });
  }
});

server.listen(CONFIG.PORT, () => {
  const ips = Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);
  console.log('\n  Clean Gudlavalleru is running!\n');
  console.log(`  Data is stored in:    ${useSupabase ? 'Supabase (' + process.env.SUPABASE_URL + ')' : 'data/db.json on this computer'}`);
  console.log(`  Citizen app (home):   http://localhost:${CONFIG.PORT}/`);
  console.log(`  Department portal:    http://localhost:${CONFIG.PORT}/department`);
  console.log(`  Worker app:           http://localhost:${CONFIG.PORT}/worker`);
  if (ips.length) console.log(`\n  On the same Wi-Fi, other devices can try: http://${ips[0]}:${CONFIG.PORT}/`);
  console.log('\n  Keep this window open. Press Ctrl+C to stop.\n');
});
