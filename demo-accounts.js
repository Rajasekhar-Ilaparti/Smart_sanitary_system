// ============================================================
//  Login accounts (created the first time the app starts)
//
//  The passwords below are ONLY for the offline demo (START.bat).
//  On the live site (Netlify + Supabase) they are NOT used: the passwords
//  come from hidden Netlify environment variables instead -
//    ADMIN_PASSWORD   for "admin" (all zones)
//    DEPT_PASSWORD    for "north", "southwest", "southeast"
//    WORKER_PASSWORD  for every worker (each worker can change it in Profile)
//  This file is public on GitHub, so never put real passwords here.
// ============================================================

module.exports = [
  // Super admin: sees every zone, and reports outside all zones
  { role: 'super', username: 'admin', password: 'admin123', name: 'Sanitary Officer (All Zones)', phone: '', zoneId: null },

  // One department admin per zone
  { role: 'admin', username: 'north', password: 'north123', name: 'North Zone Sanitary Dept', phone: '', zoneId: 'north' },
  { role: 'admin', username: 'southwest', password: 'sw123', name: 'South-West Zone Sanitary Dept', phone: '', zoneId: 'southwest' },
  { role: 'admin', username: 'southeast', password: 'se123', name: 'South-East Zone Sanitary Dept', phone: '', zoneId: 'southeast' },

  // Field workers
  { role: 'worker', username: 'ramesh', password: 'worker123', name: 'Ramesh K', phone: '9000000001', zoneId: 'north' },
  { role: 'worker', username: 'lakshmi', password: 'worker123', name: 'Lakshmi P', phone: '9000000002', zoneId: 'north' },
  { role: 'worker', username: 'suresh', password: 'worker123', name: 'Suresh M', phone: '9000000003', zoneId: 'southwest' },
  { role: 'worker', username: 'padma', password: 'worker123', name: 'Padma R', phone: '9000000004', zoneId: 'southwest' },
  { role: 'worker', username: 'ravi', password: 'worker123', name: 'Ravi T', phone: '9000000005', zoneId: 'southeast' },
  { role: 'worker', username: 'anitha', password: 'worker123', name: 'Anitha S', phone: '9000000006', zoneId: 'southeast' }
];
