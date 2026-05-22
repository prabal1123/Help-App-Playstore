// import { useState, useEffect, useRef, useCallback } from "react";
// import { Alert } from "react-native";
// import * as Notifications from "expo-notifications";
// import { supabase } from "@/supabase/supabase";
// import { useAlarmManager } from "./useAlarmManager";
// import { useRealtimeSubscriptions } from "./useRealtimeSubscriptions";
// import { isUserOutsideZones, isUserAwayFromHome } from "./distanceUtils";

// export type MapMode = "none" | "safeZone" | "setHome";

// type LinkedUser = { user_id: string; name: string };
// type LatLng = { latitude: number; longitude: number };

// export function useGuardianState() {
//   // ─── Sub-hooks ─────────────────────────────────────────────────────────────
//   const alarm = useAlarmManager();

//   // ─── State ─────────────────────────────────────────────────────────────────
//   const [linkedUsers, setLinkedUsers] = useState<LinkedUser[]>([]);
//   const [selectedUser, setSelectedUser] = useState<LinkedUser | null>(null);
//   const [dropdownVisible, setDropdownVisible] = useState(false);
//   const [userLocation, setUserLocation] = useState<LatLng | null>(null);
//   const [safeZones, setSafeZones] = useState<any[]>([]);
//   const [selectedCenter, setSelectedCenter] = useState<LatLng | null>(null);
//   const [radius, setRadius] = useState(300);
//   const [lastUpdated, setLastUpdated] = useState("");
//   const [isOutside, setIsOutside] = useState(false);
//   const [isAwayFromHome, setIsAwayFromHome] = useState(false);
//   const [mapMode, setMapMode] = useState<MapMode>("none");
//   const [homeLocation, setHomeLocation] = useState<LatLng | null>(null);
//   const [pendingHome, setPendingHome] = useState<LatLng | null>(null);
//   const [savingHome, setSavingHome] = useState(false);
//   const [loadingUser, setLoadingUser] = useState(false);
//   const [isFollowing, setIsFollowing] = useState(true);
//   const [alertModal, setAlertModal] = useState<{ title: string; body: string } | null>(null);

//   const prevIsOutside = useRef(false);
//   const prevIsAwayFromHome = useRef(false);
//   const hasInitialFit = useRef(false);

//   // ─── Notification permission ───────────────────────────────────────────────
//   useEffect(() => {
//     Notifications.requestPermissionsAsync();
//   }, []);

//   // ─── Alert modal helpers ───────────────────────────────────────────────────
//   const showAlert = (title: string, body: string) =>
//     setAlertModal({ title, body });

//   const hideAlert = () => {
//     setAlertModal(null);
//     alarm.dismissAlarm();
//   };

//   // ─── Realtime subscriptions ────────────────────────────────────────────────
//   const { subscribeToLocationUpdates, unsubscribeAll } = useRealtimeSubscriptions(
//     selectedUser,
//     {
//       onLocationUpdate: (lat, lng, recordedAt) => {
//         setUserLocation({ latitude: lat, longitude: lng });
//         setLastUpdated(new Date(recordedAt).toLocaleTimeString());
//       },
//       onAlertTriggered: (type, title, body) => {
//         showAlert(title, body);
//         alarm.triggerAlarm(type);
//         // Sync UI status
//         if (type === "left_home") setIsAwayFromHome(true);
//         if (type === "safe_zone") setIsOutside(true);
//       },
//       zones: safeZones,
//       home: homeLocation,
//       userName: selectedUser?.name ?? "",
//       prevIsOutside,
//       prevIsAwayFromHome,
//     }
//   );

//   // ─── Select user ───────────────────────────────────────────────────────────
//   const selectUser = useCallback(
//     async (linkedUser: LinkedUser, guardianId?: string) => {
//       setSelectedUser(linkedUser);
//       setDropdownVisible(false);
//       setLoadingUser(true);
//       setUserLocation(null);
//       setSafeZones([]);
//       setHomeLocation(null);
//       setMapMode("none");
//       setSelectedCenter(null);
//       setPendingHome(null);
//       alarm.dismissAlarm();
//       prevIsOutside.current = false;
//       prevIsAwayFromHome.current = false;
//       hasInitialFit.current = false;
//       setIsFollowing(true);

