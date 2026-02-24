// import { View, Text, SafeAreaView, Pressable } from "react-native";
// import { useRouter } from "expo-router";
// import { takeMeHomeStyles as styles } from "../styles/takeMeHome";

// export default function TakeMeHomeScreen() {
//   const router = useRouter();

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Pressable onPress={() => router.back()}>
//           <Text style={styles.back}>←</Text>
//         </Pressable>
//         <Text style={styles.title}>Take Me Home</Text>
//         <Pressable>
//           <Text style={styles.voice}>🔊</Text>
//         </Pressable>
//       </View>

//       {/* Map Placeholder */}
//       <View style={styles.map}>
//         <Text style={styles.mapText}>Map / Route Preview</Text>
//       </View>

//       {/* Direction Card */}
//       <View style={styles.card}>
//         <Text style={styles.direction}>↑ Walk straight</Text>
//         <Text style={styles.sub}>for 200 meters</Text>

//         <View style={styles.progressRow}>
//           <View style={styles.progressBar} />
//         </View>

//         <View style={styles.meta}>
//           <Text>1.2 km left</Text>
//           <Text>~15 min</Text>
//         </View>
//       </View>

//       {/* Alert Guardian */}
//       <Pressable style={styles.alertBtn}>
//         <Text style={styles.alertText}>🚨 Alert Guardian</Text>
//       </Pressable>
//     </SafeAreaView>
//   );
// }

// import {
//   View,
//   Text,
//   SafeAreaView,
//   Pressable,
//   ActivityIndicator,
//   Alert,
//   Platform,
// } from "react-native";
// import { useRouter } from "expo-router";
// import { takeMeHomeStyles as styles } from "@/styles/takeMeHome";
// import * as Location from "expo-location";
// import { useEffect, useState, useRef } from "react";
// import { supabase } from "@/supabase/supabase";

// // ✅ Same dynamic import pattern as Guardian
// let MapView: any;
// let Marker: any;
// let Polyline: any;

// if (Platform.OS !== "web") {
//   const Maps = require("react-native-maps");
//   MapView = Maps.default;
//   Marker = Maps.Marker;
//   Polyline = Maps.Polyline;
// }

// export default function TakeMeHomeScreen() {
//   const router = useRouter();
//   const mapRef = useRef<any>(null);

//   const [currentLocation, setCurrentLocation] = useState<any>(null);
//   const [homeLocation, setHomeLocation] = useState<any>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     loadData();
//   }, []);

//   const loadData = async () => {
//     try {
//       setLoading(true);
//       console.log("1️⃣ Starting loadData...");

//       // 📍 Ask permission
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       console.log("2️⃣ Location permission status:", status);

//       if (status !== "granted") {
//         Alert.alert("Location permission required");
//         setLoading(false); // ✅ prevent stuck loading
//         return;
//       }

//       // 📍 Get current location
//       // ✅ Changed from Accuracy.High → Accuracy.Balanced (faster on Android)
//       const location = await Location.getCurrentPositionAsync({
//         accuracy: Location.Accuracy.Balanced,
//       });
//       console.log("3️⃣ Got location:", location.coords);

//       const userCoords = {
//         latitude: location.coords.latitude,
//         longitude: location.coords.longitude,
//       };

//       setCurrentLocation(userCoords);

//       // 👤 Get logged user
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();
//       console.log("4️⃣ Got user:", user?.id);

//       if (!user) {
//         setLoading(false); // ✅ prevent stuck loading
//         return;
//       }

//       // 🏠 Fetch first recorded location as Home
//       const { data, error } = await supabase
//         .from("help_app_user_locations")
//         .select("lat, lng")
//         .eq("user_id", user.id)
//         .order("recorded_at", { ascending: true })
//         .limit(1)
//         .maybeSingle();

//       console.log("5️⃣ Home data:", data, "Error:", error);

//       if (error) {
//         console.log("Home fetch error:", error);
//       }

//       if (data) {
//         const homeCoords = {
//           latitude: Number(data.lat),
//           longitude: Number(data.lng),
//         };

//         setHomeLocation(homeCoords);
//         console.log("6️⃣ Home set:", homeCoords);

