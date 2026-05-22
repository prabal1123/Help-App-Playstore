// import {
//   View,
//   Text,
//   Pressable,
//   ActivityIndicator,
//   Alert,
//   Platform,
//   Linking,
//   StyleSheet,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { useRouter } from "expo-router";
// import { takeMeHomeStyles as styles } from "@/styles/takeMeHome";
// import * as Location from "expo-location";
// import * as Haptics from "expo-haptics";
// import * as Speech from "expo-speech";
// import { useEffect, useState, useRef, useCallback } from "react";
// import { supabase } from "@/supabase/supabase";
// import MapView, { Marker, Polyline } from "react-native-maps";
// import {
//   getPushTokenForUser,
//   sendExpoPushNotification,
// } from "@/services/pushToken";

// // ✅ Fix 2: Proper type for guardian links
// type GuardianLink = {
//   guardian_id: string;
// };

// // ✅ Fix 3: Minimum ms between alert taps to prevent spam
// const ALERT_COOLDOWN_MS = 10000;

// export default function TakeMeHomeScreen() {
//   const router = useRouter();
//   const mapRef = useRef<MapView>(null);

//   // ✅ Fix 4: Only block retry after a SUCCESSFUL load, not on any entry
//   const hasLoadedRef = useRef(false);
//   // ✅ Fix 7: Track mount state to avoid setState after unmount
//   const isMountedRef = useRef(true);
//   // ✅ Fix 3: Track last alert time
//   const lastAlertTimeRef = useRef<number>(0);

//   const [currentLocation, setCurrentLocation] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);
//   const [homeLocation, setHomeLocation] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [loadError, setLoadError] = useState(false);
//   const [navigating, setNavigating] = useState(false);
//   const [alertSending, setAlertSending] = useState(false);

//   // ✅ Fix 7: Mark unmounted on cleanup
//   useEffect(() => {
//     return () => {
//       isMountedRef.current = false;
//       Speech.stop();
//     };
//   }, []);

//   // ─── Fit map to show both markers ─────────────────────────────────────────
//   useEffect(() => {
//     if (currentLocation && homeLocation && mapRef.current) {
//       mapRef.current.fitToCoordinates([currentLocation, homeLocation], {
//         edgePadding: { top: 100, right: 80, bottom: 100, left: 80 },
//         animated: true,
//       });
//     }
//   }, [currentLocation, homeLocation]);

//   // ✅ Fix 5: Memoized speak helper
//   const speak = useCallback((text: string) => {
//     Speech.stop();
//     Speech.speak(text, { rate: 0.95, pitch: 1.0 });
//   }, []);

//   // ─── Start navigation ──────────────────────────────────────────────────────
//   const startNavigation = async () => {
//     if (!homeLocation || navigating) return;
//     await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//     speak("Starting navigation to home.");
//     const { latitude, longitude } = homeLocation;
//     setNavigating(true);
//     try {
//       if (Platform.OS === "ios") {
//         const googleMapsUrl = `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=walking`;
//         const appleMapsUrl = `maps://?daddr=${latitude},${longitude}&dirflg=w`;
//         const supported = await Linking.canOpenURL(googleMapsUrl);
//         await Linking.openURL(supported ? googleMapsUrl : appleMapsUrl);
//       } else {
//         const googleMapsUrl = `google.navigation:q=${latitude},${longitude}&mode=w`;
//         const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking`;
//         const supported = await Linking.canOpenURL(googleMapsUrl);
//         await Linking.openURL(supported ? googleMapsUrl : fallbackUrl);
//       }
//     } catch {
//       Alert.alert("Error", "Could not open maps app.");
//     } finally {
//       // ✅ Fix 7: Only update state if still mounted
//       if (isMountedRef.current) setNavigating(false);
//     }
//   };

//   // ─── Load data ─────────────────────────────────────────────────────────────
//   const loadData = useCallback(async () => {
//     // ✅ Fix 4: Only skip if previously loaded successfully
//     if (hasLoadedRef.current) return;

//     setLoadError(false);
//     setLoading(true);

