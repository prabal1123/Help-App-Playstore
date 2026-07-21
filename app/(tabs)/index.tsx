// import {
//   View,
//   Text,
//   Pressable,
//   ScrollView,
//   Linking,
//   Alert,
//   AlertButton,
//   ActivityIndicator,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { useRouter } from "expo-router";
// import { useEffect, useState, useCallback } from "react";
// import { useFocusEffect } from "@react-navigation/native";
// import { supabase } from "@/supabase/supabase";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import * as TaskManager from "expo-task-manager";
// import {
//   stopBackgroundTracking,
//   forceRestartTracking,
//   LOCATION_TASK,
// } from "@/services/backgroundLocation";

// const DEBUG_MODE = false;

// export default function HomeScreen() {
//   const router = useRouter();

//   const [trackingActive, setTrackingActive] = useState(false);
//   const [guardianConnected, setGuardianConnected] = useState(false);
//   const [isGuardian, setIsGuardian] = useState(false);
//   const [loading, setLoading] = useState(true);

//   // ─── Consent check (once on mount) ───────────────────────────────────────────
//   useEffect(() => {
//     const checkConsent = async () => {
//       try {
//         const accepted = await AsyncStorage.getItem("terms_accepted");
//         if (accepted !== "true") {
//           router.replace("/auth/consent");
//         }
//       } catch (err) {
//         console.error("Consent check error:", err);
//         router.replace("/auth/consent");
//       }
//     };
//     checkConsent();
//   }, [router]);

//   // ─── Load status ──────────────────────────────────────────────────────────────
//   const loadStatus = useCallback(async () => {
//     try {
//       const {
//         data: { user },
//         error: userError,
//       } = await supabase.auth.getUser();
//       if (userError || !user) {
//         setLoading(false);
//         return;
//       }

//       const { data: profile } = await supabase
//         .from("help_app_profiles")
//         .select("role")
//         .eq("id", user.id)
//         .maybeSingle();

//       const resolvedRole = profile?.role;
//       const guardian = resolvedRole === "guardian";
//       setIsGuardian(guardian);

//       const { data: links } = await supabase
//         .from("help_app_guardian_links")
//         .select("*")
//         .eq(guardian ? "guardian_id" : "user_id", user.id)
//         .eq("status", "approved")
//         .limit(1);

//       setGuardianConnected(Array.isArray(links) && links.length > 0);

//       const isRunning = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
//       setTrackingActive(isRunning);
//     } catch (error) {
//       console.error("❌ Home init error:", error);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // ─── Focus effect: load + poll tracking every 3s ──────────────────────────────
//   useFocusEffect(
//     useCallback(() => {
//       loadStatus();

//       const interval = setInterval(async () => {
//         const isRunning = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
//         setTrackingActive(isRunning);
//       }, 3000);

//       return () => clearInterval(interval);
//     }, [loadStatus])
//   );

//   // ─── Debug interval ───────────────────────────────────────────────────────────
//   useEffect(() => {
//     let interval: ReturnType<typeof setInterval>;
//     if (DEBUG_MODE) {
//       interval = setInterval(async () => {
//         const loc = await AsyncStorage.getItem("LAST_LOCATION");
//         if (loc) {
//           const parsed = JSON.parse(loc);
//           console.log(
//             "📍 Last location:",
//             `${parsed.latitude.toFixed(5)}, ${parsed.longitude.toFixed(5)}`,
//             parsed.timestamp
//           );
//         }
//         const isRunning = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
//         console.log("🔵 Task status:", isRunning ? "✅ Running" : "❌ Not running");
//       }, 6000);
//     }
//     return () => clearInterval(interval);
//   }, []);

//   // ─── SOS ─────────────────────────────────────────────────────────────────────
//   const handleSOS = async () => {
//     try {
//       const {
//         data: { user },
//         error: userError,
//       } = await supabase.auth.getUser();
//       if (userError || !user) {
//         Linking.openURL("tel:112");
//         return;
//       }

//       const { data: links, error } = await supabase
//         .from("help_app_guardian_links")
//         .select(`
//           guardian:help_app_profiles!help_app_guardian_links_guardian_id_fkey (
//             name, phone
//           )
//         `)
//         .eq("user_id", user.id)
//         .eq("status", "approved");

