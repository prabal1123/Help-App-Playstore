// import {
//   View,
//   Text,
//   Pressable,
//   Platform,
//   Alert,
//   ActivityIndicator,
//   ScrollView,
//   Modal,
//   FlatList,
//   Vibration,
//   Animated,
//   StyleSheet,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { guardianStyles as styles } from "@/styles/guardian";
// import { useState, useEffect, useRef, useCallback } from "react";
// import { supabase } from "@/supabase/supabase";
// import MapView, { Marker, Circle } from "react-native-maps";

// // ─── Types ────────────────────────────────────────────────────────────────────
// type LinkedUser = {
//   user_id: string;
//   name: string;
// };

// type AlarmType = "left_home" | "safe_zone" | null;
// type MapMode = "none" | "safeZone" | "setHome";

// const HOME_RADIUS_METERS = 50;

// // ─── Push Notification Helper ─────────────────────────────────────────────────
// async function sendPushNotification(title: string, body: string) {
//   console.log(`[PUSH NOTIFICATION] ${title}: ${body}`);
// }

// // ─── Component ────────────────────────────────────────────────────────────────
// export default function GuardianScreen() {
//   const mapRef = useRef<MapView>(null);

//   const [linkedUsers, setLinkedUsers] = useState<LinkedUser[]>([]);
//   const [selectedUser, setSelectedUser] = useState<LinkedUser | null>(null);
//   const [dropdownVisible, setDropdownVisible] = useState(false);

//   const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
//   const [safeZones, setSafeZones] = useState<any[]>([]);
//   const [selectedCenter, setSelectedCenter] = useState<{ latitude: number; longitude: number } | null>(null);
//   const [radius, setRadius] = useState(300);
//   const [lastUpdated, setLastUpdated] = useState("");
//   const [isOutside, setIsOutside] = useState(false);
//   const [isAwayFromHome, setIsAwayFromHome] = useState(false);
//   const [mapMode, setMapMode] = useState<MapMode>("none");
//   const [homeLocation, setHomeLocation] = useState<{ latitude: number; longitude: number } | null>(null);
//   const [pendingHome, setPendingHome] = useState<{ latitude: number; longitude: number } | null>(null);
//   const [savingHome, setSavingHome] = useState(false);
//   const [loadingUser, setLoadingUser] = useState(false);

//   // ─── Alarm state ──────────────────────────────────────────────────────────
//   const [activeAlarm, setActiveAlarm] = useState<AlarmType>(null);
//   const alarmAnim = useRef(new Animated.Value(0)).current;
//   const alarmLoop = useRef<Animated.CompositeAnimation | null>(null);
//   const realtimeChannel = useRef<any>(null);

//   const [alertModal, setAlertModal] = useState<{ title: string; body: string } | null>(null);

//   const showAlert = (title: string, body: string) => setAlertModal({ title, body });
//   const hideAlert = () => {
//     setAlertModal(null);
//     dismissAlarm();
//   };

//   const prevIsOutside = useRef(false);
//   const prevIsAwayFromHome = useRef(false);

//   // ─── Fit map when user location or home changes ───────────────────────────
//   useEffect(() => {
//     if (userLocation && mapRef.current) {
//       const coords = [userLocation];
//       if (homeLocation) coords.push(homeLocation);
//       mapRef.current.fitToCoordinates(coords, {
//         edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
//         animated: true,
//       });
//     }
//   }, [userLocation, homeLocation]);

//   // ─── Alarm animation ──────────────────────────────────────────────────────
//   const startAlarmAnimation = () => {
//     alarmLoop.current?.stop();
//     alarmLoop.current = Animated.loop(
//       Animated.sequence([
//         Animated.timing(alarmAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
//         Animated.timing(alarmAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
//       ])
//     );
//     alarmLoop.current.start();
//   };

//   const stopAlarmAnimation = () => {
//     alarmLoop.current?.stop();
//     alarmAnim.setValue(0);
//   };

//   const triggerAlarm = (type: AlarmType) => {
//     setActiveAlarm(type);
//     startAlarmAnimation();
//     try {
//       if (Platform.OS === "android") {
//         Vibration.vibrate([500, 300, 500, 300, 1000], false);
//       } else {
//         Vibration.vibrate(1000);
//       }
//     } catch (e) {
//       console.warn("Vibration failed:", e);
//     }
//   };

//   const dismissAlarm = () => {
//     setActiveAlarm(null);
//     stopAlarmAnimation();
//     Vibration.cancel();
//   };

//   const safeZoneAlarmColor = alarmAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: ["#ff4444", "#ff0000"],
//   });
//   const leftHomeAlarmColor = alarmAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: ["#ff8c00", "#ff6600"],
//   });
//   const alarmBgColor = activeAlarm === "safe_zone" ? safeZoneAlarmColor : leftHomeAlarmColor;

//   // ─── Distance helper ──────────────────────────────────────────────────────
//   const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
//     const R = 6371e3;
//     const φ1 = (lat1 * Math.PI) / 180;
//     const φ2 = (lat2 * Math.PI) / 180;
//     const Δφ = ((lat2 - lat1) * Math.PI) / 180;
//     const Δλ = ((lon2 - lon1) * Math.PI) / 180;
//     const a =
//       Math.sin(Δφ / 2) ** 2 +
//       Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
//     return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   };

//   // ─── Evaluate alerts ──────────────────────────────────────────────────────
//   const evaluateAlerts = async (
//     lat: number,
//     lng: number,
//     zones: any[],
//     home: { latitude: number; longitude: number } | null,
//     userName: string
//   ) => {
//     const nowOutside =
//       zones.length > 0
//         ? !zones.some(
//             (z) => calculateDistance(z.center_lat, z.center_lng, lat, lng) <= z.radius_meters
//           )
//         : false;

//     const nowAwayFromHome = home
//       ? calculateDistance(home.latitude, home.longitude, lat, lng) > HOME_RADIUS_METERS
//       : false;

//     if (nowAwayFromHome && !prevIsAwayFromHome.current) {
//       const title = "🏠 User Left Home";
//       const body = `${userName} has left home.`;
//       showAlert(title, body);
//       await sendPushNotification(title, body);
//       triggerAlarm("left_home");
//     }
//     prevIsAwayFromHome.current = nowAwayFromHome;

//     if (nowOutside && !prevIsOutside.current) {
//       const title = "🚨 Safe Zone Alert";
//       const body = `${userName} has crossed outside the safe zone!`;
//       showAlert(title, body);
//       await sendPushNotification(title, body);
//       triggerAlarm("safe_zone");
//     }
//     prevIsOutside.current = nowOutside;

//     setIsOutside(nowOutside);
//     setIsAwayFromHome(nowAwayFromHome);
//   };

//   // ─── Subscribe to realtime location ───────────────────────────────────────
//   const subscribeToLocationUpdates = useCallback(
//     (
//       userId: string,
//       zones: any[],
//       home: { latitude: number; longitude: number } | null,
//       userName: string
//     ) => {
//       if (realtimeChannel.current) {
//         supabase.removeChannel(realtimeChannel.current);
//         realtimeChannel.current = null;
//       }

//       realtimeChannel.current = supabase
//         .channel(`location_updates_${userId}`)
//         .on(
//           "postgres_changes",
//           {
//             event: "INSERT",
//             schema: "public",
//             table: "help_app_user_locations",
//             filter: `user_id=eq.${userId}`,
//           },
//           async (payload: any) => {
//             try {
//               const record = payload.new;
//               if (record.is_home) return;

//               const lat = record.latitude != null ? record.latitude : record.lat;
//               const lng = record.longitude != null ? record.longitude : record.lng;
//               if (lat == null || lng == null) return;

//               const newLat = Number(lat);
//               const newLng = Number(lng);

//               setUserLocation({ latitude: newLat, longitude: newLng });
//               setLastUpdated(new Date(record.recorded_at).toLocaleTimeString());
//               await evaluateAlerts(newLat, newLng, zones, home, userName);
//             } catch (err) {
//               console.error("Realtime payload error:", err);
//             }
//           }
//         )
//         .subscribe((status: string, err: any) => {
//           if (err) console.error("Realtime subscribe error:", err);
//         });
//     },
//     []
//   );

//   // ─── Init: fetch linked users ──────────────────────────────────────────────
//   useEffect(() => {
//     let cancelled = false;

//     const init = async () => {
//       try {
//         const { data, error } = await supabase.auth.getUser();
//         if (error) throw error;
//         const user = data?.user;
//         if (!user || cancelled) return;

//         const { data: links } = await supabase
//           .from("help_app_guardian_links")
//           .select("user_id")
//           .eq("guardian_id", user.id)
//           .eq("status", "approved");

//         if (!links || links.length === 0 || cancelled) return;

//         const userIds = links.map((l: any) => l.user_id);
//         const { data: profiles } = await supabase
//           .from("help_app_profiles")
//           .select("id, name")
//           .in("id", userIds);

//         if (profiles && !cancelled) {
//           const users: LinkedUser[] = profiles.map((p: any) => ({
//             user_id: p.id,
//             name: p.name || "Unnamed User",
//           }));
//           setLinkedUsers(users);
//           if (users.length > 0) selectUser(users[0], user.id);
//         }
//       } catch (err) {
//         console.error("Guardian init error:", err);
//       }
//     };

//     init();

//     return () => {
//       cancelled = true;
//       if (realtimeChannel.current) {
//         supabase.removeChannel(realtimeChannel.current);
//         realtimeChannel.current = null;
//       }
//     };
//   }, []);

//   // ─── Load selected user ────────────────────────────────────────────────────
//   const selectUser = async (linkedUser: LinkedUser, guardianId?: string) => {
//     setSelectedUser(linkedUser);
//     setDropdownVisible(false);
//     setLoadingUser(true);
//     setUserLocation(null);
//     setSafeZones([]);
//     setHomeLocation(null);
//     setMapMode("none");
//     setSelectedCenter(null);
//     setPendingHome(null);
//     dismissAlarm();
//     prevIsOutside.current = false;
//     prevIsAwayFromHome.current = false;

//     try {
//       const { data, error } = await supabase.auth.getUser();
//       if (error) throw error;
//       const user = data?.user;
//       const gId = guardianId || user?.id;
//       if (!gId) return;

//       const { data: zones } = await supabase
//         .from("help_app_safe_zones")
//         .select("*")
//         .eq("guardian_id", gId)
//         .eq("user_id", linkedUser.user_id)
//         .eq("active", true);

//       const fetchedZones = zones || [];
//       setSafeZones(fetchedZones);

//       const { data: homeData } = await supabase
//         .from("help_app_user_locations")
//         .select("lat, lng")
//         .eq("user_id", linkedUser.user_id)
//         .eq("is_home", true)
//         .maybeSingle();

//       let fetchedHome: { latitude: number; longitude: number } | null = null;
//       if (homeData) {
//         fetchedHome = {
//           latitude: Number(homeData.lat),
//           longitude: Number(homeData.lng),
//         };
//         setHomeLocation(fetchedHome);
//       }

//       const { data: latestLocation } = await supabase
//         .from("help_app_user_locations")
//         .select("*")
//         .eq("user_id", linkedUser.user_id)
//         .order("recorded_at", { ascending: false })
//         .limit(1)
//         .maybeSingle();

//       if (latestLocation) {
//         const lat = latestLocation.latitude ?? latestLocation.lat ?? null;
//         const lng = latestLocation.longitude ?? latestLocation.lng ?? null;
//         if (lat != null && lng != null) {
//           const newLat = Number(lat);
//           const newLng = Number(lng);
//           setUserLocation({ latitude: newLat, longitude: newLng });
//           setLastUpdated(new Date(latestLocation.recorded_at).toLocaleTimeString());

//           const outside =
//             fetchedZones.length > 0
//               ? !fetchedZones.some(
//                   (z) => calculateDistance(z.center_lat, z.center_lng, newLat, newLng) <= z.radius_meters
//                 )
//               : false;
//           const awayFromHome = fetchedHome
//             ? calculateDistance(fetchedHome.latitude, fetchedHome.longitude, newLat, newLng) > HOME_RADIUS_METERS
//             : false;

//           setIsOutside(outside);
//           setIsAwayFromHome(awayFromHome);
//           prevIsOutside.current = outside;
//           prevIsAwayFromHome.current = awayFromHome;
//         }
//       }

//       subscribeToLocationUpdates(linkedUser.user_id, fetchedZones, fetchedHome, linkedUser.name);
//     } catch (err) {
//       console.error("selectUser error:", err);
//     } finally {
//       setLoadingUser(false);
//     }
//   };

//   // ─── Handle map press (tap to set home or safe zone) ─────────────────────
//   const handleMapPress = (e: any) => {
//     const { latitude, longitude } = e.nativeEvent.coordinate;
//     if (mapMode === "safeZone") setSelectedCenter({ latitude, longitude });
//     else if (mapMode === "setHome") setPendingHome({ latitude, longitude });
//   };

//   // ─── Add Safe Zone ────────────────────────────────────────────────────────
//   const activateSafeZone = async () => {
//     if (!selectedCenter || !selectedUser) {
//       Alert.alert("Select a location first.");
//       return;
//     }
//     try {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) return;

//       const { data, error } = await supabase
//         .from("help_app_safe_zones")
//         .insert({
//           guardian_id: user.id,
//           user_id: selectedUser.user_id,
//           center_lat: selectedCenter.latitude,
//           center_lng: selectedCenter.longitude,
//           radius_meters: radius,
//           active: true,
//         })
//         .select()
//         .single();

//       if (error) { Alert.alert("Error", error.message); return; }

//       const updatedZones = [...safeZones, data];
//       setSafeZones(updatedZones);
//       setSelectedCenter(null);
//       setMapMode("none");

//       if (userLocation) {
//         await evaluateAlerts(userLocation.latitude, userLocation.longitude, updatedZones, homeLocation, selectedUser.name);
//       }
//       subscribeToLocationUpdates(selectedUser.user_id, updatedZones, homeLocation, selectedUser.name);
//       Alert.alert("✅ Safe Zone Added");
//     } catch (err) {
//       console.error("activateSafeZone error:", err);
//     }
//   };
//   // ─── Locate user on map ───────────────────────────
// const locateUser = () => {
//   if (!userLocation || !mapRef.current) return;

//   mapRef.current.animateToRegion(
//     {
//       latitude: userLocation.latitude,
//       longitude: userLocation.longitude,
//       latitudeDelta: 0.01,
//       longitudeDelta: 0.01,
//     },
//     500
//   );
// };

// // ─── Set home at user's current location ─────────
// const setHomeAtUserLocation = () => {
//   if (!userLocation) {
//     Alert.alert("User location not available yet.");
//     return;
//   }

//   Alert.alert(
//     "Set Home",
//     "Set user's current location as home?",
//     [
//       { text: "Cancel", style: "cancel" },
//       {
//         text: "Confirm",
//         onPress: () => saveHomeLocation(userLocation),
//       },
//     ]
//   );
// };


//   // ─── Save Home ────────────────────────────────────────────────────────────
//   const saveHomeLocation = async (coords: { latitude: number; longitude: number }) => {
    
//     if (!selectedUser) return;
//     setSavingHome(true);

//     try {
//       const { data: existing } = await supabase
//         .from("help_app_user_locations")
//         .select("id")
//         .eq("user_id", selectedUser.user_id)
//         .eq("is_home", true)
//         .maybeSingle();

//       let error;
//       if (existing) {
//         const { error: updateError } = await supabase
//           .from("help_app_user_locations")
//           .update({ lat: coords.latitude, lng: coords.longitude, recorded_at: new Date().toISOString() })
//           .eq("id", existing.id);
//         error = updateError;
//       } else {
//         const { error: insertError } = await supabase
//           .from("help_app_user_locations")
//           .insert({ user_id: selectedUser.user_id, lat: coords.latitude, lng: coords.longitude, is_home: true, recorded_at: new Date().toISOString() });
//         error = insertError;
//       }

//       if (error) { Alert.alert("Error saving home", error.message); return; }

//       setHomeLocation(coords);
//       setPendingHome(null);
//       setMapMode("none");

//       subscribeToLocationUpdates(selectedUser.user_id, safeZones, coords, selectedUser.name);

//       if (userLocation) {
//         await evaluateAlerts(userLocation.latitude, userLocation.longitude, safeZones, coords, selectedUser.name);
//       }

//       Alert.alert("✅ Home location saved for " + selectedUser.name + "!");
//     } catch {
//       Alert.alert("Something went wrong saving home.");
//     } finally {
//       setSavingHome(false);
//     }
//   };

//   const initialRegion = {
//     latitude: userLocation?.latitude ?? homeLocation?.latitude ?? 28.6139,
//     longitude: userLocation?.longitude ?? homeLocation?.longitude ?? 77.209,
//     latitudeDelta: 0.05,
//     longitudeDelta: 0.05,
//   };

//   // ─── UI ───────────────────────────────────────────────────────────────────
//   return (
//     <SafeAreaView style={styles.container}>
//       <Text style={styles.title}>Guardian View</Text>

//       {/* ─── CUSTOM ALERT MODAL ─── */}
//       <Modal visible={!!alertModal} transparent animationType="fade">
//         <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 32 }}>
//           <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 24, width: "100%", elevation: 10 }}>
//             <Text style={{ fontSize: 22, fontWeight: "800", color: "#1a1a1a", marginBottom: 8 }}>
//               {alertModal?.title}
//             </Text>
//             <Text style={{ fontSize: 15, color: "#555", marginBottom: 24, lineHeight: 22 }}>
//               {alertModal?.body}
//             </Text>
//             <Pressable
//               onPress={hideAlert}
//               style={{ backgroundColor: "#ff4444", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
//             >
//               <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Dismiss</Text>
//             </Pressable>
//           </View>
//         </View>
//       </Modal>

//       {/* ─── ALARM BANNER ─── */}
//       {activeAlarm && (
//         <Animated.View style={[alarmBannerStyles.banner, { backgroundColor: alarmBgColor }]}>
//           <View style={alarmBannerStyles.bannerContent}>
//             <Text style={alarmBannerStyles.bannerIcon}>
//               {activeAlarm === "left_home" ? "🏠" : "🚨"}
//             </Text>
//             <View style={{ flex: 1 }}>
//               <Text style={alarmBannerStyles.bannerTitle}>
//                 {activeAlarm === "left_home" ? "User Left Home!" : "Safe Zone Crossed!"}
//               </Text>
//               <Text style={alarmBannerStyles.bannerSubtitle}>
//                 {selectedUser?.name}{" "}
//                 {activeAlarm === "left_home" ? "has left the home area" : "has exited all safe zones"}
//               </Text>
//             </View>
//             <Pressable onPress={dismissAlarm} style={alarmBannerStyles.dismissBtn}>
//               <Text style={alarmBannerStyles.dismissText}>✕ Dismiss</Text>
//             </Pressable>
//           </View>
//         </Animated.View>
//       )}