//     try {
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== "granted") {
//         Alert.alert(
//           "Permission required",
//           "Location access is needed to show your position on the map."
//         );
//         if (isMountedRef.current) setLoadError(true);
//         return;
//       }

//       let location: Location.LocationObject | null = null;
//       try {
//         location = await Location.getCurrentPositionAsync({
//           accuracy: Location.Accuracy.Balanced,
//         });
//       } catch {
//         location = await Location.getLastKnownPositionAsync();
//       }

//       if (!location) {
//         Alert.alert(
//           "Location unavailable",
//           "Could not get your current location. Please try again."
//         );
//         if (isMountedRef.current) setLoadError(true);
//         return;
//       }

//       if (isMountedRef.current) {
//         setCurrentLocation({
//           latitude: location.coords.latitude,
//           longitude: location.coords.longitude,
//         });
//       }

//       const { data: authData, error: authError } =
//         await supabase.auth.getUser();
//       if (authError || !authData?.user) {
//         if (isMountedRef.current) setLoadError(true);
//         return;
//       }

//       const user = authData.user;

//       const { data: homeData, error: homeError } = await supabase
//         .from("help_app_user_locations")
//         .select("lat, lng")
//         .eq("user_id", user.id)
//         .eq("is_home", true)
//         .maybeSingle();

//       if (homeError) {
//         console.error("Home location fetch error:", homeError.message);
//       }

//       // ✅ Fix 6: Guard against null lat/lng before calling Number()
//       if (homeData && homeData.lat != null && homeData.lng != null) {
//         const lat = Number(homeData.lat);
//         const lng = Number(homeData.lng);
//         if (!isNaN(lat) && !isNaN(lng) && isMountedRef.current) {
//           setHomeLocation({ latitude: lat, longitude: lng });
//         }
//       }

//       // ✅ Fix 4: Only mark loaded after full success
//       hasLoadedRef.current = true;
//     } catch (err) {
//       console.error("TakeMeHome loadData error:", err);
//       if (isMountedRef.current) setLoadError(true);
//       const msg = String(err).toLowerCase();
//       if (
//         !msg.includes("location") &&
//         !msg.includes("gps") &&
//         !msg.includes("position")
//       ) {
//         Alert.alert("Error", "Could not load home data. Please try again.");
//       }
//     } finally {
//       // ✅ Fix 1: router removed from deps — it was never used inside loadData
//       if (isMountedRef.current) setLoading(false);
//     }
//   }, []); // ✅ Fix 1: No false deps

//   useEffect(() => {
//     loadData();
//   }, [loadData]);

//   // ─── Alert guardian ────────────────────────────────────────────────────────
//   const alertGuardian = async () => {
//     // ✅ Fix 3: Cooldown check to prevent spam
//     const now = Date.now();
//     if (now - lastAlertTimeRef.current < ALERT_COOLDOWN_MS) {
//       const remaining = Math.ceil(
//         (ALERT_COOLDOWN_MS - (now - lastAlertTimeRef.current)) / 1000
//       );
//       Alert.alert(
//         "Please wait",
//         `You can send another alert in ${remaining} seconds.`
//       );
//       return;
//     }

//     try {
//       setAlertSending(true);
//       await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

//       const {
//         data: { user },
//         error: userError,
//       } = await supabase.auth.getUser();

//       if (userError || !user) {
//         Alert.alert("Session expired", "Please log in again.");
//         return;
//       }

//       const { data: links, error: linksError } = await supabase
//         .from("help_app_guardian_links")
//         .select("guardian_id")
//         .eq("user_id", user.id)
//         .eq("status", "approved");

//       if (linksError) throw linksError;

//       // ✅ Fix 9: Warn user if no guardian is linked
//       if (!links || links.length === 0) {
//         Alert.alert(
//           "No guardian linked",
//           "You don't have an approved guardian yet. Your alert was logged but no one was notified."
//         );
//         await supabase.from("help_app_alerts").insert({
//           user_id: user.id,
//           guardian_id: null,
//           alert_type: "panic",
//           message: "User needs help!",
//           triggered_at: new Date().toISOString(),
//           resolved: false,
//         });
//         return;
//       }

//       const alertRows = (links as GuardianLink[]).map((link) => ({
//         user_id: user.id,
//         guardian_id: link.guardian_id,
//         alert_type: "panic",
//         message: "User needs help!",
//         triggered_at: new Date().toISOString(),
//         resolved: false,
//       }));

//       const { error: alertError } = await supabase
//         .from("help_app_alerts")
//         .insert(alertRows);

//       if (alertError) throw alertError;

//       // ✅ Fix 3: Record time only after successful insert
//       lastAlertTimeRef.current = Date.now();

//       for (const link of links as GuardianLink[]) {
//         try {
//           const guardianToken = await getPushTokenForUser(link.guardian_id);
//           if (guardianToken) {
//             await sendExpoPushNotification(
//               guardianToken,
//               "🚨 Emergency Alert",
//               "Your linked user needs help!"
//             );
//           }
//         } catch (pushErr) {
//           console.error("Push to guardian failed:", pushErr);
//         }
//       }

//       speak("Emergency alert sent to guardian.");
//       Alert.alert("🚨 Alert Sent", "Your guardian has been notified.");
//     } catch (e: any) {
//       console.error("alertGuardian error:", e);
//       Alert.alert(
//         "Error",
//         e.message ?? "Could not send alert. Please try again."
//       );
//     } finally {
//       if (isMountedRef.current) setAlertSending(false);
//     }
//   };

//   // ─── Loading UI ────────────────────────────────────────────────────────────
//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <ActivityIndicator size="large" color="#0f766e" />
//       </SafeAreaView>
//     );
//   }

//   // ✅ Fix 8: Error + retry UI instead of blank screen
//   if (loadError) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View
//           style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}
//         >
//           <Text
//             style={{ fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 8 }}
//           >
//             Could not load location
//           </Text>
//           <Text
//             style={{ color: "#64748b", textAlign: "center", marginBottom: 24 }}
//           >
//             Please check your location permissions and try again.
//           </Text>
//           <Pressable
//             onPress={() => {
//               hasLoadedRef.current = false;
//               loadData();
//             }}
//             style={{
//               backgroundColor: "#0f766e",
//               paddingVertical: 14,
//               paddingHorizontal: 32,
//               borderRadius: 16,
//             }}
//           >
//             <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
//               Retry
//             </Text>
//           </Pressable>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   const initialRegion = {
//     latitude: currentLocation?.latitude ?? 28.6139,
//     longitude: currentLocation?.longitude ?? 77.209,
//     latitudeDelta: 0.05,
//     longitudeDelta: 0.05,
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* HEADER */}
//       <View style={styles.header}>
//         <Pressable onPress={() => router.back()}>
//           <Text style={styles.back}>←</Text>
//         </Pressable>
//         <Text style={styles.title}>Take Me Home</Text>
//         <Pressable
//           onPress={() =>
//             speak("Follow the blue route to reach your saved home.")
//           }
//         >
//           <Text style={styles.voice}>🔊</Text>
//         </Pressable>
//       </View>

//       {/* MAP */}
//       <View style={styles.map}>
//         <MapView
//           ref={mapRef}
//           style={StyleSheet.absoluteFillObject}
//           initialRegion={initialRegion}
//           showsUserLocation={false}
//           showsMyLocationButton={false}
//         >
//           {currentLocation && (
//             <Marker coordinate={currentLocation} title="You are here">
//               <View style={mapStyles.userDot} />
//             </Marker>
//           )}

//           {homeLocation && (
//             <Marker coordinate={homeLocation} title="Home">
//               <Text style={{ fontSize: 32 }}>🏠</Text>
//             </Marker>
//           )}

//           {currentLocation && homeLocation && (
//             <Polyline
//               coordinates={[currentLocation, homeLocation]}
//               strokeColor="#1A73E8"
//               strokeWidth={5}
//             />
//           )}
//         </MapView>
//       </View>

//       {/* INFO CARD */}
//       <View style={styles.card}>
//         <Text style={styles.direction}>📍 You → 🏠 Home</Text>
//         {/* ✅ Fix 10: On-screen disclaimer that the line is not a real route */}
//         <Text style={styles.sub}>
//           {homeLocation
//             ? "Tap Start Navigation for turn-by-turn directions.\nBlue line shows straight-line direction only."
//             : "No home set yet — ask your guardian to set your home location"}
//         </Text>
//       </View>

//       {homeLocation && (
//         <Pressable
//           style={[styles.navBtn, navigating && styles.navBtnDisabled]}
//           onPress={startNavigation}
//           disabled={navigating}
//         >
//           {navigating ? (
//             <ActivityIndicator color="#fff" />
//           ) : (
//             <>
//               <Text style={styles.navBtnText}>🧭 Start Navigation</Text>
//               <Text style={styles.navBtnSub}>Opens in Google Maps</Text>
//             </>
//           )}
//         </Pressable>
//       )}

