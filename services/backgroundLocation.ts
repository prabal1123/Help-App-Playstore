import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/supabase/supabase";
import {
  getPushTokenForUser,
  sendExpoPushNotification,
} from "@/services/pushToken";

// ─── Constants ────────────────────────────────────────────────────────────────
export const LOCATION_TASK = "help-app-background-location";
const HOME_RADIUS_METERS = 50;
const CACHE_TTL_MS = 10 * 60 * 1000;     // 10 minutes
const SAVE_THROTTLE_MS = 2 * 60 * 1000;  // save location every 2 min max
const PERMISSION_TIMEOUT_MS = 10000;

// ─── Notification handler ─────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── Request notification permissions ────────────────────────────────────────
export const requestNotificationPermissions = async () => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    console.log(
      status === "granted"
        ? "✅ Notification permission granted"
        : "❌ Notification permission denied"
    );
  } catch (err) {
    console.log("❌ Notification permission error:", err);
  }
};

// ─── Local notification (user's own device) ───────────────────────────────────
async function sendLocalNotification(title: string, body: string) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null,
    });
  } catch (err) {
    console.log("❌ sendLocalNotification error:", err);
  }
}

// ─── Remote push to guardian ──────────────────────────────────────────────────
async function notifyGuardian(userId: string, title: string, body: string) {
  try {
    const { data: links, error } = await supabase
      .from("help_app_guardian_links")
      .select("guardian_id")
      .eq("user_id", userId)
      .eq("status", "approved");

    if (error || !links || links.length === 0) {
      console.log("⚠️ No approved guardian for user:", userId);
      return;
    }

    for (const link of links) {
      const guardianToken = await getPushTokenForUser(link.guardian_id);
      if (!guardianToken) {
        console.log("⚠️ No push token for guardian:", link.guardian_id);
        continue;
      }
      await sendExpoPushNotification(guardianToken, title, body);
      console.log("✅ Guardian notified:", link.guardian_id);
    }
  } catch (err) {
    console.log("❌ notifyGuardian error:", err);
  }
}

