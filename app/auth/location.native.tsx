// import { View, Text, SafeAreaView, Pressable } from "react-native";
// import { useEffect, useState } from "react";
// import MapView, { Marker } from "react-native-maps";
// import { useRouter } from "expo-router";
// import { getCurrentLocation } from "../services/location";

// export default function SetHomeLocationScreen() {
//   const router = useRouter();
//   const [location, setLocation] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);

//   useEffect(() => {
//     (async () => {
//       const loc = await getCurrentLocation();
//       setLocation(loc);
//     })();
//   }, []);

//   if (!location) {
//     return (
//       <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
//         <Text>Fetching your location…</Text>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={{ flex: 1 }}>
//       <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 16 }}>
//         <Pressable onPress={() => router.back()}>
//           <Text style={{ fontSize: 20 }}>←</Text>
//         </Pressable>
//         <Text style={{ fontSize: 18, fontWeight: "600" }}>Set Home Location</Text>
//         <View style={{ width: 20 }} />
//       </View>

//       <MapView
//         style={{ flex: 1 }}
//         initialRegion={{
//           latitude: location.latitude,
//           longitude: location.longitude,
//           latitudeDelta: 0.01,
//           longitudeDelta: 0.01,
//         }}
//         showsUserLocation
//       >
//         <Marker
//           draggable
//           coordinate={location}
//           onDragEnd={(e) => setLocation(e.nativeEvent.coordinate)}
//         />
//       </MapView>

//       <Pressable
//         style={{ backgroundColor: "#000", padding: 16, alignItems: "center" }}
//         onPress={() => router.replace("/take-me-home")}
//       >
//         <Text style={{ color: "#fff", fontSize: 16 }}>
//           Confirm Home Location
//         </Text>
//       </Pressable>
//     </SafeAreaView>
//   );
// }
