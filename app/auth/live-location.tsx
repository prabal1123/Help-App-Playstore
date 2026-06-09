// import { View, Text, Pressable, ActivityIndicator, Modal, FlatList } from "react-native";
// import { useEffect, useState, useRef } from "react";
// import MapView, { Marker } from "react-native-maps";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { useRouter } from "expo-router";
// import { supabase } from "@/supabase/supabase";

// type LinkedUser = {
//   user_id: string;
//   name: string;
// };

// export default function LiveLocation() {
//   const router = useRouter();
//   const [linkedUsers, setLinkedUsers] = useState<LinkedUser[]>([]);
//   const [selectedUser, setSelectedUser] = useState<LinkedUser | null>(null);
//   const [dropdownVisible, setDropdownVisible] = useState(false);
//   const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
//   const [lastUpdated, setLastUpdated] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [loadingUsers, setLoadingUsers] = useState(true);
//   const mapRef = useRef<MapView>(null);
//   const intervalRef = useRef<any>(null);

//   // ─── Fetch linked users ───────────────────────────────────────────────────
//   useEffect(() => {
//     const fetchLinkedUsers = async () => {
//       try {
//         const { data, error } = await supabase.auth.getUser();
//         if (error || !data?.user) return;

//         const { data: links } = await supabase
//           .from("help_app_guardian_links")
//           .select("user_id")
//           .eq("guardian_id", data.user.id)
//           .eq("status", "approved");

//         if (!links || links.length === 0) return;

//         const userIds = links.map((l: any) => l.user_id);
//         const { data: profiles } = await supabase
//           .from("help_app_profiles")
//           .select("id, name")
//           .in("id", userIds);

//         if (profiles) {
//           const users: LinkedUser[] = profiles.map((p: any) => ({
//             user_id: p.id,
//             name: p.name || "Unnamed User",
//           }));
//           setLinkedUsers(users);
//           if (users.length > 0) setSelectedUser(users[0]);
//         }
//       } catch (err) {
//         console.log("Fetch linked users error:", err);
//       } finally {
//         setLoadingUsers(false);
//       }
//     };
//     fetchLinkedUsers();
//   }, []);

//   // ─── Fetch location whenever selectedUser changes ─────────────────────────
//   useEffect(() => {
//     if (!selectedUser) return;

//     if (intervalRef.current) clearInterval(intervalRef.current);
//     setLocation(null);
//     setLoading(true);

//     const fetchLocation = async () => {
//       try {
//         const { data, error } = await supabase
//           .from("help_app_user_locations")
//           .select("*")
//           .eq("user_id", selectedUser.user_id)
//           .order("recorded_at", { ascending: false })
//           .limit(1)
//           .maybeSingle();

//         if (error) throw error;

//         if (data) {
//           const lat = data.latitude ?? data.lat;
//           const lng = data.longitude ?? data.lng;

//           if (lat != null && lng != null) {
//             const coords = {
//               latitude: Number(lat),
//               longitude: Number(lng),
//             };
//             setLocation(coords);
//             setLastUpdated(new Date(data.recorded_at).toLocaleTimeString());
//             mapRef.current?.animateToRegion(
//               { ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 },
//               800
//             );
//           }
//         }
//       } catch (err) {
//         console.log("Location fetch error:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchLocation();
//     intervalRef.current = setInterval(fetchLocation, 3000);
//     return () => clearInterval(intervalRef.current);
//   }, [selectedUser]);

//   // ─── Loading users ────────────────────────────────────────────────────────
//   if (loadingUsers) {
//     return (
//       <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <ActivityIndicator size="large" color="#2563eb" />
//         <Text style={{ marginTop: 12, color: "#555" }}>Loading users...</Text>
//       </SafeAreaView>
//     );
//   }

//   // ─── No linked users ──────────────────────────────────────────────────────
//   if (linkedUsers.length === 0) {
//     return (
//       <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
//         <Text style={{ fontSize: 40, marginBottom: 12 }}>👥</Text>
//         <Text style={{ fontSize: 17, fontWeight: "600", color: "#111", marginBottom: 6 }}>
//           No Linked Users
//         </Text>
//         <Text style={{ fontSize: 14, color: "#666", textAlign: "center", marginBottom: 24 }}>
//           No approved users found. Ask a user to add you as their guardian.
//         </Text>
//         <Pressable
//           onPress={() => router.back()}
//           style={{ backgroundColor: "#2563eb", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
//         >
//           <Text style={{ color: "#fff", fontWeight: "600" }}>← Go Back</Text>
//         </Pressable>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={{ flex: 1 }}>

