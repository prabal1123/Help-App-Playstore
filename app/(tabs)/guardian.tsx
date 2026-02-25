// import { View, Text, SafeAreaView, Pressable } from "react-native";
// import { guardianStyles as styles } from "@/styles/guardian";

// export default function GuardianScreen() {
//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Pressable>
//           <Text style={styles.icon}>←</Text>
//         </Pressable>

//         <Text style={styles.title}>Guardian View</Text>

//         <Pressable>
//           <Text style={styles.icon}>⚙️</Text>
//         </Pressable>
//       </View>

//       {/* User Card */}
//       <View style={styles.userCard}>
//         <View style={styles.avatar}>
//           <Text style={styles.avatarText}>👩</Text>
//         </View>

//         <View style={styles.userInfo}>
//           <Text style={styles.name}>Sarah</Text>
//           <Text style={styles.status}>🟢 Inside safe area</Text>
//           <Text style={styles.updated}>Last updated: 2 minutes ago</Text>
//         </View>

//         <View style={styles.battery}>
//           <Text style={styles.batteryText}>🔋 78%</Text>
//         </View>
//       </View>

//       {/* Map Placeholder */}
//       <View style={styles.map}>
//         <View style={styles.safeCircle}>
//           <View style={styles.homeMarker}>
//             <Text>📍</Text>
//           </View>
//           <View style={styles.userMarker}>
//             <Text>🧭</Text>
//           </View>
//         </View>
//       </View>

//       {/* Safe Zone Card */}
//       <View style={styles.card}>
//         <Text style={styles.cardTitle}>🛡 Safe Zone</Text>
//         <View style={styles.row}>
//           <Text style={styles.cardSub}>Radius: 500m from home</Text>
//           <Text style={styles.edit}>Edit</Text>
//         </View>
//       </View>

//       {/* Alerts */}
//       <View style={styles.card}>
//         <Text style={styles.cardTitle}>🔔 Recent Alerts</Text>

//         <View style={styles.alertItem}>
//           <Text style={styles.alertDot}>🟡</Text>
//           <View>
//             <Text style={styles.alertText}>Left safe area</Text>
//             <Text style={styles.alertTime}>Today, 3:42 PM</Text>
//           </View>
//         </View>

//         <View style={styles.alertItem}>
//           <Text style={styles.alertDot}>🟢</Text>
//           <View>
//             <Text style={styles.alertText}>Returned to safe area</Text>
//             <Text style={styles.alertTime}>Today, 4:10 PM</Text>
//           </View>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// }

// import { View, Text, SafeAreaView, Pressable } from "react-native";
// import MapView, { Marker, Circle } from "react-native-maps";
// import { guardianStyles as styles } from "@/styles/guardian";
// import { useState } from "react";

// export default function GuardianScreen() {
//   // 🔹 Dummy coordinates for now (Replace later with Supabase data)
//   const homeLocation = {
//     latitude: 28.6139,
//     longitude: 77.2090,
//   };

//   const [userLocation, setUserLocation] = useState({
//     latitude: 28.6155,
//     longitude: 77.2105,
//   });

//   const radius = 500; // meters

//   const isOutside = false; // later dynamic

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Pressable>
//           <Text style={styles.icon}>←</Text>
//         </Pressable>

//         <Text style={styles.title}>Guardian View</Text>

//         <Pressable>
//           <Text style={styles.icon}>⚙️</Text>
//         </Pressable>
//       </View>

//       {/* User Card */}
//       <View style={styles.userCard}>
//         <View style={styles.avatar}>
//           <Text style={styles.avatarText}>👩</Text>
//         </View>

//         <View style={styles.userInfo}>
//           <Text style={styles.name}>Sarah</Text>
//           <Text style={styles.status}>
//             {isOutside ? "🔴 Outside safe area" : "🟢 Inside safe area"}
//           </Text>
//           <Text style={styles.updated}>Live tracking active</Text>
//         </View>

//         <View style={styles.battery}>
//           <Text style={styles.batteryText}>🔋 78%</Text>
//         </View>
//       </View>

