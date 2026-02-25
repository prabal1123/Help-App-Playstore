// import { useEffect, useState } from "react";
// import { View, StyleSheet } from "react-native";
// import MapView, { Marker } from "react-native-maps";
// import * as Location from "expo-location";

// export default function UserMap() {
//   const [location, setLocation] = useState<Location.LocationObject | null>(null);

//   useEffect(() => {
//     (async () => {
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== "granted") return;

//       const loc = await Location.getCurrentPositionAsync({});
//       setLocation(loc);

//       // update every 10 sec
//       const interval = setInterval(async () => {
//         const updatedLoc = await Location.getCurrentPositionAsync({});
//         setLocation(updatedLoc);
//       }, 10000);

//       return () => clearInterval(interval);
//     })();
//   }, []);

//   if (!location) return null;

//   return (
//     <View style={styles.container}>
//       <MapView
//         style={styles.map}
//         region={{
//           latitude: location.coords.latitude,
//           longitude: location.coords.longitude,
//           latitudeDelta: 0.01,
//           longitudeDelta: 0.01,
//         }}
//       >
//         <Marker
//           coordinate={{
//             latitude: location.coords.latitude,
//             longitude: location.coords.longitude,
//           }}
//           title="You"
//         />
//       </MapView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   map: { flex: 1 },
// });