//         // 🎯 Auto fit route
//         setTimeout(() => {
//           mapRef.current?.fitToCoordinates(
//             [userCoords, homeCoords],
//             {
//               edgePadding: {
//                 top: 100,
//                 right: 100,
//                 bottom: 100,
//                 left: 100,
//               },
//               animated: true,
//             }
//           );
//         }, 700);
//       } else {
//         Alert.alert("No saved location found.");
//       }
//     } catch (err) {
//       console.log("❌ Error caught:", err);
//       Alert.alert("Something went wrong.");
//     } finally {
//       setLoading(false);
//       console.log("7️⃣ Loading set to false");
//     }
//   };

//   /* ---------------- LOADING ---------------- */

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <ActivityIndicator size="large" />
//       </SafeAreaView>
//     );
//   }

//   /* ---------------- NO HOME ---------------- */

//   if (!homeLocation) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <Text style={{ textAlign: "center", marginTop: 80 }}>
//           No Home Location Found
//         </Text>
//       </SafeAreaView>
//     );
//   }

//   /* ---------------- MAIN UI ---------------- */

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* HEADER */}
//       <View style={styles.header}>
//         <Pressable onPress={() => router.back()}>
//           <Text style={styles.back}>←</Text>
//         </Pressable>

//         <Text style={styles.title}>Take Me Home</Text>

//         <Pressable>
//           <Text style={styles.voice}>🔊</Text>
//         </Pressable>
//       </View>

//       {/* ✅ MAP — same wrapping structure as Guardian */}
//       {Platform.OS !== "web" && (
//         <>
//           <View style={styles.map}>
//             <MapView
//               // ✅ No provider="google" — removed, same as Guardian
//               ref={mapRef}
//               style={{ flex: 1 }}
//               showsUserLocation
//               followsUserLocation
//               region={{
//                 latitude: currentLocation?.latitude ?? 28.6139,
//                 longitude: currentLocation?.longitude ?? 77.209,
//                 latitudeDelta: 0.01,
//                 longitudeDelta: 0.01,
//               }}
//             >
//               {/* Home Marker */}
//               {homeLocation?.latitude != null &&
//                 homeLocation?.longitude != null && (
//                   <Marker
//                     coordinate={{
//                       latitude: Number(homeLocation.latitude),
//                       longitude: Number(homeLocation.longitude),
//                     }}
//                     title="Home"
//                     pinColor="green"
//                   />
//                 )}

//               {/* Current Location Marker */}
//               {currentLocation?.latitude != null &&
//                 currentLocation?.longitude != null && (
//                   <Marker
//                     coordinate={{
//                       latitude: Number(currentLocation.latitude),
//                       longitude: Number(currentLocation.longitude),
//                     }}
//                     title="You"
//                   />
//                 )}

//               {/* Route Line */}
//               {currentLocation && homeLocation && (
//                 <Polyline
//                   coordinates={[currentLocation, homeLocation]}
//                   strokeWidth={4}
//                   strokeColor="#2E8B57"
//                 />
//               )}
//             </MapView>
//           </View>

//           {/* STATUS CARD */}
//           <View style={styles.card}>
//             <Text style={styles.direction}>Heading to Saved Location</Text>
//             <Text style={styles.sub}>Navigation Active</Text>
//           </View>

//           {/* ALERT GUARDIAN */}
//           <Pressable
//             style={styles.alertBtn}
//             onPress={() => Alert.alert("🚨 Guardian Alert Sent")}
//           >
//             <Text style={styles.alertText}>🚨 Alert Guardian</Text>
//           </Pressable>
//         </>
//       )}
//     </SafeAreaView>
//   );
// }

// import {
//   View,
//   Text,
//   SafeAreaView,
//   Pressable,
//   ActivityIndicator,
//   Alert,
//   Platform,
//   Linking,
// } from "react-native";
// import { useRouter } from "expo-router";
// import { takeMeHomeStyles as styles } from "@/styles/takeMeHome";
// import * as Location from "expo-location";
// import { useEffect, useState, useRef } from "react";
// import { supabase } from "@/supabase/supabase";

// // ✅ Same dynamic import pattern as Guardian
// let MapView: any;
// let Marker: any;
// let Polyline: any;