//       try {
//         const { data, error } = await supabase.auth.getUser();
//         if (error) throw error;
//         const gId = guardianId || data?.user?.id;
//         if (!gId) return;

//         const { data: zones } = await supabase
//           .from("help_app_safe_zones")
//           .select("*")
//           .eq("guardian_id", gId)
//           .eq("user_id", linkedUser.user_id)
//           .eq("active", true);

//         const fetchedZones = zones || [];
//         setSafeZones(fetchedZones);

//         const { data: homeData } = await supabase
//           .from("help_app_user_locations")
//           .select("lat, lng")
//           .eq("user_id", linkedUser.user_id)
//           .eq("is_home", true)
//           .maybeSingle();

//         let fetchedHome: LatLng | null = null;
//         if (homeData) {
//           fetchedHome = {
//             latitude: Number(homeData.lat),
//             longitude: Number(homeData.lng),
//           };
//           setHomeLocation(fetchedHome);
//         }

//         const { data: latestLocation } = await supabase
//           .from("help_app_user_locations")
//           .select("*")
//           .eq("user_id", linkedUser.user_id)
//           .eq("is_home", false)
//           .order("recorded_at", { ascending: false })
//           .limit(1)
//           .maybeSingle();

//         if (latestLocation) {
//           const lat = latestLocation.latitude ?? latestLocation.lat ?? null;
//           const lng = latestLocation.longitude ?? latestLocation.lng ?? null;
//           if (lat != null && lng != null) {
//             const newLat = Number(lat);
//             const newLng = Number(lng);
//             setUserLocation({ latitude: newLat, longitude: newLng });
//             setLastUpdated(
//               new Date(latestLocation.recorded_at).toLocaleTimeString()
//             );
//             const outside = isUserOutsideZones(newLat, newLng, fetchedZones);
//             const awayFromHome = isUserAwayFromHome(newLat, newLng, fetchedHome);
//             setIsOutside(outside);
//             setIsAwayFromHome(awayFromHome);
//             prevIsOutside.current = outside;
//             prevIsAwayFromHome.current = awayFromHome;
//           }
//         }

//         subscribeToLocationUpdates(
//           linkedUser.user_id,
//           fetchedZones,
//           fetchedHome,
//           linkedUser.name
//         );
//       } catch (err) {
//         console.error("selectUser error:", err);
//       } finally {
//         setLoadingUser(false);
//       }
//     },
//     [alarm, subscribeToLocationUpdates]
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
//       unsubscribeAll();
//     };
//   }, []);

//   // ─── Add safe zone ─────────────────────────────────────────────────────────
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

//   // ─── Save home location ────────────────────────────────────────────────────
//   const saveHomeLocation = async (coords: LatLng) => {
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
//       Alert.alert("✅ Home location saved for " + selectedUser.name + "!");
//     } catch {
//       Alert.alert("Something went wrong saving home.");
//     } finally {
//       setSavingHome(false);
//     }
//   };

//   return {
//     // users
//     linkedUsers,
//     selectedUser,
//     dropdownVisible,
//     setDropdownVisible,
//     selectUser,
//     loadingUser,
//     // location
//     userLocation,
//     homeLocation,
//     lastUpdated,
//     isOutside,
//     isAwayFromHome,
//     // map
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
//     // actions
//     activateSafeZone,
//     saveHomeLocation,
//     savingHome,
//     // alarm
//     alarm,
//     // alert modal
//     alertModal,
//     showAlert,
//     hideAlert,
//   };
// }