//       if (error) throw error;

//       const guardians = links
//         ?.map((link) =>
//           Array.isArray(link.guardian) ? link.guardian[0] : link.guardian
//         )
//         .filter((g) => g?.phone);

//       if (!guardians || guardians.length === 0) {
//         Alert.alert(
//           "No Guardian",
//           "No guardian found. Call emergency services?",
//           [
//             { text: "Call 112", onPress: () => Linking.openURL("tel:112") },
//             { text: "Cancel", style: "cancel" },
//           ]
//         );
//         return;
//       }

//       const buttons: AlertButton[] = [];
//       guardians.forEach((g) => {
//         buttons.push({
//           text: `${g.name || "Guardian"} (${g.phone})`,
//           onPress: () => Linking.openURL(`tel:${g.phone}`),
//         });
//       });
//       buttons.push({
//         text: "Call Emergency (112)",
//         onPress: () => Linking.openURL("tel:112"),
//       });
//       buttons.push({ text: "Cancel", style: "cancel" });

//       Alert.alert("🚨 Emergency Call", "Choose who to call", buttons);
//     } catch (error) {
//       console.error("SOS error:", error);
//       Linking.openURL("tel:112");
//     }
//   };

//   // ─── Call User (Guardian) ─────────────────────────────────────────────────────
//   const handleCallUser = async () => {
//     try {
//       const {
//         data: { user },
//         error: userError,
//       } = await supabase.auth.getUser();
//       if (userError || !user) {
//         Alert.alert("Error", "Could not verify your session. Please try again.");
//         return;
//       }

//       const { data: links, error } = await supabase
//         .from("help_app_guardian_links")
//         .select(`
//           user:help_app_profiles!help_app_guardian_links_user_id_fkey (
//             name, phone
//           )
//         `)
//         .eq("guardian_id", user.id)
//         .eq("status", "approved");

//       if (error) throw error;

//       const users = links
//         ?.map((link) =>
//           Array.isArray(link.user) ? link.user[0] : link.user
//         )
//         .filter((u) => u?.phone);

//       if (!users || users.length === 0) {
//         Alert.alert("No User", "No connected user found");
//         return;
//       }

//       const buttons: AlertButton[] = [{ text: "Cancel", style: "cancel" }];
//       users.forEach((u) => {
//         buttons.push({
//           text: `${u.name || "User"} (${u.phone})`,
//           onPress: () => Linking.openURL(`tel:${u.phone}`),
//         });
//       });

//       Alert.alert("📞 Call User", "Choose user to call", buttons);
//     } catch (error) {
//       console.error("Call user error:", error);
//       Alert.alert("Error", "Could not fetch user phone");
//     }
//   };

//   // ─── Loading UI ───────────────────────────────────────────────────────────────
//   if (loading) {
//     return (
//       <View
//         style={{
//           flex: 1,
//           justifyContent: "center",
//           alignItems: "center",
//           backgroundColor: "#e2eeee",
//         }}
//       >
//         <ActivityIndicator size="large" color="#0f766e" />
//       </View>
//     );
//   }

//   // ─── Main UI ──────────────────────────────────────────────────────────────────
//   return (
//     <View style={{ flex: 1, backgroundColor: "#e2eeee" }}>
//       <SafeAreaView style={{ flex: 1 }}>
//         <ScrollView
//           contentContainerStyle={{
//             paddingBottom: 30,
//             paddingHorizontal: 20,
//             alignItems: "center",
//           }}
//           showsVerticalScrollIndicator={false}
//         >
//           {/* ─── Header ─── */}
//           <View style={{ alignItems: "center", marginTop: 40, width: "100%" }}>
//             <Text style={{ fontSize: 36, fontWeight: "700", color: "#0f2f2f" }}>
//               Home Assist
//             </Text>
//             <Text
//               style={{
//                 marginTop: 10,
//                 fontSize: 16,
//                 color: "#3e6b6b",
//                 textAlign: "center",
//               }}
//             >
//               Your trusted companion for home & emergency services
//             </Text>
//           </View>

