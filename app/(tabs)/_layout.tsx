// import { Tabs, useRouter } from "expo-router";
// import { Ionicons, Feather } from "@expo/vector-icons";
// import { COLORS } from "../../styles/colors";
// import { useEffect, useState, useRef } from "react";
// import { supabase } from "@/supabase/supabase";
// import { View, ActivityIndicator, Text, Pressable } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import "@/services/backgroundLocation";
// import { startBackgroundTracking } from "@/services/backgroundLocation";
// import { saveExpoPushToken } from "@/services/pushToken";

// export default function TabLayout() {
//   const router = useRouter();
//   const insets = useSafeAreaInsets();

//   const [role, setRole] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);

//   const fetchingRef = useRef(false);

//   useEffect(() => {
//     fetchRole();

//     const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
//       // ✅ Only react to actual sign-in / sign-out events.
//       // Ignoring TOKEN_REFRESHED, USER_UPDATED, INITIAL_SESSION etc.
//       // prevents the reload loop that OAuth triggers by firing multiple events.
//       if (event === "SIGNED_OUT") {
//         setRole(null);
//         return;
//       }

//       if (event === "SIGNED_IN") {
//         // Reset the guard so fetchRole is allowed to run again
//         fetchingRef.current = false;
//         fetchRole();
//       }
//     });

//     return () => {
//       listener.subscription.unsubscribe();
//     };
//   }, []);

//   // ─── Background tracking ─────────────────────────────────────────────────────
//   const trackingStartedRef = useRef(false);
//   useEffect(() => {
//     if (role === "user" && !trackingStartedRef.current) {
//       trackingStartedRef.current = true;
//       supabase.auth.getUser().then(({ data: { user } }) => {
//         if (user) startBackgroundTracking(user.id);
//       });
//     }
//   }, [role]);

//   // ─── Push token ───────────────────────────────────────────────────────────────
//   const pushTokenSavedRef = useRef(false);
//   useEffect(() => {
//     if (role === "guardian" && !pushTokenSavedRef.current) {
//       pushTokenSavedRef.current = true;
//       saveExpoPushToken();
//     }
//   }, [role]);

//   // ─── Redirect logic ───────────────────────────────────────────────────────────
//   useEffect(() => {
//     const checkRedirect = async () => {
//       const redirect = await AsyncStorage.getItem("REDIRECT_HOME");
//       if (redirect === "true") {
//         await AsyncStorage.removeItem("REDIRECT_HOME");
//         router.push("/take-me-home");
//       }
//     };
//     checkRedirect();
//   }, []);

//   // ─── Fetch role from DB ───────────────────────────────────────────────────────
//   const fetchRole = async () => {
//     if (fetchingRef.current) return;
//     fetchingRef.current = true;

//     setLoading(true);

//     const { data: { user } } = await supabase.auth.getUser();

//     if (!user) {
//       setLoading(false);
//       fetchingRef.current = false;
//       return;
//     }

//     // const { data } = await supabase
//     //   .from("help_app_profiles")
//     //   .select("role")
//     //   .eq("id", user.id)
//     //   .maybeSingle();

//     const { data, error } = await supabase
//   .from("help_app_profiles")
//   .select("role")
//   .eq("id", user.id)
//   .maybeSingle();

//   if (error) {
//     console.error("fetchRole error:", error.message);
//     setRole(null);
//     setLoading(false);
//     fetchingRef.current = false;
//     return;
//   }

//     setRole(data?.role ?? null);
//     setLoading(false);
//     fetchingRef.current = false;
//   };

//   // ─── Handlers ─────────────────────────────────────────────────────────────────
//   const handleLogout = async () => {
//     await supabase.auth.signOut();
//     router.replace("/auth/email");
//   };

//   const handleRetry = async () => {
//     fetchingRef.current = false;
//     await fetchRole();
//   };

//   // ─── Loading UI ───────────────────────────────────────────────────────────────
//   if (loading) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <ActivityIndicator size="large" />
//       </View>
//     );
//   }

//   // ─── No role UI ───────────────────────────────────────────────────────────────
//   if (!role) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
//         <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>
//           No role found
//         </Text>
//         <Text style={{ fontSize: 14, color: "#666", marginBottom: 32, textAlign: "center" }}>
//           Your account may not be set up correctly.
//         </Text>
//         <Pressable
//           onPress={handleRetry}
//           style={{
//             backgroundColor: "#0f766e",
//             paddingVertical: 14,
//             borderRadius: 14,
//             marginBottom: 12,
//             width: "100%",
//             alignItems: "center",
//           }}
//         >
//           <Text style={{ color: "#fff", fontWeight: "600" }}>Retry</Text>
//         </Pressable>
//         <Pressable
//           onPress={handleLogout}
//           style={{
//             backgroundColor: "#dc2626",
//             paddingVertical: 14,
//             borderRadius: 14,
//             width: "100%",
//             alignItems: "center",
//           }}
//         >
//           <Text style={{ color: "#fff", fontWeight: "600" }}>Log Out</Text>
//         </Pressable>
//       </View>
//     );
//   }