//       {/* 🗺 REAL MAP */}
//       <View style={styles.map}>
//         <MapView
//           style={{ flex: 1 }}
//           initialRegion={{
//             latitude: homeLocation.latitude,
//             longitude: homeLocation.longitude,
//             latitudeDelta: 0.01,
//             longitudeDelta: 0.01,
//           }}
//         >
//           {/* Safe Zone Circle */}
//           <Circle
//             center={homeLocation}
//             radius={radius}
//             strokeColor="rgba(0,150,255,0.8)"
//             fillColor="rgba(0,150,255,0.2)"
//           />

//           {/* Home Marker */}
//           <Marker coordinate={homeLocation} title="Home" />

//           {/* User Marker */}
//           <Marker
//             coordinate={userLocation}
//             title="User"
//             pinColor={isOutside ? "red" : "green"}
//           />
//         </MapView>
//       </View>

//       {/* Safe Zone Card */}
//       <View style={styles.card}>
//         <Text style={styles.cardTitle}>🛡 Safe Zone</Text>
//         <View style={styles.row}>
//           <Text style={styles.cardSub}>Radius: {radius}m from home</Text>
//           <Text style={styles.edit}>Edit</Text>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// }

// import { View, Text, SafeAreaView, Pressable, Platform } from "react-native";
// import { guardianStyles as styles } from "@/styles/guardian";
// import { useState, useEffect } from "react";
// import { supabase } from "@/supabase/supabase";

// // 🚨 Only import maps on native
// let MapView: any;
// let Marker: any;
// let Circle: any;

// if (Platform.OS !== "web") {
//   const Maps = require("react-native-maps");
//   MapView = Maps.default;
//   Marker = Maps.Marker;
//   Circle = Maps.Circle;
// }

// export default function GuardianScreen() {
//   const [userLocation, setUserLocation] = useState<any>(null);
//   const [safeZone, setSafeZone] = useState<any>(null);
//   const [isOutside, setIsOutside] = useState(false);
//   const [userName, setUserName] = useState("User");

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

//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     return R * c;
//   };

//   const updateLocation = (location: any) => {
//     const lat = location.lat;
//     const lng = location.lng;

//     setUserLocation({
//       latitude: lat,
//       longitude: lng,
//     });

//     if (safeZone) {
//       const distance = calculateDistance(
//         safeZone.center_lat,
//         safeZone.center_lng,
//         lat,
//         lng
//       );

//       setIsOutside(distance > safeZone.radius_meters);
//     }
//   };

//   useEffect(() => {
//     let linkedUserId: string;

//     const init = async () => {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();

//       if (!user) return;

//       const { data: link } = await supabase
//         .from("help_app_guardian_links")
//         .select("user_id")
//         .eq("guardian_id", user.id)
//         .eq("status", "approved")
//         .maybeSingle();

//       if (!link) return;

//       linkedUserId = link.user_id;

//       const { data: profile } = await supabase
//         .from("help_app_profiles")
//         .select("name")
//         .eq("id", linkedUserId)
//         .maybeSingle();

//       if (profile?.name) setUserName(profile.name);

//       const { data: zone } = await supabase
//         .from("help_app_safe_zones")
//         .select("*")
//         .eq("user_id", linkedUserId)
//         .eq("active", true)
//         .maybeSingle();

//       if (zone) setSafeZone(zone);

//       const { data: latestLocation } = await supabase
//         .from("help_app_user_locations")
//         .select("*")
//         .eq("user_id", linkedUserId)
//         .order("recorded_at", { ascending: false })
//         .limit(1)
//         .maybeSingle();

//       if (latestLocation) updateLocation(latestLocation);

//       supabase
//         .channel("guardian-live-location")
//         .on(
//           "postgres_changes",
//           {
//             event: "INSERT",
//             schema: "public",
//             table: "help_app_user_locations",
//             filter: `user_id=eq.${linkedUserId}`,
//           },
//           (payload) => {
//             updateLocation(payload.new);
//           }
//         )
//         .subscribe();
//     };

//     init();
//   }, []);

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <Pressable>
//           <Text style={styles.icon}>←</Text>
//         </Pressable>
//         <Text style={styles.title}>Guardian View</Text>
//         <Pressable>
//           <Text style={styles.icon}>⚙️</Text>
//         </Pressable>
//       </View>