//           {/* ─── Main Button ─── */}
//           <Pressable
//             onPress={() =>
//               isGuardian
//                 ? router.push("/auth/live-location")
//                 : router.push("/take-me-home")
//             }
//             style={({ pressed }) => ({
//               marginTop: 50,
//               backgroundColor: pressed ? "#0d6b63" : "#0f766e",
//               paddingVertical: 42,
//               paddingHorizontal: 40,
//               borderRadius: 28,
//               alignItems: "center",
//               justifyContent: "center",
//               width: "100%",
//               shadowColor: "#000",
//               shadowOpacity: 0.2,
//               shadowRadius: 12,
//               elevation: 6,
//               opacity: pressed ? 0.95 : 1,
//             })}
//           >
//             <Text style={{ fontSize: 20, marginBottom: 6 }}>
//               {isGuardian ? "📍" : "🏠"}
//             </Text>
//             <Text
//               style={{
//                 color: "white",
//                 fontSize: 32,
//                 fontWeight: "700",
//                 textAlign: "center",
//               }}
//             >
//               {isGuardian ? "Locate User" : "Take Me Home"}
//             </Text>
//           </Pressable>

//           {/* ─── Row Buttons ─── */}
//           <View
//             style={{
//               flexDirection: "row",
//               marginTop: 14,
//               gap: 12,
//               width: "100%",
//             }}
//           >
//             <Pressable
//               onPress={isGuardian ? handleCallUser : handleSOS}
//               style={({ pressed }) => ({
//                 flex: 1,
//                 backgroundColor: pressed ? "#b91c1c" : "#dc2626",
//                 paddingVertical: 22,
//                 borderRadius: 22,
//                 alignItems: "center",
//                 justifyContent: "center",
//                 gap: 4,
//                 elevation: 4,
//                 opacity: pressed ? 0.95 : 1,
//               })}
//             >
//               <Text style={{ fontSize: 18 }}>📞</Text>
//               <Text style={{ color: "white", fontSize: 15, fontWeight: "600" }}>
//                 {isGuardian ? "Call User" : "SOS"}
//               </Text>
//             </Pressable>

//             <Pressable
//               onPress={() => router.push("/services")}
//               style={({ pressed }) => ({
//                 flex: 1,
//                 backgroundColor: pressed ? "rgba(255,255,255,0.7)" : "white",
//                 paddingVertical: 22,
//                 borderRadius: 22,
//                 alignItems: "center",
//                 justifyContent: "center",
//                 gap: 4,
//                 borderWidth: 0.5,
//                 borderColor: "rgba(0,0,0,0.1)",
//               })}
//             >
//               <Text style={{ fontSize: 18 }}>🛠️</Text>
//               <Text style={{ fontSize: 15, fontWeight: "600", color: "#1e293b" }}>
//                 Other Services
//               </Text>
//             </Pressable>
//           </View>

//           {/* ─── Status Card ─── */}
//           <View
//             style={{
//               marginTop: 32,
//               backgroundColor: "white",
//               borderRadius: 18,
//               borderWidth: 0.5,
//               borderColor: "rgba(0,0,0,0.07)",
//               width: "100%",
//               overflow: "hidden",
//             }}
//           >
//             {/* Monitoring row */}
//             <View
//               style={{
//                 flexDirection: "row",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 paddingHorizontal: 18,
//                 paddingVertical: 14,
//               }}
//             >
//               <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
//                 <Text style={{ fontSize: 16 }}>📡</Text>
//                 <Text style={{ fontSize: 13, color: "#64748b" }}>Monitoring</Text>
//               </View>
//               <View
//                 style={{
//                   paddingHorizontal: 11,
//                   paddingVertical: 4,
//                   borderRadius: 20,
//                   backgroundColor: trackingActive ? "#dcfce7" : "#f1f5f9",
//                 }}
//               >
//                 <Text
//                   style={{
//                     fontSize: 12,
//                     fontWeight: "600",
//                     color: trackingActive ? "#16a34a" : "#94a3b8",
//                   }}
//                 >
//                   {trackingActive ? "Active" : "Not active"}
//                 </Text>
//               </View>
//             </View>

//             {/* Divider */}
//             <View
//               style={{
//                 height: 0.5,
//                 backgroundColor: "rgba(0,0,0,0.06)",
//                 marginHorizontal: 18,
//               }}
//             />

