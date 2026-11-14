// ============================================================
//  Data store: a JSON file on this computer (data/db.json)
//  Used when you run START.bat / node server.js without Supabase.
// ============================================================
const fs = require('fs');
const path = require('path');

function createFileStore(dataDir) {
  const uploadDir = path.join(dataDir, 'uploads');
  const dbFile = path.join(dataDir, 'db.json');
  fs.mkdirSync(uploadDir, { recursive: true });
  let db = null;

  return {
    uploadDir,
    async load() {
      if (!db) {
        db = fs.existsSync(dbFile)
          ? JSON.parse(fs.readFileSync(dbFile, 'utf8'))
          : { counter: 0, users: [], sessions: {}, reports: [], blockedDevices: [] };
      }
      return db;
    },
    async save(data) {
      db = data;
      const tmp = dbFile + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
      fs.renameSync(tmp, dbFile);
    },
    async nextCounter(data) {
      data.counter = (data.counter || 0) + 1;
      return data.counter;
    },
    async savePhoto(fileName, buffer) {
      fs.writeFileSync(path.join(uploadDir, fileName), buffer);
      return '/uploads/' + fileName;
    }
  };
}

module.exports = { createFileStore };
