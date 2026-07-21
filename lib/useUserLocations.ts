import { useCallback, useEffect, useState } from 'react';
import { getAllUserLocations } from '../lib/userLocationsRepository';
import { UserLocation } from '../lib/types';

export function useUserLocations() {
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    setLocations(getAllUserLocations());
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { locations, loading, refresh };
}