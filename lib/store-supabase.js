// ============================================================
//  Data store: Supabase (database tables + photo storage)
//  Needs two settings (Netlify -> Site configuration -> Environment variables,
//  or a .env file on your computer):
//    SUPABASE_URL           e.g. https://abcdefgh.supabase.co
//    SUPABASE_SERVICE_KEY   the secret key: "sb_secret_..." (new) or the "service_role" key (older projects).
//                           Never put it in the website's pages.
//  Tables are created by supabase/setup.sql.
// ============================================================

const BUCKET = 'photos';
const PAGE = 1000;

function createSupabaseStore({ url, serviceKey }) {
  if (!url || !serviceKey) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set.');
  url = url.trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, '');   // accept a pasted ".../rest/v1/" too
  serviceKey = serviceKey.trim();
  // New Supabase keys (sb_secret_...) go only in the "apikey" header;
  // older JWT "service_role" keys also go in Authorization.
  const auth = serviceKey.startsWith('sb_')
    ? { apikey: serviceKey }
    : { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };

  async function call(method, pathAndQuery, { body, headers = {}, raw } = {}) {
    const res = await fetch(url + pathAndQuery, {
      method,
      headers: { ...auth, ...(raw ? {} : { 'Content-Type': 'application/json' }), ...headers },
      body: raw ? body : body === undefined ? undefined : JSON.stringify(body)
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Supabase ${method} ${pathAndQuery.split('?')[0]} failed (${res.status}): ${text.slice(0, 300)}`);
    return text ? JSON.parse(text) : null;
  }
  // Read every row of a table, 1000 at a time
  async function selectAll(table, select, filter = '') {
    const rows = [];
    for (let offset = 0; ; offset += PAGE) {
      const page = await call('GET', `/rest/v1/${table}?select=${select}${filter}&order=${select.split(',')[0]}&limit=${PAGE}&offset=${offset}`);
      rows.push(...page);
      if (page.length < PAGE) return rows;
    }
  }
  function upsert(table, rows, conflict) {
    if (!rows.length) return null;
    return call('POST', `/rest/v1/${table}?on_conflict=${conflict}`, {
      body: rows, headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }
    });
  }
  const inList = values => `in.(${values.map(v => `"${String(v).replace(/"/g, '')}"`).join(',')})`;

  // What was loaded, so save() only writes rows that changed
  let snap = null;

  return {
    online: true,   // live site: account passwords must come from environment variables
    async load({ token } = {}) {
      const [users, reports, sessions, meta] = await Promise.all([
        selectAll('gw_users', 'id,data'),
        selectAll('gw_reports', 'id,data'),
        token ? call('GET', `/rest/v1/gw_sessions?select=token,user_id,at&token=eq.${encodeURIComponent(token)}`) : [],
        call('GET', '/rest/v1/gw_meta?select=key,value&key=eq.blockedDevices')
      ]);
      const db = {
        users: users.map(r => r.data),
        reports: reports.map(r => r.data),
        sessions: Object.fromEntries(sessions.map(s => [s.token, { userId: s.user_id, at: s.at }])),
        blockedDevices: meta.length ? meta[0].value : []
      };
      snap = {
        users: new Map(db.users.map(u => [u.id, JSON.stringify(u)])),
        reports: new Map(db.reports.map(r => [r.id, JSON.stringify(r)])),
        sessions: new Set(Object.keys(db.sessions)),
        blocked: JSON.stringify(db.blockedDevices)
      };
      return db;
    },

    async save(db, { revokedUsers = [] } = {}) {
      const changed = (map, list) => list.filter(x => map.get(x.id) !== JSON.stringify(x));
      // Users first: a unique username index stops a second copy of the demo accounts
      await upsert('gw_users', changed(snap.users, db.users).map(u => ({ id: u.id, data: u })), 'id');
      await upsert('gw_reports', changed(snap.reports, db.reports).map(r => ({ id: r.id, data: r, created_at: r.createdAt })), 'id');

      const newSessions = Object.entries(db.sessions).filter(([t]) => !snap.sessions.has(t));
      await upsert('gw_sessions', newSessions.map(([token, s]) => ({ token, user_id: s.userId, at: s.at })), 'token');
      const gone = [...snap.sessions].filter(t => !db.sessions[t]);
      if (gone.length) await call('DELETE', `/rest/v1/gw_sessions?token=${inList(gone)}`, { headers: { Prefer: 'return=minimal' } });
      if (revokedUsers.length) await call('DELETE', `/rest/v1/gw_sessions?user_id=${inList(revokedUsers)}`, { headers: { Prefer: 'return=minimal' } });

      if (JSON.stringify(db.blockedDevices) !== snap.blocked) {
        await upsert('gw_meta', [{ key: 'blockedDevices', value: db.blockedDevices }], 'key');
      }
    },

    async nextCounter() {
      return Number(await call('POST', '/rest/v1/rpc/gw_next_report_no', { body: {} }));
    },

    async savePhoto(fileName, buffer, contentType) {
      await call('POST', `/storage/v1/object/${BUCKET}/${encodeURIComponent(fileName)}`, {
        raw: true, body: buffer, headers: { 'Content-Type': contentType, 'x-upsert': 'true' }
      });
      return `${url}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(fileName)}`;
    }
  };
}

module.exports = { createSupabaseStore };
