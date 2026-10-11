import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { config } from '../config.js';
import { schemaSql } from './schema.js';

let dbInstance = null;

export function initDb(customPath = null) {
  const dbPath = customPath || config.databasePath;
  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  if (dbPath !== ':memory:') {
    db.pragma('journal_mode = WAL');
  }
  db.pragma('busy_timeout = 5000');
  db.exec(schemaSql);
  dbInstance = db;
  return db;
}

export function getDb() {
  if (!dbInstance) {
    return initDb();
  }
  return dbInstance;
}

export function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
