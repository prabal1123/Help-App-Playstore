// import * as TaskManager from "expo-task-manager";
// import * as Location from "expo-location";
// import * as Notifications from "expo-notifications";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { supabase } from "@/supabase/supabase";
// import {
//   getPushTokenForUser,
//   sendExpoPushNotification,
// } from "@/services/pushToken";

// // ─── Constants ────────────────────────────────────────────────────────────────
// export const LOCATION_TASK = "help-app-background-location";
// const HOME_RADIUS_METERS = 50;
// const CACHE_TTL_MS = 10 * 60 * 1000;     // 10 minutes
// const SAVE_THROTTLE_MS = 2 * 60 * 1000;  // save location every 2 min max
// const PERMISSION_TIMEOUT_MS = 10000;

// // ─── Notification handler ─────────────────────────────────────────────────────
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowBanner: true,
//     shouldShowList: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });

// // ─── Request notification permissions ────────────────────────────────────────
// export const requestNotificationPermissions = async () => {
//   try {
//     const { status } = await Notifications.requestPermissionsAsync();
//     console.log(
//       status === "granted"
//         ? "✅ Notification permission granted"
//         : "❌ Notification permission denied"
//     );
//   } catch (err) {
//     console.log("❌ Notification permission error:", err);
//   }
// };

// // ─── Local notification (user's own device) ───────────────────────────────────
// async function sendLocalNotification(title: string, body: string) {
//   try {
//     await Notifications.scheduleNotificationAsync({
//       content: {
//         title,
//         body,
//         sound: true,
//         priority: Notifications.AndroidNotificationPriority.MAX,
//       },
//       trigger: null,
//     });
//   } catch (err) {
//     console.log("❌ sendLocalNotification error:", err);
//   }
// }

// // ─── Remote push to guardian ──────────────────────────────────────────────────
// async function notifyGuardian(userId: string, title: string, body: string) {
//   try {
//     const { data: links, error } = await supabase
//       .from("help_app_guardian_links")
//       .select("guardian_id")
//       .eq("user_id", userId)
//       .eq("status", "approved");

//     if (error || !links || links.length === 0) {
//       console.log("⚠️ No approved guardian for user:", userId);
//       return;
//     }

//     for (const link of links) {
//       const guardianToken = await getPushTokenForUser(link.guardian_id);
//       if (!guardianToken) {
//         console.log("⚠️ No push token for guardian:", link.guardian_id);
//         continue;
//       }
//       await sendExpoPushNotification(guardianToken, title, body);
//       console.log("✅ Guardian notified:", link.guardian_id);
//     }
//   } catch (err) {
//     console.log("❌ notifyGuardian error:", err);
//   }
// }

// // ─── Insert alert row (triggers guardian's realtime listener) ─────────────────
// async function insertAlert(userId: string, alertType: string, message: string) {
//   try {
//     await supabase.from("help_app_alerts").insert({
//       user_id: userId,
//       alert_type: alertType,
//       message,
//       created_at: new Date().toISOString(),
//     });
//   } catch (err) {
//     console.log("❌ insertAlert error:", err);
//   }
// }

// // ─── Haversine distance ───────────────────────────────────────────────────────
// function getDistanceInMeters(
//   lat1: number,
//   lon1: number,
//   lat2: number,
//   lon2: number
// ) {
//   const R = 6371000;
//   const dLat = ((lat2 - lat1) * Math.PI) / 180;
//   const dLon = ((lon2 - lon1) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos((lat1 * Math.PI) / 180) *
//       Math.cos((lat2 * Math.PI) / 180) *
//       Math.sin(dLon / 2) *
//       Math.sin(dLon / 2);
//   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// }

// // ─── Load safe zones from Supabase ───────────────────────────────────────────
// async function loadSafeZones(userId: string) {
//   try {
//     const { data, error } = await supabase
//       .from("help_app_safe_zones")
//       .select("center_lat, center_lng, radius_meters")
//       .eq("user_id", userId)
//       .eq("active", true);
//     if (error) return [];
//     return data || [];
//   } catch {
//     return [];
//   }
// }

// // ─── Load home location from Supabase ────────────────────────────────────────
// async function loadHomeLocation(userId: string) {
//   try {
//     const { data, error } = await supabase
//       .from("help_app_user_locations")
//       .select("lat, lng")
//       .eq("user_id", userId)
//       .eq("is_home", true)
//       .maybeSingle();
//     if (error || !data) return null;
//     return { latitude: Number(data.lat), longitude: Number(data.lng) };
//   } catch {
//     return null;
//   }
// }

// // ─── Cached safe zones (10 min TTL) ──────────────────────────────────────────
// async function getCachedSafeZones(userId: string) {
//   try {
//     const cached = await AsyncStorage.getItem("CACHED_SAFE_ZONES");
//     const cachedAt = Number(
//       (await AsyncStorage.getItem("CACHED_ZONES_AT")) ?? 0
//     );
//     if (cached && Date.now() - cachedAt < CACHE_TTL_MS) {
//       return JSON.parse(cached);
//     }
//     const fresh = await loadSafeZones(userId);
//     await AsyncStorage.setItem("CACHED_SAFE_ZONES", JSON.stringify(fresh));
//     await AsyncStorage.setItem("CACHED_ZONES_AT", String(Date.now()));
//     return fresh;
//   } catch {
//     return [];
//   }
// }

// // ─── Cached home location (10 min TTL) ───────────────────────────────────────
// async function getCachedHomeLocation(userId: string) {
//   try {
//     const cached = await AsyncStorage.getItem("CACHED_HOME_LOCATION");
//     const cachedAt = Number(
//       (await AsyncStorage.getItem("CACHED_HOME_AT")) ?? 0
//     );
//     if (cached && Date.now() - cachedAt < CACHE_TTL_MS) {
//       return JSON.parse(cached);
//     }
//     const fresh = await loadHomeLocation(userId);
//     if (fresh) {
//       await AsyncStorage.setItem(
//         "CACHED_HOME_LOCATION",
//         JSON.stringify(fresh)
//       );
//       await AsyncStorage.setItem("CACHED_HOME_AT", String(Date.now()));
//     }
//     return fresh;
//   } catch {
//     return null;
//   }
// }

// // ─── Throttled location save (simple INSERT) ──────────────────────────────────
// async function saveLocationToSupabase(
//   userId: string,
//   latitude: number,
//   longitude: number
// ) {
//   try {
//     const lastSaved = Number(
//       (await AsyncStorage.getItem("LAST_SAVED_AT")) ?? 0
//     );
//     if (Date.now() - lastSaved < SAVE_THROTTLE_MS) {
//       console.log("⏩ Location save throttled — skipping");
//       return;
//     }

//     await supabase.from("help_app_user_locations").insert({
//       user_id: userId,
//       lat: latitude,
//       lng: longitude,
//       is_home: false,
//       recorded_at: new Date().toISOString(),
//     });

//     await AsyncStorage.setItem("LAST_SAVED_AT", String(Date.now()));
//     console.log("💾 Location inserted:", latitude, longitude);
//   } catch (err) {
//     console.log("❌ Error saving location:", err);
//   }
// }

// // ─── BACKGROUND TASK ─────────────────────────────────────────────────────────
// TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
//   if (error) {
//     console.log("❌ Background Task Error:", error);
//     return;
//   }
//   if (!data) return;

//   const { locations } = data as any;
//   const location = locations?.[0];
//   if (!location) return;

//   const { latitude, longitude } = location.coords;
//   console.log("🟢 BACKGROUND TASK TRIGGERED:", new Date().toISOString());
//   console.log("📍 Coords:", latitude, longitude);

//   try {
//     // Always save raw coords to AsyncStorage first — no network needed
//     await AsyncStorage.setItem(
//       "LAST_LOCATION",
//       JSON.stringify({
//         latitude,
//         longitude,
//         timestamp: new Date().toISOString(),
//       })
//     );

//     // Skip supabase.auth.getUser() in background — use AsyncStorage instead
//     const userId = await AsyncStorage.getItem("CURRENT_USER_ID");
//     if (!userId) {
//       console.log("⚠️ No userId in background task — skipping");
//       return;
//     }
//     console.log("👤 userId:", userId);

//     // Use cached zones/home to avoid DB calls every ping
//     const [safeZones, homeLocation] = await Promise.all([
//       getCachedSafeZones(userId),
//       getCachedHomeLocation(userId),
//     ]);

//     // Save location (throttled, simple insert)
//     await saveLocationToSupabase(userId, latitude, longitude);

//     // ── Safe zone check ───────────────────────────────────────────────────────
//     if (safeZones.length > 0) {
//       const insideAnyZone = safeZones.some(
//         (zone: any) =>
//           getDistanceInMeters(
//             latitude,
//             longitude,
//             zone.center_lat,
//             zone.center_lng
//           ) <= zone.radius_meters
//       );

//       const alreadyBreached = await AsyncStorage.getItem("GEOFENCE_BREACHED");

//       if (!insideAnyZone && !alreadyBreached) {
//         await AsyncStorage.setItem("GEOFENCE_BREACHED", "true");
//         const title = "🚨 Safe Zone Alert";
//         const userBody = "You have crossed outside the safe zone!";
//         const guardianBody = "Your linked user has crossed outside the safe zone!";
//         await sendLocalNotification(title, userBody);
//         await notifyGuardian(userId, title, guardianBody);
//         await insertAlert(userId, "zone_exit", guardianBody);
//         console.log("🚨 Safe zone breach triggered");
//       } else if (insideAnyZone && alreadyBreached) {
//         await AsyncStorage.removeItem("GEOFENCE_BREACHED");
//         console.log("✅ User returned inside safe zone");
//       }
//     }

//     // ── Home check ────────────────────────────────────────────────────────────
//     if (homeLocation) {
//       const distFromHome = getDistanceInMeters(
//         latitude,
//         longitude,
//         homeLocation.latitude,
//         homeLocation.longitude
//       );

//       const alreadyLeftHome = await AsyncStorage.getItem("LEFT_HOME");

//       if (distFromHome > HOME_RADIUS_METERS && !alreadyLeftHome) {
//         await AsyncStorage.setItem("LEFT_HOME", "true");
//         const title = "🏠 User Left Home";
//         const userBody = "You have left the home area.";
//         const guardianBody = "Your linked user has left the home area.";
//         await sendLocalNotification(title, userBody);
//         await notifyGuardian(userId, title, guardianBody);
//         await insertAlert(userId, "zone_exit", `${guardianBody} (home)`);
//         console.log("🏠 Left home triggered");
//       } else if (distFromHome <= HOME_RADIUS_METERS && alreadyLeftHome) {
//         await AsyncStorage.removeItem("LEFT_HOME");
//         console.log("✅ User returned home");
//       }
//     }

//     console.log("✅ Background task completed");
//   } catch (err) {
//     console.log("❌ Background task error:", err);
//   }
// });

// // ─── Permission helper with timeout ──────────────────────────────────────────
// async function requestPermissionWithTimeout(
//   requestFn: () => Promise<{ status: string }>,
//   label: string,
//   timeoutMs = PERMISSION_TIMEOUT_MS
// ): Promise<boolean> {
//   return new Promise(async (resolve) => {
//     const timer = setTimeout(() => {
//       console.log(`⏱️ ${label} permission timed out`);
//       resolve(false);
//     }, timeoutMs);
//     try {
//       const { status } = await requestFn();
//       clearTimeout(timer);
//       if (status !== "granted") {
//         console.log(`❌ ${label} permission denied`);
//         resolve(false);
//       } else {
//         resolve(true);
//       }
//     } catch (err) {
//       clearTimeout(timer);
//       console.log(`❌ ${label} permission error:`, err);
//       resolve(false);
//     }
//   });
// } 

// // ─── START BACKGROUND TRACKING ───────────────────────────────────────────────
// export const startBackgroundTracking = async (userId: string) => {
//   try {
//     await AsyncStorage.setItem("CURRENT_USER_ID", userId);

//     const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
//     if (isRegistered) {
//       try {
//         await Location.stopLocationUpdatesAsync(LOCATION_TASK);
//         console.log("🗑️ Cleared old task — re-registering fresh");
//       } catch (err) {
//         console.log("⚠️ Could not stop old task:", err);
//       }
//     }

//     const fgGranted = await requestPermissionWithTimeout(
//       () => Location.requestForegroundPermissionsAsync(),
//       "Foreground location"
//     );
//     if (!fgGranted) return;

//     const bgGranted = await requestPermissionWithTimeout(
//       () => Location.requestBackgroundPermissionsAsync(),
//       "Background location"
//     );
//     if (!bgGranted) return;

//     await requestNotificationPermissions();

//     const { saveExpoPushToken } = await import("@/services/pushToken");
//     await saveExpoPushToken();

//     await Promise.all([
//       getCachedSafeZones(userId),
//       getCachedHomeLocation(userId),
//     ]);

//     await Location.startLocationUpdatesAsync(LOCATION_TASK, {
//       accuracy: Location.Accuracy.Balanced,
//       timeInterval: 10000,
//       distanceInterval: 10,
//       showsBackgroundLocationIndicator: true,
//       foregroundService: {
//         notificationTitle: "Safety Monitoring Active",
//         notificationBody: "Your location is monitored for safety.",
//       },
//     });

//     console.log("✅ Background tracking started for user:", userId);
//   } catch (err) {
//     console.log("❌ Start tracking error:", err);
//   }
// };

// // ─── STOP BACKGROUND TRACKING ────────────────────────────────────────────────
// export const stopBackgroundTracking = async () => {
//   try {
//     const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
//     if (!started) {
//       console.log("ℹ️ Background tracking already stopped");
//       return;
//     }
//     await Location.stopLocationUpdatesAsync(LOCATION_TASK);
//     console.log("🛑 Background tracking stopped");
//   } catch (err) {
//     console.log("❌ Stop tracking error:", err);
//   }
// };

// // ─── FORCE RESTART ────────────────────────────────────────────────────────────
// export const forceRestartTracking = async (userId: string) => {
//   console.log("🔄 Force restarting background tracking...");
//   await stopBackgroundTracking();

//   await AsyncStorage.multiRemove([
//     "GEOFENCE_BREACHED",
//     "LEFT_HOME",
//     "LAST_SAVED_AT",
//     "CACHED_SAFE_ZONES",
//     "CACHED_ZONES_AT",
//     "CACHED_HOME_LOCATION",
//     "CACHED_HOME_AT",
//   ]);

//   await new Promise((res) => setTimeout(res, 1000));
//   await AsyncStorage.setItem("CURRENT_USER_ID", userId);
//   await requestNotificationPermissions();

//   const fgGranted = await requestPermissionWithTimeout(
//     () => Location.requestForegroundPermissionsAsync(),
//     "Foreground location"
//   );
//   const bgGranted = await requestPermissionWithTimeout(
//     () => Location.requestBackgroundPermissionsAsync(),
//     "Background location"
//   );

//   if (!fgGranted || !bgGranted) {
//     console.log("❌ Permissions not granted for force restart");
//     return;
//   }

//   await Promise.all([
//     getCachedSafeZones(userId),
//     getCachedHomeLocation(userId),
//   ]);

//   await Location.startLocationUpdatesAsync(LOCATION_TASK, {
//     accuracy: Location.Accuracy.Balanced,
//     timeInterval: 10000,
//     distanceInterval: 10,
//     showsBackgroundLocationIndicator: true,
//     foregroundService: {
//       notificationTitle: "Safety Monitoring Active",
//       notificationBody: "Your location is monitored for safety.",
//     },
//   });

//   console.log("✅ Background tracking force restarted for user:", userId);
// };

// // ─── INVALIDATE CACHE ─────────────────────────────────────────────────────────
// export const invalidateLocationCache = async () => {
//   await AsyncStorage.multiRemove([
//     "CACHED_SAFE_ZONES",
//     "CACHED_ZONES_AT",
//     "CACHED_HOME_LOCATION",
//     "CACHED_HOME_AT",
//   ]);
//   console.log("🗑️ Location cache invalidated");
// };





// import * as TaskManager from "expo-task-manager";
// import * as Location from "expo-location";
// import * as Notifications from "expo-notifications";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { supabase } from "@/supabase/supabase";
// import {
//   getPushTokenForUser,
//   sendExpoPushNotification,
// } from "@/services/pushToken";

// // ─── Constants ────────────────────────────────────────────────────────────────
// export const LOCATION_TASK = "help-app-background-location";
// const HOME_RADIUS_METERS = 50;
// const CACHE_TTL_MS = 10 * 60 * 1000;      // 10 minutes
// const SAVE_THROTTLE_MS = 2 * 60 * 1000;   // save location every 2 min max
// const PERMISSION_TIMEOUT_MS = 10000;
// const NOTIFICATION_COOLDOWN_MS = 10 * 60 * 1000; // 10 min between repeat alerts

// // ─── Notification handler ─────────────────────────────────────────────────────
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowBanner: true,
//     shouldShowList: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });

// // ─── Request notification permissions ────────────────────────────────────────
// export const requestNotificationPermissions = async () => {
//   try {
//     const { status } = await Notifications.requestPermissionsAsync();
//     console.log(
//       status === "granted"
//         ? "✅ Notification permission granted"
//         : "❌ Notification permission denied"
//     );
//   } catch (err) {
//     console.log("❌ Notification permission error:", err);
//   }
// };

// // ─── Local notification (user's own device) ───────────────────────────────────
// async function sendLocalNotification(title: string, body: string) {
//   try {
//     await Notifications.scheduleNotificationAsync({
//       content: {
//         title,
//         body,
//         sound: true,
//         priority: Notifications.AndroidNotificationPriority.MAX,
//       },
//       trigger: null,
//     });
//   } catch (err) {
//     console.log("❌ sendLocalNotification error:", err);
//   }
// }

// // ─── Remote push to guardian ──────────────────────────────────────────────────
// async function notifyGuardian(userId: string, title: string, body: string) {
//   try {
//     const { data: links, error } = await supabase
//       .from("help_app_guardian_links")
//       .select("guardian_id")
//       .eq("user_id", userId)
//       .eq("status", "approved");

//     if (error || !links || links.length === 0) {
//       console.log("⚠️ No approved guardian for user:", userId);
//       return;
//     }

//     for (const link of links) {
//       const guardianToken = await getPushTokenForUser(link.guardian_id);
//       if (!guardianToken) {
//         console.log("⚠️ No push token for guardian:", link.guardian_id);
//         continue;
//       }
//       await sendExpoPushNotification(guardianToken, title, body);
//       console.log("✅ Guardian notified:", link.guardian_id);
//     }
//   } catch (err) {
//     console.log("❌ notifyGuardian error:", err);
//   }
// }

// // ─── Insert alert row (triggers guardian's realtime listener) ─────────────────
// async function insertAlert(userId: string, alertType: string, message: string) {
//   try {
//     await supabase.from("help_app_alerts").insert({
//       user_id: userId,
//       alert_type: alertType,
//       message,
//       created_at: new Date().toISOString(),
//     });
//   } catch (err) {
//     console.log("❌ insertAlert error:", err);
//   }
// }

// // ─── Haversine distance ───────────────────────────────────────────────────────
// function getDistanceInMeters(
//   lat1: number,
//   lon1: number,
//   lat2: number,
//   lon2: number
// ) {
//   const R = 6371000;
//   const dLat = ((lat2 - lat1) * Math.PI) / 180;
//   const dLon = ((lon2 - lon1) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos((lat1 * Math.PI) / 180) *
//       Math.cos((lat2 * Math.PI) / 180) *
//       Math.sin(dLon / 2) *
//       Math.sin(dLon / 2);
//   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// }

// // ─── Load safe zones from Supabase ───────────────────────────────────────────
// async function loadSafeZones(userId: string) {
//   try {
//     const { data, error } = await supabase
//       .from("help_app_safe_zones")
//       .select("center_lat, center_lng, radius_meters")
//       .eq("user_id", userId)
//       .eq("active", true);
//     if (error) return [];
//     return data || [];
//   } catch {
//     return [];
//   }
// }

// // ─── Load home location from Supabase ────────────────────────────────────────
// async function loadHomeLocation(userId: string) {
//   try {
//     const { data, error } = await supabase
//       .from("help_app_user_locations")
//       .select("lat, lng")
//       .eq("user_id", userId)
//       .eq("is_home", true)
//       .maybeSingle();
//     if (error || !data) return null;
//     return { latitude: Number(data.lat), longitude: Number(data.lng) };
//   } catch {
//     return null;
//   }
// }

// // ─── Cached safe zones (10 min TTL) ──────────────────────────────────────────
// async function getCachedSafeZones(userId: string) {
//   try {
//     const cached = await AsyncStorage.getItem("CACHED_SAFE_ZONES");
//     const cachedAt = Number(
//       (await AsyncStorage.getItem("CACHED_ZONES_AT")) ?? 0
//     );
//     if (cached && Date.now() - cachedAt < CACHE_TTL_MS) {
//       return JSON.parse(cached);
//     }
//     const fresh = await loadSafeZones(userId);
//     await AsyncStorage.setItem("CACHED_SAFE_ZONES", JSON.stringify(fresh));
//     await AsyncStorage.setItem("CACHED_ZONES_AT", String(Date.now()));
//     return fresh;
//   } catch {
//     return [];
//   }
// }

// // ─── Cached home location (10 min TTL) ───────────────────────────────────────
// async function getCachedHomeLocation(userId: string) {
//   try {
//     const cached = await AsyncStorage.getItem("CACHED_HOME_LOCATION");
//     const cachedAt = Number(
//       (await AsyncStorage.getItem("CACHED_HOME_AT")) ?? 0
//     );
//     if (cached && Date.now() - cachedAt < CACHE_TTL_MS) {
//       return JSON.parse(cached);
//     }
//     const fresh = await loadHomeLocation(userId);
//     if (fresh) {
//       await AsyncStorage.setItem(
//         "CACHED_HOME_LOCATION",
//         JSON.stringify(fresh)
//       );
//       await AsyncStorage.setItem("CACHED_HOME_AT", String(Date.now()));
//     }
//     return fresh;
//   } catch {
//     return null;
//   }
// }

// // ─── Throttled location save (simple INSERT) ──────────────────────────────────
// async function saveLocationToSupabase(
//   userId: string,
//   latitude: number,
//   longitude: number
// ) {
//   try {
//     const lastSaved = Number(
//       (await AsyncStorage.getItem("LAST_SAVED_AT")) ?? 0
//     );
//     if (Date.now() - lastSaved < SAVE_THROTTLE_MS) {
//       console.log("⏩ Location save throttled — skipping");
//       return;
//     }

//     await supabase.from("help_app_user_locations").insert({
//       user_id: userId,
//       lat: latitude,
//       lng: longitude,
//       is_home: false,
//       recorded_at: new Date().toISOString(),
//     });

//     await AsyncStorage.setItem("LAST_SAVED_AT", String(Date.now()));
//     console.log("💾 Location inserted:", latitude, longitude);
//   } catch (err) {
//     console.log("❌ Error saving location:", err);
//   }
// }

// // ─── FIX: Notification cooldown check ────────────────────────────────────────
// // Prevents notification spam when user hovers near zone boundary (in/out/in/out).
// // Each alert type has its own timestamp key so they don't interfere.
// async function isCoolingDown(key: string): Promise<boolean> {
//   try {
//     const lastSent = Number((await AsyncStorage.getItem(key)) ?? 0);
//     return Date.now() - lastSent < NOTIFICATION_COOLDOWN_MS;
//   } catch {
//     return false;
//   }
// }

// async function markNotificationSent(key: string) {
//   try {
//     await AsyncStorage.setItem(key, String(Date.now()));
//   } catch {
//     // non-critical
//   }
// }

// // ─── BACKGROUND TASK ─────────────────────────────────────────────────────────
// TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
//   if (error) {
//     console.log("❌ Background Task Error:", error);
//     return;
//   }
//   if (!data) return;

//   const { locations } = data as any;
//   const location = locations?.[0];
//   if (!location) return;

//   const { latitude, longitude } = location.coords;
//   console.log("🟢 BACKGROUND TASK TRIGGERED:", new Date().toISOString());
//   console.log("📍 Coords:", latitude, longitude);

//   try {
//     // Always save raw coords to AsyncStorage first — no network needed
//     await AsyncStorage.setItem(
//       "LAST_LOCATION",
//       JSON.stringify({
//         latitude,
//         longitude,
//         timestamp: new Date().toISOString(),
//       })
//     );

//     // Skip supabase.auth.getUser() in background — use AsyncStorage instead
//     const userId = await AsyncStorage.getItem("CURRENT_USER_ID");
//     if (!userId) {
//       console.log("⚠️ No userId in background task — skipping");
//       return;
//     }
//     console.log("👤 userId:", userId);

//     // Use cached zones/home to avoid DB calls every ping
//     const [safeZones, homeLocation] = await Promise.all([
//       getCachedSafeZones(userId),
//       getCachedHomeLocation(userId),
//     ]);

//     // Save location (throttled, simple insert)
//     await saveLocationToSupabase(userId, latitude, longitude);

//     // ── Safe zone check ───────────────────────────────────────────────────────
//     if (safeZones.length > 0) {
//       const insideAnyZone = safeZones.some(
//         (zone: any) =>
//           getDistanceInMeters(
//             latitude,
//             longitude,
//             zone.center_lat,
//             zone.center_lng
//           ) <= zone.radius_meters
//       );

//       const alreadyBreached = await AsyncStorage.getItem("GEOFENCE_BREACHED");

//       if (!insideAnyZone && !alreadyBreached) {
//         // FIX: Check cooldown before sending — prevents boundary spam
//         const coolingDown = await isCoolingDown("ZONE_ALERT_LAST_SENT");
//         if (!coolingDown) {
//           await AsyncStorage.setItem("GEOFENCE_BREACHED", "true");
//           const title = "🚨 Safe Zone Alert";
//           const userBody = "You have crossed outside the safe zone!";
//           const guardianBody = "Your linked user has crossed outside the safe zone!";
//           await sendLocalNotification(title, userBody);
//           await notifyGuardian(userId, title, guardianBody);
//           await insertAlert(userId, "zone_exit", guardianBody);
//           await markNotificationSent("ZONE_ALERT_LAST_SENT");
//           console.log("🚨 Safe zone breach triggered");
//         } else {
//           console.log("⏩ Zone alert cooling down — skipping notification");
//         }
//       } else if (insideAnyZone && alreadyBreached) {
//         await AsyncStorage.removeItem("GEOFENCE_BREACHED");
//         console.log("✅ User returned inside safe zone");
//       }
//     }

