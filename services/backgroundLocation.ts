


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

// const SESSION_CHECK_TIMEOUT_MS = 4000;

// // NEW: keys for the locally-cached auth token used by the REST-bypass write
// // path (see saveLocationViaRestApi below). This is deliberately separate
// // from whatever key supabase-js itself uses to persist its session in
// // AsyncStorage — we maintain our own copy so the background task never has
// // to go through supabase-js's internal session-fetch/lock logic at all.
// const CACHED_ACCESS_TOKEN_KEY = "CACHED_SUPABASE_ACCESS_TOKEN";
// const CACHED_ACCESS_TOKEN_AT_KEY = "CACHED_SUPABASE_ACCESS_TOKEN_AT";

// const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
// const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

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
// // KNOWN LIMITATION (documented, not fully fixable in JS alone): if Android
// // suspends the entire JS thread mid-await, the rescuing setTimeout is just
// // as stuck as the promise it's meant to rescue. This is why the real fixes
// // in this file are architectural (do the critical write first, and avoid
// // code paths with internal locks/awaits we don't control), not just
// // tightening timeouts.
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

// // ─── shared tracking mutex ──────────────────────────────────────────────────
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

// // CHANGED: this now returns whether the permission is actually granted,
// // instead of firing the request and discarding the result. The whole
// // original bug (foreground service silently never registering with the OS)
// // was invisible for exactly this reason — the caller had no way to know
// // permission had been denied, so it proceeded as if everything was fine.
// //
// // Also checks the CURRENT status first via getPermissionsAsync() before
// // prompting. This matters because requestPermissionsAsync() is a no-op
// // re-prompt on Android once the user has already made a choice (granted or
// // denied) — Android will not show the system dialog a second time. Checking
// // current status first lets the caller distinguish "never asked" from
// // "already denied," which matters for what UI to show next (see
// // ensureNotificationPermission below).
// export const requestNotificationPermissions = async (): Promise<boolean> => {
//   console.log("▶️ requestNotificationPermissions: start");
//   try {
//     const existing = await Notifications.getPermissionsAsync();
//     if (existing.status === "granted") {
//       console.log("✅ Notification permission already granted");
//       return true;
//     }

//     const { status } = await Notifications.requestPermissionsAsync();
//     const granted = status === "granted";
//     console.log(
//       granted
//         ? "✅ Notification permission granted"
//         : `❌ Notification permission denied (status: ${status})`
//     );
//     return granted;
//   } catch (err) {
//     logErr("Notification permission error", err);
//     return false;
//   }
// };

// // NEW: single source of truth for "is notification permission usable right
// // now," combining the check + request + a stored flag the UI layer can read
// // to decide whether to show a settings-redirect prompt. Stored separately
// // from the OS permission state so the UI can distinguish "never checked"
// // from "checked and denied" across app restarts, without re-triggering the
// // (silent, no-op-on-Android) request every time.
// const NOTIFICATION_PERMISSION_DENIED_KEY = "NOTIFICATION_PERMISSION_WAS_DENIED";

// export async function ensureNotificationPermission(): Promise<boolean> {
//   const granted = await requestNotificationPermissions();
//   try {
//     if (granted) {
//       await AsyncStorage.removeItem(NOTIFICATION_PERMISSION_DENIED_KEY);
//     } else {
//       await AsyncStorage.setItem(NOTIFICATION_PERMISSION_DENIED_KEY, "true");
//     }
//   } catch (err) {
//     logErr("ensureNotificationPermission: flag write error", err);
//   }
//   return granted;
// }

// // NEW: lets the UI (e.g. a banner on the home screen) check without
// // re-triggering any permission flow, so it can show "tracking may be
// // unreliable — enable notifications" with a button to open system settings.
// export async function wasNotificationPermissionDenied(): Promise<boolean> {
//   try {
//     return (await AsyncStorage.getItem(NOTIFICATION_PERMISSION_DENIED_KEY)) === "true";
//   } catch (err) {
//     logErr("wasNotificationPermissionDenied error", err);
//     return false;
//   }
// }

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

// // ─── NEW: locally-cached access token, maintained OUTSIDE the background task ─
// // The whole point of this cache is that writing to it never happens on the
// // hang-prone path. Call cacheAccessTokenFromSession(...) from your app's
// // normal foreground auth-state listener (wherever you currently call
// // supabase.auth.onAuthStateChange), e.g.:
// //
// //   supabase.auth.onAuthStateChange((_event, session) => {
// //     cacheAccessTokenFromSession(session);
// //   });
// //
// // and also call it once right after any successful sign-in and after any
// // successful refreshSession() call. That way, by the time the background
// // task runs, a fresh token is almost always already sitting in AsyncStorage
// // with a plain, un-locked read — no auth/session logic involved at all.
// export async function cacheAccessTokenFromSession(session: { access_token?: string } | null) {
//   try {
//     if (!session?.access_token) return;
//     await AsyncStorage.setItem(CACHED_ACCESS_TOKEN_KEY, session.access_token);
//     await AsyncStorage.setItem(CACHED_ACCESS_TOKEN_AT_KEY, String(Date.now()));
//     console.log("🔐 cacheAccessTokenFromSession: token cached");
//   } catch (err) {
//     logErr("cacheAccessTokenFromSession error", err);
//   }
// }

// // ─── NEW: REST-bypass insert ─────────────────────────────────────────────────
// // WHY THIS EXISTS:
// // supabase-js's .from(...).insert(...) attaches an Authorization header by
// // internally reading the current session — which goes through the same
// // AsyncStorage-backed auth/session code path as supabase.auth.getSession().
// // That is the prime suspect for the second hang (saveLocationToSupabase
// // logging "start" but never completing, erroring, or timing out, even
// // though it now runs FIRST in the task). A hang inside supabase-js's
// // internal session lookup would produce exactly that signature.
// //
// // This function sidesteps that entirely: it reads a token we cached
// // ourselves (see cacheAccessTokenFromSession above) with a plain
// // AsyncStorage.getItem — no locks, no supabase-js internals — and fires a
// // raw fetch() straight at the PostgREST endpoint. If this hangs too, that
// // would point at something lower-level (network/DNS stack itself being
// // suspended), which is a different and much rarer problem than an
// // in-process auth lock.
// //
// // Returns true on confirmed success, false on any failure (including
// // missing token / missing env vars), so the caller can fall back.
// async function saveLocationViaRestApi(
//   userId: string,
//   latitude: number,
//   longitude: number
// ): Promise<boolean> {
//   console.log("📤 [REST] start");

//   if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
//     console.log("⚠️ [REST] missing SUPABASE_URL/ANON_KEY env vars — skipping REST path");
//     return false;
//   }

//   console.log("📤 [REST] reading cached access token");
//   const token = await AsyncStorage.getItem(CACHED_ACCESS_TOKEN_KEY);
//   console.log("📤 [REST] cached token read complete —", token ? "found" : "not found");

//   if (!token) {
//     console.log("⚠️ [REST] no cached access token available — skipping REST path");
//     return false;
//   }