// if (Platform.OS !== "web") {
//   const Maps = require("react-native-maps");
//   MapView = Maps.default;
//   Marker = Maps.Marker;
//   Polyline = Maps.Polyline;
// }

// export default function TakeMeHomeScreen() {
//   const router = useRouter();
//   const mapRef = useRef<any>(null);

//   const [currentLocation, setCurrentLocation] = useState<any>(null);
//   const [homeLocation, setHomeLocation] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [navigating, setNavigating] = useState(false);

//   useEffect(() => {
//     loadData();
//   }, []);

//   const loadData = async () => {
//     try {
//       setLoading(true);
//       console.log("1️⃣ Starting loadData...");

//       // 📍 Ask permission
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       console.log("2️⃣ Location permission status:", status);

//       if (status !== "granted") {
//         Alert.alert("Location permission required");
//         setLoading(false);
//         return;
//       }

//       // 📍 Get current location
//       const location = await Location.getCurrentPositionAsync({
//         accuracy: Location.Accuracy.Balanced,
//       });
//       console.log("3️⃣ Got location:", location.coords);

//       const userCoords = {
//         latitude: location.coords.latitude,
//         longitude: location.coords.longitude,
//       };

//       setCurrentLocation(userCoords);

//       // 👤 Get logged user
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();
//       console.log("4️⃣ Got user:", user?.id);

//       if (!user) {
//         setLoading(false);
//         return;
//       }

//       // 🏠 Fetch first recorded location as Home
//       const { data, error } = await supabase
//         .from("help_app_user_locations")
//         .select("lat, lng")
//         .eq("user_id", user.id)
//         .order("recorded_at", { ascending: true })
//         .limit(1)
//         .maybeSingle();

//       console.log("5️⃣ Home data:", data, "Error:", error);

//       if (error) {
//         console.log("Home fetch error:", error);
//       }

//       if (data) {
//         const homeCoords = {
//           latitude: Number(data.lat),
//           longitude: Number(data.lng),
//         };

//         setHomeLocation(homeCoords);
//         console.log("6️⃣ Home set:", homeCoords);

//         // 🎯 Auto fit route
//         setTimeout(() => {
//           mapRef.current?.fitToCoordinates(
//             [userCoords, homeCoords],
//             {
//               edgePadding: {
//                 top: 100,
//                 right: 100,
//                 bottom: 100,
//                 left: 100,
//               },
//               animated: true,
//             }
//           );
//         }, 700);
//       } else {
//         Alert.alert("No saved location found.");
//       }
//     } catch (err) {
//       console.log("❌ Error caught:", err);
//       Alert.alert("Something went wrong.");
//     } finally {
//       setLoading(false);
//       console.log("7️⃣ Loading set to false");
//     }
//   };

//   /* ---------------- START NAVIGATION ---------------- */

//   const startNavigation = async () => {
//     if (!homeLocation) {
//       Alert.alert("Home location not found.");
//       return;
//     }

//     const { latitude, longitude } = homeLocation;

//     setNavigating(true);

//     try {
//       if (Platform.OS === "ios") {
//         // 🍎 Try Google Maps first on iOS, fallback to Apple Maps
//         const googleMapsUrl = `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=walking`;
//         const appleMapsUrl = `maps://?daddr=${latitude},${longitude}&dirflg=w`;

//         const googleSupported = await Linking.canOpenURL(googleMapsUrl);

//         if (googleSupported) {
//           await Linking.openURL(googleMapsUrl);
//         } else {
//           await Linking.openURL(appleMapsUrl);
//         }
//       } else {
//         // 🤖 Android — open Google Maps with turn-by-turn navigation
//         const googleMapsUrl = `google.navigation:q=${latitude},${longitude}&mode=w`;
//         const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking`;

//         const googleSupported = await Linking.canOpenURL(googleMapsUrl);

//         if (googleSupported) {
//           await Linking.openURL(googleMapsUrl);
//         } else {
//           // fallback to browser Google Maps
//           await Linking.openURL(fallbackUrl);
//         }
//       }
//     } catch (err) {
//       console.log("Navigation error:", err);
//       Alert.alert("Could not open maps app.");
//     } finally {
//       setNavigating(false);
//     }
//   };