//     // ── Home check ────────────────────────────────────────────────────────────
//     if (homeLocation) {
//       const distFromHome = getDistanceInMeters(
//         latitude,
//         longitude,
//         homeLocation.latitude,
//         homeLocation.longitude
//       );

//       const alreadyLeftHome = await AsyncStorage.getItem("LEFT_HOME");

//       if (distFromHome > HOME_RADIUS_METERS && !alreadyLeftHome) {
//         // FIX: Check cooldown before sending — prevents boundary spam
//         const coolingDown = await isCoolingDown("HOME_ALERT_LAST_SENT");
//         if (!coolingDown) {
//           await AsyncStorage.setItem("LEFT_HOME", "true");
//           const title = "🏠 User Left Home";
//           const userBody = "You have left the home area.";
//           const guardianBody = "Your linked user has left the home area.";
//           await sendLocalNotification(title, userBody);
//           await notifyGuardian(userId, title, guardianBody);
//           await insertAlert(userId, "zone_exit", `${guardianBody} (home)`);
//           await markNotificationSent("HOME_ALERT_LAST_SENT");
//           console.log("🏠 Left home triggered");
//         } else {
//           console.log("⏩ Home alert cooling down — skipping notification");
//         }
//       } else if (distFromHome <= HOME_RADIUS_METERS && alreadyLeftHome) {
//         await AsyncStorage.removeItem("LEFT_HOME");
//         console.log("✅ User returned home");
//       }
//     }

//     console.log("✅ Background task completed");
//   } catch (err) {
//     console.log("❌ Background task error:", err);
//   }
// });

// // ─── Permission helper with timeout ──────────────────────────────────────────
// async function requestPermissionWithTimeout(
//   requestFn: () => Promise<{ status: string }>,
//   label: string,
//   timeoutMs = PERMISSION_TIMEOUT_MS
// ): Promise<boolean> {
//   return new Promise(async (resolve) => {
//     const timer = setTimeout(() => {
//       console.log(`⏱️ ${label} permission timed out`);
//       resolve(false);
//     }, timeoutMs);
//     try {
//       const { status } = await requestFn();
//       clearTimeout(timer);
//       if (status !== "granted") {
//         console.log(`❌ ${label} permission denied`);
//         resolve(false);
//       } else {
//         resolve(true);
//       }
//     } catch (err) {
//       clearTimeout(timer);
//       console.log(`❌ ${label} permission error:`, err);
//       resolve(false);
//     }
//   });
// }

// // ─── Shared internal tracking config ─────────────────────────────────────────
// // FIX: Single source of truth for startLocationUpdatesAsync options.
// // Previously startBackgroundTracking and forceRestartTracking each had their
// // own copy — a bug fix in one would silently miss the other.
// const TRACKING_OPTIONS: Location.LocationTaskOptions = {
//   accuracy: Location.Accuracy.Balanced,
//   timeInterval: 10000,
//   distanceInterval: 10,
//   showsBackgroundLocationIndicator: true,
//   foregroundService: {
//     notificationTitle: "Safety Monitoring Active",
//     notificationBody: "Your location is monitored for safety.",
//   },
// };

// // ─── Shared internal start function ──────────────────────────────────────────
// // Both startBackgroundTracking and forceRestartTracking call this after their
// // own setup steps. Keeps the actual start logic in one place.
// async function _startLocationUpdates(userId: string): Promise<boolean> {
//   const fgGranted = await requestPermissionWithTimeout(
//     () => Location.requestForegroundPermissionsAsync(),
//     "Foreground location"
//   );
//   if (!fgGranted) return false;

//   const bgGranted = await requestPermissionWithTimeout(
//     () => Location.requestBackgroundPermissionsAsync(),
//     "Background location"
//   );
//   if (!bgGranted) return false;

//   await requestNotificationPermissions();

//   const { saveExpoPushToken } = await import("@/services/pushToken");
//   await saveExpoPushToken();

//   await Promise.all([
//     getCachedSafeZones(userId),
//     getCachedHomeLocation(userId),
//   ]);

//   await Location.startLocationUpdatesAsync(LOCATION_TASK, TRACKING_OPTIONS);
//   return true;
// }

// // ─── START BACKGROUND TRACKING ───────────────────────────────────────────────
// export const startBackgroundTracking = async (userId: string) => {
//   try {
//     await AsyncStorage.setItem("CURRENT_USER_ID", userId);

//     // FIX: Clear stale breach flags on every fresh start.
//     // If the app crashed while user was outside a zone, these flags would stay
//     // true forever — user re-exits the zone and gets no notification because
//     // the system thinks the breach is already active.
//     await AsyncStorage.multiRemove(["GEOFENCE_BREACHED", "LEFT_HOME"]);

//     const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
//     if (isRegistered) {
//       try {
//         await Location.stopLocationUpdatesAsync(LOCATION_TASK);
//         console.log("🗑️ Cleared old task — re-registering fresh");
//       } catch (err) {
//         console.log("⚠️ Could not stop old task:", err);
//       }
//     }

//     const started = await _startLocationUpdates(userId);
//     if (started) {
//       console.log("✅ Background tracking started for user:", userId);
//     }
//   } catch (err) {
//     console.log("❌ Start tracking error:", err);
//   }
// };

// // ─── STOP BACKGROUND TRACKING ────────────────────────────────────────────────
// export const stopBackgroundTracking = async () => {
//   try {
//     const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
//     if (!started) {
//       console.log("ℹ️ Background tracking already stopped");
//       return;
//     }
//     await Location.stopLocationUpdatesAsync(LOCATION_TASK);
//     console.log("🛑 Background tracking stopped");
//   } catch (err) {
//     console.log("❌ Stop tracking error:", err);
//   }
// };

// // ─── FORCE RESTART ────────────────────────────────────────────────────────────
// // FIX: No longer a copy of startBackgroundTracking. Does its own teardown
// // (stop + clear all cache) then delegates to _startLocationUpdates.
// export const forceRestartTracking = async (userId: string) => {
//   console.log("🔄 Force restarting background tracking...");

//   await stopBackgroundTracking();

//   // Clear everything — cache, breach flags, throttle timestamps
//   await AsyncStorage.multiRemove([
//     "GEOFENCE_BREACHED",
//     "LEFT_HOME",
//     "LAST_SAVED_AT",
//     "CACHED_SAFE_ZONES",
//     "CACHED_ZONES_AT",
//     "CACHED_HOME_LOCATION",
//     "CACHED_HOME_AT",
//     "ZONE_ALERT_LAST_SENT",
//     "HOME_ALERT_LAST_SENT",
//   ]);

//   await new Promise((res) => setTimeout(res, 1000));
//   await AsyncStorage.setItem("CURRENT_USER_ID", userId);

//   const started = await _startLocationUpdates(userId);
//   if (started) {
//     console.log("✅ Background tracking force restarted for user:", userId);
//   } else {
//     console.log("❌ Force restart failed — permissions not granted");
//   }
// };

// // ─── INVALIDATE CACHE ─────────────────────────────────────────────────────────
// export const invalidateLocationCache = async () => {
//   await AsyncStorage.multiRemove([
//     "CACHED_SAFE_ZONES",
//     "CACHED_ZONES_AT",
//     "CACHED_HOME_LOCATION",
//     "CACHED_HOME_AT",
//   ]);
//   console.log("🗑️ Location cache invalidated");
// };




// import * as TaskManager from "expo-task-manager";
// import * as Location from "expo-location";
// import * as Notifications from "expo-notifications";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { supabase } from "@/supabase/supabase";
// import {
//   getPushTokenForUser,
//   sendExpoPushNotification,
// } from "@/services/pushToken";

// // ─── Constants ────────────────────────────────────────────────────────────────
// export const LOCATION_TASK = "help-app-background-location";
// const HOME_RADIUS_METERS = 50;
// const CACHE_TTL_MS = 10 * 60 * 1000;      // 10 minutes
// const SAVE_THROTTLE_MS = 2 * 60 * 1000;   // save location every 2 min max
// const PERMISSION_TIMEOUT_MS = 10000;
// const NOTIFICATION_COOLDOWN_MS = 10 * 60 * 1000; // 10 min between repeat alerts

// // ─── BUG 1 FIX: Timeout wrapper ──────────────────────────────────────────────
// // Under Android Doze, AsyncStorage reads can stall indefinitely.
// // This wrapper races any promise against a timeout so the background
// // task always completes rather than hanging until Android kills it.
// function withTimeout<T>(
//   promise: Promise<T>,
//   ms: number,
//   fallback: T,
//   label: string
// ): Promise<T> {
//   return Promise.race([
//     promise,
//     new Promise<T>((resolve) => {
//       setTimeout(() => {
//         console.log(`⏱️ Timeout hit for: ${label} — using fallback`);
//         resolve(fallback);
//       }, ms);
//     }),
//   ]);
// }

// // ─── Notification handler ─────────────────────────────────────────────────────
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowBanner: true,
//     shouldShowList: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });

// // ─── Request notification permissions ────────────────────────────────────────
// export const requestNotificationPermissions = async () => {
//   try {
//     const { status } = await Notifications.requestPermissionsAsync();
//     console.log(
//       status === "granted"
//         ? "✅ Notification permission granted"
//         : "❌ Notification permission denied"
//     );
//   } catch (err) {
//     console.log("❌ Notification permission error:", err);
//   }
// };

// // ─── Local notification (user's own device) ───────────────────────────────────
// async function sendLocalNotification(title: string, body: string) {
//   try {
//     await Notifications.scheduleNotificationAsync({
//       content: {
//         title,
//         body,
//         sound: true,
//         priority: Notifications.AndroidNotificationPriority.MAX,
//       },
//       trigger: null,
//     });
//   } catch (err) {
//     console.log("❌ sendLocalNotification error:", err);
//   }
// }

// // ─── Remote push to guardian ──────────────────────────────────────────────────
// async function notifyGuardian(userId: string, title: string, body: string) {
//   try {
//     const { data: links, error } = await supabase
//       .from("help_app_guardian_links")
//       .select("guardian_id")
//       .eq("user_id", userId)
//       .eq("status", "approved");

//     if (error || !links || links.length === 0) {
//       console.log("⚠️ No approved guardian for user:", userId);
//       return;
//     }

//     for (const link of links) {
//       const guardianToken = await getPushTokenForUser(link.guardian_id);
//       if (!guardianToken) {
//         console.log("⚠️ No push token for guardian:", link.guardian_id);
//         continue;
//       }
//       await sendExpoPushNotification(guardianToken, title, body);
//       console.log("✅ Guardian notified:", link.guardian_id);
//     }
//   } catch (err) {
//     console.log("❌ notifyGuardian error:", err);
//   }
// }

// // ─── Insert alert row (triggers guardian's realtime listener) ─────────────────
// async function insertAlert(userId: string, alertType: string, message: string) {
//   try {
//     await supabase.from("help_app_alerts").insert({
//       user_id: userId,
//       alert_type: alertType,
//       message,
//       created_at: new Date().toISOString(),
//     });
//   } catch (err) {
//     console.log("❌ insertAlert error:", err);
//   }
// }

// // ─── Haversine distance ───────────────────────────────────────────────────────
// function getDistanceInMeters(
//   lat1: number,
//   lon1: number,
//   lat2: number,
//   lon2: number
// ) {
//   const R = 6371000;
//   const dLat = ((lat2 - lat1) * Math.PI) / 180;
//   const dLon = ((lon2 - lon1) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos((lat1 * Math.PI) / 180) *
//       Math.cos((lat2 * Math.PI) / 180) *
//       Math.sin(dLon / 2) *
//       Math.sin(dLon / 2);
//   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// }

// // ─── Load safe zones from Supabase ───────────────────────────────────────────
// async function loadSafeZones(userId: string) {
//   try {
//     const { data, error } = await supabase
//       .from("help_app_safe_zones")
//       .select("center_lat, center_lng, radius_meters")
//       .eq("user_id", userId)
//       .eq("active", true);
//     if (error) return [];
//     return data || [];
//   } catch {
//     return [];
//   }
// }

// // ─── Load home location from Supabase ────────────────────────────────────────
// async function loadHomeLocation(userId: string) {
//   try {
//     const { data, error } = await supabase
//       .from("help_app_user_locations")
//       .select("lat, lng")
//       .eq("user_id", userId)
//       .eq("is_home", true)
//       .maybeSingle();
//     if (error || !data) return null;
//     return { latitude: Number(data.lat), longitude: Number(data.lng) };
//   } catch {
//     return null;
//   }
// }

// // ─── Cached safe zones (10 min TTL) ──────────────────────────────────────────
// async function getCachedSafeZones(userId: string) {
//   try {
//     const cached = await AsyncStorage.getItem("CACHED_SAFE_ZONES");
//     const cachedAt = Number(
//       (await AsyncStorage.getItem("CACHED_ZONES_AT")) ?? 0
//     );
//     if (cached && Date.now() - cachedAt < CACHE_TTL_MS) {
//       return JSON.parse(cached);
//     }
//     const fresh = await loadSafeZones(userId);
//     await AsyncStorage.setItem("CACHED_SAFE_ZONES", JSON.stringify(fresh));
//     await AsyncStorage.setItem("CACHED_ZONES_AT", String(Date.now()));
//     return fresh;
//   } catch {
//     return [];
//   }
// }

// // ─── Cached home location (10 min TTL) ───────────────────────────────────────
// async function getCachedHomeLocation(userId: string) {
//   try {
//     const cached = await AsyncStorage.getItem("CACHED_HOME_LOCATION");
//     const cachedAt = Number(
//       (await AsyncStorage.getItem("CACHED_HOME_AT")) ?? 0
//     );
//     if (cached && Date.now() - cachedAt < CACHE_TTL_MS) {
//       return JSON.parse(cached);
//     }
//     const fresh = await loadHomeLocation(userId);
//     if (fresh) {
//       await AsyncStorage.setItem(
//         "CACHED_HOME_LOCATION",
//         JSON.stringify(fresh)
//       );
//       await AsyncStorage.setItem("CACHED_HOME_AT", String(Date.now()));
//     }
//     return fresh;
//   } catch {
//     return null;
//   }
// }

// // ─── Throttled location save ──────────────────────────────────────────────────
// async function saveLocationToSupabase(
//   userId: string,
//   latitude: number,
//   longitude: number
// ) {
//   try {
//     const lastSaved = Number(
//       (await AsyncStorage.getItem("LAST_SAVED_AT")) ?? 0
//     );
//     if (Date.now() - lastSaved < SAVE_THROTTLE_MS) {
//       console.log("⏩ Location save throttled — skipping");
//       return;
//     }

//     await supabase.from("help_app_user_locations").insert({
//       user_id: userId,
//       lat: latitude,
//       lng: longitude,
//       is_home: false,
//       recorded_at: new Date().toISOString(),
//     });

//     await AsyncStorage.setItem("LAST_SAVED_AT", String(Date.now()));
//     console.log("💾 Location inserted:", latitude, longitude);
//   } catch (err) {
//     console.log("❌ Error saving location:", err);
//   }
// }

// // ─── Notification cooldown check ─────────────────────────────────────────────
// async function isCoolingDown(key: string): Promise<boolean> {
//   try {
//     const lastSent = Number((await AsyncStorage.getItem(key)) ?? 0);
//     return Date.now() - lastSent < NOTIFICATION_COOLDOWN_MS;
//   } catch {
//     return false;
//   }
// }

// async function markNotificationSent(key: string) {
//   try {
//     await AsyncStorage.setItem(key, String(Date.now()));
//   } catch {
//     // non-critical
//   }
// }

// // ─── BACKGROUND TASK ─────────────────────────────────────────────────────────
// TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
//   if (error) {
//     console.log("❌ Background Task Error:", error);
//     return;
//   }
//   if (!data) return;

//   const { locations } = data as any;
//   const location = locations?.[0];
//   if (!location) return;

//   const { latitude, longitude } = location.coords;
//   console.log("🟢 BACKGROUND TASK TRIGGERED:", new Date().toISOString());
//   console.log("📍 Coords:", latitude, longitude);

//   try {
//     await AsyncStorage.setItem(
//       "LAST_LOCATION",
//       JSON.stringify({
//         latitude,
//         longitude,
//         timestamp: new Date().toISOString(),
//       })
//     );

//     const userId = await AsyncStorage.getItem("CURRENT_USER_ID");
//     if (!userId) {
//       console.log("⚠️ No userId in background task — skipping");
//       return;
//     }
//     console.log("👤 userId:", userId);

//     console.log("⏳ Loading zones + home...");
//     const [safeZones, homeLocation] = await Promise.all([
//       withTimeout(getCachedSafeZones(userId), 5000, [], "safeZones"),
//       withTimeout(getCachedHomeLocation(userId), 5000, null, "homeLocation"),
//     ]);
//     console.log(
//       "✅ Zones loaded:", safeZones.length,
//       "| home:", !!homeLocation
//     );

//     await withTimeout(
//       saveLocationToSupabase(userId, latitude, longitude),
//       8000,
//       undefined,
//       "saveLocation"
//     );

//     // ── Safe zone check ───────────────────────────────────────────────────────
//     if (safeZones.length > 0) {
//       const insideAnyZone = safeZones.some(
//         (zone: any) =>
//           getDistanceInMeters(
//             latitude,
//             longitude,
//             zone.center_lat,
//             zone.center_lng
//           ) <= zone.radius_meters
//       );

//       const alreadyBreached = await AsyncStorage.getItem("GEOFENCE_BREACHED");

//       if (!insideAnyZone && !alreadyBreached) {
//         const coolingDown = await isCoolingDown("ZONE_ALERT_LAST_SENT");
//         if (!coolingDown) {
//           await AsyncStorage.setItem("GEOFENCE_BREACHED", "true");
//           const title = "🚨 Safe Zone Alert";
//           const userBody = "You have crossed outside the safe zone!";
//           const guardianBody = "Your linked user has crossed outside the safe zone!";
//           await sendLocalNotification(title, userBody);
//           await notifyGuardian(userId, title, guardianBody);
//           await insertAlert(userId, "zone_exit", guardianBody);
//           await markNotificationSent("ZONE_ALERT_LAST_SENT");
//           console.log("🚨 Safe zone breach triggered");
//         } else {
//           console.log("⏩ Zone alert cooling down — skipping notification");
//         }
//       } else if (insideAnyZone && alreadyBreached) {
//         await AsyncStorage.removeItem("GEOFENCE_BREACHED");
//         console.log("✅ User returned inside safe zone");
//       }
//     }

//     // ── Home check ────────────────────────────────────────────────────────────
//     if (homeLocation) {
//       const distFromHome = getDistanceInMeters(
//         latitude,
//         longitude,
//         homeLocation.latitude,
//         homeLocation.longitude
//       );

//       const alreadyLeftHome = await AsyncStorage.getItem("LEFT_HOME");

//       if (distFromHome > HOME_RADIUS_METERS && !alreadyLeftHome) {
//         const coolingDown = await isCoolingDown("HOME_ALERT_LAST_SENT");
//         if (!coolingDown) {
//           await AsyncStorage.setItem("LEFT_HOME", "true");
//           const title = "🏠 User Left Home";
//           const userBody = "You have left the home area.";
//           const guardianBody = "Your linked user has left the home area.";
//           await sendLocalNotification(title, userBody);
//           await notifyGuardian(userId, title, guardianBody);
//           await insertAlert(userId, "zone_exit", `${guardianBody} (home)`);
//           await markNotificationSent("HOME_ALERT_LAST_SENT");
//           console.log("🏠 Left home triggered");
//         } else {
//           console.log("⏩ Home alert cooling down — skipping notification");
//         }
//       } else if (distFromHome <= HOME_RADIUS_METERS && alreadyLeftHome) {
//         await AsyncStorage.removeItem("LEFT_HOME");
//         console.log("✅ User returned home");
//       }
//     }

//     console.log("✅ Background task completed");
//   } catch (err) {
//     console.log("❌ Background task error:", err);
//   }
// });

// // ─── Permission helper with timeout ──────────────────────────────────────────
// async function requestPermissionWithTimeout(
//   requestFn: () => Promise<{ status: string }>,
//   label: string,
//   timeoutMs = PERMISSION_TIMEOUT_MS
// ): Promise<boolean> {
//   return new Promise(async (resolve) => {
//     const timer = setTimeout(() => {
//       console.log(`⏱️ ${label} permission timed out`);
//       resolve(false);
//     }, timeoutMs);
//     try {
//       const { status } = await requestFn();
//       clearTimeout(timer);
//       if (status !== "granted") {
//         console.log(`❌ ${label} permission denied`);
//         resolve(false);
//       } else {
//         resolve(true);
//       }
//     } catch (err) {
//       clearTimeout(timer);
//       console.log(`❌ ${label} permission error:`, err);
//       resolve(false);
//     }
//   });
// }

// // ─── Shared tracking config ───────────────────────────────────────────────────
// const TRACKING_OPTIONS: Location.LocationTaskOptions = {
//   accuracy: Location.Accuracy.Balanced,
//   timeInterval: 10000,
//   distanceInterval: 10,
//   showsBackgroundLocationIndicator: true,
//   foregroundService: {
//     notificationTitle: "Safety Monitoring Active",
//     notificationBody: "Your location is monitored for safety.",
//   },
// };

// // ─── Shared internal start function ──────────────────────────────────────────
// async function _startLocationUpdates(userId: string): Promise<boolean> {
//   const fgGranted = await requestPermissionWithTimeout(
//     () => Location.requestForegroundPermissionsAsync(),
//     "Foreground location"
//   );
//   if (!fgGranted) return false;

//   const bgGranted = await requestPermissionWithTimeout(
//     () => Location.requestBackgroundPermissionsAsync(),
//     "Background location"
//   );
//   if (!bgGranted) return false;

//   await requestNotificationPermissions();

//   const { saveExpoPushToken } = await import("@/services/pushToken");
//   await saveExpoPushToken();

//   await Promise.all([
//     getCachedSafeZones(userId),
//     getCachedHomeLocation(userId),
//   ]);

//   await Location.startLocationUpdatesAsync(LOCATION_TASK, TRACKING_OPTIONS);
//   return true;
// }

// // ─── START BACKGROUND TRACKING ───────────────────────────────────────────────
// export const startBackgroundTracking = async (userId: string) => {
//   try {
//     await AsyncStorage.setItem("CURRENT_USER_ID", userId);
//     await AsyncStorage.multiRemove(["GEOFENCE_BREACHED", "LEFT_HOME"]);

//     // BUG FIX: Don't stop and restart if already registered.
//     // Stopping the task resets Android's job scheduler — it then waits for
//     // the next Doze maintenance window (10-30 min) before firing again.
//     // If already running, leave it alone and just update the userId.
//     const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
//     if (isRegistered) {
//       console.log("✅ Task already running — skipping re-registration");
//       return;
//     }

//     console.log("🚀 Starting background tracking for user:", userId);
//     const started = await _startLocationUpdates(userId);
//     if (started) {
//       console.log("✅ Background tracking started for user:", userId);
//     }
//   } catch (err) {
//     console.log("❌ Start tracking error:", err);
//   }
// };

// // ─── STOP BACKGROUND TRACKING ────────────────────────────────────────────────
// export const stopBackgroundTracking = async () => {
//   try {
//     const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
//     if (!started) {
//       console.log("ℹ️ Background tracking already stopped");
//       return;
//     }
//     await Location.stopLocationUpdatesAsync(LOCATION_TASK);
//     console.log("🛑 Background tracking stopped");
//   } catch (err) {
//     console.log("❌ Stop tracking error:", err);
//   }
// };

// // ─── FORCE RESTART ────────────────────────────────────────────────────────────
// // Use this only when you genuinely need to reset everything (e.g. user changes,
// // permissions revoked). This intentionally stops and restarts the task.
// export const forceRestartTracking = async (userId: string) => {
//   console.log("🔄 Force restarting background tracking...");

//   await stopBackgroundTracking();

//   await AsyncStorage.multiRemove([
//     "GEOFENCE_BREACHED",
//     "LEFT_HOME",
//     "LAST_SAVED_AT",
//     "CACHED_SAFE_ZONES",
//     "CACHED_ZONES_AT",
//     "CACHED_HOME_LOCATION",
//     "CACHED_HOME_AT",
//     "ZONE_ALERT_LAST_SENT",
//     "HOME_ALERT_LAST_SENT",
//   ]);

//   await new Promise((res) => setTimeout(res, 1000));
//   await AsyncStorage.setItem("CURRENT_USER_ID", userId);

//   const started = await _startLocationUpdates(userId);
//   if (started) {
//     console.log("✅ Background tracking force restarted for user:", userId);
//   } else {
//     console.log("❌ Force restart failed — permissions not granted");
//   }
// };

// // ─── INVALIDATE CACHE ─────────────────────────────────────────────────────────
// export const invalidateLocationCache = async () => {
//   await AsyncStorage.multiRemove([
//     "CACHED_SAFE_ZONES",
//     "CACHED_ZONES_AT",
//     "CACHED_HOME_LOCATION",
//     "CACHED_HOME_AT",
//   ]);
//   console.log("🗑️ Location cache invalidated");
// };









// import * as TaskManager from "expo-task-manager";
// import * as Location from "expo-location";
// import * as Notifications from "expo-notifications";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { supabase } from "@/supabase/supabase";
// import {
//   getPushTokenForUser,
//   sendExpoPushNotification,
// } from "@/services/pushToken";

// // ─── Constants ────────────────────────────────────────────────────────────────
// export const LOCATION_TASK = "help-app-background-location";
// const HOME_RADIUS_METERS = 50;
// const CACHE_TTL_MS = 10 * 60 * 1000;       // 10 minutes
// const SAVE_THROTTLE_MS = 2 * 60 * 1000;    // save location every 2 min max
// const PERMISSION_TIMEOUT_MS = 10000;
// const NOTIFICATION_COOLDOWN_MS = 10 * 60 * 1000; // 10 min between repeat alerts

// // ─── Error logging helper ─────────────────────────────────────────────────────
// // A generic `console.log("X error:", err)` often prints "[object Object]" or
// // swallows the actual message/stack for non-Error throwables (e.g. Supabase's
// // PostgrestError). This normalizes every error path so you always get a
// // readable message + stack, and can grep logs for "❌" to find every failure.
// function logErr(label: string, err: unknown) {
//   if (err instanceof Error) {
//     console.log(`❌ ${label}:`, err.message);
//     if (err.stack) console.log(`   stack:`, err.stack);
//   } else if (err && typeof err === "object") {
//     try {
//       console.log(`❌ ${label}:`, JSON.stringify(err));
//     } catch {
//       console.log(`❌ ${label}: [unserializable error object]`, err);
//     }
//   } else {
//     console.log(`❌ ${label}:`, String(err));
//   }
// }