//   const controller = new AbortController();
//   const abortTimer = setTimeout(() => {
//     console.log("⏱️ [REST] aborting fetch after 8000ms");
//     controller.abort();
//   }, 8000);

//   try {
//     console.log("📤 [REST] firing fetch to /rest/v1/help_app_user_locations");
//     const res = await fetch(
//       `${SUPABASE_URL}/rest/v1/help_app_user_locations`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           apikey: SUPABASE_ANON_KEY,
//           Authorization: `Bearer ${token}`,
//           Prefer: "return=minimal",
//         },
//         body: JSON.stringify({
//           user_id: userId,
//           lat: latitude,
//           lng: longitude,
//           is_home: false,
//           is_live: false,
//           recorded_at: new Date().toISOString(),
//         }),
//         signal: controller.signal,
//       }
//     );
//     console.log("📤 [REST] fetch call returned — status:", res.status);

//     if (!res.ok) {
//       const bodyText = await res.text().catch(() => "");
//       console.log(`❌ [REST] insert failed — status ${res.status}:`, bodyText);
//       // 401 almost always means the cached token has expired — clear it so
//       // we don't keep retrying a dead token every 30s until the next
//       // foreground refresh repopulates the cache.
//       if (res.status === 401) {
//         await AsyncStorage.removeItem(CACHED_ACCESS_TOKEN_KEY);
//         console.log("🗑️ [REST] cleared stale cached token after 401");
//       }
//       return false;
//     }

//     console.log("💾 [REST] Location inserted:", latitude, longitude);
//     return true;
//   } catch (err) {
//     logErr("[REST] saveLocationViaRestApi error", err);
//     return false;
//   } finally {
//     clearTimeout(abortTimer);
//   }
// }

// // ─── saveLocationToSupabase ───────────────────────────────────────────────────
// // CHANGED: now tries the REST-bypass path first (see saveLocationViaRestApi
// // above). Only if that fails or is unavailable (no cached token yet) does it
// // fall back to the original supabase-js insert — which is now also wrapped
// // in bracketing 📤 logs so that if IT hangs, we get the same kind of
// // unambiguous confirmation we got for getSession(): whichever 📤 line is
// // the last one to ever appear tells us exactly where execution is stuck.
// async function saveLocationToSupabase(
//   userId: string,
//   latitude: number,
//   longitude: number
// ) {
//   console.log("▶️ saveLocationToSupabase: start");
//   try {
//     console.log("📤 reading LAST_SAVED_AT");
//     const lastSaved = Number(
//       (await AsyncStorage.getItem("LAST_SAVED_AT")) ?? 0
//     );
//     console.log("📤 LAST_SAVED_AT read complete:", lastSaved);

//     if (Date.now() - lastSaved < SAVE_THROTTLE_MS) {
//       console.log("⏩ Location save throttled — skipping");
//       return;
//     }

//     // Try the REST-bypass path first.
//     const restSucceeded = await saveLocationViaRestApi(userId, latitude, longitude);

//     if (restSucceeded) {
//       await AsyncStorage.setItem("LAST_SAVED_AT", String(Date.now()));
//       return;
//     }

//     console.log("📤 REST path unavailable/failed — falling back to supabase-js insert");
//     console.log("📤 calling supabase.from(...).insert(...)");
//     const { error } = await supabase.from("help_app_user_locations").insert({
//       user_id: userId,
//       lat: latitude,
//       lng: longitude,
//       is_home: false,
//       is_live: false,
//       recorded_at: new Date().toISOString(),
//     });
//     console.log("📤 supabase.from(...).insert(...) call returned");

//     if (error) {
//       logErr("saveLocationToSupabase insert error", error);
//       return;
//     }

//     await AsyncStorage.setItem("LAST_SAVED_AT", String(Date.now()));
//     console.log("💾 Location inserted (supabase-js fallback):", latitude, longitude);
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
// // CHANGED: on a successful getSession() / refreshSession(), also feed the
// // result into cacheAccessTokenFromSession so the REST-bypass path above has
// // the freshest possible token available, without adding any new hang risk —
// // this is purely an extra AsyncStorage write after data we already have.
// async function ensureFreshSession(): Promise<void> {
//   console.log("▶️ ensureFreshSession: start");
//   try {
//     console.log("🔑 calling getSession");
//     const { data } = await withTimeout(
//       supabase.auth.getSession(),
//       SESSION_CHECK_TIMEOUT_MS,
//       { data: { session: null } } as any,
//       "getSession"
//     );
//     console.log("🔑 getSession call returned");
//     const session = data?.session;

//     if (!session) {
//       console.log("⚠️ ensureFreshSession: no session found");
//       return;
//     }

//     await cacheAccessTokenFromSession(session);

//     if (!session.expires_at) {
//       console.log("⚠️ ensureFreshSession: session has no expires_at — skipping check");
//       return;
//     }

//     const secondsUntilExpiry = session.expires_at - Date.now() / 1000;
//     console.log(`🔑 Session expires in ${Math.round(secondsUntilExpiry)}s`);

//     if (secondsUntilExpiry < TOKEN_REFRESH_MARGIN_SECONDS) {
//       console.log("🔄 Token expiring soon — refreshing session");
//       const { data: refreshData, error: refreshError } = await withTimeout(
//         supabase.auth.refreshSession(),
//         8000,
//         { data: { session: null }, error: new Error("refreshSession timed out") } as any,
//         "refreshSession"
//       );
//       if (refreshError) {
//         logErr("Token refresh failed", refreshError);
//       } else {
//         console.log("✅ Session refreshed");
//         await cacheAccessTokenFromSession(refreshData?.session ?? null);
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

//     // ── PRIORITY WRITE: do this before anything that can hang ──────────────
//     await withTimeout(
//       saveLocationToSupabase(userId, latitude, longitude),
//       8000,
//       undefined,
//       "saveLocation"
//     );

//     // ── Everything below is best-effort and must not block the save above ──
//     await withTimeout(
//       ensureFreshSession(),
//       SESSION_CHECK_TIMEOUT_MS + 1000,
//       undefined,
//       "ensureFreshSession (outer)"
//     );

//     console.log("⏳ Loading zones + home (with timeout guards)...");
//     const [safeZones, homeLocation] = await Promise.all([
//       withTimeout(getCachedSafeZones(userId), 5000, [], "safeZones"),
//       withTimeout(getCachedHomeLocation(userId), 5000, null, "homeLocation"),
//     ]);
//     console.log(
//       "✅ Zones loaded:", safeZones.length,
//       "| home set:", !!homeLocation
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
//   // NEW: ask Android to batch-deliver at least every 30s during normal
//   // (non-Doze) backgrounding, instead of leaving batching entirely up to
//   // OS discretion. This does NOT override Doze/App Standby windows (those
//   // are a separate, OS-level power-management layer no app-side setting
//   // can fully defeat) — it just removes one layer of ambiguity so the
//   // ~30s cadence you see outside of Doze windows is intentional rather
//   // than incidental.
//   deferredUpdatesInterval: 30000,
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