//       {/* ─── USER SELECTOR ─── */}
//       <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
//         <Text style={{ fontSize: 12, fontWeight: "600", color: "#666", marginBottom: 4 }}>MONITORING</Text>
//         <Pressable
//           onPress={() => setDropdownVisible(true)}
//           style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f0fdf4", borderColor: "#16a34a", borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 }}
//         >
//           <Text style={{ fontWeight: "700", fontSize: 16, color: "#15803d" }}>
//             {selectedUser ? `👤 ${selectedUser.name}` : "Select a user..."}
//           </Text>
//           <Text style={{ color: "#16a34a", fontSize: 18 }}>▾</Text>
//         </Pressable>
//       </View>

//       {/* ─── DROPDOWN MODAL ─── */}
//       <Modal visible={dropdownVisible} transparent animationType="fade">
//         <Pressable
//           style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 32 }}
//           onPress={() => setDropdownVisible(false)}
//         >
//           <View style={{ backgroundColor: "#fff", borderRadius: 16, overflow: "hidden" }}>
//             <Text style={{ padding: 16, fontWeight: "700", fontSize: 16, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" }}>
//               Select User to Monitor
//             </Text>
//             <FlatList
//               data={linkedUsers}
//               keyExtractor={(item) => item.user_id}
//               renderItem={({ item }) => (
//                 <Pressable
//                   onPress={() => selectUser(item)}
//                   style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#f9f9f9", backgroundColor: selectedUser?.user_id === item.user_id ? "#f0fdf4" : "#fff" }}
//                 >
//                   <Text style={{ fontSize: 15, fontWeight: selectedUser?.user_id === item.user_id ? "700" : "400", color: "#333" }}>
//                     👤 {item.name}{selectedUser?.user_id === item.user_id ? "  ✓" : ""}
//                   </Text>
//                 </Pressable>
//               )}
//             />
//           </View>
//         </Pressable>
//       </Modal>

//       {loadingUser && (
//         <View style={{ alignItems: "center", padding: 20 }}>
//           <ActivityIndicator size="large" color="#16a34a" />
//           <Text style={{ color: "#666", marginTop: 8 }}>Loading user data...</Text>
//         </View>
//       )}

//       {!loadingUser && selectedUser && Platform.OS !== "web" && (
//         <>
//           {mapMode === "safeZone" && (
//             <Text style={{ textAlign: "center", color: "blue", marginVertical: 5 }}>
//               Tap on map to choose safe zone center
//             </Text>
//           )}
//           {mapMode === "setHome" && (
//             <Text style={{ textAlign: "center", color: "#e67e22", marginVertical: 5, fontWeight: "600" }}>
//               🏠 Tap on map to pin {selectedUser.name}'s home location
//             </Text>
//           )}

//           {/* ─── MAP ─── */}
//           <View style={styles.map}>
//             <MapView
//               ref={mapRef}
//               style={StyleSheet.absoluteFillObject}
//               initialRegion={initialRegion}
//               onPress={handleMapPress}
//               showsUserLocation={false}
//             >
//               {/* User location dot */}
//               {userLocation && (
//                 <Marker coordinate={userLocation} title={selectedUser.name}>
//                   <View style={[
//                     mapStyles.userDot,
//                     { backgroundColor: isOutside ? "#ef4444" : "#16a34a" }
//                   ]} />
//                 </Marker>
//               )}

//               {/* Safe zones */}
//               {safeZones.map((z, i) => (
//                 <Circle
//                   key={`zone-${i}`}
//                   center={{ latitude: Number(z.center_lat), longitude: Number(z.center_lng) }}
//                   radius={z.radius_meters}
//                   strokeColor="#0096ff"
//                   strokeWidth={2}
//                   fillColor="rgba(0,150,255,0.15)"
//                 />
//               ))}

//               {/* Home marker + radius */}
//               {homeLocation && (
//                 <>
//                   <Marker coordinate={homeLocation} title={`${selectedUser.name}'s Home`}>
//                     <Text style={{ fontSize: 28 }}>🏠</Text>
//                   </Marker>
//                   <Circle
//                     center={homeLocation}
//                     radius={HOME_RADIUS_METERS}
//                     strokeColor="#f97316"
//                     strokeWidth={2}
//                     fillColor="rgba(249,115,22,0.15)"
//                   />
//                 </>
//               )}

//               {/* Pending safe zone preview */}
//               {selectedCenter && mapMode === "safeZone" && (
//                 <>
//                   <Marker coordinate={selectedCenter} title="Safe Zone Center">
//                     <View style={mapStyles.pendingDot} />
//                   </Marker>
//                   <Circle
//                     center={selectedCenter}
//                     radius={radius}
//                     strokeColor="#3b82f6"
//                     strokeWidth={2}
//                     fillColor="rgba(59,130,246,0.2)"
//                   />
//                 </>
//               )}

//               {/* Pending home marker */}
//               {pendingHome && mapMode === "setHome" && (
//                 <Marker coordinate={pendingHome} title="New Home (tap Confirm)">
//                   <Text style={{ fontSize: 28, opacity: 0.7 }}>🏠</Text>
//                 </Marker>
//               )}
//             </MapView>
//           </View>

//           {/* STATUS CARD */}
//           <View style={styles.infoCard}>
//             <Text style={styles.userName}>{selectedUser.name}</Text>
//             <Text style={{ color: isOutside ? "red" : "green", fontWeight: "600" }}>
//               {isOutside ? "🚨 Outside Safe Zones" : "✅ Inside Safe Zone"}
//             </Text>
//             {homeLocation && (
//               <Text style={{ color: isAwayFromHome ? "#ff8c00" : "#16a34a", fontWeight: "600", marginTop: 2 }}>
//                 {isAwayFromHome ? "🏠 Away from Home" : "🏠 At Home"}
//               </Text>
//             )}
//             {homeLocation && (
//               <Text style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
//                 🏠 Home: {homeLocation.latitude.toFixed(4)}, {homeLocation.longitude.toFixed(4)}
//               </Text>
//             )}
//             {lastUpdated && <Text style={styles.updateText}>Last Updated: {lastUpdated}</Text>}
//           </View>

//           <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
//             {/* ─── SET HOME ─── */}
//             <View style={{ marginHorizontal: 16, marginTop: 12 }}>
//               <Text style={{ fontWeight: "700", fontSize: 14, marginBottom: 8, color: "#333" }}>
//                 🏠 Set {selectedUser.name}'s Home Location
//               </Text>
//               <Text style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
//                 Guardian is notified when user leaves this location ({HOME_RADIUS_METERS}m radius)
//               </Text>

//               {mapMode !== "setHome" ? (
//                 <Pressable
//                   style={{ backgroundColor: "#fff3e0", borderColor: "#e67e22", borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center", marginBottom: 8 }}
//                   onPress={() => { setMapMode("setHome"); setPendingHome(null); }}
//                 >
//                   <Text style={{ color: "#e67e22", fontWeight: "600" }}>📍 Tap Map to Set Home</Text>
//                 </Pressable>
//               ) : (
//                 <View style={{ gap: 8, marginBottom: 8 }}>
//                   <Pressable
//                     style={{ backgroundColor: pendingHome ? "#e67e22" : "#ccc", borderRadius: 12, paddingVertical: 12, alignItems: "center" }}
//                     onPress={() => pendingHome && saveHomeLocation(pendingHome)}
//                     disabled={!pendingHome || savingHome}
//                   >
//                     {savingHome ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "600" }}>✅ Confirm Home Location</Text>}
//                   </Pressable>
//                   <Pressable
//                     style={{ backgroundColor: "#f5f5f5", borderRadius: 12, paddingVertical: 12, alignItems: "center" }}
//                     onPress={() => { setMapMode("none"); setPendingHome(null); }}
//                   >
//                     <Text style={{ color: "#666", fontWeight: "600" }}>Cancel</Text>
//                   </Pressable>
//                 </View>
//               )}
//             </View>

//             {/* ─── SAFE ZONE ─── */}
//             <View style={styles.radiusContainer}>
//               <Text style={{ fontWeight: "600" }}>Set Radius:</Text>
//               <Text style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
//                 Guardian is notified when user exits this zone
//               </Text>
//               <View style={styles.radiusButtons}>
//                 {[100, 300, 500, 1000].map((r) => (
//                   <Pressable key={r} onPress={() => setRadius(r)} style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]}>
//                     <Text>{r}m</Text>
//                   </Pressable>
//                 ))}
//               </View>

//               {mapMode !== "safeZone" ? (
//                 <Pressable style={styles.activateBtn} onPress={() => { setMapMode("safeZone"); setSelectedCenter(null); }}>
//                   <Text style={{ color: "#fff" }}>Start Adding Safe Zone</Text>
//                 </Pressable>
//               ) : (
//                 <>
//                   <Pressable style={styles.activateBtn} onPress={activateSafeZone} disabled={!selectedCenter}>
//                     <Text style={{ color: "#fff" }}>Confirm Safe Zone</Text>
//                   </Pressable>
//                   <Pressable
//                     style={[styles.activateBtn, { backgroundColor: "gray", marginTop: 8 }]}
//                     onPress={() => { setMapMode("none"); setSelectedCenter(null); }}
//                   >
//                     <Text style={{ color: "#fff" }}>Cancel</Text>
//                   </Pressable>
//                 </>
//               )}
//             </View>
//           </ScrollView>
//         </>
//       )}

//       {!loadingUser && linkedUsers.length === 0 && (
//         <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
//           <Text style={{ fontSize: 16, color: "#666", textAlign: "center" }}>
//             No linked users yet.{"\n"}Ask a user to add you as their guardian.
//           </Text>
//         </View>
//       )}
//     </SafeAreaView>
//   );
// }

// // ─── Map marker styles ────────────────────────────────────────────────────────
// const mapStyles = StyleSheet.create({
//   userDot: {
//     width: 20,
//     height: 20,
//     borderRadius: 10,
//     borderWidth: 2,
//     borderColor: "#fff",
//   },
//   pendingDot: {
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//     backgroundColor: "#3b82f6",
//     borderWidth: 2,
//     borderColor: "#fff",
//   },
// });

// // ─── Alarm Banner Styles ──────────────────────────────────────────────────────
// const alarmBannerStyles = StyleSheet.create({
//   banner: {
//     marginHorizontal: 16,
//     marginBottom: 8,
//     borderRadius: 14,
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     elevation: 6,
//   },
//   bannerContent: { flexDirection: "row", alignItems: "center", gap: 10 },
//   bannerIcon: { fontSize: 28 },
//   bannerTitle: { color: "#fff", fontWeight: "800", fontSize: 15 },
//   bannerSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 },
//   dismissBtn: { backgroundColor: "rgba(0,0,0,0.25)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
//   dismissText: { color: "#fff", fontWeight: "700", fontSize: 12 },
// });



// import {
//   View,
//   Text,
//   Pressable,
//   Platform,
//   Alert,
//   ActivityIndicator,
//   ScrollView,
//   Modal,
//   FlatList,
//   Vibration,
//   Animated,
//   StyleSheet,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { guardianStyles as styles } from "@/styles/guardian";
// import { useState, useEffect, useRef, useCallback } from "react";
// import { supabase } from "@/supabase/supabase";
// import MapView, { Marker, Circle } from "react-native-maps";
// import * as Notifications from "expo-notifications";
// // ─── Types ────────────────────────────────────────────────────────────────────
// type LinkedUser = {
//   user_id: string;
//   name: string;
// };
// type AlarmType = "left_home" | "safe_zone" | null;
// type MapMode = "none" | "safeZone" | "setHome";

// const HOME_RADIUS_METERS = 50;

// // ─── Push Notification Helper ─────────────────────────────────────────────────
// async function sendPushNotification(title: string, body: string) {
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
//     console.log("❌ Notification error:", err);
//   }
// }


// // ─── Component ────────────────────────────────────────────────────────────────
// export default function GuardianScreen() {
//   const mapRef = useRef<MapView>(null);
//   const [linkedUsers, setLinkedUsers] = useState<LinkedUser[]>([]);
//   const [selectedUser, setSelectedUser] = useState<LinkedUser | null>(null);
//   const [dropdownVisible, setDropdownVisible] = useState(false);
//   const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
//   const [safeZones, setSafeZones] = useState<any[]>([]);
//   const [selectedCenter, setSelectedCenter] = useState<{ latitude: number; longitude: number } | null>(null);
//   const [radius, setRadius] = useState(300);
//   const [lastUpdated, setLastUpdated] = useState("");
//   const [isOutside, setIsOutside] = useState(false);
//   const [isAwayFromHome, setIsAwayFromHome] = useState(false);
//   const [mapMode, setMapMode] = useState<MapMode>("none");
//   const [homeLocation, setHomeLocation] = useState<{ latitude: number; longitude: number } | null>(null);
//   const [pendingHome, setPendingHome] = useState<{ latitude: number; longitude: number } | null>(null);
//   const [savingHome, setSavingHome] = useState(false);
//   const [loadingUser, setLoadingUser] = useState(false);

//   // ─── TWEAK 3: Follow mode state ───────────────────────────────────────────
//   const [isFollowing, setIsFollowing] = useState(true);
//   const hasInitialFit = useRef(false);

//   // ─── Alarm state ──────────────────────────────────────────────────────────
//   const [activeAlarm, setActiveAlarm] = useState<AlarmType>(null);
//   const alarmAnim = useRef(new Animated.Value(0)).current;
//   const alarmLoop = useRef<Animated.CompositeAnimation | null>(null);
//   const realtimeChannel = useRef<any>(null);
//   const alertChannel = useRef<any>(null);
//   const [alertModal, setAlertModal] = useState<{ title: string; body: string } | null>(null);

//   const showAlert = (title: string, body: string) => setAlertModal({ title, body });
//   const hideAlert = () => {
//     setAlertModal(null);
//     dismissAlarm();
//   };

//   const prevIsOutside = useRef(false);
//   const prevIsAwayFromHome = useRef(false);

//   useEffect(() => {
//   Notifications.requestPermissionsAsync();
// }, []);

//   // ─── TWEAK 2 & 3: Initial fit (runs once per user) ───────────────────────
//   useEffect(() => {
//     if (userLocation && mapRef.current && !hasInitialFit.current) {
//       hasInitialFit.current = true;
//       const coords = [userLocation];
//       if (homeLocation) coords.push(homeLocation);
//       mapRef.current.fitToCoordinates(coords, {
//         edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
//         animated: true,
//       });
//     }
//   }, [userLocation, homeLocation]);

//   // ─── TWEAK 2: Auto-follow — smooth pan on every location update ───────────
//   useEffect(() => {
//     if (!userLocation || !mapRef.current || !isFollowing) return;
//     mapRef.current.animateToRegion(
//       {
//         latitude: userLocation.latitude,
//         longitude: userLocation.longitude,
//         latitudeDelta: 0.01,
//         longitudeDelta: 0.01,
//       },
//       800
//     );
//   }, [userLocation, isFollowing]);

//   // ─── Alarm animation ──────────────────────────────────────────────────────
//   const startAlarmAnimation = () => {
//     alarmLoop.current?.stop();
//     alarmLoop.current = Animated.loop(
//       Animated.sequence([
//         Animated.timing(alarmAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
//         Animated.timing(alarmAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
//       ])
//     );
//     alarmLoop.current.start();
//   };

//   const stopAlarmAnimation = () => {
//     alarmLoop.current?.stop();
//     alarmAnim.setValue(0);
//   };

//   const triggerAlarm = (type: AlarmType) => {
//     setActiveAlarm(type);
//     startAlarmAnimation();
//     try {
//       if (Platform.OS === "android") {
//         Vibration.vibrate([500, 300, 500, 300, 1000], false);
//       } else {
//         Vibration.vibrate(1000);
//       }
//     } catch (e) {
//       console.warn("Vibration failed:", e);
//     }
//   };

//   const dismissAlarm = () => {
//     setActiveAlarm(null);
//     stopAlarmAnimation();
//     Vibration.cancel();
//   };

//   const safeZoneAlarmColor = alarmAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: ["#ff4444", "#ff0000"],
//   });
//   const leftHomeAlarmColor = alarmAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: ["#ff8c00", "#ff6600"],
//   });
//   const alarmBgColor = activeAlarm === "safe_zone" ? safeZoneAlarmColor : leftHomeAlarmColor;

//   // ─── Distance helper ──────────────────────────────────────────────────────
//   const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
//     const R = 6371e3;
//     const φ1 = (lat1 * Math.PI) / 180;
//     const φ2 = (lat2 * Math.PI) / 180;
//     const Δφ = ((lat2 - lat1) * Math.PI) / 180;
//     const Δλ = ((lon2 - lon1) * Math.PI) / 180;
//     const a =
//       Math.sin(Δφ / 2) ** 2 +
//       Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
//     return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   };

//   // ─── Evaluate alerts ──────────────────────────────────────────────────────
//   const evaluateAlerts = async (
//     lat: number,
//     lng: number,
//     zones: any[],
//     home: { latitude: number; longitude: number } | null,
//     userName: string
//   ) => {
//     const nowOutside =
//       zones.length > 0
//         ? !zones.some(
//             (z) => calculateDistance(z.center_lat, z.center_lng, lat, lng) <= z.radius_meters
//           )
//         : false;

//     const nowAwayFromHome = home
//       ? calculateDistance(home.latitude, home.longitude, lat, lng) > HOME_RADIUS_METERS
//       : false;

//     if (nowAwayFromHome && !prevIsAwayFromHome.current) {
//       const title = "🏠 User Left Home";
//       const body = `${userName} has left home.`;
//       showAlert(title, body);
//       await sendPushNotification(title, body);
//       triggerAlarm("left_home");
//     }
//     prevIsAwayFromHome.current = nowAwayFromHome;

//     if (nowOutside && !prevIsOutside.current) {
//       const title = "🚨 Safe Zone Alert";
//       const body = `${userName} has crossed outside the safe zone!`;
//       showAlert(title, body);
//       await sendPushNotification(title, body);
//       triggerAlarm("safe_zone");
//     }
//     prevIsOutside.current = nowOutside;

//     setIsOutside(nowOutside);
//     setIsAwayFromHome(nowAwayFromHome);
//   };

//   // ─── Subscribe to realtime location ───────────────────────────────────────
//   const subscribeToLocationUpdates = useCallback(
//     (
//       userId: string,
//       zones: any[],
//       home: { latitude: number; longitude: number } | null,
//       userName: string
//     ) => {
//       if (realtimeChannel.current) {
//         supabase.removeChannel(realtimeChannel.current);
//         realtimeChannel.current = null;
//       }

//       realtimeChannel.current = supabase
//         .channel(`location_updates_${userId}`)
//         .on(
//           "postgres_changes",
//           {
//             event: "INSERT",
//             schema: "public",
//             table: "help_app_user_locations",
//             filter: `user_id=eq.${userId}`,
//           },
//           async (payload: any) => {
//             try {
//               const record = payload.new;
//               if (record.is_home) return;
//               const lat = record.latitude != null ? record.latitude : record.lat;
//               const lng = record.longitude != null ? record.longitude : record.lng;
//               if (lat == null || lng == null) return;
//               const newLat = Number(lat);
//               const newLng = Number(lng);
//               setUserLocation({ latitude: newLat, longitude: newLng });
//               setLastUpdated(new Date(record.recorded_at).toLocaleTimeString());
//               await evaluateAlerts(newLat, newLng, zones, home, userName);
//             } catch (err) {
//               console.error("Realtime payload error:", err);
//             }
//           }
//         )
//         .subscribe((status: string, err: any) => {
//           console.log("📡 Realtime status:", status);
//           if (err) console.error("Realtime subscribe error:", err);
//         });
//     },
//     []
//   );

