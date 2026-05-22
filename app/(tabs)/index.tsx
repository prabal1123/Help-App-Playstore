// import {
//   View,
//   Text,
//   Pressable,
//   ScrollView,
//   Linking,
//   Alert,
//   AlertButton,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { useRouter } from "expo-router";
// import { useEffect, useState } from "react";
// import { supabase } from "@/supabase/supabase";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import * as TaskManager from "expo-task-manager";
// import {
//   stopBackgroundTracking,
//   forceRestartTracking,
//   LOCATION_TASK,
// } from "@/services/backgroundLocation";

// const DEBUG_MODE = true;

// export default function HomeScreen() {
//   const router = useRouter();

//   const [trackingActive, setTrackingActive] = useState(false);
//   const [guardianConnected, setGuardianConnected] = useState(false);
//   const [lastLocation, setLastLocation] = useState<string | null>(null);
//   const [taskStatus, setTaskStatus] = useState<string>("Checking...");
//   const [isGuardian, setIsGuardian] = useState(false);

//   useEffect(() => {
//     const checkConsent = async () => {
//       const accepted = await AsyncStorage.getItem("terms_accepted");
//       if (accepted !== "true") {
//         router.replace("/auth/consent");
//         return;
//       }
//     };
//     checkConsent();

//     const init = async () => {
//       try {
//         const {
//           data: { user },
//         } = await supabase.auth.getUser();
//         if (!user) return;

//         const { data: link } = await supabase
//           .from("help_app_guardian_links")
//           .select("*")
//           .eq("user_id", user.id)
//           .eq("status", "approved")
//           .maybeSingle();

//         setGuardianConnected(!!link);

//         const { data: profile } = await supabase
//           .from("help_app_profiles")
//           .select("role")
//           .eq("id", user.id)
//           .maybeSingle();

//         setIsGuardian(profile?.role === "guardian");

//         const isRunning = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
//         setTrackingActive(isRunning);
//         setTaskStatus(isRunning ? "✅ Running" : "❌ Not running");
//       } catch (error) {
//         console.log("❌ Home init error:", error);
//       }
//     };

//     init();

//     let interval: ReturnType<typeof setInterval>;
//     if (DEBUG_MODE) {
//       interval = setInterval(async () => {
//         const loc = await AsyncStorage.getItem("LAST_LOCATION");
//         if (loc) {
//           const parsed = JSON.parse(loc);
//           setLastLocation(
//             `${parsed.latitude.toFixed(5)}, ${parsed.longitude.toFixed(5)}\n${parsed.timestamp}`
//           );
//         }
//         const isRunning = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
//         setTaskStatus(isRunning ? "✅ Running" : "❌ Not running");
//       }, 6000);
//     }

//     return () => clearInterval(interval);
//   }, []);

//   // 🔥 SOS (user → guardian)
//   const handleSOS = async () => {
//     try {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();

//       if (!user) return;

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
//         ?.map(link =>
//           Array.isArray(link.guardian) ? link.guardian[0] : link.guardian
//         )
//         .filter(g => g?.phone);

//       if (!guardians || guardians.length === 0) {
//         Alert.alert(
//           "No Guardian",
//           "No guardian found. Call emergency services?",
//           [
//             { text: "Call 112", onPress: () => Linking.openURL("tel:112") },
//             { text: "Cancel", style: "cancel" }, // ✅ cancel always last
//           ]
//         );
//         return;
//       }

//       const buttons: AlertButton[] = [];

//       // ✅ Guardians first
//       guardians.forEach(g => {
//         buttons.push({
//           text: `${g.name || "Guardian"} (${g.phone})`,
//           onPress: () => Linking.openURL(`tel:${g.phone}`),
//         });
//       });

//       // ✅ 112 second to last
//       buttons.push({
//         text: "Call Emergency (112)",
//         onPress: () => Linking.openURL("tel:112"),
//       });

//       // ✅ Cancel always last
//       buttons.push({
//         text: "Cancel",
//         style: "cancel",
//       });

//       Alert.alert("🚨 Emergency Call", "Choose who to call", buttons);

//     } catch (error) {
//       console.log("SOS error:", error);
//       Linking.openURL("tel:112");
//     }
//   };

//   // 🔥 Guardian → Call User
//   const handleCallUser = async () => {
//     try {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();

//       if (!user) return;

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
//         ?.map(link =>
//           Array.isArray(link.user) ? link.user[0] : link.user
//         )
//         .filter(u => u?.phone);

//       if (!users || users.length === 0) {
//         Alert.alert("No User", "No connected user found");
//         return;
//       }

//       const buttons: AlertButton[] = [];

