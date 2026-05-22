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
// import * as Haptics from "expo-haptics";
// import * as Speech from "expo-speech";
// import { useEffect, useState, useRef, useCallback } from "react";
// import { supabase } from "@/supabase/supabase";

// let MapView: any;
// let Marker: any;
// let Polyline: any;

// if (Platform.OS !== "web") {
//   const Maps = require("react-native-maps");
//   MapView = Maps.default;
//   Marker = Maps.Marker;
//   Polyline = Maps.Polyline;
// }

// type MapPressEvent = {
//   nativeEvent: {
//     coordinate: {
//       latitude: number;
//       longitude: number;
//     };
//   };
// };

// export default function TakeMeHomeScreen() {
//   const router = useRouter();
//   const mapRef = useRef<any>(null);
//   const hasLoaded = useRef(false);

//   const [currentLocation, setCurrentLocation] = useState<any>(null);
//   const [homeLocation, setHomeLocation] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [navigating, setNavigating] = useState(false);

//   // Edit home state
//   const [isEditingHome, setIsEditingHome] = useState(false);
//   const [pendingHome, setPendingHome] = useState<any>(null);
//   const [savingHome, setSavingHome] = useState(false);

//   /* ---------------- VOICE HELPER ---------------- */

//   const speak = (text: string) => {
//     Speech.stop();
//     Speech.speak(text, { rate: 0.95, pitch: 1.0 });
//   };

//   /* ---------------- LOAD DATA ---------------- */

//   const loadData = useCallback(async () => {
//     if (hasLoaded.current) return;
//     hasLoaded.current = true;

//     try {
//       setLoading(true);

//       const { status } = await Location.requestForegroundPermissionsAsync();

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

//       // Fetch saved home from dedicated home table column (is_home = true)
//       const { data } = await supabase
//         .from("help_app_user_locations")
//         .select("lat, lng")
//         .eq("user_id", user.id)
//         .eq("is_home", true)
//         .maybeSingle();

//       if (!data) {
//         // No home set yet — prompt user to set one
//         setLoading(false);
//         return;
//       }

//       const homeCoords = {
//         latitude: Number(data.lat),
//         longitude: Number(data.lng),
//       };

//       setHomeLocation(homeCoords);

//       setTimeout(() => {
//         mapRef.current?.fitToCoordinates([userCoords, homeCoords], {
//           edgePadding: { top: 100, right: 80, bottom: 100, left: 80 },
//           animated: true,
//         });
//       }, 600);
//     } catch {
//       Alert.alert("Something went wrong.");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadData();
//   }, [loadData]);

//   /* ---------------- SAVE HOME LOCATION ---------------- */

//   const saveHomeLocation = async (coords: {
//     latitude: number;
//     longitude: number;
//   }) => {
//     setSavingHome(true);

//     try {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();

//       if (!user) return;

//       // Check if a home row already exists for this user
//       const { data: existing } = await supabase
//         .from("help_app_user_locations")
//         .select("id")
//         .eq("user_id", user.id)
//         .eq("is_home", true)
//         .maybeSingle();

//       let error;

//       if (existing) {
//         // Update the existing home row
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
//         // Insert a new home row
//         const { error: insertError } = await supabase
//           .from("help_app_user_locations")
//           .insert({
//             user_id: user.id,
//             lat: coords.latitude,
//             lng: coords.longitude,
//             is_home: true,
//             recorded_at: new Date().toISOString(),
//           });
//         error = insertError;
//       }

//       if (error) {
//         Alert.alert("Error saving home", error.message);
//         return;
//       }

//       setHomeLocation(coords);
//       setPendingHome(null);
//       setIsEditingHome(false);

//       speak("Home location saved.");
//       Alert.alert("✅ Home location saved!");