//   // CHANGED: the whole original bug was that this call's result was never
//   // checked, so tracking proceeded as if the foreground service would be
//   // fully protected when it silently wasn't. We still don't hard-block
//   // location tracking on this — a safety app that tracks nothing because a
//   // notification was denied is worse than one that tracks unreliably — but
//   // we now log it loudly and persist the flag so the UI layer can warn the
//   // person and offer a way back into system settings (see
//   // wasNotificationPermissionDenied / ensureNotificationPermission above).
//   const notificationsGranted = await ensureNotificationPermission();
//   if (!notificationsGranted) {
//     console.log(
//       "🚨 _startLocationUpdates: notification permission NOT granted — " +
//       "the foreground service notification cannot display, which means Android " +
//       "may refuse to treat this as a protected foreground service. Background " +
//       "tracking will likely be unreliable (delayed/suspended updates) until " +
//       "the person enables notifications in system settings."
//     );
//   }

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

//   // NEW: prime the REST-bypass token cache right away, from whatever
//   // session is currently active, so the very first background task
//   // invocation already has a usable cached token instead of waiting for
//   // ensureFreshSession() to populate it later.
//   try {
//     const { data } = await supabase.auth.getSession();
//     await cacheAccessTokenFromSession(data?.session ?? null);
//   } catch (err) {
//     logErr("_startLocationUpdates: initial token cache warm-up error", err);
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

// // ─── stopBackgroundTracking — polls instead of trusting a flat sleep ────────
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
//     // CHANGED: re-check (not re-prompt — getPermissionsAsync inside
//     // requestNotificationPermissions short-circuits if already granted)
//     // notification permission on every health check. This is what lets a
//     // person who granted it later, via system settings after initially
//     // denying it, get picked up automatically on the next health check
//     // (app foreground / AppState change) rather than needing a reinstall
//     // or an app update to re-run _startLocationUpdates's one-time check.
//     await ensureNotificationPermission();

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
// import { initLocalLocationLog, logLocationLocally } from "@/lib/localLocationLog";
// import * as TaskManager from "expo-task-manager";
// import * as Location from "expo-location";
// import * as Notifications from "expo-notifications";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { NativeModules, Platform } from "react-native";
// import { supabase } from "@/supabase/supabase";
// import {
//   getPushTokenForUser,
//   sendExpoPushNotification,
// } from "@/services/pushToken";

// initLocalLocationLog();

// // NOTE ON WHY THIS IS AT THE VERY TOP:
// // index.js imports this file (services/backgroundLocation) BEFORE
// // expo-router/entry. That means installPersistentLogging() runs before any
// // screen, any other service, or the router itself has logged a single line —
// // so every console.log/warn/error in the ENTIRE app, not just this file,
// // gets captured to the persistent log file from the first millisecond of
// // the JS process. This is what makes "every detail" actually true, not just
// // true for this one file.

// // ─── Wake lock (native module) ─────────────────────────────────────────────
// // See plugins/withWakeLock.js + plugins/native/WakeLockModule.kt.template /
// // WakeLockPackage.kt.template. This is only present in a build that ran
// // through that config plugin (i.e. after `expo prebuild` / `expo run:android`
// // / `eas build` — NOT available if you're still running an old dev client
// // built before the plugin was added).
// const { WakeLockModule } = NativeModules;

// // ─── Constants ────────────────────────────────────────────────────────────────
// export const LOCATION_TASK = "help-app-background-location";
// const HOME_RADIUS_METERS = 50;
// const CACHE_TTL_MS = 10 * 60 * 1000;       // 10 minutes
// const SAVE_THROTTLE_MS = 2 * 60 * 1000;    // save location every 2 min max
// const PERMISSION_TIMEOUT_MS = 10000;
// const NOTIFICATION_COOLDOWN_MS = 10 * 60 * 1000; // 10 min between repeat alerts
// const TOKEN_REFRESH_MARGIN_SECONDS = 300; // refresh if expiring within 5 min

// const SESSION_CHECK_TIMEOUT_MS = 4000;

// // NEW: keys for the locally-cached auth token used by the REST-bypass write
// // path (see saveLocationViaRestApi below). This is deliberately separate
// // from whatever key supabase-js itself uses to persist its session in
// // AsyncStorage — we maintain our own copy so the background task never has
// // to go through supabase-js's internal session-fetch/lock logic at all.
// const CACHED_ACCESS_TOKEN_KEY = "CACHED_SUPABASE_ACCESS_TOKEN";
// const CACHED_ACCESS_TOKEN_AT_KEY = "CACHED_SUPABASE_ACCESS_TOKEN_AT";

// const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
// const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

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

// // ─── Wake lock helpers ────────────────────────────────────────────────────────
// // Thin wrapper around the native WakeLockModule so callers never have to
// // check Platform.OS or handle a missing native module themselves.
// //
// // WHY THIS EXISTS (root cause #4):
// // expo-location's background task delivery gets just enough of a CPU wake
// // guarantee from Android to hand our JS callback a GPS fix — not enough to
// // guarantee our own async fetch() to Supabase survives to completion. If the
// // CPU drops back to sleep mid-request, the fetch never resolves or rejects,
// // and its own setTimeout-based abort timer is *also* suspended by Doze — so
// // nothing ever releases that request's slot in RN's shared OkHttp connection
// // pool. Enough of these and the pool is exhausted, silently blocking every
// // future request (even ones during periods the phone is fully awake) — which
// // is what produced the permanent, total halt around the 2–2.5hr mark, not
// // just occasional gaps.
// //
// // acquireWakeLockSafe() never throws — a failed acquire should not fail the
// // whole save. Better to attempt the save unprotected than skip it entirely.
// async function acquireWakeLockSafe(): Promise<boolean> {
//   if (Platform.OS !== "android" || !WakeLockModule) return false;
//   try {
//     await WakeLockModule.acquire();
//     return true;
//   } catch (err) {
//     logErr("acquireWakeLockSafe error", err);
//     return false;
//   }
// }

// async function releaseWakeLockSafe(): Promise<void> {
//   if (Platform.OS !== "android" || !WakeLockModule) return;
//   try {
//     await WakeLockModule.release();
//   } catch (err) {
//     logErr("releaseWakeLockSafe error", err);
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
// // KNOWN LIMITATION (documented, not fully fixable in JS alone): if Android
// // suspends the entire JS thread mid-await, the rescuing setTimeout is just
// // as stuck as the promise it's meant to rescue. This is why the real fixes
// // in this file are architectural (do the critical write first, wrap the
// // risky network call in a native wake lock, and avoid code paths with
// // internal locks/awaits we don't control), not just tightening timeouts.
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

// // ─── shared tracking mutex ──────────────────────────────────────────────────
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