//       {/* ─── HEADER: Back + Title ─── */}
//       <View style={{
//         flexDirection: "row",
//         alignItems: "center",
//         paddingHorizontal: 16,
//         paddingVertical: 10,
//         gap: 12,
//       }}>
//         <Pressable
//           onPress={() => router.back()}
//           style={{
//             backgroundColor: "#000",
//             paddingHorizontal: 14,
//             paddingVertical: 10,
//             borderRadius: 10,
//           }}
//         >
//           <Text style={{ color: "#fff", fontWeight: "600" }}>← Back</Text>
//         </Pressable>
//         <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f2f2f" }}>
//           Locate User
//         </Text>
//       </View>

//       {/* ─── USER SELECTOR ─── */}
//       <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
//         <Text style={{ fontSize: 12, fontWeight: "600", color: "#666", marginBottom: 4 }}>
//           TRACKING
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
//           style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 32 }}
//           onPress={() => setDropdownVisible(false)}
//         >
//           <View style={{ backgroundColor: "#fff", borderRadius: 16, overflow: "hidden" }}>
//             <Text style={{ padding: 16, fontWeight: "700", fontSize: 16, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" }}>
//               Select User to Track
//             </Text>
//             <FlatList
//               data={linkedUsers}
//               keyExtractor={(item) => item.user_id}
//               renderItem={({ item }) => (
//                 <Pressable
//                   onPress={() => {
//                     setSelectedUser(item);
//                     setDropdownVisible(false);
//                   }}
//                   style={{
//                     padding: 16,
//                     borderBottomWidth: 1,
//                     borderBottomColor: "#f9f9f9",
//                     backgroundColor: selectedUser?.user_id === item.user_id ? "#f0fdf4" : "#fff",
//                   }}
//                 >
//                   <Text style={{
//                     fontSize: 15,
//                     fontWeight: selectedUser?.user_id === item.user_id ? "700" : "400",
//                     color: "#333",
//                   }}>
//                     👤 {item.name}{selectedUser?.user_id === item.user_id ? "  ✓" : ""}
//                   </Text>
//                 </Pressable>
//               )}
//             />
//           </View>
//         </Pressable>
//       </Modal>

//       {/* ─── LOADING LOCATION ─── */}
//       {loading && (
//         <View style={{ alignItems: "center", paddingVertical: 12 }}>
//           <ActivityIndicator size="small" color="#2563eb" />
//           <Text style={{ color: "#555", marginTop: 6, fontSize: 13 }}>Fetching location...</Text>
//         </View>
//       )}

//       {/* ─── NO LOCATION ─── */}
//       {!loading && !location && (
//         <View style={{ alignItems: "center", paddingVertical: 20 }}>
//           <Text style={{ fontSize: 14, color: "#666" }}>
//             📍 No location data available for {selectedUser?.name} yet.
//           </Text>
//         </View>
//       )}

//       {/* ─── MAP ─── */}
//       {location && (
//         <View style={{ flex: 1 }}>
//           <MapView
//             ref={mapRef}
//             style={{ flex: 1 }}
//             initialRegion={{
//               latitude: location.latitude,
//               longitude: location.longitude,
//               latitudeDelta: 0.01,
//               longitudeDelta: 0.01,
//             }}
//           >
//             <Marker coordinate={location} title={selectedUser?.name || "User"}>
//               <View
//                 style={{
//                   width: 18,
//                   height: 18,
//                   borderRadius: 9,
//                   backgroundColor: "#16a34a",
//                   borderWidth: 2,
//                   borderColor: "#fff",
//                 }}
//               />
//             </Marker>
//           </MapView>

//           {/* ─── LAST UPDATED BADGE ─── */}
//           {lastUpdated && (
//             <View style={{
//               position: "absolute",
//               bottom: 20,
//               alignSelf: "center",
//               backgroundColor: "rgba(0,0,0,0.65)",
//               paddingHorizontal: 16,
//               paddingVertical: 8,
//               borderRadius: 20,
//             }}>
//               <Text style={{ color: "#fff", fontSize: 13 }}>🕐 Last updated: {lastUpdated}</Text>
//             </View>
//           )}
//         </View>
//       )}

//     </SafeAreaView>
//   );
// }

import { View, Text, Pressable, ActivityIndicator, Modal, FlatList } from "react-native";
import { useEffect, useState, useRef } from "react";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "@/supabase/supabase";
import { StatusCard } from "@/components/StatusCard"; // ← adjust path if needed

type LinkedUser = {
  user_id: string;
  name: string;
};

type Coordinate = {
  latitude: number;
  longitude: number;
};

type SafeZone = {
  id: string;
  latitude: number;
  longitude: number;
  radius: number;
};