//   /* ---------------- LOADING ---------------- */

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <ActivityIndicator size="large" />
//       </SafeAreaView>
//     );
//   }

//   /* ---------------- NO HOME ---------------- */

//   if (!homeLocation) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <Text style={{ textAlign: "center", marginTop: 80 }}>
//           No Home Location Found
//         </Text>
//       </SafeAreaView>
//     );
//   }

//   /* ---------------- MAIN UI ---------------- */

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* HEADER */}
//       <View style={styles.header}>
//         <Pressable onPress={() => router.back()}>
//           <Text style={styles.back}>←</Text>
//         </Pressable>

//         <Text style={styles.title}>Take Me Home</Text>

//         <Pressable>
//           <Text style={styles.voice}>🔊</Text>
//         </Pressable>
//       </View>

//       {/* MAP */}
//       {Platform.OS !== "web" && (
//         <>
//           <View style={styles.map}>
//             <MapView
//               ref={mapRef}
//               style={{ flex: 1 }}
//               showsUserLocation
//               followsUserLocation
//               region={{
//                 latitude: currentLocation?.latitude ?? 28.6139,
//                 longitude: currentLocation?.longitude ?? 77.209,
//                 latitudeDelta: 0.01,
//                 longitudeDelta: 0.01,
//               }}
//             >
//               {/* Home Marker */}
//               {homeLocation?.latitude != null &&
//                 homeLocation?.longitude != null && (
//                   <Marker
//                     coordinate={{
//                       latitude: Number(homeLocation.latitude),
//                       longitude: Number(homeLocation.longitude),
//                     }}
//                     title="Home"
//                     pinColor="green"
//                   />
//                 )}

//               {/* Current Location Marker */}
//               {currentLocation?.latitude != null &&
//                 currentLocation?.longitude != null && (
//                   <Marker
//                     coordinate={{
//                       latitude: Number(currentLocation.latitude),
//                       longitude: Number(currentLocation.longitude),
//                     }}
//                     title="You"
//                   />
//                 )}

//               {/* Route Line */}
//               {currentLocation && homeLocation && (
//                 <Polyline
//                   coordinates={[currentLocation, homeLocation]}
//                   strokeWidth={4}
//                   strokeColor="#2E8B57"
//                 />
//               )}
//             </MapView>
//           </View>

//           {/* STATUS CARD */}
//           <View style={styles.card}>
//             <Text style={styles.direction}>Heading to Saved Location</Text>
//             <Text style={styles.sub}>Navigation Active</Text>
//           </View>

//           {/* ✅ START NAVIGATION BUTTON — below status card */}
//           <Pressable
//             style={[
//               styles.navBtn,
//               navigating && styles.navBtnDisabled,
//             ]}
//             onPress={startNavigation}
//             disabled={navigating}
//           >
//             {navigating ? (
//               <ActivityIndicator color="#fff" />
//             ) : (
//               <>
//                 <Text style={styles.navBtnText}>🧭 Start Navigation</Text>
//                 <Text style={styles.navBtnSub}>Opens in Google Maps</Text>
//               </>
//             )}
//           </Pressable>

//           {/* ALERT GUARDIAN */}
//           <Pressable
//             style={styles.alertBtn}
//             onPress={() => Alert.alert("🚨 Guardian Alert Sent")}
//           >
//             <Text style={styles.alertText}>🚨 Alert Guardian</Text>
//           </Pressable>
//         </>
//       )}
//     </SafeAreaView>
//   );
// }

// import {
//   View,
//   Text,
//   Pressable,
//   ActivityIndicator,
//   Alert,
//   Platform,
//   Linking,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context"; // ✅ correct import
// import { useRouter } from "expo-router";
// import { takeMeHomeStyles as styles } from "@/styles/takeMeHome";
// import * as Location from "expo-location";
// import { useEffect, useState, useRef, useCallback } from "react";
// import { supabase } from "@/supabase/supabase";

// // ✅ Same dynamic import pattern as Guardian
// let MapView: any;
// let Marker: any;
// let Polyline: any;

// if (Platform.OS !== "web") {
//   const Maps = require("react-native-maps");
//   MapView = Maps.default;
//   Marker = Maps.Marker;
//   Polyline = Maps.Polyline;
// }


