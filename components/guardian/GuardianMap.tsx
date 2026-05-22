
// import React, { useMemo } from "react";
// import {
//   View,
//   Text,
//   Pressable,
//   ActivityIndicator,
//   StyleSheet,
// } from "react-native";
// import MapView, { Marker, Circle } from "react-native-maps";
// import { HOME_RADIUS_METERS } from "./distanceUtils";
// import { MapMode, SafeZone } from "./useGuardianState";

// type LatLng = { latitude: number; longitude: number };

// interface Props {
//   mapRef: React.RefObject<MapView | null>;
//   mapExpanded: boolean;
//   onToggleExpand: () => void;

//   initialRegion: {
//     latitude: number;
//     longitude: number;
//     latitudeDelta: number;
//     longitudeDelta: number;
//   };

//   userLocation: LatLng | null;
//   homeLocation: LatLng | null;
//   pendingHome: LatLng | null;
//   safeZones: SafeZone[];
//   selectedCenter: LatLng | null;
//   radius: number;
//   mapMode: MapMode;
//   isOutside: boolean;
//   isFollowing: boolean;
//   savingHome: boolean;
//   selectedUserName: string;

//   editingZone: SafeZone | null;
//   editCenter: LatLng | null;
//   editRadius: number;

//   onMapPress: (e: any) => void;
//   onPanDrag: () => void;
//   onToggleFollow: () => void;
//   onLocateUser: () => void;
//   onSetHomeAtUserLocation: () => void;
//   onEditZone: (zone: SafeZone) => void;
// }

// export function GuardianMap({
//   mapRef,
//   mapExpanded,
//   onToggleExpand,
//   initialRegion,
//   userLocation,
//   homeLocation,
//   pendingHome,
//   safeZones,
//   selectedCenter,
//   radius,
//   mapMode,
//   isOutside,
//   isFollowing,
//   savingHome,
//   selectedUserName,
//   editingZone,
//   editCenter,
//   editRadius,
//   onMapPress,
//   onPanDrag,
//   onToggleFollow,
//   onLocateUser,
//   onSetHomeAtUserLocation,
//   onEditZone,
// }: Props) {
//   const userDotStyle = useMemo(
//     () => [styles.userDot, { backgroundColor: isOutside ? "#ef4444" : "#16a34a" }],
//     [isOutside]
//   );

//   return (
//     <View style={styles.mapContainer}>
//       <MapView
//         ref={mapRef}
//         style={{ flex: 1 }} // ✅ FIXED (instead of absoluteFillObject)
//         initialRegion={initialRegion}
//         onPress={onMapPress}
//         onPanDrag={onPanDrag}
//         showsUserLocation={false}
//         scrollEnabled={true}
//         zoomEnabled={true}
//         pitchEnabled={true}
//         rotateEnabled={true}
//       >
//         {/* 👤 User */}
//         {userLocation && (
//           <Marker coordinate={userLocation} title={selectedUserName}>
//             <View style={userDotStyle} />
//           </Marker>
//         )}

//         {/* 🔵 Safe Zones */}
//         {safeZones.map((z, index) => {
//           const isBeingEdited = editingZone?.id === z.id;
//           return (
//             <React.Fragment key={`zone-${z.id}`}>
//               <Circle
//                 center={{
//                   latitude: Number(z.center_lat),
//                   longitude: Number(z.center_lng),
//                 }}
//                 radius={z.radius_meters}
//                 strokeColor={isBeingEdited ? "#f59e0b" : "#0096ff"}
//                 strokeWidth={isBeingEdited ? 3 : 2}
//                 fillColor={
//                   isBeingEdited
//                     ? "rgba(245,158,11,0.2)"
//                     : "rgba(0,150,255,0.15)"
//                 }
//               />

//               <Marker
//                 coordinate={{
//                   latitude: Number(z.center_lat),
//                   longitude: Number(z.center_lng),
//                 }}
//                 onPress={() => onEditZone(z)}
//               >
//                 <View
//                   style={[
//                     styles.zoneCenterDot,
//                     isBeingEdited && styles.zoneCenterDotEditing,
//                   ]}
//                 />
//               </Marker>
//             </React.Fragment>
//           );
//         })}