//       // Fit map to show both locations
//       if (currentLocation) {
//         setTimeout(() => {
//           mapRef.current?.fitToCoordinates([currentLocation, coords], {
//             edgePadding: { top: 100, right: 80, bottom: 100, left: 80 },
//             animated: true,
//           });
//         }, 400);
//       }
//     } catch {
//       Alert.alert("Something went wrong saving home.");
//     } finally {
//       setSavingHome(false);
//     }
//   };

//   /* ---------------- USE CURRENT LOCATION AS HOME ---------------- */

//   const useCurrentLocationAsHome = async () => {
//     if (!currentLocation) {
//       Alert.alert("Current location not available yet.");
//       return;
//     }

//     Alert.alert(
//       "Set Home Here?",
//       "Use your current location as your home address?",
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Yes, Set Home",
//           onPress: () => saveHomeLocation(currentLocation),
//         },
//       ]
//     );
//   };

//   /* ---------------- START NAVIGATION ---------------- */

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
//       Alert.alert("Could not open maps app.");
//     } finally {
//       setNavigating(false);
//     }
//   };

//   /* ---------------- GUARDIAN ALERT ---------------- */

//   const alertGuardian = async () => {
//     await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
//     speak("Emergency alert sent to guardian.");
//     Alert.alert("🚨 Guardian Alert Sent");
//   };

//   /* ---------------- LOADING ---------------- */

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <ActivityIndicator size="large" />
//       </SafeAreaView>
//     );
//   }

//   /* ---------------- UI ---------------- */

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

//       {Platform.OS !== "web" && (
//         <>
//           {/* EDIT HOME HINT */}
//           {isEditingHome && (
//             <Text
//               style={{
//                 textAlign: "center",
//                 color: "#1A73E8",
//                 marginVertical: 6,
//                 fontSize: 13,
//               }}
//             >
//               Tap on the map to pin your home location
//             </Text>
//           )}

//           {/* MAP */}
//           <View style={styles.map}>
//             <MapView
//               ref={mapRef}
//               style={{ flex: 1 }}
//               provider="google"
//               showsUserLocation
//               followsUserLocation={!isEditingHome}
//               initialRegion={{
//                 latitude: currentLocation?.latitude ?? 28.6139,
//                 longitude: currentLocation?.longitude ?? 77.209,
//                 latitudeDelta: 0.05,
//                 longitudeDelta: 0.05,
//               }}
//               onPress={(e: MapPressEvent) => {
//                 if (!isEditingHome) return;
//                 const { latitude, longitude } = e.nativeEvent.coordinate;
//                 setPendingHome({ latitude, longitude });
//               }}
//             >
//               {/* HOME MARKER — show pending pin while editing, else saved home */}
//               {(pendingHome || homeLocation) && (
//                 <Marker
//                   coordinate={pendingHome ?? homeLocation}
//                   title={pendingHome ? "New Home (tap Confirm)" : "Home"}
//                   description="Your saved home location"
//                   pinColor="red"
//                 />
//               )}

//               {/* ROUTE LINE */}
//               {currentLocation && homeLocation && !isEditingHome && (
//                 <Polyline
//                   coordinates={[currentLocation, homeLocation]}
//                   strokeWidth={5}
//                   strokeColor="#1A73E8"
//                 />
//               )}
//             </MapView>
//           </View>

//           {/* INFO CARD */}
//           {!isEditingHome ? (
//             <View style={styles.card}>
//               <Text style={styles.direction}>📍 You → 🏠 Home</Text>
//               <Text style={styles.sub}>
//                 {homeLocation
//                   ? "Follow the blue route to reach your saved home"
//                   : "No home set yet — tap Edit Home to add one"}
//               </Text>
//             </View>
//           ) : (
//             <View style={styles.card}>
//               <Text style={styles.direction}>📌 Set Home Location</Text>
//               <Text style={styles.sub}>
//                 {pendingHome
//                   ? "Location pinned — confirm or tap again to move"
//                   : "Tap anywhere on the map to pin your home"}
//               </Text>
//             </View>
//           )}