// // ─── Global uncaught error safety net ────────────────────────────────────────
// // Catches JS errors/rejections that occur outside any try/catch — e.g. a bug
// // inside a library, or an error thrown synchronously before we ever get a
// // chance to log it ourselves. Without this, such errors can crash silently
// // (especially in a background/headless JS context with no visible UI).
// (function installGlobalErrorHandlers() {
//   const g = global as any;

//   if (g.ErrorUtils?.setGlobalHandler) {
//     const previousHandler = g.ErrorUtils.getGlobalHandler?.();
//     g.ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
//       console.log(
//         `🔥 GLOBAL UNCAUGHT ${isFatal ? "FATAL" : "NON-FATAL"} ERROR:`,
//         error?.message ?? String(error)
//       );
//       if (error?.stack) console.log("   stack:", error.stack);
//       previousHandler?.(error, isFatal);
//     });
//     console.log("🛡️ Global error handler installed");
//   } else {
//     console.log("⚠️ ErrorUtils not available — global handler not installed");
//   }

//   // Hermes/RN promise rejection tracking (available when the RN promise
//   // polyfill's rejection-tracking is active). Wrapped in try/catch because
//   // its availability varies by RN/Hermes version.
//   try {
//     const rejectionTracking = require("promise/setimmediate/rejection-tracking");
//     rejectionTracking.enable({
//       allRejections: true,
//       onUnhandled: (id: number, error: any) => {
//         console.log("🔥 UNHANDLED PROMISE REJECTION:", error?.message ?? String(error));
//         if (error?.stack) console.log("   stack:", error.stack);
//       },
//       onHandled: () => {},
//     });
//     console.log("🛡️ Unhandled promise rejection tracking enabled");
//   } catch (err) {
//     console.log("⚠️ Promise rejection tracking unavailable:", String(err));
//   }
// })();

// // ─── Timeout wrapper (core fix for the "stops after ~1hr" bug) ───────────────
// // Under Android Doze, AsyncStorage and network calls inside a background task
// // can stall indefinitely. If the task's promise never resolves, Android
// // decides the app is misbehaving and kills the process — location then never
// // updates again. Every async op in the task MUST be wrapped so the task
// // always completes, even if a step fails or hangs.
// function withTimeout<T>(
//   promise: Promise<T>,
//   ms: number,
//   fallback: T,
//   label: string
// ): Promise<T> {
//   return Promise.race([
//     promise.catch((err) => {
//       logErr(`${label} threw before timeout`, err);
//       return fallback;
//     }),
//     new Promise<T>((resolve) => {
//       setTimeout(() => {
//         console.log(`⏱️ Timeout hit for: ${label} — using fallback`);
//         resolve(fallback);
//       }, ms);
//     }),
//   ]);
// }

// // ─── Notification handler ─────────────────────────────────────────────────────
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowBanner: true,
//     shouldShowList: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });

// export const requestNotificationPermissions = async () => {
//   console.log("▶️ requestNotificationPermissions: start");
//   try {
//     const { status } = await Notifications.requestPermissionsAsync();
//     console.log(
//       status === "granted"
//         ? "✅ Notification permission granted"
//         : `❌ Notification permission denied (status: ${status})`
//     );
//   } catch (err) {
//     logErr("Notification permission error", err);
//   }
// };

// async function sendLocalNotification(title: string, body: string) {
//   console.log("▶️ sendLocalNotification:", title);
//   try {
//     await Notifications.scheduleNotificationAsync({
//       content: {
//         title,
//         body,
//         sound: true,
//         priority: Notifications.AndroidNotificationPriority.MAX,
//       },
//       trigger: null,
//     });
//     console.log("✅ sendLocalNotification: scheduled");
//   } catch (err) {
//     logErr("sendLocalNotification error", err);
//   }
// }

// async function notifyGuardian(userId: string, title: string, body: string) {
//   console.log("▶️ notifyGuardian: start for user", userId);
//   try {
//     const { data: links, error } = await supabase
//       .from("help_app_guardian_links")
//       .select("guardian_id")
//       .eq("user_id", userId)
//       .eq("status", "approved");

//     if (error) {
//       logErr("notifyGuardian query error", error);
//       return;
//     }
//     if (!links || links.length === 0) {
//       console.log("⚠️ No approved guardian for user:", userId);
//       return;
//     }

//     for (const link of links) {
//       const guardianToken = await getPushTokenForUser(link.guardian_id);
//       if (!guardianToken) {
//         console.log("⚠️ No push token for guardian:", link.guardian_id);
//         continue;
//       }
//       await sendExpoPushNotification(guardianToken, title, body);
//       console.log("✅ Guardian notified:", link.guardian_id);
//     }
//   } catch (err) {
//     logErr("notifyGuardian error", err);
//   }
// }

// async function insertAlert(userId: string, alertType: string, message: string) {
//   console.log("▶️ insertAlert:", alertType);
//   try {
//     const { error } = await supabase.from("help_app_alerts").insert({
//       user_id: userId,
//       alert_type: alertType,
//       message,
//       created_at: new Date().toISOString(),
//     });
//     if (error) {
//       logErr("insertAlert DB error", error);
//       return;
//     }
//     console.log("✅ insertAlert: inserted");
//   } catch (err) {
//     logErr("insertAlert error", err);
//   }
// }

// function getDistanceInMeters(
//   lat1: number,
//   lon1: number,
//   lat2: number,
//   lon2: number
// ) {
//   const R = 6371000;
//   const dLat = ((lat2 - lat1) * Math.PI) / 180;
//   const dLon = ((lon2 - lon1) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos((lat1 * Math.PI) / 180) *
//       Math.cos((lat2 * Math.PI) / 180) *
//       Math.sin(dLon / 2) *
//       Math.sin(dLon / 2);
//   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// }

// async function loadSafeZones(userId: string) {
//   console.log("▶️ loadSafeZones: querying DB for", userId);
//   try {
//     const { data, error } = await supabase
//       .from("help_app_safe_zones")
//       .select("center_lat, center_lng, radius_meters")
//       .eq("user_id", userId)
//       .eq("active", true);
//     if (error) {
//       logErr("loadSafeZones query error", error);
//       return [];
//     }
//     console.log("✅ loadSafeZones: got", data?.length ?? 0, "zones");
//     return data || [];
//   } catch (err) {
//     logErr("loadSafeZones error", err);
//     return [];
//   }
// }

// async function loadHomeLocation(userId: string) {
//   console.log("▶️ loadHomeLocation: querying DB for", userId);
//   try {
//     const { data, error } = await supabase
//       .from("help_app_user_locations")
//       .select("lat, lng")
//       .eq("user_id", userId)
//       .eq("is_home", true)
//       .maybeSingle();
//     if (error) {
//       logErr("loadHomeLocation query error", error);
//       return null;
//     }
//     if (!data) {
//       console.log("⚠️ loadHomeLocation: no home location set");
//       return null;
//     }
//     console.log("✅ loadHomeLocation: found home location");
//     return { latitude: Number(data.lat), longitude: Number(data.lng) };
//   } catch (err) {
//     logErr("loadHomeLocation error", err);
//     return null;
//   }
// }

// async function getCachedSafeZones(userId: string) {
//   try {
//     const cached = await AsyncStorage.getItem("CACHED_SAFE_ZONES");
//     const cachedAt = Number(
//       (await AsyncStorage.getItem("CACHED_ZONES_AT")) ?? 0
//     );
//     if (cached && Date.now() - cachedAt < CACHE_TTL_MS) {
//       return JSON.parse(cached);
//     }
//     const fresh = await loadSafeZones(userId);
//     await AsyncStorage.setItem("CACHED_SAFE_ZONES", JSON.stringify(fresh));
//     await AsyncStorage.setItem("CACHED_ZONES_AT", String(Date.now()));
//     return fresh;
//   } catch (err) {
//     logErr("getCachedSafeZones error", err);
//     return [];
//   }
// }

// async function getCachedHomeLocation(userId: string) {
//   try {
//     const cached = await AsyncStorage.getItem("CACHED_HOME_LOCATION");
//     const cachedAt = Number(
//       (await AsyncStorage.getItem("CACHED_HOME_AT")) ?? 0
//     );
//     if (cached && Date.now() - cachedAt < CACHE_TTL_MS) {
//       return JSON.parse(cached);
//     }
//     const fresh = await loadHomeLocation(userId);
//     if (fresh) {
//       await AsyncStorage.setItem(
//         "CACHED_HOME_LOCATION",
//         JSON.stringify(fresh)
//       );
//       await AsyncStorage.setItem("CACHED_HOME_AT", String(Date.now()));
//     }
//     return fresh;
//   } catch (err) {
//     logErr("getCachedHomeLocation error", err);
//     return null;
//   }
// }

// async function saveLocationToSupabase(
//   userId: string,
//   latitude: number,
//   longitude: number
// ) {
//   console.log("▶️ saveLocationToSupabase: start");
//   try {
//     const lastSaved = Number(
//       (await AsyncStorage.getItem("LAST_SAVED_AT")) ?? 0
//     );
//     if (Date.now() - lastSaved < SAVE_THROTTLE_MS) {
//       console.log("⏩ Location save throttled — skipping");
//       return;
//     }

//     const { error } = await supabase.from("help_app_user_locations").insert({
//       user_id: userId,
//       lat: latitude,
//       lng: longitude,
//       is_home: false,
//       recorded_at: new Date().toISOString(),
//     });

//     if (error) {
//       logErr("saveLocationToSupabase insert error", error);
//       return;
//     }

//     await AsyncStorage.setItem("LAST_SAVED_AT", String(Date.now()));
//     console.log("💾 Location inserted:", latitude, longitude);
//   } catch (err) {
//     logErr("saveLocationToSupabase error", err);
//   }
// }

// async function isCoolingDown(key: string): Promise<boolean> {
//   try {
//     const lastSent = Number((await AsyncStorage.getItem(key)) ?? 0);
//     return Date.now() - lastSent < NOTIFICATION_COOLDOWN_MS;
//   } catch (err) {
//     logErr(`isCoolingDown error (${key})`, err);
//     return false;
//   }
// }

// async function markNotificationSent(key: string) {
//   try {
//     await AsyncStorage.setItem(key, String(Date.now()));
//   } catch (err) {
//     logErr(`markNotificationSent error (${key})`, err);
//   }
// }

// // ─── BACKGROUND TASK ─────────────────────────────────────────────────────────
// // Every await here is wrapped in withTimeout so the task ALWAYS resolves,
// // even if network/storage stalls under Doze. Every branch — including ones
// // that used to return silently — now logs, so "task didn't fire" and
// // "task fired but got empty/errored data" are never indistinguishable again.
// TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
//   console.log("🔔 Task callback invoked:", new Date().toISOString());

//   try {
//     if (error) {
//       logErr("Background Task Error (from TaskManager)", error);
//       return;
//     }
//     if (!data) {
//       console.log("⚠️ Task invoked with no data payload — skipping");
//       return;
//     }

//     const { locations } = data as any;
//     console.log("📦 Locations array length:", locations?.length ?? 0);

//     const location = locations?.[0];
//     if (!location) {
//       console.log("⚠️ Task invoked but locations array was empty — skipping");
//       return;
//     }

//     const { latitude, longitude } = location.coords;
//     console.log("🟢 BACKGROUND TASK TRIGGERED:", new Date().toISOString());
//     console.log("📍 Coords:", latitude, longitude);

//     await AsyncStorage.setItem(
//       "LAST_LOCATION",
//       JSON.stringify({
//         latitude,
//         longitude,
//         timestamp: new Date().toISOString(),
//       })
//     );
//     console.log("💾 LAST_LOCATION written to AsyncStorage");

//     const userId = await AsyncStorage.getItem("CURRENT_USER_ID");
//     if (!userId) {
//       console.log("⚠️ No userId in background task — skipping");
//       return;
//     }
//     console.log("👤 userId:", userId);

//     console.log("⏳ Loading zones + home (with timeout guards)...");
//     const [safeZones, homeLocation] = await Promise.all([
//       withTimeout(getCachedSafeZones(userId), 5000, [], "safeZones"),
//       withTimeout(getCachedHomeLocation(userId), 5000, null, "homeLocation"),
//     ]);
//     console.log(
//       "✅ Zones loaded:", safeZones.length,
//       "| home set:", !!homeLocation
//     );

//     await withTimeout(
//       saveLocationToSupabase(userId, latitude, longitude),
//       8000,
//       undefined,
//       "saveLocation"
//     );

//     // ── Safe zone check ───────────────────────────────────────────────────────
//     if (safeZones.length > 0) {
//       const insideAnyZone = safeZones.some(
//         (zone: any) =>
//           getDistanceInMeters(
//             latitude,
//             longitude,
//             zone.center_lat,
//             zone.center_lng
//           ) <= zone.radius_meters
//       );

//       const alreadyBreached = await AsyncStorage.getItem("GEOFENCE_BREACHED");

//       if (!insideAnyZone && !alreadyBreached) {
//         const coolingDown = await isCoolingDown("ZONE_ALERT_LAST_SENT");
//         if (!coolingDown) {
//           console.log("🚨 Safe zone breach detected — notifying");
//           await AsyncStorage.setItem("GEOFENCE_BREACHED", "true");
//           const title = "🚨 Safe Zone Alert";
//           const userBody = "You have crossed outside the safe zone!";
//           const guardianBody = "Your linked user has crossed outside the safe zone!";
//           await sendLocalNotification(title, userBody);
//           await notifyGuardian(userId, title, guardianBody);
//           await insertAlert(userId, "zone_exit", guardianBody);
//           await markNotificationSent("ZONE_ALERT_LAST_SENT");
//         } else {
//           console.log("⏩ Zone alert cooling down — skipping notification");
//         }
//       } else if (insideAnyZone && alreadyBreached) {
//         await AsyncStorage.removeItem("GEOFENCE_BREACHED");
//         console.log("✅ User returned inside safe zone");
//       }
//     }

//     // ── Home check ────────────────────────────────────────────────────────────
//     if (homeLocation) {
//       const distFromHome = getDistanceInMeters(
//         latitude,
//         longitude,
//         homeLocation.latitude,
//         homeLocation.longitude
//       );

//       const alreadyLeftHome = await AsyncStorage.getItem("LEFT_HOME");

//       if (distFromHome > HOME_RADIUS_METERS && !alreadyLeftHome) {
//         const coolingDown = await isCoolingDown("HOME_ALERT_LAST_SENT");
//         if (!coolingDown) {
//           console.log("🏠 Left-home detected — notifying");
//           await AsyncStorage.setItem("LEFT_HOME", "true");
//           const title = "🏠 User Left Home";
//           const userBody = "You have left the home area.";
//           const guardianBody = "Your linked user has left the home area.";
//           await sendLocalNotification(title, userBody);
//           await notifyGuardian(userId, title, guardianBody);
//           await insertAlert(userId, "zone_exit", `${guardianBody} (home)`);
//           await markNotificationSent("HOME_ALERT_LAST_SENT");
//         } else {
//           console.log("⏩ Home alert cooling down — skipping notification");
//         }
//       } else if (distFromHome <= HOME_RADIUS_METERS && alreadyLeftHome) {
//         await AsyncStorage.removeItem("LEFT_HOME");
//         console.log("✅ User returned home");
//       }
//     }

//     console.log("✅ Background task completed");
//   } catch (err) {
//     // Catches anything not already caught inside the helper functions above —
//     // e.g. a synchronous throw, a JSON.parse failure, or an unexpected shape
//     // in `data`. Without this outer catch, such an error would previously
//     // have crashed the task with zero explanation in the logs.
//     logErr("Background task error (outer catch)", err);
//   }
// });

// async function requestPermissionWithTimeout(
//   requestFn: () => Promise<{ status: string }>,
//   label: string,
//   timeoutMs = PERMISSION_TIMEOUT_MS
// ): Promise<boolean> {
//   console.log(`▶️ requestPermissionWithTimeout: ${label}`);
//   return new Promise((resolve) => {
//     const timer = setTimeout(() => {
//       console.log(`⏱️ ${label} permission timed out after ${timeoutMs}ms`);
//       resolve(false);
//     }, timeoutMs);
//     requestFn()
//       .then(({ status }) => {
//         clearTimeout(timer);
//         console.log(`${status === "granted" ? "✅" : "❌"} ${label} permission status:`, status);
//         resolve(status === "granted");
//       })
//       .catch((err) => {
//         clearTimeout(timer);
//         logErr(`${label} permission error`, err);
//         resolve(false);
//       });
//   });
// }

// const TRACKING_OPTIONS: Location.LocationTaskOptions = {
//   accuracy: Location.Accuracy.Balanced,
//   timeInterval: 10000,
//   distanceInterval: 10,
//   showsBackgroundLocationIndicator: true,
//   foregroundService: {
//     notificationTitle: "Safety Monitoring Active",
//     notificationBody: "Your location is monitored for safety.",
//   },
// };

// async function _startLocationUpdates(userId: string): Promise<boolean> {
//   console.log("▶️ _startLocationUpdates: start for", userId);

//   const fgGranted = await requestPermissionWithTimeout(
//     () => Location.requestForegroundPermissionsAsync(),
//     "Foreground location"
//   );
//   if (!fgGranted) {
//     console.log("❌ _startLocationUpdates: aborting — foreground permission not granted");
//     return false;
//   }

//   const bgGranted = await requestPermissionWithTimeout(
//     () => Location.requestBackgroundPermissionsAsync(),
//     "Background location"
//   );
//   if (!bgGranted) {
//     console.log("❌ _startLocationUpdates: aborting — background permission not granted");
//     return false;
//   }

//   await requestNotificationPermissions();

//   try {
//     const { saveExpoPushToken } = await import("@/services/pushToken");
//     await saveExpoPushToken();
//     console.log("✅ _startLocationUpdates: push token saved");
//   } catch (err) {
//     logErr("_startLocationUpdates: saveExpoPushToken error", err);
//     // Non-fatal — continue starting location updates regardless
//   }

//   try {
//     await Promise.all([
//       getCachedSafeZones(userId),
//       getCachedHomeLocation(userId),
//     ]);
//     console.log("✅ _startLocationUpdates: initial cache warm-up done");
//   } catch (err) {
//     logErr("_startLocationUpdates: cache warm-up error", err);
//     // Non-fatal — the task will retry these itself on first fire
//   }

//   try {
//     console.log("▶️ Calling Location.startLocationUpdatesAsync...");
//     await Location.startLocationUpdatesAsync(LOCATION_TASK, TRACKING_OPTIONS);
//     console.log("✅ Location.startLocationUpdatesAsync succeeded");
//   } catch (err) {
//     logErr("Location.startLocationUpdatesAsync FAILED", err);
//     return false;
//   }

//   return true;
// }

// // ─── START BACKGROUND TRACKING ───────────────────────────────────────────────
// export const startBackgroundTracking = async (userId: string) => {
//   console.log("▶️ startBackgroundTracking: called for", userId);
//   try {
//     await AsyncStorage.setItem("CURRENT_USER_ID", userId);
//     await AsyncStorage.multiRemove(["GEOFENCE_BREACHED", "LEFT_HOME"]);

//     // Do NOT stop+restart if already registered. Stopping resets Android's
//     // job scheduler, which then waits for the next Doze maintenance window
//     // before firing again.
//     const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
//     if (isRegistered) {
//       console.log("✅ Task already running — skipping re-registration");
//       return;
//     }

//     const started = await _startLocationUpdates(userId);
//     console.log(
//       started
//         ? `✅ Background tracking started for user: ${userId}`
//         : `❌ Background tracking FAILED to start for user: ${userId}`
//     );
//   } catch (err) {
//     logErr("startBackgroundTracking error", err);
//   }
// };

// export const stopBackgroundTracking = async () => {
//   console.log("▶️ stopBackgroundTracking: called");
//   try {
//     const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
//     if (!started) {
//       console.log("ℹ️ Background tracking already stopped");
//       return;
//     }
//     await Location.stopLocationUpdatesAsync(LOCATION_TASK);
//     console.log("🛑 Background tracking stopped");
//   } catch (err) {
//     logErr("stopBackgroundTracking error", err);
//   }
// };

// // Use only when you genuinely need to reset everything (user change, revoked perms).
// export const forceRestartTracking = async (userId: string) => {
//   console.log("🔄 forceRestartTracking: called for", userId);
//   await stopBackgroundTracking();

//   await AsyncStorage.multiRemove([
//     "GEOFENCE_BREACHED",
//     "LEFT_HOME",
//     "LAST_SAVED_AT",
//     "CACHED_SAFE_ZONES",
//     "CACHED_ZONES_AT",
//     "CACHED_HOME_LOCATION",
//     "CACHED_HOME_AT",
//     "ZONE_ALERT_LAST_SENT",
//     "HOME_ALERT_LAST_SENT",
//   ]);

//   await new Promise((res) => setTimeout(res, 1000));
//   await AsyncStorage.setItem("CURRENT_USER_ID", userId);

//   const started = await _startLocationUpdates(userId);
//   console.log(
//     started
//       ? `✅ Background tracking force restarted for user: ${userId}`
//       : "❌ Force restart failed — see logs above for the specific step that failed"
//   );
// };

// export const invalidateLocationCache = async () => {
//   console.log("▶️ invalidateLocationCache: called");
//   try {
//     await AsyncStorage.multiRemove([
//       "CACHED_SAFE_ZONES",
//       "CACHED_ZONES_AT",
//       "CACHED_HOME_LOCATION",
//       "CACHED_HOME_AT",
//     ]);
//     console.log("🗑️ Location cache invalidated");
//   } catch (err) {
//     logErr("invalidateLocationCache error", err);
//   }
// };

// // ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
// // `isTaskRegisteredAsync` only tells you the task is registered with the OS —
// // it does NOT tell you it's still actually delivering updates. If the
// // foreground service gets force-killed (OEM battery manager, Doze edge case,
// // etc.) the registration can survive while updates silently stop forever.
// // This checks how long it's actually been since a real location was written,
// // and force-restarts only if it's gone stale — so a healthy task is never
// // disrupted, but a dead one gets revived.
// const STALE_THRESHOLD_MS = 15 * 60 * 1000; // ~3x the 10s/10m expected cadence, tune as needed

// export const ensureTrackingHealthy = async (userId: string) => {
//   console.log("▶️ ensureTrackingHealthy: checking for", userId);
//   try {
//     const lastLocationRaw = await AsyncStorage.getItem("LAST_LOCATION");
//     const lastLocation = lastLocationRaw ? JSON.parse(lastLocationRaw) : null;
//     const lastTimestamp = lastLocation
//       ? new Date(lastLocation.timestamp).getTime()
//       : 0;
//     const staleness = Date.now() - lastTimestamp;

//     const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
//     console.log("   isRegistered:", isRegistered, "| staleness (s):", Math.round(staleness / 1000));

//     if (!isRegistered) {
//       console.log("⚠️ Task not registered — starting fresh");
//       await startBackgroundTracking(userId);
//       return;
//     }

//     if (!lastTimestamp || staleness > STALE_THRESHOLD_MS) {
//       console.log(
//         `⚠️ Tracking stale (${Math.round(staleness / 1000)}s since last update) — force restarting`
//       );
//       await forceRestartTracking(userId);
//       return;
//     }

//     console.log(
//       `✅ Tracking healthy — last update ${Math.round(staleness / 1000)}s ago`
//     );
//   } catch (err) {
//     logErr("ensureTrackingHealthy error", err);
//   }
// };











// import * as TaskManager from "expo-task-manager";
// import * as Location from "expo-location";
// import * as Notifications from "expo-notifications";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { supabase } from "@/supabase/supabase";
// import {
//   getPushTokenForUser,
//   sendExpoPushNotification,
// } from "@/services/pushToken";

// // ─── Constants ────────────────────────────────────────────────────────────────
// export const LOCATION_TASK = "help-app-background-location";
// const HOME_RADIUS_METERS = 50;
// const CACHE_TTL_MS = 10 * 60 * 1000;       // 10 minutes
// const SAVE_THROTTLE_MS = 2 * 60 * 1000;    // save location every 2 min max
// const PERMISSION_TIMEOUT_MS = 10000;
// const NOTIFICATION_COOLDOWN_MS = 10 * 60 * 1000; // 10 min between repeat alerts

// // ─── Error logging helper ─────────────────────────────────────────────────────
// // A generic `console.log("X error:", err)` often prints "[object Object]" or
// // swallows the actual message/stack for non-Error throwables (e.g. Supabase's
// // PostgrestError). This normalizes every error path so you always get a
// // readable message + stack, and can grep logs for "❌" to find every failure.
// function logErr(label: string, err: unknown) {
//   if (err instanceof Error) {
//     console.log(`❌ ${label}:`, err.message);
//     if (err.stack) console.log(`   stack:`, err.stack);
//   } else if (err && typeof err === "object") {
//     try {
//       console.log(`❌ ${label}:`, JSON.stringify(err));
//     } catch {
//       console.log(`❌ ${label}: [unserializable error object]`, err);
//     }
//   } else {
//     console.log(`❌ ${label}:`, String(err));
//   }
// }

// // ─── Global uncaught error safety net ────────────────────────────────────────
// // Catches JS errors/rejections that occur outside any try/catch — e.g. a bug
// // inside a library, or an error thrown synchronously before we ever get a
// // chance to log it ourselves. Without this, such errors can crash silently
// // (especially in a background/headless JS context with no visible UI).
// (function installGlobalErrorHandlers() {
//   const g = global as any;

//   if (g.ErrorUtils?.setGlobalHandler) {
//     const previousHandler = g.ErrorUtils.getGlobalHandler?.();
//     g.ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
//       console.log(
//         `🔥 GLOBAL UNCAUGHT ${isFatal ? "FATAL" : "NON-FATAL"} ERROR:`,
//         error?.message ?? String(error)
//       );
//       if (error?.stack) console.log("   stack:", error.stack);
//       previousHandler?.(error, isFatal);
//     });
//     console.log("🛡️ Global error handler installed");
//   } else {
//     console.log("⚠️ ErrorUtils not available — global handler not installed");
//   }