// // CHANGED: this now returns whether the permission is actually granted,
// // instead of firing the request and discarding the result. The whole
// // original bug (foreground service silently never registering with the OS)
// // was invisible for exactly this reason — the caller had no way to know
// // permission had been denied, so it proceeded as if everything was fine.
// //
// // Also checks the CURRENT status first via getPermissionsAsync() before
// // prompting. This matters because requestPermissionsAsync() is a no-op
// // re-prompt on Android once the user has already made a choice (granted or
// // denied) — Android will not show the system dialog a second time. Checking
// // current status first lets the caller distinguish "never asked" from
// // "already denied," which matters for what UI to show next (see
// // ensureNotificationPermission below).
// export const requestNotificationPermissions = async (): Promise<boolean> => {
//   console.log("▶️ requestNotificationPermissions: start");
//   try {
//     const existing = await Notifications.getPermissionsAsync();
//     if (existing.status === "granted") {
//       console.log("✅ Notification permission already granted");
//       return true;
//     }

//     const { status } = await Notifications.requestPermissionsAsync();
//     const granted = status === "granted";
//     console.log(
//       granted
//         ? "✅ Notification permission granted"
//         : `❌ Notification permission denied (status: ${status})`
//     );
//     return granted;
//   } catch (err) {
//     logErr("Notification permission error", err);
//     return false;
//   }
// };

// // NEW: single source of truth for "is notification permission usable right
// // now," combining the check + request + a stored flag the UI layer can read
// // to decide whether to show a settings-redirect prompt. Stored separately
// // from the OS permission state so the UI can distinguish "never checked"
// // from "checked and denied" across app restarts, without re-triggering the
// // (silent, no-op-on-Android) request every time.
// const NOTIFICATION_PERMISSION_DENIED_KEY = "NOTIFICATION_PERMISSION_WAS_DENIED";

// export async function ensureNotificationPermission(): Promise<boolean> {
//   const granted = await requestNotificationPermissions();
//   try {
//     if (granted) {
//       await AsyncStorage.removeItem(NOTIFICATION_PERMISSION_DENIED_KEY);
//     } else {
//       await AsyncStorage.setItem(NOTIFICATION_PERMISSION_DENIED_KEY, "true");
//     }
//   } catch (err) {
//     logErr("ensureNotificationPermission: flag write error", err);
//   }
//   return granted;
// }

// // NEW: lets the UI (e.g. a banner on the home screen) check without
// // re-triggering any permission flow, so it can show "tracking may be
// // unreliable — enable notifications" with a button to open system settings.
// export async function wasNotificationPermissionDenied(): Promise<boolean> {
//   try {
//     return (await AsyncStorage.getItem(NOTIFICATION_PERMISSION_DENIED_KEY)) === "true";
//   } catch (err) {
//     logErr("wasNotificationPermissionDenied error", err);
//     return false;
//   }
// }

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

// // ─── NEW: locally-cached access token, maintained OUTSIDE the background task ─
// // The whole point of this cache is that writing to it never happens on the
// // hang-prone path. Call cacheAccessTokenFromSession(...) from your app's
// // normal foreground auth-state listener (wherever you currently call
// // supabase.auth.onAuthStateChange), e.g.:
// //
// //   supabase.auth.onAuthStateChange((_event, session) => {
// //     cacheAccessTokenFromSession(session);
// //   });
// //
// // and also call it once right after any successful sign-in and after any
// // successful refreshSession() call. That way, by the time the background
// // task runs, a fresh token is almost always already sitting in AsyncStorage
// // with a plain, un-locked read — no auth/session logic involved at all.
// export async function cacheAccessTokenFromSession(session: { access_token?: string } | null) {
//   try {
//     if (!session?.access_token) return;
//     await AsyncStorage.setItem(CACHED_ACCESS_TOKEN_KEY, session.access_token);
//     await AsyncStorage.setItem(CACHED_ACCESS_TOKEN_AT_KEY, String(Date.now()));
//     console.log("🔐 cacheAccessTokenFromSession: token cached");
//   } catch (err) {
//     logErr("cacheAccessTokenFromSession error", err);
//   }
// }

// // ─── REST-bypass insert ─────────────────────────────────────────────────────
// // WHY THIS EXISTS:
// // supabase-js's .from(...).insert(...) attaches an Authorization header by
// // internally reading the current session — which goes through the same
// // AsyncStorage-backed auth/session code path as supabase.auth.getSession().
// // That was the prime suspect for the second hang (saveLocationToSupabase
// // logging "start" but never completing, erroring, or timing out). This
// // function sidesteps that entirely: it reads a token we cached ourselves
// // (see cacheAccessTokenFromSession above) with a plain AsyncStorage.getItem
// // — no locks, no supabase-js internals — and fires a raw fetch() straight at
// // the PostgREST endpoint.
// //
// // CHANGED (root cause #4 fix): the fetch is now wrapped in a native CPU wake
// // lock, acquired right before the call and released in `finally` regardless
// // of outcome. See the "Wake lock helpers" comment block above for the full
// // mechanism this closes. The AbortController/timer is still armed *before*
// // the wake lock is acquired, so even if lock acquisition itself were ever
// // slow, the abort timer is already running independently.
// //
// // Returns true on confirmed success, false on any failure (including
// // missing token / missing env vars), so the caller can fall back.
// async function saveLocationViaRestApi(
//   userId: string,
//   latitude: number,
//   longitude: number
// ): Promise<boolean> {
//   console.log("📤 [REST] start");

//   if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
//     console.log("⚠️ [REST] missing SUPABASE_URL/ANON_KEY env vars — skipping REST path");
//     return false;
//   }

//   console.log("📤 [REST] reading cached access token");
//   const token = await AsyncStorage.getItem(CACHED_ACCESS_TOKEN_KEY);
//   console.log("📤 [REST] cached token read complete —", token ? "found" : "not found");

//   if (!token) {
//     console.log("⚠️ [REST] no cached access token available — skipping REST path");
//     return false;
//   }

//   // Arm the abort timer BEFORE acquiring the wake lock — if lock acquisition
//   // itself ever stalls, this timer is already independently running.
//   const controller = new AbortController();
//   const abortTimer = setTimeout(() => {
//     console.log("⏱️ [REST] aborting fetch after 8000ms");
//     controller.abort();
//   }, 8000);

//   let wakeLockHeld = false;

//   try {
//     wakeLockHeld = await acquireWakeLockSafe();
//     console.log(
//       wakeLockHeld
//         ? "🔒 [REST] wake lock acquired"
//         : "⚠️ [REST] wake lock unavailable — proceeding without it"
//     );

//     console.log("📤 [REST] firing fetch to /rest/v1/help_app_user_locations");
//     const res = await fetch(
//       `${SUPABASE_URL}/rest/v1/help_app_user_locations`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           apikey: SUPABASE_ANON_KEY,
//           Authorization: `Bearer ${token}`,
//           Prefer: "return=minimal",
//           Connection: "close"
//         },
//         body: JSON.stringify({
//           user_id: userId,
//           lat: latitude,
//           lng: longitude,
//           is_home: false,
//           is_live: false,
//           recorded_at: new Date().toISOString(),
//         }),
//         signal: controller.signal,
//       }
//     );
//     console.log("📤 [REST] fetch call returned — status:", res.status);

