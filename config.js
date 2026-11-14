// ============================================================
//  Clean Gudlavalleru - settings you can safely edit
// ============================================================

module.exports = {
  PORT: 3000,

  // Map starts here (Gudlavalleru village centre)
  MAP_CENTER: { lat: 16.3478, lng: 81.0478 },
  MAP_ZOOM: 15,

  // Worker must be within this many metres of the reported spot to check in
  CHECKIN_RADIUS_M: 150,

  // DEMO_MODE lets a worker "check in anyway" when GPS is far away
  // (useful when presenting from a classroom). It is marked "not verified".
  DEMO_MODE: true,

  // A new report within this distance of an open report of the same type
  // is merged into it as "+1 support" instead of creating a duplicate.
  DUPLICATE_RADIUS_M: 50,

  // Anti-spam: max reports per phone/browser per hour
  MAX_REPORTS_PER_HOUR: 5,
  // A device is blocked after this many reports are marked as spam
  SPAM_BLOCK_AFTER: 3,

  // Problem types and how many hours the department has to solve each (every problem: 3 hours max)
  CATEGORIES: [
    { id: 'overflowing_bin', en: 'Overflowing dustbin', te: 'నిండిపోయిన చెత్త డబ్బా', icon: '🗑️', slaHours: 3 },
    { id: 'open_dumping', en: 'Open garbage dumping', te: 'బహిరంగ చెత్త పారవేత', icon: '🚯', slaHours: 3 },
    { id: 'burning', en: 'Garbage burning', te: 'చెత్త కాల్చడం', icon: '🔥', slaHours: 3 },
    { id: 'drain_block', en: 'Drain blocked with waste', te: 'చెత్తతో మూసుకుపోయిన కాలువ', icon: '🌊', slaHours: 3 },
    { id: 'dead_animal', en: 'Dead animal', te: 'చనిపోయిన జంతువు', icon: '⚠️', slaHours: 3 },
    { id: 'missed_collection', en: 'Garbage not collected', te: 'చెత్త సేకరించలేదు', icon: '🚛', slaHours: 3 },
    { id: 'littering', en: 'Littering / plastic waste', te: 'ప్లాస్టిక్ / చెత్త వేయడం', icon: '🛍️', slaHours: 3 },
    { id: 'other', en: 'Other waste problem', te: 'ఇతర సమస్య', icon: '📍', slaHours: 3 }
  ],

  // Department areas. Each report is sent to the department whose
  // boundary contains its GPS point. Boundaries are [lat, lng] corners.
  // These are DEMO boundaries around Gudlavalleru - adjust as needed.
  ZONES: [
    {
      id: 'north',
      name: 'Gudlavalleru North Zone (College side)',
      color: '#2563eb',
      polygon: [[16.3478, 81.0250], [16.3800, 81.0250], [16.3800, 81.0700], [16.3478, 81.0700]]
    },
    {
      id: 'southwest',
      name: 'Gudlavalleru South-West Zone',
      color: '#d97706',
      polygon: [[16.3150, 81.0250], [16.3478, 81.0250], [16.3478, 81.0478], [16.3150, 81.0478]]
    },
    {
      id: 'southeast',
      name: 'Gudlavalleru South-East Zone',
      color: '#16a34a',
      polygon: [[16.3150, 81.0478], [16.3478, 81.0478], [16.3478, 81.0700], [16.3150, 81.0700]]
    }
  ]
};