//   // ─── Init: fetch linked users ──────────────────────────────────────────────
//   useEffect(() => {
//     let cancelled = false;
//     const init = async () => {
//       try {
//         const { data, error } = await supabase.auth.getUser();
//         if (error) throw error;
//         const user = data?.user;
//         if (!user || cancelled) return;

//         const { data: links } = await supabase
//           .from("help_app_guardian_links")
//           .select("user_id")
//           .eq("guardian_id", user.id)
//           .eq("status", "approved");

//         if (!links || links.length === 0 || cancelled) return;

//         const userIds = links.map((l: any) => l.user_id);
//         const { data: profiles } = await supabase
//           .from("help_app_profiles")
//           .select("id, name")
//           .in("id", userIds);

//         if (profiles && !cancelled) {
//           const users: LinkedUser[] = profiles.map((p: any) => ({
//             user_id: p.id,
//             name: p.name || "Unnamed User",
//           }));
//           setLinkedUsers(users);
//           if (users.length > 0) selectUser(users[0], user.id);
//         }
//       } catch (err) {
//         console.error("Guardian init error:", err);
//       }
//     };
//     init();
//     return () => {
//       cancelled = true;
//       if (realtimeChannel.current) {
//         supabase.removeChannel(realtimeChannel.current);
//         realtimeChannel.current = null;
//       }
//     };
//   }, []);

//     useEffect(() => {
//   if (!selectedUser) return;

//   if (alertChannel.current) {
//     supabase.removeChannel(alertChannel.current);
//     alertChannel.current = null;
//   }

//   alertChannel.current = supabase
//     .channel("guardian_alerts")
//     .on(
//       "postgres_changes",
//       {
//         event: "INSERT",
//         schema: "public",
//         table: "help_app_alerts",
//         filter: `user_id=eq.${selectedUser.user_id}`,
//       },
//       async (payload: any) => {
//         try {
//           const alert = payload.new;

//           if (alert.user_id === selectedUser.user_id) {
//             console.log("🚨 Emergency alert received!");

//             await sendPushNotification(
//               "🚨 Emergency Alert",
//               `${selectedUser.name} needs help!`
//             );

//             triggerAlarm("safe_zone");

//             showAlert(
//               "🚨 Emergency Alert",
//               `${selectedUser.name} needs help!`
//             );
//           }
//         } catch (err) {
//           console.error("Alert listener error:", err);
//         }
//       }
//     )
//     .subscribe((status: string) => {
//       console.log("📡 Alert subscription status:", status);
//     });

//   return () => {
//     if (alertChannel.current) {
//       supabase.removeChannel(alertChannel.current);
//       alertChannel.current = null;
//     }
//   };
// }, [selectedUser]);
//   // ─── Load selected user ────────────────────────────────────────────────────
//   const selectUser = async (linkedUser: LinkedUser, guardianId?: string) => {
//     setSelectedUser(linkedUser);
//     setDropdownVisible(false);
//     setLoadingUser(true);
//     setUserLocation(null);
//     setSafeZones([]);
//     setHomeLocation(null);
//     setMapMode("none");
//     setSelectedCenter(null);
//     setPendingHome(null);
//     dismissAlarm();
//     prevIsOutside.current = false;
//     prevIsAwayFromHome.current = false;
//     // ─── TWEAK 2 & 3: Reset initial fit ref on user switch ────────────────
//     hasInitialFit.current = false;
//     setIsFollowing(true);

//     try {
//       const { data, error } = await supabase.auth.getUser();
//       if (error) throw error;
//       const user = data?.user;
//       const gId = guardianId || user?.id;
//       if (!gId) return;

//       const { data: zones } = await supabase
//         .from("help_app_safe_zones")
//         .select("*")
//         .eq("guardian_id", gId)
//         .eq("user_id", linkedUser.user_id)
//         .eq("active", true);

//       const fetchedZones = zones || [];
//       setSafeZones(fetchedZones);

//       const { data: homeData } = await supabase
//         .from("help_app_user_locations")
//         .select("lat, lng")
//         .eq("user_id", linkedUser.user_id)
//         .eq("is_home", true)
//         .maybeSingle();

//       let fetchedHome: { latitude: number; longitude: number } | null = null;
//       if (homeData) {
//         fetchedHome = {
//           latitude: Number(homeData.lat),
//           longitude: Number(homeData.lng),
//         };
//         setHomeLocation(fetchedHome);
//       }

//       const { data: latestLocation } = await supabase
//         .from("help_app_user_locations")
//         .select("*")
//         .eq("user_id", linkedUser.user_id)
//         .order("recorded_at", { ascending: false })
//         .limit(1)
//         .maybeSingle();

//       if (latestLocation) {
//         const lat = latestLocation.latitude ?? latestLocation.lat ?? null;
//         const lng = latestLocation.longitude ?? latestLocation.lng ?? null;
//         if (lat != null && lng != null) {
//           const newLat = Number(lat);
//           const newLng = Number(lng);
//           setUserLocation({ latitude: newLat, longitude: newLng });
//           setLastUpdated(new Date(latestLocation.recorded_at).toLocaleTimeString());
//           const outside =
//             fetchedZones.length > 0
//               ? !fetchedZones.some(
//                   (z) => calculateDistance(z.center_lat, z.center_lng, newLat, newLng) <= z.radius_meters
//                 )
//               : false;
//           const awayFromHome = fetchedHome
//             ? calculateDistance(fetchedHome.latitude, fetchedHome.longitude, newLat, newLng) > HOME_RADIUS_METERS
//             : false;
//           setIsOutside(outside);
//           setIsAwayFromHome(awayFromHome);
//           prevIsOutside.current = outside;
//           prevIsAwayFromHome.current = awayFromHome;
//         }
//       }

//       subscribeToLocationUpdates(linkedUser.user_id, fetchedZones, fetchedHome, linkedUser.name);
//     } catch (err) {
//       console.error("selectUser error:", err);
//     } finally {
//       setLoadingUser(false);
//     }
//   };

//   // ─── Handle map press ─────────────────────────────────────────────────────
//   const handleMapPress = (e: any) => {
//     const { latitude, longitude } = e.nativeEvent.coordinate;
//     if (mapMode === "safeZone") setSelectedCenter({ latitude, longitude });
//     else if (mapMode === "setHome") setPendingHome({ latitude, longitude });
//   };

//   // ─── Add Safe Zone ────────────────────────────────────────────────────────
//   const activateSafeZone = async () => {
//     if (!selectedCenter || !selectedUser) {
//       Alert.alert("Select a location first.");
//       return;
//     }
//     try {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) return;
//       const { data, error } = await supabase
//         .from("help_app_safe_zones")
//         .insert({
//           guardian_id: user.id,
//           user_id: selectedUser.user_id,
//           center_lat: selectedCenter.latitude,
//           center_lng: selectedCenter.longitude,
//           radius_meters: radius,
//           active: true,
//         })
//         .select()
//         .single();
//       if (error) { Alert.alert("Error", error.message); return; }
//       const updatedZones = [...safeZones, data];
//       setSafeZones(updatedZones);
//       setSelectedCenter(null);
//       setMapMode("none");
//       if (userLocation) {
//         await evaluateAlerts(userLocation.latitude, userLocation.longitude, updatedZones, homeLocation, selectedUser.name);
//       }
//       subscribeToLocationUpdates(selectedUser.user_id, updatedZones, homeLocation, selectedUser.name);
//       Alert.alert("✅ Safe Zone Added");
//     } catch (err) {
//       console.error("activateSafeZone error:", err);
//     }
//   };

//   // ─── TWEAK 1: Locate user on map ──────────────────────────────────────────
//   const locateUser = () => {
//     if (!userLocation || !mapRef.current) return;
//     mapRef.current.animateToRegion(
//       {
//         latitude: userLocation.latitude,
//         longitude: userLocation.longitude,
//         latitudeDelta: 0.01,
//         longitudeDelta: 0.01,
//       },
//       500
//     );
//   };

//   // ─── TWEAK 1: Set home at user's current location ─────────────────────────
//   const setHomeAtUserLocation = () => {
//     if (!userLocation) {
//       Alert.alert("User location not available yet.");
//       return;
//     }
//     Alert.alert(
//       "Set Home",
//       `Set ${selectedUser?.name}'s current location as home?`,
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Confirm",
//           onPress: async () => {
//             await saveHomeLocation(userLocation);
//             if (mapRef.current) {
//               mapRef.current.fitToCoordinates([userLocation], {
//                 edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
//                 animated: true,
//               });
//             }
//           },
//         },
//       ]
//     );
//   };

//   // ─── Save Home ────────────────────────────────────────────────────────────
//   const saveHomeLocation = async (coords: { latitude: number; longitude: number }) => {
//     if (!selectedUser) return;
//     setSavingHome(true);
//     try {
//       const { data: existing } = await supabase
//         .from("help_app_user_locations")
//         .select("id")
//         .eq("user_id", selectedUser.user_id)
//         .eq("is_home", true)
//         .maybeSingle();

//       let error;
//       if (existing) {
//         const { error: updateError } = await supabase
//           .from("help_app_user_locations")
//           .update({ lat: coords.latitude, lng: coords.longitude, recorded_at: new Date().toISOString() })
//           .eq("id", existing.id);
//         error = updateError;
//       } else {
//         const { error: insertError } = await supabase
//           .from("help_app_user_locations")
//           .insert({ user_id: selectedUser.user_id, lat: coords.latitude, lng: coords.longitude, is_home: true, recorded_at: new Date().toISOString() });
//         error = insertError;
//       }

//       if (error) { Alert.alert("Error saving home", error.message); return; }
//       setHomeLocation(coords);
//       setPendingHome(null);
//       setMapMode("none");
//       subscribeToLocationUpdates(selectedUser.user_id, safeZones, coords, selectedUser.name);
//       if (userLocation) {
//         await evaluateAlerts(userLocation.latitude, userLocation.longitude, safeZones, coords, selectedUser.name);
//       }
//       Alert.alert("✅ Home location saved for " + selectedUser.name + "!");
//     } catch {
//       Alert.alert("Something went wrong saving home.");
//     } finally {
//       setSavingHome(false);
//     }
//   };

//   const initialRegion = {
//     latitude: userLocation?.latitude ?? homeLocation?.latitude ?? 28.6139,
//     longitude: userLocation?.longitude ?? homeLocation?.longitude ?? 77.209,
//     latitudeDelta: 0.05,
//     longitudeDelta: 0.05,
//   };

//   // ─── UI ───────────────────────────────────────────────────────────────────
//   return (
//     <SafeAreaView style={styles.container}>
//       <Text style={styles.title}>Guardian View</Text>

//       {/* ─── CUSTOM ALERT MODAL ─── */}
//       <Modal visible={!!alertModal} transparent animationType="fade">
//         <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 32 }}>
//           <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 24, width: "100%", elevation: 10 }}>
//             <Text style={{ fontSize: 22, fontWeight: "800", color: "#1a1a1a", marginBottom: 8 }}>
//               {alertModal?.title}
//             </Text>
//             <Text style={{ fontSize: 15, color: "#555", marginBottom: 24, lineHeight: 22 }}>
//               {alertModal?.body}
//             </Text>
//             <Pressable
//               onPress={hideAlert}
//               style={{ backgroundColor: "#ff4444", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
//             >
//               <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Dismiss</Text>
//             </Pressable>
//           </View>
//         </View>
//       </Modal>

//       {/* ─── ALARM BANNER ─── */}
//       {activeAlarm && (
//         <Animated.View style={[alarmBannerStyles.banner, { backgroundColor: alarmBgColor }]}>
//           <View style={alarmBannerStyles.bannerContent}>
//             <Text style={alarmBannerStyles.bannerIcon}>
//               {activeAlarm === "left_home" ? "🏠" : "🚨"}
//             </Text>
//             <View style={{ flex: 1 }}>
//               <Text style={alarmBannerStyles.bannerTitle}>
//                 {activeAlarm === "left_home" ? "User Left Home!" : "Safe Zone Crossed!"}
//               </Text>
//               <Text style={alarmBannerStyles.bannerSubtitle}>
//                 {selectedUser?.name}{" "}
//                 {activeAlarm === "left_home" ? "has left the home area" : "has exited all safe zones"}
//               </Text>
//             </View>
//             <Pressable onPress={dismissAlarm} style={alarmBannerStyles.dismissBtn}>
//               <Text style={alarmBannerStyles.dismissText}>✕ Dismiss</Text>
//             </Pressable>
//           </View>
//         </Animated.View>
//       )}

//       {/* ─── USER SELECTOR ─── */}
//       <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
//         <Text style={{ fontSize: 12, fontWeight: "600", color: "#666", marginBottom: 4 }}>MONITORING</Text>
//         <Pressable
//           onPress={() => setDropdownVisible(true)}
//           style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f0fdf4", borderColor: "#16a34a", borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 }}
//         >
//           <Text style={{ fontWeight: "700", fontSize: 16, color: "#15803d" }}>
//             {selectedUser ? `👤 ${selectedUser.name}` : "Select a user..."}
//           </Text>
//           <Text style={{ color: "#16a34a", fontSize: 18 }}>▾</Text>
//         </Pressable>
//       </View>

//       {/* ─── DROPDOWN MODAL ─── */}
//       <Modal visible={dropdownVisible} transparent animationType="fade">
//         <Pressable
//           style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 32 }}
//           onPress={() => setDropdownVisible(false)}
//         >
//           <View style={{ backgroundColor: "#fff", borderRadius: 16, overflow: "hidden" }}>
//             <Text style={{ padding: 16, fontWeight: "700", fontSize: 16, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" }}>
//               Select User to Monitor
//             </Text>
//             <FlatList
//               data={linkedUsers}
//               keyExtractor={(item) => item.user_id}
//               renderItem={({ item }) => (
//                 <Pressable
//                   onPress={() => selectUser(item)}
//                   style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#f9f9f9", backgroundColor: selectedUser?.user_id === item.user_id ? "#f0fdf4" : "#fff" }}
//                 >
//                   <Text style={{ fontSize: 15, fontWeight: selectedUser?.user_id === item.user_id ? "700" : "400", color: "#333" }}>
//                     👤 {item.name}{selectedUser?.user_id === item.user_id ? "  ✓" : ""}
//                   </Text>
//                 </Pressable>
//               )}
//             />
//           </View>
//         </Pressable>
//       </Modal>

//       {loadingUser && (
//         <View style={{ alignItems: "center", padding: 20 }}>
//           <ActivityIndicator size="large" color="#16a34a" />
//           <Text style={{ color: "#666", marginTop: 8 }}>Loading user data...</Text>
//         </View>
//       )}

//       {!loadingUser && selectedUser && Platform.OS !== "web" && (
//         <>
//           {mapMode === "safeZone" && (
//             <Text style={{ textAlign: "center", color: "blue", marginVertical: 5 }}>
//               Tap on map to choose safe zone center
//             </Text>
//           )}
//           {mapMode === "setHome" && (
//             <Text style={{ textAlign: "center", color: "#e67e22", marginVertical: 5, fontWeight: "600" }}>
//               🏠 Tap on map to pin {selectedUser.name}'s home location
//             </Text>
//           )}

//           {/* ─── MAP ─── */}
//           <View style={styles.map}>
//             <MapView
//               ref={mapRef}
//               style={StyleSheet.absoluteFillObject}
//               initialRegion={initialRegion}
//               onPress={handleMapPress}
//               // ─── TWEAK 3: Pause follow when guardian drags map ────────────
//               onPanDrag={() => setIsFollowing(false)}
//               showsUserLocation={false}
//             >
//               {/* User location dot */}
//               {userLocation && (
//                 <Marker coordinate={userLocation} title={selectedUser.name}>
//                   <View style={[
//                     mapStyles.userDot,
//                     { backgroundColor: isOutside ? "#ef4444" : "#16a34a" }
//                   ]} />
//                 </Marker>
//               )}

//               {/* Safe zones */}
//               {safeZones.map((z, i) => (
//                 <Circle
//                   key={`zone-${i}`}
//                   center={{ latitude: Number(z.center_lat), longitude: Number(z.center_lng) }}
//                   radius={z.radius_meters}
//                   strokeColor="#0096ff"
//                   strokeWidth={2}
//                   fillColor="rgba(0,150,255,0.15)"
//                 />
//               ))}

//               {/* Home marker + radius */}
//               {homeLocation && (
//                 <>
//                   <Marker coordinate={homeLocation} title={`${selectedUser.name}'s Home`}>
//                     <Text style={{ fontSize: 28 }}>🏠</Text>
//                   </Marker>
//                   <Circle
//                     center={homeLocation}
//                     radius={HOME_RADIUS_METERS}
//                     strokeColor="#f97316"
//                     strokeWidth={2}
//                     fillColor="rgba(249,115,22,0.15)"
//                   />
//                 </>
//               )}

//               {/* Pending safe zone preview */}
//               {selectedCenter && mapMode === "safeZone" && (
//                 <>
//                   <Marker coordinate={selectedCenter} title="Safe Zone Center">
//                     <View style={mapStyles.pendingDot} />
//                   </Marker>
//                   <Circle
//                     center={selectedCenter}
//                     radius={radius}
//                     strokeColor="#3b82f6"
//                     strokeWidth={2}
//                     fillColor="rgba(59,130,246,0.2)"
//                   />
//                 </>
//               )}

//               {/* Pending home marker */}
//               {pendingHome && mapMode === "setHome" && (
//                 <Marker coordinate={pendingHome} title="New Home (tap Confirm)">
//                   <Text style={{ fontSize: 28, opacity: 0.7 }}>🏠</Text>
//                 </Marker>
//               )}
//             </MapView>

//             {/* ─── TWEAK 1 & 3: Floating action buttons ────────────────────── */}
//             <View style={fabStyles.container}>
//               {/* Follow Mode Toggle */}
//               <Pressable
//                 style={[fabStyles.btn, fabStyles.btnFollow, isFollowing && fabStyles.btnFollowActive]}
//                 onPress={() => setIsFollowing((prev) => !prev)}
//               >
//                 <Text style={fabStyles.icon}>{isFollowing ? "🔒" : "🔓"}</Text>
//                 <Text style={fabStyles.label}>{isFollowing ? "Following" : "Follow"}</Text>
//               </Pressable>

//               {/* Go to User */}
//               <Pressable
//                 style={[fabStyles.btn, !userLocation && fabStyles.btnDisabled]}
//                 onPress={() => {
//                   locateUser();
//                   setIsFollowing(true);
//                 }}
//                 disabled={!userLocation}
//               >
//                 <Text style={fabStyles.icon}>📍</Text>
//                 <Text style={fabStyles.label}>Go to User</Text>
//               </Pressable>