//     if (!res.ok) {
//       const bodyText = await res.text().catch(() => "");
//       console.log(`❌ [REST] insert failed — status ${res.status}:`, bodyText);
//       // 401 almost always means the cached token has expired — clear it so
//       // we don't keep retrying a dead token every 30s until the next
//       // foreground refresh repopulates the cache.
//       if (res.status === 401) {
//         await AsyncStorage.removeItem(CACHED_ACCESS_TOKEN_KEY);
//         console.log("🗑️ [REST] cleared stale cached token after 401");
//       }
//       return false;
//     }

//     console.log("💾 [REST] Location inserted:", latitude, longitude);
//     return true;
//   } catch (err) {
//     logErr("[REST] saveLocationViaRestApi error", err);
//     return false;
//   } finally {
//     clearTimeout(abortTimer);
//     if (wakeLockHeld) {
//       await releaseWakeLockSafe();
//       console.log("🔓 [REST] wake lock released");
//     }
//   }
// }

// // ─── saveLocationToSupabase ───────────────────────────────────────────────────
// // Tries the REST-bypass path first (see saveLocationViaRestApi above). Only
// // if that fails or is unavailable (no cached token yet) does it fall back to
// // the original supabase-js insert — which is also wrapped in bracketing 📤
// // logs so that if IT hangs, we get the same kind of unambiguous confirmation
// // we got for getSession(): whichever 📤 line is the last one to ever appear
// // tells us exactly where execution is stuck.
// async function saveLocationToSupabase(
//   userId: string,
//   latitude: number,
//   longitude: number
// ) {
//   console.log("▶️ saveLocationToSupabase: start");
//   try {
//     console.log("📤 reading LAST_SAVED_AT");
//     const lastSaved = Number(
//       (await AsyncStorage.getItem("LAST_SAVED_AT")) ?? 0
//     );
//     console.log("📤 LAST_SAVED_AT read complete:", lastSaved);

//     if (Date.now() - lastSaved < SAVE_THROTTLE_MS) {
//       console.log("⏩ Location save throttled — skipping");
//       return;
//     }

//     // Try the REST-bypass path first.
//     const restSucceeded = await saveLocationViaRestApi(userId, latitude, longitude);

//     if (restSucceeded) {
//       await AsyncStorage.setItem("LAST_SAVED_AT", String(Date.now()));
//       console.log("💾 Location inserted (REST path):", latitude, longitude);
//       logLocationLocally(userId, latitude, longitude, true); // NEW
//       return;
//     }

//     console.log("📤 REST path unavailable/failed — falling back to supabase-js insert");
//     console.log("📤 calling supabase.from(...).insert(...)");
//     const { error } = await supabase.from("help_app_user_locations").insert({
//       user_id: userId,
//       lat: latitude,
//       lng: longitude,
//       is_home: false,
//       is_live: false,
//       recorded_at: new Date().toISOString(),
//     });
//     console.log("📤 supabase.from(...).insert(...) call returned");

//     if (error) {
//       logErr("saveLocationToSupabase insert error", error);
//       return;
//     }

//     await AsyncStorage.setItem("LAST_SAVED_AT", String(Date.now()));
//     console.log("💾 Location inserted (supabase-js fallback):", latitude, longitude);
//     logLocationLocally(userId, latitude, longitude, true); // NEW
//   } catch (err) {
//     logErr("saveLocationToSupabase error", err);
//     logLocationLocally(userId, latitude, longitude, false, String(err)); 
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
//   console.log("▶️ ensureFreshSession: start");
//   try {
//     console.log("🔑 calling getSession");
//     const { data } = await withTimeout(
//       supabase.auth.getSession(),
//       SESSION_CHECK_TIMEOUT_MS,
//       { data: { session: null } } as any,
//       "getSession"
//     );
//     console.log("🔑 getSession call returned");
//     const session = data?.session;

//     if (!session) {
//       console.log("⚠️ ensureFreshSession: no session found");
//       return;
//     }

//     await cacheAccessTokenFromSession(session);

//     if (!session.expires_at) {
//       console.log("⚠️ ensureFreshSession: session has no expires_at — skipping check");
//       return;
//     }

//     const secondsUntilExpiry = session.expires_at - Date.now() / 1000;
//     console.log(`🔑 Session expires in ${Math.round(secondsUntilExpiry)}s`);

//     if (secondsUntilExpiry < TOKEN_REFRESH_MARGIN_SECONDS) {
//       console.log("🔄 Token expiring soon — refreshing session");
//       const { data: refreshData, error: refreshError } = await withTimeout(
//         supabase.auth.refreshSession(),
//         8000,
//         { data: { session: null }, error: new Error("refreshSession timed out") } as any,
//         "refreshSession"
//       );
//       if (refreshError) {
//         logErr("Token refresh failed", refreshError);
//       } else {
//         console.log("✅ Session refreshed");
//         await cacheAccessTokenFromSession(refreshData?.session ?? null);
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

//     // ── PRIORITY WRITE: do this before anything that can hang ──────────────
//     await withTimeout(
//       saveLocationToSupabase(userId, latitude, longitude),
//       8000,
//       undefined,
//       "saveLocation"
//     );
//         // ── HEARTBEAT: independent unrelated-host fetch, fire-and-forget ───────
//     fetch('https://www.google.com', { method: 'HEAD' })
//       .then(() => console.log('[HEARTBEAT] ok', Date.now()))
//       .catch((e) => console.log('[HEARTBEAT] fail', e?.message, Date.now()));
//     // ── Everything below is best-effort and must not block the save above ──
//     await withTimeout(
//       ensureFreshSession(),
//       SESSION_CHECK_TIMEOUT_MS + 1000,
//       undefined,
//       "ensureFreshSession (outer)"
//     );

//     console.log("⏳ Loading zones + home (with timeout guards)...");
//     const [safeZones, homeLocation] = await Promise.all([
//       withTimeout(getCachedSafeZones(userId), 5000, [], "safeZones"),
//       withTimeout(getCachedHomeLocation(userId), 5000, null, "homeLocation"),
//     ]);
//     console.log(
//       "✅ Zones loaded:", safeZones.length,
//       "| home set:", !!homeLocation
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
//   // Ask Android to batch-deliver at least every 30s during normal
//   // (non-Doze) backgrounding, instead of leaving batching entirely up to
//   // OS discretion. This does NOT override Doze/App Standby windows (those
//   // are a separate, OS-level power-management layer no app-side setting
//   // can fully defeat) — it just removes one layer of ambiguity so the
//   // ~30s cadence you see outside of Doze windows is intentional rather
//   // than incidental.
//   deferredUpdatesInterval: 30000,
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