//       {/* 🚨 WEB FALLBACK */}
//       {Platform.OS === "web" ? (
//         <View style={{ padding: 40, alignItems: "center" }}>
//           <Text style={{ fontSize: 18, fontWeight: "600" }}>
//             🗺 Maps not supported on Web
//           </Text>
//           <Text style={{ marginTop: 10, textAlign: "center" }}>
//             Please open this feature on Android or iOS device.
//           </Text>
//         </View>
//       ) : (
//         <>
//           <View style={styles.map}>
//             <MapView
//               style={{ flex: 1 }}
//               region={{
//                 latitude: userLocation?.latitude || 28.6139,
//                 longitude: userLocation?.longitude || 77.2090,
//                 latitudeDelta: 0.01,
//                 longitudeDelta: 0.01,
//               }}
//             >
//               {safeZone && (
//                 <Circle
//                   center={{
//                     latitude: safeZone.center_lat,
//                     longitude: safeZone.center_lng,
//                   }}
//                   radius={safeZone.radius_meters}
//                   strokeColor="rgba(0,150,255,0.8)"
//                   fillColor="rgba(0,150,255,0.2)"
//                 />
//               )}

//               {userLocation && (
//                 <Marker
//                   coordinate={userLocation}
//                   title={userName}
//                   pinColor={isOutside ? "red" : "green"}
//                 />
//               )}
//             </MapView>
//           </View>
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
//   Platform,
//   Alert,
// } from "react-native";
// import { guardianStyles as styles } from "@/styles/guardian";
// import { useState, useEffect } from "react";
// import { supabase } from "@/supabase/supabase";
// import type { MapPressEvent } from "react-native-maps";

// let MapView: any;
// let Marker: any;
// let Circle: any;

// if (Platform.OS !== "web") {
//   const Maps = require("react-native-maps");
//   MapView = Maps.default;
//   Marker = Maps.Marker;
//   Circle = Maps.Circle;
// }

// export default function GuardianScreen() {
//   const [userLocation, setUserLocation] = useState<any>(null);
//   const [safeZones, setSafeZones] = useState<any[]>([]);
//   const [selectedCenter, setSelectedCenter] = useState<any>(null);
//   const [radius, setRadius] = useState(300);
//   const [userName, setUserName] = useState("Loading...");
//   const [linkedUserId, setLinkedUserId] = useState<string | null>(null);
//   const [lastUpdated, setLastUpdated] = useState("");
//   const [isOutside, setIsOutside] = useState(false);
//   const [isSelecting, setIsSelecting] = useState(false);

//   /* ---------------- Distance Calculator ---------------- */

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

//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     return R * c;
//   };

//   const checkOutsideZones = (lat: number, lng: number) => {
//     if (safeZones.length === 0) {
//       setIsOutside(false);
//       return;
//     }

//     const inside = safeZones.some((zone) => {
//       const distance = calculateDistance(
//         zone.center_lat,
//         zone.center_lng,
//         lat,
//         lng
//       );
//       return distance <= zone.radius_meters;
//     });

//     console.log("Inside any zone:", inside);
//     setIsOutside(!inside);
//   };

//   /* ---------------- INIT ---------------- */

//   useEffect(() => {
//     const init = async () => {
//       console.log("🔄 Guardian screen initializing...");

//       const {
//         data: { user },
//       } = await supabase.auth.getUser();

//       if (!user) return;

//       console.log("🟢 Guardian ID:", user.id);

//       const { data: link } = await supabase
//         .from("help_app_guardian_links")
//         .select("user_id")
//         .eq("guardian_id", user.id)
//         .eq("status", "approved")
//         .maybeSingle();

//       console.log("🔗 Link result:", link);

//       if (!link) return;

//       setLinkedUserId(link.user_id);

//       const { data: profile } = await supabase
//         .from("help_app_profiles")
//         .select("name")
//         .eq("id", link.user_id)
//         .maybeSingle();

//       if (profile?.name) setUserName(profile.name);