//               {/* Set Home Here */}
//               <Pressable
//                 style={[fabStyles.btn, fabStyles.btnHome, !userLocation && fabStyles.btnDisabled]}
//                 onPress={setHomeAtUserLocation}
//                 disabled={!userLocation || savingHome}
//               >
//                 {savingHome ? (
//                   <ActivityIndicator size="small" color="#fff" />
//                 ) : (
//                   <>
//                     <Text style={fabStyles.icon}>🏠</Text>
//                     <Text style={fabStyles.label}>Set Home Here</Text>
//                   </>
//                 )}
//               </Pressable>
//             </View>
//           </View>

//           {/* STATUS CARD */}
//           <View style={styles.infoCard}>
//             <Text style={styles.userName}>{selectedUser.name}</Text>
//             {safeZones.length === 0 ? (
//               <Text style={{ color: "#888", fontWeight: "600" }}>
//                 ⚠️ No Safe Zone Set
//               </Text>
//             ) : (
//               <Text style={{ color: isOutside ? "red" : "green", fontWeight: "600" }}>
//                 {isOutside ? "🚨 Outside Safe Zones" : "✅ Inside Safe Zone"}
//               </Text>
//             )}
//             {homeLocation && (
//               <Text style={{ color: isAwayFromHome ? "#ff8c00" : "#16a34a", fontWeight: "600", marginTop: 2 }}>
//                 {isAwayFromHome ? "🏠 Away from Home" : "🏠 At Home"}
//               </Text>
//             )}
//             {homeLocation && (
//               <Text style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
//                 🏠 Home: {homeLocation.latitude.toFixed(4)}, {homeLocation.longitude.toFixed(4)}
//               </Text>
//             )}
//             {lastUpdated && <Text style={styles.updateText}>Last Updated: {lastUpdated}</Text>}
//           </View>

//           <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
//             {/* ─── SET HOME ─── */}
//             <View style={{ marginHorizontal: 16, marginTop: 12 }}>
//               <Text style={{ fontWeight: "700", fontSize: 14, marginBottom: 8, color: "#333" }}>
//                 🏠 Set {selectedUser.name}'s Home Location
//               </Text>
//               <Text style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
//                 Guardian is notified when user leaves this location ({HOME_RADIUS_METERS}m radius)
//               </Text>
//               {mapMode !== "setHome" ? (
//                 <Pressable
//                   style={{ backgroundColor: "#fff3e0", borderColor: "#e67e22", borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center", marginBottom: 8 }}
//                   onPress={() => { setMapMode("setHome"); setPendingHome(null); }}
//                 >
//                   <Text style={{ color: "#e67e22", fontWeight: "600" }}>📍 Tap Map to Set Home</Text>
//                 </Pressable>
//               ) : (
//                 <View style={{ gap: 8, marginBottom: 8 }}>
//                   <Pressable
//                     style={{ backgroundColor: pendingHome ? "#e67e22" : "#ccc", borderRadius: 12, paddingVertical: 12, alignItems: "center" }}
//                     onPress={() => pendingHome && saveHomeLocation(pendingHome)}
//                     disabled={!pendingHome || savingHome}
//                   >
//                     {savingHome ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "600" }}>✅ Confirm Home Location</Text>}
//                   </Pressable>
//                   <Pressable
//                     style={{ backgroundColor: "#f5f5f5", borderRadius: 12, paddingVertical: 12, alignItems: "center" }}
//                     onPress={() => { setMapMode("none"); setPendingHome(null); }}
//                   >
//                     <Text style={{ color: "#666", fontWeight: "600" }}>Cancel</Text>
//                   </Pressable>
//                 </View>
//               )}
//             </View>

//             {/* ─── SAFE ZONE ─── */}
//             <View style={styles.radiusContainer}>
//               <Text style={{ fontWeight: "600" }}>Set Radius:</Text>
//               <Text style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
//                 Guardian is notified when user exits this zone
//               </Text>
//               <View style={styles.radiusButtons}>
//                 {[100, 300, 500, 1000].map((r) => (
//                   <Pressable key={r} onPress={() => setRadius(r)} style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]}>
//                     <Text>{r}m</Text>
//                   </Pressable>
//                 ))}
//               </View>
//               {mapMode !== "safeZone" ? (
//                 <Pressable style={styles.activateBtn} onPress={() => { setMapMode("safeZone"); setSelectedCenter(null); }}>
//                   <Text style={{ color: "#fff" }}>Start Adding Safe Zone</Text>
//                 </Pressable>
//               ) : (
//                 <>
//                   <Pressable style={styles.activateBtn} onPress={activateSafeZone} disabled={!selectedCenter}>
//                     <Text style={{ color: "#fff" }}>Confirm Safe Zone</Text>
//                   </Pressable>
//                   <Pressable
//                     style={[styles.activateBtn, { backgroundColor: "gray", marginTop: 8 }]}
//                     onPress={() => { setMapMode("none"); setSelectedCenter(null); }}
//                   >
//                     <Text style={{ color: "#fff" }}>Cancel</Text>
//                   </Pressable>
//                 </>
//               )}
//             </View>
//           </ScrollView>
//         </>
//       )}

//       {!loadingUser && linkedUsers.length === 0 && (
//         <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
//           <Text style={{ fontSize: 16, color: "#666", textAlign: "center" }}>
//             No linked users yet.{"\n"}Ask a user to add you as their guardian.
//           </Text>
//         </View>
//       )}
//     </SafeAreaView>
//   );
// }

// // ─── Map marker styles ────────────────────────────────────────────────────────
// const mapStyles = StyleSheet.create({
//   userDot: {
//     width: 20,
//     height: 20,
//     borderRadius: 10,
//     borderWidth: 2,
//     borderColor: "#fff",
//   },
//   pendingDot: {
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//     backgroundColor: "#3b82f6",
//     borderWidth: 2,
//     borderColor: "#fff",
//   },
// });

// // ─── TWEAK 1 & 3: Floating action button styles ───────────────────────────────
// const fabStyles = StyleSheet.create({
//   container: {
//     position: "absolute",
//     top: 12,
//     right: 12,
//     gap: 8,
//   },
//   btn: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 6,
//     backgroundColor: "#16a34a",
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 24,
//     elevation: 4,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//   },
//   btnHome: {
//     backgroundColor: "#e67e22",
//   },
//   btnFollow: {
//     backgroundColor: "#64748b",
//   },
//   btnFollowActive: {
//     backgroundColor: "#2563eb",
//   },
//   btnDisabled: {
//     backgroundColor: "#aaa",
//     opacity: 0.6,
//   },
//   icon: {
//     fontSize: 16,
//   },
//   label: {
//     color: "#fff",
//     fontWeight: "700",
//     fontSize: 13,
//   },
// });

// // ─── Alarm Banner Styles ──────────────────────────────────────────────────────
// const alarmBannerStyles = StyleSheet.create({
//   banner: {
//     marginHorizontal: 16,
//     marginBottom: 8,
//     borderRadius: 14,
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     elevation: 6,
//   },
//   bannerContent: { flexDirection: "row", alignItems: "center", gap: 10 },
//   bannerIcon: { fontSize: 28 },
//   bannerTitle: { color: "#fff", fontWeight: "800", fontSize: 15 },
//   bannerSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 },
//   dismissBtn: { backgroundColor: "rgba(0,0,0,0.25)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
//   dismissText: { color: "#fff", fontWeight: "700", fontSize: 12 },
// });

// import {
//   View,
//   Text,
//   Pressable,
//   Platform,
//   Alert,
//   ActivityIndicator,
//   ScrollView,
//   Modal,
//   FlatList,
//   Vibration,
//   Animated,
//   StyleSheet,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { guardianStyles as styles } from "@/styles/guardian";
// import { useState, useEffect, useRef, useCallback } from "react";
// import { supabase } from "@/supabase/supabase";
// import MapView, { Marker, Circle } from "react-native-maps";
// import * as Notifications from "expo-notifications";

// // ─── Types ────────────────────────────────────────────────────────────────────
// type LinkedUser = {
//   user_id: string;
//   name: string;
// };
// type AlarmType = "left_home" | "safe_zone" | "panic" | null;
// type MapMode = "none" | "safeZone" | "setHome";

// const HOME_RADIUS_METERS = 50;

// // ─── Push Notification Helper ─────────────────────────────────────────────────
// async function sendPushNotification(title: string, body: string) {
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
//     console.log("❌ Notification error:", err);
//   }
// }

// // ─── Component ────────────────────────────────────────────────────────────────
// export default function GuardianScreen() {
//   const mapRef = useRef<MapView>(null);
//   const [linkedUsers, setLinkedUsers] = useState<LinkedUser[]>([]);
//   const [selectedUser, setSelectedUser] = useState<LinkedUser | null>(null);
//   const [dropdownVisible, setDropdownVisible] = useState(false);
//   const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
//   const [safeZones, setSafeZones] = useState<any[]>([]);
//   const [selectedCenter, setSelectedCenter] = useState<{ latitude: number; longitude: number } | null>(null);
//   const [radius, setRadius] = useState(300);
//   const [lastUpdated, setLastUpdated] = useState("");
//   const [isOutside, setIsOutside] = useState(false);
//   const [isAwayFromHome, setIsAwayFromHome] = useState(false);
//   const [mapMode, setMapMode] = useState<MapMode>("none");
//   const [homeLocation, setHomeLocation] = useState<{ latitude: number; longitude: number } | null>(null);
//   const [pendingHome, setPendingHome] = useState<{ latitude: number; longitude: number } | null>(null);
//   const [savingHome, setSavingHome] = useState(false);
//   const [loadingUser, setLoadingUser] = useState(false);
//   const [isFollowing, setIsFollowing] = useState(true);
//   const hasInitialFit = useRef(false);

//   // ─── Alarm state ──────────────────────────────────────────────────────────
//   const [activeAlarm, setActiveAlarm] = useState<AlarmType>(null);
//   const alarmAnim = useRef(new Animated.Value(0)).current;
//   const alarmLoop = useRef<Animated.CompositeAnimation | null>(null);
//   const realtimeChannel = useRef<any>(null);
//   const alertChannel = useRef<any>(null);
//   const [alertModal, setAlertModal] = useState<{ title: string; body: string } | null>(null);

//   const showAlert = (title: string, body: string) => setAlertModal({ title, body });
//   const hideAlert = () => {
//     setAlertModal(null);
//     dismissAlarm();
//   };

//   const prevIsOutside = useRef(false);
//   const prevIsAwayFromHome = useRef(false);

//   useEffect(() => {
//     Notifications.requestPermissionsAsync();
//   }, []);

//   // ─── Initial fit ──────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (userLocation && mapRef.current && !hasInitialFit.current) {
//       hasInitialFit.current = true;
//       const coords = [userLocation];
//       if (homeLocation) coords.push(homeLocation);
//       mapRef.current.fitToCoordinates(coords, {
//         edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
//         animated: true,
//       });
//     }
//   }, [userLocation, homeLocation]);

//   // ─── Auto-follow ──────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!userLocation || !mapRef.current || !isFollowing) return;
//     mapRef.current.animateToRegion(
//       {
//         latitude: userLocation.latitude,
//         longitude: userLocation.longitude,
//         latitudeDelta: 0.01,
//         longitudeDelta: 0.01,
//       },
//       800
//     );
//   }, [userLocation, isFollowing]);

//   // ─── Alarm animation ──────────────────────────────────────────────────────
//   const startAlarmAnimation = () => {
//     alarmLoop.current?.stop();
//     alarmLoop.current = Animated.loop(
//       Animated.sequence([
//         Animated.timing(alarmAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
//         Animated.timing(alarmAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
//       ])
//     );
//     alarmLoop.current.start();
//   };

//   const stopAlarmAnimation = () => {
//     alarmLoop.current?.stop();
//     alarmAnim.setValue(0);
//   };

//   const triggerAlarm = (type: AlarmType) => {
//     setActiveAlarm(type);
//     startAlarmAnimation();
//     try {
//       if (Platform.OS === "android") {
//         Vibration.vibrate([500, 300, 500, 300, 1000], false);
//       } else {
//         Vibration.vibrate(1000);
//       }
//     } catch (e) {
//       console.warn("Vibration failed:", e);
//     }
//   };

//   const dismissAlarm = () => {
//     setActiveAlarm(null);
//     stopAlarmAnimation();
//     Vibration.cancel();
//   };

//   const safeZoneAlarmColor = alarmAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: ["#ff4444", "#ff0000"],
//   });
//   const leftHomeAlarmColor = alarmAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: ["#ff8c00", "#ff6600"],
//   });
//   const panicAlarmColor = alarmAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: ["#7c3aed", "#5b21b6"],
//   });

//   const alarmBgColor =
//     activeAlarm === "safe_zone"
//       ? safeZoneAlarmColor
//       : activeAlarm === "panic"
//       ? panicAlarmColor
//       : leftHomeAlarmColor;

//   // ─── Distance helper ──────────────────────────────────────────────────────
//   const calculateDistance = (
//     lat1: number,
//     lon1: number,
//     lat2: number,
//     lon2: number
//   ) => {
//     const R = 6371e3;
//     const φ1 = (lat1 * Math.PI) / 180;
//     const φ2 = (lat2 * Math.PI) / 180;
//     const Δφ = ((lat2 - lat1) * Math.PI) / 180;
//     const Δλ = ((lon2 - lon1) * Math.PI) / 180;
//     const a =
//       Math.sin(Δφ / 2) ** 2 +
//       Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
//     return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   };

//   // ─── Evaluate alerts ──────────────────────────────────────────────────────
//   const evaluateAlerts = async (
//     lat: number,
//     lng: number,
//     zones: any[],
//     home: { latitude: number; longitude: number } | null,
//     userName: string
//   ) => {
//     const nowOutside =
//       zones.length > 0
//         ? !zones.some(
//             (z) =>
//               calculateDistance(z.center_lat, z.center_lng, lat, lng) <=
//               z.radius_meters
//           )
//         : false;

//     const nowAwayFromHome = home
//       ? calculateDistance(home.latitude, home.longitude, lat, lng) >
//         HOME_RADIUS_METERS
//       : false;

//     if (nowAwayFromHome && !prevIsAwayFromHome.current) {
//       const title = "🏠 User Left Home";
//       const body = `${userName} has left home.`;
//       showAlert(title, body);
//       await sendPushNotification(title, body);
//       triggerAlarm("left_home");
//     }
//     prevIsAwayFromHome.current = nowAwayFromHome;

//     if (nowOutside && !prevIsOutside.current) {
//       const title = "🚨 Safe Zone Alert";
//       const body = `${userName} has crossed outside the safe zone!`;
//       showAlert(title, body);
//       await sendPushNotification(title, body);
//       triggerAlarm("safe_zone");
//     }
//     prevIsOutside.current = nowOutside;

//     setIsOutside(nowOutside);
//     setIsAwayFromHome(nowAwayFromHome);
//   };

//   // ─── Subscribe to realtime location ───────────────────────────────────────
//   const subscribeToLocationUpdates = useCallback(
//     (
//       userId: string,
//       zones: any[],
//       home: { latitude: number; longitude: number } | null,
//       userName: string
//     ) => {
//       if (realtimeChannel.current) {
//         supabase.removeChannel(realtimeChannel.current);
//         realtimeChannel.current = null;
//       }

//       realtimeChannel.current = supabase
//         .channel(`location_updates_${userId}`)
//         .on(
//           "postgres_changes",
//           {
//             event: "INSERT",
//             schema: "public",
//             table: "help_app_user_locations",
//             filter: `user_id=eq.${userId}`,
//           },
//           async (payload: any) => {
//             try {
//               const record = payload.new;
//               if (record.is_home) return;
//               const lat =
//                 record.latitude != null ? record.latitude : record.lat;
//               const lng =
//                 record.longitude != null ? record.longitude : record.lng;
//               if (lat == null || lng == null) return;
//               const newLat = Number(lat);
//               const newLng = Number(lng);
//               setUserLocation({ latitude: newLat, longitude: newLng });
//               setLastUpdated(
//                 new Date(record.recorded_at).toLocaleTimeString()
//               );
//               await evaluateAlerts(newLat, newLng, zones, home, userName);
//             } catch (err) {
//               console.error("Realtime payload error:", err);
//             }
//           }
//         )
//         .subscribe((status: string, err: any) => {
//           console.log("📡 Realtime status:", status);
//           if (err) console.error("Realtime subscribe error:", err);
//         });
//     },
//     []
//   );

//   // ─── Subscribe to help_app_alerts (panic / zone_exit from background) ─────
//   useEffect(() => {
//     if (!selectedUser) return;

//     if (alertChannel.current) {
//       supabase.removeChannel(alertChannel.current);
//       alertChannel.current = null;
//     }

//     alertChannel.current = supabase
//       .channel(`guardian_alerts_${selectedUser.user_id}`)
//       .on(
//         "postgres_changes",
//         {
//           event: "INSERT",
//           schema: "public",
//           table: "help_app_alerts",
//           filter: `user_id=eq.${selectedUser.user_id}`,
//         },
//         async (payload: any) => {
//           try {
//             const alert = payload.new;
//             const alertType = alert.alert_type;

//             console.log("🚨 Alert received:", alertType);

//             // ✅ Use correct alert_type values matching DB constraint
//             if (alertType === "panic") {
//               const title = "🚨 Emergency Alert";
//               const body = `${selectedUser.name} needs help!`;
//               showAlert(title, body);
//               await sendPushNotification(title, body);
//               triggerAlarm("panic");

//             } else if (alertType === "zone_exit") {
//               const isHomeAlert = alert.message
//                 ?.toLowerCase()
//                 .includes("home");
//               const title = isHomeAlert
//                 ? "🏠 User Left Home"
//                 : "🚨 Safe Zone Alert";
//               const body =
//                 alert.message ||
//                 `${selectedUser.name} has left a monitored area.`;
//               showAlert(title, body);
//               await sendPushNotification(title, body);
//               triggerAlarm(isHomeAlert ? "left_home" : "safe_zone");

//             } else if (alertType === "manual_help") {
//               const title = "🆘 Manual Help Request";
//               const body =
//                 alert.message || `${selectedUser.name} requested help.`;
//               showAlert(title, body);
//               await sendPushNotification(title, body);
//               triggerAlarm("panic");
//             }
//           } catch (err) {
//             console.error("Alert listener error:", err);
//           }
//         }
//       )
//       .subscribe((status: string) => {
//         console.log("📡 Alert subscription status:", status);
//       });

//     return () => {
//       if (alertChannel.current) {
//         supabase.removeChannel(alertChannel.current);
//         alertChannel.current = null;
//       }
//     };
//   }, [selectedUser]);

//   // ─── Init: fetch linked users ──────────────────────────────────────────────
//   useEffect(() => {
//     let cancelled = false;
//     const init = async () => {
//       try {
//         const { data, error } = await supabase.auth.getUser();
//         if (error) throw error;
//         const user = data?.user;
//         if (!user || cancelled) return;