// export default function TakeMeHomeScreen() {
//   const router = useRouter();
//   const mapRef = useRef<any>(null);
//   const hasLoaded = useRef(false); // ✅ prevent multiple loadData calls

//   const [currentLocation, setCurrentLocation] = useState<any>(null);
//   const [homeLocation, setHomeLocation] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [navigating, setNavigating] = useState(false);

//   // ✅ useCallback prevents loadData from being recreated on every render
//   const loadData = useCallback(async () => {
//     // ✅ Guard: only run once
//     if (hasLoaded.current) return;
//     hasLoaded.current = true;

//     try {
//       setLoading(true);
//       console.log("1️⃣ Starting loadData...");

//       // 📍 Ask permission
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       console.log("2️⃣ Location permission status:", status);

//       if (status !== "granted") {
//         Alert.alert("Location permission required");
//         setLoading(false);
//         return;
//       }

//       // 📍 Get current location
//       const location = await Location.getCurrentPositionAsync({
//         accuracy: Location.Accuracy.Balanced,
//       });
//       console.log("3️⃣ Got location:", location.coords);

//       const userCoords = {
//         latitude: location.coords.latitude,
//         longitude: location.coords.longitude,
//       };

//       setCurrentLocation(userCoords);

//       // 👤 Get logged user
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();
//       console.log("4️⃣ Got user:", user?.id);

//       if (!user) {
//         setLoading(false);
//         return;
//       }

//       // 🏠 Fetch first recorded location as Home
//       const { data, error } = await supabase
//         .from("help_app_user_locations")
//         .select("lat, lng")
//         .eq("user_id", user.id)
//         .order("recorded_at", { ascending: true })
//         .limit(1)
//         .maybeSingle();

//       console.log("5️⃣ Home data:", data, "Error:", error);

//       if (error) {
//         console.log("Home fetch error:", error);
//       }

//       if (data) {
//         const homeCoords = {
//           latitude: Number(data.lat),
//           longitude: Number(data.lng),
//         };

//         setHomeLocation(homeCoords);
//         console.log("6️⃣ Home set:", homeCoords);

//         // 🎯 Auto fit route
//         setTimeout(() => {
//           mapRef.current?.fitToCoordinates(
//             [userCoords, homeCoords],
//             {
//               edgePadding: {
//                 top: 100,
//                 right: 100,
//                 bottom: 100,
//                 left: 100,
//               },
//               animated: true,
//             }
//           );
//         }, 700);
//       } else {
//         Alert.alert("No saved location found.");
//       }
//     } catch (err) {
//       console.log("❌ Error caught:", err);
//       Alert.alert("Something went wrong.");
//     } finally {
//       setLoading(false);
//       console.log("7️⃣ Loading set to false");
//     }
//   }, []); // ✅ empty deps — never recreated

//   useEffect(() => {
//     loadData();
//   }, [loadData]); // ✅ stable reference, won't loop

//   /* ---------------- START NAVIGATION ---------------- */

//   const startNavigation = async () => {
//     if (!homeLocation) {
//       Alert.alert("Home location not found.");
//       return;
//     }

//     const { latitude, longitude } = homeLocation;
//     setNavigating(true);

//     try {
//       if (Platform.OS === "ios") {
//         // 🍎 Try Google Maps first on iOS, fallback to Apple Maps
//         const googleMapsUrl = `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=walking`;
//         const appleMapsUrl = `maps://?daddr=${latitude},${longitude}&dirflg=w`;

//         const googleSupported = await Linking.canOpenURL(googleMapsUrl);
//         await Linking.openURL(googleSupported ? googleMapsUrl : appleMapsUrl);
//       } else {
//         // 🤖 Android — open Google Maps with turn-by-turn navigation
//         const googleMapsUrl = `google.navigation:q=${latitude},${longitude}&mode=w`;
//         const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking`;

//         const googleSupported = await Linking.canOpenURL(googleMapsUrl);
//         await Linking.openURL(googleSupported ? googleMapsUrl : fallbackUrl);
//       }
//     } catch (err) {
//       console.log("Navigation error:", err);
//       Alert.alert("Could not open maps app.");
//     } finally {
//       setNavigating(false);
//     }
//   };