// ─── Helper: distance in meters between two coords ───────────────────────────
function getDistanceMeters(a: Coordinate, b: Coordinate): number {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export default function LiveLocation() {
  const router = useRouter();

  // ─── Core state ──────────────────────────────────────────────────────────
  const [linkedUsers, setLinkedUsers]       = useState<LinkedUser[]>([]);
  const [selectedUser, setSelectedUser]     = useState<LinkedUser | null>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [location, setLocation]             = useState<Coordinate | null>(null);
  const [lastUpdated, setLastUpdated]       = useState("");
  const [loading, setLoading]               = useState(true);
  const [loadingUsers, setLoadingUsers]     = useState(true);

  // ─── StatusCard state ────────────────────────────────────────────────────
  const [homeLocation, setHomeLocation]     = useState<Coordinate | null>(null);
  const [safeZones, setSafeZones]           = useState<SafeZone[]>([]);
  const [isOutside, setIsOutside]           = useState(false);
  const [isAwayFromHome, setIsAwayFromHome] = useState(false);

  const mapRef     = useRef<MapView>(null);
  const intervalRef = useRef<any>(null);

  // ─── Fetch linked users ───────────────────────────────────────────────────
  useEffect(() => {
    const fetchLinkedUsers = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) return;

        const { data: links } = await supabase
          .from("help_app_guardian_links")
          .select("user_id")
          .eq("guardian_id", data.user.id)
          .eq("status", "approved");

        if (!links || links.length === 0) return;

        const userIds = links.map((l: any) => l.user_id);
        const { data: profiles } = await supabase
          .from("help_app_profiles")
          .select("id, name")
          .in("id", userIds);

        if (profiles) {
          const users: LinkedUser[] = profiles.map((p: any) => ({
            user_id: p.id,
            name: p.name || "Unnamed User",
          }));
          setLinkedUsers(users);
          if (users.length > 0) setSelectedUser(users[0]);
        }
      } catch (err) {
        console.log("Fetch linked users error:", err);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchLinkedUsers();
  }, []);

  // ─── Fetch home location & safe zones when selectedUser changes ───────────
  useEffect(() => {
    if (!selectedUser) return;

    // Reset status card state on user switch
    setHomeLocation(null);
    setSafeZones([]);
    setIsOutside(false);
    setIsAwayFromHome(false);

    const fetchHomeAndZones = async () => {
      try {
        // Home location
        const { data: homeData } = await supabase
          .from("help_app_home_locations")
          .select("latitude, longitude")
          .eq("user_id", selectedUser.user_id)
          .maybeSingle();

        if (homeData) {
          setHomeLocation({
            latitude: Number(homeData.latitude),
            longitude: Number(homeData.longitude),
          });
        }

        // Safe zones — columns: center_lat, center_lng, radius_meters
        const { data: zonesData } = await supabase
          .from("help_app_safe_zones")
          .select("id, center_lat, center_lng, radius_meters")
          .eq("user_id", selectedUser.user_id)
          .eq("active", true);

        if (zonesData) {
          setSafeZones(
            zonesData.map((z: any) => ({
              id: z.id,
              latitude: Number(z.center_lat),
              longitude: Number(z.center_lng),
              radius: Number(z.radius_meters),
            }))
          );
        }
      } catch (err) {
        console.log("Fetch home/zones error:", err);
      }
    };

    fetchHomeAndZones();
  }, [selectedUser]);

  // ─── Recompute isOutside & isAwayFromHome whenever location/zones/home change
  useEffect(() => {
    if (!location) return;

    // Outside safe zone check
    if (safeZones.length > 0) {
      const insideAny = safeZones.some(
        (z) => getDistanceMeters(location, z) <= z.radius
      );
      setIsOutside(!insideAny);
    } else {
      setIsOutside(false);
    }

    // Away from home check (threshold: 200 m)
    if (homeLocation) {
      setIsAwayFromHome(getDistanceMeters(location, homeLocation) > 200);
    } else {
      setIsAwayFromHome(false);
    }
  }, [location, safeZones, homeLocation]);

  // ─── Fetch location whenever selectedUser changes ─────────────────────────
  useEffect(() => {
    if (!selectedUser) return;

    if (intervalRef.current) clearInterval(intervalRef.current);
    setLocation(null);
    setLoading(true);

    const fetchLocation = async () => {
      try {
        const { data, error } = await supabase
          .from("help_app_user_locations")
          .select("*")
          .eq("user_id", selectedUser.user_id)
          .order("recorded_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const lat = data.latitude ?? data.lat;
          const lng = data.longitude ?? data.lng;

          if (lat != null && lng != null) {
            const coords: Coordinate = {
              latitude: Number(lat),
              longitude: Number(lng),
            };
            setLocation(coords);
            // setLastUpdated(new Date(data.recorded_at).toLocaleTimeString());
            setLastUpdated(new Date(data.recorded_at).toLocaleString());
            mapRef.current?.animateToRegion(
              { ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 },
              800
            );
          }
        }
      } catch (err) {
        console.log("Location fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
    intervalRef.current = setInterval(fetchLocation, 3000);
    return () => clearInterval(intervalRef.current);
  }, [selectedUser]);

  // ─── Loading users ────────────────────────────────────────────────────────
  if (loadingUsers) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 12, color: "#555" }}>Loading users...</Text>
      </SafeAreaView>
    );
  }

  // ─── No linked users ──────────────────────────────────────────────────────
  if (linkedUsers.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>👥</Text>
        <Text style={{ fontSize: 17, fontWeight: "600", color: "#111", marginBottom: 6 }}>
          No Linked Users
        </Text>
        <Text style={{ fontSize: 14, color: "#666", textAlign: "center", marginBottom: 24 }}>
          No approved users found. Ask a user to add you as their guardian.
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{ backgroundColor: "#2563eb", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>← Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>

      {/* ─── HEADER: Back + Title ─── */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 12,
      }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            backgroundColor: "#000",
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f2f2f" }}>
          Locate User
        </Text>
      </View>

      {/* ─── USER SELECTOR ─── */}
      <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: "600", color: "#666", marginBottom: 4 }}>
          TRACKING
        </Text>
        <Pressable
          onPress={() => setDropdownVisible(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#f0fdf4",
            borderColor: "#16a34a",
            borderWidth: 1.5,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <Text style={{ fontWeight: "700", fontSize: 16, color: "#15803d" }}>
            {selectedUser ? `👤 ${selectedUser.name}` : "Select a user..."}
          </Text>
          <Text style={{ color: "#16a34a", fontSize: 18 }}>▾</Text>
        </Pressable>
      </View>

      {/* ─── DROPDOWN MODAL ─── */}
      <Modal visible={dropdownVisible} transparent animationType="fade">
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 32 }}
          onPress={() => setDropdownVisible(false)}
        >
          <View style={{ backgroundColor: "#fff", borderRadius: 16, overflow: "hidden" }}>
            <Text style={{ padding: 16, fontWeight: "700", fontSize: 16, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" }}>
              Select User to Track
            </Text>
            <FlatList
              data={linkedUsers}
              keyExtractor={(item) => item.user_id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setSelectedUser(item);
                    setDropdownVisible(false);
                  }}
                  style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: "#f9f9f9",
                    backgroundColor: selectedUser?.user_id === item.user_id ? "#f0fdf4" : "#fff",
                  }}
                >
                  <Text style={{
                    fontSize: 15,
                    fontWeight: selectedUser?.user_id === item.user_id ? "700" : "400",
                    color: "#333",
                  }}>
                    👤 {item.name}{selectedUser?.user_id === item.user_id ? "  ✓" : ""}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>

      {/* ─── STATUS CARD ─── */}
      {selectedUser && (
        <View style={{ marginHorizontal: 16, marginBottom: 4 }}>
          <StatusCard
            userName={selectedUser.name}
            isOutside={isOutside}
            isAwayFromHome={isAwayFromHome}
            homeLocation={homeLocation}
            safeZonesCount={safeZones.length}
            lastUpdated={lastUpdated || null}
          />
        </View>
      )}

      {/* ─── LOADING LOCATION ─── */}
      {loading && (
        <View style={{ alignItems: "center", paddingVertical: 12 }}>
          <ActivityIndicator size="small" color="#2563eb" />
          <Text style={{ color: "#555", marginTop: 6, fontSize: 13 }}>Fetching location...</Text>
        </View>
      )}

      {/* ─── NO LOCATION ─── */}
      {!loading && !location && (
        <View style={{ alignItems: "center", paddingVertical: 20 }}>
          <Text style={{ fontSize: 14, color: "#666" }}>
            📍 No location data available for {selectedUser?.name} yet.
          </Text>
        </View>
      )}

      {/* ─── MAP ─── */}
      {location && (
        <View style={{ flex: 1 }}>
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker coordinate={location} title={selectedUser?.name || "User"}>
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: "#16a34a",
                  borderWidth: 2,
                  borderColor: "#fff",
                }}
              />
            </Marker>
          </MapView>

          {/* ─── LAST UPDATED BADGE ─── */}
          {lastUpdated && (
            <View style={{
              position: "absolute",
              bottom: 20,
              alignSelf: "center",
              backgroundColor: "rgba(0,0,0,0.65)",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
            }}>
              <Text style={{ color: "#fff", fontSize: 13 }}>🕐 Last updated: {lastUpdated}</Text>
            </View>
          )}
        </View>
      )}

    </SafeAreaView>
  );
}