//             {/* Connection row */}
//             <View
//               style={{
//                 flexDirection: "row",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 paddingHorizontal: 18,
//                 paddingVertical: 14,
//               }}
//             >
//               <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
//                 <Text style={{ fontSize: 16 }}>🔗</Text>
//                 <Text style={{ fontSize: 13, color: "#64748b" }}>
//                   {isGuardian ? "User" : "Guardian"}
//                 </Text>
//               </View>
//               <View
//                 style={{
//                   paddingHorizontal: 11,
//                   paddingVertical: 4,
//                   borderRadius: 20,
//                   backgroundColor: guardianConnected ? "#eff6ff" : "#f1f5f9",
//                 }}
//               >
//                 <Text
//                   style={{
//                     fontSize: 12,
//                     fontWeight: "600",
//                     color: guardianConnected ? "#2563eb" : "#94a3b8",
//                   }}
//                 >
//                   {guardianConnected ? "Connected" : "Not connected"}
//                 </Text>
//               </View>
//             </View>

//             {/* Divider */}
//             <View
//               style={{
//                 height: 0.5,
//                 backgroundColor: "rgba(0,0,0,0.06)",
//                 marginHorizontal: 18,
//               }}
//             />

//             {/* Mode row */}
//             <View
//               style={{
//                 flexDirection: "row",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 paddingHorizontal: 18,
//                 paddingVertical: 14,
//               }}
//             >
//               <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
//                 <Text style={{ fontSize: 16 }}>🛡️</Text>
//                 <Text style={{ fontSize: 13, color: "#64748b" }}>Mode</Text>
//               </View>
//               <View
//                 style={{
//                   paddingHorizontal: 11,
//                   paddingVertical: 4,
//                   borderRadius: 20,
//                   backgroundColor: "#e2eeee",
//                 }}
//               >
//                 <Text style={{ fontSize: 12, fontWeight: "600", color: "#0f6e56" }}>
//                   {isGuardian ? "Guardian" : "User"}
//                 </Text>
//               </View>
//             </View>
//           </View>

//         </ScrollView>
//       </SafeAreaView>
//     </View>
//   );
// }