//       const { data: zones } = await supabase
//         .from("help_app_safe_zones")
//         .select("*")
//         .eq("guardian_id", user.id)
//         .eq("user_id", link.user_id)
//         .eq("active", true);

//       console.log("🛑 Safe zones fetched:", zones);

//       if (zones) setSafeZones(zones);

//       const { data: latestLocation } = await supabase
//         .from("help_app_user_locations")
//         .select("*")
//         .eq("user_id", link.user_id)
//         .order("recorded_at", { ascending: false })
//         .limit(1)
//         .maybeSingle();

//       console.log("📍 Latest location:", latestLocation);

//       if (latestLocation) {
//         const lat =
//           latestLocation.latitude ?? latestLocation.lat ?? null;
//         const lng =
//           latestLocation.longitude ?? latestLocation.lng ?? null;

//         if (lat != null && lng != null) {
//           setUserLocation({
//             latitude: Number(lat),
//             longitude: Number(lng),
//           });

//           setLastUpdated(
//             new Date(
//               latestLocation.recorded_at
//             ).toLocaleTimeString()
//           );

//           checkOutsideZones(Number(lat), Number(lng));
//         }
//       }

//       supabase
//         .channel("guardian-live-location")
//         .on(
//           "postgres_changes",
//           {
//             event: "INSERT",
//             schema: "public",
//             table: "help_app_user_locations",
//             filter: `user_id=eq.${link.user_id}`,
//           },
//           (payload) => {
//             console.log("📡 Realtime:", payload.new);

//             const lat =
//               payload.new.latitude ?? payload.new.lat ?? null;
//             const lng =
//               payload.new.longitude ?? payload.new.lng ?? null;

//             if (lat != null && lng != null) {
//               setUserLocation({
//                 latitude: Number(lat),
//                 longitude: Number(lng),
//               });

//               setLastUpdated(
//                 new Date(
//                   payload.new.recorded_at
//                 ).toLocaleTimeString()
//               );

//               checkOutsideZones(Number(lat), Number(lng));
//             }
//           }
//         )
//         .subscribe();
//     };

//     init();
//   }, []);

//   useEffect(() => {
//     if (isOutside && safeZones.length > 0) {
//       Alert.alert("🚨 Alert", `${userName} left your safe zones!`);
//     }
//   }, [isOutside]);

//   /* ---------------- Add Safe Zone ---------------- */

//   const activateSafeZone = async () => {
//     if (!selectedCenter || !linkedUserId) {
//       Alert.alert("Select a location first.");
//       return;
//     }

//     const {
//       data: { user },
//     } = await supabase.auth.getUser();

//     if (!user) return;

//     const { data, error } = await supabase
//       .from("help_app_safe_zones")
//       .insert({
//         guardian_id: user.id,
//         user_id: linkedUserId,
//         center_lat: selectedCenter.latitude,
//         center_lng: selectedCenter.longitude,
//         radius_meters: radius,
//         active: true,
//       })
//       .select()
//       .single();

//     if (error) {
//       Alert.alert("Error", error.message);
//       return;
//     }

//     setSafeZones((prev) => [...prev, data]);
//     setSelectedCenter(null);
//     setIsSelecting(false);

//     if (userLocation) {
//       checkOutsideZones(
//         userLocation.latitude,
//         userLocation.longitude
//       );
//     }

//     Alert.alert("✅ Safe Zone Added");
//   };

//   /* ---------------- UI ---------------- */

//   return (
//     <SafeAreaView style={styles.container}>
//       <Text style={styles.title}>Guardian View</Text>

//       {Platform.OS !== "web" && (
//         <>
//           {isSelecting && (
//             <Text
//               style={{
//                 textAlign: "center",
//                 color: "blue",
//                 marginVertical: 5,
//               }}
//             >
//               Tap on map to choose safe zone center
//             </Text>
//           )}

//           <View style={styles.map}>
//             <MapView
//               style={{ flex: 1 }}
//               region={{
//                 latitude:
//                   userLocation?.latitude ?? 28.6139,
//                 longitude:
//                   userLocation?.longitude ?? 77.209,
//                 latitudeDelta: 0.01,
//                 longitudeDelta: 0.01,
//               }}
//               onPress={(e: MapPressEvent) => {
//                 if (!isSelecting) return;