// ─── Insert alert row (triggers guardian's realtime listener) ─────────────────
async function insertAlert(userId: string, alertType: string, message: string) {
  try {
    await supabase.from("help_app_alerts").insert({
      user_id: userId,
      alert_type: alertType,
      message,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.log("❌ insertAlert error:", err);
  }
}

// ─── Haversine distance ───────────────────────────────────────────────────────
function getDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Load safe zones from Supabase ───────────────────────────────────────────
async function loadSafeZones(userId: string) {
  try {
    const { data, error } = await supabase
      .from("help_app_safe_zones")
      .select("center_lat, center_lng, radius_meters")
      .eq("user_id", userId)
      .eq("active", true);
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

// ─── Load home location from Supabase ────────────────────────────────────────
async function loadHomeLocation(userId: string) {
  try {
    const { data, error } = await supabase
      .from("help_app_user_locations")
      .select("lat, lng")
      .eq("user_id", userId)
      .eq("is_home", true)
      .maybeSingle();
    if (error || !data) return null;
    return { latitude: Number(data.lat), longitude: Number(data.lng) };
  } catch {
    return null;
  }
}

// ─── Cached safe zones (10 min TTL) ──────────────────────────────────────────
async function getCachedSafeZones(userId: string) {
  try {
    const cached = await AsyncStorage.getItem("CACHED_SAFE_ZONES");
    const cachedAt = Number(
      (await AsyncStorage.getItem("CACHED_ZONES_AT")) ?? 0
    );
    if (cached && Date.now() - cachedAt < CACHE_TTL_MS) {
      return JSON.parse(cached);
    }
    const fresh = await loadSafeZones(userId);
    await AsyncStorage.setItem("CACHED_SAFE_ZONES", JSON.stringify(fresh));
    await AsyncStorage.setItem("CACHED_ZONES_AT", String(Date.now()));
    return fresh;
  } catch {
    return [];
  }
}

// ─── Cached home location (10 min TTL) ───────────────────────────────────────
async function getCachedHomeLocation(userId: string) {
  try {
    const cached = await AsyncStorage.getItem("CACHED_HOME_LOCATION");
    const cachedAt = Number(
      (await AsyncStorage.getItem("CACHED_HOME_AT")) ?? 0
    );
    if (cached && Date.now() - cachedAt < CACHE_TTL_MS) {
      return JSON.parse(cached);
    }
    const fresh = await loadHomeLocation(userId);
    if (fresh) {
      await AsyncStorage.setItem(
        "CACHED_HOME_LOCATION",
        JSON.stringify(fresh)
      );
      await AsyncStorage.setItem("CACHED_HOME_AT", String(Date.now()));
    }
    return fresh;
  } catch {
    return null;
  }
}

// ─── Throttled location save (simple INSERT) ──────────────────────────────────
async function saveLocationToSupabase(
  userId: string,
  latitude: number,
  longitude: number
) {
  try {
    const lastSaved = Number(
      (await AsyncStorage.getItem("LAST_SAVED_AT")) ?? 0
    );
    if (Date.now() - lastSaved < SAVE_THROTTLE_MS) {
      console.log("⏩ Location save throttled — skipping");
      return;
    }

    await supabase.from("help_app_user_locations").insert({
      user_id: userId,
      lat: latitude,
      lng: longitude,
      is_home: false,
      recorded_at: new Date().toISOString(),
    });

    await AsyncStorage.setItem("LAST_SAVED_AT", String(Date.now()));
    console.log("💾 Location inserted:", latitude, longitude);
  } catch (err) {
    console.log("❌ Error saving location:", err);
  }
}

// ─── BACKGROUND TASK ─────────────────────────────────────────────────────────
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.log("❌ Background Task Error:", error);
    return;
  }
  if (!data) return;

  const { locations } = data as any;
  const location = locations?.[0];
  if (!location) return;

  const { latitude, longitude } = location.coords;
  console.log("🟢 BACKGROUND TASK TRIGGERED:", new Date().toISOString());
  console.log("📍 Coords:", latitude, longitude);

  try {
    // Always save raw coords to AsyncStorage first — no network needed
    await AsyncStorage.setItem(
      "LAST_LOCATION",
      JSON.stringify({
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
      })
    );

    // Skip supabase.auth.getUser() in background — use AsyncStorage instead
    const userId = await AsyncStorage.getItem("CURRENT_USER_ID");
    if (!userId) {
      console.log("⚠️ No userId in background task — skipping");
      return;
    }
    console.log("👤 userId:", userId);

    // Use cached zones/home to avoid DB calls every ping
    const [safeZones, homeLocation] = await Promise.all([
      getCachedSafeZones(userId),
      getCachedHomeLocation(userId),
    ]);

    // Save location (throttled, simple insert)
    await saveLocationToSupabase(userId, latitude, longitude);

    // ── Safe zone check ───────────────────────────────────────────────────────
    if (safeZones.length > 0) {
      const insideAnyZone = safeZones.some(
        (zone: any) =>
          getDistanceInMeters(
            latitude,
            longitude,
            zone.center_lat,
            zone.center_lng
          ) <= zone.radius_meters
      );

      const alreadyBreached = await AsyncStorage.getItem("GEOFENCE_BREACHED");

      if (!insideAnyZone && !alreadyBreached) {
        await AsyncStorage.setItem("GEOFENCE_BREACHED", "true");
        const title = "🚨 Safe Zone Alert";
        const userBody = "You have crossed outside the safe zone!";
        const guardianBody = "Your linked user has crossed outside the safe zone!";
        await sendLocalNotification(title, userBody);
        await notifyGuardian(userId, title, guardianBody);
        await insertAlert(userId, "zone_exit", guardianBody);
        console.log("🚨 Safe zone breach triggered");
      } else if (insideAnyZone && alreadyBreached) {
        await AsyncStorage.removeItem("GEOFENCE_BREACHED");
        console.log("✅ User returned inside safe zone");
      }
    }

    // ── Home check ────────────────────────────────────────────────────────────
    if (homeLocation) {
      const distFromHome = getDistanceInMeters(
        latitude,
        longitude,
        homeLocation.latitude,
        homeLocation.longitude
      );

      const alreadyLeftHome = await AsyncStorage.getItem("LEFT_HOME");

      if (distFromHome > HOME_RADIUS_METERS && !alreadyLeftHome) {
        await AsyncStorage.setItem("LEFT_HOME", "true");
        const title = "🏠 User Left Home";
        const userBody = "You have left the home area.";
        const guardianBody = "Your linked user has left the home area.";
        await sendLocalNotification(title, userBody);
        await notifyGuardian(userId, title, guardianBody);
        await insertAlert(userId, "zone_exit", `${guardianBody} (home)`);
        console.log("🏠 Left home triggered");
      } else if (distFromHome <= HOME_RADIUS_METERS && alreadyLeftHome) {
        await AsyncStorage.removeItem("LEFT_HOME");
        console.log("✅ User returned home");
      }
    }

    console.log("✅ Background task completed");
  } catch (err) {
    console.log("❌ Background task error:", err);
  }
});

// ─── Permission helper with timeout ──────────────────────────────────────────
async function requestPermissionWithTimeout(
  requestFn: () => Promise<{ status: string }>,
  label: string,
  timeoutMs = PERMISSION_TIMEOUT_MS
): Promise<boolean> {
  return new Promise(async (resolve) => {
    const timer = setTimeout(() => {
      console.log(`⏱️ ${label} permission timed out`);
      resolve(false);
    }, timeoutMs);
    try {
      const { status } = await requestFn();
      clearTimeout(timer);
      if (status !== "granted") {
        console.log(`❌ ${label} permission denied`);
        resolve(false);
      } else {
        resolve(true);
      }
    } catch (err) {
      clearTimeout(timer);
      console.log(`❌ ${label} permission error:`, err);
      resolve(false);
    }
  });
}

// ─── START BACKGROUND TRACKING ───────────────────────────────────────────────
export const startBackgroundTracking = async (userId: string) => {
  try {
    await AsyncStorage.setItem("CURRENT_USER_ID", userId);

    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
    if (isRegistered) {
      try {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK);
        console.log("🗑️ Cleared old task — re-registering fresh");
      } catch (err) {
        console.log("⚠️ Could not stop old task:", err);
      }
    }

    const fgGranted = await requestPermissionWithTimeout(
      () => Location.requestForegroundPermissionsAsync(),
      "Foreground location"
    );
    if (!fgGranted) return;

    const bgGranted = await requestPermissionWithTimeout(
      () => Location.requestBackgroundPermissionsAsync(),
      "Background location"
    );
    if (!bgGranted) return;

    await requestNotificationPermissions();

    const { saveExpoPushToken } = await import("@/services/pushToken");
    await saveExpoPushToken();

    await Promise.all([
      getCachedSafeZones(userId),
      getCachedHomeLocation(userId),
    ]);

    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 10000,
      distanceInterval: 10,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "Safety Monitoring Active",
        notificationBody: "Your location is monitored for safety.",
      },
    });

    console.log("✅ Background tracking started for user:", userId);
  } catch (err) {
    console.log("❌ Start tracking error:", err);
  }
};

