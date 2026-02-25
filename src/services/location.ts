import * as Location from "expo-location";

/* ---------- Permissions ---------- */
export async function requestLocationPermission() {
  const { status } =
    await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    throw new Error("Location permission not granted");
  }

  return true;
}

/* ---------- Get Current Location ---------- */
export async function getCurrentLocation() {
  await requestLocationPermission();

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}

/* ---------- Live Tracking ---------- */
export async function startLiveTracking(
  onUpdate: (coords: { latitude: number; longitude: number }) => void
) {
  await requestLocationPermission();

  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000, // 5 sec
      distanceInterval: 5, // 5 meters
    },
    (location) => {
      onUpdate({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    }
  );
}

/* ---------- Stop Tracking ---------- */
export function stopLiveTracking(
  subscription: Location.LocationSubscription
) {
  subscription?.remove();
}
/* ---------- Distance Helper (meters) ---------- */
function getDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371000; // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ---------- Geo-fenced Tracking ---------- */
export async function startGeoFenceTracking(
  home: { latitude: number; longitude: number },
  radius: number,
  onExit: () => void,
  onUpdate?: (coords: { latitude: number; longitude: number }) => void
) {
  await requestLocationPermission();

  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 5,
    },
    (location) => {
      const { latitude, longitude } = location.coords;

      onUpdate?.({ latitude, longitude });

      const distance = getDistance(
        latitude,
        longitude,
        home.latitude,
        home.longitude
      );

      if (distance > radius) {
        onExit();
      }
    }
  );
}