//                 const { latitude, longitude } =
//                   e.nativeEvent.coordinate;

//                 console.log(
//                   "🗺 Selected center:",
//                   latitude,
//                   longitude
//                 );

//                 setSelectedCenter({ latitude, longitude });
//               }}
//             >
//               {userLocation?.latitude != null &&
//                 userLocation?.longitude != null && (
//                   <Marker
//                     coordinate={{
//                       latitude: Number(
//                         userLocation.latitude
//                       ),
//                       longitude: Number(
//                         userLocation.longitude
//                       ),
//                     }}
//                     title={userName}
//                     pinColor={
//                       isOutside ? "red" : "green"
//                     }
//                   />
//                 )}

//               {safeZones.map((zone) => (
//                 <Circle
//                   key={zone.id}
//                   center={{
//                     latitude: Number(zone.center_lat),
//                     longitude: Number(zone.center_lng),
//                   }}
//                   radius={zone.radius_meters}
//                   strokeColor="rgba(0,150,255,0.8)"
//                   fillColor="rgba(0,150,255,0.2)"
//                 />
//               ))}

//               {selectedCenter && (
//                 <Circle
//                   center={selectedCenter}
//                   radius={radius}
//                   strokeColor="rgba(0,0,255,0.8)"
//                   fillColor="rgba(0,0,255,0.2)"
//                 />
//               )}
//             </MapView>
//           </View>

//           {/* STATUS CARD */}
//           <View style={styles.infoCard}>
//             <Text style={styles.userName}>
//               {userName}
//             </Text>

//             <Text
//               style={{
//                 color: isOutside ? "red" : "green",
//               }}
//             >
//               {isOutside
//                 ? "🚨 Outside Safe Zones"
//                 : "✅ Inside Safe Zone"}
//             </Text>

//             {lastUpdated && (
//               <Text style={styles.updateText}>
//                 Last Updated: {lastUpdated}
//               </Text>
//             )}
//           </View>

//           {/* RADIUS + BUTTONS */}
//           <View style={styles.radiusContainer}>
//             <Text style={{ fontWeight: "600" }}>
//               Set Radius:
//             </Text>

//             <View style={styles.radiusButtons}>
//               {[100, 300, 500, 1000].map((r) => (
//                 <Pressable
//                   key={r}
//                   onPress={() => setRadius(r)}
//                   style={[
//                     styles.radiusBtn,
//                     radius === r &&
//                       styles.radiusBtnActive,
//                   ]}
//                 >
//                   <Text>{r}m</Text>
//                 </Pressable>
//               ))}
//             </View>

//             {!isSelecting ? (
//               <Pressable
//                 style={styles.activateBtn}
//                 onPress={() => {
//                   setIsSelecting(true);
//                   setSelectedCenter(null);
//                 }}
//               >
//                 <Text style={{ color: "#fff" }}>
//                   Start Adding Safe Zone
//                 </Text>
//               </Pressable>
//             ) : (
//               <>
//                 <Pressable
//                   style={styles.activateBtn}
//                   onPress={activateSafeZone}
//                   disabled={!selectedCenter}
//                 >
//                   <Text style={{ color: "#fff" }}>
//                     Confirm Safe Zone
//                   </Text>
//                 </Pressable>