//         const { data: links } = await supabase
//           .from("help_app_guardian_links")
//           .select("user_id")
//           .eq("guardian_id", user.id)
//           .eq("status", "approved");

//         if (!links || links.length === 0 || cancelled) return;

//         const userIds = links.map((l: any) => l.user_id);
//         const { data: profiles } = await supabase
//           .from("help_app_profiles")
//           .select("id, name")
//           .in("id", userIds);

//         if (profiles && !cancelled) {
//           const users: LinkedUser[] = profiles.map((p: any) => ({
//             user_id: p.id,
//             name: p.name || "Unnamed User",
//           }));
//           setLinkedUsers(users);
//           if (users.length > 0) selectUser(users[0], user.id);
//         }
//       } catch (err) {
//         console.error("Guardian init error:", err);
//       }
//     };
//     init();
//     return () => {
//       cancelled = true;
//       if (realtimeChannel.current) {
//         supabase.removeChannel(realtimeChannel.current);
//         realtimeChannel.current = null;
//       }
//     };
//   }, []);

//   // ─── Select user ──────────────────────────────────────────────────────────
//   const selectUser = async (linkedUser: LinkedUser, guardianId?: string) => {
//     setSelectedUser(linkedUser);
//     setDropdownVisible(false);
//     setLoadingUser(true);
//     setUserLocation(null);
//     setSafeZones([]);
//     setHomeLocation(null);
//     setMapMode("none");
//     setSelectedCenter(null);
//     setPendingHome(null);
//     dismissAlarm();
//     prevIsOutside.current = false;
//     prevIsAwayFromHome.current = false;
//     hasInitialFit.current = false;
//     setIsFollowing(true);

//     try {
//       const { data, error } = await supabase.auth.getUser();
//       if (error) throw error;
//       const user = data?.user;
//       const gId = guardianId || user?.id;
//       if (!gId) return;

//       const { data: zones } = await supabase
//         .from("help_app_safe_zones")
//         .select("*")
//         .eq("guardian_id", gId)
//         .eq("user_id", linkedUser.user_id)
//         .eq("active", true);

//       const fetchedZones = zones || [];
//       setSafeZones(fetchedZones);

//       const { data: homeData } = await supabase
//         .from("help_app_user_locations")
//         .select("lat, lng")
//         .eq("user_id", linkedUser.user_id)
//         .eq("is_home", true)
//         .maybeSingle();

//       let fetchedHome: { latitude: number; longitude: number } | null = null;
//       if (homeData) {
//         fetchedHome = {
//           latitude: Number(homeData.lat),
//           longitude: Number(homeData.lng),
//         };
//         setHomeLocation(fetchedHome);
//       }

//       const { data: latestLocation } = await supabase
//         .from("help_app_user_locations")
//         .select("*")
//         .eq("user_id", linkedUser.user_id)
//         .eq("is_home", false)
//         .order("recorded_at", { ascending: false })
//         .limit(1)
//         .maybeSingle();

//       if (latestLocation) {
//         const lat = latestLocation.latitude ?? latestLocation.lat ?? null;
//         const lng = latestLocation.longitude ?? latestLocation.lng ?? null;
//         if (lat != null && lng != null) {
//           const newLat = Number(lat);
//           const newLng = Number(lng);
//           setUserLocation({ latitude: newLat, longitude: newLng });
//           setLastUpdated(
//             new Date(latestLocation.recorded_at).toLocaleTimeString()
//           );
//           const outside =
//             fetchedZones.length > 0
//               ? !fetchedZones.some(
//                   (z) =>
//                     calculateDistance(
//                       z.center_lat,
//                       z.center_lng,
//                       newLat,
//                       newLng
//                     ) <= z.radius_meters
//                 )
//               : false;
//           const awayFromHome = fetchedHome
//             ? calculateDistance(
//                 fetchedHome.latitude,
//                 fetchedHome.longitude,
//                 newLat,
//                 newLng
//               ) > HOME_RADIUS_METERS
//             : false;
//           setIsOutside(outside);
//           setIsAwayFromHome(awayFromHome);
//           prevIsOutside.current = outside;
//           prevIsAwayFromHome.current = awayFromHome;
//         }
//       }

//       subscribeToLocationUpdates(
//         linkedUser.user_id,
//         fetchedZones,
//         fetchedHome,
//         linkedUser.name
//       );
//     } catch (err) {
//       console.error("selectUser error:", err);
//     } finally {
//       setLoadingUser(false);
//     }
//   };

//   // ─── Handle map press ─────────────────────────────────────────────────────
//   const handleMapPress = (e: any) => {
//     const { latitude, longitude } = e.nativeEvent.coordinate;
//     if (mapMode === "safeZone") setSelectedCenter({ latitude, longitude });
//     else if (mapMode === "setHome") setPendingHome({ latitude, longitude });
//   };

//   // ─── Add safe zone ────────────────────────────────────────────────────────
//   const activateSafeZone = async () => {
//     if (!selectedCenter || !selectedUser) {
//       Alert.alert("Select a location first.");
//       return;
//     }
//     try {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) return;
//       const { data, error } = await supabase
//         .from("help_app_safe_zones")
//         .insert({
//           guardian_id: user.id,
//           user_id: selectedUser.user_id,
//           center_lat: selectedCenter.latitude,
//           center_lng: selectedCenter.longitude,
//           radius_meters: radius,
//           active: true,
//         })
//         .select()
//         .single();
//       if (error) { Alert.alert("Error", error.message); return; }
//       const updatedZones = [...safeZones, data];
//       setSafeZones(updatedZones);
//       setSelectedCenter(null);
//       setMapMode("none");
//       if (userLocation) {
//         await evaluateAlerts(
//           userLocation.latitude,
//           userLocation.longitude,
//           updatedZones,
//           homeLocation,
//           selectedUser.name
//         );
//       }
//       subscribeToLocationUpdates(
//         selectedUser.user_id,
//         updatedZones,
//         homeLocation,
//         selectedUser.name
//       );
//       Alert.alert("✅ Safe Zone Added");
//     } catch (err) {
//       console.error("activateSafeZone error:", err);
//     }
//   };

//   // ─── Locate user ──────────────────────────────────────────────────────────
//   const locateUser = () => {
//     if (!userLocation || !mapRef.current) return;
//     mapRef.current.animateToRegion(
//       {
//         latitude: userLocation.latitude,
//         longitude: userLocation.longitude,
//         latitudeDelta: 0.01,
//         longitudeDelta: 0.01,
//       },
//       500
//     );
//   };

//   // ─── Set home at user's current location ──────────────────────────────────
//   const setHomeAtUserLocation = () => {
//     if (!userLocation) {
//       Alert.alert("User location not available yet.");
//       return;
//     }
//     Alert.alert(
//       "Set Home",
//       `Set ${selectedUser?.name}'s current location as home?`,
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Confirm",
//           onPress: async () => {
//             await saveHomeLocation(userLocation);
//             if (mapRef.current) {
//               mapRef.current.fitToCoordinates([userLocation], {
//                 edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
//                 animated: true,
//               });
//             }
//           },
//         },
//       ]
//     );
//   };

//   // ─── Save home location ───────────────────────────────────────────────────
//   const saveHomeLocation = async (coords: {
//     latitude: number;
//     longitude: number;
//   }) => {
//     if (!selectedUser) return;
//     setSavingHome(true);
//     try {
//       const { data: existing } = await supabase
//         .from("help_app_user_locations")
//         .select("id")
//         .eq("user_id", selectedUser.user_id)
//         .eq("is_home", true)
//         .maybeSingle();

//       let error;
//       if (existing) {
//         const { error: updateError } = await supabase
//           .from("help_app_user_locations")
//           .update({
//             lat: coords.latitude,
//             lng: coords.longitude,
//             recorded_at: new Date().toISOString(),
//           })
//           .eq("id", existing.id);
//         error = updateError;
//       } else {
//         const { error: insertError } = await supabase
//           .from("help_app_user_locations")
//           .insert({
//             user_id: selectedUser.user_id,
//             lat: coords.latitude,
//             lng: coords.longitude,
//             is_home: true,
//             recorded_at: new Date().toISOString(),
//           });
//         error = insertError;
//       }

//       if (error) { Alert.alert("Error saving home", error.message); return; }
//       setHomeLocation(coords);
//       setPendingHome(null);
//       setMapMode("none");
//       subscribeToLocationUpdates(
//         selectedUser.user_id,
//         safeZones,
//         coords,
//         selectedUser.name
//       );
//       if (userLocation) {
//         await evaluateAlerts(
//           userLocation.latitude,
//           userLocation.longitude,
//           safeZones,
//           coords,
//           selectedUser.name
//         );
//       }
//       Alert.alert("✅ Home location saved for " + selectedUser.name + "!");
//     } catch {
//       Alert.alert("Something went wrong saving home.");
//     } finally {
//       setSavingHome(false);
//     }
//   };

//   const initialRegion = {
//     latitude: userLocation?.latitude ?? homeLocation?.latitude ?? 28.6139,
//     longitude: userLocation?.longitude ?? homeLocation?.longitude ?? 77.209,
//     latitudeDelta: 0.05,
//     longitudeDelta: 0.05,
//   };

//   // ─── Alarm banner label helpers ───────────────────────────────────────────
//   const alarmIcon =
//     activeAlarm === "panic"
//       ? "🆘"
//       : activeAlarm === "left_home"
//       ? "🏠"
//       : "🚨";

//   const alarmTitle =
//     activeAlarm === "panic"
//       ? "Emergency Alert!"
//       : activeAlarm === "left_home"
//       ? "User Left Home!"
//       : "Safe Zone Crossed!";

//   const alarmSubtitle =
//     activeAlarm === "panic"
//       ? `${selectedUser?.name} needs help`
//       : activeAlarm === "left_home"
//       ? `${selectedUser?.name} has left the home area`
//       : `${selectedUser?.name} has exited all safe zones`;

//   // ─── UI ───────────────────────────────────────────────────────────────────
//   return (
//     <SafeAreaView style={styles.container}>
//       <Text style={styles.title}>Guardian View</Text>

//       {/* ─── CUSTOM ALERT MODAL ─── */}
//       <Modal visible={!!alertModal} transparent animationType="fade">
//         <View style={{
//           flex: 1,
//           backgroundColor: "rgba(0,0,0,0.6)",
//           justifyContent: "center",
//           alignItems: "center",
//           padding: 32,
//         }}>
//           <View style={{
//             backgroundColor: "#fff",
//             borderRadius: 20,
//             padding: 24,
//             width: "100%",
//             elevation: 10,
//           }}>
//             <Text style={{ fontSize: 22, fontWeight: "800", color: "#1a1a1a", marginBottom: 8 }}>
//               {alertModal?.title}
//             </Text>
//             <Text style={{ fontSize: 15, color: "#555", marginBottom: 24, lineHeight: 22 }}>
//               {alertModal?.body}
//             </Text>
//             <Pressable
//               onPress={hideAlert}
//               style={{ backgroundColor: "#ff4444", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
//             >
//               <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Dismiss</Text>
//             </Pressable>
//           </View>
//         </View>
//       </Modal>

//       {/* ─── ALARM BANNER ─── */}
//       {activeAlarm && (
//         <Animated.View style={[alarmBannerStyles.banner, { backgroundColor: alarmBgColor }]}>
//           <View style={alarmBannerStyles.bannerContent}>
//             <Text style={alarmBannerStyles.bannerIcon}>{alarmIcon}</Text>
//             <View style={{ flex: 1 }}>
//               <Text style={alarmBannerStyles.bannerTitle}>{alarmTitle}</Text>
//               <Text style={alarmBannerStyles.bannerSubtitle}>{alarmSubtitle}</Text>
//             </View>
//             <Pressable onPress={dismissAlarm} style={alarmBannerStyles.dismissBtn}>
//               <Text style={alarmBannerStyles.dismissText}>✕ Dismiss</Text>
//             </Pressable>
//           </View>
//         </Animated.View>
//       )}

//       {/* ─── USER SELECTOR ─── */}
//       <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
//         <Text style={{ fontSize: 12, fontWeight: "600", color: "#666", marginBottom: 4 }}>
//           MONITORING
//         </Text>
//         <Pressable
//           onPress={() => setDropdownVisible(true)}
//           style={{
//             flexDirection: "row",
//             alignItems: "center",
//             justifyContent: "space-between",
//             backgroundColor: "#f0fdf4",
//             borderColor: "#16a34a",
//             borderWidth: 1.5,
//             borderRadius: 12,
//             paddingHorizontal: 16,
//             paddingVertical: 12,
//           }}
//         >
//           <Text style={{ fontWeight: "700", fontSize: 16, color: "#15803d" }}>
//             {selectedUser ? `👤 ${selectedUser.name}` : "Select a user..."}
//           </Text>
//           <Text style={{ color: "#16a34a", fontSize: 18 }}>▾</Text>
//         </Pressable>
//       </View>

//       {/* ─── DROPDOWN MODAL ─── */}
//       <Modal visible={dropdownVisible} transparent animationType="fade">
//         <Pressable
//           style={{
//             flex: 1,
//             backgroundColor: "rgba(0,0,0,0.4)",
//             justifyContent: "center",
//             padding: 32,
//           }}
//           onPress={() => setDropdownVisible(false)}
//         >
//           <View style={{ backgroundColor: "#fff", borderRadius: 16, overflow: "hidden" }}>
//             <Text style={{
//               padding: 16,
//               fontWeight: "700",
//               fontSize: 16,
//               borderBottomWidth: 1,
//               borderBottomColor: "#f0f0f0",
//             }}>
//               Select User to Monitor
//             </Text>
//             <FlatList
//               data={linkedUsers}
//               keyExtractor={(item) => item.user_id}
//               renderItem={({ item }) => (
//                 <Pressable
//                   onPress={() => selectUser(item)}
//                   style={{
//                     padding: 16,
//                     borderBottomWidth: 1,
//                     borderBottomColor: "#f9f9f9",
//                     backgroundColor:
//                       selectedUser?.user_id === item.user_id ? "#f0fdf4" : "#fff",
//                   }}
//                 >
//                   <Text style={{
//                     fontSize: 15,
//                     fontWeight: selectedUser?.user_id === item.user_id ? "700" : "400",
//                     color: "#333",
//                   }}>
//                     👤 {item.name}
//                     {selectedUser?.user_id === item.user_id ? "  ✓" : ""}
//                   </Text>
//                 </Pressable>
//               )}
//             />
//           </View>
//         </Pressable>
//       </Modal>

//       {loadingUser && (
//         <View style={{ alignItems: "center", padding: 20 }}>
//           <ActivityIndicator size="large" color="#16a34a" />
//           <Text style={{ color: "#666", marginTop: 8 }}>Loading user data...</Text>
//         </View>
//       )}

//       {!loadingUser && selectedUser && Platform.OS !== "web" && (
//         <>
//           {mapMode === "safeZone" && (
//             <Text style={{ textAlign: "center", color: "blue", marginVertical: 5 }}>
//               Tap on map to choose safe zone center
//             </Text>
//           )}
//           {mapMode === "setHome" && (
//             <Text style={{
//               textAlign: "center",
//               color: "#e67e22",
//               marginVertical: 5,
//               fontWeight: "600",
//             }}>
//               🏠 Tap on map to pin {selectedUser.name}'s home location
//             </Text>
//           )}

//           {/* ─── MAP ─── */}
//           <View style={styles.map}>
//             <MapView
//               ref={mapRef}
//               style={StyleSheet.absoluteFillObject}
//               initialRegion={initialRegion}
//               onPress={handleMapPress}
//               onPanDrag={() => setIsFollowing(false)}
//               showsUserLocation={false}
//             >
//               {userLocation && (
//                 <Marker coordinate={userLocation} title={selectedUser.name}>
//                   <View style={[
//                     mapStyles.userDot,
//                     { backgroundColor: isOutside ? "#ef4444" : "#16a34a" },
//                   ]} />
//                 </Marker>
//               )}

//               {safeZones.map((z, i) => (
//                 <Circle
//                   key={`zone-${i}`}
//                   center={{
//                     latitude: Number(z.center_lat),
//                     longitude: Number(z.center_lng),
//                   }}
//                   radius={z.radius_meters}
//                   strokeColor="#0096ff"
//                   strokeWidth={2}
//                   fillColor="rgba(0,150,255,0.15)"
//                 />
//               ))}

//               {homeLocation && (
//                 <>
//                   <Marker
//                     coordinate={homeLocation}
//                     title={`${selectedUser.name}'s Home`}
//                   >
//                     <Text style={{ fontSize: 28 }}>🏠</Text>
//                   </Marker>
//                   <Circle
//                     center={homeLocation}
//                     radius={HOME_RADIUS_METERS}
//                     strokeColor="#f97316"
//                     strokeWidth={2}
//                     fillColor="rgba(249,115,22,0.15)"
//                   />
//                 </>
//               )}

//               {selectedCenter && mapMode === "safeZone" && (
//                 <>
//                   <Marker coordinate={selectedCenter} title="Safe Zone Center">
//                     <View style={mapStyles.pendingDot} />
//                   </Marker>
//                   <Circle
//                     center={selectedCenter}
//                     radius={radius}
//                     strokeColor="#3b82f6"
//                     strokeWidth={2}
//                     fillColor="rgba(59,130,246,0.2)"
//                   />
//                 </>
//               )}

//               {pendingHome && mapMode === "setHome" && (
//                 <Marker coordinate={pendingHome} title="New Home (tap Confirm)">
//                   <Text style={{ fontSize: 28, opacity: 0.7 }}>🏠</Text>
//                 </Marker>
//               )}
//             </MapView>

//             {/* ─── FLOATING ACTION BUTTONS ─── */}
//             <View style={fabStyles.container}>
//               <Pressable
//                 style={[
//                   fabStyles.btn,
//                   fabStyles.btnFollow,
//                   isFollowing && fabStyles.btnFollowActive,
//                 ]}
//                 onPress={() => setIsFollowing((prev) => !prev)}
//               >
//                 <Text style={fabStyles.icon}>{isFollowing ? "🔒" : "🔓"}</Text>
//                 <Text style={fabStyles.label}>
//                   {isFollowing ? "Following" : "Follow"}
//                 </Text>
//               </Pressable>

//               <Pressable
//                 style={[fabStyles.btn, !userLocation && fabStyles.btnDisabled]}
//                 onPress={() => {
//                   locateUser();
//                   setIsFollowing(true);
//                 }}
//                 disabled={!userLocation}
//               >
//                 <Text style={fabStyles.icon}>📍</Text>
//                 <Text style={fabStyles.label}>Go to User</Text>
//               </Pressable>

//               <Pressable
//                 style={[
//                   fabStyles.btn,
//                   fabStyles.btnHome,
//                   !userLocation && fabStyles.btnDisabled,
//                 ]}
//                 onPress={setHomeAtUserLocation}
//                 disabled={!userLocation || savingHome}
//               >
//                 {savingHome ? (
//                   <ActivityIndicator size="small" color="#fff" />
//                 ) : (
//                   <>
//                     <Text style={fabStyles.icon}>🏠</Text>
//                     <Text style={fabStyles.label}>Set Home Here</Text>
//                   </>
//                 )}
//               </Pressable>
//             </View>
//           </View>