//   // Hermes/RN promise rejection tracking (available when the RN promise
//   // polyfill's rejection-tracking is active). Wrapped in try/catch because
//   // its availability varies by RN/Hermes version.
//   try {
//     const rejectionTracking = require("promise/setimmediate/rejection-tracking");
//     rejectionTracking.enable({
//       allRejections: true,
//       onUnhandled: (id: number, error: any) => {
//         console.log("🔥 UNHANDLED PROMISE REJECTION:", error?.message ?? String(error));
//         if (error?.stack) console.log("   stack:", error.stack);
//       },
//       onHandled: () => {},
//     });
//     console.log("🛡️ Unhandled promise rejection tracking enabled");
//   } catch (err) {
//     console.log("⚠️ Promise rejection tracking unavailable:", String(err));
//   }
// })();

// // ─── Timeout wrapper (core fix for the "stops after ~1hr" bug) ───────────────
// // Under Android Doze, AsyncStorage and network calls inside a background task
// // can stall indefinitely. If the task's promise never resolves, Android
// // decides the app is misbehaving and kills the process — location then never
// // updates again. Every async op in the task MUST be wrapped so the task
// // always completes, even if a step fails or hangs.
// function withTimeout<T>(
//   promise: Promise<T>,
//   ms: number,
//   fallback: T,
//   label: string
// ): Promise<T> {
//   return Promise.race([
//     promise.catch((err) => {
//       logErr(`${label} threw before timeout`, err);
//       return fallback;
//     }),
//     new Promise<T>((resolve) => {
//       setTimeout(() => {
//         console.log(`⏱️ Timeout hit for: ${label} — using fallback`);
//         resolve(fallback);
//       }, ms);
//     }),
//   ]);
// }

// // ─── Notification handler ─────────────────────────────────────────────────────
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowBanner: true,
//     shouldShowList: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });

// export const requestNotificationPermissions = async () => {
//   console.log("▶️ requestNotificationPermissions: start");
//   try {
//     const { status } = await Notifications.requestPermissionsAsync();
//     console.log(
//       status === "granted"
//         ? "✅ Notification permission granted"
//         : `❌ Notification permission denied (status: ${status})`
//     );
//   } catch (err) {
//     logErr("Notification permission error", err);
//   }
// };

// async function sendLocalNotification(title: string, body: string) {
//   console.log("▶️ sendLocalNotification:", title);
//   try {
//     await Notifications.scheduleNotificationAsync({
//       content: {
//         title,
//         body,
//         sound: true,
//         priority: Notifications.AndroidNotificationPriority.MAX,
//       },
//       trigger: null,
//     });
//     console.log("✅ sendLocalNotification: scheduled");
//   } catch (err) {
//     logErr("sendLocalNotification error", err);
//   }
// }

// async function notifyGuardian(userId: string, title: string, body: string) {
//   console.log("▶️ notifyGuardian: start for user", userId);
//   try {
//     const { data: links, error } = await supabase
//       .from("help_app_guardian_links")
//       .select("guardian_id")
//       .eq("user_id", userId)
//       .eq("status", "approved");

//     if (error) {
//       logErr("notifyGuardian query error", error);
//       return;
//     }
//     if (!links || links.length === 0) {
//       console.log("⚠️ No approved guardian for user:", userId);
//       return;
//     }

//     for (const link of links) {
//       const guardianToken = await getPushTokenForUser(link.guardian_id);
//       if (!guardianToken) {
//         console.log("⚠️ No push token for guardian:", link.guardian_id);
//         continue;
//       }
//       await sendExpoPushNotification(guardianToken, title, body);
//       console.log("✅ Guardian notified:", link.guardian_id);
//     }
//   } catch (err) {
//     logErr("notifyGuardian error", err);
//   }
// }

// async function insertAlert(userId: string, alertType: string, message: string) {
//   console.log("▶️ insertAlert:", alertType);
//   try {
//     const { error } = await supabase.from("help_app_alerts").insert({
//       user_id: userId,
//       alert_type: alertType,
//       message,
//       created_at: new Date().toISOString(),
//     });
//     if (error) {
//       logErr("insertAlert DB error", error);
//       return;
//     }
//     console.log("✅ insertAlert: inserted");
//   } catch (err) {
//     logErr("insertAlert error", err);
//   }
// }

// function getDistanceInMeters(
//   lat1: number,
//   lon1: number,
//   lat2: number,
//   lon2: number
// ) {
//   const R = 6371000;
//   const dLat = ((lat2 - lat1) * Math.PI) / 180;
//   const dLon = ((lon2 - lon1) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos((lat1 * Math.PI) / 180) *
//       Math.cos((lat2 * Math.PI) / 180) *
//       Math.sin(dLon / 2) *
//       Math.sin(dLon / 2);
//   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// }

// async function loadSafeZones(userId: string) {
//   console.log("▶️ loadSafeZones: querying DB for", userId);
//   try {
//     const { data, error } = await supabase
//       .from("help_app_safe_zones")
//       .select("center_lat, center_lng, radius_meters")
//       .eq("user_id", userId)
//       .eq("active", true);
//     if (error) {
//       logErr("loadSafeZones query error", error);
//       return [];
//     }
//     console.log("✅ loadSafeZones: got", data?.length ?? 0, "zones");
//     return data || [];
//   } catch (err) {
//     logErr("loadSafeZones error", err);
//     return [];
//   }
// }

// async function loadHomeLocation(userId: string) {
//   console.log("▶️ loadHomeLocation: querying DB for", userId);
//   try {
//     const { data, error } = await supabase
//       .from("help_app_user_locations")
//       .select("lat, lng")
//       .eq("user_id", userId)
//       .eq("is_home", true)
//       .maybeSingle();
//     if (error) {
//       logErr("loadHomeLocation query error", error);
//       return null;
//     }
//     if (!data) {
//       console.log("⚠️ loadHomeLocation: no home location set");
//       return null;
//     }
//     console.log("✅ loadHomeLocation: found home location");
//     return { latitude: Number(data.lat), longitude: Number(data.lng) };
//   } catch (err) {
//     logErr("loadHomeLocation error", err);
//     return null;
//   }
// }

// async function getCachedSafeZones(userId: string) {
//   try {
//     const cached = await AsyncStorage.getItem("CACHED_SAFE_ZONES");
//     const cachedAt = Number(
//       (await AsyncStorage.getItem("CACHED_ZONES_AT")) ?? 0
//     );
//     if (cached && Date.now() - cachedAt < CACHE_TTL_MS) {
//       return JSON.parse(cached);
//     }
//     const fresh = await loadSafeZones(userId);
//     await AsyncStorage.setItem("CACHED_SAFE_ZONES", JSON.stringify(fresh));
//     await AsyncStorage.setItem("CACHED_ZONES_AT", String(Date.now()));
//     return fresh;
//   } catch (err) {
//     logErr("getCachedSafeZones error", err);
//     return [];
//   }
// }

// async function getCachedHomeLocation(userId: string) {
//   try {
//     const cached = await AsyncStorage.getItem("CACHED_HOME_LOCATION");
//     const cachedAt = Number(
//       (await AsyncStorage.getItem("CACHED_HOME_AT")) ?? 0
//     );
//     if (cached && Date.now() - cachedAt < CACHE_TTL_MS) {
//       return JSON.parse(cached);
//     }
//     const fresh = await loadHomeLocation(userId);
//     if (fresh) {
//       await AsyncStorage.setItem(
//         "CACHED_HOME_LOCATION",
//         JSON.stringify(fresh)
//       );
//       await AsyncStorage.setItem("CACHED_HOME_AT", String(Date.now()));
//     }
//     return fresh;
//   } catch (err) {
//     logErr("getCachedHomeLocation error", err);
//     return null;
//   }
// }

// async function saveLocationToSupabase(
//   userId: string,
//   latitude: number,
//   longitude: number
// ) {
//   console.log("▶️ saveLocationToSupabase: start");
//   try {
//     const lastSaved = Number(
//       (await AsyncStorage.getItem("LAST_SAVED_AT")) ?? 0
//     );
//     if (Date.now() - lastSaved < SAVE_THROTTLE_MS) {
//       console.log("⏩ Location save throttled — skipping");
//       return;
//     }

//     const { error } = await supabase.from("help_app_user_locations").insert({
//       user_id: userId,
//       lat: latitude,
//       lng: longitude,
//       is_home: false,
//       recorded_at: new Date().toISOString(),
//     });

//     if (error) {
//       logErr("saveLocationToSupabase insert error", error);
//       return;
//     }

//     await AsyncStorage.setItem("LAST_SAVED_AT", String(Date.now()));
//     console.log("💾 Location inserted:", latitude, longitude);
//   } catch (err) {
//     logErr("saveLocationToSupabase error", err);
//   }
// }

// async function isCoolingDown(key: string): Promise<boolean> {
//   try {
//     const lastSent = Number((await AsyncStorage.getItem(key)) ?? 0);
//     return Date.now() - lastSent < NOTIFICATION_COOLDOWN_MS;
//   } catch (err) {
//     logErr(`isCoolingDown error (${key})`, err);
//     return false;
//   }
// }

// async function markNotificationSent(key: string) {
//   try {
//     await AsyncStorage.setItem(key, String(Date.now()));
//   } catch (err) {
//     logErr(`markNotificationSent error (${key})`, err);
//   }
// }

// // ─── BACKGROUND TASK ─────────────────────────────────────────────────────────
// // Every await here is wrapped in withTimeout so the task ALWAYS resolves,
// // even if network/storage stalls under Doze. Every branch — including ones
// // that used to return silently — now logs, so "task didn't fire" and
// // "task fired but got empty/errored data" are never indistinguishable again.
// TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
//   console.log("🔔 Task callback invoked:", new Date().toISOString());

//   try {
//     if (error) {
//       logErr("Background Task Error (from TaskManager)", error);
//       return;
//     }
//     if (!data) {
//       console.log("⚠️ Task invoked with no data payload — skipping");
//       return;
//     }

//     const { locations } = data as any;
//     console.log("📦 Locations array length:", locations?.length ?? 0);

//     const location = locations?.[0];
//     if (!location) {
//       console.log("⚠️ Task invoked but locations array was empty — skipping");
//       return;
//     }

//     const { latitude, longitude } = location.coords;
//     console.log("🟢 BACKGROUND TASK TRIGGERED:", new Date().toISOString());
//     console.log("📍 Coords:", latitude, longitude);

//     await AsyncStorage.setItem(
//       "LAST_LOCATION",
//       JSON.stringify({
//         latitude,
//         longitude,
//         timestamp: new Date().toISOString(),
//       })
//     );
//     console.log("💾 LAST_LOCATION written to AsyncStorage");

//     const userId = await AsyncStorage.getItem("CURRENT_USER_ID");
//     if (!userId) {
//       console.log("⚠️ No userId in background task — skipping");
//       return;
//     }
//     console.log("👤 userId:", userId);

//     console.log("⏳ Loading zones + home (with timeout guards)...");
//     const [safeZones, homeLocation] = await Promise.all([
//       withTimeout(getCachedSafeZones(userId), 5000, [], "safeZones"),
//       withTimeout(getCachedHomeLocation(userId), 5000, null, "homeLocation"),
//     ]);
//     console.log(
//       "✅ Zones loaded:", safeZones.length,
//       "| home set:", !!homeLocation
//     );

//     await withTimeout(
//       saveLocationToSupabase(userId, latitude, longitude),
//       8000,
//       undefined,
//       "saveLocation"
//     );

//     // ── Safe zone check ───────────────────────────────────────────────────────
//     if (safeZones.length > 0) {
//       const insideAnyZone = safeZones.some(
//         (zone: any) =>
//           getDistanceInMeters(
//             latitude,
//             longitude,
//             zone.center_lat,
//             zone.center_lng
//           ) <= zone.radius_meters
//       );

//       const alreadyBreached = await AsyncStorage.getItem("GEOFENCE_BREACHED");

//       if (!insideAnyZone && !alreadyBreached) {
//         const coolingDown = await isCoolingDown("ZONE_ALERT_LAST_SENT");
//         if (!coolingDown) {
//           console.log("🚨 Safe zone breach detected — notifying");
//           await AsyncStorage.setItem("GEOFENCE_BREACHED", "true");
//           const title = "🚨 Safe Zone Alert";
//           const userBody = "You have crossed outside the safe zone!";
//           const guardianBody = "Your linked user has crossed outside the safe zone!";
//           await sendLocalNotification(title, userBody);
//           await notifyGuardian(userId, title, guardianBody);
//           await insertAlert(userId, "zone_exit", guardianBody);
//           await markNotificationSent("ZONE_ALERT_LAST_SENT");
//         } else {
//           console.log("⏩ Zone alert cooling down — skipping notification");
//         }
//       } else if (insideAnyZone && alreadyBreached) {
//         await AsyncStorage.removeItem("GEOFENCE_BREACHED");
//         console.log("✅ User returned inside safe zone");
//       }
//     }

//     // ── Home check ────────────────────────────────────────────────────────────
//     if (homeLocation) {
//       const distFromHome = getDistanceInMeters(
//         latitude,
//         longitude,
//         homeLocation.latitude,
//         homeLocation.longitude
//       );

//       const alreadyLeftHome = await AsyncStorage.getItem("LEFT_HOME");

//       if (distFromHome > HOME_RADIUS_METERS && !alreadyLeftHome) {
//         const coolingDown = await isCoolingDown("HOME_ALERT_LAST_SENT");
//         if (!coolingDown) {
//           console.log("🏠 Left-home detected — notifying");
//           await AsyncStorage.setItem("LEFT_HOME", "true");
//           const title = "🏠 User Left Home";
//           const userBody = "You have left the home area.";
//           const guardianBody = "Your linked user has left the home area.";
//           await sendLocalNotification(title, userBody);
//           await notifyGuardian(userId, title, guardianBody);
//           await insertAlert(userId, "zone_exit", `${guardianBody} (home)`);
//           await markNotificationSent("HOME_ALERT_LAST_SENT");
//         } else {
//           console.log("⏩ Home alert cooling down — skipping notification");
//         }
//       } else if (distFromHome <= HOME_RADIUS_METERS && alreadyLeftHome) {
//         await AsyncStorage.removeItem("LEFT_HOME");
//         console.log("✅ User returned home");
//       }
//     }

//     console.log("✅ Background task completed");
//   } catch (err) {
//     // Catches anything not already caught inside the helper functions above —
//     // e.g. a synchronous throw, a JSON.parse failure, or an unexpected shape
//     // in `data`. Without this outer catch, such an error would previously
//     // have crashed the task with zero explanation in the logs.
//     logErr("Background task error (outer catch)", err);
//   }
// });

// async function requestPermissionWithTimeout(
//   requestFn: () => Promise<{ status: string }>,
//   label: string,
//   timeoutMs = PERMISSION_TIMEOUT_MS
// ): Promise<boolean> {
//   console.log(`▶️ requestPermissionWithTimeout: ${label}`);
//   return new Promise((resolve) => {
//     const timer = setTimeout(() => {
//       console.log(`⏱️ ${label} permission timed out after ${timeoutMs}ms`);
//       resolve(false);
//     }, timeoutMs);
//     requestFn()
//       .then(({ status }) => {
//         clearTimeout(timer);
//         console.log(`${status === "granted" ? "✅" : "❌"} ${label} permission status:`, status);
//         resolve(status === "granted");
//       })
//       .catch((err) => {
//         clearTimeout(timer);
//         logErr(`${label} permission error`, err);
//         resolve(false);
//       });
//   });
// }

// const TRACKING_OPTIONS: Location.LocationTaskOptions = {
//   accuracy: Location.Accuracy.Balanced,
//   timeInterval: 10000,
//   distanceInterval: 10,
//   showsBackgroundLocationIndicator: true,
//   foregroundService: {
//     notificationTitle: "Safety Monitoring Active",
//     notificationBody: "Your location is monitored for safety.",
//   },
// };

// async function _startLocationUpdates(userId: string): Promise<boolean> {
//   console.log("▶️ _startLocationUpdates: start for", userId);

//   const fgGranted = await requestPermissionWithTimeout(
//     () => Location.requestForegroundPermissionsAsync(),
//     "Foreground location"
//   );
//   if (!fgGranted) {
//     console.log("❌ _startLocationUpdates: aborting — foreground permission not granted");
//     return false;
//   }

//   const bgGranted = await requestPermissionWithTimeout(
//     () => Location.requestBackgroundPermissionsAsync(),
//     "Background location"
//   );
//   if (!bgGranted) {
//     console.log("❌ _startLocationUpdates: aborting — background permission not granted");
//     return false;
//   }

//   await requestNotificationPermissions();

//   try {
//     const { saveExpoPushToken } = await import("@/services/pushToken");
//     await saveExpoPushToken();
//     console.log("✅ _startLocationUpdates: push token saved");
//   } catch (err) {
//     logErr("_startLocationUpdates: saveExpoPushToken error", err);
//     // Non-fatal — continue starting location updates regardless
//   }

//   try {
//     await Promise.all([
//       getCachedSafeZones(userId),
//       getCachedHomeLocation(userId),
//     ]);
//     console.log("✅ _startLocationUpdates: initial cache warm-up done");
//   } catch (err) {
//     logErr("_startLocationUpdates: cache warm-up error", err);
//     // Non-fatal — the task will retry these itself on first fire
//   }

//   try {
//     console.log("▶️ Calling Location.startLocationUpdatesAsync...");
//     await Location.startLocationUpdatesAsync(LOCATION_TASK, TRACKING_OPTIONS);
//     console.log("✅ Location.startLocationUpdatesAsync succeeded");
//   } catch (err) {
//     logErr("Location.startLocationUpdatesAsync FAILED", err);
//     return false;
//   }

//   return true;
// }

// // ─── Concurrency guard ────────────────────────────────────────────────────────
// // FIX: Without this, overlapping calls to startBackgroundTracking (e.g. from
// // stacked/duplicate AppState listeners left behind by repeated Fast Refresh
// // reloads during dev testing) all race to check isRegistered, all see false
// // simultaneously (since none of them have finished yet), and all pile on
// // calling native permission/location APIs at once. That flood is what causes
// // otherwise-instant "already granted" permission checks to intermittently
// // hang for the full 10s timeout — the native module gets jammed with
// // concurrent requests. This lock ensures only one start attempt runs at a
// // time; anything that comes in while one is in-flight just skips.
// let startInFlight = false;

// // ─── START BACKGROUND TRACKING ───────────────────────────────────────────────
// export const startBackgroundTracking = async (userId: string) => {
//   if (startInFlight) {
//     console.log("⏩ startBackgroundTracking already in-flight — skipping duplicate call");
//     return;
//   }
//   startInFlight = true;
//   console.log("▶️ startBackgroundTracking: called for", userId);
//   try {
//     await AsyncStorage.setItem("CURRENT_USER_ID", userId);
//     await AsyncStorage.multiRemove(["GEOFENCE_BREACHED", "LEFT_HOME"]);

//     // Do NOT stop+restart if already registered. Stopping resets Android's
//     // job scheduler, which then waits for the next Doze maintenance window
//     // before firing again.
//     const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
//     if (isRegistered) {
//       console.log("✅ Task already running — skipping re-registration");
//       return;
//     }

//     const started = await _startLocationUpdates(userId);
//     console.log(
//       started
//         ? `✅ Background tracking started for user: ${userId}`
//         : `❌ Background tracking FAILED to start for user: ${userId}`
//     );
//   } catch (err) {
//     logErr("startBackgroundTracking error", err);
//   } finally {
//     startInFlight = false;
//   }
// };

// export const stopBackgroundTracking = async () => {
//   console.log("▶️ stopBackgroundTracking: called");
//   try {
//     const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
//     if (!started) {
//       console.log("ℹ️ Background tracking already stopped");
//       return;
//     }
//     await Location.stopLocationUpdatesAsync(LOCATION_TASK);
//     console.log("🛑 Background tracking stopped");
//   } catch (err) {
//     logErr("stopBackgroundTracking error", err);
//   }
// };

// // Use only when you genuinely need to reset everything (user change, revoked perms).
// export const forceRestartTracking = async (userId: string) => {
//   console.log("🔄 forceRestartTracking: called for", userId);
//   await stopBackgroundTracking();

//   await AsyncStorage.multiRemove([
//     "GEOFENCE_BREACHED",
//     "LEFT_HOME",
//     "LAST_SAVED_AT",
//     "CACHED_SAFE_ZONES",
//     "CACHED_ZONES_AT",
//     "CACHED_HOME_LOCATION",
//     "CACHED_HOME_AT",
//     "ZONE_ALERT_LAST_SENT",
//     "HOME_ALERT_LAST_SENT",
//   ]);

//   await new Promise((res) => setTimeout(res, 1000));
//   await AsyncStorage.setItem("CURRENT_USER_ID", userId);

//   const started = await _startLocationUpdates(userId);
//   console.log(
//     started
//       ? `✅ Background tracking force restarted for user: ${userId}`
//       : "❌ Force restart failed — see logs above for the specific step that failed"
//   );
// };

// export const invalidateLocationCache = async () => {
//   console.log("▶️ invalidateLocationCache: called");
//   try {
//     await AsyncStorage.multiRemove([
//       "CACHED_SAFE_ZONES",
//       "CACHED_ZONES_AT",
//       "CACHED_HOME_LOCATION",
//       "CACHED_HOME_AT",
//     ]);
//     console.log("🗑️ Location cache invalidated");
//   } catch (err) {
//     logErr("invalidateLocationCache error", err);
//   }
// };

// // ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
// // `isTaskRegisteredAsync` only tells you the task is registered with the OS —
// // it does NOT tell you it's still actually delivering updates. If the
// // foreground service gets force-killed (OEM battery manager, Doze edge case,
// // etc.) the registration can survive while updates silently stop forever.
// // This checks how long it's actually been since a real location was written,
// // and force-restarts only if it's gone stale — so a healthy task is never
// // disrupted, but a dead one gets revived.
// const STALE_THRESHOLD_MS = 15 * 60 * 1000; // ~3x the 10s/10m expected cadence, tune as needed
// let healthCheckInFlight = false;

// export const ensureTrackingHealthy = async (userId: string) => {
//   if (healthCheckInFlight) {
//     console.log("⏩ ensureTrackingHealthy already in-flight — skipping duplicate call");
//     return;
//   }
//   healthCheckInFlight = true;
//   console.log("▶️ ensureTrackingHealthy: checking for", userId);
//   try {
//     const lastLocationRaw = await AsyncStorage.getItem("LAST_LOCATION");
//     const lastLocation = lastLocationRaw ? JSON.parse(lastLocationRaw) : null;
//     const lastTimestamp = lastLocation
//       ? new Date(lastLocation.timestamp).getTime()
//       : 0;
//     const staleness = Date.now() - lastTimestamp;

//     const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
//     console.log("   isRegistered:", isRegistered, "| staleness (s):", Math.round(staleness / 1000));

//     if (!isRegistered) {
//       console.log("⚠️ Task not registered — starting fresh");
//       await startBackgroundTracking(userId);
//       return;
//     }

//     if (!lastTimestamp || staleness > STALE_THRESHOLD_MS) {
//       console.log(
//         `⚠️ Tracking stale (${Math.round(staleness / 1000)}s since last update) — force restarting`
//       );
//       await forceRestartTracking(userId);
//       return;
//     }

//     console.log(
//       `✅ Tracking healthy — last update ${Math.round(staleness / 1000)}s ago`
//     );
//   } catch (err) {
//     logErr("ensureTrackingHealthy error", err);
//   } finally {
//     healthCheckInFlight = false;
//   }
// };





// import * as TaskManager from "expo-task-manager";
// import * as Location from "expo-location";
// import * as Notifications from "expo-notifications";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { supabase } from "@/supabase/supabase";
// import {
//   getPushTokenForUser,
//   sendExpoPushNotification,
// } from "@/services/pushToken";

// // ─── Constants ────────────────────────────────────────────────────────────────
// export const LOCATION_TASK = "help-app-background-location";
// const HOME_RADIUS_METERS = 50;
// const CACHE_TTL_MS = 10 * 60 * 1000;       // 10 minutes
// const SAVE_THROTTLE_MS = 2 * 60 * 1000;    // save location every 2 min max
// const PERMISSION_TIMEOUT_MS = 10000;
// const NOTIFICATION_COOLDOWN_MS = 10 * 60 * 1000; // 10 min between repeat alerts

// // ─── Error logging helper ─────────────────────────────────────────────────────
// // A generic `console.log("X error:", err)` often prints "[object Object]" or
// // swallows the actual message/stack for non-Error throwables (e.g. Supabase's
// // PostgrestError). This normalizes every error path so you always get a
// // readable message + stack, and can grep logs for "❌" to find every failure.
// function logErr(label: string, err: unknown) {
//   if (err instanceof Error) {
//     console.log(`❌ ${label}:`, err.message);
//     if (err.stack) console.log(`   stack:`, err.stack);
//   } else if (err && typeof err === "object") {
//     try {
//       console.log(`❌ ${label}:`, JSON.stringify(err));
//     } catch {
//       console.log(`❌ ${label}: [unserializable error object]`, err);
//     }
//   } else {
//     console.log(`❌ ${label}:`, String(err));
//   }
// }

// // ─── Global uncaught error safety net ────────────────────────────────────────
// // Catches JS errors/rejections that occur outside any try/catch — e.g. a bug
// // inside a library, or an error thrown synchronously before we ever get a
// // chance to log it ourselves. Without this, such errors can crash silently
// // (especially in a background/headless JS context with no visible UI).
// (function installGlobalErrorHandlers() {
//   const g = global as any;

//   if (g.ErrorUtils?.setGlobalHandler) {
//     const previousHandler = g.ErrorUtils.getGlobalHandler?.();
//     g.ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
//       console.log(
//         `🔥 GLOBAL UNCAUGHT ${isFatal ? "FATAL" : "NON-FATAL"} ERROR:`,
//         error?.message ?? String(error)
//       );
//       if (error?.stack) console.log("   stack:", error.stack);
//       previousHandler?.(error, isFatal);
//     });
//     console.log("🛡️ Global error handler installed");
//   } else {
//     console.log("⚠️ ErrorUtils not available — global handler not installed");
//   }

//   // Hermes/RN promise rejection tracking (available when the RN promise
//   // polyfill's rejection-tracking is active). Wrapped in try/catch because
//   // its availability varies by RN/Hermes version.
//   try {
//     const rejectionTracking = require("promise/setimmediate/rejection-tracking");
//     rejectionTracking.enable({
//       allRejections: true,
//       onUnhandled: (id: number, error: any) => {
//         console.log("🔥 UNHANDLED PROMISE REJECTION:", error?.message ?? String(error));
//         if (error?.stack) console.log("   stack:", error.stack);
//       },
//       onHandled: () => {},
//     });
//     console.log("🛡️ Unhandled promise rejection tracking enabled");
//   } catch (err) {
//     console.log("⚠️ Promise rejection tracking unavailable:", String(err));
//   }
// })();