import { useState, useEffect, useRef, useCallback } from "react";
import { Alert } from "react-native";
import * as Notifications from "expo-notifications";
import { supabase } from "@/supabase/supabase";
import { useAlarmManager } from "./useAlarmManager";
import { useRealtimeSubscriptions } from "./useRealtimeSubscriptions";
import { isUserOutsideZones, isUserAwayFromHome } from "./distanceUtils";

export type MapMode = "none" | "safeZone" | "setHome" | "editSafeZone";

type LinkedUser = { user_id: string; name: string };
type LatLng = { latitude: number; longitude: number };

export type SafeZone = {
  id: string | number;
  center_lat: number | string;
  center_lng: number | string;
  radius_meters: number;
  active: boolean;
};

export function useGuardianState() {
  // ─── Sub-hooks ─────────────────────────────────────────────────────────────
  const alarm = useAlarmManager();

  // ─── State ─────────────────────────────────────────────────────────────────
  const [linkedUsers, setLinkedUsers] = useState<LinkedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<LinkedUser | null>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<LatLng | null>(null);
  const [radius, setRadius] = useState(300);
  const [lastUpdated, setLastUpdated] = useState("");
  const [isOutside, setIsOutside] = useState(false);
  const [isAwayFromHome, setIsAwayFromHome] = useState(false);
  const [mapMode, setMapMode] = useState<MapMode>("none");
  const [homeLocation, setHomeLocation] = useState<LatLng | null>(null);
  const [pendingHome, setPendingHome] = useState<LatLng | null>(null);
  const [savingHome, setSavingHome] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [isFollowing, setIsFollowing] = useState(true);
  const [alertModal, setAlertModal] = useState<{ title: string; body: string } | null>(null);

  // ─── Edit safe zone state ──────────────────────────────────────────────────
  const [editingZone, setEditingZone] = useState<SafeZone | null>(null);
  const [editRadius, setEditRadius] = useState(300);
  const [editCenter, setEditCenter] = useState<LatLng | null>(null);
  const [savingZone, setSavingZone] = useState(false);

  const prevIsOutside = useRef(false);
  const prevIsAwayFromHome = useRef(false);
  const hasInitialFit = useRef(false);

  // ─── Notification permission ───────────────────────────────────────────────
  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  // ─── Alert modal helpers ───────────────────────────────────────────────────
  const showAlert = (title: string, body: string) =>
    setAlertModal({ title, body });

  const hideAlert = () => {
    setAlertModal(null);
    alarm.dismissAlarm();
  };

  // ─── Realtime subscriptions ────────────────────────────────────────────────
  const { subscribeToLocationUpdates, unsubscribeAll } = useRealtimeSubscriptions(
    selectedUser,
    {
      onLocationUpdate: (lat, lng, recordedAt) => {
        setUserLocation({ latitude: lat, longitude: lng });
        setLastUpdated(new Date(recordedAt).toLocaleTimeString());
      },
      onAlertTriggered: (type, title, body) => {
        showAlert(title, body);
        alarm.triggerAlarm(type);
        if (type === "left_home") setIsAwayFromHome(true);
        if (type === "safe_zone") setIsOutside(true);
      },
      zones: safeZones,
      home: homeLocation,
      userName: selectedUser?.name ?? "",
      prevIsOutside,
      prevIsAwayFromHome,
    }
  );

  // ─── Select user ───────────────────────────────────────────────────────────
  const selectUser = useCallback(
    async (linkedUser: LinkedUser, guardianId?: string) => {
      setSelectedUser(linkedUser);
      setDropdownVisible(false);
      setLoadingUser(true);
      setUserLocation(null);
      setSafeZones([]);
      setHomeLocation(null);
      setMapMode("none");
      setSelectedCenter(null);
      setPendingHome(null);
      setEditingZone(null);
      alarm.dismissAlarm();
      prevIsOutside.current = false;
      prevIsAwayFromHome.current = false;
      hasInitialFit.current = false;
      setIsFollowing(true);

      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        const gId = guardianId || data?.user?.id;
        if (!gId) return;

        // ─── Fetch safe zones ──────────────────────────────────────────────
        const { data: zones } = await supabase
          .from("help_app_safe_zones")
          .select("*")
          .eq("guardian_id", gId)
          .eq("user_id", linkedUser.user_id)
          .eq("active", true);

        const fetchedZones = zones || [];
        setSafeZones(fetchedZones);

        // ─── Fetch home location ───────────────────────────────────────────
        const { data: homeData } = await supabase
          .from("help_app_user_locations")
          .select("lat, lng")
          .eq("user_id", linkedUser.user_id)
          .eq("is_home", true)
          .maybeSingle();

        let fetchedHome: LatLng | null = null;
        if (homeData) {
          fetchedHome = {
            latitude: Number(homeData.lat),
            longitude: Number(homeData.lng),
          };
          setHomeLocation(fetchedHome);
        }

        // ─── Fetch latest location (most recent non-home insert) ───────────
        const { data: latestLocation } = await supabase
          .from("help_app_user_locations")
          .select("*")
          .eq("user_id", linkedUser.user_id)
          .eq("is_home", false)
          .order("recorded_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestLocation) {
          const lat = latestLocation.latitude ?? latestLocation.lat ?? null;
          const lng = latestLocation.longitude ?? latestLocation.lng ?? null;

          if (lat != null && lng != null) {
            const newLat = Number(lat);
            const newLng = Number(lng);
            setUserLocation({ latitude: newLat, longitude: newLng });
            setLastUpdated(new Date(latestLocation.recorded_at).toLocaleTimeString());

            const outside = isUserOutsideZones(newLat, newLng, fetchedZones);
            const awayFromHome = isUserAwayFromHome(newLat, newLng, fetchedHome);
            setIsOutside(outside);
            setIsAwayFromHome(awayFromHome);
            prevIsOutside.current = outside;
            prevIsAwayFromHome.current = awayFromHome;
          }
        }

        subscribeToLocationUpdates(
          linkedUser.user_id,
          fetchedZones,
          fetchedHome,
          linkedUser.name
        );
      } catch (err) {
        console.error("selectUser error:", err);
      } finally {
        setLoadingUser(false);
      }
    },
    [alarm, subscribeToLocationUpdates]
  );

  // ─── Init: fetch linked users ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      console.log("🔄 Guardian init running...");
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        const user = data?.user;
        if (!user || cancelled) return;

        const { data: links } = await supabase
          .from("help_app_guardian_links")
          .select("user_id")
          .eq("guardian_id", user.id)
          .eq("status", "approved");

        if (!links || links.length === 0 || cancelled) return;

        const userIds = links.map((l: any) => l.user_id);
        const { data: profiles } = await supabase
          .from("help_app_profiles")
          .select("id, name")
          .in("id", userIds);

        if (profiles && !cancelled) {
          const users: LinkedUser[] = profiles.map((p: any) => ({
            user_id: p.id,
            name: p.name || "Unnamed User",
          }));
          setLinkedUsers(users);
          if (users.length > 0) selectUser(users[0], user.id);
        }
      } catch (err) {
        console.error("Guardian init error:", err);
      }
    };
    init();
    return () => {
      cancelled = true;
      unsubscribeAll();
    };
  }, []);

  // ─── Add safe zone ─────────────────────────────────────────────────────────
  const activateSafeZone = async () => {
    if (!selectedCenter || !selectedUser) {
      Alert.alert("Select a location first.");
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("help_app_safe_zones")
        .insert({
          guardian_id: user.id,
          user_id: selectedUser.user_id,
          center_lat: selectedCenter.latitude,
          center_lng: selectedCenter.longitude,
          radius_meters: radius,
          active: true,
        })
        .select()
        .single();
      if (error) { Alert.alert("Error", error.message); return; }
      const updatedZones = [...safeZones, data];
      setSafeZones(updatedZones);
      setSelectedCenter(null);
      setMapMode("none");
      subscribeToLocationUpdates(
        selectedUser.user_id,
        updatedZones,
        homeLocation,
        selectedUser.name
      );
      Alert.alert("✅ Safe Zone Added");
    } catch (err) {
      console.error("activateSafeZone error:", err);
    }
  };

  // ─── Start editing a safe zone ─────────────────────────────────────────────
  const startEditZone = (zone: SafeZone) => {
    setEditingZone(zone);
    setEditRadius(zone.radius_meters);
    setEditCenter({
      latitude: Number(zone.center_lat),
      longitude: Number(zone.center_lng),
    });
    setMapMode("editSafeZone");
  };

  // ─── Save edited safe zone ─────────────────────────────────────────────────
  const saveEditedZone = async () => {
    if (!editingZone || !editCenter) return;
    setSavingZone(true);
    try {
      const { error } = await supabase
        .from("help_app_safe_zones")
        .update({
          center_lat: editCenter.latitude,
          center_lng: editCenter.longitude,
          radius_meters: editRadius,
        })
        .eq("id", editingZone.id);

      if (error) { Alert.alert("Error", error.message); return; }

      const updatedZones = safeZones.map((z) =>
        z.id === editingZone.id
          ? { ...z, center_lat: editCenter.latitude, center_lng: editCenter.longitude, radius_meters: editRadius }
          : z
      );
      setSafeZones(updatedZones);
      subscribeToLocationUpdates(
        selectedUser!.user_id,
        updatedZones,
        homeLocation,
        selectedUser!.name
      );
      setEditingZone(null);
      setEditCenter(null);
      setMapMode("none");
      Alert.alert("✅ Safe Zone Updated");
    } catch (err) {
      console.error("saveEditedZone error:", err);
    } finally {
      setSavingZone(false);
    }
  };

  // ─── Delete safe zone ──────────────────────────────────────────────────────
  const deleteZone = (zone: SafeZone) => {
    Alert.alert(
      "Delete Safe Zone",
      "Are you sure you want to delete this safe zone?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("help_app_safe_zones")
                .delete()
                .eq("id", zone.id);

              if (error) { Alert.alert("Error", error.message); return; }

              const updatedZones = safeZones.filter((z) => z.id !== zone.id);
              setSafeZones(updatedZones);
              subscribeToLocationUpdates(
                selectedUser!.user_id,
                updatedZones,
                homeLocation,
                selectedUser!.name
              );
              if (editingZone?.id === zone.id) {
                setEditingZone(null);
                setEditCenter(null);
                setMapMode("none");
              }
              Alert.alert("🗑️ Safe Zone Deleted");
            } catch (err) {
              console.error("deleteZone error:", err);
            }
          },
        },
      ]
    );
  };

  // ─── Cancel edit ──────────────────────────────────────────────────────────
  const cancelEditZone = () => {
    setEditingZone(null);
    setEditCenter(null);
    setMapMode("none");
  };

  // ─── Save home location ────────────────────────────────────────────────────
  const saveHomeLocation = async (coords: LatLng) => {
    if (!selectedUser) return;
    setSavingHome(true);
    try {
      const { data: existing } = await supabase
        .from("help_app_user_locations")
        .select("id")
        .eq("user_id", selectedUser.user_id)
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
            user_id: selectedUser.user_id,
            lat: coords.latitude,
            lng: coords.longitude,
            is_home: true,
            recorded_at: new Date().toISOString(),
          });
        error = insertError;
      }

      if (error) { Alert.alert("Error saving home", error.message); return; }
      setHomeLocation(coords);
      setPendingHome(null);
      setMapMode("none");
      subscribeToLocationUpdates(
        selectedUser.user_id,
        safeZones,
        coords,
        selectedUser.name
      );
      Alert.alert("✅ Home location saved for " + selectedUser.name + "!");
    } catch {
      Alert.alert("Something went wrong saving home.");
    } finally {
      setSavingHome(false);
    }
  };

  return {
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
    showAlert,
    hideAlert,
  };
}