//   /* ---------------- LOADING ---------------- */

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <ActivityIndicator size="large" />
//       </SafeAreaView>
//     );
//   }

//   /* ---------------- NO HOME ---------------- */

//   if (!homeLocation) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <Text style={{ textAlign: "center", marginTop: 80 }}>
//           No Home Location Found
//         </Text>
//       </SafeAreaView>
//     );
//   }

//   /* ---------------- MAIN UI ---------------- */

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* HEADER */}
//       <View style={styles.header}>
//         <Pressable onPress={() => router.back()}>
//           <Text style={styles.back}>←</Text>
//         </Pressable>

//         <Text style={styles.title}>Take Me Home</Text>

//         <Pressable>
//           <Text style={styles.voice}>🔊</Text>
//         </Pressable>
//       </View>

//       {/* MAP */}
//       {Platform.OS !== "web" && (
//         <>
//           <View style={styles.map}>
//             <MapView
//               ref={mapRef}
//               style={{ flex: 1 }}
//               showsUserLocation
//               followsUserLocation
//               region={{
//                 latitude: currentLocation?.latitude ?? 28.6139,
//                 longitude: currentLocation?.longitude ?? 77.209,
//                 latitudeDelta: 0.01,
//                 longitudeDelta: 0.01,
//               }}
//             >
//               {/* Home Marker */}
//               {homeLocation?.latitude != null &&
//                 homeLocation?.longitude != null && (
//                   <Marker
//                     coordinate={{
//                       latitude: Number(homeLocation.latitude),
//                       longitude: Number(homeLocation.longitude),
//                     }}
//                     title="Home"
//                     pinColor="green"
//                   />
//                 )}

//               {/* Current Location Marker */}
//               {currentLocation?.latitude != null &&
//                 currentLocation?.longitude != null && (
//                   <Marker
//                     coordinate={{
//                       latitude: Number(currentLocation.latitude),
//                       longitude: Number(currentLocation.longitude),
//                     }}
//                     title="You"
//                   />
//                 )}

//               {/* Route Line */}
//               {currentLocation && homeLocation && (
//                 <Polyline
//                   coordinates={[currentLocation, homeLocation]}
//                   strokeWidth={4}
//                   strokeColor="#2E8B57"
//                 />
//               )}
//             </MapView>
//           </View>

//           {/* STATUS CARD */}
//           <View style={styles.card}>
//             <Text style={styles.direction}>Heading to Saved Location</Text>
//             <Text style={styles.sub}>Navigation Active</Text>
//           </View>

//           {/* ✅ START NAVIGATION BUTTON */}
//           <Pressable
//             style={[styles.navBtn, navigating && styles.navBtnDisabled]}
//             onPress={startNavigation}
//             disabled={navigating}
//           >
//             {navigating ? (
//               <ActivityIndicator color="#fff" />
//             ) : (
//               <>
//                 <Text style={styles.navBtnText}>🧭 Start Navigation</Text>
//                 <Text style={styles.navBtnSub}>Opens in Google Maps</Text>
//               </>
//             )}
//           </Pressable>

//           {/* ALERT GUARDIAN */}
//           <Pressable
//             style={styles.alertBtn}
//             onPress={() => Alert.alert("🚨 Guardian Alert Sent")}
//           >
//             <Text style={styles.alertText}>🚨 Alert Guardian</Text>
//           </Pressable>
//         </>
//       )}
//     </SafeAreaView>
//   );
// }

// import {
//   View,
//   Text,
//   Pressable,
//   ActivityIndicator,
//   Alert,
//   Platform,
//   Linking,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { useRouter } from "expo-router";
// import { takeMeHomeStyles as styles } from "@/styles/takeMeHome";
// import * as Location from "expo-location";
// import { useEffect, useState, useRef, useCallback } from "react";
// import { supabase } from "@/supabase/supabase";
// import * as Haptics from "expo-haptics";
// import { Audio } from "expo-av";

// let MapView: any;
// let Marker: any;
// let Polyline: any;

// if (Platform.OS !== "web") {
//   const Maps = require("react-native-maps");
//   MapView = Maps.default;
//   Marker = Maps.Marker;
//   Polyline = Maps.Polyline;
// }