//       <Pressable
//         style={[styles.alertBtn, alertSending && { opacity: 0.6 }]}
//         onPress={alertGuardian}
//         disabled={alertSending}
//       >
//         {alertSending ? (
//           <ActivityIndicator color="#fff" />
//         ) : (
//           <Text style={styles.alertText}>🚨 Alert Guardian</Text>
//         )}
//       </Pressable>
//     </SafeAreaView>
//   );
// }

// const mapStyles = StyleSheet.create({
//   userDot: {
//     width: 20,
//     height: 20,
//     borderRadius: 10,
//     backgroundColor: "#1A73E8",
//     borderWidth: 2,
//     borderColor: "#fff",
//   },
// });


// import {
//   View,
//   Text,
//   Pressable,
//   ActivityIndicator,
//   Alert,
//   Platform,
//   Linking,
//   StyleSheet,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { useRouter } from "expo-router";
// import { takeMeHomeStyles as styles } from "@/styles/takeMeHome";
// import * as Location from "expo-location";
// import * as Haptics from "expo-haptics";
// import * as Speech from "expo-speech";
// import { useEffect, useState, useRef, useCallback } from "react";
// import { supabase } from "@/supabase/supabase";
// import MapView, { Marker, Polyline } from "react-native-maps";
// import {
//   getPushTokenForUser,
//   sendExpoPushNotification,
// } from "@/services/pushToken";

// // ─── Types ────────────────────────────────────────────────────────────────────
// type GuardianLink = {
//   guardian_id: string;
// };

// type LatLng = {
//   latitude: number;
//   longitude: number;
// };

// // ─── Constants ────────────────────────────────────────────────────────────────
// const ALERT_COOLDOWN_MS = 10000;

// // ─── Accuracy mode definitions ────────────────────────────────────────────────
// // HIGH   → GPS-level precision, updates every 3s / 5m  — best accuracy, more battery
// // MEDIUM → Network/cell-tower, updates every 10s / 20m — good enough, saves battery
// type AccuracyMode = "high" | "medium";

// const ACCURACY_CONFIG: Record<
//   AccuracyMode,
//   {
//     label: string;
//     icon: string;
//     description: string;
//     accuracy: Location.Accuracy;
//     timeInterval: number;
//     distanceInterval: number;
//   }
// > = {
//   high: {
//     label: "High",
//     icon: "🎯",
//     description: "GPS · updates every 5m",
//     accuracy: Location.Accuracy.High,
//     timeInterval: 3000,
//     distanceInterval: 5,
//   },
//   medium: {
//     label: "Battery Saver",
//     icon: "🔋",
//     description: "Network · updates every 20m",
//     accuracy: Location.Accuracy.Balanced,
//     timeInterval: 10000,
//     distanceInterval: 20,
//   },
// };

// // ─── Haversine distance (metres) ──────────────────────────────────────────────
// function getDistanceMetres(a: LatLng, b: LatLng): number {
//   const R = 6371000;
//   const toRad = (d: number) => (d * Math.PI) / 180;
//   const dLat = toRad(b.latitude - a.latitude);
//   const dLng = toRad(b.longitude - a.longitude);
//   const sinLat = Math.sin(dLat / 2);
//   const sinLng = Math.sin(dLng / 2);
//   const c =
//     2 *
//     Math.asin(
//       Math.sqrt(
//         sinLat * sinLat +
//           Math.cos(toRad(a.latitude)) *
//             Math.cos(toRad(b.latitude)) *
//             sinLng * sinLng
//       )
//     );
//   return R * c;
// }

// function formatDistance(metres: number): string {
//   if (metres < 1000) return `${Math.round(metres)} m`;
//   return `${(metres / 1000).toFixed(1)} km`;
// }

// // ─── Real-time Supabase helper ────────────────────────────────────────────────
// // Upserts the user's live location into help_app_user_locations
// // using a separate row flagged with is_live = true.
// async function pushLiveLocation(userId: string, loc: LatLng) {
//   await supabase.from("help_app_user_locations").upsert(
//     {
//       user_id: userId,
//       lat: loc.latitude,
//       lng: loc.longitude,
//       is_home: false,
//       is_live: true,
//       updated_at: new Date().toISOString(),
//     },
//     { onConflict: "user_id,is_live" } // requires a unique index on (user_id, is_live) where is_live = true
//   );
// }

// // ─── Component ────────────────────────────────────────────────────────────────
// export default function TakeMeHomeScreen() {
//   const router = useRouter();
//   const mapRef = useRef<MapView>(null);

//   // Refs
//   const hasLoadedRef = useRef(false);
//   const isMountedRef = useRef(true);
//   const lastAlertTimeRef = useRef<number>(0);
//   const locationWatcherRef = useRef<Location.LocationSubscription | null>(null);
//   const userIdRef = useRef<string | null>(null);

//   // State
//   const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
//   const [homeLocation, setHomeLocation] = useState<LatLng | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [loadError, setLoadError] = useState(false);
//   const [navigating, setNavigating] = useState(false);
//   const [alertSending, setAlertSending] = useState(false);
//   const [accuracyMode, setAccuracyMode] = useState<AccuracyMode>("high");
//   const [distanceToHome, setDistanceToHome] = useState<number | null>(null);

//   // ─── Cleanup on unmount ─────────────────────────────────────────────────────
//   useEffect(() => {
//     return () => {
//       isMountedRef.current = false;
//       Speech.stop();
//       locationWatcherRef.current?.remove();
//       locationWatcherRef.current = null;
//     };
//   }, []);

//   // ─── Update distance whenever either location changes ───────────────────────
//   useEffect(() => {
//     if (currentLocation && homeLocation) {
//       setDistanceToHome(getDistanceMetres(currentLocation, homeLocation));
//     }
//   }, [currentLocation, homeLocation]);

//   // ─── Fit map to show both markers (runs every time both are available) ──────
//   // NOTE: No hasFittedRef guard here — this ensures the map always fits
//   // even if homeLocation arrives after the initial render.
//   useEffect(() => {
//     if (currentLocation && homeLocation && mapRef.current) {
//       mapRef.current.fitToCoordinates([currentLocation, homeLocation], {
//         edgePadding: { top: 100, right: 80, bottom: 100, left: 80 },
//         animated: true,
//       });
//     }
//   }, [homeLocation]); // Only re-fit when home changes, not on every live location tick