//           {/* EDIT HOME BUTTONS */}
//           {!isEditingHome ? (
//             <Pressable
//               style={{
//                 backgroundColor: "#f0f4ff",
//                 borderColor: "#1A73E8",
//                 borderWidth: 1,
//                 borderRadius: 12,
//                 paddingVertical: 12,
//                 marginHorizontal: 16,
//                 marginBottom: 10,
//                 alignItems: "center",
//               }}
//               onPress={() => {
//                 setIsEditingHome(true);
//                 setPendingHome(null);
//               }}
//             >
//               <Text style={{ color: "#1A73E8", fontWeight: "600" }}>
//                 ✏️ Edit Home Location
//               </Text>
//             </Pressable>
//           ) : (
//             <View style={{ marginHorizontal: 16, marginBottom: 10, gap: 8 }}>
//               {/* Use Current Location */}
//               <Pressable
//                 style={{
//                   backgroundColor: "#e8f5e9",
//                   borderColor: "#34A853",
//                   borderWidth: 1,
//                   borderRadius: 12,
//                   paddingVertical: 12,
//                   alignItems: "center",
//                 }}
//                 onPress={useCurrentLocationAsHome}
//                 disabled={savingHome}
//               >
//                 <Text style={{ color: "#34A853", fontWeight: "600" }}>
//                   📍 Use My Current Location
//                 </Text>
//               </Pressable>

//               {/* Confirm pinned location */}
//               <Pressable
//                 style={{
//                   backgroundColor: pendingHome ? "#1A73E8" : "#ccc",
//                   borderRadius: 12,
//                   paddingVertical: 12,
//                   alignItems: "center",
//                 }}
//                 onPress={() => pendingHome && saveHomeLocation(pendingHome)}
//                 disabled={!pendingHome || savingHome}
//               >
//                 {savingHome ? (
//                   <ActivityIndicator color="#fff" />
//                 ) : (
//                   <Text style={{ color: "#fff", fontWeight: "600" }}>
//                     ✅ Confirm Pinned Location
//                   </Text>
//                 )}
//               </Pressable>

//               {/* Cancel */}
//               <Pressable
//                 style={{
//                   backgroundColor: "#f5f5f5",
//                   borderRadius: 12,
//                   paddingVertical: 12,
//                   alignItems: "center",
//                 }}
//                 onPress={() => {
//                   setIsEditingHome(false);
//                   setPendingHome(null);
//                 }}
//               >
//                 <Text style={{ color: "#666", fontWeight: "600" }}>
//                   Cancel
//                 </Text>
//               </Pressable>
//             </View>
//           )}

//           {/* NAVIGATION BUTTON — only show when not editing */}
//           {!isEditingHome && homeLocation && (
//             <Pressable
//               style={[styles.navBtn, navigating && styles.navBtnDisabled]}
//               onPress={startNavigation}
//               disabled={navigating}
//             >
//               {navigating ? (
//                 <ActivityIndicator color="#fff" />
//               ) : (
//                 <>
//                   <Text style={styles.navBtnText}>🧭 Start Navigation</Text>
//                   <Text style={styles.navBtnSub}>Opens in Google Maps</Text>
//                 </>
//               )}
//             </Pressable>
//           )}

//           {/* GUARDIAN ALERT */}
//           {!isEditingHome && (
//             <Pressable style={styles.alertBtn} onPress={alertGuardian}>
//               <Text style={styles.alertText}>🚨 Alert Guardian</Text>
//             </Pressable>
//           )}
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

type MapPressEvent = {
  nativeEvent: {
    coordinate: {
      latitude: number;
      longitude: number;
    };
  };
};