//       // ✅ Users first
//       users.forEach(u => {
//         buttons.push({
//           text: `${u.name || "User"} (${u.phone})`,
//           onPress: () => Linking.openURL(`tel:${u.phone}`),
//         });
//       });

//       // ✅ Cancel always last
//       buttons.push({
//         text: "Cancel",
//         style: "cancel",
//       });

//       Alert.alert("📞 Call User", "Choose user to call", buttons);

//     } catch (error) {
//       console.log("Call user error:", error);
//       Alert.alert("Error", "Could not fetch user phone");
//     }
//   };

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
//           {/* Header */}
//           <View style={{ alignItems: "center", marginTop: 40, width: "100%" }}>
//             <Text style={{ fontSize: 36, fontWeight: "700", color: "#0f2f2f" }}>
//               Home Assist
//             </Text>
//             <Text style={{ marginTop: 10, fontSize: 16, color: "#3e6b6b", textAlign: "center" }}>
//               Your trusted companion for home & emergency services
//             </Text>
//           </View>

//           {/* Main Button */}
//           <Pressable
//             onPress={() =>
//               isGuardian
//                 ? router.push("/auth/live-location")
//                 : router.push("/take-me-home")
//             }
//             style={{
//               marginTop: 50,
//               backgroundColor: "#0f766e",
//               paddingVertical: 42,
//               paddingHorizontal: 40,
//               borderRadius: 28,
//               alignItems: "center",
//               justifyContent: "center",
//               width: "100%",
//               shadowColor: "#000",
//               shadowOpacity: 0.25,
//               shadowRadius: 12,
//               elevation: 6,
//             }}
//           >
//             <Text style={{ fontSize: 18, marginBottom: 6 }}>
//               {isGuardian ? "📍" : "🏠"}
//             </Text>
//             <Text style={{ color: "white", fontSize: 32, fontWeight: "700", textAlign: "center" }}>
//               {isGuardian ? "Locate User" : "Take Me Home"}
//             </Text>
//           </Pressable>

//           {/* Row Buttons */}
//           <View style={{ flexDirection: "row", marginTop: 30, gap: 15, width: "100%" }}>

//             {/* SOS / Call User */}
//             <Pressable
//               onPress={isGuardian ? handleCallUser : handleSOS}
//               style={{
//                 flex: 1,
//                 backgroundColor: "#dc2626",
//                 paddingVertical: 25,
//                 borderRadius: 22,
//                 alignItems: "center",
//                 shadowColor: "#dc2626",
//                 shadowOpacity: 0.6,
//                 shadowRadius: 12,
//                 elevation: 8,
//               }}
//             >
//               <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>
//                 {isGuardian ? "📞 Call User" : "📞 SOS"}
//               </Text>
//             </Pressable>

//             {/* Other Services */}
//             <Pressable
//               onPress={() => router.push("/services")}
//               style={{
//                 flex: 1,
//                 backgroundColor: "#f1f5f9",
//                 paddingVertical: 25,
//                 borderRadius: 22,
//                 alignItems: "center",
//                 borderWidth: 1,
//                 borderColor: "#94a3b8",
//               }}
//             >
//               <Text style={{ fontSize: 18, fontWeight: "600", color: "#1e293b" }}>
//                 Other Services
//               </Text>
//             </Pressable>
//           </View>

//           {/* Status */}
//           <View
//             style={{
//               marginTop: 40,
//               padding: 16,
//               borderRadius: 16,
//               backgroundColor: "#d1eeee",
//               width: "100%",
//             }}
//           >
//             <Text style={{ fontSize: 13, color: "#0f2f2f", textAlign: "center" }}>
//               {trackingActive
//                 ? "🟢 Background safety monitoring active"
//                 : "🟡 Monitoring not active"}
//               {" · "}
//               {guardianConnected ? "Guardian connected" : "No guardian connected"}
//               {" · "}
//               {isGuardian ? "Guardian Mode" : "User Mode"}
//             </Text>
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "@/supabase/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as TaskManager from "expo-task-manager";
import {
  stopBackgroundTracking,
  forceRestartTracking,
  LOCATION_TASK,
} from "@/services/backgroundLocation";

// ✅ FIX: DEBUG_MODE set to false for production
const DEBUG_MODE = false;