// export default function TakeMeHomeScreen() {
//   const router = useRouter();
//   const mapRef = useRef<any>(null);
//   const hasLoaded = useRef(false);

//   const [currentLocation, setCurrentLocation] = useState<any>(null);
//   const [homeLocation, setHomeLocation] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [navigating, setNavigating] = useState(false);

//   const loadData = useCallback(async () => {
//     if (hasLoaded.current) return;
//     hasLoaded.current = true;

//     try {
//       setLoading(true);

//       const { status } =
//         await Location.requestForegroundPermissionsAsync();

//       if (status !== "granted") {
//         Alert.alert("Location permission required");
//         return;
//       }

//       const location = await Location.getCurrentPositionAsync({
//         accuracy: Location.Accuracy.Balanced,
//       });

//       const userCoords = {
//         latitude: location.coords.latitude,
//         longitude: location.coords.longitude,
//       };

//       setCurrentLocation(userCoords);

//       const {
//         data: { user },
//       } = await supabase.auth.getUser();

//       if (!user) return;

//       const { data } = await supabase
//         .from("help_app_user_locations")
//         .select("lat, lng")
//         .eq("user_id", user.id)
//         .order("recorded_at", { ascending: true })
//         .limit(1)
//         .maybeSingle();

//       if (!data) {
//         Alert.alert("No saved home location found.");
//         return;
//       }

//       const homeCoords = {
//         latitude: Number(data.lat),
//         longitude: Number(data.lng),
//       };

//       setHomeLocation(homeCoords);

//       // Auto fit map nicely
//       setTimeout(() => {
//         mapRef.current?.fitToCoordinates(
//           [userCoords, homeCoords],
//           {
//             edgePadding: {
//               top: 100,
//               right: 80,
//               bottom: 100,
//               left: 80,
//             },
//             animated: true,
//           }
//         );
//       }, 600);
//     } catch (err) {
//       Alert.alert("Something went wrong.");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadData();
//   }, [loadData]);

//   /* ---------------- NAVIGATION ---------------- */

//   const startNavigation = async () => {
//     if (!homeLocation) {
//       Alert.alert("Home location not found.");
//       return;
//     }

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
//       Alert.alert("Could not open maps app.");
//     } finally {
//       setNavigating(false);
//     }
//   };

//   /* ---------------- LOADING ---------------- */

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <ActivityIndicator size="large" />
//       </SafeAreaView>
//     );
//   }

//   if (!homeLocation) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <Text style={{ textAlign: "center", marginTop: 80 }}>
//           No Home Location Found
//         </Text>
//       </SafeAreaView>
//     );
//   }

//   /* ---------------- UI ---------------- */

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <Pressable onPress={() => router.back()}>
//           <Text style={styles.back}>←</Text>
//         </Pressable>

//         <Text style={styles.title}>Take Me Home</Text>

//         <Pressable>
//           <Text style={styles.voice}>🔊</Text>
//         </Pressable>
//       </View>

//       {Platform.OS !== "web" && (
//         <>
//           <View style={styles.map}>
//             <MapView
//               ref={mapRef}
//               style={{ flex: 1 }}
//               showsUserLocation
//               followsUserLocation
//               initialRegion={{
//                 latitude: currentLocation?.latitude ?? 28.6139,
//                 longitude: currentLocation?.longitude ?? 77.209,
//                 latitudeDelta: 0.05,
//                 longitudeDelta: 0.05,
//               }}
//             >
//               {/* 🔴 Home Marker */}
//               {homeLocation && (
//                 <Marker
//                   coordinate={homeLocation}
//                   title="Home"
//                   description="Your saved location"
//                   pinColor="red"
//                 />
//               )}

//               {/* 🔵 Route Line */}
//               {currentLocation && homeLocation && (
//                 <Polyline
//                   coordinates={[currentLocation, homeLocation]}
//                   strokeWidth={5}
//                   strokeColor="#1A73E8"
//                 />
//               )}
//             </MapView>
//           </View>

//           <View style={styles.card}>
//             <Text style={styles.direction}>📍 You → 🏠 Home</Text>
//             <Text style={styles.sub}>
//               Follow the blue route to reach your saved home
//             </Text>
//           </View>