//         {/* 🏠 Home */}
//         {homeLocation && (
//           <>
//             <Marker coordinate={homeLocation}>
//               <Text style={styles.emojiMarker}>🏠</Text>
//             </Marker>
//             <Circle
//               center={homeLocation}
//               radius={HOME_RADIUS_METERS}
//               strokeColor="#f97316"
//               strokeWidth={2}
//               fillColor="rgba(249,115,22,0.15)"
//             />
//           </>
//         )}

//         {/* Safe Zone Preview */}
//         {selectedCenter && mapMode === "safeZone" && (
//           <>
//             <Marker coordinate={selectedCenter}>
//               <View style={styles.pendingDot} />
//             </Marker>
//             <Circle
//               center={selectedCenter}
//               radius={radius}
//               strokeColor="#3b82f6"
//               strokeWidth={2}
//               fillColor="rgba(59,130,246,0.2)"
//             />
//           </>
//         )}

//         {/* Edit Zone */}
//         {editCenter && mapMode === "editSafeZone" && (
//           <>
//             <Marker coordinate={editCenter}>
//               <View style={styles.editPendingDot} />
//             </Marker>
//             <Circle
//               center={editCenter}
//               radius={editRadius}
//               strokeColor="#f59e0b"
//               strokeWidth={2}
//               fillColor="rgba(245,158,11,0.2)"
//             />
//           </>
//         )}

//         {/* Pending Home */}
//         {pendingHome && mapMode === "setHome" && (
//           <Marker coordinate={pendingHome}>
//             <Text style={styles.emojiMarkerPending}>🏠</Text>
//           </Marker>
//         )}
//       </MapView>

//       {/* ✅ FIXED: allow touches to pass to map */}
//       <View style={styles.fabContainer} pointerEvents="box-none">
//         <Pressable
//           style={[
//             styles.fabBtn,
//             styles.fabFollow,
//             isFollowing && styles.fabFollowActive,
//           ]}
//           onPress={onToggleFollow}
//         >
//           <Text style={styles.fabText}>
//             {isFollowing ? "🔒 Following" : "🔓 Follow"}
//           </Text>
//         </Pressable>

//         <Pressable
//           style={[styles.fabBtn, !userLocation && styles.fabDisabled]}
//           onPress={onLocateUser}
//           disabled={!userLocation}
//         >
//           <Text style={styles.fabText}>📍 Go to User</Text>
//         </Pressable>

//         <Pressable
//           style={[
//             styles.fabBtn,
//             styles.fabHome,
//             (!userLocation || savingHome) && styles.fabDisabled,
//           ]}
//           onPress={onSetHomeAtUserLocation}
//           disabled={!userLocation || savingHome}
//         >
//           {savingHome ? (
//             <ActivityIndicator size="small" color="#fff" />
//           ) : (
//             <Text style={styles.fabText}>🏠 Set Home</Text>
//           )}
//         </Pressable>

//         <Pressable
//           style={[styles.fabBtn, styles.expandBtn]}
//           onPress={onToggleExpand}
//         >
//           <Text style={styles.fabText}>
//             {mapExpanded ? "⬇ Minimize" : "⬆ Expand"}
//           </Text>
//         </Pressable>
//       </View>

//       {/* ✅ FIXED: allow map interaction */}
//       {mapMode !== "none" && (
//         <View style={styles.modeBanner} pointerEvents="box-none">
//           <Text style={styles.modeBannerText}>
//             {mapMode === "safeZone" && "📍 Tap map to place safe zone"}
//             {mapMode === "editSafeZone" && "📍 Tap map to move zone center"}
//             {mapMode === "setHome" && "🏠 Tap map to set home location"}
//           </Text>
//         </View>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   mapContainer: { flex: 1 },

//   userDot: {
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     borderWidth: 2,
//     borderColor: "#fff",
//   },

//   zoneCenterDot: {
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     backgroundColor: "#0096ff",
//     borderWidth: 2,
//     borderColor: "#fff",
//   },

//   zoneCenterDotEditing: {
//     backgroundColor: "#f59e0b",
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//   },

//   pendingDot: {
//     width: 14,
//     height: 14,
//     borderRadius: 7,
//     backgroundColor: "#3b82f6",
//     borderWidth: 2,
//     borderColor: "#fff",
//   },