//   // ─── Memoized speak helper ──────────────────────────────────────────────────
//   const speak = useCallback((text: string) => {
//     Speech.stop();
//     Speech.speak(text, { rate: 0.95, pitch: 1.0 });
//   }, []);

//   // ─── Location watcher — starts/restarts when accuracy mode changes ──────────
//   const startLocationWatcher = useCallback(
//     async (mode: AccuracyMode) => {
//       // Remove existing watcher before creating a new one
//       if (locationWatcherRef.current) {
//         locationWatcherRef.current.remove();
//         locationWatcherRef.current = null;
//       }

//       const config = ACCURACY_CONFIG[mode];

//       try {
//         locationWatcherRef.current = await Location.watchPositionAsync(
//           {
//             accuracy: config.accuracy,
//             timeInterval: config.timeInterval,
//             distanceInterval: config.distanceInterval,
//           },
//           async (loc) => {
//             if (!isMountedRef.current) return;

//             const next: LatLng = {
//               latitude: loc.coords.latitude,
//               longitude: loc.coords.longitude,
//             };

//             // ── Update local state ──────────────────────────────────────────
//             setCurrentLocation(next);

//             // ── Push to Supabase for real-time guardian monitoring ──────────
//             if (userIdRef.current) {
//               pushLiveLocation(userIdRef.current, next).catch((err) =>
//                 console.warn("pushLiveLocation failed:", err)
//               );
//             }
//           }
//         );
//         console.log(`📍 Watcher started — mode: ${mode}`);
//       } catch (err) {
//         console.error("watchPositionAsync error:", err);
//       }
//     },
//     [] // stable — no deps needed, reads refs directly
//   );

//   // ─── Re-start watcher when accuracy mode toggles (after initial load) ───────
//   useEffect(() => {
//     if (!hasLoadedRef.current) return;
//     startLocationWatcher(accuracyMode);
//   }, [accuracyMode, startLocationWatcher]);

//   // ─── Accuracy toggle handler ────────────────────────────────────────────────
//   const toggleAccuracy = useCallback(async () => {
//     const next: AccuracyMode = accuracyMode === "high" ? "medium" : "high";
//     await Haptics.selectionAsync();
//     setAccuracyMode(next);
//     speak(`Switched to ${ACCURACY_CONFIG[next].label} accuracy mode.`);
//   }, [accuracyMode, speak]);

//   // ─── Start navigation ───────────────────────────────────────────────────────
//   const startNavigation = async () => {
//     if (!homeLocation || navigating) return;
//     await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//     speak("Starting navigation to home.");
//     const { latitude, longitude } = homeLocation;
//     setNavigating(true);
//     try {
//       if (Platform.OS === "ios") {
//         const googleMapsUrl = `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=walking`;
//         const appleMapsUrl = `maps://?daddr=${latitude},${longitude}&dirflg=w`;
//         const supported = await Linking.canOpenURL(googleMapsUrl);
//         await Linking.openURL(supported ? googleMapsUrl : appleMapsUrl);
//       } else {
//         const googleMapsUrl = `google.navigation:q=${latitude},${longitude}&mode=w`;
//         const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking`;
//         const supported = await Linking.canOpenURL(googleMapsUrl);
//         await Linking.openURL(supported ? googleMapsUrl : fallbackUrl);
//       }
//     } catch {
//       Alert.alert("Error", "Could not open maps app.");
//     } finally {
//       if (isMountedRef.current) setNavigating(false);
//     }
//   };

//   // ─── Load data ──────────────────────────────────────────────────────────────
//   const loadData = useCallback(async () => {
//     if (hasLoadedRef.current) return;

//     setLoadError(false);
//     setLoading(true);