//   // The whole original bug was that this call's result was never checked,
//   // so tracking proceeded as if the foreground service would be fully
//   // protected when it silently wasn't. We still don't hard-block location
//   // tracking on this — a safety app that tracks nothing because a
//   // notification was denied is worse than one that tracks unreliably — but
//   // we now log it loudly and persist the flag so the UI layer can warn the
//   // person and offer a way back into system settings.
//   const notificationsGranted = await ensureNotificationPermission();
//   if (!notificationsGranted) {
//     console.log(
//       "🚨 _startLocationUpdates: notification permission NOT granted — " +
//       "the foreground service notification cannot display, which means Android " +
//       "may refuse to treat this as a protected foreground service. Background " +
//       "tracking will likely be unreliable (delayed/suspended updates) until " +
//       "the person enables notifications in system settings."
//     );
//   }

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

//   // Prime the REST-bypass token cache right away, from whatever session is
//   // currently active, so the very first background task invocation already
//   // has a usable cached token instead of waiting for ensureFreshSession()
//   // to populate it later.
//   try {
//     const { data } = await supabase.auth.getSession();
//     await cacheAccessTokenFromSession(data?.session ?? null);
//   } catch (err) {
//     logErr("_startLocationUpdates: initial token cache warm-up error", err);
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

// // ─── stopBackgroundTracking — polls instead of trusting a flat sleep ────────
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
//     // Re-check (not re-prompt — getPermissionsAsync inside
//     // requestNotificationPermissions short-circuits if already granted)
//     // notification permission on every health check. This is what lets a
//     // person who granted it later, via system settings after initially
//     // denying it, get picked up automatically on the next health check
//     // (app foreground / AppState change) rather than needing a reinstall
//     // or an app update to re-run _startLocationUpdates's one-time check.
//     await ensureNotificationPermission();

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

import { initLocalLocationLog, logLocationLocally, getPendingLocalEntries, markLocalEntrySynced } from "@/lib/localLocationLog";

import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeModules, Platform } from "react-native";
import { supabase } from "@/supabase/supabase";
import {
  getPushTokenForUser,
  sendExpoPushNotification,
} from "@/services/pushToken";

initLocalLocationLog();

// NOTE ON WHY THIS IS AT THE VERY TOP:
// index.js imports this file (services/backgroundLocation) BEFORE
// expo-router/entry. That means installPersistentLogging() runs before any
// screen, any other service, or the router itself has logged a single line —
// so every console.log/warn/error in the ENTIRE app, not just this file,
// gets captured to the persistent log file from the first millisecond of
// the JS process. This is what makes "every detail" actually true, not just
// true for this one file.

// ─── Wake lock (native module) ─────────────────────────────────────────────
// See plugins/withWakeLock.js + plugins/native/WakeLockModule.kt.template /
// WakeLockPackage.kt.template. This is only present in a build that ran
// through that config plugin (i.e. after `expo prebuild` / `expo run:android`
// / `eas build` — NOT available if you're still running an old dev client
// built before the plugin was added).
const { WakeLockModule } = NativeModules;

// ─── Constants ────────────────────────────────────────────────────────────────
export const LOCATION_TASK = "help-app-background-location";
const HOME_RADIUS_METERS = 50;
const CACHE_TTL_MS = 10 * 60 * 1000;       // 10 minutes
const SAVE_THROTTLE_MS = 2 * 60 * 1000;    // save location every 2 min max
const PERMISSION_TIMEOUT_MS = 10000;
const NOTIFICATION_COOLDOWN_MS = 10 * 60 * 1000; // 10 min between repeat alerts
const TOKEN_REFRESH_MARGIN_SECONDS = 300; // refresh if expiring within 5 min

const SESSION_CHECK_TIMEOUT_MS = 4000;

// NEW: keys for the locally-cached auth token used by the REST-bypass write
// path (see saveLocationViaRestApi below). This is deliberately separate
// from whatever key supabase-js itself uses to persist its session in
// AsyncStorage — we maintain our own copy so the background task never has
// to go through supabase-js's internal session-fetch/lock logic at all.
const CACHED_ACCESS_TOKEN_KEY = "CACHED_SUPABASE_ACCESS_TOKEN";
const CACHED_ACCESS_TOKEN_AT_KEY = "CACHED_SUPABASE_ACCESS_TOKEN_AT";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

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

// ─── Wake lock helpers ────────────────────────────────────────────────────────
// Thin wrapper around the native WakeLockModule so callers never have to
// check Platform.OS or handle a missing native module themselves.
//
// WHY THIS EXISTS (root cause #4):
// expo-location's background task delivery gets just enough of a CPU wake
// guarantee from Android to hand our JS callback a GPS fix — not enough to
// guarantee our own async fetch() to Supabase survives to completion. If the
// CPU drops back to sleep mid-request, the fetch never resolves or rejects,
// and its own setTimeout-based abort timer is *also* suspended by Doze — so
// nothing ever releases that request's slot in RN's shared OkHttp connection
// pool. Enough of these and the pool is exhausted, silently blocking every
// future request (even ones during periods the phone is fully awake) — which
// is what produced the permanent, total halt around the 2–2.5hr mark, not
// just occasional gaps.
//
// acquireWakeLockSafe() never throws — a failed acquire should not fail the
// whole save. Better to attempt the save unprotected than skip it entirely.
async function acquireWakeLockSafe(): Promise<boolean> {
  if (Platform.OS !== "android" || !WakeLockModule) return false;
  try {
    await WakeLockModule.acquire();
    return true;
  } catch (err) {
    logErr("acquireWakeLockSafe error", err);
    return false;
  }
}

async function releaseWakeLockSafe(): Promise<void> {
  if (Platform.OS !== "android" || !WakeLockModule) return;
  try {
    await WakeLockModule.release();
  } catch (err) {
    logErr("releaseWakeLockSafe error", err);
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
// KNOWN LIMITATION (documented, not fully fixable in JS alone): if Android
// suspends the entire JS thread mid-await, the rescuing setTimeout is just
// as stuck as the promise it's meant to rescue. This is why the real fixes
// in this file are architectural (do the critical write first, wrap the
// risky network call in a native wake lock, and avoid code paths with
// internal locks/awaits we don't control), not just tightening timeouts.
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

// CHANGED: this now returns whether the permission is actually granted,
// instead of firing the request and discarding the result. The whole
// original bug (foreground service silently never registering with the OS)
// was invisible for exactly this reason — the caller had no way to know
// permission had been denied, so it proceeded as if everything was fine.
//
// Also checks the CURRENT status first via getPermissionsAsync() before
// prompting. This matters because requestPermissionsAsync() is a no-op
// re-prompt on Android once the user has already made a choice (granted or
// denied) — Android will not show the system dialog a second time. Checking
// current status first lets the caller distinguish "never asked" from
// "already denied," which matters for what UI to show next (see
// ensureNotificationPermission below).
export const requestNotificationPermissions = async (): Promise<boolean> => {
  console.log("▶️ requestNotificationPermissions: start");
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.status === "granted") {
      console.log("✅ Notification permission already granted");
      return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === "granted";
    console.log(
      granted
        ? "✅ Notification permission granted"
        : `❌ Notification permission denied (status: ${status})`
    );
    return granted;
  } catch (err) {
    logErr("Notification permission error", err);
    return false;
  }
};

// NEW: single source of truth for "is notification permission usable right
// now," combining the check + request + a stored flag the UI layer can read
// to decide whether to show a settings-redirect prompt. Stored separately
// from the OS permission state so the UI can distinguish "never checked"
// from "checked and denied" across app restarts, without re-triggering the
// (silent, no-op-on-Android) request every time.
const NOTIFICATION_PERMISSION_DENIED_KEY = "NOTIFICATION_PERMISSION_WAS_DENIED";

export async function ensureNotificationPermission(): Promise<boolean> {
  const granted = await requestNotificationPermissions();
  try {
    if (granted) {
      await AsyncStorage.removeItem(NOTIFICATION_PERMISSION_DENIED_KEY);
    } else {
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_DENIED_KEY, "true");
    }
  } catch (err) {
    logErr("ensureNotificationPermission: flag write error", err);
  }
  return granted;
}