//   editPendingDot: {
//     width: 14,
//     height: 14,
//     borderRadius: 7,
//     backgroundColor: "#f59e0b",
//     borderWidth: 2,
//     borderColor: "#fff",
//   },

//   emojiMarker: { fontSize: 26 },
//   emojiMarkerPending: { fontSize: 26, opacity: 0.7 },

//   fabContainer: {
//     position: "absolute",
//     top: 14,
//     right: 14,
//     gap: 10,
//   },

//   fabBtn: {
//     backgroundColor: "#16a34a",
//     paddingHorizontal: 14,
//     paddingVertical: 9,
//     borderRadius: 24,
//   },

//   fabText: {
//     color: "#fff",
//     fontWeight: "700",
//     fontSize: 13,
//   },

//   fabHome: { backgroundColor: "#e67e22" },
//   fabFollow: { backgroundColor: "#64748b" },
//   fabFollowActive: { backgroundColor: "#2563eb" },
//   fabDisabled: { backgroundColor: "#aaa", opacity: 0.6 },
//   expandBtn: { backgroundColor: "rgba(0,0,0,0.7)" },

//   modeBanner: {
//     position: "absolute",
//     bottom: 12,
//     alignSelf: "center",
//     backgroundColor: "rgba(0,0,0,0.7)",
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//   },

//   modeBannerText: {
//     color: "#fff",
//     fontWeight: "600",
//     fontSize: 13,
//   },
// });

import React, { useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import { HOME_RADIUS_METERS } from "./distanceUtils";
import { MapMode, SafeZone } from "./useGuardianState";

type LatLng = { latitude: number; longitude: number };

interface Props {
  mapRef: React.RefObject<MapView | null>;

  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };

  userLocation: LatLng | null;
  homeLocation: LatLng | null;
  pendingHome: LatLng | null;
  safeZones: SafeZone[];
  selectedCenter: LatLng | null;
  radius: number;
  mapMode: MapMode;
  isOutside: boolean;
  isFollowing: boolean;
  savingHome: boolean;
  selectedUserName: string;

  editingZone: SafeZone | null;
  editCenter: LatLng | null;
  editRadius: number;

  fabTopOffset?: number;

  onMapPress: (e: any) => void;
  onPanDrag: () => void;
  onToggleFollow: () => void;
  onLocateUser: () => void;
  onSetHomeAtUserLocation: () => void;
  onEditZone: (zone: SafeZone) => void;
}