//           <Pressable
//             style={[styles.navBtn, navigating && styles.navBtnDisabled]}
//             onPress={startNavigation}
//             disabled={navigating}
//           >
//             {navigating ? (
//               <ActivityIndicator color="#fff" />
//             ) : (
//               <>
//                 <Text style={styles.navBtnText}>🧭 Start Navigation</Text>
//                 <Text style={styles.navBtnSub}>
//                   Opens in Google Maps
//                 </Text>
//               </>
//             )}
//           </Pressable>

//           <Pressable
//             style={styles.alertBtn}
//             onPress={() => Alert.alert("🚨 Guardian Alert Sent")}
//           >
//             <Text style={styles.alertText}>🚨 Alert Guardian</Text>
//           </Pressable>
//         </>
//       )}
//     </SafeAreaView>
//   );
// }

import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { takeMeHomeStyles as styles } from "@/styles/takeMeHome";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/supabase/supabase";

let MapView: any;
let Marker: any;
let Polyline: any;

if (Platform.OS !== "web") {
  const Maps = require("react-native-maps");
  MapView = Maps.default;
  Marker = Maps.Marker;
  Polyline = Maps.Polyline;
}

export default function TakeMeHomeScreen() {
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const hasLoaded = useRef(false);

  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [homeLocation, setHomeLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);

  /* ---------------- VOICE HELPER ---------------- */

  const speak = (text: string) => {
    Speech.stop();
    Speech.speak(text, {
      rate: 0.95,
      pitch: 1.0,
    });
  };

  /* ---------------- LOAD DATA ---------------- */

  const loadData = useCallback(async () => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    try {
      setLoading(true);

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Location permission required");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const userCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(userCoords);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("help_app_user_locations")
        .select("lat, lng")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!data) {
        Alert.alert("No saved home location found.");
        return;
      }

      const homeCoords = {
        latitude: Number(data.lat),
        longitude: Number(data.lng),
      };

      setHomeLocation(homeCoords);

      setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          [userCoords, homeCoords],
          {
            edgePadding: {
              top: 100,
              right: 80,
              bottom: 100,
              left: 80,
            },
            animated: true,
          }
        );
      }, 600);
    } catch {
      Alert.alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ---------------- START NAVIGATION ---------------- */

  const startNavigation = async () => {
    if (!homeLocation || navigating) return;

    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    );

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
      Alert.alert("Could not open maps app.");
    } finally {
      setNavigating(false);
    }
  };

  /* ---------------- GUARDIAN ALERT ---------------- */

  const alertGuardian = async () => {
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Error
    );

    speak("Emergency alert sent to guardian.");

    Alert.alert("🚨 Guardian Alert Sent");
  };

  /* ---------------- LOADING ---------------- */

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!homeLocation) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ textAlign: "center", marginTop: 80 }}>
          No Home Location Found
        </Text>
      </SafeAreaView>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <SafeAreaView style={styles.container}>
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

      {Platform.OS !== "web" && (
        <>
          <View style={styles.map}>
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              showsUserLocation
              followsUserLocation
              initialRegion={{
                latitude: currentLocation?.latitude ?? 28.6139,
                longitude: currentLocation?.longitude ?? 77.209,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
            >
              {homeLocation && (
                <Marker
                  coordinate={homeLocation}
                  title="Home"
                  description="Your saved location"
                  pinColor="red"
                />
              )}

              {currentLocation && homeLocation && (
                <Polyline
                  coordinates={[currentLocation, homeLocation]}
                  strokeWidth={5}
                  strokeColor="#1A73E8"
                />
              )}
            </MapView>
          </View>

          <View style={styles.card}>
            <Text style={styles.direction}>📍 You → 🏠 Home</Text>
            <Text style={styles.sub}>
              Follow the blue route to reach your saved home
            </Text>
          </View>

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
                <Text style={styles.navBtnSub}>
                  Opens in Google Maps
                </Text>
              </>
            )}
          </Pressable>

          <Pressable style={styles.alertBtn} onPress={alertGuardian}>
            <Text style={styles.alertText}>🚨 Alert Guardian</Text>
          </Pressable>
        </>
      )}
    </SafeAreaView>
  );
}