// // ─── Timeout wrapper (core fix for the "stops after ~1hr" bug) ───────────────
// // Under Android Doze, AsyncStorage and network calls inside a background task
// // can stall indefinitely. If the task's promise never resolves, Android
// // decides the app is misbehaving and kills the process — location then never
// // updates again. Every async op in the task MUST be wrapped so the task
// // always completes, even if a step fails or hangs.
// function withTimeout<T>(
//   promise: Promise<T>,
//   ms: number,
//   fallback: T,
//   label: string
// ): Promise<T> {
//   return Promise.race([
//     promise.catch((err) => {
//       logErr(`${label} threw before timeout`, err);
//       return fallback;
//     }),
//     new Promise<T>((resolve) => {
//       setTimeout(() => {
//         console.log(`⏱️ Timeout hit for: ${label} — using fallback`);
//         resolve(fallback);
//       }, ms);
//     }),
//   ]);
// }

// // ─── Notification handler ─────────────────────────────────────────────────────
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowBanner: true,
//     shouldShowList: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });

// export const requestNotificationPermissions = async () => {
//   console.log("▶️ requestNotificationPermissions: start");
//   try {
//     const { status } = await Notifications.requestPermissionsAsync();
//     console.log(
//       status === "granted"
//         ? "✅ Notification permission granted"
//         : `❌ Notification permission denied (status: ${status})`
//     );
//   } catch (err) {
//     logErr("Notification permission error", err);
//   }
// };

// async function sendLocalNotification(title: string, body: string) {
//   console.log("▶️ sendLocalNotification:", title);
//   try {
//     await Notifications.scheduleNotificationAsync({
//       content: {
//         title,
//         body,
//         sound: true,
//         priority: Notifications.AndroidNotificationPriority.MAX,
//       },
//       trigger: null,
//     });
//     console.log("✅ sendLocalNotification: scheduled");
//   } catch (err) {
//     logErr("sendLocalNotification error", err);
//   }
// }

// async function notifyGuardian(userId: string, title: string, body: string) {
//   console.log("▶️ notifyGuardian: start for user", userId);
//   try {
//     const { data: links, error } = await supabase
//       .from("help_app_guardian_links")
//       .select("guardian_id")
//       .eq("user_id", userId)
//       .eq("status", "approved");

//     if (error) {
//       logErr("notifyGuardian query error", error);
//       return;
//     }
//     if (!links || links.length === 0) {
//       console.log("⚠️ No approved guardian for user:", userId);
//       return;
//     }

//     for (const link of links) {
//       const guardianToken = await getPushTokenForUser(link.guardian_id);
//       if (!guardianToken) {
//         console.log("⚠️ No push token for guardian:", link.guardian_id);
//         continue;
//       }
//       await sendExpoPushNotification(guardianToken, title, body);
//       console.log("✅ Guardian notified:", link.guardian_id);
//     }
//   } catch (err) {
//     logErr("notifyGuardian error", err);
//   }
// }

// async function insertAlert(userId: string, alertType: string, message: string) {
//   console.log("▶️ insertAlert:", alertType);
//   try {
//     const { error } = await supabase.from("help_app_alerts").insert({
//       user_id: userId,
//       alert_type: alertType,
//       message,
//       created_at: new Date().toISOString(),
//     });
//     if (error) {
//       logErr("insertAlert DB error", error);
//       return;
//     }
//     console.log("✅ insertAlert: inserted");
//   } catch (err) {
//     logErr("insertAlert error", err);
//   }
// }

// function getDistanceInMeters(
//   lat1: number,
//   lon1: number,
//   lat2: number,
//   lon2: number
// ) {
//   const R = 6371000;
//   const dLat = ((lat2 - lat1) * Math.PI) / 180;
//   const dLon = ((lon2 - lon1) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos((lat1 * Math.PI) / 180) *
//       Math.cos((lat2 * Math.PI) / 180) *
//       Math.sin(dLon / 2) *
//       Math.sin(dLon / 2);
//   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// }

// async function loadSafeZones(userId: string) {
//   console.log("▶️ loadSafeZones: querying DB for", userId);
//   try {
//     const { data, error } = await supabase
//       .from("help_app_safe_zones")
//       .select("center_lat, center_lng, radius_meters")
//       .eq("user_id", userId)
//       .eq("active", true);
//     if (error) {
//       logErr("loadSafeZones query error", error);
//       return [];
//     }
//     console.log("✅ loadSafeZones: got", data?.length ?? 0, "zones");
//     return data || [];
//   } catch (err) {
//     logErr("loadSafeZones error", err);
//     return [];
//   }
// }

// async function loadHomeLocation(userId: string) {
//   console.log("▶️ loadHomeLocation: querying DB for", userId);
//   try {
//     const { data, error } = await supabase
//       .from("help_app_user_locations")
//       .select("lat, lng")
//       .eq("user_id", userId)
//       .eq("is_home", true)
//       .maybeSingle();
//     if (error) {
//       logErr("loadHomeLocation query error", error);
//       return null;
//     }
//     if (!data) {
//       console.log("⚠️ loadHomeLocation: no home location set");
//       return null;
//     }
//     console.log("✅ loadHomeLocation: found home location");
//     return { latitude: Number(data.lat), longitude: Number(data.lng) };
//   } catch (err) {
//     logErr("loadHomeLocation error", err);
//     return null;
//   }
// }

// async function getCachedSafeZones(userId: string) {
//   try {
//     const cached = await AsyncStorage.getItem("CACHED_SAFE_ZONES");
//     const cachedAt = Number(
//       (await AsyncStorage.getItem("CACHED_ZONES_AT")) ?? 0
//     );
//     if (cached && Date.now() - cachedAt < CACHE_TTL_MS) {
//       return JSON.parse(cached);
//     }
//     const fresh = await loadSafeZones(userId);
//     await AsyncStorage.setItem("CACHED_SAFE_ZONES", JSON.stringify(fresh));
//     await AsyncStorage.setItem("CACHED_ZONES_AT", String(Date.now()));
//     return fresh;
//   } catch (err) {
//     logErr("getCachedSafeZones error", err);
//     return [];
//   }
// }

// async function getCachedHomeLocation(userId: string) {
//   try {
//     const cached = await AsyncStorage.getItem("CACHED_HOME_LOCATION");
//     const cachedAt = Number(
//       (await AsyncStorage.getItem("CACHED_HOME_AT")) ?? 0
//     );
//     if (cached && Date.now() - cachedAt < CACHE_TTL_MS) {
//       return JSON.parse(cached);
//     }
//     const fresh = await loadHomeLocation(userId);
//     if (fresh) {
//       await AsyncStorage.setItem(
//         "CACHED_HOME_LOCATION",
//         JSON.stringify(fresh)
//       );
//       await AsyncStorage.setItem("CACHED_HOME_AT", String(Date.now()));
//     }
//     return fresh;
//   } catch (err) {
//     logErr("getCachedHomeLocation error", err);
//     return null;
//   }
// }

// async function saveLocationToSupabase(
//   userId: string,
//   latitude: number,
//   longitude: number
// ) {
//   console.log("▶️ saveLocationToSupabase: start");
//   try {
//     const lastSaved = Number(
//       (await AsyncStorage.getItem("LAST_SAVED_AT")) ?? 0
//     );
//     if (Date.now() - lastSaved < SAVE_THROTTLE_MS) {
//       console.log("⏩ Location save throttled — skipping");
//       return;
//     }

//     const { error } = await supabase.from("help_app_user_locations").insert({
//       user_id: userId,
//       lat: latitude,
//       lng: longitude,
//       is_home: false,
//       recorded_at: new Date().toISOString(),
//     });

//     if (error) {
//       logErr("saveLocationToSupabase insert error", error);
//       return;
//     }

//     await AsyncStorage.setItem("LAST_SAVED_AT", String(Date.now()));
//     console.log("💾 Location inserted:", latitude, longitude);
//   } catch (err) {
//     logErr("saveLocationToSupabase error", err);
//   }
// }

// async function isCoolingDown(key: string): Promise<boolean> {
//   try {
//     const lastSent = Number((await AsyncStorage.getItem(key)) ?? 0);
//     return Date.now() - lastSent < NOTIFICATION_COOLDOWN_MS;
//   } catch (err) {
//     logErr(`isCoolingDown error (${key})`, err);
//     return false;
//   }
// }

// async function markNotificationSent(key: string) {
//   try {
//     await AsyncStorage.setItem(key, String(Date.now()));
//   } catch (err) {
//     logErr(`markNotificationSent error (${key})`, err);
//   }
// }

// // ─── BACKGROUND TASK ─────────────────────────────────────────────────────────
// // Every await here is wrapped in withTimeout so the task ALWAYS resolves,
// // even if network/storage stalls under Doze. Every branch — including ones
// // that used to return silently — now logs, so "task didn't fire" and
// // "task fired but got empty/errored data" are never indistinguishable again.
// //
// // IMPORTANT: this call must execute on every JS engine boot, including
// // headless background restarts — which means this module must be imported
// // from your app's true entry point (e.g. index.js), not from a route/screen
// // that only mounts once the UI renders.
// TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
//   console.log("🔔 Task callback invoked:", new Date().toISOString());

//   try {
//     if (error) {
//       logErr("Background Task Error (from TaskManager)", error);
//       return;
//     }
//     if (!data) {
//       console.log("⚠️ Task invoked with no data payload — skipping");
//       return;
//     }

//     const { locations } = data as any;
//     console.log("📦 Locations array length:", locations?.length ?? 0);

//     const location = locations?.[0];
//     if (!location) {
//       console.log("⚠️ Task invoked but locations array was empty — skipping");
//       return;
//     }

//     const { latitude, longitude } = location.coords;
//     console.log("🟢 BACKGROUND TASK TRIGGERED:", new Date().toISOString());
//     console.log("📍 Coords:", latitude, longitude);

//     await withTimeout(
//       AsyncStorage.setItem(
//         "LAST_LOCATION",
//         JSON.stringify({
//           latitude,
//           longitude,
//           timestamp: new Date().toISOString(),
//         })
//       ),
//       5000,
//       undefined,
//       "write LAST_LOCATION"
//     );
//     console.log("💾 LAST_LOCATION written to AsyncStorage");

//     const userId = await withTimeout(
//       AsyncStorage.getItem("CURRENT_USER_ID"),
//       5000,
//       null,
//       "read CURRENT_USER_ID"
//     );
//     if (!userId) {
//       console.log("⚠️ No userId in background task — skipping");
//       return;
//     }
//     console.log("👤 userId:", userId);

//     console.log("⏳ Loading zones + home (with timeout guards)...");
//     const [safeZones, homeLocation] = await Promise.all([
//       withTimeout(getCachedSafeZones(userId), 5000, [], "safeZones"),
//       withTimeout(getCachedHomeLocation(userId), 5000, null, "homeLocation"),
//     ]);
//     console.log(
//       "✅ Zones loaded:", safeZones.length,
//       "| home set:", !!homeLocation
//     );

//     await withTimeout(
//       saveLocationToSupabase(userId, latitude, longitude),
//       8000,
//       undefined,
//       "saveLocation"
//     );

//     // ── Safe zone check ───────────────────────────────────────────────────────
//     // The entire notify/insert sequence is wrapped in ONE outer timeout.
//     // Previously each DB/push call here had no timeout guard at all, so a
//     // single stalled network call (very plausible under Doze) would leave
//     // the whole task callback promise unresolved forever — which is exactly
//     // the kind of thing that gets a background task deprioritized/killed by
//     // Android over repeated cycles.
//     if (safeZones.length > 0) {
//       await withTimeout(
//         (async () => {
//           const insideAnyZone = safeZones.some(
//             (zone: any) =>
//               getDistanceInMeters(
//                 latitude,
//                 longitude,
//                 zone.center_lat,
//                 zone.center_lng
//               ) <= zone.radius_meters
//           );

//           const alreadyBreached = await AsyncStorage.getItem(
//             "GEOFENCE_BREACHED"
//           );

//           if (!insideAnyZone && !alreadyBreached) {
//             const coolingDown = await isCoolingDown("ZONE_ALERT_LAST_SENT");
//             if (!coolingDown) {
//               console.log("🚨 Safe zone breach detected — notifying");
//               await AsyncStorage.setItem("GEOFENCE_BREACHED", "true");
//               const title = "🚨 Safe Zone Alert";
//               const userBody = "You have crossed outside the safe zone!";
//               const guardianBody =
//                 "Your linked user has crossed outside the safe zone!";
//               await sendLocalNotification(title, userBody);
//               await notifyGuardian(userId, title, guardianBody);
//               await insertAlert(userId, "zone_exit", guardianBody);
//               await markNotificationSent("ZONE_ALERT_LAST_SENT");
//             } else {
//               console.log("⏩ Zone alert cooling down — skipping notification");
//             }
//           } else if (insideAnyZone && alreadyBreached) {
//             await AsyncStorage.removeItem("GEOFENCE_BREACHED");
//             console.log("✅ User returned inside safe zone");
//           }
//         })(),
//         10000,
//         undefined,
//         "zone alert notify block"
//       );
//     }

//     // ── Home check ────────────────────────────────────────────────────────────
//     // Same fix applied here: one outer timeout around the whole block so a
//     // stalled push/DB call can't hang the task indefinitely.
//     if (homeLocation) {
//       await withTimeout(
//         (async () => {
//           const distFromHome = getDistanceInMeters(
//             latitude,
//             longitude,
//             homeLocation.latitude,
//             homeLocation.longitude
//           );

//           const alreadyLeftHome = await AsyncStorage.getItem("LEFT_HOME");

//           if (distFromHome > HOME_RADIUS_METERS && !alreadyLeftHome) {
//             const coolingDown = await isCoolingDown("HOME_ALERT_LAST_SENT");
//             if (!coolingDown) {
//               console.log("🏠 Left-home detected — notifying");
//               await AsyncStorage.setItem("LEFT_HOME", "true");
//               const title = "🏠 User Left Home";
//               const userBody = "You have left the home area.";
//               const guardianBody = "Your linked user has left the home area.";
//               await sendLocalNotification(title, userBody);
//               await notifyGuardian(userId, title, guardianBody);
//               await insertAlert(userId, "zone_exit", `${guardianBody} (home)`);
//               await markNotificationSent("HOME_ALERT_LAST_SENT");
//             } else {
//               console.log("⏩ Home alert cooling down — skipping notification");
//             }
//           } else if (distFromHome <= HOME_RADIUS_METERS && alreadyLeftHome) {
//             await AsyncStorage.removeItem("LEFT_HOME");
//             console.log("✅ User returned home");
//           }
//         })(),
//         10000,
//         undefined,
//         "home alert notify block"
//       );
//     }

//     console.log("✅ Background task completed");
//   } catch (err) {
//     // Catches anything not already caught inside the helper functions above —
//     // e.g. a synchronous throw, a JSON.parse failure, or an unexpected shape
//     // in `data`. Without this outer catch, such an error would previously
//     // have crashed the task with zero explanation in the logs.
//     logErr("Background task error (outer catch)", err);
//   }
// });

// async function requestPermissionWithTimeout(
//   requestFn: () => Promise<{ status: string }>,
//   label: string,
//   timeoutMs = PERMISSION_TIMEOUT_MS
// ): Promise<boolean> {
//   console.log(`▶️ requestPermissionWithTimeout: ${label}`);
//   return new Promise((resolve) => {
//     const timer = setTimeout(() => {
//       console.log(`⏱️ ${label} permission timed out after ${timeoutMs}ms`);
//       resolve(false);
//     }, timeoutMs);
//     requestFn()
//       .then(({ status }) => {
//         clearTimeout(timer);
//         console.log(`${status === "granted" ? "✅" : "❌"} ${label} permission status:`, status);
//         resolve(status === "granted");
//       })
//       .catch((err) => {
//         clearTimeout(timer);
//         logErr(`${label} permission error`, err);
//         resolve(false);
//       });
//   });
// }

// const TRACKING_OPTIONS: Location.LocationTaskOptions = {
//   accuracy: Location.Accuracy.Balanced,
//   timeInterval: 10000,
//   distanceInterval: 0,
//   showsBackgroundLocationIndicator: true,
//   foregroundService: {
//     notificationTitle: "Safety Monitoring Active",
//     notificationBody: "Your location is monitored for safety.",
//   },
// };

// async function _startLocationUpdates(userId: string): Promise<boolean> {
//   console.log("▶️ _startLocationUpdates: start for", userId);

//   const fgGranted = await requestPermissionWithTimeout(
//     () => Location.requestForegroundPermissionsAsync(),
//     "Foreground location"
//   );
//   if (!fgGranted) {
//     console.log("❌ _startLocationUpdates: aborting — foreground permission not granted");
//     return false;
//   }

//   const bgGranted = await requestPermissionWithTimeout(
//     () => Location.requestBackgroundPermissionsAsync(),
//     "Background location"
//   );
//   if (!bgGranted) {
//     console.log("❌ _startLocationUpdates: aborting — background permission not granted");
//     return false;
//   }

//   await requestNotificationPermissions();

//   try {
//     const { saveExpoPushToken } = await import("@/services/pushToken");
//     await saveExpoPushToken();
//     console.log("✅ _startLocationUpdates: push token saved");
//   } catch (err) {
//     logErr("_startLocationUpdates: saveExpoPushToken error", err);
//     // Non-fatal — continue starting location updates regardless
//   }

//   try {
//     await Promise.all([
//       getCachedSafeZones(userId),
//       getCachedHomeLocation(userId),
//     ]);
//     console.log("✅ _startLocationUpdates: initial cache warm-up done");
//   } catch (err) {
//     logErr("_startLocationUpdates: cache warm-up error", err);
//     // Non-fatal — the task will retry these itself on first fire
//   }

//   try {
//     console.log("▶️ Calling Location.startLocationUpdatesAsync...");
//     await Location.startLocationUpdatesAsync(LOCATION_TASK, TRACKING_OPTIONS);
//     console.log("✅ Location.startLocationUpdatesAsync succeeded");
//   } catch (err) {
//     logErr("Location.startLocationUpdatesAsync FAILED", err);
//     return false;
//   }

//   return true;
// }

// // ─── Concurrency guard ────────────────────────────────────────────────────────
// // FIX: Without this, overlapping calls to startBackgroundTracking (e.g. from
// // stacked/duplicate AppState listeners left behind by repeated Fast Refresh
// // reloads during dev testing) all race to check isRegistered, all see false
// // simultaneously (since none of them have finished yet), and all pile on
// // calling native permission/location APIs at once. That flood is what causes
// // otherwise-instant "already granted" permission checks to intermittently
// // hang for the full 10s timeout — the native module gets jammed with
// // concurrent requests. This lock ensures only one start attempt runs at a
// // time; anything that comes in while one is in-flight just skips.
// let startInFlight = false;

// // ─── START BACKGROUND TRACKING ───────────────────────────────────────────────
// export const startBackgroundTracking = async (userId: string) => {
//   if (startInFlight) {
//     console.log("⏩ startBackgroundTracking already in-flight — skipping duplicate call");
//     return;
//   }
//   startInFlight = true;
//   console.log("▶️ startBackgroundTracking: called for", userId);
//   try {
//     await AsyncStorage.setItem("CURRENT_USER_ID", userId);
//     await AsyncStorage.multiRemove(["GEOFENCE_BREACHED", "LEFT_HOME"]);

//     // Do NOT stop+restart if already registered. Stopping resets Android's
//     // job scheduler, which then waits for the next Doze maintenance window
//     // before firing again.
//     const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
//     if (isRegistered) {
//       console.log("✅ Task already running — skipping re-registration");
//       return;
//     }

//     const started = await _startLocationUpdates(userId);
//     console.log(
//       started
//         ? `✅ Background tracking started for user: ${userId}`
//         : `❌ Background tracking FAILED to start for user: ${userId}`
//     );
//   } catch (err) {
//     logErr("startBackgroundTracking error", err);
//   } finally {
//     startInFlight = false;
//   }
// };

// export const stopBackgroundTracking = async () => {
//   console.log("▶️ stopBackgroundTracking: called");
//   try {
//     const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
//     if (!started) {
//       console.log("ℹ️ Background tracking already stopped");
//       return;
//     }
//     await Location.stopLocationUpdatesAsync(LOCATION_TASK);
//     console.log("🛑 Background tracking stopped");
//   } catch (err) {
//     logErr("stopBackgroundTracking error", err);
//   }
// };

// // Use only when you genuinely need to reset everything (user change, revoked perms).
// export const forceRestartTracking = async (userId: string) => {
//   console.log("🔄 forceRestartTracking: called for", userId);
//   await stopBackgroundTracking();

//   await AsyncStorage.multiRemove([
//     "GEOFENCE_BREACHED",
//     "LEFT_HOME",
//     "LAST_SAVED_AT",
//     "CACHED_SAFE_ZONES",
//     "CACHED_ZONES_AT",
//     "CACHED_HOME_LOCATION",
//     "CACHED_HOME_AT",
//     "ZONE_ALERT_LAST_SENT",
//     "HOME_ALERT_LAST_SENT",
//   ]);

//   await new Promise((res) => setTimeout(res, 1000));
//   await AsyncStorage.setItem("CURRENT_USER_ID", userId);

//   const started = await _startLocationUpdates(userId);
//   console.log(
//     started
//       ? `✅ Background tracking force restarted for user: ${userId}`
//       : "❌ Force restart failed — see logs above for the specific step that failed"
//   );
// };

// export const invalidateLocationCache = async () => {
//   console.log("▶️ invalidateLocationCache: called");
//   try {
//     await AsyncStorage.multiRemove([
//       "CACHED_SAFE_ZONES",
//       "CACHED_ZONES_AT",
//       "CACHED_HOME_LOCATION",
//       "CACHED_HOME_AT",
//     ]);
//     console.log("🗑️ Location cache invalidated");
//   } catch (err) {
//     logErr("invalidateLocationCache error", err);
//   }
// };

// // ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
// // `isTaskRegisteredAsync` only tells you the task is registered with the OS —
// // it does NOT tell you it's still actually delivering updates. If the
// // foreground service gets force-killed (OEM battery manager, Doze edge case,
// // etc.) the registration can survive while updates silently stop forever.
// // This checks how long it's actually been since a real location was written,
// // and force-restarts only if it's gone stale — so a healthy task is never
// // disrupted, but a dead one gets revived.
// const STALE_THRESHOLD_MS = 15 * 60 * 1000; // ~3x the 10s/10m expected cadence, tune as needed
// let healthCheckInFlight = false;

// export const ensureTrackingHealthy = async (userId: string) => {
//   if (healthCheckInFlight) {
//     console.log("⏩ ensureTrackingHealthy already in-flight — skipping duplicate call");
//     return;
//   }
//   healthCheckInFlight = true;
//   console.log("▶️ ensureTrackingHealthy: checking for", userId);
//   try {
//     const lastLocationRaw = await AsyncStorage.getItem("LAST_LOCATION");
//     const lastLocation = lastLocationRaw ? JSON.parse(lastLocationRaw) : null;
//     const lastTimestamp = lastLocation
//       ? new Date(lastLocation.timestamp).getTime()
//       : 0;
//     const staleness = Date.now() - lastTimestamp;

//     const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
//     console.log("   isRegistered:", isRegistered, "| staleness (s):", Math.round(staleness / 1000));

//     if (!isRegistered) {
//       console.log("⚠️ Task not registered — starting fresh");
//       await startBackgroundTracking(userId);
//       return;
//     }

//     if (!lastTimestamp || staleness > STALE_THRESHOLD_MS) {
//       console.log(
//         `⚠️ Tracking stale (${Math.round(staleness / 1000)}s since last update) — force restarting`
//       );
//       await forceRestartTracking(userId);
//       return;
//     }

//     console.log(
//       `✅ Tracking healthy — last update ${Math.round(staleness / 1000)}s ago`
//     );
//   } catch (err) {
//     logErr("ensureTrackingHealthy error", err);
//   } finally {
//     healthCheckInFlight = false;
//   }
// };  




// import * as TaskManager from "expo-task-manager";
// import * as Location from "expo-location";
// import * as Notifications from "expo-notifications";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { supabase } from "@/supabase/supabase";
// import {
//   getPushTokenForUser,
//   sendExpoPushNotification,
// } from "@/services/pushToken";

// // ─── Constants ────────────────────────────────────────────────────────────────
// export const LOCATION_TASK = "help-app-background-location";
// const HOME_RADIUS_METERS = 50;
// const CACHE_TTL_MS = 10 * 60 * 1000;       // 10 minutes
// const SAVE_THROTTLE_MS = 2 * 60 * 1000;    // save location every 2 min max
// const PERMISSION_TIMEOUT_MS = 10000;
// const NOTIFICATION_COOLDOWN_MS = 10 * 60 * 1000; // 10 min between repeat alerts
// const TOKEN_REFRESH_MARGIN_SECONDS = 300; // refresh if expiring within 5 min

// // ─── Error logging helper ─────────────────────────────────────────────────────
// function logErr(label: string, err: unknown) {
//   if (err instanceof Error) {
//     console.log(`❌ ${label}:`, err.message);
//     if (err.stack) console.log(`   stack:`, err.stack);
//   } else if (err && typeof err === "object") {
//     try {
//       console.log(`❌ ${label}:`, JSON.stringify(err));
//     } catch {
//       console.log(`❌ ${label}: [unserializable error object]`, err);
//     }
//   } else {
//     console.log(`❌ ${label}:`, String(err));
//   }
// }

// // ─── Global uncaught error safety net ────────────────────────────────────────
// (function installGlobalErrorHandlers() {
//   const g = global as any;

//   if (g.ErrorUtils?.setGlobalHandler) {
//     const previousHandler = g.ErrorUtils.getGlobalHandler?.();
//     g.ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
//       console.log(
//         `🔥 GLOBAL UNCAUGHT ${isFatal ? "FATAL" : "NON-FATAL"} ERROR:`,
//         error?.message ?? String(error)
//       );
//       if (error?.stack) console.log("   stack:", error.stack);
//       previousHandler?.(error, isFatal);
//     });
//     console.log("🛡️ Global error handler installed");
//   } else {
//     console.log("⚠️ ErrorUtils not available — global handler not installed");
//   }