export function GuardianMap({
  mapRef,
  initialRegion,
  userLocation,
  homeLocation,
  pendingHome,
  safeZones,
  selectedCenter,
  radius,
  mapMode,
  isOutside,
  isFollowing,
  savingHome,
  selectedUserName,
  editingZone,
  editCenter,
  editRadius,
  fabTopOffset = 120,
  onMapPress,
  onPanDrag,
  onToggleFollow,
  onLocateUser,
  onSetHomeAtUserLocation,
  onEditZone,
}: Props) {
  const userDotStyle = useMemo(
    () => [styles.userDot, { backgroundColor: isOutside ? "#ef4444" : "#16a34a" }],
    [isOutside]
  );

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        onPress={onMapPress}
        onPanDrag={onPanDrag}
        showsUserLocation={false}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
      >
        {/* 👤 User */}
        {userLocation && (
          <Marker coordinate={userLocation} title={selectedUserName}>
            <View style={userDotStyle} />
          </Marker>
        )}

        {/* 🔵 Safe Zones */}
        {safeZones.map((z) => {
          const isBeingEdited = editingZone?.id === z.id;
          return (
            <React.Fragment key={`zone-${z.id}`}>
              <Circle
                center={{
                  latitude: Number(z.center_lat),
                  longitude: Number(z.center_lng),
                }}
                radius={z.radius_meters}
                strokeColor={isBeingEdited ? "#f59e0b" : "#0096ff"}
                strokeWidth={isBeingEdited ? 3 : 2}
                fillColor={
                  isBeingEdited
                    ? "rgba(245,158,11,0.2)"
                    : "rgba(0,150,255,0.15)"
                }
              />
              <Marker
                coordinate={{
                  latitude: Number(z.center_lat),
                  longitude: Number(z.center_lng),
                }}
                onPress={() => onEditZone(z)}
              >
                <View
                  style={[
                    styles.zoneCenterDot,
                    isBeingEdited && styles.zoneCenterDotEditing,
                  ]}
                />
              </Marker>
            </React.Fragment>
          );
        })}

        {/* 🏠 Home */}
        {homeLocation && (
          <>
            <Marker coordinate={homeLocation}>
              <Text style={styles.emojiMarker}>🏠</Text>
            </Marker>
            <Circle
              center={homeLocation}
              radius={HOME_RADIUS_METERS}
              strokeColor="#f97316"
              strokeWidth={2}
              fillColor="rgba(249,115,22,0.15)"
            />
          </>
        )}

        {/* Safe Zone Preview */}
        {selectedCenter && mapMode === "safeZone" && (
          <>
            <Marker coordinate={selectedCenter}>
              <View style={styles.pendingDot} />
            </Marker>
            <Circle
              center={selectedCenter}
              radius={radius}
              strokeColor="#3b82f6"
              strokeWidth={2}
              fillColor="rgba(59,130,246,0.2)"
            />
          </>
        )}

        {/* Edit Zone */}
        {editCenter && mapMode === "editSafeZone" && (
          <>
            <Marker coordinate={editCenter}>
              <View style={styles.editPendingDot} />
            </Marker>
            <Circle
              center={editCenter}
              radius={editRadius}
              strokeColor="#f59e0b"
              strokeWidth={2}
              fillColor="rgba(245,158,11,0.2)"
            />
          </>
        )}

        {/* Pending Home */}
        {pendingHome && mapMode === "setHome" && (
          <Marker coordinate={pendingHome}>
            <Text style={styles.emojiMarkerPending}>🏠</Text>
          </Marker>
        )}
      </MapView>

      {/* FABs */}
      <View
        style={[styles.fabContainer, { top: fabTopOffset }]}
        pointerEvents="box-none"
      >
        <Pressable
          style={[
            styles.fabBtn,
            styles.fabFollow,
            isFollowing && styles.fabFollowActive,
          ]}
          onPress={onToggleFollow}
        >
          <Text style={styles.fabText}>
            {isFollowing ? "🔒 Following" : "🔓 Follow"}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.fabBtn, !userLocation && styles.fabDisabled]}
          onPress={onLocateUser}
          disabled={!userLocation}
        >
          <Text style={styles.fabText}>📍 Go to User</Text>
        </Pressable>

        <Pressable
          style={[
            styles.fabBtn,
            styles.fabHome,
            (!userLocation || savingHome) && styles.fabDisabled,
          ]}
          onPress={onSetHomeAtUserLocation}
          disabled={!userLocation || savingHome}
        >
          {savingHome ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.fabText}>🏠 Set Home</Text>
          )}
        </Pressable>
      </View>

      {/* Mode banner */}
      {mapMode !== "none" && (
        <View style={styles.modeBanner} pointerEvents="box-none">
          <Text style={styles.modeBannerText}>
            {mapMode === "safeZone" && "📍 Tap map to place safe zone"}
            {mapMode === "editSafeZone" && "📍 Tap map to move zone center"}
            {mapMode === "setHome" && "🏠 Tap map to set home location"}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: { flex: 1 },

  userDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#fff",
  },

  zoneCenterDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#0096ff",
    borderWidth: 2,
    borderColor: "#fff",
  },

  zoneCenterDotEditing: {
    backgroundColor: "#f59e0b",
    width: 16,
    height: 16,
    borderRadius: 8,
  },

  pendingDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#3b82f6",
    borderWidth: 2,
    borderColor: "#fff",
  },

  editPendingDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#f59e0b",
    borderWidth: 2,
    borderColor: "#fff",
  },

  emojiMarker: { fontSize: 26 },
  emojiMarkerPending: { fontSize: 26, opacity: 0.7 },

  fabContainer: {
    position: "absolute",
    right: 14,
    gap: 10,
  },

  fabBtn: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
  },

  fabText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },

  fabHome: { backgroundColor: "#e67e22" },
  fabFollow: { backgroundColor: "#64748b" },
  fabFollowActive: { backgroundColor: "#2563eb" },
  fabDisabled: { backgroundColor: "#aaa", opacity: 0.6 },

  modeBanner: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },

  modeBannerText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
});