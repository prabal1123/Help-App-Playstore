import * as SQLite from 'expo-sqlite';

const DB_NAME = 'app.db';
let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync(DB_NAME);
  }
  return db;
}

export function initDb(): void {
  const database = getDb();

  database.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS user_locations (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      accuracy_meters INTEGER,
      recorded_at TEXT NOT NULL,
      outside_zone INTEGER NOT NULL DEFAULT 0,
      is_home INTEGER NOT NULL DEFAULT 0,
      is_live INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      sync_status TEXT NOT NULL DEFAULT 'pending'
    );

    CREATE INDEX IF NOT EXISTS idx_user_locations_sync_status ON user_locations (sync_status);
    CREATE INDEX IF NOT EXISTS idx_user_locations_recorded_at ON user_locations (recorded_at);
    CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations (user_id);

    CREATE TABLE IF NOT EXISTS safe_zones_cache (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      guardian_id TEXT NOT NULL,
      name TEXT,
      center_lat REAL NOT NULL,
      center_lng REAL NOT NULL,
      radius_meters INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_safe_zones_user_id ON safe_zones_cache (user_id);
  `);
}