//   try {
//     const rejectionTracking = require("promise/setimmediate/rejection-tracking");
//     rejectionTracking.enable({
//       allRejections: true,
//       onUnhandled: (id: number, error: any) => {
//         console.log("🔥 UNHANDLED PROMISE REJECTION:", error?.message ?? String(error));
//         if (error?.stack) console.log("   stack:", error.stack);
//       },
//       onHandled: () => {},
//     });
//     console.log("🛡️ Unhandled promise rejection tracking enabled");
//   } catch (err) {
//     console.log("⚠️ Promise rejection tracking unavailable:", String(err));
//   }
// })();

// // ─── Timeout wrapper ──────────────────────────────────────────────────────────
// function withTimeout<T>(
//   promise: Promise<T>,
//   ms: number,
//   fallback: T,
//   label: string
// ): Promise<T> {
//   return Promise.race([
//     promise.catch((err) => {
//       logErr(`${label} threw before timeout`, err);
//       return fallback;
//     }),
//     new Promise<T>((resolve) => {
//       setTimeout(() => {
//         console.log(`⏱️ Timeout hit for: ${label} — using fallback`);
//         resolve(fallback);
//       }, ms);
//     }),
//   ]);
// }

// // ─── Notification handler ─────────────────────────────────────────────────────
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowBanner: true,
//     shouldShowList: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });

// export const requestNotificationPermissions = async () => {
//   console.log("▶️ requestNotificationPermissions: start");
//   try {
//     const { status } = await Notifications.requestPermissionsAsync();
//     console.log(
//       status === "granted"
//         ? "✅ Notification permission granted"
//         : `❌ Notification permission denied (status: ${status})`
//     );
//   } catch (err) {
//     logErr("Notification permission error", err);
//   }
// };

// async function sendLocalNotification(title: string, body: string) {
//   console.log("▶️ sendLocalNotification:", title);
//   try {
//     await Notifications.scheduleNotificationAsync({
//       content: {
//         title,
//         body,
//         sound: true,
//         priority: Notifications.AndroidNotificationPriority.MAX,
//       },
//       trigger: null,
//     });
//     console.log("✅ sendLocalNotification: scheduled");
//   } catch (err) {
//     logErr("sendLocalNotification error", err);
//   }
// }

// async function notifyGuardian(userId: string, title: string, body: string) {
//   console.log("▶️ notifyGuardian: start for user", userId);
//   try {
//     const { data: links, error } = await supabase
//       .from("help_app_guardian_links")
//       .select("guardian_id")
//       .eq("user_id", userId)
//       .eq("status", "approved");

//     if (error) {
//       logErr("notifyGuardian query error", error);
//       return;
//     }
//     if (!links || links.length === 0) {
//       console.log("⚠️ No approved guardian for user:", userId);
//       return;
//     }

//     for (const link of links) {
//       const guardianToken = await getPushTokenForUser(link.guardian_id);
//       if (!guardianToken) {
//         console.log("⚠️ No push token for guardian:", link.guardian_id);
//         continue;
//       }
//       await sendExpoPushNotification(guardianToken, title, body);
//       console.log("✅ Guardian notified:", link.guardian_id);
//     }
//   } catch (err) {
//     logErr("notifyGuardian error", err);
//   }
// }

// async function insertAlert(userId: string, alertType: string, message: string) {
//   console.log("▶️ insertAlert:", alertType);
//   try {
//     const { error } = await supabase.from("help_app_alerts").insert({
//       user_id: userId,
//       alert_type: alertType,
//       message,
//       created_at: new Date().toISOString(),
//     });
//     if (error) {
//       logErr("insertAlert DB error", error);
//       return;
//     }
//     console.log("✅ insertAlert: inserted");
//   } catch (err) {
//     logErr("insertAlert error", err);
//   }
// }

// function getDistanceInMeters(
//   lat1: number,
//   lon1: number,
//   lat2: number,
//   lon2: number
// ) {
//   const R = 6371000;
//   const dLat = ((lat2 - lat1) * Math.PI) / 180;
//   const dLon = ((lon2 - lon1) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos((lat1 * Math.PI) / 180) *
//       Math.cos((lat2 * Math.PI) / 180) *
//       Math.sin(dLon / 2) *
//       Math.sin(dLon / 2);
//   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// }

// async function loadSafeZones(userId: string) {
//   console.log("▶️ loadSafeZones: querying DB for", userId);
//   try {
//     const { data, error } = await supabase
//       .from("help_app_safe_zones")
//       .select("center_lat, center_lng, radius_meters")
//       .eq("user_id", userId)
//       .eq("active", true);
//     if (error) {
//       logErr("loadSafeZones query error", error);
//       return [];
//     }
//     console.log("✅ loadSafeZones: got", data?.length ?? 0, "zones");
//     return data || [];
//   } catch (err) {
//     logErr("loadSafeZones error", err);
//     return [];
//   }
// }

// async function loadHomeLocation(userId: string) {
//   console.log("▶️ loadHomeLocation: querying DB for", userId);
//   try {
//     const { data, error } = await supabase
//       .from("help_app_user_locations")
//       .select("lat, lng")
//       .eq("user_id", userId)
//       .eq("is_home", true)
//       .maybeSingle();
//     if (error) {
//       logErr("loadHomeLocation query error", error);
//       return null;
//     }
//     if (!data) {
//       console.log("⚠️ loadHomeLocation: no home location set");
//       return null;
//     }
//     console.log("✅ loadHomeLocation: found home location");
//     return { latitude: Number(data.lat), longitude: Number(data.lng) };
//   } catch (err) {
//     logErr("loadHomeLocation error", err);
//     return null;
//   }
// }

// async function getCachedSafeZones(userId: string) {
//   try {
//     const cached = await AsyncStorage.getItem("CACHED_SAFE_ZONES");
//     const cachedAt = Number(
//       (await AsyncStorage.getItem("CACHED_ZONES_AT")) ?? 0
//     );
//     if (cached && Date.now() - cachedAt < CACHE_TTL_MS) {
//       return JSON.parse(cached);
//     }
//     const fresh = await loadSafeZones(userId);
//     await AsyncStorage.setItem("CACHED_SAFE_ZONES", JSON.stringify(fresh));
//     await AsyncStorage.setItem("CACHED_ZONES_AT", String(Date.now()));
//     return fresh;
//   } catch (err) {
//     logErr("getCachedSafeZones error", err);
//     return [];
//   }
// }

// async function getCachedHomeLocation(userId: string) {
//   try {
//     const cached = await AsyncStorage.getItem("CACHED_HOME_LOCATION");
//     const cachedAt = Number(
//       (await AsyncStorage.getItem("CACHED_HOME_AT")) ?? 0
//     );
//     if (cached && Date.now() - cachedAt < CACHE_TTL_MS) {
//       return JSON.parse(cached);
//     }
//     const fresh = await loadHomeLocation(userId);
//     if (fresh) {
//       await AsyncStorage.setItem(
//         "CACHED_HOME_LOCATION",
//         JSON.stringify(fresh)
//       );
//       await AsyncStorage.setItem("CACHED_HOME_AT", String(Date.now()));
//     }
//     return fresh;
//   } catch (err) {
//     logErr("getCachedHomeLocation error", err);
//     return null;
//   }
// }

// async function saveLocationToSupabase(
//   userId: string,
//   latitude: number,
//   longitude: number
// ) {
//   console.log("▶️ saveLocationToSupabase: start");
//   try {
//     const lastSaved = Number(
//       (await AsyncStorage.getItem("LAST_SAVED_AT")) ?? 0
//     );
//     if (Date.now() - lastSaved < SAVE_THROTTLE_MS) {
//       console.log("⏩ Location save throttled — skipping");
//       return;
//     }

//     const { error } = await supabase.from("help_app_user_locations").insert({
//       user_id: userId,
//       lat: latitude,
//       lng: longitude,
//       is_home: false,
//       recorded_at: new Date().toISOString(),
//     });

//     if (error) {
//       logErr("saveLocationToSupabase insert error", error);
//       return;
//     }

//     await AsyncStorage.setItem("LAST_SAVED_AT", String(Date.now()));
//     console.log("💾 Location inserted:", latitude, longitude);
//   } catch (err) {
//     logErr("saveLocationToSupabase error", err);
//   }
// }

// async function isCoolingDown(key: string): Promise<boolean> {
//   try {
//     const lastSent = Number((await AsyncStorage.getItem(key)) ?? 0);
//     return Date.now() - lastSent < NOTIFICATION_COOLDOWN_MS;
//   } catch (err) {
//     logErr(`isCoolingDown error (${key})`, err);
//     return false;
//   }
// }

// async function markNotificationSent(key: string) {
//   try {
//     await AsyncStorage.setItem(key, String(Date.now()));
//   } catch (err) {
//     logErr(`markNotificationSent error (${key})`, err);
//   }
// }

// // ─── Session token freshness check ─────────────────────────────────────────
// // supabase-js's autoRefreshToken relies on a JS setInterval timer running in
// // the foreground. That timer is NOT reliable in a background/headless task
// // context under Android Doze — if the JS process gets suspended between
// // task invocations, the timer can simply never fire. Once the access token
// // actually expires (default 1hr), every DB call after that point silently
// // fails/hangs, even though the task keeps getting re-invoked and GPS keeps
// // working — location just stops reaching the server. This check runs at the
// // top of every task invocation so token freshness never depends on that
// // background timer.
// async function ensureFreshSession(): Promise<void> {
//   try {
//     const { data } = await withTimeout(
//       supabase.auth.getSession(),
//       5000,
//       { data: { session: null } } as any,
//       "getSession"
//     );
//     const session = data?.session;

//     if (!session) {
//       console.log("⚠️ ensureFreshSession: no session found");
//       return;
//     }

//     if (!session.expires_at) {
//       console.log("⚠️ ensureFreshSession: session has no expires_at — skipping check");
//       return;
//     }

//     const secondsUntilExpiry = session.expires_at - Date.now() / 1000;
//     console.log(`🔑 Session expires in ${Math.round(secondsUntilExpiry)}s`);

//     if (secondsUntilExpiry < TOKEN_REFRESH_MARGIN_SECONDS) {
//       console.log("🔄 Token expiring soon — refreshing session");
//       const { error: refreshError } = await withTimeout(
//         supabase.auth.refreshSession(),
//         8000,
//         { error: new Error("refreshSession timed out") } as any,
//         "refreshSession"
//       );
//       if (refreshError) {
//         logErr("Token refresh failed", refreshError);
//       } else {
//         console.log("✅ Session refreshed");
//       }
//     }
//   } catch (err) {
//     logErr("ensureFreshSession error", err);
//   }
// }

// // ─── BACKGROUND TASK ─────────────────────────────────────────────────────────
// TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
//   console.log("🔔 Task callback invoked:", new Date().toISOString());

//   try {
//     if (error) {
//       logErr("Background Task Error (from TaskManager)", error);
//       return;
//     }
//     if (!data) {
//       console.log("⚠️ Task invoked with no data payload — skipping");
//       return;
//     }

//     const { locations } = data as any;
//     console.log("📦 Locations array length:", locations?.length ?? 0);

//     const location = locations?.[0];
//     if (!location) {
//       console.log("⚠️ Task invoked but locations array was empty — skipping");
//       return;
//     }

//     const { latitude, longitude } = location.coords;
//     console.log("🟢 BACKGROUND TASK TRIGGERED:", new Date().toISOString());
//     console.log("📍 Coords:", latitude, longitude);

//     await withTimeout(
//       AsyncStorage.setItem(
//         "LAST_LOCATION",
//         JSON.stringify({
//           latitude,
//           longitude,
//           timestamp: new Date().toISOString(),
//         })
//       ),
//       5000,
//       undefined,
//       "write LAST_LOCATION"
//     );
//     console.log("💾 LAST_LOCATION written to AsyncStorage");

//     const userId = await withTimeout(
//       AsyncStorage.getItem("CURRENT_USER_ID"),
//       5000,
//       null,
//       "read CURRENT_USER_ID"
//     );
//     if (!userId) {
//       console.log("⚠️ No userId in background task — skipping");
//       return;
//     }
//     console.log("👤 userId:", userId);

//     // Check/refresh the Supabase session BEFORE any DB calls. This is the
//     // fix for location updates silently stopping while the task itself
//     // keeps firing — see ensureFreshSession() comment above.
//     await ensureFreshSession();

//     console.log("⏳ Loading zones + home (with timeout guards)...");
//     const [safeZones, homeLocation] = await Promise.all([
//       withTimeout(getCachedSafeZones(userId), 5000, [], "safeZones"),
//       withTimeout(getCachedHomeLocation(userId), 5000, null, "homeLocation"),
//     ]);
//     console.log(
//       "✅ Zones loaded:", safeZones.length,
//       "| home set:", !!homeLocation
//     );

//     await withTimeout(
//       saveLocationToSupabase(userId, latitude, longitude),
//       8000,
//       undefined,
//       "saveLocation"
//     );

//     if (safeZones.length > 0) {
//       await withTimeout(
//         (async () => {
//           const insideAnyZone = safeZones.some(
//             (zone: any) =>
//               getDistanceInMeters(
//                 latitude,
//                 longitude,
//                 zone.center_lat,
//                 zone.center_lng
//               ) <= zone.radius_meters
//           );

//           const alreadyBreached = await AsyncStorage.getItem(
//             "GEOFENCE_BREACHED"
//           );

//           if (!insideAnyZone && !alreadyBreached) {
//             const coolingDown = await isCoolingDown("ZONE_ALERT_LAST_SENT");
//             if (!coolingDown) {
//               console.log("🚨 Safe zone breach detected — notifying");
//               await AsyncStorage.setItem("GEOFENCE_BREACHED", "true");
//               const title = "🚨 Safe Zone Alert";
//               const userBody = "You have crossed outside the safe zone!";
//               const guardianBody =
//                 "Your linked user has crossed outside the safe zone!";
//               await sendLocalNotification(title, userBody);
//               await notifyGuardian(userId, title, guardianBody);
//               await insertAlert(userId, "zone_exit", guardianBody);
//               await markNotificationSent("ZONE_ALERT_LAST_SENT");
//             } else {
//               console.log("⏩ Zone alert cooling down — skipping notification");
//             }
//           } else if (insideAnyZone && alreadyBreached) {
//             await AsyncStorage.removeItem("GEOFENCE_BREACHED");
//             console.log("✅ User returned inside safe zone");
//           }
//         })(),
//         10000,
//         undefined,
//         "zone alert notify block"
//       );
//     }

//     if (homeLocation) {
//       await withTimeout(
//         (async () => {
//           const distFromHome = getDistanceInMeters(
//             latitude,
//             longitude,
//             homeLocation.latitude,
//             homeLocation.longitude
//           );

//           const alreadyLeftHome = await AsyncStorage.getItem("LEFT_HOME");

//           if (distFromHome > HOME_RADIUS_METERS && !alreadyLeftHome) {
//             const coolingDown = await isCoolingDown("HOME_ALERT_LAST_SENT");
//             if (!coolingDown) {
//               console.log("🏠 Left-home detected — notifying");
//               await AsyncStorage.setItem("LEFT_HOME", "true");
//               const title = "🏠 User Left Home";
//               const userBody = "You have left the home area.";
//               const guardianBody = "Your linked user has left the home area.";
//               await sendLocalNotification(title, userBody);
//               await notifyGuardian(userId, title, guardianBody);
//               await insertAlert(userId, "zone_exit", `${guardianBody} (home)`);
//               await markNotificationSent("HOME_ALERT_LAST_SENT");
//             } else {
//               console.log("⏩ Home alert cooling down — skipping notification");
//             }
//           } else if (distFromHome <= HOME_RADIUS_METERS && alreadyLeftHome) {
//             await AsyncStorage.removeItem("LEFT_HOME");
//             console.log("✅ User returned home");
//           }
//         })(),
//         10000,
//         undefined,
//         "home alert notify block"
//       );
//     }

//     console.log("✅ Background task completed");
//   } catch (err) {
//     logErr("Background task error (outer catch)", err);
//   }
// });

// async function requestPermissionWithTimeout(
//   requestFn: () => Promise<{ status: string }>,
//   label: string,
//   timeoutMs = PERMISSION_TIMEOUT_MS
// ): Promise<boolean> {
//   console.log(`▶️ requestPermissionWithTimeout: ${label}`);
//   return new Promise((resolve) => {
//     const timer = setTimeout(() => {
//       console.log(`⏱️ ${label} permission timed out after ${timeoutMs}ms`);
//       resolve(false);
//     }, timeoutMs);
//     requestFn()
//       .then(({ status }) => {
//         clearTimeout(timer);
//         console.log(`${status === "granted" ? "✅" : "❌"} ${label} permission status:`, status);
//         resolve(status === "granted");
//       })
//       .catch((err) => {
//         clearTimeout(timer);
//         logErr(`${label} permission error`, err);
//         resolve(false);
//       });
//   });
// }

// const TRACKING_OPTIONS: Location.LocationTaskOptions = {
//   accuracy: Location.Accuracy.Balanced,
//   timeInterval: 10000,
//   distanceInterval: 0,
//   showsBackgroundLocationIndicator: true,
//   foregroundService: {
//     notificationTitle: "Safety Monitoring Active",
//     notificationBody: "Your location is monitored for safety.",
//   },
// };

// async function _startLocationUpdates(userId: string): Promise<boolean> {
//   console.log("▶️ _startLocationUpdates: start for", userId);

//   const fgGranted = await requestPermissionWithTimeout(
//     () => Location.requestForegroundPermissionsAsync(),
//     "Foreground location"
//   );
//   if (!fgGranted) {
//     console.log("❌ _startLocationUpdates: aborting — foreground permission not granted");
//     return false;
//   }

//   const bgGranted = await requestPermissionWithTimeout(
//     () => Location.requestBackgroundPermissionsAsync(),
//     "Background location"
//   );
//   if (!bgGranted) {
//     console.log("❌ _startLocationUpdates: aborting — background permission not granted");
//     return false;
//   }

//   await requestNotificationPermissions();

//   try {
//     const { saveExpoPushToken } = await import("@/services/pushToken");
//     await saveExpoPushToken();
//     console.log("✅ _startLocationUpdates: push token saved");
//   } catch (err) {
//     logErr("_startLocationUpdates: saveExpoPushToken error", err);
//   }

//   try {
//     await Promise.all([
//       getCachedSafeZones(userId),
//       getCachedHomeLocation(userId),
//     ]);
//     console.log("✅ _startLocationUpdates: initial cache warm-up done");
//   } catch (err) {
//     logErr("_startLocationUpdates: cache warm-up error", err);
//   }

//   try {
//     console.log("▶️ Calling Location.startLocationUpdatesAsync...");
//     await Location.startLocationUpdatesAsync(LOCATION_TASK, TRACKING_OPTIONS);
//     console.log("✅ Location.startLocationUpdatesAsync succeeded");
//   } catch (err) {
//     logErr("Location.startLocationUpdatesAsync FAILED", err);
//     return false;
//   }

//   return true;
// }

// let startInFlight = false;

// export const startBackgroundTracking = async (userId: string) => {
//   if (startInFlight) {
//     console.log("⏩ startBackgroundTracking already in-flight — skipping duplicate call");
//     return;
//   }
//   startInFlight = true;
//   console.log("▶️ startBackgroundTracking: called for", userId);
//   try {
//     await AsyncStorage.setItem("CURRENT_USER_ID", userId);
//     await AsyncStorage.multiRemove(["GEOFENCE_BREACHED", "LEFT_HOME"]);

//     const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
//     if (isRegistered) {
//       console.log("✅ Task already running — skipping re-registration");
//       return;
//     }

//     const started = await _startLocationUpdates(userId);
//     console.log(
//       started
//         ? `✅ Background tracking started for user: ${userId}`
//         : `❌ Background tracking FAILED to start for user: ${userId}`
//     );
//   } catch (err) {
//     logErr("startBackgroundTracking error", err);
//   } finally {
//     startInFlight = false;
//   }
// };

// export const stopBackgroundTracking = async () => {
//   console.log("▶️ stopBackgroundTracking: called");
//   try {
//     const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
//     if (!started) {
//       console.log("ℹ️ Background tracking already stopped");
//       return;
//     }
//     await Location.stopLocationUpdatesAsync(LOCATION_TASK);
//     console.log("🛑 Background tracking stopped");
//   } catch (err) {
//     logErr("stopBackgroundTracking error", err);
//   }
// };

// export const forceRestartTracking = async (userId: string) => {
//   console.log("🔄 forceRestartTracking: called for", userId);
//   await stopBackgroundTracking();

//   await AsyncStorage.multiRemove([
//     "GEOFENCE_BREACHED",
//     "LEFT_HOME",
//     "LAST_SAVED_AT",
//     "CACHED_SAFE_ZONES",
//     "CACHED_ZONES_AT",
//     "CACHED_HOME_LOCATION",
//     "CACHED_HOME_AT",
//     "ZONE_ALERT_LAST_SENT",
//     "HOME_ALERT_LAST_SENT",
//   ]);

//   await new Promise((res) => setTimeout(res, 1000));
//   await AsyncStorage.setItem("CURRENT_USER_ID", userId);

//   const started = await _startLocationUpdates(userId);
//   console.log(
//     started
//       ? `✅ Background tracking force restarted for user: ${userId}`
//       : "❌ Force restart failed — see logs above for the specific step that failed"
//   );
// };

// export const invalidateLocationCache = async () => {
//   console.log("▶️ invalidateLocationCache: called");
//   try {
//     await AsyncStorage.multiRemove([
//       "CACHED_SAFE_ZONES",
//       "CACHED_ZONES_AT",
//       "CACHED_HOME_LOCATION",
//       "CACHED_HOME_AT",
//     ]);
//     console.log("🗑️ Location cache invalidated");
//   } catch (err) {
//     logErr("invalidateLocationCache error", err);
//   }
// };

// const STALE_THRESHOLD_MS = 15 * 60 * 1000;
// let healthCheckInFlight = false;

// export const ensureTrackingHealthy = async (userId: string) => {
//   if (healthCheckInFlight) {
//     console.log("⏩ ensureTrackingHealthy already in-flight — skipping duplicate call");
//     return;
//   }
//   healthCheckInFlight = true;
//   console.log("▶️ ensureTrackingHealthy: checking for", userId);
//   try {
//     const lastLocationRaw = await AsyncStorage.getItem("LAST_LOCATION");
//     const lastLocation = lastLocationRaw ? JSON.parse(lastLocationRaw) : null;
//     const lastTimestamp = lastLocation
//       ? new Date(lastLocation.timestamp).getTime()
//       : 0;
//     const staleness = Date.now() - lastTimestamp;

//     const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
//     console.log("   isRegistered:", isRegistered, "| staleness (s):", Math.round(staleness / 1000));

//     if (!isRegistered) {
//       console.log("⚠️ Task not registered — starting fresh");
//       await startBackgroundTracking(userId);
//       return;
//     }

//     if (!lastTimestamp || staleness > STALE_THRESHOLD_MS) {
//       console.log(
//         `⚠️ Tracking stale (${Math.round(staleness / 1000)}s since last update) — force restarting`
//       );
//       await forceRestartTracking(userId);
//       return;
//     }

//     console.log(
//       `✅ Tracking healthy — last update ${Math.round(staleness / 1000)}s ago`
//     );
//   } catch (err) {
//     logErr("ensureTrackingHealthy error", err);
//   } finally {
//     healthCheckInFlight = false;
//   }
// };









// import { installPersistentLogging, flushLogsNow } from "@/services/debugLogger";
// installPersistentLogging();

// import * as TaskManager from "expo-task-manager";
// import * as Location from "expo-location";
// import * as Notifications from "expo-notifications";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { supabase } from "@/supabase/supabase";
// import {
//   getPushTokenForUser,
//   sendExpoPushNotification,
// } from "@/services/pushToken";

// // NOTE ON WHY THIS IS AT THE VERY TOP:
// // index.js imports this file (services/backgroundLocation) BEFORE
// // expo-router/entry. That means installPersistentLogging() runs before any
// // screen, any other service, or the router itself has logged a single line —
// // so every console.log/warn/error in the ENTIRE app, not just this file,
// // gets captured to the persistent log file from the first millisecond of
// // the JS process. This is what makes "every detail" actually true, not just
// // true for this one file.

// // ─── Constants ────────────────────────────────────────────────────────────────
// export const LOCATION_TASK = "help-app-background-location";
// const HOME_RADIUS_METERS = 50;
// const CACHE_TTL_MS = 10 * 60 * 1000;       // 10 minutes
// const SAVE_THROTTLE_MS = 2 * 60 * 1000;    // save location every 2 min max
// const PERMISSION_TIMEOUT_MS = 10000;
// const NOTIFICATION_COOLDOWN_MS = 10 * 60 * 1000; // 10 min between repeat alerts
// const TOKEN_REFRESH_MARGIN_SECONDS = 300; // refresh if expiring within 5 min

// // ─── Error logging helper ─────────────────────────────────────────────────────
// function logErr(label: string, err: unknown) {
//   if (err instanceof Error) {
//     console.log(`❌ ${label}:`, err.message);
//     if (err.stack) console.log(`   stack:`, err.stack);
//   } else if (err && typeof err === "object") {
//     try {
//       console.log(`❌ ${label}:`, JSON.stringify(err));
//     } catch {
//       console.log(`❌ ${label}: [unserializable error object]`, err);
//     }
//   } else {
//     console.log(`❌ ${label}:`, String(err));
//   }
// }

// // ─── Global uncaught error safety net ────────────────────────────────────────
// (function installGlobalErrorHandlers() {
//   const g = global as any;

//   if (g.ErrorUtils?.setGlobalHandler) {
//     const previousHandler = g.ErrorUtils.getGlobalHandler?.();
//     g.ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
//       console.log(
//         `🔥 GLOBAL UNCAUGHT ${isFatal ? "FATAL" : "NON-FATAL"} ERROR:`,
//         error?.message ?? String(error)
//       );
//       if (error?.stack) console.log("   stack:", error.stack);
//       // Fatal errors can kill the process before the 1s log batch would
//       // have flushed on its own — force it out immediately so this exact
//       // moment is never the reason logs are missing.
//       void flushLogsNow();
//       previousHandler?.(error, isFatal);
//     });
//     console.log("🛡️ Global error handler installed");
//   } else {
//     console.log("⚠️ ErrorUtils not available — global handler not installed");
//   }