export default function TakeMeHomeScreen() {
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const hasLoaded = useRef(false);
  const hasAutoNavigated = useRef(false); // ✅ prevent double trigger

  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [homeLocation, setHomeLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);

  // Edit home state
  const [isEditingHome, setIsEditingHome] = useState(false);
  const [pendingHome, setPendingHome] = useState<any>(null);
  const [savingHome, setSavingHome] = useState(false);

  /* ---------------- VOICE HELPER ---------------- */

  const speak = (text: string) => {
    Speech.stop();
    Speech.speak(text, { rate: 0.95, pitch: 1.0 });
  };

  /* ---------------- START NAVIGATION ---------------- */

  const startNavigation = useCallback(
    async (coords?: { latitude: number; longitude: number }) => {
      const target = coords ?? homeLocation;
      if (!target || navigating) return;

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      speak("Starting navigation to home.");

      const { latitude, longitude } = target;
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
    },
    [homeLocation, navigating]
  );

  /* ---------------- LOAD DATA ---------------- */

  const loadData = useCallback(async () => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    try {
      setLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

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
        .eq("is_home", true)
        .maybeSingle();

      if (!data) {
        // No home set — skip auto navigation, let user set one
        setLoading(false);
        return;
      }

      const homeCoords = {
        latitude: Number(data.lat),
        longitude: Number(data.lng),
      };

      setHomeLocation(homeCoords);

      setTimeout(() => {
        mapRef.current?.fitToCoordinates([userCoords, homeCoords], {
          edgePadding: { top: 100, right: 80, bottom: 100, left: 80 },
          animated: true,
        });
      }, 600);

      // ✅ AUTO-START NAVIGATION immediately after loading home location
      if (!hasAutoNavigated.current) {
        hasAutoNavigated.current = true;
        await startNavigation(homeCoords);
      }
    } catch {
      Alert.alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ---------------- SAVE HOME LOCATION ---------------- */

  const saveHomeLocation = async (coords: {
    latitude: number;
    longitude: number;
  }) => {
    setSavingHome(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: existing } = await supabase
        .from("help_app_user_locations")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_home", true)
        .maybeSingle();

      let error;

      if (existing) {
        const { error: updateError } = await supabase
          .from("help_app_user_locations")
          .update({
            lat: coords.latitude,
            lng: coords.longitude,
            recorded_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("help_app_user_locations")
          .insert({
            user_id: user.id,
            lat: coords.latitude,
            lng: coords.longitude,
            is_home: true,
            recorded_at: new Date().toISOString(),
          });
        error = insertError;
      }

      if (error) {
        Alert.alert("Error saving home", error.message);
        return;
      }

      setHomeLocation(coords);
      setPendingHome(null);
      setIsEditingHome(false);

      speak("Home location saved.");
      Alert.alert("✅ Home location saved!");

      if (currentLocation) {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates([currentLocation, coords], {
            edgePadding: { top: 100, right: 80, bottom: 100, left: 80 },
            animated: true,
          });
        }, 400);
      }
    } catch {
      Alert.alert("Something went wrong saving home.");
    } finally {
      setSavingHome(false);
    }
  };

  /* ---------------- USE CURRENT LOCATION AS HOME ---------------- */

  const useCurrentLocationAsHome = async () => {
    if (!currentLocation) {
      Alert.alert("Current location not available yet.");
      return;
    }

    Alert.alert(
      "Set Home Here?",
      "Use your current location as your home address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Set Home",
          onPress: () => saveHomeLocation(currentLocation),
        },
      ]
    );
  };

  /* ---------------- GUARDIAN ALERT ---------------- */

  const alertGuardian = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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

  /* ---------------- UI ---------------- */

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
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
          {/* EDIT HOME HINT */}
          {isEditingHome && (
            <Text
              style={{
                textAlign: "center",
                color: "#1A73E8",
                marginVertical: 6,
                fontSize: 13,
              }}
            >
              Tap on the map to pin your home location
            </Text>
          )}

          {/* MAP */}
          <View style={styles.map}>
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              provider="google"
              showsUserLocation
              followsUserLocation={!isEditingHome}
              initialRegion={{
                latitude: currentLocation?.latitude ?? 28.6139,
                longitude: currentLocation?.longitude ?? 77.209,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              onPress={(e: MapPressEvent) => {
                if (!isEditingHome) return;
                const { latitude, longitude } = e.nativeEvent.coordinate;
                setPendingHome({ latitude, longitude });
              }}
            >
              {(pendingHome || homeLocation) && (
                <Marker
                  coordinate={pendingHome ?? homeLocation}
                  title={pendingHome ? "New Home (tap Confirm)" : "Home"}
                  description="Your saved home location"
                  pinColor="red"
                />
              )}

              {currentLocation && homeLocation && !isEditingHome && (
                <Polyline
                  coordinates={[currentLocation, homeLocation]}
                  strokeWidth={5}
                  strokeColor="#1A73E8"
                />
              )}
            </MapView>
          </View>

          {/* INFO CARD */}
          {!isEditingHome ? (
            <View style={styles.card}>
              <Text style={styles.direction}>📍 You → 🏠 Home</Text>
              <Text style={styles.sub}>
                {homeLocation
                  ? "Navigation launched — follow Google Maps to get home"
                  : "No home set yet — tap Edit Home to add one"}
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.direction}>📌 Set Home Location</Text>
              <Text style={styles.sub}>
                {pendingHome
                  ? "Location pinned — confirm or tap again to move"
                  : "Tap anywhere on the map to pin your home"}
              </Text>
            </View>
          )}

          {/* EDIT HOME BUTTONS */}
          {!isEditingHome ? (
            <Pressable
              style={{
                backgroundColor: "#f0f4ff",
                borderColor: "#1A73E8",
                borderWidth: 1,
                borderRadius: 12,
                paddingVertical: 12,
                marginHorizontal: 16,
                marginBottom: 10,
                alignItems: "center",
              }}
              onPress={() => {
                setIsEditingHome(true);
                setPendingHome(null);
              }}
            >
              <Text style={{ color: "#1A73E8", fontWeight: "600" }}>
                ✏️ Edit Home Location
              </Text>
            </Pressable>
          ) : (
            <View style={{ marginHorizontal: 16, marginBottom: 10, gap: 8 }}>
              <Pressable
                style={{
                  backgroundColor: "#e8f5e9",
                  borderColor: "#34A853",
                  borderWidth: 1,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
                onPress={useCurrentLocationAsHome}
                disabled={savingHome}
              >
                <Text style={{ color: "#34A853", fontWeight: "600" }}>
                  📍 Use My Current Location
                </Text>
              </Pressable>

              <Pressable
                style={{
                  backgroundColor: pendingHome ? "#1A73E8" : "#ccc",
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
                onPress={() => pendingHome && saveHomeLocation(pendingHome)}
                disabled={!pendingHome || savingHome}
              >
                {savingHome ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    ✅ Confirm Pinned Location
                  </Text>
                )}
              </Pressable>

              <Pressable
                style={{
                  backgroundColor: "#f5f5f5",
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
                onPress={() => {
                  setIsEditingHome(false);
                  setPendingHome(null);
                }}
              >
                <Text style={{ color: "#666", fontWeight: "600" }}>
                  Cancel
                </Text>
              </Pressable>
            </View>
          )}

          {/* NAVIGATION BUTTON — manual re-launch */}
          {!isEditingHome && homeLocation && (
            <Pressable
              style={[styles.navBtn, navigating && styles.navBtnDisabled]}
              onPress={() => startNavigation()}
              disabled={navigating}
            >
              {navigating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.navBtnText}>🧭 Relaunch Navigation</Text>
                  <Text style={styles.navBtnSub}>Opens in Google Maps</Text>
                </>
              )}
            </Pressable>
          )}

          {/* GUARDIAN ALERT */}
          {!isEditingHome && (
            <Pressable style={styles.alertBtn} onPress={alertGuardian}>
              <Text style={styles.alertText}>🚨 Alert Guardian</Text>
            </Pressable>
          )}
        </>
      )}
    </SafeAreaView>
  );
}