//           {/* ─── STATUS CARD ─── */}
//           <View style={styles.infoCard}>
//             <Text style={styles.userName}>{selectedUser.name}</Text>
//             {safeZones.length === 0 ? (
//               <Text style={{ color: "#888", fontWeight: "600" }}>
//                 ⚠️ No Safe Zone Set
//               </Text>
//             ) : (
//               <Text style={{ color: isOutside ? "red" : "green", fontWeight: "600" }}>
//                 {isOutside ? "🚨 Outside Safe Zones" : "✅ Inside Safe Zone"}
//               </Text>
//             )}
//             {homeLocation && (
//               <Text style={{
//                 color: isAwayFromHome ? "#ff8c00" : "#16a34a",
//                 fontWeight: "600",
//                 marginTop: 2,
//               }}>
//                 {isAwayFromHome ? "🏠 Away from Home" : "🏠 At Home"}
//               </Text>
//             )}
//             {homeLocation && (
//               <Text style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
//                 🏠 Home: {homeLocation.latitude.toFixed(4)},{" "}
//                 {homeLocation.longitude.toFixed(4)}
//               </Text>
//             )}
//             {lastUpdated && (
//               <Text style={styles.updateText}>Last Updated: {lastUpdated}</Text>
//             )}
//           </View>

//           <ScrollView
//             style={{ flexShrink: 1 }}
//             contentContainerStyle={{ paddingBottom: 20 }}
//           >
//             {/* ─── SET HOME ─── */}
//             <View style={{ marginHorizontal: 16, marginTop: 12 }}>
//               <Text style={{ fontWeight: "700", fontSize: 14, marginBottom: 8, color: "#333" }}>
//                 🏠 Set {selectedUser.name}'s Home Location
//               </Text>
//               <Text style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
//                 Guardian is notified when user leaves this location (
//                 {HOME_RADIUS_METERS}m radius)
//               </Text>
//               {mapMode !== "setHome" ? (
//                 <Pressable
//                   style={{
//                     backgroundColor: "#fff3e0",
//                     borderColor: "#e67e22",
//                     borderWidth: 1,
//                     borderRadius: 12,
//                     paddingVertical: 12,
//                     alignItems: "center",
//                     marginBottom: 8,
//                   }}
//                   onPress={() => {
//                     setMapMode("setHome");
//                     setPendingHome(null);
//                   }}
//                 >
//                   <Text style={{ color: "#e67e22", fontWeight: "600" }}>
//                     📍 Tap Map to Set Home
//                   </Text>
//                 </Pressable>
//               ) : (
//                 <View style={{ gap: 8, marginBottom: 8 }}>
//                   <Pressable
//                     style={{
//                       backgroundColor: pendingHome ? "#e67e22" : "#ccc",
//                       borderRadius: 12,
//                       paddingVertical: 12,
//                       alignItems: "center",
//                     }}
//                     onPress={() => pendingHome && saveHomeLocation(pendingHome)}
//                     disabled={!pendingHome || savingHome}
//                   >
//                     {savingHome ? (
//                       <ActivityIndicator color="#fff" />
//                     ) : (
//                       <Text style={{ color: "#fff", fontWeight: "600" }}>
//                         ✅ Confirm Home Location
//                       </Text>
//                     )}
//                   </Pressable>
//                   <Pressable
//                     style={{
//                       backgroundColor: "#f5f5f5",
//                       borderRadius: 12,
//                       paddingVertical: 12,
//                       alignItems: "center",
//                     }}
//                     onPress={() => {
//                       setMapMode("none");
//                       setPendingHome(null);
//                     }}
//                   >
//                     <Text style={{ color: "#666", fontWeight: "600" }}>Cancel</Text>
//                   </Pressable>
//                 </View>
//               )}
//             </View>

//             {/* ─── SAFE ZONE ─── */}
//             <View style={styles.radiusContainer}>
//               <Text style={{ fontWeight: "600" }}>Set Radius:</Text>
//               <Text style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
//                 Guardian is notified when user exits this zone
//               </Text>
//               <View style={styles.radiusButtons}>
//                 {[100, 300, 500, 1000].map((r) => (
//                   <Pressable
//                     key={r}
//                     onPress={() => setRadius(r)}
//                     style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]}
//                   >
//                     <Text>{r}m</Text>
//                   </Pressable>
//                 ))}
//               </View>
//               {mapMode !== "safeZone" ? (
//                 <Pressable
//                   style={styles.activateBtn}
//                   onPress={() => {
//                     setMapMode("safeZone");
//                     setSelectedCenter(null);
//                   }}
//                 >
//                   <Text style={{ color: "#fff" }}>Start Adding Safe Zone</Text>
//                 </Pressable>
//               ) : (
//                 <>
//                   <Pressable
//                     style={styles.activateBtn}
//                     onPress={activateSafeZone}
//                     disabled={!selectedCenter}
//                   >
//                     <Text style={{ color: "#fff" }}>Confirm Safe Zone</Text>
//                   </Pressable>
//                   <Pressable
//                     style={[styles.activateBtn, { backgroundColor: "gray", marginTop: 8 }]}
//                     onPress={() => {
//                       setMapMode("none");
//                       setSelectedCenter(null);
//                     }}
//                   >
//                     <Text style={{ color: "#fff" }}>Cancel</Text>
//                   </Pressable>
//                 </>
//               )}
//             </View>
//           </ScrollView>
//         </>
//       )}

//       {!loadingUser && linkedUsers.length === 0 && (
//         <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
//           <Text style={{ fontSize: 16, color: "#666", textAlign: "center" }}>
//             No linked users yet.{"\n"}Ask a user to add you as their guardian.
//           </Text>
//         </View>
//       )}
//     </SafeAreaView>
//   );
// }

// // ─── Map marker styles ────────────────────────────────────────────────────────
// const mapStyles = StyleSheet.create({
//   userDot: {
//     width: 20,
//     height: 20,
//     borderRadius: 10,
//     borderWidth: 2,
//     borderColor: "#fff",
//   },
//   pendingDot: {
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//     backgroundColor: "#3b82f6",
//     borderWidth: 2,
//     borderColor: "#fff",
//   },
// });

// // ─── Floating action button styles ───────────────────────────────────────────
// const fabStyles = StyleSheet.create({
//   container: {
//     position: "absolute",
//     top: 12,
//     right: 12,
//     gap: 8,
//   },
//   btn: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 6,
//     backgroundColor: "#16a34a",
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 24,
//     elevation: 4,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//   },
//   btnHome: { backgroundColor: "#e67e22" },
//   btnFollow: { backgroundColor: "#64748b" },
//   btnFollowActive: { backgroundColor: "#2563eb" },
//   btnDisabled: { backgroundColor: "#aaa", opacity: 0.6 },
//   icon: { fontSize: 16 },
//   label: { color: "#fff", fontWeight: "700", fontSize: 13 },
// });

// // ─── Alarm banner styles ──────────────────────────────────────────────────────
// const alarmBannerStyles = StyleSheet.create({
//   banner: {
//     marginHorizontal: 16,
//     marginBottom: 8,
//     borderRadius: 14,
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     elevation: 6,
//   },
//   bannerContent: { flexDirection: "row", alignItems: "center", gap: 10 },
//   bannerIcon: { fontSize: 28 },
//   bannerTitle: { color: "#fff", fontWeight: "800", fontSize: 15 },
//   bannerSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 },
//   dismissBtn: {
//     backgroundColor: "rgba(0,0,0,0.25)",
//     borderRadius: 8,
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//   },
//   dismissText: { color: "#fff", fontWeight: "700", fontSize: 12 },
// });

// import React, { useEffect, useRef, useState } from "react";
// import {
//   View,
//   Text,
//   Platform,
//   Alert,
//   ActivityIndicator,
//   ScrollView,
//   Animated,
//   Dimensions,
//   PanResponder,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import MapView from "react-native-maps";
// import { guardianStyles as styles } from "@/styles/guardian";

// import {
//   useGuardianState,
//   AlertModal,
//   AlarmBanner,
//   UserSelector,
//   GuardianMap,
//   StatusCard,
//   HomeLocationPanel,
//   SafeZonePanel,
// } from "@/components/guardian";

// const SCREEN_HEIGHT = Dimensions.get("window").height;

// export default function GuardianScreen() {
//   const mapRef = useRef<MapView>(null);

//   const [mapExpanded, setMapExpanded] = useState(false);

//   // 🔥 Animated height
//   const mapHeight = useRef(new Animated.Value(260)).current;

//   const {
//     linkedUsers,
//     selectedUser,
//     dropdownVisible,
//     setDropdownVisible,
//     selectUser,
//     loadingUser,

//     userLocation,
//     homeLocation,
//     lastUpdated,
//     isOutside,
//     isAwayFromHome,

//     mapMode,
//     setMapMode,
//     safeZones,
//     selectedCenter,
//     setSelectedCenter,
//     radius,
//     setRadius,
//     pendingHome,
//     setPendingHome,
//     isFollowing,
//     setIsFollowing,
//     hasInitialFit,

//     activateSafeZone,
//     saveHomeLocation,
//     savingHome,

//     alarm,
//     alertModal,
//     hideAlert,
//   } = useGuardianState();

//   // ─── Animate Map ─────────────────
//   const toggleMap = () => {
//     const toValue = mapExpanded ? 260 : SCREEN_HEIGHT - 120;

//     Animated.timing(mapHeight, {
//       toValue,
//       duration: 300,
//       useNativeDriver: false,
//     }).start();

//     setMapExpanded(!mapExpanded);
//   };

//   // 🔥 Swipe Down Gesture (MINIMIZE)
//   const panResponder = useRef(
//     PanResponder.create({
//       onMoveShouldSetPanResponder: (_, gesture) => {
//         return Math.abs(gesture.dy) > 10;
//       },
//       onPanResponderRelease: (_, gesture) => {
//         if (gesture.dy > 80 && mapExpanded) {
//           toggleMap(); // swipe down → minimize
//         }
//       },
//     })
//   ).current;

//   // ─── Initial map fit ─────────────────
//   useEffect(() => {
//     if (userLocation && mapRef.current && !hasInitialFit.current) {
//       hasInitialFit.current = true;

//       const coords = [userLocation];
//       if (homeLocation) coords.push(homeLocation);

//       mapRef.current.fitToCoordinates(coords, {
//         edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
//         animated: true,
//       });
//     }
//   }, [userLocation, homeLocation]);

//   // ─── Auto-follow ─────────────────
//   useEffect(() => {
//     if (!userLocation || !mapRef.current || !isFollowing) return;

//     mapRef.current.animateToRegion(
//       {
//         latitude: userLocation.latitude,
//         longitude: userLocation.longitude,
//         latitudeDelta: 0.01,
//         longitudeDelta: 0.01,
//       },
//       800
//     );
//   }, [userLocation, isFollowing]);

//   const locateUser = () => {
//     if (!userLocation || !mapRef.current) return;

//     mapRef.current.animateToRegion(
//       {
//         latitude: userLocation.latitude,
//         longitude: userLocation.longitude,
//         latitudeDelta: 0.01,
//         longitudeDelta: 0.01,
//       },
//       500
//     );
//   };

//   const setHomeAtUserLocation = () => {
//     if (!userLocation) {
//       Alert.alert("User location not available yet.");
//       return;
//     }

//     Alert.alert(
//       "Set Home",
//       `Set ${selectedUser?.name}'s current location as home?`,
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Confirm",
//           onPress: async () => {
//             await saveHomeLocation(userLocation);
//           },
//         },
//       ]
//     );
//   };

//   const handleMapPress = (e: any) => {
//     const { latitude, longitude } = e.nativeEvent.coordinate;

//     if (mapMode === "safeZone") {
//       setSelectedCenter({ latitude, longitude });
//     } else if (mapMode === "setHome") {
//       setPendingHome({ latitude, longitude });
//     }
//   };

//   const initialRegion = {
//     latitude:
//       userLocation?.latitude ??
//       homeLocation?.latitude ??
//       28.6139,
//     longitude:
//       userLocation?.longitude ??
//       homeLocation?.longitude ??
//       77.209,
//     latitudeDelta: 0.05,
//     longitudeDelta: 0.05,
//   };

//   return (
//     <SafeAreaView style={{ flex: 1 }}>
//       <Text style={styles.title}>Guardian View</Text>

//       <AlertModal alertModal={alertModal} onDismiss={hideAlert} />

//       <AlarmBanner
//         activeAlarm={alarm.activeAlarm}
//         alarmBgColor={alarm.alarmBgColor}
//         alarmIcon={alarm.alarmIcon}
//         alarmTitle={alarm.alarmTitle}
//         userName={selectedUser?.name ?? ""}
//         onDismiss={alarm.dismissAlarm}
//       />

//       <UserSelector
//         linkedUsers={linkedUsers}
//         selectedUser={selectedUser}
//         dropdownVisible={dropdownVisible}
//         onOpenDropdown={() => setDropdownVisible(true)}
//         onCloseDropdown={() => setDropdownVisible(false)}
//         onSelectUser={selectUser}
//       />

//       {loadingUser && (
//         <View style={{ alignItems: "center", padding: 20 }}>
//           <ActivityIndicator size="large" color="#16a34a" />
//         </View>
//       )}

//       {!loadingUser && selectedUser && Platform.OS !== "web" && (
//         <>
//           {/* 🔥 Animated Map */}
//           <Animated.View
//             style={{ height: mapHeight }}
//             {...panResponder.panHandlers}
//           >
//             <GuardianMap
//               mapRef={mapRef}
//               mapExpanded={mapExpanded}
//               onToggleExpand={toggleMap}
//               initialRegion={initialRegion}
//               userLocation={userLocation}
//               homeLocation={homeLocation}
//               pendingHome={pendingHome}
//               safeZones={safeZones}
//               selectedCenter={selectedCenter}
//               radius={radius}
//               mapMode={mapMode}
//               isOutside={isOutside}
//               isFollowing={isFollowing}
//               savingHome={savingHome}
//               selectedUserName={selectedUser.name}
//               onMapPress={handleMapPress}
//               onPanDrag={() => setIsFollowing(false)}
//               onToggleFollow={() => setIsFollowing(prev => !prev)}
//               onLocateUser={locateUser}
//               onSetHomeAtUserLocation={setHomeAtUserLocation}
//             />
//           </Animated.View>

//           {!mapExpanded && (
//             <>
//               <StatusCard
//                 userName={selectedUser.name}
//                 isOutside={isOutside}
//                 isAwayFromHome={isAwayFromHome}
//                 homeLocation={homeLocation}
//                 safeZonesCount={safeZones.length}
//                 lastUpdated={lastUpdated}
//               />

//               <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
//                 <HomeLocationPanel
//                   userName={selectedUser.name}
//                   mapMode={mapMode}
//                   pendingHome={pendingHome}
//                   savingHome={savingHome}
//                   onStartSetHome={() => {
//                     setMapMode("setHome");
//                     setPendingHome(null);
//                   }}
//                   onConfirmHome={() =>
//                     pendingHome && saveHomeLocation(pendingHome)
//                   }
//                   onCancel={() => {
//                     setMapMode("none");
//                     setPendingHome(null);
//                   }}
//                 />

//                 <SafeZonePanel
//                   mapMode={mapMode}
//                   radius={radius}
//                   selectedCenter={selectedCenter}
//                   onSetRadius={setRadius}
//                   onStartSafeZone={() => {
//                     setMapMode("safeZone");
//                     setSelectedCenter(null);
//                   }}
//                   onConfirmSafeZone={activateSafeZone}
//                   onCancel={() => {
//                     setMapMode("none");
//                     setSelectedCenter(null);
//                   }}
//                 />
//               </ScrollView>
//             </>
//           )}
//         </>
//       )}
//     </SafeAreaView>
//   );
// }


// import React, { useEffect, useRef, useState } from "react";
// import {
//   View,
//   Text,
//   Platform,
//   Alert,
//   ActivityIndicator,
//   ScrollView,
//   Animated,
//   Dimensions,
//   PanResponder,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import MapView from "react-native-maps";
// import { guardianStyles as styles } from "@/styles/guardian";

// import {
//   useGuardianState,
//   AlertModal,
//   AlarmBanner,
//   UserSelector,
//   GuardianMap,
//   StatusCard,
//   HomeLocationPanel,
//   SafeZonePanel,
// } from "@/components/guardian";

// const SCREEN_HEIGHT = Dimensions.get("window").height;

// export default function GuardianScreen() {
//   const mapRef = useRef<MapView>(null);
//   const [mapExpanded, setMapExpanded] = useState(false);
//   const mapHeight = useRef(new Animated.Value(260)).current;

//   const {
//     linkedUsers,
//     selectedUser,
//     dropdownVisible,
//     setDropdownVisible,
//     selectUser,
//     loadingUser,

//     userLocation,
//     homeLocation,
//     lastUpdated,
//     isOutside,
//     isAwayFromHome,

//     mapMode,
//     setMapMode,
//     safeZones,
//     selectedCenter,
//     setSelectedCenter,
//     radius,
//     setRadius,
//     pendingHome,
//     setPendingHome,
//     isFollowing,
//     setIsFollowing,
//     hasInitialFit,

//     activateSafeZone,
//     saveHomeLocation,
//     savingHome,

//     // ── edit/delete safe zones ──
//     editingZone,
//     editRadius,
//     setEditRadius,
//     editCenter,
//     setEditCenter,
//     savingZone,
//     startEditZone,
//     saveEditedZone,
//     deleteZone,
//     cancelEditZone,

//     alarm,
//     alertModal,
//     hideAlert,
//   } = useGuardianState();

//   // ─── Animate Map ──────────────────────────────────────────────────────────
//   const toggleMap = () => {
//     const toValue = mapExpanded ? 260 : SCREEN_HEIGHT - 120;
//     Animated.timing(mapHeight, {
//       toValue,
//       duration: 300,
//       useNativeDriver: false,
//     }).start();
//     setMapExpanded(!mapExpanded);
//   };

//   // ─── Swipe Down to Minimize ───────────────────────────────────────────────
//   const panResponder = useRef(
//     PanResponder.create({
//       onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 10,
//       onPanResponderRelease: (_, gesture) => {
//         if (gesture.dy > 80 && mapExpanded) toggleMap();
//       },
//     })
//   ).current;

//   // ─── Initial map fit ──────────────────────────────────────────────────────
//   useEffect(() => {
//     if (userLocation && mapRef.current && !hasInitialFit.current) {
//       hasInitialFit.current = true;
//       const coords = [userLocation];
//       if (homeLocation) coords.push(homeLocation);
//       mapRef.current.fitToCoordinates(coords, {
//         edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
//         animated: true,
//       });
//     }
//   }, [userLocation, homeLocation]);

//   // ─── Auto-follow ──────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!userLocation || !mapRef.current || !isFollowing) return;
//     mapRef.current.animateToRegion(
//       {
//         latitude: userLocation.latitude,
//         longitude: userLocation.longitude,
//         latitudeDelta: 0.01,
//         longitudeDelta: 0.01,
//       },
//       800
//     );
//   }, [userLocation, isFollowing]);