//                 <Pressable
//                   style={[
//                     styles.activateBtn,
//                     {
//                       backgroundColor: "gray",
//                       marginTop: 8,
//                     },
//                   ]}
//                   onPress={() => {
//                     setIsSelecting(false);
//                     setSelectedCenter(null);
//                   }}
//                 >
//                   <Text style={{ color: "#fff" }}>
//                     Cancel
//                   </Text>
//                 </Pressable>
//               </>
//             )}
//           </View>
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
//   Platform,
//   Alert,
// } from "react-native";
import { View, Text, Pressable, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"
import { guardianStyles as styles } from "@/styles/guardian";
import { useState, useEffect } from "react";
import { supabase } from "@/supabase/supabase";
//import type { MapPressEvent } from "react-native-maps";
type MapPressEvent = {
  nativeEvent: {
    coordinate: {
      latitude: number;
      longitude: number;
    };
  };
};

let MapView: any;
let Marker: any;
let Circle: any;

if (Platform.OS !== "web") {
  const Maps = require("react-native-maps");
  MapView = Maps.default;
  Marker = Maps.Marker;
  Circle = Maps.Circle;
}

export default function GuardianScreen() {
  const [userLocation, setUserLocation] = useState<any>(null);
  const [safeZones, setSafeZones] = useState<any[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<any>(null);
  const [radius, setRadius] = useState(300);
  const [userName, setUserName] = useState("Loading...");
  const [linkedUserId, setLinkedUserId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState("");
  const [isOutside, setIsOutside] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  /* ---------------- Distance Calculator ---------------- */

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const checkOutsideZones = (lat: number, lng: number) => {
    if (safeZones.length === 0) {
      setIsOutside(false);
      return;
    }

    const inside = safeZones.some((zone) => {
      const distance = calculateDistance(
        zone.center_lat,
        zone.center_lng,
        lat,
        lng
      );
      return distance <= zone.radius_meters;
    });

    console.log("Inside any zone:", inside);
    setIsOutside(!inside);
  };

  /* ---------------- INIT ---------------- */

  useEffect(() => {
    const init = async () => {
      console.log("🔄 Guardian screen initializing...");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      console.log("🟢 Guardian ID:", user.id);

      const { data: link } = await supabase
        .from("help_app_guardian_links")
        .select("user_id")
        .eq("guardian_id", user.id)
        .eq("status", "approved")
        .maybeSingle();

      console.log("🔗 Link result:", link);

      if (!link) return;

      setLinkedUserId(link.user_id);

      const { data: profile } = await supabase
        .from("help_app_profiles")
        .select("name")
        .eq("id", link.user_id)
        .maybeSingle();

      if (profile?.name) setUserName(profile.name);

      const { data: zones } = await supabase
        .from("help_app_safe_zones")
        .select("*")
        .eq("guardian_id", user.id)
        .eq("user_id", link.user_id)
        .eq("active", true);

      console.log("🛑 Safe zones fetched:", zones);

      if (zones) setSafeZones(zones);

      const { data: latestLocation } = await supabase
        .from("help_app_user_locations")
        .select("*")
        .eq("user_id", link.user_id)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log("📍 Latest location:", latestLocation);

      if (latestLocation) {
        const lat =
          latestLocation.latitude ?? latestLocation.lat ?? null;
        const lng =
          latestLocation.longitude ?? latestLocation.lng ?? null;

        if (lat != null && lng != null) {
          setUserLocation({
            latitude: Number(lat),
            longitude: Number(lng),
          });

          setLastUpdated(
            new Date(
              latestLocation.recorded_at
            ).toLocaleTimeString()
          );

          checkOutsideZones(Number(lat), Number(lng));
        }
      }

      supabase
        .channel("guardian-live-location")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "help_app_user_locations",
            filter: `user_id=eq.${link.user_id}`,
          },
          (payload) => {
            console.log("📡 Realtime:", payload.new);

            const lat =
              payload.new.latitude ?? payload.new.lat ?? null;
            const lng =
              payload.new.longitude ?? payload.new.lng ?? null;

            if (lat != null && lng != null) {
              setUserLocation({
                latitude: Number(lat),
                longitude: Number(lng),
              });

              setLastUpdated(
                new Date(
                  payload.new.recorded_at
                ).toLocaleTimeString()
              );

              checkOutsideZones(Number(lat), Number(lng));
            }
          }
        )
        .subscribe();
    };

    init();
  }, []);

  useEffect(() => {
    if (isOutside && safeZones.length > 0) {
      Alert.alert("🚨 Alert", `${userName} left your safe zones!`);
    }
  }, [isOutside]);

  /* ---------------- Add Safe Zone ---------------- */

  const activateSafeZone = async () => {
    if (!selectedCenter || !linkedUserId) {
      Alert.alert("Select a location first.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("help_app_safe_zones")
      .insert({
        guardian_id: user.id,
        user_id: linkedUserId,
        center_lat: selectedCenter.latitude,
        center_lng: selectedCenter.longitude,
        radius_meters: radius,
        active: true,
      })
      .select()
      .single();

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    setSafeZones((prev) => [...prev, data]);
    setSelectedCenter(null);
    setIsSelecting(false);

    if (userLocation) {
      checkOutsideZones(
        userLocation.latitude,
        userLocation.longitude
      );
    }

    Alert.alert("✅ Safe Zone Added");
  };

  /* ---------------- UI ---------------- */

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Guardian View</Text>

      {Platform.OS !== "web" && (
        <>
          {isSelecting && (
            <Text
              style={{
                textAlign: "center",
                color: "blue",
                marginVertical: 5,
              }}
            >
              Tap on map to choose safe zone center
            </Text>
          )}

          <View style={styles.map}>
            <MapView
              style={{ flex: 1 }}
              region={{
                latitude:
                  userLocation?.latitude ?? 28.6139,
                longitude:
                  userLocation?.longitude ?? 77.209,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              onPress={(e: MapPressEvent) => {
                if (!isSelecting) return;

                const { latitude, longitude } =
                  e.nativeEvent.coordinate;

                console.log(
                  "🗺 Selected center:",
                  latitude,
                  longitude
                );

                setSelectedCenter({ latitude, longitude });
              }}
            >
              {userLocation?.latitude != null &&
                userLocation?.longitude != null && (
                  <Marker
                    coordinate={{
                      latitude: Number(
                        userLocation.latitude
                      ),
                      longitude: Number(
                        userLocation.longitude
                      ),
                    }}
                    title={userName}
                    pinColor={
                      isOutside ? "red" : "green"
                    }
                  />
                )}

              {safeZones.map((zone) => (
                <Circle
                  key={zone.id}
                  center={{
                    latitude: Number(zone.center_lat),
                    longitude: Number(zone.center_lng),
                  }}
                  radius={zone.radius_meters}
                  strokeColor="rgba(0,150,255,0.8)"
                  fillColor="rgba(0,150,255,0.2)"
                />
              ))}

              {selectedCenter && (
                <Circle
                  center={selectedCenter}
                  radius={radius}
                  strokeColor="rgba(0,0,255,0.8)"
                  fillColor="rgba(0,0,255,0.2)"
                />
              )}
            </MapView>
          </View>

          {/* STATUS CARD */}
          <View style={styles.infoCard}>
            <Text style={styles.userName}>
              {userName}
            </Text>

            <Text
              style={{
                color: isOutside ? "red" : "green",
              }}
            >
              {isOutside
                ? "🚨 Outside Safe Zones"
                : "✅ Inside Safe Zone"}
            </Text>

            {lastUpdated && (
              <Text style={styles.updateText}>
                Last Updated: {lastUpdated}
              </Text>
            )}
          </View>

          {/* RADIUS + BUTTONS */}
          <View style={styles.radiusContainer}>
            <Text style={{ fontWeight: "600" }}>
              Set Radius:
            </Text>

            <View style={styles.radiusButtons}>
              {[100, 300, 500, 1000].map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRadius(r)}
                  style={[
                    styles.radiusBtn,
                    radius === r &&
                      styles.radiusBtnActive,
                  ]}
                >
                  <Text>{r}m</Text>
                </Pressable>
              ))}
            </View>

            {!isSelecting ? (
              <Pressable
                style={styles.activateBtn}
                onPress={() => {
                  setIsSelecting(true);
                  setSelectedCenter(null);
                }}
              >
                <Text style={{ color: "#fff" }}>
                  Start Adding Safe Zone
                </Text>
              </Pressable>
            ) : (
              <>
                <Pressable
                  style={styles.activateBtn}
                  onPress={activateSafeZone}
                  disabled={!selectedCenter}
                >
                  <Text style={{ color: "#fff" }}>
                    Confirm Safe Zone
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.activateBtn,
                    {
                      backgroundColor: "gray",
                      marginTop: 8,
                    },
                  ]}
                  onPress={() => {
                    setIsSelecting(false);
                    setSelectedCenter(null);
                  }}
                >
                  <Text style={{ color: "#fff" }}>
                    Cancel
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