// NEW: lets the UI (e.g. a banner on the home screen) check without
// re-triggering any permission flow, so it can show "tracking may be
// unreliable — enable notifications" with a button to open system settings.
export async function wasNotificationPermissionDenied(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(NOTIFICATION_PERMISSION_DENIED_KEY)) === "true";
  } catch (err) {
    logErr("wasNotificationPermissionDenied error", err);
    return false;
  }
}

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

// ─── NEW: locally-cached access token, maintained OUTSIDE the background task ─
// The whole point of this cache is that writing to it never happens on the
// hang-prone path. Call cacheAccessTokenFromSession(...) from your app's
// normal foreground auth-state listener (wherever you currently call
// supabase.auth.onAuthStateChange), e.g.:
//
//   supabase.auth.onAuthStateChange((_event, session) => {
//     cacheAccessTokenFromSession(session);
//   });
//
// and also call it once right after any successful sign-in and after any
// successful refreshSession() call. That way, by the time the background
// task runs, a fresh token is almost always already sitting in AsyncStorage
// with a plain, un-locked read — no auth/session logic involved at all.
export async function cacheAccessTokenFromSession(session: { access_token?: string } | null) {
  try {
    if (!session?.access_token) return;
    await AsyncStorage.setItem(CACHED_ACCESS_TOKEN_KEY, session.access_token);
    await AsyncStorage.setItem(CACHED_ACCESS_TOKEN_AT_KEY, String(Date.now()));
    console.log("🔐 cacheAccessTokenFromSession: token cached");
  } catch (err) {
    logErr("cacheAccessTokenFromSession error", err);
  }
}

// ─── REST-bypass insert ─────────────────────────────────────────────────────
// WHY THIS EXISTS:
// supabase-js's .from(...).insert(...) attaches an Authorization header by
// internally reading the current session — which goes through the same
// AsyncStorage-backed auth/session code path as supabase.auth.getSession().
// That was the prime suspect for the second hang (saveLocationToSupabase
// logging "start" but never completing, erroring, or timing out). This
// function sidesteps that entirely: it reads a token we cached ourselves
// (see cacheAccessTokenFromSession above) with a plain AsyncStorage.getItem
// — no locks, no supabase-js internals — and fires a raw fetch() straight at
// the PostgREST endpoint.
//
// CHANGED (root cause #4 fix): the fetch is now wrapped in a native CPU wake
// lock, acquired right before the call and released in `finally` regardless
// of outcome. See the "Wake lock helpers" comment block above for the full
// mechanism this closes. The AbortController/timer is still armed *before*
// the wake lock is acquired, so even if lock acquisition itself were ever
// slow, the abort timer is already running independently.
//
// Returns true on confirmed success, false on any failure (including
// missing token / missing env vars), so the caller can fall back.
async function saveLocationViaRestApi(
  userId: string,
  latitude: number,
  longitude: number
): Promise<boolean> {
  console.log("📤 [REST] start");

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log("⚠️ [REST] missing SUPABASE_URL/ANON_KEY env vars — skipping REST path");
    return false;
  }

  console.log("📤 [REST] reading cached access token");
  const token = await AsyncStorage.getItem(CACHED_ACCESS_TOKEN_KEY);
  console.log("📤 [REST] cached token read complete —", token ? "found" : "not found");

  if (!token) {
    console.log("⚠️ [REST] no cached access token available — skipping REST path");
    return false;
  }

  // Arm the abort timer BEFORE acquiring the wake lock — if lock acquisition
  // itself ever stalls, this timer is already independently running.
  const controller = new AbortController();
  const abortTimer = setTimeout(() => {
    console.log("⏱️ [REST] aborting fetch after 8000ms");
    controller.abort();
  }, 8000);

  let wakeLockHeld = false;

  try {
    wakeLockHeld = await acquireWakeLockSafe();
    console.log(
      wakeLockHeld
        ? "🔒 [REST] wake lock acquired"
        : "⚠️ [REST] wake lock unavailable — proceeding without it"
    );

    console.log("📤 [REST] firing fetch to /rest/v1/help_app_user_locations");
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/help_app_user_locations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
          Prefer: "return=minimal",
          Connection: "close"
        },
        body: JSON.stringify({
          user_id: userId,
          lat: latitude,
          lng: longitude,
          is_home: false,
          is_live: false,
          recorded_at: new Date().toISOString(),
        }),
        signal: controller.signal,
      }
    );
    console.log("📤 [REST] fetch call returned — status:", res.status);

    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      console.log(`❌ [REST] insert failed — status ${res.status}:`, bodyText);
      // 401 almost always means the cached token has expired — clear it so
      // we don't keep retrying a dead token every 30s until the next
      // foreground refresh repopulates the cache.
      if (res.status === 401) {
        await AsyncStorage.removeItem(CACHED_ACCESS_TOKEN_KEY);
        console.log("🗑️ [REST] cleared stale cached token after 401");
      }
      return false;
    }

    console.log("💾 [REST] Location inserted:", latitude, longitude);
    return true;
  } catch (err) {
    logErr("[REST] saveLocationViaRestApi error", err);
    return false;
  } finally {
    clearTimeout(abortTimer);
    if (wakeLockHeld) {
      await releaseWakeLockSafe();
      console.log("🔓 [REST] wake lock released");
    }
  }
}

