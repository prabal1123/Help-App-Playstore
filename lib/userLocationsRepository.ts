import * as Crypto from 'expo-crypto';
import { getDb } from './db';
import { NewUserLocationInput, SyncStatus, UserLocation } from './types';

function nowIso(): string {
  return new Date().toISOString();
}

type UserLocationRow = Omit<UserLocation, 'outside_zone' | 'is_home' | 'is_live'> & {
  outside_zone: number;
  is_home: number;
  is_live: number;
};

function rowToUserLocation(row: UserLocationRow): UserLocation {
  return {
    ...row,
    outside_zone: !!row.outside_zone,
    is_home: !!row.is_home,
    is_live: !!row.is_live,
  };
}

export function insertUserLocation(input: NewUserLocationInput): UserLocation {
  const database = getDb();
  const now = nowIso();

  const location: UserLocation = {
    id: Crypto.randomUUID(),
    user_id: input.user_id,
    lat: input.lat,
    lng: input.lng,
    accuracy_meters: input.accuracy_meters ?? null,
    recorded_at: now,
    outside_zone: input.outside_zone ?? false,
    is_home: input.is_home ?? false,
    is_live: input.is_live ?? false,
    updated_at: now,
    sync_status: 'pending',
  };

  database.runSync(
    `INSERT INTO user_locations
      (id, user_id, lat, lng, accuracy_meters, recorded_at, outside_zone, is_home, is_live, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      location.id, location.user_id, location.lat, location.lng,
      location.accuracy_meters, location.recorded_at,
      location.outside_zone ? 1 : 0, location.is_home ? 1 : 0, location.is_live ? 1 : 0,
      location.updated_at, location.sync_status,
    ]
  );

  return location;
}

export function getAllUserLocations(): UserLocation[] {
  const database = getDb();
  const rows = database.getAllSync<UserLocationRow>(
    `SELECT * FROM user_locations ORDER BY recorded_at DESC`
  );
  return rows.map(rowToUserLocation);
}

export function getLocationsByStatus(status: SyncStatus): UserLocation[] {
  const database = getDb();
  const rows = database.getAllSync<UserLocationRow>(
    `SELECT * FROM user_locations WHERE sync_status = ? ORDER BY recorded_at ASC`,
    [status]
  );
  return rows.map(rowToUserLocation);
}

export function updateSyncStatus(id: string, status: SyncStatus): void {
  const database = getDb();
  database.runSync(
    `UPDATE user_locations SET sync_status = ?, updated_at = ? WHERE id = ?`,
    [status, nowIso(), id]
  );
}

export function toSupabasePayload(location: UserLocation) {
  const { sync_status, ...payload } = location;
  return payload;
}