//   const locateUser = () => {
//     if (!userLocation || !mapRef.current) return;
//     mapRef.current.animateToRegion(
//       {
//         latitude: userLocation.latitude,
//         longitude: userLocation.longitude,
//         latitudeDelta: 0.01,
//         longitudeDelta: 0.01,
//       },
//       500
//     );
//   };

//   const setHomeAtUserLocation = () => {
//     if (!userLocation) {
//       Alert.alert("User location not available yet.");
//       return;
//     }
//     Alert.alert(
//       "Set Home",
//       `Set ${selectedUser?.name}'s current location as home?`,
//       [
//         { text: "Cancel", style: "cancel" },
//         { text: "Confirm", onPress: async () => await saveHomeLocation(userLocation) },
//       ]
//     );
//   };

//   // ─── Map press handler ────────────────────────────────────────────────────
//   const handleMapPress = (e: any) => {
//     const { latitude, longitude } = e.nativeEvent.coordinate;
//     if (mapMode === "safeZone") {
//       setSelectedCenter({ latitude, longitude });
//     } else if (mapMode === "setHome") {
//       setPendingHome({ latitude, longitude });
//     } else if (mapMode === "editSafeZone") {
//       // Update the edit center when user taps map
//       setEditCenter({ latitude, longitude });
//     }
//   };

//   const initialRegion = {
//     latitude: userLocation?.latitude ?? homeLocation?.latitude ?? 28.6139,
//     longitude: userLocation?.longitude ?? homeLocation?.longitude ?? 77.209,
//     latitudeDelta: 0.05,
//     longitudeDelta: 0.05,
//   };

//   return (
//     <SafeAreaView style={{ flex: 1 }}>
//       <Text style={styles.title}>Guardian View</Text>

//       <AlertModal alertModal={alertModal} onDismiss={hideAlert} />

//       <AlarmBanner
//         activeAlarm={alarm.activeAlarm}
//         alarmBgColor={alarm.alarmBgColor}
//         alarmIcon={alarm.alarmIcon}
//         alarmTitle={alarm.alarmTitle}
//         userName={selectedUser?.name ?? ""}
//         onDismiss={alarm.dismissAlarm}
//       />

//       <UserSelector
//         linkedUsers={linkedUsers}
//         selectedUser={selectedUser}
//         dropdownVisible={dropdownVisible}
//         onOpenDropdown={() => setDropdownVisible(true)}
//         onCloseDropdown={() => setDropdownVisible(false)}
//         onSelectUser={selectUser}
//       />

//       {loadingUser && (
//         <View style={{ alignItems: "center", padding: 20 }}>
//           <ActivityIndicator size="large" color="#16a34a" />
//         </View>
//       )}

//       {!loadingUser && selectedUser && Platform.OS !== "web" && (
//         <>
//           {/* ── Animated Map ── */}
//           <Animated.View
//             style={{ height: mapHeight }}
//             {...panResponder.panHandlers}
//           >
//             <GuardianMap
//               mapRef={mapRef}
//               mapExpanded={mapExpanded}
//               onToggleExpand={toggleMap}
//               initialRegion={initialRegion}
//               userLocation={userLocation}
//               homeLocation={homeLocation}
//               pendingHome={pendingHome}
//               safeZones={safeZones}
//               selectedCenter={selectedCenter}
//               radius={radius}
//               mapMode={mapMode}
//               isOutside={isOutside}
//               isFollowing={isFollowing}
//               savingHome={savingHome}
//               selectedUserName={selectedUser.name}
//               editingZone={editingZone}
//               editCenter={editCenter}
//               editRadius={editRadius}
//               onMapPress={handleMapPress}
//               onPanDrag={() => setIsFollowing(false)}
//               onToggleFollow={() => setIsFollowing(prev => !prev)}
//               onLocateUser={locateUser}
//               onSetHomeAtUserLocation={setHomeAtUserLocation}
//               onEditZone={startEditZone}
//             />
//           </Animated.View>

//           {!mapExpanded && (
//             <>
//               <StatusCard
//                 userName={selectedUser.name}
//                 isOutside={isOutside}
//                 isAwayFromHome={isAwayFromHome}
//                 homeLocation={homeLocation}
//                 safeZonesCount={safeZones.length}
//                 lastUpdated={lastUpdated}
//               />

//               <ScrollView
//                 contentContainerStyle={{ paddingBottom: 20 }}
//                 // ✅ Fix: allow ScrollView to scroll independently of map
//                 nestedScrollEnabled={true}
//               >
//                 <HomeLocationPanel
//                   userName={selectedUser.name}
//                   mapMode={mapMode}
//                   pendingHome={pendingHome}
//                   savingHome={savingHome}
//                   onStartSetHome={() => {
//                     setMapMode("setHome");
//                     setPendingHome(null);
//                   }}
//                   onConfirmHome={() => pendingHome && saveHomeLocation(pendingHome)}
//                   onCancel={() => {
//                     setMapMode("none");
//                     setPendingHome(null);
//                   }}
//                 />

//                 <SafeZonePanel
//                   mapMode={mapMode}
//                   radius={radius}
//                   selectedCenter={selectedCenter}
//                   onSetRadius={setRadius}
//                   onStartSafeZone={() => {
//                     setMapMode("safeZone");
//                     setSelectedCenter(null);
//                   }}
//                   onConfirmSafeZone={activateSafeZone}
//                   onCancel={() => {
//                     setMapMode("none");
//                     setSelectedCenter(null);
//                   }}
//                   // ── edit/delete props ──
//                   safeZones={safeZones}
//                   onEditZone={startEditZone}
//                   onDeleteZone={deleteZone}
//                   editingZone={editingZone}
//                   editRadius={editRadius}
//                   editCenter={editCenter}
//                   savingZone={savingZone}
//                   onSetEditRadius={setEditRadius}
//                   onSaveEdit={saveEditedZone}
//                   onCancelEdit={cancelEditZone}
//                 />
//               </ScrollView>
//             </>
//           )}
//         </>
//       )}
//     </SafeAreaView>
//   );
// }






















  // import React, { useEffect, useRef, useState } from "react";
  // import {
  //   View,
  //   Text,
  //   Platform,
  //   Alert,
  //   ActivityIndicator,
  //   ScrollView,
  //   Animated,
  //   Dimensions,
  //   PanResponder,
  //   StyleSheet,
  // } from "react-native";
  // import { SafeAreaView } from "react-native-safe-area-context";
  // import MapView from "react-native-maps";
  // import { guardianStyles as styles } from "@/styles/guardian";

  // import {
  //   useGuardianState,
  //   AlertModal,
  //   AlarmBanner,
  //   UserSelector,
  //   GuardianMap,
  //   StatusCard,
  //   HomeLocationPanel,
  //   SafeZonePanel,
  // } from "@/components/guardian";

  // const SCREEN_HEIGHT = Dimensions.get("window").height;

  // export default function GuardianScreen() {
  //   const mapRef = useRef<MapView>(null);
  //   const [mapExpanded, setMapExpanded] = useState(false);
  //   const mapHeight = useRef(new Animated.Value(260)).current;

  //   const {
  //     linkedUsers,
  //     selectedUser,
  //     dropdownVisible,
  //     setDropdownVisible,
  //     selectUser,
  //     loadingUser,

  //     userLocation,
  //     homeLocation,
  //     lastUpdated,
  //     isOutside,
  //     isAwayFromHome,

  //     mapMode,
  //     setMapMode,
  //     safeZones,
  //     selectedCenter,
  //     setSelectedCenter,
  //     radius,
  //     setRadius,
  //     pendingHome,
  //     setPendingHome,
  //     isFollowing,
  //     setIsFollowing,
  //     hasInitialFit,

  //     activateSafeZone,
  //     saveHomeLocation,
  //     savingHome,

  //     editingZone,
  //     editRadius,
  //     setEditRadius,
  //     editCenter,
  //     setEditCenter,
  //     savingZone,
  //     startEditZone,
  //     saveEditedZone,
  //     deleteZone,
  //     cancelEditZone,

  //     alarm,
  //     alertModal,
  //     hideAlert,
  //   } = useGuardianState();

  //   // ─── Animate Map ──────────────────────────────────────────────────────────
  //   const toggleMap = () => {
  //     const toValue = mapExpanded ? 260 : SCREEN_HEIGHT - 120;
  //     Animated.timing(mapHeight, {
  //       toValue,
  //       duration: 300,
  //       useNativeDriver: false,
  //     }).start();
  //     setMapExpanded(!mapExpanded);
  //   };

  //   // ✅ Fix: PanResponder ONLY on the drag handle bar, NOT wrapping the map
  //   const panResponder = useRef(
  //     PanResponder.create({
  //       onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 10,
  //       onPanResponderRelease: (_, gesture) => {
  //         if (gesture.dy > 60 && mapExpanded) toggleMap();      // swipe down → minimize
  //         else if (gesture.dy < -60 && !mapExpanded) toggleMap(); // swipe up → expand
  //       },
  //     })
  //   ).current;

  //   // ─── Initial map fit ──────────────────────────────────────────────────────
  //   useEffect(() => {
  //     if (userLocation && mapRef.current && !hasInitialFit.current) {
  //       hasInitialFit.current = true;
  //       const coords = [userLocation];
  //       if (homeLocation) coords.push(homeLocation);
  //       mapRef.current.fitToCoordinates(coords, {
  //         edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
  //         animated: true,
  //       });
  //     }
  //   }, [userLocation, homeLocation]);

  //   // ─── Auto-follow ──────────────────────────────────────────────────────────
  //   useEffect(() => {
  //     if (!userLocation || !mapRef.current || !isFollowing) return;
  //     mapRef.current.animateToRegion(
  //       {
  //         latitude: userLocation.latitude,
  //         longitude: userLocation.longitude,
  //         latitudeDelta: 0.01,
  //         longitudeDelta: 0.01,
  //       },
  //       800
  //     );
  //   }, [userLocation, isFollowing]);

  //   const locateUser = () => {
  //     if (!userLocation || !mapRef.current) return;
  //     mapRef.current.animateToRegion(
  //       {
  //         latitude: userLocation.latitude,
  //         longitude: userLocation.longitude,
  //         latitudeDelta: 0.01,
  //         longitudeDelta: 0.01,
  //       },
  //       500
  //     );
  //   };

  //   const setHomeAtUserLocation = () => {
  //     if (!userLocation) {
  //       Alert.alert("User location not available yet.");
  //       return;
  //     }
  //     Alert.alert(
  //       "Set Home",
  //       `Set ${selectedUser?.name}'s current location as home?`,
  //       [
  //         { text: "Cancel", style: "cancel" },
  //         { text: "Confirm", onPress: async () => await saveHomeLocation(userLocation) },
  //       ]
  //     );
  //   };

  //   // ─── Map press handler ────────────────────────────────────────────────────
  //   const handleMapPress = (e: any) => {
  //     const { latitude, longitude } = e.nativeEvent.coordinate;
  //     if (mapMode === "safeZone") {
  //       setSelectedCenter({ latitude, longitude });
  //     } else if (mapMode === "setHome") {
  //       setPendingHome({ latitude, longitude });
  //     } else if (mapMode === "editSafeZone") {
  //       setEditCenter({ latitude, longitude });
  //     }
  //   };

  //   const initialRegion = {
  //     latitude: userLocation?.latitude ?? homeLocation?.latitude ?? 28.6139,
  //     longitude: userLocation?.longitude ?? homeLocation?.longitude ?? 77.209,
  //     latitudeDelta: 0.05,
  //     longitudeDelta: 0.05,
  //   };

  //   return (
  //     <SafeAreaView style={{ flex: 1 }}>
  //       <Text style={styles.title}>Guardian View</Text>

  //       <AlertModal alertModal={alertModal} onDismiss={hideAlert} />

  //       <AlarmBanner
  //         activeAlarm={alarm.activeAlarm}
  //         alarmBgColor={alarm.alarmBgColor}
  //         alarmIcon={alarm.alarmIcon}
  //         alarmTitle={alarm.alarmTitle}
  //         userName={selectedUser?.name ?? ""}
  //         onDismiss={alarm.dismissAlarm}
  //       />

  //       <UserSelector
  //         linkedUsers={linkedUsers}
  //         selectedUser={selectedUser}
  //         dropdownVisible={dropdownVisible}
  //         onOpenDropdown={() => setDropdownVisible(true)}
  //         onCloseDropdown={() => setDropdownVisible(false)}
  //         onSelectUser={selectUser}
  //       />

  //       {loadingUser && (
  //         <View style={{ alignItems: "center", padding: 20 }}>
  //           <ActivityIndicator size="large" color="#16a34a" />
  //         </View>
  //       )}

  //       {!loadingUser && selectedUser && Platform.OS !== "web" && (
  //         <>
  //           {/* ✅ Fix: Animated.View has NO panHandlers — map scrolls freely */}
  //           <Animated.View style={{ height: mapHeight }}>

  //             {/* ✅ Drag handle — ONLY this area responds to swipe up/down */}
  //             <View
  //               style={localStyles.dragHandle}
  //               {...panResponder.panHandlers}
  //             >
  //               <View style={localStyles.dragHandleBar} />
  //             </View>

  //             <GuardianMap
  //               mapRef={mapRef}
  //               mapExpanded={mapExpanded}
  //               onToggleExpand={toggleMap}
  //               initialRegion={initialRegion}
  //               userLocation={userLocation}
  //               homeLocation={homeLocation}
  //               pendingHome={pendingHome}
  //               safeZones={safeZones}
  //               selectedCenter={selectedCenter}
  //               radius={radius}
  //               mapMode={mapMode}
  //               isOutside={isOutside}
  //               isFollowing={isFollowing}
  //               savingHome={savingHome}
  //               selectedUserName={selectedUser.name}
  //               editingZone={editingZone}
  //               editCenter={editCenter}
  //               editRadius={editRadius}
  //               onMapPress={handleMapPress}
  //               onPanDrag={() => setIsFollowing(false)}
  //               onToggleFollow={() => setIsFollowing(prev => !prev)}
  //               onLocateUser={locateUser}
  //               onSetHomeAtUserLocation={setHomeAtUserLocation}
  //               onEditZone={startEditZone}
  //             />
  //           </Animated.View>

  //           {!mapExpanded && (
  //             <>
  //               <StatusCard
  //                 userName={selectedUser.name}
  //                 isOutside={isOutside}
  //                 isAwayFromHome={isAwayFromHome}
  //                 homeLocation={homeLocation}
  //                 safeZonesCount={safeZones.length}
  //                 lastUpdated={lastUpdated}
  //               />

  //               <ScrollView
  //                 contentContainerStyle={{ paddingBottom: 20 }}
  //                 nestedScrollEnabled={true}
  //               >
  //                 <HomeLocationPanel
  //                   userName={selectedUser.name}
  //                   mapMode={mapMode}
  //                   pendingHome={pendingHome}
  //                   savingHome={savingHome}
  //                   onStartSetHome={() => {
  //                     setMapMode("setHome");
  //                     setPendingHome(null);
  //                   }}
  //                   onConfirmHome={() => pendingHome && saveHomeLocation(pendingHome)}
  //                   onCancel={() => {
  //                     setMapMode("none");
  //                     setPendingHome(null);
  //                   }}
  //                 />

  //                 <SafeZonePanel
  //                   mapMode={mapMode}
  //                   radius={radius}
  //                   selectedCenter={selectedCenter}
  //                   onSetRadius={setRadius}
  //                   onStartSafeZone={() => {
  //                     setMapMode("safeZone");
  //                     setSelectedCenter(null);
  //                   }}
  //                   onConfirmSafeZone={activateSafeZone}
  //                   onCancel={() => {
  //                     setMapMode("none");
  //                     setSelectedCenter(null);
  //                   }}
  //                   safeZones={safeZones}
  //                   onEditZone={startEditZone}
  //                   onDeleteZone={deleteZone}
  //                   editingZone={editingZone}
  //                   editRadius={editRadius}
  //                   editCenter={editCenter}
  //                   savingZone={savingZone}
  //                   onSetEditRadius={setEditRadius}
  //                   onSaveEdit={saveEditedZone}
  //                   onCancelEdit={cancelEditZone}
  //                 />
  //               </ScrollView>
  //             </>
  //           )}
  //         </>
  //       )}
  //     </SafeAreaView>
  //   );
  // }

  // const localStyles = StyleSheet.create({
  //   dragHandle: {
  //     height: 20,
  //     alignItems: "center",
  //     justifyContent: "center",
  //     backgroundColor: "transparent",
  //     zIndex: 10,
  //   },
  //   dragHandleBar: {
  //     width: 40,
  //     height: 4,
  //     borderRadius: 2,
  //     backgroundColor: "#d1d5db",
  //   },
  // });

  // import React, { useEffect, useRef, useCallback, useMemo } from "react";
  // import {
  //   View,
  //   Text,
  //   Platform,
  //   Alert,
  //   ActivityIndicator,
  //   StyleSheet,
  // } from "react-native";
  // import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
  // import MapView from "react-native-maps";
  // import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
  // import { GestureHandlerRootView } from "react-native-gesture-handler";

  // import { guardianStyles as styles } from "@/styles/guardian";
  // import {
  //   useGuardianState,
  //   AlertModal,
  //   AlarmBanner,
  //   UserSelector,
  //   GuardianMap,
  //   StatusCard,
  //   HomeLocationPanel,
  //   SafeZonePanel,
  // } from "@/components/guardian";

  // const SNAP_POINTS = [80, "28%", "52%", "92%"];
  // const SNAP = { COLLAPSED: 0, PEEK: 1, HALF: 2, FULL: 3 };

  // const TOP_OVERLAY_CONTENT_HEIGHT = 138;

  // export default function GuardianScreen() {
  //   const mapRef = useRef<MapView>(null);
  //   const bottomSheetRef = useRef<BottomSheet>(null);
  //   const snapPoints = useMemo(() => SNAP_POINTS, []);

  //   const insets = useSafeAreaInsets();

  //   const {
  //     linkedUsers,
  //     selectedUser,
  //     dropdownVisible,
  //     setDropdownVisible,
  //     selectUser,
  //     loadingUser,

  //     userLocation,
  //     homeLocation,
  //     lastUpdated,
  //     isOutside,
  //     isAwayFromHome,

  //     mapMode,
  //     setMapMode,
  //     safeZones,
  //     selectedCenter,
  //     setSelectedCenter,
  //     radius,
  //     setRadius,
  //     pendingHome,
  //     setPendingHome,
  //     isFollowing,
  //     setIsFollowing,
  //     hasInitialFit,

  //     activateSafeZone,
  //     saveHomeLocation,
  //     savingHome,

  //     editingZone,
  //     editRadius,
  //     setEditRadius,
  //     editCenter,
  //     setEditCenter,
  //     savingZone,
  //     startEditZone,
  //     saveEditedZone,
  //     deleteZone,
  //     cancelEditZone,

  //     alarm,
  //     alertModal,
  //     hideAlert,
  //   } = useGuardianState();

  //   // ─── Initial map fit ────────────────────────────────────────────────────────
  //   useEffect(() => {
  //     if (userLocation && mapRef.current && !hasInitialFit.current) {
  //       hasInitialFit.current = true;
  //       const coords = [userLocation];
  //       if (homeLocation) coords.push(homeLocation);
  //       mapRef.current.fitToCoordinates(coords, {
  //         edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
  //         animated: true,
  //       });
  //     }
  //   }, [userLocation, homeLocation]);

  //   // ─── Auto-follow ────────────────────────────────────────────────────────────
  //   useEffect(() => {
  //     if (!userLocation || !mapRef.current || !isFollowing) return;
  //     mapRef.current.animateToRegion(
  //       {
  //         latitude: userLocation.latitude,
  //         longitude: userLocation.longitude,
  //         latitudeDelta: 0.01,
  //         longitudeDelta: 0.01,
  //       },
  //       800
  //     );
  //   }, [userLocation, isFollowing]);

  //   // ─── Go to user ─────────────────────────────────────────────────────────────
  //   const locateUser = useCallback(() => {
  //     if (!userLocation || !mapRef.current) return;
  //     bottomSheetRef.current?.snapToIndex(SNAP.PEEK);
  //     mapRef.current.animateToRegion(
  //       {
  //         latitude: userLocation.latitude,
  //         longitude: userLocation.longitude,
  //         latitudeDelta: 0.01,
  //         longitudeDelta: 0.01,
  //       },
  //       500
  //     );
  //   }, [userLocation]);

  //   // ─── Set home at user location ──────────────────────────────────────────────
  //   const setHomeAtUserLocation = useCallback(() => {
  //     if (!userLocation) {
  //       Alert.alert("User location not available yet.");
  //       return;
  //     }
  //     Alert.alert(
  //       "Set Home",
  //       `Set ${selectedUser?.name}'s current location as home?`,
  //       [
  //         { text: "Cancel", style: "cancel" },
  //         {
  //           text: "Confirm",
  //           onPress: async () => await saveHomeLocation(userLocation),
  //         },
  //       ]
  //     );
  //   }, [userLocation, selectedUser, saveHomeLocation]);

  //   // ─── Map press ──────────────────────────────────────────────────────────────
  //   const handleMapPress = useCallback(
  //     (e: any) => {
  //       const { latitude, longitude } = e.nativeEvent.coordinate;
  //       if (mapMode === "safeZone") setSelectedCenter({ latitude, longitude });
  //       else if (mapMode === "setHome") setPendingHome({ latitude, longitude });
  //       else if (mapMode === "editSafeZone") setEditCenter({ latitude, longitude });
  //     },
  //     [mapMode, setSelectedCenter, setPendingHome, setEditCenter]
  //   );

  //   // ─── Safe zone / set home modes ─────────────────────────────────────────────
  //   const startSafeZoneMode = useCallback(() => {
  //     setMapMode("safeZone");
  //     setSelectedCenter(null);
  //     bottomSheetRef.current?.snapToIndex(SNAP.PEEK);
  //   }, [setMapMode, setSelectedCenter]);

  //   const startSetHomeMode = useCallback(() => {
  //     setMapMode("setHome");
  //     setPendingHome(null);
  //     bottomSheetRef.current?.snapToIndex(SNAP.PEEK);
  //   }, [setMapMode, setPendingHome]);

  //   const initialRegion = {
  //     latitude: userLocation?.latitude ?? homeLocation?.latitude ?? 28.6139,
  //     longitude: userLocation?.longitude ?? homeLocation?.longitude ?? 77.209,
  //     latitudeDelta: 0.05,
  //     longitudeDelta: 0.05,
  //   };

  //   const fabTopOffset = insets.top + TOP_OVERLAY_CONTENT_HEIGHT;

  //   return (
  //     <GestureHandlerRootView style={{ flex: 1 }}>
  //       <SafeAreaView style={{ flex: 1 }} edges={[]}>

  //         {/* ── Full-screen map ── */}
  //         {!loadingUser && selectedUser && Platform.OS !== "web" && (
  //           <View style={StyleSheet.absoluteFill}>
  //             <GuardianMap
  //               mapRef={mapRef}
  //               initialRegion={initialRegion}
  //               userLocation={userLocation}
  //               homeLocation={homeLocation}
  //               pendingHome={pendingHome}
  //               safeZones={safeZones}
  //               selectedCenter={selectedCenter}
  //               radius={radius}
  //               mapMode={mapMode}
  //               isOutside={isOutside}
  //               isFollowing={isFollowing}
  //               savingHome={savingHome}
  //               selectedUserName={selectedUser.name}
  //               editingZone={editingZone}
  //               editCenter={editCenter}
  //               editRadius={editRadius}
  //               onMapPress={handleMapPress}
  //               onPanDrag={() => setIsFollowing(false)}
  //               onToggleFollow={() => setIsFollowing((prev) => !prev)}
  //               onLocateUser={locateUser}
  //               onSetHomeAtUserLocation={setHomeAtUserLocation}
  //               onEditZone={startEditZone}
  //               fabTopOffset={fabTopOffset}
  //             />
  //           </View>
  //         )}

  //         {/* ── Top overlay ── */}
  //         <View
  //           style={[localStyles.topOverlay, { paddingTop: insets.top + 8 }]}
  //           pointerEvents="box-none"
  //         >
  //           <Text style={[styles.title, localStyles.titleText]}>
  //             Guardian View
  //           </Text>

  //           <AlertModal alertModal={alertModal} onDismiss={hideAlert} />

  //           <AlarmBanner
  //             activeAlarm={alarm.activeAlarm}
  //             alarmBgColor={alarm.alarmBgColor}
  //             alarmIcon={alarm.alarmIcon}
  //             alarmTitle={alarm.alarmTitle}
  //             userName={selectedUser?.name ?? ""}
  //             onDismiss={alarm.dismissAlarm}
  //           />

  //           <UserSelector
  //             linkedUsers={linkedUsers}
  //             selectedUser={selectedUser}
  //             dropdownVisible={dropdownVisible}
  //             onOpenDropdown={() => setDropdownVisible(true)}
  //             onCloseDropdown={() => setDropdownVisible(false)}
  //             onSelectUser={selectUser}
  //           />

  //           {loadingUser && (
  //             <View style={{ alignItems: "center", padding: 20 }}>
  //               <ActivityIndicator size="large" color="#16a34a" />
  //             </View>
  //           )}
  //         </View>

  //         {/* ── Bottom Sheet ── */}
  //         {!loadingUser && selectedUser && Platform.OS !== "web" && (
  //           <BottomSheet
  //             ref={bottomSheetRef}
  //             index={SNAP.PEEK}
  //             snapPoints={snapPoints}
  //             handleComponent={CustomHandle}
  //             backgroundStyle={localStyles.sheetBackground}
  //             enableContentPanningGesture={true}
  //             enableHandlePanningGesture={true}
  //             style={{ zIndex: 20 }}
  //           >
  //             <BottomSheetScrollView
  //               contentContainerStyle={[
  //                 localStyles.sheetContent,
  //                 { paddingBottom: insets.bottom + 80 },
  //               ]}
  //             >
  //               <StatusCard
  //                 userName={selectedUser.name}
  //                 isOutside={isOutside}
  //                 isAwayFromHome={isAwayFromHome}
  //                 homeLocation={homeLocation}
  //                 safeZonesCount={safeZones.length}
  //                 lastUpdated={lastUpdated}
  //               />

  //               <HomeLocationPanel
  //                 userName={selectedUser.name}
  //                 mapMode={mapMode}
  //                 pendingHome={pendingHome}
  //                 savingHome={savingHome}
  //                 onStartSetHome={startSetHomeMode}
  //                 onConfirmHome={() =>
  //                   pendingHome && saveHomeLocation(pendingHome)
  //                 }
  //                 onCancel={() => {
  //                   setMapMode("none");
  //                   setPendingHome(null);
  //                 }}
  //               />

  //               <SafeZonePanel
  //                 mapMode={mapMode}
  //                 radius={radius}
  //                 selectedCenter={selectedCenter}
  //                 onSetRadius={setRadius}
  //                 onStartSafeZone={startSafeZoneMode}
  //                 onConfirmSafeZone={activateSafeZone}
  //                 onCancel={() => {
  //                   setMapMode("none");
  //                   setSelectedCenter(null);
  //                 }}
  //                 safeZones={safeZones}
  //                 onEditZone={startEditZone}
  //                 onDeleteZone={deleteZone}
  //                 editingZone={editingZone}
  //                 editRadius={editRadius}
  //                 editCenter={editCenter}
  //                 savingZone={savingZone}
  //                 onSetEditRadius={setEditRadius}
  //                 onSaveEdit={saveEditedZone}
  //                 onCancelEdit={cancelEditZone}
  //               />
  //             </BottomSheetScrollView>
  //           </BottomSheet>
  //         )}
  //       </SafeAreaView>
  //     </GestureHandlerRootView>
  //   );
  // }

  // function CustomHandle() {
  //   return (
  //     <View style={localStyles.handleContainer}>
  //       <View style={localStyles.handleBar} />
  //     </View>
  //   );
  // }

  // const localStyles = StyleSheet.create({
  //   topOverlay: {
  //     position: "absolute",
  //     top: 0,
  //     left: 0,
  //     right: 0,
  //     zIndex: 10,
  //     backgroundColor: "rgba(255,255,255,0.93)",
  //     paddingBottom: 10,
  //     paddingHorizontal: 12,
  //   },
  //   titleText: {
  //     marginBottom: 4,
  //   },
  //   sheetBackground: {
  //     backgroundColor: "#ffffff",
  //     borderTopLeftRadius: 16,
  //     borderTopRightRadius: 16,
  //     shadowColor: "#000",
  //     shadowOffset: { width: 0, height: -3 },
  //     shadowOpacity: 0.08,
  //     shadowRadius: 8,
  //     elevation: 12,
  //   },
  //   sheetContent: {
  //     paddingHorizontal: 16,
  //     paddingTop: 4,
  //   },
  //   handleContainer: {
  //     height: 24,
  //     alignItems: "center",
  //     justifyContent: "center",
  //     borderTopLeftRadius: 16,
  //     borderTopRightRadius: 16,
  //     backgroundColor: "#ffffff",
  //   },
  //   handleBar: {
  //     width: 40,
  //     height: 4,
  //     borderRadius: 2,
  //     backgroundColor: "#d1d5db",
  //   },
  // });