//     try {
//       // 1. Request location permission
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== "granted") {
//         Alert.alert(
//           "Permission required",
//           "Location access is needed to show your position on the map."
//         );
//         if (isMountedRef.current) setLoadError(true);
//         return;
//       }

//       // 2. One-shot fetch for an instant first dot before watcher fires
//       let location: Location.LocationObject | null = null;
//       try {
//         location = await Location.getCurrentPositionAsync({
//           accuracy: Location.Accuracy.High,
//         });
//       } catch {
//         location = await Location.getLastKnownPositionAsync();
//       }

//       if (!location) {
//         Alert.alert(
//           "Location unavailable",
//           "Could not get your current location. Please try again."
//         );
//         if (isMountedRef.current) setLoadError(true);
//         return;
//       }

//       if (isMountedRef.current) {
//         setCurrentLocation({
//           latitude: location.coords.latitude,
//           longitude: location.coords.longitude,
//         });
//       }

//       // 3. Auth — store userId in ref for watcher callback
//       const { data: authData, error: authError } =
//         await supabase.auth.getUser();
//       if (authError || !authData?.user) {
//         if (isMountedRef.current) setLoadError(true);
//         return;
//       }

//       userIdRef.current = authData.user.id;

//       // 4. Start real-time watcher (uses accuracyMode default "high")
//       await startLocationWatcher("high");

//       // 5. Fetch home location
//       const { data: homeData, error: homeError } = await supabase
//         .from("help_app_user_locations")
//         .select("lat, lng")
//         .eq("user_id", authData.user.id)
//         .eq("is_home", true)
//         .maybeSingle();

//       if (homeError) {
//         console.error("Home location fetch error:", homeError.message);
//       }

//       if (homeData && homeData.lat != null && homeData.lng != null) {
//         const lat = Number(homeData.lat);
//         const lng = Number(homeData.lng);
//         if (!isNaN(lat) && !isNaN(lng) && isMountedRef.current) {
//           setHomeLocation({ latitude: lat, longitude: lng });
//         }
//       }

//       hasLoadedRef.current = true;
//     } catch (err) {
//       console.error("TakeMeHome loadData error:", err);
//       if (isMountedRef.current) setLoadError(true);
//       const msg = String(err).toLowerCase();
//       if (
//         !msg.includes("location") &&
//         !msg.includes("gps") &&
//         !msg.includes("position")
//       ) {
//         Alert.alert("Error", "Could not load home data. Please try again.");
//       }
//     } finally {
//       if (isMountedRef.current) setLoading(false);
//     }
//   }, [startLocationWatcher]);

//   useEffect(() => {
//     loadData();
//   }, [loadData]);

//   // ─── Alert guardian ─────────────────────────────────────────────────────────
//   const alertGuardian = async () => {
//     const now = Date.now();
//     if (now - lastAlertTimeRef.current < ALERT_COOLDOWN_MS) {
//       const remaining = Math.ceil(
//         (ALERT_COOLDOWN_MS - (now - lastAlertTimeRef.current)) / 1000
//       );
//       Alert.alert(
//         "Please wait",
//         `You can send another alert in ${remaining} seconds.`
//       );
//       return;
//     }

//     try {
//       setAlertSending(true);
//       await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

//       const {
//         data: { user },
//         error: userError,
//       } = await supabase.auth.getUser();

//       if (userError || !user) {
//         Alert.alert("Session expired", "Please log in again.");
//         return;
//       }

//       const { data: links, error: linksError } = await supabase
//         .from("help_app_guardian_links")
//         .select("guardian_id")
//         .eq("user_id", user.id)
//         .eq("status", "approved");

//       if (linksError) throw linksError;

//       if (!links || links.length === 0) {
//         Alert.alert(
//           "No guardian linked",
//           "You don't have an approved guardian yet. Your alert was logged but no one was notified."
//         );
//         await supabase.from("help_app_alerts").insert({
//           user_id: user.id,
//           guardian_id: null,
//           alert_type: "panic",
//           message: "User needs help!",
//           triggered_at: new Date().toISOString(),
//           resolved: false,
//         });
//         return;
//       }

//       const alertRows = (links as GuardianLink[]).map((link) => ({
//         user_id: user.id,
//         guardian_id: link.guardian_id,
//         alert_type: "panic",
//         message: "User needs help!",
//         triggered_at: new Date().toISOString(),
//         resolved: false,
//       }));

//       const { error: alertError } = await supabase
//         .from("help_app_alerts")
//         .insert(alertRows);

//       if (alertError) throw alertError;

//       lastAlertTimeRef.current = Date.now();

//       for (const link of links as GuardianLink[]) {
//         try {
//           const guardianToken = await getPushTokenForUser(link.guardian_id);
//           if (guardianToken) {
//             await sendExpoPushNotification(
//               guardianToken,
//               "🚨 Emergency Alert",
//               "Your linked user needs help!"
//             );
//           }
//         } catch (pushErr) {
//           console.error("Push to guardian failed:", pushErr);
//         }
//       }

//       speak("Emergency alert sent to guardian.");
//       Alert.alert("🚨 Alert Sent", "Your guardian has been notified.");
//     } catch (e: any) {
//       console.error("alertGuardian error:", e);
//       Alert.alert(
//         "Error",
//         e.message ?? "Could not send alert. Please try again."
//       );
//     } finally {
//       if (isMountedRef.current) setAlertSending(false);
//     }
//   };

//   // ─── Loading UI ─────────────────────────────────────────────────────────────
//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <ActivityIndicator size="large" color="#0f766e" />
//       </SafeAreaView>
//     );
//   }

//   // ─── Error + retry UI ───────────────────────────────────────────────────────
//   if (loadError) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View
//           style={{
//             flex: 1,
//             justifyContent: "center",
//             alignItems: "center",
//             padding: 24,
//           }}
//         >
//           <Text
//             style={{
//               fontSize: 18,
//               fontWeight: "700",
//               color: "#0f172a",
//               marginBottom: 8,
//             }}
//           >
//             Could not load location
//           </Text>
//           <Text
//             style={{ color: "#64748b", textAlign: "center", marginBottom: 24 }}
//           >
//             Please check your location permissions and try again.
//           </Text>
//           <Pressable
//             onPress={() => {
//               hasLoadedRef.current = false;
//               loadData();
//             }}
//             style={{
//               backgroundColor: "#0f766e",
//               paddingVertical: 14,
//               paddingHorizontal: 32,
//               borderRadius: 16,
//             }}
//           >
//             <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
//               Retry
//             </Text>
//           </Pressable>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   // ─── Main render ────────────────────────────────────────────────────────────
//   const initialRegion = {
//     latitude: currentLocation?.latitude ?? 28.6139,
//     longitude: currentLocation?.longitude ?? 77.209,
//     latitudeDelta: 0.05,
//     longitudeDelta: 0.05,
//   };

//   const activeCfg = ACCURACY_CONFIG[accuracyMode];

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* ── HEADER ── */}
//       <View style={styles.header}>
//         <Pressable onPress={() => router.back()}>
//           <Text style={styles.back}>←</Text>
//         </Pressable>
//         <Text style={styles.title}>Take Me Home</Text>
//         <Pressable
//           onPress={() =>
//             speak("Follow the blue route to reach your saved home.")
//           }
//         >
//           <Text style={styles.voice}>🔊</Text>
//         </Pressable>
//       </View>

//       {/* ── MAP ── */}
//       <View style={styles.map}>
//         <MapView
//           ref={mapRef}
//           style={StyleSheet.absoluteFillObject}
//           initialRegion={initialRegion}
//           showsUserLocation={false}
//           showsMyLocationButton={false}
//         >
//           {/* ── User dot — FIX: no tracksViewChanges={false} on custom View ── */}
//           {currentLocation && (
//             <Marker
//               coordinate={currentLocation}
//               title="You are here"
//               anchor={{ x: 0.5, y: 0.5 }}
//             >
//               <View style={mapStyles.userDot} />
//             </Marker>
//           )}

//           {/* ── Home marker — FIX: no tracksViewChanges={false} on custom Text ── */}
//           {homeLocation && (
//             <Marker
//               coordinate={homeLocation}
//               title="Home"
//               anchor={{ x: 0.5, y: 1.0 }}
//             >
//               <Text style={{ fontSize: 32 }}>🏠</Text>
//             </Marker>
//           )}

//           {/* ── Straight-line route ── */}
//           {currentLocation && homeLocation && (
//             <Polyline
//               coordinates={[currentLocation, homeLocation]}
//               strokeColor="#1A73E8"
//               strokeWidth={5}
//             />
//           )}
//         </MapView>

//         {/* ── Live tracking indicator ── */}
//         <View style={mapStyles.liveChip}>
//           <View style={mapStyles.liveDot} />
//           <Text style={mapStyles.liveText}>LIVE</Text>
//         </View>

