const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const dbPath = path.resolve(process.env.DB_PATH || './data/finance.db');

// Ensure the data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let _db = null;

async function getDb() {
  if (_db) return _db;

  _db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await _db.exec('PRAGMA journal_mode = WAL');
  await _db.exec('PRAGMA foreign_keys = ON');
  await _db.exec('PRAGMA synchronous = NORMAL');

  // Initialize schema
  const schemaPath = path.join(__dirname, '../../db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await _db.exec(schema);

  return _db;
}

module.exports = { getDb };