//   // ─── Tabs ─────────────────────────────────────────────────────────────────────
//   return (
//     <Tabs
//       initialRouteName="index"
//       screenOptions={{
//         headerShown: false,
//         tabBarActiveTintColor: COLORS.green,
//         tabBarInactiveTintColor: "#9CA3AF",
//         tabBarStyle: {
//           backgroundColor: "#FFFFFF",
//           height: 65 + insets.bottom,
//           paddingTop: 6,
//           paddingBottom: insets.bottom,
//           borderTopWidth: 0.5,
//           borderTopColor: "#E5E7EB",
//           elevation: 8,
//         },
//         tabBarLabelStyle: {
//           fontSize: 12,
//           marginBottom: 4,
//         },
//       }}
//     >
//       <Tabs.Screen
//         name="index"
//         options={{
//           title: "Home",
//           tabBarIcon: ({ color, focused }) => (
//             <Ionicons
//               name={focused ? "home" : "home-outline"}
//               size={22}
//               color={color}
//             />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="navigation"
//         options={{
//           title: "Navigate",
//           href: role === "user" ? "/navigation" : null,
//           tabBarIcon: ({ color }) => (
//             <Feather name="navigation" size={22} color={color} />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="guardian"
//         options={{
//           title: "Guardian",
//           href: role === "guardian" ? "/guardian" : null,
//           tabBarIcon: ({ color, focused }) => (
//             <Ionicons
//               name={focused ? "shield" : "shield-outline"}
//               size={22}
//               color={color}
//             />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="profile"
//         options={{
//           title: "Profile",
//           tabBarIcon: ({ color, focused }) => (
//             <Ionicons
//               name={focused ? "person" : "person-outline"}
//               size={22}
//               color={color}
//             />
//           ),
//         }}
//       />
//     </Tabs>
//   );
// }

import { Tabs, useRouter } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { COLORS } from "../../styles/colors";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/supabase/supabase";
import { View, ActivityIndicator, Text, Pressable, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "@/services/backgroundLocation";
import { startBackgroundTracking } from "@/services/backgroundLocation";
import { saveExpoPushToken } from "@/services/pushToken";

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const trackingStartedRef = useRef(false);
  const pushTokenSavedRef = useRef(false);

  // ─── Fetch role from DB ─────────────────────────────────────────────────────
  const fetchRole = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setFetchError(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

if (userError || !user) {
  // Ignore "session missing" — this fires on cold start before session hydrates
  if (userError && userError.message !== "Auth session missing!") {
    console.error("getUser error:", userError.message);
  }
  setLoading(false);
  fetchingRef.current = false;
  return;
}

    const { data, error: roleError } = await supabase
      .from("help_app_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (roleError) {
      console.error("fetchRole DB error:", roleError.message);
      setFetchError("Could not load your profile. Please check your connection.");
      setLoading(false);
      fetchingRef.current = false;
      return;
    }

    setRole(data?.role ?? null);
    setLoading(false);
    fetchingRef.current = false;
  }, []);

  // ─── Auth state listener ────────────────────────────────────────────────────
  useEffect(() => {
    fetchRole();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setRole(null);
        setFetchError(null);
        // Reset tracking refs on sign out so they work on next login
        trackingStartedRef.current = false;
        pushTokenSavedRef.current = false;
        return;
      }
      if (event === "SIGNED_IN") {
        fetchingRef.current = false;
        setFetchError(null);
        fetchRole();
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fetchRole]);

  // ─── Background tracking ────────────────────────────────────────────────────
  useEffect(() => {
    if (role === "user" && !trackingStartedRef.current) {
      trackingStartedRef.current = true;
      supabase.auth
        .getUser()
        .then(({ data: { user } }) => {
          if (user) startBackgroundTracking(user.id);
        })
        .catch((err) => {
          console.error("Background tracking start error:", err);
        });
    }
  }, [role]);

  // ─── Push token ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (role === "guardian" && !pushTokenSavedRef.current) {
      pushTokenSavedRef.current = true;
      (async () => {
        try {
          await saveExpoPushToken();
        } catch (err) {
          console.error("Push token save error:", err);
        }
      })();
    }
  }, [role]);

  // ─── Redirect logic ─────────────────────────────────────────────────────────
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const redirect = await AsyncStorage.getItem("REDIRECT_HOME");
        if (redirect === "true") {
          await AsyncStorage.removeItem("REDIRECT_HOME");
          router.push("/take-me-home");
        }
      } catch (err) {
        console.error("AsyncStorage redirect check error:", err);
      }
    };
    checkRedirect();
  }, [router]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      router.replace("/auth/email");
    }
  };

  const handleRetry = async () => {
    fetchingRef.current = false;
    setFetchError(null);
    await fetchRole();
  };

  // ─── Loading UI ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.green} />
      </View>
    );
  }

  // ─── Error UI ───────────────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>{fetchError}</Text>
        <Pressable onPress={handleRetry} style={styles.retryButton}>
          <Text style={styles.buttonText}>Try Again</Text>
        </Pressable>
        <Pressable onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.buttonText}>Log Out</Text>
        </Pressable>
      </View>
    );
  }

  // ─── No role UI ─────────────────────────────────────────────────────────────
  if (!role) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.title}>No role found</Text>
        <Text style={styles.subtitle}>
          Your account may not be set up correctly.
        </Text>
        <Pressable onPress={handleRetry} style={styles.retryButton}>
          <Text style={styles.buttonText}>Retry</Text>
        </Pressable>
        <Pressable onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.buttonText}>Log Out</Text>
        </Pressable>
      </View>
    );
  }

  // ─── Tabs ────────────────────────────────────────────────────────────────────
  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.green,
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          height: 65 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom,
          borderTopWidth: 0.5,
          borderTopColor: "#E5E7EB",
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="navigation"
        options={{
          title: "Navigate",
          href: role === "user" ? "/navigation" : null,
          tabBarIcon: ({ color }) => (
            <Feather name="navigation" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="guardian"
        options={{
          title: "Guardian",
          href: role === "guardian" ? "/guardian" : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "shield" : "shield-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 32,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#0f766e",
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 12,
    width: "100%",
    alignItems: "center",
  },
  logoutButton: {
    backgroundColor: "#dc2626",
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});