import {
  View,
  Text,
  Pressable,
  ScrollView,
  Linking,
  Alert,
  AlertButton,
  ActivityIndicator,
  NativeModules,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "@/supabase/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as TaskManager from "expo-task-manager";
import {
  stopBackgroundTracking,
  forceRestartTracking,
  LOCATION_TASK,
} from "@/services/backgroundLocation";

const DEBUG_MODE = false;

export default function HomeScreen() {
  const router = useRouter();

  const [trackingActive, setTrackingActive] = useState(false);
  const [guardianConnected, setGuardianConnected] = useState(false);
  const [isGuardian, setIsGuardian] = useState(false);
  const [loading, setLoading] = useState(true);

  // ─── Consent check (once on mount) ───────────────────────────────────────────
  useEffect(() => {
    const checkConsent = async () => {
      try {
        const accepted = await AsyncStorage.getItem("terms_accepted");
        if (accepted !== "true") {
          router.replace("/auth/consent");
        }
      } catch (err) {
        console.error("Consent check error:", err);
        router.replace("/auth/consent");
      }
    };
    checkConsent();
  }, [router]);

  // ─── TEMP: wake lock smoke test — remove after confirming ────────────────────
  useEffect(() => {
    const { WakeLockModule } = NativeModules;
    console.log('WakeLockModule available:', !!WakeLockModule);
    if (WakeLockModule) {
      WakeLockModule.acquire()
        .then((r: boolean) => console.log('✅ acquired:', r))
        .then(() => WakeLockModule.release())
        .then((r: boolean) => console.log('✅ released:', r))
        .catch((e: any) => console.log('❌ wake lock error:', e));
    }
  }, []);

  // ─── Load status ──────────────────────────────────────────────────────────────
  const loadStatus = useCallback(async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("help_app_profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const resolvedRole = profile?.role;
      const guardian = resolvedRole === "guardian";
      setIsGuardian(guardian);

      const { data: links } = await supabase
        .from("help_app_guardian_links")
        .select("*")
        .eq(guardian ? "guardian_id" : "user_id", user.id)
        .eq("status", "approved")
        .limit(1);

      setGuardianConnected(Array.isArray(links) && links.length > 0);

      const isRunning = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
      setTrackingActive(isRunning);
    } catch (error) {
      console.error("❌ Home init error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Focus effect: load + poll tracking every 3s ──────────────────────────────
  useFocusEffect(
    useCallback(() => {
      loadStatus();

      const interval = setInterval(async () => {
        const isRunning = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
        setTrackingActive(isRunning);
      }, 3000);

      return () => clearInterval(interval);
    }, [loadStatus])
  );

  // ─── Debug interval ───────────────────────────────────────────────────────────
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (DEBUG_MODE) {
      interval = setInterval(async () => {
        const loc = await AsyncStorage.getItem("LAST_LOCATION");
        if (loc) {
          const parsed = JSON.parse(loc);
          console.log(
            "📍 Last location:",
            `${parsed.latitude.toFixed(5)}, ${parsed.longitude.toFixed(5)}`,
            parsed.timestamp
          );
        }
        const isRunning = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
        console.log("🔵 Task status:", isRunning ? "✅ Running" : "❌ Not running");
      }, 6000);
    }
    return () => clearInterval(interval);
  }, []);

  // ─── SOS ─────────────────────────────────────────────────────────────────────
  const handleSOS = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        Linking.openURL("tel:112");
        return;
      }

      const { data: links, error } = await supabase
        .from("help_app_guardian_links")
        .select(`
          guardian:help_app_profiles!help_app_guardian_links_guardian_id_fkey (
            name, phone
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "approved");

      if (error) throw error;

      const guardians = links
        ?.map((link) =>
          Array.isArray(link.guardian) ? link.guardian[0] : link.guardian
        )
        .filter((g) => g?.phone);

      if (!guardians || guardians.length === 0) {
        Alert.alert(
          "No Guardian",
          "No guardian found. Call emergency services?",
          [
            { text: "Call 112", onPress: () => Linking.openURL("tel:112") },
            { text: "Cancel", style: "cancel" },
          ]
        );
        return;
      }

      const buttons: AlertButton[] = [];
      guardians.forEach((g) => {
        buttons.push({
          text: `${g.name || "Guardian"} (${g.phone})`,
          onPress: () => Linking.openURL(`tel:${g.phone}`),
        });
      });
      buttons.push({
        text: "Call Emergency (112)",
        onPress: () => Linking.openURL("tel:112"),
      });
      buttons.push({ text: "Cancel", style: "cancel" });

      Alert.alert("🚨 Emergency Call", "Choose who to call", buttons);
    } catch (error) {
      console.error("SOS error:", error);
      Linking.openURL("tel:112");
    }
  };

  // ─── Call User (Guardian) ─────────────────────────────────────────────────────
  const handleCallUser = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert("Error", "Could not verify your session. Please try again.");
        return;
      }

      const { data: links, error } = await supabase
        .from("help_app_guardian_links")
        .select(`
          user:help_app_profiles!help_app_guardian_links_user_id_fkey (
            name, phone
          )
        `)
        .eq("guardian_id", user.id)
        .eq("status", "approved");

      if (error) throw error;

      const users = links
        ?.map((link) =>
          Array.isArray(link.user) ? link.user[0] : link.user
        )
        .filter((u) => u?.phone);

      if (!users || users.length === 0) {
        Alert.alert("No User", "No connected user found");
        return;
      }

      const buttons: AlertButton[] = [{ text: "Cancel", style: "cancel" }];
      users.forEach((u) => {
        buttons.push({
          text: `${u.name || "User"} (${u.phone})`,
          onPress: () => Linking.openURL(`tel:${u.phone}`),
        });
      });

      Alert.alert("📞 Call User", "Choose user to call", buttons);
    } catch (error) {
      console.error("Call user error:", error);
      Alert.alert("Error", "Could not fetch user phone");
    }
  };

  // ─── Loading UI ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#e2eeee",
        }}
      >
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  // ─── Main UI ──────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: "#e2eeee" }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            paddingBottom: 30,
            paddingHorizontal: 20,
            alignItems: "center",
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Header ─── */}
          <View style={{ alignItems: "center", marginTop: 40, width: "100%" }}>
            <Text style={{ fontSize: 36, fontWeight: "700", color: "#0f2f2f" }}>
              Home Assist
            </Text>
            <Text
              style={{
                marginTop: 10,
                fontSize: 16,
                color: "#3e6b6b",
                textAlign: "center",
              }}
            >
              Your trusted companion for home & emergency services
            </Text>
          </View>

          {/* ─── Main Button ─── */}
          <Pressable
            onPress={() =>
              isGuardian
                ? router.push("/auth/live-location")
                : router.push("/take-me-home")
            }
            style={({ pressed }) => ({
              marginTop: 50,
              backgroundColor: pressed ? "#0d6b63" : "#0f766e",
              paddingVertical: 42,
              paddingHorizontal: 40,
              borderRadius: 28,
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              shadowColor: "#000",
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 6,
              opacity: pressed ? 0.95 : 1,
            })}
          >
            <Text style={{ fontSize: 20, marginBottom: 6 }}>
              {isGuardian ? "📍" : "🏠"}
            </Text>
            <Text
              style={{
                color: "white",
                fontSize: 32,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              {isGuardian ? "Locate User" : "Take Me Home"}
            </Text>
          </Pressable>

          {/* ─── Row Buttons ─── */}
          <View
            style={{
              flexDirection: "row",
              marginTop: 14,
              gap: 12,
              width: "100%",
            }}
          >
            <Pressable
              onPress={isGuardian ? handleCallUser : handleSOS}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: pressed ? "#b91c1c" : "#dc2626",
                paddingVertical: 22,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                elevation: 4,
                opacity: pressed ? 0.95 : 1,
              })}
            >
              <Text style={{ fontSize: 18 }}>📞</Text>
              <Text style={{ color: "white", fontSize: 15, fontWeight: "600" }}>
                {isGuardian ? "Call User" : "SOS"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/services")}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: pressed ? "rgba(255,255,255,0.7)" : "white",
                paddingVertical: 22,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                borderWidth: 0.5,
                borderColor: "rgba(0,0,0,0.1)",
              })}
            >
              <Text style={{ fontSize: 18 }}>🛠️</Text>
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#1e293b" }}>
                Other Services
              </Text>
            </Pressable>
          </View>

          {/* ─── Status Card ─── */}
          <View
            style={{
              marginTop: 32,
              backgroundColor: "white",
              borderRadius: 18,
              borderWidth: 0.5,
              borderColor: "rgba(0,0,0,0.07)",
              width: "100%",
              overflow: "hidden",
            }}
          >
            {/* Monitoring row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 18,
                paddingVertical: 14,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text style={{ fontSize: 16 }}>📡</Text>
                <Text style={{ fontSize: 13, color: "#64748b" }}>Monitoring</Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 11,
                  paddingVertical: 4,
                  borderRadius: 20,
                  backgroundColor: trackingActive ? "#dcfce7" : "#f1f5f9",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: trackingActive ? "#16a34a" : "#94a3b8",
                  }}
                >
                  {trackingActive ? "Active" : "Not active"}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View
              style={{
                height: 0.5,
                backgroundColor: "rgba(0,0,0,0.06)",
                marginHorizontal: 18,
              }}
            />

            {/* Connection row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 18,
                paddingVertical: 14,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text style={{ fontSize: 16 }}>🔗</Text>
                <Text style={{ fontSize: 13, color: "#64748b" }}>
                  {isGuardian ? "User" : "Guardian"}
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 11,
                  paddingVertical: 4,
                  borderRadius: 20,
                  backgroundColor: guardianConnected ? "#eff6ff" : "#f1f5f9",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: guardianConnected ? "#2563eb" : "#94a3b8",
                  }}
                >
                  {guardianConnected ? "Connected" : "Not connected"}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View
              style={{
                height: 0.5,
                backgroundColor: "rgba(0,0,0,0.06)",
                marginHorizontal: 18,
              }}
            />

            {/* Mode row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 18,
                paddingVertical: 14,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text style={{ fontSize: 16 }}>🛡️</Text>
                <Text style={{ fontSize: 13, color: "#64748b" }}>Mode</Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 11,
                  paddingVertical: 4,
                  borderRadius: 20,
                  backgroundColor: "#e2eeee",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#0f6e56" }}>
                  {isGuardian ? "Guardian" : "User"}
                </Text>
              </View>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}