//   try {
//     const rejectionTracking = require("promise/setimmediate/rejection-tracking");
//     rejectionTracking.enable({
//       allRejections: true,
//       onUnhandled: (id: number, error: any) => {
//         console.log("🔥 UNHANDLED PROMISE REJECTION:", error?.message ?? String(error));
//         if (error?.stack) console.log("   stack:", error.stack);
//         void flushLogsNow();
//       },
//       onHandled: () => {},
//     });
//     console.log("🛡️ Unhandled promise rejection tracking enabled");
//   } catch (err) {
//     console.log("⚠️ Promise rejection tracking unavailable:", String(err));
//   }
// })();

// // ─── Timeout wrapper ──────────────────────────────────────────────────────────
// function withTimeout<T>(
//   promise: Promise<T>,
//   ms: number,
//   fallback: T,
//   label: string
// ): Promise<T> {
//   return Promise.race([
//     promise.catch((err) => {
//       logErr(`${label} threw before timeout`, err);
//       return fallback;
//     }),
//     new Promise<T>((resolve) => {
//       setTimeout(() => {
//         console.log(`⏱️ Timeout hit for: ${label} — using fallback`);
//         resolve(fallback);
//       }, ms);
//     }),
//   ]);
// }

// // ─── NEW: shared tracking mutex ──────────────────────────────────────────────
// // startBackgroundTracking and forceRestartTracking each used to have their own
// // independent in-flight guard (startInFlight / no guard at all on
// // forceRestartTracking). That meant a foreground AppState trigger
// // (ensureTrackingHealthy -> forceRestartTracking) and a component-mount trigger
// // (TabLayout's effect -> startBackgroundTracking) could run at the exact same
// // time and both call Location.startLocationUpdatesAsync() for the same
// // LOCATION_TASK within milliseconds of each other. Both calls "succeed" from
// // the JS side, but the underlying native FusedLocationProviderClient
// // registration gets corrupted (confirmed via logs: task callbacks never fire
// // again after this happens). This mutex forces every start/restart/stop
// // operation onto a single queue so only one can ever be touching the native
// // location task at a time, no matter which code path triggered it.
// let trackingMutex: Promise<void> = Promise.resolve();

// function withTrackingMutex<T>(label: string, fn: () => Promise<T>): Promise<T> {
//   const run = trackingMutex.then(
//     () => {
//       console.log(`🔒 [mutex] entering: ${label}`);
//       return fn();
//     },
//     () => {
//       console.log(`🔒 [mutex] entering (after prior error): ${label}`);
//       return fn();
//     }
//   );

//   trackingMutex = run.then(
//     () => {
//       console.log(`🔓 [mutex] leaving: ${label}`);
//     },
//     () => {
//       console.log(`🔓 [mutex] leaving (error): ${label}`);
//     }
//   );

//   return run;
// }

// // ─── Notification handler ─────────────────────────────────────────────────────
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowBanner: true,
//     shouldShowList: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });

// export const requestNotificationPermissions = async () => {
//   console.log("▶️ requestNotificationPermissions: start");
//   try {
//     const { status } = await Notifications.requestPermissionsAsync();
//     console.log(
//       status === "granted"
//         ? "✅ Notification permission granted"
//         : `❌ Notification permission denied (status: ${status})`
//     );
//   } catch (err) {
//     logErr("Notification permission error", err);
//   }
// };

// async function sendLocalNotification(title: string, body: string) {
//   console.log("▶️ sendLocalNotification:", title);
//   try {
//     await Notifications.scheduleNotificationAsync({
//       content: {
//         title,
//         body,
//         sound: true,
//         priority: Notifications.AndroidNotificationPriority.MAX,
//       },
//       trigger: null,
//     });
//     console.log("✅ sendLocalNotification: scheduled");
//   } catch (err) {
//     logErr("sendLocalNotification error", err);
//   }
// }

// async function notifyGuardian(userId: string, title: string, body: string) {
//   console.log("▶️ notifyGuardian: start for user", userId);
//   try {
//     const { data: links, error } = await supabase
//       .from("help_app_guardian_links")
//       .select("guardian_id")
//       .eq("user_id", userId)
//       .eq("status", "approved");

//     if (error) {
//       logErr("notifyGuardian query error", error);
//       return;
//     }
//     if (!links || links.length === 0) {
//       console.log("⚠️ No approved guardian for user:", userId);
//       return;
//     }

//     for (const link of links) {
//       const guardianToken = await getPushTokenForUser(link.guardian_id);
//       if (!guardianToken) {
//         console.log("⚠️ No push token for guardian:", link.guardian_id);
//         continue;
//       }
//       await sendExpoPushNotification(guardianToken, title, body);
//       console.log("✅ Guardian notified:", link.guardian_id);
//     }
//   } catch (err) {
//     logErr("notifyGuardian error", err);
//   }
// }

// async function insertAlert(userId: string, alertType: string, message: string) {
//   console.log("▶️ insertAlert:", alertType);
//   try {
//     const { error } = await supabase.from("help_app_alerts").insert({
//       user_id: userId,
//       alert_type: alertType,
//       message,
//       created_at: new Date().toISOString(),
//     });
//     if (error) {
//       logErr("insertAlert DB error", error);
//       return;
//     }
//     console.log("✅ insertAlert: inserted");
//   } catch (err) {
//     logErr("insertAlert error", err);
//   }
// }

// function getDistanceInMeters(
//   lat1: number,
//   lon1: number,
//   lat2: number,
//   lon2: number
// ) {
//   const R = 6371000;
//   const dLat = ((lat2 - lat1) * Math.PI) / 180;
//   const dLon = ((lon2 - lon1) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos((lat1 * Math.PI) / 180) *
//       Math.cos((lat2 * Math.PI) / 180) *
//       Math.sin(dLon / 2) *
//       Math.sin(dLon / 2);
//   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// }

// async function loadSafeZones(userId: string) {
//   console.log("▶️ loadSafeZones: querying DB for", userId);
//   try {
//     const { data, error } = await supabase
//       .from("help_app_safe_zones")
//       .select("center_lat, center_lng, radius_meters")
//       .eq("user_id", userId)
//       .eq("active", true);
//     if (error) {
//       logErr("loadSafeZones query error", error);
//       return [];
//     }
//     console.log("✅ loadSafeZones: got", data?.length ?? 0, "zones");
//     return data || [];
//   } catch (err) {
//     logErr("loadSafeZones error", err);
//     return [];
//   }
// }

// async function loadHomeLocation(userId: string) {
//   console.log("▶️ loadHomeLocation: querying DB for", userId);
//   try {
//     const { data, error } = await supabase
//       .from("help_app_user_locations")
//       .select("lat, lng")
//       .eq("user_id", userId)
//       .eq("is_home", true)
//       .maybeSingle();
//     if (error) {
//       logErr("loadHomeLocation query error", error);
//       return null;
//     }
//     if (!data) {
//       console.log("⚠️ loadHomeLocation: no home location set");
//       return null;
//     }
//     console.log("✅ loadHomeLocation: found home location");
//     return { latitude: Number(data.lat), longitude: Number(data.lng) };
//   } catch (err) {
//     logErr("loadHomeLocation error", err);
//     return null;
//   }
// }

// async function getCachedSafeZones(userId: string) {
//   try {
//     const cached = await AsyncStorage.getItem("CACHED_SAFE_ZONES");
//     const cachedAt = Number(
//       (await AsyncStorage.getItem("CACHED_ZONES_AT")) ?? 0
//     );
//     if (cached && Date.now() - cachedAt < CACHE_TTL_MS) {
//       return JSON.parse(cached);
//     }
//     const fresh = await loadSafeZones(userId);
//     await AsyncStorage.setItem("CACHED_SAFE_ZONES", JSON.stringify(fresh));
//     await AsyncStorage.setItem("CACHED_ZONES_AT", String(Date.now()));
//     return fresh;
//   } catch (err) {
//     logErr("getCachedSafeZones error", err);
//     return [];
//   }
// }

// async function getCachedHomeLocation(userId: string) {
//   try {
//     const cached = await AsyncStorage.getItem("CACHED_HOME_LOCATION");
//     const cachedAt = Number(
//       (await AsyncStorage.getItem("CACHED_HOME_AT")) ?? 0
//     );
//     if (cached && Date.now() - cachedAt < CACHE_TTL_MS) {
//       return JSON.parse(cached);
//     }
//     const fresh = await loadHomeLocation(userId);
//     if (fresh) {
//       await AsyncStorage.setItem(
//         "CACHED_HOME_LOCATION",
//         JSON.stringify(fresh)
//       );
//       await AsyncStorage.setItem("CACHED_HOME_AT", String(Date.now()));
//     }
//     return fresh;
//   } catch (err) {
//     logErr("getCachedHomeLocation error", err);
//     return null;
//   }
// }

// // NOTE: is_live is intentionally set to false here — this writer is the
// // background task path, not the live-dot path (see pushLiveLocation in
// // TakeMeHomeScreen, which should set is_live: true on its inserts). Fixing
// // this is tracked separately; flagging inline since it's touched here.
// async function saveLocationToSupabase(
//   userId: string,
//   latitude: number,
//   longitude: number
// ) {
//   console.log("▶️ saveLocationToSupabase: start");
//   try {
//     const lastSaved = Number(
//       (await AsyncStorage.getItem("LAST_SAVED_AT")) ?? 0
//     );
//     if (Date.now() - lastSaved < SAVE_THROTTLE_MS) {
//       console.log("⏩ Location save throttled — skipping");
//       return;
//     }

//     const { error } = await supabase.from("help_app_user_locations").insert({
//       user_id: userId,
//       lat: latitude,
//       lng: longitude,
//       is_home: false,
//       is_live: false,
//       recorded_at: new Date().toISOString(),
//     });

//     if (error) {
//       logErr("saveLocationToSupabase insert error", error);
//       return;
//     }

//     await AsyncStorage.setItem("LAST_SAVED_AT", String(Date.now()));
//     console.log("💾 Location inserted:", latitude, longitude);
//   } catch (err) {
//     logErr("saveLocationToSupabase error", err);
//   }
// }

// async function isCoolingDown(key: string): Promise<boolean> {
//   try {
//     const lastSent = Number((await AsyncStorage.getItem(key)) ?? 0);
//     return Date.now() - lastSent < NOTIFICATION_COOLDOWN_MS;
//   } catch (err) {
//     logErr(`isCoolingDown error (${key})`, err);
//     return false;
//   }
// }

// async function markNotificationSent(key: string) {
//   try {
//     await AsyncStorage.setItem(key, String(Date.now()));
//   } catch (err) {
//     logErr(`markNotificationSent error (${key})`, err);
//   }
// }

// // ─── Session token freshness check ─────────────────────────────────────────
// async function ensureFreshSession(): Promise<void> {
//   try {
//     const { data } = await withTimeout(
//       supabase.auth.getSession(),
//       5000,
//       { data: { session: null } } as any,
//       "getSession"
//     );
//     const session = data?.session;

//     if (!session) {
//       console.log("⚠️ ensureFreshSession: no session found");
//       return;
//     }

//     if (!session.expires_at) {
//       console.log("⚠️ ensureFreshSession: session has no expires_at — skipping check");
//       return;
//     }

//     const secondsUntilExpiry = session.expires_at - Date.now() / 1000;
//     console.log(`🔑 Session expires in ${Math.round(secondsUntilExpiry)}s`);

//     if (secondsUntilExpiry < TOKEN_REFRESH_MARGIN_SECONDS) {
//       console.log("🔄 Token expiring soon — refreshing session");
//       const { error: refreshError } = await withTimeout(
//         supabase.auth.refreshSession(),
//         8000,
//         { error: new Error("refreshSession timed out") } as any,
//         "refreshSession"
//       );
//       if (refreshError) {
//         logErr("Token refresh failed", refreshError);
//       } else {
//         console.log("✅ Session refreshed");
//       }
//     }
//   } catch (err) {
//     logErr("ensureFreshSession error", err);
//   }
// }

// // ─── BACKGROUND TASK ─────────────────────────────────────────────────────────
// TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
//   console.log("🔔 Task callback invoked:", new Date().toISOString());

//   try {
//     if (error) {
//       logErr("Background Task Error (from TaskManager)", error);
//       return;
//     }
//     if (!data) {
//       console.log("⚠️ Task invoked with no data payload — skipping");
//       return;
//     }

//     const { locations } = data as any;
//     console.log("📦 Locations array length:", locations?.length ?? 0);

//     const location = locations?.[0];
//     if (!location) {
//       console.log("⚠️ Task invoked but locations array was empty — skipping");
//       return;
//     }

//     const { latitude, longitude } = location.coords;
//     console.log("🟢 BACKGROUND TASK TRIGGERED:", new Date().toISOString());
//     console.log("📍 Coords:", latitude, longitude);

//     await withTimeout(
//       AsyncStorage.setItem(
//         "LAST_LOCATION",
//         JSON.stringify({
//           latitude,
//           longitude,
//           timestamp: new Date().toISOString(),
//         })
//       ),
//       5000,
//       undefined,
//       "write LAST_LOCATION"
//     );
//     console.log("💾 LAST_LOCATION written to AsyncStorage");

//     const userId = await withTimeout(
//       AsyncStorage.getItem("CURRENT_USER_ID"),
//       5000,
//       null,
//       "read CURRENT_USER_ID"
//     );
//     if (!userId) {
//       console.log("⚠️ No userId in background task — skipping");
//       return;
//     }
//     console.log("👤 userId:", userId);

//     await ensureFreshSession();

//     console.log("⏳ Loading zones + home (with timeout guards)...");
//     const [safeZones, homeLocation] = await Promise.all([
//       withTimeout(getCachedSafeZones(userId), 5000, [], "safeZones"),
//       withTimeout(getCachedHomeLocation(userId), 5000, null, "homeLocation"),
//     ]);
//     console.log(
//       "✅ Zones loaded:", safeZones.length,
//       "| home set:", !!homeLocation
//     );

//     await withTimeout(
//       saveLocationToSupabase(userId, latitude, longitude),
//       8000,
//       undefined,
//       "saveLocation"
//     );

//     if (safeZones.length > 0) {
//       await withTimeout(
//         (async () => {
//           const insideAnyZone = safeZones.some(
//             (zone: any) =>
//               getDistanceInMeters(
//                 latitude,
//                 longitude,
//                 zone.center_lat,
//                 zone.center_lng
//               ) <= zone.radius_meters
//           );

//           const alreadyBreached = await AsyncStorage.getItem(
//             "GEOFENCE_BREACHED"
//           );

//           if (!insideAnyZone && !alreadyBreached) {
//             const coolingDown = await isCoolingDown("ZONE_ALERT_LAST_SENT");
//             if (!coolingDown) {
//               console.log("🚨 Safe zone breach detected — notifying");
//               await AsyncStorage.setItem("GEOFENCE_BREACHED", "true");
//               const title = "🚨 Safe Zone Alert";
//               const userBody = "You have crossed outside the safe zone!";
//               const guardianBody =
//                 "Your linked user has crossed outside the safe zone!";
//               await sendLocalNotification(title, userBody);
//               await notifyGuardian(userId, title, guardianBody);
//               await insertAlert(userId, "zone_exit", guardianBody);
//               await markNotificationSent("ZONE_ALERT_LAST_SENT");
//             } else {
//               console.log("⏩ Zone alert cooling down — skipping notification");
//             }
//           } else if (insideAnyZone && alreadyBreached) {
//             await AsyncStorage.removeItem("GEOFENCE_BREACHED");
//             console.log("✅ User returned inside safe zone");
//           }
//         })(),
//         10000,
//         undefined,
//         "zone alert notify block"
//       );
//     }

//     if (homeLocation) {
//       await withTimeout(
//         (async () => {
//           const distFromHome = getDistanceInMeters(
//             latitude,
//             longitude,
//             homeLocation.latitude,
//             homeLocation.longitude
//           );

//           const alreadyLeftHome = await AsyncStorage.getItem("LEFT_HOME");

//           if (distFromHome > HOME_RADIUS_METERS && !alreadyLeftHome) {
//             const coolingDown = await isCoolingDown("HOME_ALERT_LAST_SENT");
//             if (!coolingDown) {
//               console.log("🏠 Left-home detected — notifying");
//               await AsyncStorage.setItem("LEFT_HOME", "true");
//               const title = "🏠 User Left Home";
//               const userBody = "You have left the home area.";
//               const guardianBody = "Your linked user has left the home area.";
//               await sendLocalNotification(title, userBody);
//               await notifyGuardian(userId, title, guardianBody);
//               await insertAlert(userId, "zone_exit", `${guardianBody} (home)`);
//               await markNotificationSent("HOME_ALERT_LAST_SENT");
//             } else {
//               console.log("⏩ Home alert cooling down — skipping notification");
//             }
//           } else if (distFromHome <= HOME_RADIUS_METERS && alreadyLeftHome) {
//             await AsyncStorage.removeItem("LEFT_HOME");
//             console.log("✅ User returned home");
//           }
//         })(),
//         10000,
//         undefined,
//         "home alert notify block"
//       );
//     }

//     console.log("✅ Background task completed");
//   } catch (err) {
//     logErr("Background task error (outer catch)", err);
//   }
// });

// async function requestPermissionWithTimeout(
//   requestFn: () => Promise<{ status: string }>,
//   label: string,
//   timeoutMs = PERMISSION_TIMEOUT_MS
// ): Promise<boolean> {
//   console.log(`▶️ requestPermissionWithTimeout: ${label}`);
//   return new Promise((resolve) => {
//     const timer = setTimeout(() => {
//       console.log(`⏱️ ${label} permission timed out after ${timeoutMs}ms`);
//       resolve(false);
//     }, timeoutMs);
//     requestFn()
//       .then(({ status }) => {
//         clearTimeout(timer);
//         console.log(`${status === "granted" ? "✅" : "❌"} ${label} permission status:`, status);
//         resolve(status === "granted");
//       })
//       .catch((err) => {
//         clearTimeout(timer);
//         logErr(`${label} permission error`, err);
//         resolve(false);
//       });
//   });
// }

// const TRACKING_OPTIONS: Location.LocationTaskOptions = {
//   accuracy: Location.Accuracy.Balanced,
//   timeInterval: 10000,
//   distanceInterval: 0,
//   showsBackgroundLocationIndicator: true,
//   foregroundService: {
//     notificationTitle: "Safety Monitoring Active",
//     notificationBody: "Your location is monitored for safety.",
//   },
// };

// async function _startLocationUpdates(userId: string): Promise<boolean> {
//   console.log("▶️ _startLocationUpdates: start for", userId);

//   const fgGranted = await requestPermissionWithTimeout(
//     () => Location.requestForegroundPermissionsAsync(),
//     "Foreground location"
//   );
//   if (!fgGranted) {
//     console.log("❌ _startLocationUpdates: aborting — foreground permission not granted");
//     return false;
//   }

//   const bgGranted = await requestPermissionWithTimeout(
//     () => Location.requestBackgroundPermissionsAsync(),
//     "Background location"
//   );
//   if (!bgGranted) {
//     console.log("❌ _startLocationUpdates: aborting — background permission not granted");
//     return false;
//   }

//   await requestNotificationPermissions();

//   try {
//     const { saveExpoPushToken } = await import("@/services/pushToken");
//     await saveExpoPushToken();
//     console.log("✅ _startLocationUpdates: push token saved");
//   } catch (err) {
//     logErr("_startLocationUpdates: saveExpoPushToken error", err);
//   }

//   try {
//     await Promise.all([
//       getCachedSafeZones(userId),
//       getCachedHomeLocation(userId),
//     ]);
//     console.log("✅ _startLocationUpdates: initial cache warm-up done");
//   } catch (err) {
//     logErr("_startLocationUpdates: cache warm-up error", err);
//   }

//   try {
//     console.log("▶️ Calling Location.startLocationUpdatesAsync...");
//     await Location.startLocationUpdatesAsync(LOCATION_TASK, TRACKING_OPTIONS);
//     console.log("✅ Location.startLocationUpdatesAsync succeeded");
//   } catch (err) {
//     logErr("Location.startLocationUpdatesAsync FAILED", err);
//     return false;
//   }

//   return true;
// }

// // ─── NEW: stopBackgroundTracking now polls instead of trusting a flat sleep ──
// // Location.stopLocationUpdatesAsync() resolving does not guarantee the OS
// // (especially Samsung/One UI) has actually released the underlying
// // FusedLocationProviderClient registration yet. Polling
// // hasStartedLocationUpdatesAsync() until it genuinely reports false (or we
// // hit a timeout) is a much stronger guarantee than a fixed 1000ms sleep.
// async function waitUntilFullyStopped(timeoutMs = 5000, pollIntervalMs = 250): Promise<boolean> {
//   const start = Date.now();
//   while (Date.now() - start < timeoutMs) {
//     try {
//       const stillStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
//       if (!stillStarted) {
//         console.log(`✅ waitUntilFullyStopped: confirmed stopped after ${Date.now() - start}ms`);
//         return true;
//       }
//     } catch (err) {
//       logErr("waitUntilFullyStopped: hasStartedLocationUpdatesAsync error", err);
//       // If we can't even check, don't spin forever — treat as stopped enough to proceed.
//       return true;
//     }
//     await new Promise((res) => setTimeout(res, pollIntervalMs));
//   }
//   console.log(`⚠️ waitUntilFullyStopped: timed out after ${timeoutMs}ms — proceeding anyway`);
//   return false;
// }

// export const stopBackgroundTracking = async () => {
//   console.log("▶️ stopBackgroundTracking: called");
//   try {
//     const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
//     if (!started) {
//       console.log("ℹ️ Background tracking already stopped");
//       return;
//     }
//     await Location.stopLocationUpdatesAsync(LOCATION_TASK);
//     console.log("🛑 Background tracking stopped (awaiting OS confirmation...)");
//     await waitUntilFullyStopped();
//   } catch (err) {
//     logErr("stopBackgroundTracking error", err);
//   }
// };

// // ─── startBackgroundTracking — now routed through the shared mutex ──────────
// export const startBackgroundTracking = async (userId: string) => {
//   return withTrackingMutex("startBackgroundTracking", async () => {
//     console.log("▶️ startBackgroundTracking: called for", userId);
//     try {
//       await AsyncStorage.setItem("CURRENT_USER_ID", userId);
//       await AsyncStorage.multiRemove(["GEOFENCE_BREACHED", "LEFT_HOME"]);

//       const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
//       if (isRegistered) {
//         console.log("✅ Task already running — skipping re-registration");
//         return;
//       }

//       const started = await _startLocationUpdates(userId);
//       console.log(
//         started
//           ? `✅ Background tracking started for user: ${userId}`
//           : `❌ Background tracking FAILED to start for user: ${userId}`
//       );
//     } catch (err) {
//       logErr("startBackgroundTracking error", err);
//     }
//   });
// };

// // ─── forceRestartTracking — now routed through the SAME shared mutex ────────
// // This used to have no in-flight guard at all, which was the direct cause of
// // the confirmed race: it could run concurrently with startBackgroundTracking
// // and both would call Location.startLocationUpdatesAsync() for the same task
// // within milliseconds of each other. Now both functions serialize through
// // trackingMutex, so whichever one is second will simply wait its turn — and
// // by the time it runs, isTaskRegisteredAsync will correctly reflect the
// // other one's completed work.
// export const forceRestartTracking = async (userId: string) => {
//   return withTrackingMutex("forceRestartTracking", async () => {
//     console.log("🔄 forceRestartTracking: called for", userId);
//     await stopBackgroundTracking();

//     await AsyncStorage.multiRemove([
//       "GEOFENCE_BREACHED",
//       "LEFT_HOME",
//       "LAST_SAVED_AT",
//       "CACHED_SAFE_ZONES",
//       "CACHED_ZONES_AT",
//       "CACHED_HOME_LOCATION",
//       "CACHED_HOME_AT",
//       "ZONE_ALERT_LAST_SENT",
//       "HOME_ALERT_LAST_SENT",
//     ]);

//     await AsyncStorage.setItem("CURRENT_USER_ID", userId);

//     const started = await _startLocationUpdates(userId);
//     console.log(
//       started
//         ? `✅ Background tracking force restarted for user: ${userId}`
//         : "❌ Force restart failed — see logs above for the specific step that failed"
//     );
//   });
// };

// export const invalidateLocationCache = async () => {
//   console.log("▶️ invalidateLocationCache: called");
//   try {
//     await AsyncStorage.multiRemove([
//       "CACHED_SAFE_ZONES",
//       "CACHED_ZONES_AT",
//       "CACHED_HOME_LOCATION",
//       "CACHED_HOME_AT",
//     ]);
//     console.log("🗑️ Location cache invalidated");
//   } catch (err) {
//     logErr("invalidateLocationCache error", err);
//   }
// };

// const STALE_THRESHOLD_MS = 15 * 60 * 1000;
// let healthCheckInFlight = false;

// export const ensureTrackingHealthy = async (userId: string) => {
//   if (healthCheckInFlight) {
//     console.log("⏩ ensureTrackingHealthy already in-flight — skipping duplicate call");
//     return;
//   }
//   healthCheckInFlight = true;
//   console.log("▶️ ensureTrackingHealthy: checking for", userId);
//   try {
//     const lastLocationRaw = await AsyncStorage.getItem("LAST_LOCATION");
//     const lastLocation = lastLocationRaw ? JSON.parse(lastLocationRaw) : null;
//     const lastTimestamp = lastLocation
//       ? new Date(lastLocation.timestamp).getTime()
//       : 0;
//     const staleness = Date.now() - lastTimestamp;

//     const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
//     console.log("   isRegistered:", isRegistered, "| staleness (s):", Math.round(staleness / 1000));

//     if (!isRegistered) {
//       console.log("⚠️ Task not registered — starting fresh");
//       await startBackgroundTracking(userId);
//       return;
//     }

//     if (!lastTimestamp || staleness > STALE_THRESHOLD_MS) {
//       console.log(
//         `⚠️ Tracking stale (${Math.round(staleness / 1000)}s since last update) — force restarting`
//       );
//       await forceRestartTracking(userId);
//       return;
//     }

//     console.log(
//       `✅ Tracking healthy — last update ${Math.round(staleness / 1000)}s ago`
//     );
//   } catch (err) {
//     logErr("ensureTrackingHealthy error", err);
//   } finally {
//     healthCheckInFlight = false;
//   }
// };






import { installPersistentLogging, flushLogsNow } from "@/services/debugLogger";
installPersistentLogging();

import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/supabase/supabase";
import {
  getPushTokenForUser,
  sendExpoPushNotification,
} from "@/services/pushToken";