//         {/* ── Accuracy toggle pill ── */}
//         <Pressable
//           onPress={toggleAccuracy}
//           style={[
//             mapStyles.accuracyPill,
//             accuracyMode === "medium" && mapStyles.accuracyPillMedium,
//           ]}
//         >
//           <Text style={mapStyles.accuracyIcon}>{activeCfg.icon}</Text>
//           <View>
//             <Text style={mapStyles.accuracyLabel}>{activeCfg.label}</Text>
//             <Text style={mapStyles.accuracyDesc}>{activeCfg.description}</Text>
//           </View>
//         </Pressable>
//       </View>

//       {/* ── INFO CARD ── */}
//       <View style={styles.card}>
//         <Text style={styles.direction}>📍 You → 🏠 Home</Text>

//         {/* ── Distance badge ── */}
//         {distanceToHome !== null && (
//           <View style={cardStyles.distanceBadge}>
//             <Text style={cardStyles.distanceText}>
//               📏 {formatDistance(distanceToHome)} away
//             </Text>
//           </View>
//         )}

//         <Text style={styles.sub}>
//           {homeLocation
//             ? "Tap Start Navigation for turn-by-turn directions.\nBlue line shows straight-line direction only."
//             : "No home set yet — ask your guardian to set your home location."}
//         </Text>
//       </View>

//       {/* ── START NAVIGATION ── */}
//       {homeLocation && (
//         <Pressable
//           style={[styles.navBtn, navigating && styles.navBtnDisabled]}
//           onPress={startNavigation}
//           disabled={navigating}
//         >
//           {navigating ? (
//             <ActivityIndicator color="#fff" />
//           ) : (
//             <>
//               <Text style={styles.navBtnText}>🧭 Start Navigation</Text>
//               <Text style={styles.navBtnSub}>Opens in Google Maps</Text>
//             </>
//           )}
//         </Pressable>
//       )}

//       {/* ── ALERT GUARDIAN ── */}
//       <Pressable
//         style={[styles.alertBtn, alertSending && { opacity: 0.6 }]}
//         onPress={alertGuardian}
//         disabled={alertSending}
//       >
//         {alertSending ? (
//           <ActivityIndicator color="#fff" />
//         ) : (
//           <Text style={styles.alertText}>🚨 Alert Guardian</Text>
//         )}
//       </Pressable>
//     </SafeAreaView>
//   );
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────
// const mapStyles = StyleSheet.create({
//   // User location dot
//   userDot: {
//     width: 20,
//     height: 20,
//     borderRadius: 10,
//     backgroundColor: "#1A73E8",
//     borderWidth: 2,
//     borderColor: "#fff",
//     // Shadow so it's visible over map tiles
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.3,
//     shadowRadius: 2,
//     elevation: 3,
//   },

//   // "LIVE" chip — top-left of map
//   liveChip: {
//     position: "absolute",
//     top: 12,
//     left: 12,
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 5,
//     backgroundColor: "rgba(0,0,0,0.55)",
//     paddingVertical: 5,
//     paddingHorizontal: 10,
//     borderRadius: 20,
//   },
//   liveDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: "#22c55e", // green pulse feel (static — animate if desired)
//   },
//   liveText: {
//     color: "#fff",
//     fontSize: 11,
//     fontWeight: "700",
//     letterSpacing: 1,
//   },

//   // Accuracy pill — top-right of map
//   accuracyPill: {
//     position: "absolute",
//     top: 12,
//     right: 12,
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//     backgroundColor: "#0f766e",
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderRadius: 20,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 4,
//   },
//   accuracyPillMedium: {
//     backgroundColor: "#92400e",
//   },
//   accuracyIcon: {
//     fontSize: 16,
//   },
//   accuracyLabel: {
//     color: "#fff",
//     fontSize: 12,
//     fontWeight: "700",
//     lineHeight: 16,
//   },
//   accuracyDesc: {
//     color: "rgba(255,255,255,0.75)",
//     fontSize: 10,
//     lineHeight: 14,
//   },
// });

// const cardStyles = StyleSheet.create({
//   distanceBadge: {
//     alignSelf: "flex-start",
//     backgroundColor: "#e0f2fe",
//     paddingVertical: 4,
//     paddingHorizontal: 10,
//     borderRadius: 12,
//     marginBottom: 6,
//   },
//   distanceText: {
//     color: "#0369a1",
//     fontSize: 13,
//     fontWeight: "600",
//   },
// });



import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { takeMeHomeStyles as styles } from "@/styles/takeMeHome";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/supabase/supabase";
import MapView, { Marker, Polyline } from "react-native-maps";
import {
  getPushTokenForUser,
  sendExpoPushNotification,
} from "@/services/pushToken";

// ─── Types ────────────────────────────────────────────────────────────────────
type GuardianLink = {
  guardian_id: string;
};