export default function HomeScreen() {
  const router = useRouter();

  const [trackingActive, setTrackingActive] = useState(false);
  const [guardianConnected, setGuardianConnected] = useState(false);
  const [isGuardian, setIsGuardian] = useState(false);
  // ✅ FIX: added loading state so UI doesn't flash wrong role on mount
  const [loading, setLoading] = useState(true);

  // ✅ FIX: added router to deps array to avoid stale reference
  useEffect(() => {
    const checkConsent = async () => {
      // ✅ FIX: wrapped in try/catch — AsyncStorage can throw on some Android versions
      try {
        const accepted = await AsyncStorage.getItem("terms_accepted");
        if (accepted !== "true") {
          router.replace("/auth/consent");
          return;
        }
      } catch (err) {
        console.error("Consent check error:", err);
        // Fail safe — always show consent if we can't verify
        router.replace("/auth/consent");
        return;
      }
    };

    const init = async () => {
      try {
        // ✅ FIX: destructure error from getUser
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setLoading(false);
          return;
        }

      // AFTER — fetch role first, then query the correct side
      const { data: profile } = await supabase
        .from("help_app_profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const resolvedRole = profile?.role;
      setIsGuardian(resolvedRole === "guardian");

      // Guardian checks guardian_id side, user checks user_id side
// AFTER
        const { data: links } = await supabase
          .from("help_app_guardian_links")
          .select("*")
          .eq(resolvedRole === "guardian" ? "guardian_id" : "user_id", user.id)
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
    };

    checkConsent();
    init();

    // ✅ FIX: DEBUG_MODE is false so this block never runs in production
    // Kept here so you can flip DEBUG_MODE to true locally during development
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
  }, [router]); // ✅ FIX: router in deps

  // ─── SOS: user → call guardian ───────────────────────────────────────────────
  const handleSOS = async () => {
    try {
      // ✅ FIX: handle getUser error — fall back to 112 immediately in emergency
      const { data: { user }, error: userError } = await supabase.auth.getUser();
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

      buttons.push({
        text: "Cancel",
        style: "cancel",
      });

      Alert.alert("🚨 Emergency Call", "Choose who to call", buttons);
    } catch (error) {
      console.error("SOS error:", error);
      // ✅ FIX: always fall back to 112 if anything throws
      Linking.openURL("tel:112");
    }
  };

  // ─── Guardian → Call User ─────────────────────────────────────────────────────
  const handleCallUser = async () => {
    try {
      // ✅ FIX: handle getUser error
      const { data: { user }, error: userError } = await supabase.auth.getUser();
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

      const buttons: AlertButton[] = [];

      users.forEach((u) => {
        buttons.push({
          text: `${u.name || "User"} (${u.phone})`,
          onPress: () => Linking.openURL(`tel:${u.phone}`),
        });
      });

      buttons.push({
        text: "Cancel",
        style: "cancel",
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#e2eeee" }}>
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
          {/* Header */}
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

          {/* Main Button */}
          <Pressable
            onPress={() =>
              isGuardian
                ? router.push("/auth/live-location")
                : router.push("/take-me-home")
            }
            style={{
              marginTop: 50,
              backgroundColor: "#0f766e",
              paddingVertical: 42,
              paddingHorizontal: 40,
              borderRadius: 28,
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              shadowColor: "#000",
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <Text style={{ fontSize: 18, marginBottom: 6 }}>
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

          {/* Row Buttons */}
          <View
            style={{
              flexDirection: "row",
              marginTop: 30,
              gap: 15,
              width: "100%",
            }}
          >
            {/* SOS / Call User */}
            <Pressable
              onPress={isGuardian ? handleCallUser : handleSOS}
              style={{
                flex: 1,
                backgroundColor: "#dc2626",
                paddingVertical: 25,
                borderRadius: 22,
                alignItems: "center",
                shadowColor: "#dc2626",
                shadowOpacity: 0.6,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>
                {isGuardian ? "📞 Call User" : "📞 SOS"}
              </Text>
            </Pressable>

            {/* Other Services */}
            <Pressable
              onPress={() => router.push("/services")}
              style={{
                flex: 1,
                backgroundColor: "#f1f5f9",
                paddingVertical: 25,
                borderRadius: 22,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#94a3b8",
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "600", color: "#1e293b" }}
              >
                Other Services
              </Text>
            </Pressable>
          </View>

          {/* Status */}
          <View
            style={{
              marginTop: 40,
              padding: 16,
              borderRadius: 16,
              backgroundColor: "#d1eeee",
              width: "100%",
            }}
          >
            <Text
              style={{ fontSize: 13, color: "#0f2f2f", textAlign: "center" }}
            >
              {trackingActive
                ? "🟢 Background safety monitoring active"
                : "🟡 Monitoring not active"}
              {" · "}
              {isGuardian
                ? (guardianConnected ? "User connected" : "No user connected")
                : (guardianConnected ? "Guardian connected" : "No guardian connected")
              }
              {" · "}
              {isGuardian ? "Guardian Mode" : "User Mode"}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}