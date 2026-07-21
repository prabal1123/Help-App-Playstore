import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';

const DB_NAME = 'app.db';
const MAX_ENTRIES = 1000;

let db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync(DB_NAME);
  }
  return db;
}

/**
 * App start pe ek baar call karo (jahan bhi tumhara existing DB init hota hai,
 * ya agar kahin nahi hota to App.tsx / app/_layout.tsx ke top pe).
 */
export function initLocalLocationLog(): void {
  const database = getDb();
  database.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS location_log (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      recorded_at TEXT NOT NULL,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      remote_error TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_location_log_sync_status ON location_log (sync_status);
    CREATE INDEX IF NOT EXISTS idx_location_log_recorded_at ON location_log (recorded_at);
  `);
}

export type LogSyncStatus = 'pending' | 'synced' | 'failed';

export interface LocationLogEntry {
  id: string;
  user_id: string;
  lat: number;
  lng: number;
  recorded_at: string;
  sync_status: LogSyncStatus;
  remote_error: string | null;
}

/**
 * HAR location capture ke baad ye call karo — chahe remote save
 * success hua ho ya fail. Ye sirf local history/backup hai.
 *
 * `wasRemoteSuccess`: batao ki Supabase write (REST ya fallback) kaamyab hua ya nahi.
 * `errorMessage`: agar fail hua to reason (optional, debugging ke liye).
 */
export function logLocationLocally(
  userId: string,
  lat: number,
  lng: number,
  wasRemoteSuccess: boolean,
  errorMessage?: string
): void {
  const database = getDb();
  const id = Crypto.randomUUID();
  const recordedAt = new Date().toISOString();
  const status: LogSyncStatus = wasRemoteSuccess ? 'synced' : 'pending';

  database.runSync(
    `INSERT INTO location_log (id, user_id, lat, lng, recorded_at, sync_status, remote_error)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, lat, lng, recordedAt, status, errorMessage ?? null]
  );

  pruneOldEntries();
}

/**
 * FIXED: sirf 'synced' entries ko prune karo, aur unme se bhi sirf
 * excess wali (latest MAX_ENTRIES se zyada). 'pending' entries ko
 * KABHI mat chuo — chahe wo kitni bhi purani ho jayein ya kitni bhi
 * accumulate ho jayein, jab tak sync na ho jayein tab tak safe rehni
 * chahiye. Isse pehle wala version 'pending' entries ko bhi silently
 * delete kar sakta tha agar phone lambe time offline raha (~33+ ghante
 * pe 1000-row limit hit ho jaati, 2-min throttle ke hisaab se).
 */
function pruneOldEntries(): void {
  const database = getDb();
  database.runSync(
    `DELETE FROM location_log
     WHERE sync_status = 'synced'
     AND id NOT IN (
       SELECT id FROM location_log
       WHERE sync_status = 'synced'
       ORDER BY recorded_at DESC LIMIT ?
     )`,
    [MAX_ENTRIES]
  );
}

/** Wo entries jo remote pe abhi tak save nahi ho paayi — retry ke liye */
export function getPendingLocalEntries(): LocationLogEntry[] {
  const database = getDb();
  return database.getAllSync<LocationLogEntry>(
    `SELECT * FROM location_log WHERE sync_status = 'pending' ORDER BY recorded_at ASC`
  );
}

/** Retry me kaamyab hone pe isko call karo */
export function markLocalEntrySynced(id: string): void {
  const database = getDb();
  database.runSync(
    `UPDATE location_log SET sync_status = 'synced', remote_error = NULL WHERE id = ?`,
    [id]
  );
}

/** Debug/UI ke liye — sab entries dekhne ho to */
export function getAllLocalEntries(): LocationLogEntry[] {
  const database = getDb();
  return database.getAllSync<LocationLogEntry>(
    `SELECT * FROM location_log ORDER BY recorded_at DESC`
  );
}