import React, { useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Platform,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MapView from "react-native-maps";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { guardianStyles as styles } from "@/styles/guardian";
import {
  useGuardianState,
  AlertModal,
  AlarmBanner,
  UserSelector,
  GuardianMap,
  HomeLocationPanel,
  SafeZonePanel,
} from "@/components/guardian";

const SNAP_POINTS = [80, "28%", "52%", "92%"];
const SNAP = { COLLAPSED: 0, PEEK: 1, HALF: 2, FULL: 3 };
const TOP_OVERLAY_CONTENT_HEIGHT = 138;

const hasHome = true; // or false (replace later with real data)

export default function GuardianScreen() {
  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => SNAP_POINTS, []);
  const insets = useSafeAreaInsets();

  const {
    linkedUsers,
    selectedUser,
    dropdownVisible,
    setDropdownVisible,
    selectUser,
    loadingUser,
    userLocation,
    homeLocation,
    lastUpdated,
    isOutside,
    isAwayFromHome,
    mapMode,
    setMapMode,
    safeZones,
    selectedCenter,
    setSelectedCenter,
    radius,
    setRadius,
    pendingHome,
    setPendingHome,
    isFollowing,
    setIsFollowing,
    hasInitialFit,
    activateSafeZone,
    saveHomeLocation,
    savingHome,
    editingZone,
    editRadius,
    setEditRadius,
    editCenter,
    setEditCenter,
    savingZone,
    startEditZone,
    saveEditedZone,
    deleteZone,
    cancelEditZone,
    alarm,
    alertModal,
    hideAlert,
  } = useGuardianState();

  // ─── Initial map fit ────────────────────────────────────────────────────────
  useEffect(() => {
    if (userLocation && mapRef.current && !hasInitialFit.current) {
      hasInitialFit.current = true;
      const coords = [userLocation];
      if (homeLocation) coords.push(homeLocation);
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
        animated: true,
      });
    }
  }, [userLocation, homeLocation]);

  // ─── Auto-follow ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userLocation || !mapRef.current || !isFollowing) return;
    mapRef.current.animateToRegion(
      {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      800
    );
  }, [userLocation, isFollowing]);

  // ─── Go to user ─────────────────────────────────────────────────────────────
  const locateUser = useCallback(() => {
    if (!userLocation || !mapRef.current) return;
    bottomSheetRef.current?.snapToIndex(SNAP.PEEK);
    mapRef.current.animateToRegion(
      {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      500
    );
  }, [userLocation]);

  // ─── Set home at user location ──────────────────────────────────────────────
  const setHomeAtUserLocation = useCallback(() => {
    if (!userLocation) {
      Alert.alert("User location not available yet.");
      return;
    }
    Alert.alert(
      "Set Home",
      `Set ${selectedUser?.name}'s current location as home?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => await saveHomeLocation(userLocation),
        },
      ]
    );
  }, [userLocation, selectedUser, saveHomeLocation]);

  // ─── Map press ──────────────────────────────────────────────────────────────
  const handleMapPress = useCallback(
    (e: any) => {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      if (mapMode === "safeZone") setSelectedCenter({ latitude, longitude });
      else if (mapMode === "setHome") setPendingHome({ latitude, longitude });
      else if (mapMode === "editSafeZone") setEditCenter({ latitude, longitude });
    },
    [mapMode, setSelectedCenter, setPendingHome, setEditCenter]
  );

  // ─── Safe zone / set home modes ─────────────────────────────────────────────
  const startSafeZoneMode = useCallback(() => {
    setMapMode("safeZone");
    setSelectedCenter(null);
    bottomSheetRef.current?.snapToIndex(SNAP.PEEK);
  }, [setMapMode, setSelectedCenter]);

  const startSetHomeMode = useCallback(() => {
    setMapMode("setHome");
    setPendingHome(null);
    bottomSheetRef.current?.snapToIndex(SNAP.PEEK);
  }, [setMapMode, setPendingHome]);

  const initialRegion = {
    latitude: userLocation?.latitude ?? homeLocation?.latitude ?? 28.6139,
    longitude: userLocation?.longitude ?? homeLocation?.longitude ?? 77.209,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const fabTopOffset = insets.top + TOP_OVERLAY_CONTENT_HEIGHT;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={[]}>
        {/* ── Full-screen map ── */}
        {!loadingUser && selectedUser && Platform.OS !== "web" && (
          <View style={StyleSheet.absoluteFill}>
            <GuardianMap
              mapRef={mapRef}
              initialRegion={initialRegion}
              userLocation={userLocation}
              homeLocation={homeLocation}
              pendingHome={pendingHome}
              safeZones={safeZones}
              selectedCenter={selectedCenter}
              radius={radius}
              mapMode={mapMode}
              isOutside={isOutside}
              isFollowing={isFollowing}
              savingHome={savingHome}
              selectedUserName={selectedUser.name}
              editingZone={editingZone}
              editCenter={editCenter}
              editRadius={editRadius}
              onMapPress={handleMapPress}
              onPanDrag={() => setIsFollowing(false)}
              onToggleFollow={() => setIsFollowing((prev) => !prev)}
              onLocateUser={locateUser}
              onSetHomeAtUserLocation={setHomeAtUserLocation}
              onEditZone={startEditZone}
              fabTopOffset={fabTopOffset}
            />
          </View>
        )}

        {/* ── Top overlay ── */}
        <View
          style={[localStyles.topOverlay, { paddingTop: insets.top + 8 }]}
          pointerEvents="box-none"
        >
          <Text style={[styles.title, localStyles.titleText]}>
            Guardian View
          </Text>
          <AlertModal alertModal={alertModal} onDismiss={hideAlert} />
          <AlarmBanner
            activeAlarm={alarm.activeAlarm}
            alarmBgColor={alarm.alarmBgColor}
            alarmIcon={alarm.alarmIcon}
            alarmTitle={alarm.alarmTitle}
            userName={selectedUser?.name ?? ""}
            onDismiss={alarm.dismissAlarm}
          />
          <UserSelector
            linkedUsers={linkedUsers}
            selectedUser={selectedUser}
            dropdownVisible={dropdownVisible}
            onOpenDropdown={() => setDropdownVisible(true)}
            onCloseDropdown={() => setDropdownVisible(false)}
            onSelectUser={selectUser}
          />
          {loadingUser && (
            <View style={{ alignItems: "center", padding: 20 }}>
              <ActivityIndicator size="large" color="#16a34a" />
            </View>
          )}
        </View>

        {/* ── Bottom Sheet ── */}
        {!loadingUser && selectedUser && Platform.OS !== "web" && (
          <BottomSheet
            ref={bottomSheetRef}
            index={SNAP.PEEK}
            snapPoints={snapPoints}
            handleComponent={CustomHandle}
            backgroundStyle={localStyles.sheetBackground}
            enableContentPanningGesture={true}
            enableHandlePanningGesture={true}
            style={{ zIndex: 20 }}
          >
            <BottomSheetScrollView
              contentContainerStyle={[
                localStyles.sheetContent,
                { paddingBottom: insets.bottom + 80 },
              ]}
            >
              {/* StatusCard has been removed — use <StatusCard /> in your other screen */}

              <HomeLocationPanel
                userName={selectedUser.name}
                mapMode={mapMode}
                pendingHome={pendingHome}
                savingHome={savingHome}
                onStartSetHome={startSetHomeMode}
                onConfirmHome={() =>
                  pendingHome && saveHomeLocation(pendingHome)
                }
                onCancel={() => {
                  setMapMode("none");
                  setPendingHome(null);
                }}
              />
              <SafeZonePanel
                mapMode={mapMode}
                radius={radius}
                selectedCenter={selectedCenter}
                onSetRadius={setRadius}
                onStartSafeZone={startSafeZoneMode}
                onConfirmSafeZone={activateSafeZone}
                onCancel={() => {
                  setMapMode("none");
                  setSelectedCenter(null);
                }}
                safeZones={safeZones}
                onEditZone={startEditZone}
                onDeleteZone={deleteZone}
                editingZone={editingZone}
                editRadius={editRadius}
                editCenter={editCenter}
                savingZone={savingZone}
                onSetEditRadius={setEditRadius}
                onSaveEdit={saveEditedZone}
                onCancelEdit={cancelEditZone}
              />
            </BottomSheetScrollView>
          </BottomSheet>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

function CustomHandle() {
  return (
    <View style={localStyles.handleContainer}>
      <View style={localStyles.handleBar} />
    </View>
  );
}

const localStyles = StyleSheet.create({
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.93)",
    paddingBottom: 10,
    paddingHorizontal: 12,
  },
  titleText: {
    marginBottom: 4,
  },
  sheetBackground: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 12,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  handleContainer: {
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: "#ffffff",
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d1d5db",
  },
});