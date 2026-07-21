export type SyncStatus = 'pending' | 'synced' | 'failed';

export interface UserLocation {
  id: string;
  user_id: string;
  lat: number;
  lng: number;
  accuracy_meters: number | null;
  recorded_at: string;
  outside_zone: boolean;
  is_home: boolean;
  is_live: boolean;
  updated_at: string;
  sync_status: SyncStatus; // local-only
}

export interface NewUserLocationInput {
  user_id: string;
  lat: number;
  lng: number;
  accuracy_meters?: number | null;
  outside_zone?: boolean;
  is_home?: boolean;
  is_live?: boolean;
}