type LatLng = {
  latitude: number;
  longitude: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const ALERT_COOLDOWN_MS = 10000;

// ─── Accuracy mode definitions ────────────────────────────────────────────────
type AccuracyMode = "high" | "medium";

const ACCURACY_CONFIG: Record<
  AccuracyMode,
  {
    label: string;
    icon: string;
    description: string;
    accuracy: Location.Accuracy;
    timeInterval: number;
    distanceInterval: number;
  }
> = {
  high: {
    label: "High",
    icon: "🎯",
    description: "GPS · updates every 5m",
    accuracy: Location.Accuracy.High,
    timeInterval: 3000,
    distanceInterval: 5,
  },
  medium: {
    label: "Battery Saver",
    icon: "🔋",
    description: "Network · updates every 20m",
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 10000,
    distanceInterval: 20,
  },
};

// ─── Haversine distance (metres) ──────────────────────────────────────────────
function getDistanceMetres(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const c =
    2 *
    Math.asin(
      Math.sqrt(
        sinLat * sinLat +
          Math.cos(toRad(a.latitude)) *
            Math.cos(toRad(b.latitude)) *
            sinLng * sinLng
      )
    );
  return R * c;
}

function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

// ─── Simple insert for live location ─────────────────────────────────────────
// Inserts a new row each time location changes so guardian's
// realtime INSERT subscription picks it up immediately.
async function pushLiveLocation(userId: string, loc: LatLng) {
  await supabase.from("help_app_user_locations").insert({
    user_id: userId,
    lat: loc.latitude,
    lng: loc.longitude,
    is_home: false,
    recorded_at: new Date().toISOString(),
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function TakeMeHomeScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  // Refs
  const hasLoadedRef = useRef(false);
  const isMountedRef = useRef(true);
  const lastAlertTimeRef = useRef<number>(0);
  const locationWatcherRef = useRef<Location.LocationSubscription | null>(null);
  const userIdRef = useRef<string | null>(null);

  // State
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [homeLocation, setHomeLocation] = useState<LatLng | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [alertSending, setAlertSending] = useState(false);
  const [accuracyMode, setAccuracyMode] = useState<AccuracyMode>("high");
  const [distanceToHome, setDistanceToHome] = useState<number | null>(null);

  // ─── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      Speech.stop();
      locationWatcherRef.current?.remove();
      locationWatcherRef.current = null;
    };
  }, []);

  // ─── Update distance whenever either location changes ───────────────────────
  useEffect(() => {
    if (currentLocation && homeLocation) {
      setDistanceToHome(getDistanceMetres(currentLocation, homeLocation));
    }
  }, [currentLocation, homeLocation]);

  // ─── Fit map to show both markers ──────────────────────────────────────────
  useEffect(() => {
    if (currentLocation && homeLocation && mapRef.current) {
      mapRef.current.fitToCoordinates([currentLocation, homeLocation], {
        edgePadding: { top: 100, right: 80, bottom: 100, left: 80 },
        animated: true,
      });
    }
  }, [homeLocation]);

  // ─── Memoized speak helper ──────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    Speech.stop();
    Speech.speak(text, { rate: 0.95, pitch: 1.0 });
  }, []);

  // ─── Location watcher ───────────────────────────────────────────────────────
  const startLocationWatcher = useCallback(
    async (mode: AccuracyMode) => {
      if (locationWatcherRef.current) {
        locationWatcherRef.current.remove();
        locationWatcherRef.current = null;
      }

      const config = ACCURACY_CONFIG[mode];

      try {
        locationWatcherRef.current = await Location.watchPositionAsync(
          {
            accuracy: config.accuracy,
            timeInterval: config.timeInterval,
            distanceInterval: config.distanceInterval,
          },
          async (loc) => {
            if (!isMountedRef.current) return;

            const next: LatLng = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            };

            setCurrentLocation(next);

            // Push to Supabase for real-time guardian monitoring
            if (userIdRef.current) {
              pushLiveLocation(userIdRef.current, next).catch((err) =>
                console.warn("pushLiveLocation failed:", err)
              );
            }
          }
        );
        console.log(`📍 Watcher started — mode: ${mode}`);
      } catch (err) {
        console.error("watchPositionAsync error:", err);
      }
    },
    []
  );

  // ─── Re-start watcher when accuracy mode toggles ───────────────────────────
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    startLocationWatcher(accuracyMode);
  }, [accuracyMode, startLocationWatcher]);

  // ─── Accuracy toggle handler ────────────────────────────────────────────────
  const toggleAccuracy = useCallback(async () => {
    const next: AccuracyMode = accuracyMode === "high" ? "medium" : "high";
    await Haptics.selectionAsync();
    setAccuracyMode(next);
    speak(`Switched to ${ACCURACY_CONFIG[next].label} accuracy mode.`);
  }, [accuracyMode, speak]);

  // ─── Start navigation ───────────────────────────────────────────────────────
  const startNavigation = async () => {
    if (!homeLocation || navigating) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    speak("Starting navigation to home.");
    const { latitude, longitude } = homeLocation;
    setNavigating(true);
    try {
      if (Platform.OS === "ios") {
        const googleMapsUrl = `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=walking`;
        const appleMapsUrl = `maps://?daddr=${latitude},${longitude}&dirflg=w`;
        const supported = await Linking.canOpenURL(googleMapsUrl);
        await Linking.openURL(supported ? googleMapsUrl : appleMapsUrl);
      } else {
        const googleMapsUrl = `google.navigation:q=${latitude},${longitude}&mode=w`;
        const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking`;
        const supported = await Linking.canOpenURL(googleMapsUrl);
        await Linking.openURL(supported ? googleMapsUrl : fallbackUrl);
      }
    } catch {
      Alert.alert("Error", "Could not open maps app.");
    } finally {
      if (isMountedRef.current) setNavigating(false);
    }
  };

  // ─── Load data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (hasLoadedRef.current) return;

    setLoadError(false);
    setLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Location access is needed to show your position on the map."
        );
        if (isMountedRef.current) setLoadError(true);
        return;
      }

      let location: Location.LocationObject | null = null;
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
      } catch {
        location = await Location.getLastKnownPositionAsync();
      }

      if (!location) {
        Alert.alert(
          "Location unavailable",
          "Could not get your current location. Please try again."
        );
        if (isMountedRef.current) setLoadError(true);
        return;
      }

      if (isMountedRef.current) {
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }

      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError || !authData?.user) {
        if (isMountedRef.current) setLoadError(true);
        return;
      }

      userIdRef.current = authData.user.id;

      await startLocationWatcher("high");

      const { data: homeData, error: homeError } = await supabase
        .from("help_app_user_locations")
        .select("lat, lng")
        .eq("user_id", authData.user.id)
        .eq("is_home", true)
        .maybeSingle();

      if (homeError) {
        console.error("Home location fetch error:", homeError.message);
      }

      if (homeData && homeData.lat != null && homeData.lng != null) {
        const lat = Number(homeData.lat);
        const lng = Number(homeData.lng);
        if (!isNaN(lat) && !isNaN(lng) && isMountedRef.current) {
          setHomeLocation({ latitude: lat, longitude: lng });
        }
      }

      hasLoadedRef.current = true;
    } catch (err) {
      console.error("TakeMeHome loadData error:", err);
      if (isMountedRef.current) setLoadError(true);
      const msg = String(err).toLowerCase();
      if (
        !msg.includes("location") &&
        !msg.includes("gps") &&
        !msg.includes("position")
      ) {
        Alert.alert("Error", "Could not load home data. Please try again.");
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [startLocationWatcher]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Alert guardian ─────────────────────────────────────────────────────────
  const alertGuardian = async () => {
    const now = Date.now();
    if (now - lastAlertTimeRef.current < ALERT_COOLDOWN_MS) {
      const remaining = Math.ceil(
        (ALERT_COOLDOWN_MS - (now - lastAlertTimeRef.current)) / 1000
      );
      Alert.alert(
        "Please wait",
        `You can send another alert in ${remaining} seconds.`
      );
      return;
    }

    try {
      setAlertSending(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert("Session expired", "Please log in again.");
        return;
      }

      const { data: links, error: linksError } = await supabase
        .from("help_app_guardian_links")
        .select("guardian_id")
        .eq("user_id", user.id)
        .eq("status", "approved");

      if (linksError) throw linksError;

      if (!links || links.length === 0) {
        Alert.alert(
          "No guardian linked",
          "You don't have an approved guardian yet. Your alert was logged but no one was notified."
        );
        await supabase.from("help_app_alerts").insert({
          user_id: user.id,
          guardian_id: null,
          alert_type: "panic",
          message: "User needs help!",
          triggered_at: new Date().toISOString(),
          resolved: false,
        });
        return;
      }

      const alertRows = (links as GuardianLink[]).map((link) => ({
        user_id: user.id,
        guardian_id: link.guardian_id,
        alert_type: "panic",
        message: "User needs help!",
        triggered_at: new Date().toISOString(),
        resolved: false,
      }));

      const { error: alertError } = await supabase
        .from("help_app_alerts")
        .insert(alertRows);

      if (alertError) throw alertError;

      lastAlertTimeRef.current = Date.now();

      for (const link of links as GuardianLink[]) {
        try {
          const guardianToken = await getPushTokenForUser(link.guardian_id);
          if (guardianToken) {
            await sendExpoPushNotification(
              guardianToken,
              "🚨 Emergency Alert",
              "Your linked user needs help!"
            );
          }
        } catch (pushErr) {
          console.error("Push to guardian failed:", pushErr);
        }
      }

      speak("Emergency alert sent to guardian.");
      Alert.alert("🚨 Alert Sent", "Your guardian has been notified.");
    } catch (e: any) {
      console.error("alertGuardian error:", e);
      Alert.alert(
        "Error",
        e.message ?? "Could not send alert. Please try again."
      );
    } finally {
      if (isMountedRef.current) setAlertSending(false);
    }
  };

  // ─── Loading UI ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#0f766e" />
      </SafeAreaView>
    );
  }

  // ─── Error + retry UI ───────────────────────────────────────────────────────
  if (loadError) {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#0f172a",
              marginBottom: 8,
            }}
          >
            Could not load location
          </Text>
          <Text
            style={{ color: "#64748b", textAlign: "center", marginBottom: 24 }}
          >
            Please check your location permissions and try again.
          </Text>
          <Pressable
            onPress={() => {
              hasLoadedRef.current = false;
              loadData();
            }}
            style={{
              backgroundColor: "#0f766e",
              paddingVertical: 14,
              paddingHorizontal: 32,
              borderRadius: 16,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
              Retry
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Main render ────────────────────────────────────────────────────────────
  const initialRegion = {
    latitude: currentLocation?.latitude ?? 28.6139,
    longitude: currentLocation?.longitude ?? 77.209,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const activeCfg = ACCURACY_CONFIG[accuracyMode];

  return (
    <SafeAreaView style={styles.container}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <Text style={styles.title}>Take Me Home</Text>
        <Pressable
          onPress={() =>
            speak("Follow the blue route to reach your saved home.")
          }
        >
          <Text style={styles.voice}>🔊</Text>
        </Pressable>
      </View>

      {/* ── MAP ── */}
      <View style={styles.map}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={initialRegion}
          showsUserLocation={false}
          showsMyLocationButton={false}
        >
          {currentLocation && (
            <Marker
              coordinate={currentLocation}
              title="You are here"
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={mapStyles.userDot} />
            </Marker>
          )}

          {homeLocation && (
            <Marker
              coordinate={homeLocation}
              title="Home"
              anchor={{ x: 0.5, y: 1.0 }}
            >
              <Text style={{ fontSize: 32 }}>🏠</Text>
            </Marker>
          )}

          {currentLocation && homeLocation && (
            <Polyline
              coordinates={[currentLocation, homeLocation]}
              strokeColor="#1A73E8"
              strokeWidth={5}
            />
          )}
        </MapView>

        {/* ── Live tracking indicator ── */}
        <View style={mapStyles.liveChip}>
          <View style={mapStyles.liveDot} />
          <Text style={mapStyles.liveText}>LIVE</Text>
        </View>

        {/* ── Accuracy toggle pill ── */}
        <Pressable
          onPress={toggleAccuracy}
          style={[
            mapStyles.accuracyPill,
            accuracyMode === "medium" && mapStyles.accuracyPillMedium,
          ]}
        >
          <Text style={mapStyles.accuracyIcon}>{activeCfg.icon}</Text>
          <View>
            <Text style={mapStyles.accuracyLabel}>{activeCfg.label}</Text>
            <Text style={mapStyles.accuracyDesc}>{activeCfg.description}</Text>
          </View>
        </Pressable>
      </View>

      {/* ── INFO CARD ── */}
      <View style={styles.card}>
        <Text style={styles.direction}>📍 You → 🏠 Home</Text>

        {distanceToHome !== null && (
          <View style={cardStyles.distanceBadge}>
            <Text style={cardStyles.distanceText}>
              📏 {formatDistance(distanceToHome)} away
            </Text>
          </View>
        )}

        <Text style={styles.sub}>
          {homeLocation
            ? "Tap Start Navigation for turn-by-turn directions.\nBlue line shows straight-line direction only."
            : "No home set yet — ask your guardian to set your home location."}
        </Text>
      </View>

      {/* ── START NAVIGATION ── */}
      {homeLocation && (
        <Pressable
          style={[styles.navBtn, navigating && styles.navBtnDisabled]}
          onPress={startNavigation}
          disabled={navigating}
        >
          {navigating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.navBtnText}>🧭 Start Navigation</Text>
              <Text style={styles.navBtnSub}>Opens in Google Maps</Text>
            </>
          )}
        </Pressable>
      )}

      {/* ── ALERT GUARDIAN ── */}
      <Pressable
        style={[styles.alertBtn, alertSending && { opacity: 0.6 }]}
        onPress={alertGuardian}
        disabled={alertSending}
      >
        {alertSending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.alertText}>🚨 Alert Guardian</Text>
        )}
      </Pressable>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const mapStyles = StyleSheet.create({
  userDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#1A73E8",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  liveChip: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
  },
  liveText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  accuracyPill: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0f766e",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  accuracyPillMedium: {
    backgroundColor: "#92400e",
  },
  accuracyIcon: {
    fontSize: 16,
  },
  accuracyLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  accuracyDesc: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 10,
    lineHeight: 14,
  },
});

const cardStyles = StyleSheet.create({
  distanceBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#e0f2fe",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 6,
  },
  distanceText: {
    color: "#0369a1",
    fontSize: 13,
    fontWeight: "600",
  },
});