// ─── saveLocationToSupabase ───────────────────────────────────────────────────
// Tries the REST-bypass path first (see saveLocationViaRestApi above). Only
// if that fails or is unavailable (no cached token yet) does it fall back to
// the original supabase-js insert — which is also wrapped in bracketing 📤
// logs so that if IT hangs, we get the same kind of unambiguous confirmation
// we got for getSession(): whichever 📤 line is the last one to ever appear
// tells us exactly where execution is stuck.
//
// NEW: every outcome (REST success, fallback success, fallback failure, or a
// thrown exception) is also mirrored into the local `location_log` table via
// logLocationLocally(...). This is a pure local backup/history — it never
// blocks or changes the remote-write logic above, it just records what
// happened. Entries logged as "pending" get picked up by
// retryPendingLocalEntries() on a later task run.
async function saveLocationToSupabase(
  userId: string,
  latitude: number,
  longitude: number
) {
  console.log("▶️ saveLocationToSupabase: start");
  try {
    console.log("📤 reading LAST_SAVED_AT");
    const lastSaved = Number(
      (await AsyncStorage.getItem("LAST_SAVED_AT")) ?? 0
    );
    console.log("📤 LAST_SAVED_AT read complete:", lastSaved);

    if (Date.now() - lastSaved < SAVE_THROTTLE_MS) {
      console.log("⏩ Location save throttled — skipping");
      return;
    }

    // Try the REST-bypass path first.
    const restSucceeded = await saveLocationViaRestApi(userId, latitude, longitude);

    if (restSucceeded) {
      await AsyncStorage.setItem("LAST_SAVED_AT", String(Date.now()));
      logLocationLocally(userId, latitude, longitude, true); // NEW
      return;
    }

    console.log("📤 REST path unavailable/failed — falling back to supabase-js insert");
    console.log("📤 calling supabase.from(...).insert(...)");
    const { error } = await supabase.from("help_app_user_locations").insert({
      user_id: userId,
      lat: latitude,
      lng: longitude,
      is_home: false,
      is_live: false,
      recorded_at: new Date().toISOString(),
    });
    console.log("📤 supabase.from(...).insert(...) call returned");

    if (error) {
      logErr("saveLocationToSupabase insert error", error);
      logLocationLocally(userId, latitude, longitude, false, error.message); // NEW
      return;
    }

    await AsyncStorage.setItem("LAST_SAVED_AT", String(Date.now()));
    console.log("💾 Location inserted (supabase-js fallback):", latitude, longitude);
    logLocationLocally(userId, latitude, longitude, true); // NEW
  } catch (err) {
    logErr("saveLocationToSupabase error", err);
    logLocationLocally(userId, latitude, longitude, false, String(err)); // NEW
  }
}

// ─── NEW: retry any locally-queued entries from previous failed attempts ─────
// Runs on every background task tick, right after the current location's
// own save attempt. Only touches entries still marked "pending" in the
// local log — successes are marked "synced" and left alone, failures stay
// "pending" for the next tick to try again.
async function retryPendingLocalEntries(): Promise<void> {
  const pending = getPendingLocalEntries();
  if (pending.length === 0) return;

  console.log(`🔁 retryPendingLocalEntries: ${pending.length} pending entries`);

  for (const entry of pending) {
    try {
      const { error } = await supabase.from("help_app_user_locations").insert({
        user_id: entry.user_id,
        lat: entry.lat,
        lng: entry.lng,
        is_home: false,
        is_live: false,
        recorded_at: entry.recorded_at,
      });

      if (error) {
        logErr(`retryPendingLocalEntries: failed for ${entry.id}`, error);
        continue; // stays pending, retried again next tick
      }

      markLocalEntrySynced(entry.id);
      console.log(`✅ retryPendingLocalEntries: synced ${entry.id}`);
    } catch (err) {
      logErr(`retryPendingLocalEntries: exception for ${entry.id}`, err);
    }
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

    await cacheAccessTokenFromSession(session);

    if (!session.expires_at) {
      console.log("⚠️ ensureFreshSession: session has no expires_at — skipping check");
      return;
    }

    const secondsUntilExpiry = session.expires_at - Date.now() / 1000;
    console.log(`🔑 Session expires in ${Math.round(secondsUntilExpiry)}s`);

    if (secondsUntilExpiry < TOKEN_REFRESH_MARGIN_SECONDS) {
      console.log("🔄 Token expiring soon — refreshing session");
      const { data: refreshData, error: refreshError } = await withTimeout(
        supabase.auth.refreshSession(),
        8000,
        { data: { session: null }, error: new Error("refreshSession timed out") } as any,
        "refreshSession"
      );
      if (refreshError) {
        logErr("Token refresh failed", refreshError);
      } else {
        console.log("✅ Session refreshed");
        await cacheAccessTokenFromSession(refreshData?.session ?? null);
      }
    }
  } catch (err) {
    logErr("ensureFreshSession error", err);
  }
}

// ─── BACKGROUND TASK ─────────────────────────────────────────────────────────
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

    // ── RETRY: flush any locally-queued entries from previous failed attempts ──
    await withTimeout(
      retryPendingLocalEntries(),
      8000,
      undefined,
      "retryPendingLocalEntries"
    );

    // ── HEARTBEAT: independent unrelated-host fetch, fire-and-forget ───────
    fetch('https://www.google.com', { method: 'HEAD' })
      .then(() => console.log('[HEARTBEAT] ok', Date.now()))
      .catch((e) => console.log('[HEARTBEAT] fail', e?.message, Date.now()));
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
  // Ask Android to batch-deliver at least every 30s during normal
  // (non-Doze) backgrounding, instead of leaving batching entirely up to
  // OS discretion. This does NOT override Doze/App Standby windows (those
  // are a separate, OS-level power-management layer no app-side setting
  // can fully defeat) — it just removes one layer of ambiguity so the
  // ~30s cadence you see outside of Doze windows is intentional rather
  // than incidental.
  deferredUpdatesInterval: 30000,
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

  // The whole original bug was that this call's result was never checked,
  // so tracking proceeded as if the foreground service would be fully
  // protected when it silently wasn't. We still don't hard-block location
  // tracking on this — a safety app that tracks nothing because a
  // notification was denied is worse than one that tracks unreliably — but
  // we now log it loudly and persist the flag so the UI layer can warn the
  // person and offer a way back into system settings.
  const notificationsGranted = await ensureNotificationPermission();
  if (!notificationsGranted) {
    console.log(
      "🚨 _startLocationUpdates: notification permission NOT granted — " +
      "the foreground service notification cannot display, which means Android " +
      "may refuse to treat this as a protected foreground service. Background " +
      "tracking will likely be unreliable (delayed/suspended updates) until " +
      "the person enables notifications in system settings."
    );
  }

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

  // Prime the REST-bypass token cache right away, from whatever session is
  // currently active, so the very first background task invocation already
  // has a usable cached token instead of waiting for ensureFreshSession()
  // to populate it later.
  try {
    const { data } = await supabase.auth.getSession();
    await cacheAccessTokenFromSession(data?.session ?? null);
  } catch (err) {
    logErr("_startLocationUpdates: initial token cache warm-up error", err);
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
    // Re-check (not re-prompt — getPermissionsAsync inside
    // requestNotificationPermissions short-circuits if already granted)
    // notification permission on every health check. This is what lets a
    // person who granted it later, via system settings after initially
    // denying it, get picked up automatically on the next health check
    // (app foreground / AppState change) rather than needing a reinstall
    // or an app update to re-run _startLocationUpdates's one-time check.
    await ensureNotificationPermission();

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