// ─── STOP BACKGROUND TRACKING ────────────────────────────────────────────────
export const stopBackgroundTracking = async () => {
  try {
    const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
    if (!started) {
      console.log("ℹ️ Background tracking already stopped");
      return;
    }
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
    console.log("🛑 Background tracking stopped");
  } catch (err) {
    console.log("❌ Stop tracking error:", err);
  }
};

// ─── FORCE RESTART ────────────────────────────────────────────────────────────
export const forceRestartTracking = async (userId: string) => {
  console.log("🔄 Force restarting background tracking...");
  await stopBackgroundTracking();

  await AsyncStorage.multiRemove([
    "GEOFENCE_BREACHED",
    "LEFT_HOME",
    "LAST_SAVED_AT",
    "CACHED_SAFE_ZONES",
    "CACHED_ZONES_AT",
    "CACHED_HOME_LOCATION",
    "CACHED_HOME_AT",
  ]);

  await new Promise((res) => setTimeout(res, 1000));
  await AsyncStorage.setItem("CURRENT_USER_ID", userId);
  await requestNotificationPermissions();

  const fgGranted = await requestPermissionWithTimeout(
    () => Location.requestForegroundPermissionsAsync(),
    "Foreground location"
  );
  const bgGranted = await requestPermissionWithTimeout(
    () => Location.requestBackgroundPermissionsAsync(),
    "Background location"
  );

  if (!fgGranted || !bgGranted) {
    console.log("❌ Permissions not granted for force restart");
    return;
  }

  await Promise.all([
    getCachedSafeZones(userId),
    getCachedHomeLocation(userId),
  ]);

  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 10000,
    distanceInterval: 10,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "Safety Monitoring Active",
      notificationBody: "Your location is monitored for safety.",
    },
  });

  console.log("✅ Background tracking force restarted for user:", userId);
};

// ─── INVALIDATE CACHE ─────────────────────────────────────────────────────────
export const invalidateLocationCache = async () => {
  await AsyncStorage.multiRemove([
    "CACHED_SAFE_ZONES",
    "CACHED_ZONES_AT",
    "CACHED_HOME_LOCATION",
    "CACHED_HOME_AT",
  ]);
  console.log("🗑️ Location cache invalidated");
};