// NOTE ON WHY THIS IS AT THE VERY TOP:
// index.js imports this file (services/backgroundLocation) BEFORE
// expo-router/entry. That means installPersistentLogging() runs before any
// screen, any other service, or the router itself has logged a single line —
// so every console.log/warn/error in the ENTIRE app, not just this file,
// gets captured to the persistent log file from the first millisecond of
// the JS process. This is what makes "every detail" actually true, not just
// true for this one file.

// ─── Constants ────────────────────────────────────────────────────────────────
export const LOCATION_TASK = "help-app-background-location";
const HOME_RADIUS_METERS = 50;
const CACHE_TTL_MS = 10 * 60 * 1000;       // 10 minutes
const SAVE_THROTTLE_MS = 2 * 60 * 1000;    // save location every 2 min max
const PERMISSION_TIMEOUT_MS = 10000;
const NOTIFICATION_COOLDOWN_MS = 10 * 60 * 1000; // 10 min between repeat alerts
const TOKEN_REFRESH_MARGIN_SECONDS = 300; // refresh if expiring within 5 min

// NEW: dedicated timeout for the session-refresh check specifically. Kept
// short and separate from other withTimeout calls so it's obvious in the
// logs which timeout fired, and so this one call can't eat a large chunk of
// the task's execution budget before the OS decides to suspend the JS
// thread mid-await (see ensureFreshSession below for the full story).
const SESSION_CHECK_TIMEOUT_MS = 4000;

// ─── Error logging helper ─────────────────────────────────────────────────────
function logErr(label: string, err: unknown) {
  if (err instanceof Error) {
    console.log(`❌ ${label}:`, err.message);
    if (err.stack) console.log(`   stack:`, err.stack);
  } else if (err && typeof err === "object") {
    try {
      console.log(`❌ ${label}:`, JSON.stringify(err));
    } catch {
      console.log(`❌ ${label}: [unserializable error object]`, err);
    }
  } else {
    console.log(`❌ ${label}:`, String(err));
  }
}

// ─── Global uncaught error safety net ────────────────────────────────────────
(function installGlobalErrorHandlers() {
  const g = global as any;

  if (g.ErrorUtils?.setGlobalHandler) {
    const previousHandler = g.ErrorUtils.getGlobalHandler?.();
    g.ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
      console.log(
        `🔥 GLOBAL UNCAUGHT ${isFatal ? "FATAL" : "NON-FATAL"} ERROR:`,
        error?.message ?? String(error)
      );
      if (error?.stack) console.log("   stack:", error.stack);
      // Fatal errors can kill the process before the 1s log batch would
      // have flushed on its own — force it out immediately so this exact
      // moment is never the reason logs are missing.
      void flushLogsNow();
      previousHandler?.(error, isFatal);
    });
    console.log("🛡️ Global error handler installed");
  } else {
    console.log("⚠️ ErrorUtils not available — global handler not installed");
  }

  try {
    const rejectionTracking = require("promise/setimmediate/rejection-tracking");
    rejectionTracking.enable({
      allRejections: true,
      onUnhandled: (id: number, error: any) => {
        console.log("🔥 UNHANDLED PROMISE REJECTION:", error?.message ?? String(error));
        if (error?.stack) console.log("   stack:", error.stack);
        void flushLogsNow();
      },
      onHandled: () => {},
    });
    console.log("🛡️ Unhandled promise rejection tracking enabled");
  } catch (err) {
    console.log("⚠️ Promise rejection tracking unavailable:", String(err));
  }
})();

// ─── Timeout wrapper ──────────────────────────────────────────────────────────
// KNOWN LIMITATION (documented, not fixed here — can't be fixed in JS alone):
// if Android suspends the entire JS thread mid-await (not just the awaited
// promise, but the whole runtime, including pending setTimeout timers), this
// race can't resolve until the JS thread resumes, because the "rescuing"
// setTimeout is just as stuck as the promise it's meant to rescue. This is
// why the real fix in this update is architectural (do the critical write
// FIRST, before anything that's likely to hang), not just tightening timeouts.
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T,
  label: string
): Promise<T> {
  return Promise.race([
    promise.catch((err) => {
      logErr(`${label} threw before timeout`, err);
      return fallback;
    }),
    new Promise<T>((resolve) => {
      setTimeout(() => {
        console.log(`⏱️ Timeout hit for: ${label} — using fallback`);
        resolve(fallback);
      }, ms);
    }),
  ]);
}

// ─── shared tracking mutex ──────────────────────────────────────────────────
// startBackgroundTracking and forceRestartTracking each used to have their own
// independent in-flight guard (startInFlight / no guard at all on
// forceRestartTracking). That meant a foreground AppState trigger
// (ensureTrackingHealthy -> forceRestartTracking) and a component-mount trigger
// (TabLayout's effect -> startBackgroundTracking) could run at the exact same
// time and both call Location.startLocationUpdatesAsync() for the same
// LOCATION_TASK within milliseconds of each other. Both calls "succeed" from
// the JS side, but the underlying native FusedLocationProviderClient
// registration gets corrupted (confirmed via logs: task callbacks never fire
// again after this happens). This mutex forces every start/restart/stop
// operation onto a single queue so only one can ever be touching the native
// location task at a time, no matter which code path triggered it.
let trackingMutex: Promise<void> = Promise.resolve();

function withTrackingMutex<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const run = trackingMutex.then(
    () => {
      console.log(`🔒 [mutex] entering: ${label}`);
      return fn();
    },
    () => {
      console.log(`🔒 [mutex] entering (after prior error): ${label}`);
      return fn();
    }
  );

  trackingMutex = run.then(
    () => {
      console.log(`🔓 [mutex] leaving: ${label}`);
    },
    () => {
      console.log(`🔓 [mutex] leaving (error): ${label}`);
    }
  );

  return run;
}

// ─── Notification handler ─────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const requestNotificationPermissions = async () => {
  console.log("▶️ requestNotificationPermissions: start");
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    console.log(
      status === "granted"
        ? "✅ Notification permission granted"
        : `❌ Notification permission denied (status: ${status})`
    );
  } catch (err) {
    logErr("Notification permission error", err);
  }
};

async function sendLocalNotification(title: string, body: string) {
  console.log("▶️ sendLocalNotification:", title);
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
    console.log("✅ sendLocalNotification: scheduled");
  } catch (err) {
    logErr("sendLocalNotification error", err);
  }
}

async function notifyGuardian(userId: string, title: string, body: string) {
  console.log("▶️ notifyGuardian: start for user", userId);
  try {
    const { data: links, error } = await supabase
      .from("help_app_guardian_links")
      .select("guardian_id")
      .eq("user_id", userId)
      .eq("status", "approved");

    if (error) {
      logErr("notifyGuardian query error", error);
      return;
    }
    if (!links || links.length === 0) {
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
    logErr("notifyGuardian error", err);
  }
}

async function insertAlert(userId: string, alertType: string, message: string) {
  console.log("▶️ insertAlert:", alertType);
  try {
    const { error } = await supabase.from("help_app_alerts").insert({
      user_id: userId,
      alert_type: alertType,
      message,
      created_at: new Date().toISOString(),
    });
    if (error) {
      logErr("insertAlert DB error", error);
      return;
    }
    console.log("✅ insertAlert: inserted");
  } catch (err) {
    logErr("insertAlert error", err);
  }
}

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

async function loadSafeZones(userId: string) {
  console.log("▶️ loadSafeZones: querying DB for", userId);
  try {
    const { data, error } = await supabase
      .from("help_app_safe_zones")
      .select("center_lat, center_lng, radius_meters")
      .eq("user_id", userId)
      .eq("active", true);
    if (error) {
      logErr("loadSafeZones query error", error);
      return [];
    }
    console.log("✅ loadSafeZones: got", data?.length ?? 0, "zones");
    return data || [];
  } catch (err) {
    logErr("loadSafeZones error", err);
    return [];
  }
}

async function loadHomeLocation(userId: string) {
  console.log("▶️ loadHomeLocation: querying DB for", userId);
  try {
    const { data, error } = await supabase
      .from("help_app_user_locations")
      .select("lat, lng")
      .eq("user_id", userId)
      .eq("is_home", true)
      .maybeSingle();
    if (error) {
      logErr("loadHomeLocation query error", error);
      return null;
    }
    if (!data) {
      console.log("⚠️ loadHomeLocation: no home location set");
      return null;
    }
    console.log("✅ loadHomeLocation: found home location");
    return { latitude: Number(data.lat), longitude: Number(data.lng) };
  } catch (err) {
    logErr("loadHomeLocation error", err);
    return null;
  }
}

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
  } catch (err) {
    logErr("getCachedSafeZones error", err);
    return [];
  }
}

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
  } catch (err) {
    logErr("getCachedHomeLocation error", err);
    return null;
  }
}

// NOTE: is_live is intentionally set to false here — this writer is the
// background task path, not the live-dot path (see pushLiveLocation in
// TakeMeHomeScreen, which should set is_live: true on its inserts). Fixing
// this is tracked separately; flagging inline since it's touched here.
async function saveLocationToSupabase(
  userId: string,
  latitude: number,
  longitude: number
) {
  console.log("▶️ saveLocationToSupabase: start");
  try {
    const lastSaved = Number(
      (await AsyncStorage.getItem("LAST_SAVED_AT")) ?? 0
    );
    if (Date.now() - lastSaved < SAVE_THROTTLE_MS) {
      console.log("⏩ Location save throttled — skipping");
      return;
    }

    const { error } = await supabase.from("help_app_user_locations").insert({
      user_id: userId,
      lat: latitude,
      lng: longitude,
      is_home: false,
      is_live: false,
      recorded_at: new Date().toISOString(),
    });

    if (error) {
      logErr("saveLocationToSupabase insert error", error);
      return;
    }

    await AsyncStorage.setItem("LAST_SAVED_AT", String(Date.now()));
    console.log("💾 Location inserted:", latitude, longitude);
  } catch (err) {
    logErr("saveLocationToSupabase error", err);
  }
}

async function isCoolingDown(key: string): Promise<boolean> {
  try {
    const lastSent = Number((await AsyncStorage.getItem(key)) ?? 0);
    return Date.now() - lastSent < NOTIFICATION_COOLDOWN_MS;
  } catch (err) {
    logErr(`isCoolingDown error (${key})`, err);
    return false;
  }
}

async function markNotificationSent(key: string) {
  try {
    await AsyncStorage.setItem(key, String(Date.now()));
  } catch (err) {
    logErr(`markNotificationSent error (${key})`, err);
  }
}

// ─── Session token freshness check ─────────────────────────────────────────
// CHANGED: added a log line immediately before the getSession() call itself
// (🔑 calling getSession), separate from the "session expires in Xs" log
// that only fires AFTER it resolves. Previously there was no log between
// "start" and "expires in" — if getSession() hung, there was no way to tell
// from the logs whether it was this call specifically, or something before
// it, that never returned. Now if logs stop right after "calling getSession"
// and never reach anything past it, that's unambiguous confirmation this
// exact call is what's hanging.
async function ensureFreshSession(): Promise<void> {
  console.log("▶️ ensureFreshSession: start");
  try {
    console.log("🔑 calling getSession");
    const { data } = await withTimeout(
      supabase.auth.getSession(),
      SESSION_CHECK_TIMEOUT_MS,
      { data: { session: null } } as any,
      "getSession"
    );
    console.log("🔑 getSession call returned");
    const session = data?.session;

    if (!session) {
      console.log("⚠️ ensureFreshSession: no session found");
      return;
    }

    if (!session.expires_at) {
      console.log("⚠️ ensureFreshSession: session has no expires_at — skipping check");
      return;
    }

    const secondsUntilExpiry = session.expires_at - Date.now() / 1000;
    console.log(`🔑 Session expires in ${Math.round(secondsUntilExpiry)}s`);

    if (secondsUntilExpiry < TOKEN_REFRESH_MARGIN_SECONDS) {
      console.log("🔄 Token expiring soon — refreshing session");
      const { error: refreshError } = await withTimeout(
        supabase.auth.refreshSession(),
        8000,
        { error: new Error("refreshSession timed out") } as any,
        "refreshSession"
      );
      if (refreshError) {
        logErr("Token refresh failed", refreshError);
      } else {
        console.log("✅ Session refreshed");
      }
    }
  } catch (err) {
    logErr("ensureFreshSession error", err);
  }
}

// ─── BACKGROUND TASK ─────────────────────────────────────────────────────────
// CHANGED (the actual fix): saveLocationToSupabase now runs immediately after
// we have userId + coords, BEFORE ensureFreshSession() and BEFORE the zone/home
// cache loading. Previously the order was:
//   userId -> ensureFreshSession() -> load zones/home -> saveLocationToSupabase
// which meant a hang anywhere in that middle stretch (confirmed: inside
// ensureFreshSession, specifically the getSession() call) permanently blocked
// the one write that actually matters, every single time, forever. The
// insert is now the very next thing that happens after we know who the user
// is, so a hang in session-refresh or zone-loading can no longer prevent the
// location from being saved. Session refresh and zone/home alerts still run
// afterward, wrapped the same way as before, but they can now fail or hang
// without taking the location save down with them.
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  console.log("🔔 Task callback invoked:", new Date().toISOString());

  try {
    if (error) {
      logErr("Background Task Error (from TaskManager)", error);
      return;
    }
    if (!data) {
      console.log("⚠️ Task invoked with no data payload — skipping");
      return;
    }

    const { locations } = data as any;
    console.log("📦 Locations array length:", locations?.length ?? 0);

    const location = locations?.[0];
    if (!location) {
      console.log("⚠️ Task invoked but locations array was empty — skipping");
      return;
    }

    const { latitude, longitude } = location.coords;
    console.log("🟢 BACKGROUND TASK TRIGGERED:", new Date().toISOString());
    console.log("📍 Coords:", latitude, longitude);

    await withTimeout(
      AsyncStorage.setItem(
        "LAST_LOCATION",
        JSON.stringify({
          latitude,
          longitude,
          timestamp: new Date().toISOString(),
        })
      ),
      5000,
      undefined,
      "write LAST_LOCATION"
    );
    console.log("💾 LAST_LOCATION written to AsyncStorage");

    const userId = await withTimeout(
      AsyncStorage.getItem("CURRENT_USER_ID"),
      5000,
      null,
      "read CURRENT_USER_ID"
    );
    if (!userId) {
      console.log("⚠️ No userId in background task — skipping");
      return;
    }
    console.log("👤 userId:", userId);

    // ── PRIORITY WRITE: do this before anything that can hang ──────────────
    await withTimeout(
      saveLocationToSupabase(userId, latitude, longitude),
      8000,
      undefined,
      "saveLocation"
    );

    // ── Everything below is best-effort and must not block the save above ──
    await withTimeout(
      ensureFreshSession(),
      SESSION_CHECK_TIMEOUT_MS + 1000,
      undefined,
      "ensureFreshSession (outer)"
    );

    console.log("⏳ Loading zones + home (with timeout guards)...");
    const [safeZones, homeLocation] = await Promise.all([
      withTimeout(getCachedSafeZones(userId), 5000, [], "safeZones"),
      withTimeout(getCachedHomeLocation(userId), 5000, null, "homeLocation"),
    ]);
    console.log(
      "✅ Zones loaded:", safeZones.length,
      "| home set:", !!homeLocation
    );

    if (safeZones.length > 0) {
      await withTimeout(
        (async () => {
          const insideAnyZone = safeZones.some(
            (zone: any) =>
              getDistanceInMeters(
                latitude,
                longitude,
                zone.center_lat,
                zone.center_lng
              ) <= zone.radius_meters
          );

          const alreadyBreached = await AsyncStorage.getItem(
            "GEOFENCE_BREACHED"
          );

          if (!insideAnyZone && !alreadyBreached) {
            const coolingDown = await isCoolingDown("ZONE_ALERT_LAST_SENT");
            if (!coolingDown) {
              console.log("🚨 Safe zone breach detected — notifying");
              await AsyncStorage.setItem("GEOFENCE_BREACHED", "true");
              const title = "🚨 Safe Zone Alert";
              const userBody = "You have crossed outside the safe zone!";
              const guardianBody =
                "Your linked user has crossed outside the safe zone!";
              await sendLocalNotification(title, userBody);
              await notifyGuardian(userId, title, guardianBody);
              await insertAlert(userId, "zone_exit", guardianBody);
              await markNotificationSent("ZONE_ALERT_LAST_SENT");
            } else {
              console.log("⏩ Zone alert cooling down — skipping notification");
            }
          } else if (insideAnyZone && alreadyBreached) {
            await AsyncStorage.removeItem("GEOFENCE_BREACHED");
            console.log("✅ User returned inside safe zone");
          }
        })(),
        10000,
        undefined,
        "zone alert notify block"
      );
    }

    if (homeLocation) {
      await withTimeout(
        (async () => {
          const distFromHome = getDistanceInMeters(
            latitude,
            longitude,
            homeLocation.latitude,
            homeLocation.longitude
          );

          const alreadyLeftHome = await AsyncStorage.getItem("LEFT_HOME");

          if (distFromHome > HOME_RADIUS_METERS && !alreadyLeftHome) {
            const coolingDown = await isCoolingDown("HOME_ALERT_LAST_SENT");
            if (!coolingDown) {
              console.log("🏠 Left-home detected — notifying");
              await AsyncStorage.setItem("LEFT_HOME", "true");
              const title = "🏠 User Left Home";
              const userBody = "You have left the home area.";
              const guardianBody = "Your linked user has left the home area.";
              await sendLocalNotification(title, userBody);
              await notifyGuardian(userId, title, guardianBody);
              await insertAlert(userId, "zone_exit", `${guardianBody} (home)`);
              await markNotificationSent("HOME_ALERT_LAST_SENT");
            } else {
              console.log("⏩ Home alert cooling down — skipping notification");
            }
          } else if (distFromHome <= HOME_RADIUS_METERS && alreadyLeftHome) {
            await AsyncStorage.removeItem("LEFT_HOME");
            console.log("✅ User returned home");
          }
        })(),
        10000,
        undefined,
        "home alert notify block"
      );
    }

    console.log("✅ Background task completed");
  } catch (err) {
    logErr("Background task error (outer catch)", err);
  }
});

async function requestPermissionWithTimeout(
  requestFn: () => Promise<{ status: string }>,
  label: string,
  timeoutMs = PERMISSION_TIMEOUT_MS
): Promise<boolean> {
  console.log(`▶️ requestPermissionWithTimeout: ${label}`);
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.log(`⏱️ ${label} permission timed out after ${timeoutMs}ms`);
      resolve(false);
    }, timeoutMs);
    requestFn()
      .then(({ status }) => {
        clearTimeout(timer);
        console.log(`${status === "granted" ? "✅" : "❌"} ${label} permission status:`, status);
        resolve(status === "granted");
      })
      .catch((err) => {
        clearTimeout(timer);
        logErr(`${label} permission error`, err);
        resolve(false);
      });
  });
}

const TRACKING_OPTIONS: Location.LocationTaskOptions = {
  accuracy: Location.Accuracy.Balanced,
  timeInterval: 10000,
  distanceInterval: 0,
  showsBackgroundLocationIndicator: true,
  foregroundService: {
    notificationTitle: "Safety Monitoring Active",
    notificationBody: "Your location is monitored for safety.",
  },
};

async function _startLocationUpdates(userId: string): Promise<boolean> {
  console.log("▶️ _startLocationUpdates: start for", userId);

  const fgGranted = await requestPermissionWithTimeout(
    () => Location.requestForegroundPermissionsAsync(),
    "Foreground location"
  );
  if (!fgGranted) {
    console.log("❌ _startLocationUpdates: aborting — foreground permission not granted");
    return false;
  }

  const bgGranted = await requestPermissionWithTimeout(
    () => Location.requestBackgroundPermissionsAsync(),
    "Background location"
  );
  if (!bgGranted) {
    console.log("❌ _startLocationUpdates: aborting — background permission not granted");
    return false;
  }

  await requestNotificationPermissions();

  try {
    const { saveExpoPushToken } = await import("@/services/pushToken");
    await saveExpoPushToken();
    console.log("✅ _startLocationUpdates: push token saved");
  } catch (err) {
    logErr("_startLocationUpdates: saveExpoPushToken error", err);
  }

  try {
    await Promise.all([
      getCachedSafeZones(userId),
      getCachedHomeLocation(userId),
    ]);
    console.log("✅ _startLocationUpdates: initial cache warm-up done");
  } catch (err) {
    logErr("_startLocationUpdates: cache warm-up error", err);
  }

  try {
    console.log("▶️ Calling Location.startLocationUpdatesAsync...");
    await Location.startLocationUpdatesAsync(LOCATION_TASK, TRACKING_OPTIONS);
    console.log("✅ Location.startLocationUpdatesAsync succeeded");
  } catch (err) {
    logErr("Location.startLocationUpdatesAsync FAILED", err);
    return false;
  }

  return true;
}

// ─── stopBackgroundTracking — polls instead of trusting a flat sleep ────────
// Location.stopLocationUpdatesAsync() resolving does not guarantee the OS
// (especially Samsung/One UI) has actually released the underlying
// FusedLocationProviderClient registration yet. Polling
// hasStartedLocationUpdatesAsync() until it genuinely reports false (or we
// hit a timeout) is a much stronger guarantee than a fixed 1000ms sleep.
async function waitUntilFullyStopped(timeoutMs = 5000, pollIntervalMs = 250): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const stillStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
      if (!stillStarted) {
        console.log(`✅ waitUntilFullyStopped: confirmed stopped after ${Date.now() - start}ms`);
        return true;
      }
    } catch (err) {
      logErr("waitUntilFullyStopped: hasStartedLocationUpdatesAsync error", err);
      // If we can't even check, don't spin forever — treat as stopped enough to proceed.
      return true;
    }
    await new Promise((res) => setTimeout(res, pollIntervalMs));
  }
  console.log(`⚠️ waitUntilFullyStopped: timed out after ${timeoutMs}ms — proceeding anyway`);
  return false;
}

export const stopBackgroundTracking = async () => {
  console.log("▶️ stopBackgroundTracking: called");
  try {
    const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
    if (!started) {
      console.log("ℹ️ Background tracking already stopped");
      return;
    }
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
    console.log("🛑 Background tracking stopped (awaiting OS confirmation...)");
    await waitUntilFullyStopped();
  } catch (err) {
    logErr("stopBackgroundTracking error", err);
  }
};

// ─── startBackgroundTracking — routed through the shared mutex ─────────────
export const startBackgroundTracking = async (userId: string) => {
  return withTrackingMutex("startBackgroundTracking", async () => {
    console.log("▶️ startBackgroundTracking: called for", userId);
    try {
      await AsyncStorage.setItem("CURRENT_USER_ID", userId);
      await AsyncStorage.multiRemove(["GEOFENCE_BREACHED", "LEFT_HOME"]);

      const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
      if (isRegistered) {
        console.log("✅ Task already running — skipping re-registration");
        return;
      }

      const started = await _startLocationUpdates(userId);
      console.log(
        started
          ? `✅ Background tracking started for user: ${userId}`
          : `❌ Background tracking FAILED to start for user: ${userId}`
      );
    } catch (err) {
      logErr("startBackgroundTracking error", err);
    }
  });
};

// ─── forceRestartTracking — routed through the SAME shared mutex ───────────
// This used to have no in-flight guard at all, which was the direct cause of
// the confirmed race: it could run concurrently with startBackgroundTracking
// and both would call Location.startLocationUpdatesAsync() for the same task
// within milliseconds of each other. Now both functions serialize through
// trackingMutex, so whichever one is second will simply wait its turn — and
// by the time it runs, isTaskRegisteredAsync will correctly reflect the
// other one's completed work.
export const forceRestartTracking = async (userId: string) => {
  return withTrackingMutex("forceRestartTracking", async () => {
    console.log("🔄 forceRestartTracking: called for", userId);
    await stopBackgroundTracking();

    await AsyncStorage.multiRemove([
      "GEOFENCE_BREACHED",
      "LEFT_HOME",
      "LAST_SAVED_AT",
      "CACHED_SAFE_ZONES",
      "CACHED_ZONES_AT",
      "CACHED_HOME_LOCATION",
      "CACHED_HOME_AT",
      "ZONE_ALERT_LAST_SENT",
      "HOME_ALERT_LAST_SENT",
    ]);

    await AsyncStorage.setItem("CURRENT_USER_ID", userId);

    const started = await _startLocationUpdates(userId);
    console.log(
      started
        ? `✅ Background tracking force restarted for user: ${userId}`
        : "❌ Force restart failed — see logs above for the specific step that failed"
    );
  });
};

export const invalidateLocationCache = async () => {
  console.log("▶️ invalidateLocationCache: called");
  try {
    await AsyncStorage.multiRemove([
      "CACHED_SAFE_ZONES",
      "CACHED_ZONES_AT",
      "CACHED_HOME_LOCATION",
      "CACHED_HOME_AT",
    ]);
    console.log("🗑️ Location cache invalidated");
  } catch (err) {
    logErr("invalidateLocationCache error", err);
  }
};

const STALE_THRESHOLD_MS = 15 * 60 * 1000;
let healthCheckInFlight = false;

export const ensureTrackingHealthy = async (userId: string) => {
  if (healthCheckInFlight) {
    console.log("⏩ ensureTrackingHealthy already in-flight — skipping duplicate call");
    return;
  }
  healthCheckInFlight = true;
  console.log("▶️ ensureTrackingHealthy: checking for", userId);
  try {
    const lastLocationRaw = await AsyncStorage.getItem("LAST_LOCATION");
    const lastLocation = lastLocationRaw ? JSON.parse(lastLocationRaw) : null;
    const lastTimestamp = lastLocation
      ? new Date(lastLocation.timestamp).getTime()
      : 0;
    const staleness = Date.now() - lastTimestamp;

    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
    console.log("   isRegistered:", isRegistered, "| staleness (s):", Math.round(staleness / 1000));

    if (!isRegistered) {
      console.log("⚠️ Task not registered — starting fresh");
      await startBackgroundTracking(userId);
      return;
    }

    if (!lastTimestamp || staleness > STALE_THRESHOLD_MS) {
      console.log(
        `⚠️ Tracking stale (${Math.round(staleness / 1000)}s since last update) — force restarting`
      );
      await forceRestartTracking(userId);
      return;
    }

    console.log(
      `✅ Tracking healthy — last update ${Math.round(staleness / 1000)}s ago`
    );
  } catch (err) {
    logErr("ensureTrackingHealthy error", err);
  } finally {
    healthCheckInFlight = false;
  }
};