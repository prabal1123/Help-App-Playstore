// import { Tabs, useRouter } from "expo-router";
// import { Ionicons, Feather } from "@expo/vector-icons";
// import { COLORS } from "../../styles/colors";
// import { useEffect, useState, useRef, useCallback } from "react";
// import { supabase } from "@/supabase/supabase";
// import {
//   View,
//   ActivityIndicator,
//   Text,
//   Pressable,
//   StyleSheet,
//   Platform,
//   Alert,
//   AppState,
//   AppStateStatus,
// } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import "@/services/backgroundLocation";
// import {
//   startBackgroundTracking,
//   ensureTrackingHealthy,
// } from "@/services/backgroundLocation";
// import { saveExpoPushToken } from "@/services/pushToken";
// import * as IntentLauncher from "expo-intent-launcher";

// // ─── Battery optimization exemption ──────────────────────────────────────────
// // Samsung and most Android OEMs will kill foreground services within
// // minutes-to-an-hour unless the app is exempted from battery optimization.
// // This prompts the user to whitelist the app — without it, background
// // tracking can die silently regardless of how correct the code is.
// //
// // Requires: npx expo install expo-intent-launcher
// //
// // Only shown once (tracked via AsyncStorage) so it doesn't nag on every launch.
// async function requestBatteryOptimizationExemption(packageName: string) {
//   if (Platform.OS !== "android") return;

//   try {
//     const alreadyAsked = await AsyncStorage.getItem("BATTERY_OPT_ASKED");
//     if (alreadyAsked === "true") return;

//     await AsyncStorage.setItem("BATTERY_OPT_ASKED", "true");

//     Alert.alert(
//       "Allow Background Tracking",
//       'To keep safety monitoring active when your phone is locked, please disable battery optimization for this app on the next screen.\n\nTap "All apps", find Help App, and select "Don\'t optimize".',
//       [
//         { text: "Not Now", style: "cancel" },
//         {
//           text: "Open Settings",
//           onPress: async () => {
//             try {
//               await IntentLauncher.startActivityAsync(
//                 IntentLauncher.ActivityAction.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
//                 { data: `package:${packageName}` }
//               );
//             } catch (err) {
//               // Some OEMs don't support this intent — fall back to the
//               // general battery settings screen so the user can find it manually
//               console.log("⚠️ Direct battery intent failed, falling back:", err);
//               try {
//                 await IntentLauncher.startActivityAsync(
//                   IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
//                 );
//               } catch (fallbackErr) {
//                 console.log("⚠️ Battery settings fallback also failed:", fallbackErr);
//               }
//             }
//           },
//         },
//       ]
//     );
//   } catch (err) {
//     console.log("⚠️ Battery optimization exemption error:", err);
//   }
// }

// // Must match the package field in app.config.js exactly
// const APP_PACKAGE = "com.yugamai.helpapp";

// export default function TabLayout() {
//   const router = useRouter();
//   const insets = useSafeAreaInsets();
//   const [role, setRole] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [fetchError, setFetchError] = useState<string | null>(null);
//   const fetchingRef = useRef(false);
//   const trackingStartedRef = useRef(false);
//   const pushTokenSavedRef = useRef(false);
//   const currentUserIdRef = useRef<string | null>(null);
//   const appStateRef = useRef(AppState.currentState);

//   // ─── Fetch role from DB ─────────────────────────────────────────────────────
//   const fetchRole = useCallback(async () => {
//     if (fetchingRef.current) return;
//     fetchingRef.current = true;
//     setLoading(true);
//     setFetchError(null);

//     const {
//       data: { user },
//       error: userError,
//     } = await supabase.auth.getUser();

//     if (userError || !user) {
//       // Ignore "session missing" — this fires on cold start before session hydrates
//       if (userError && userError.message !== "Auth session missing!") {
//         console.error("getUser error:", userError.message);
//       }
//       setLoading(false);
//       fetchingRef.current = false;
//       return;
//     }

//     currentUserIdRef.current = user.id;

//     const { data, error: roleError } = await supabase
//       .from("help_app_profiles")
//       .select("role")
//       .eq("id", user.id)
//       .maybeSingle();

//     if (roleError) {
//       console.error("fetchRole DB error:", roleError.message);
//       setFetchError("Could not load your profile. Please check your connection.");
//       setLoading(false);
//       fetchingRef.current = false;
//       return;
//     }

//     setRole(data?.role ?? null);
//     setLoading(false);
//     fetchingRef.current = false;
//   }, []);

//   // ─── Auth state listener ────────────────────────────────────────────────────
//   useEffect(() => {
//     fetchRole();

//     const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
//       if (event === "SIGNED_OUT") {
//         setRole(null);
//         setFetchError(null);
//         currentUserIdRef.current = null;
//         // Reset tracking refs on sign out so they work on next login
//         trackingStartedRef.current = false;
//         pushTokenSavedRef.current = false;
//         return;
//       }
//       if (event === "SIGNED_IN") {
//         fetchingRef.current = false;
//         setFetchError(null);
//         fetchRole();
//       }
//     });

//     return () => {
//       listener.subscription.unsubscribe();
//     };
//   }, [fetchRole]);

//   // ─── Background tracking + battery exemption ────────────────────────────────
//   useEffect(() => {
//     if (role === "user" && !trackingStartedRef.current) {
//       trackingStartedRef.current = true;
//       supabase.auth
//         .getUser()
//         .then(({ data: { user } }) => {
//           if (user) {
//             startBackgroundTracking(user.id);
//             // Request battery optimization exemption after tracking starts.
//             // Only prompts once ever (AsyncStorage guards repeat prompts).
//             requestBatteryOptimizationExemption(APP_PACKAGE);
//           }
//         })
//         .catch((err) => {
//           console.error("Background tracking start error:", err);
//         });
//     }
//   }, [role]);

//   // ─── Tracking health check on foreground ────────────────────────────────────
//   // isTaskRegisteredAsync only proves the task is registered with the OS, not
//   // that it's still alive. If the foreground service gets force-killed (OEM
//   // battery manager, Doze edge case), the registration can survive while
//   // updates silently stop forever. Checking on cold start + every foreground
//   // transition is the only reliable place to catch and recover from that.
//   useEffect(() => {
//     if (role !== "user") return;

//     const runCheck = () => {
//       if (currentUserIdRef.current) {
//         ensureTrackingHealthy(currentUserIdRef.current);
//       }
//     };

//     // Check once as soon as we know the user is a "user" role
//     runCheck();

//     const subscription = AppState.addEventListener(
//       "change",
//       (nextState: AppStateStatus) => {
//         const cameToForeground =
//           appStateRef.current.match(/inactive|background/) &&
//           nextState === "active";

//         if (cameToForeground) {
//           runCheck();
//         }

//         appStateRef.current = nextState;
//       }
//     );

//     return () => subscription.remove();
//   }, [role]);

//   // ─── Push token ─────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (role === "guardian" && !pushTokenSavedRef.current) {
//       pushTokenSavedRef.current = true;
//       (async () => {
//         try {
//           await saveExpoPushToken();
//         } catch (err) {
//           console.error("Push token save error:", err);
//         }
//       })();
//     }
//   }, [role]);

//   // ─── Redirect logic ─────────────────────────────────────────────────────────
//   useEffect(() => {
//     const checkRedirect = async () => {
//       try {
//         const redirect = await AsyncStorage.getItem("REDIRECT_HOME");
//         if (redirect === "true") {
//           await AsyncStorage.removeItem("REDIRECT_HOME");
//           router.push("/take-me-home");
//         }
//       } catch (err) {
//         console.error("AsyncStorage redirect check error:", err);
//       }
//     };
//     checkRedirect();
//   }, [router]);

//   // ─── Handlers ───────────────────────────────────────────────────────────────
//   const handleLogout = async () => {
//     try {
//       await supabase.auth.signOut();
//     } catch (err) {
//       console.error("Sign out error:", err);
//     } finally {
//       router.replace("/auth/email");
//     }
//   };

//   const handleRetry = async () => {
//     fetchingRef.current = false;
//     setFetchError(null);
//     await fetchRole();
//   };

//   // ─── Loading UI ─────────────────────────────────────────────────────────────
//   if (loading) {
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator size="large" color={COLORS.green} />
//       </View>
//     );
//   }

//   // ─── Error UI ───────────────────────────────────────────────────────────────
//   if (fetchError) {
//     return (
//       <View style={styles.messageContainer}>
//         <Text style={styles.title}>Something went wrong</Text>
//         <Text style={styles.subtitle}>{fetchError}</Text>
//         <Pressable onPress={handleRetry} style={styles.retryButton}>
//           <Text style={styles.buttonText}>Try Again</Text>
//         </Pressable>
//         <Pressable onPress={handleLogout} style={styles.logoutButton}>
//           <Text style={styles.buttonText}>Log Out</Text>
//         </Pressable>
//       </View>
//     );
//   }

//   // ─── No role UI ─────────────────────────────────────────────────────────────
//   if (!role) {
//     return (
//       <View style={styles.messageContainer}>
//         <Text style={styles.title}>No role found</Text>
//         <Text style={styles.subtitle}>
//           Your account may not be set up correctly.
//         </Text>
//         <Pressable onPress={handleRetry} style={styles.retryButton}>
//           <Text style={styles.buttonText}>Retry</Text>
//         </Pressable>
//         <Pressable onPress={handleLogout} style={styles.logoutButton}>
//           <Text style={styles.buttonText}>Log Out</Text>
//         </Pressable>
//       </View>
//     );
//   }

//   // ─── Tabs ────────────────────────────────────────────────────────────────────
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

// // ─── Styles ───────────────────────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   centered: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   messageContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 32,
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: "600",
//     marginBottom: 8,
//     textAlign: "center",
//   },
//   subtitle: {
//     fontSize: 14,
//     color: "#666",
//     marginBottom: 32,
//     textAlign: "center",
//   },
//   retryButton: {
//     backgroundColor: "#0f766e",
//     paddingVertical: 14,
//     borderRadius: 14,
//     marginBottom: 12,
//     width: "100%",
//     alignItems: "center",
//   },
//   logoutButton: {
//     backgroundColor: "#dc2626",
//     paddingVertical: 14,
//     borderRadius: 14,
//     width: "100%",
//     alignItems: "center",
//   },
//   buttonText: {
//     color: "#fff",
//     fontWeight: "600",
//   },
// });

import { Tabs, useRouter } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { COLORS } from "../../styles/colors";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/supabase/supabase";
import {
  View,
  ActivityIndicator,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
  AppState,
  AppStateStatus,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "@/services/backgroundLocation";
import {
  startBackgroundTracking,
  ensureTrackingHealthy,
} from "@/services/backgroundLocation";
import { saveExpoPushToken } from "@/services/pushToken";
import * as IntentLauncher from "expo-intent-launcher";

// ─── Battery optimization exemption ──────────────────────────────────────────
// Samsung and most Android OEMs will kill foreground services within
// minutes-to-an-hour unless the app is exempted from battery optimization.
// This prompts the user to whitelist the app — without it, background
// tracking can die silently regardless of how correct the code is.
//
// Requires: npx expo install expo-intent-launcher
//
// Only shown once (tracked via AsyncStorage) so it doesn't nag on every launch.
async function requestBatteryOptimizationExemption(packageName: string) {
  if (Platform.OS !== "android") return;

  try {
    const alreadyAsked = await AsyncStorage.getItem("BATTERY_OPT_ASKED");
    if (alreadyAsked === "true") return;

    await AsyncStorage.setItem("BATTERY_OPT_ASKED", "true");

    Alert.alert(
      "Allow Background Tracking",
      'To keep safety monitoring active when your phone is locked, please disable battery optimization for this app on the next screen.\n\nTap "All apps", find Help App, and select "Don\'t optimize".',
      [
        { text: "Not Now", style: "cancel" },
        {
          text: "Open Settings",
          onPress: async () => {
            try {
              await IntentLauncher.startActivityAsync(
                IntentLauncher.ActivityAction.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                { data: `package:${packageName}` }
              );
            } catch (err) {
              // Some OEMs don't support this intent — fall back to the
              // general battery settings screen so the user can find it manually
              console.log("⚠️ Direct battery intent failed, falling back:", err);
              try {
                await IntentLauncher.startActivityAsync(
                  IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
                );
              } catch (fallbackErr) {
                console.log("⚠️ Battery settings fallback also failed:", fallbackErr);
              }
            }
          },
        },
      ]
    );
  } catch (err) {
    console.log("⚠️ Battery optimization exemption error:", err);
  }
}

// Must match the package field in app.config.js exactly
const APP_PACKAGE = "com.yugamai.helpapp";

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const trackingStartedRef = useRef(false);
  const pushTokenSavedRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);
  const appStateRef = useRef(AppState.currentState);
  // NEW: tracks when ensureTrackingHealthy last actually ran, so a duplicate
  // trigger arriving within HEALTH_CHECK_COOLDOWN_MS of the last one gets
  // skipped instead of causing a second full health check. See the effect
  // below for why this was needed.
  const lastHealthCheckAtRef = useRef<number>(0);

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

    currentUserIdRef.current = user.id;

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
        currentUserIdRef.current = null;
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

  // ─── Background tracking + battery exemption ────────────────────────────────
  useEffect(() => {
    if (role === "user" && !trackingStartedRef.current) {
      trackingStartedRef.current = true;
      supabase.auth
        .getUser()
        .then(({ data: { user } }) => {
          if (user) {
            startBackgroundTracking(user.id);
            // Request battery optimization exemption after tracking starts.
            // Only prompts once ever (AsyncStorage guards repeat prompts).
            requestBatteryOptimizationExemption(APP_PACKAGE);
          }
        })
        .catch((err) => {
          console.error("Background tracking start error:", err);
        });
    }
  }, [role]);

  // ─── Tracking health check on foreground ────────────────────────────────────
  // CHANGED: added a cooldown guard (lastHealthCheckAtRef) so two triggers
  // firing close together — e.g. the immediate mount-time runCheck() plus an
  // AppState "active" transition arriving a few seconds later on cold start
  // (appStateRef.current's initial snapshot can be taken before Android has
  // settled into a true "active" state) — can no longer both proceed to a
  // full ensureTrackingHealthy() call. Without this, both calls saw
  // lastTimestamp === 0 (no LAST_LOCATION saved yet on a fresh install),
  // treated that as "stale" every time, and BOTH triggered a full
  // forceRestartTracking() — tearing down and rebuilding the native location
  // task twice in a row right at the most fragile moment (cold start). This
  // was confirmed in logs: two "ensureTrackingHealthy: checking" lines
  // roughly 12s apart on a fresh install, each followed by its own
  // stopBackgroundTracking -> _startLocationUpdates cycle.
  //
  // isTaskRegisteredAsync only proves the task is registered with the OS, not
  // that it's still alive. If the foreground service gets force-killed (OEM
  // battery manager, Doze edge case), the registration can survive while
  // updates silently stop forever. Checking on cold start + every foreground
  // transition is the only reliable place to catch and recover from that —
  // the cooldown just prevents that check from double-firing.
  useEffect(() => {
    if (role !== "user") return;

    const HEALTH_CHECK_COOLDOWN_MS = 20_000; // 20s — long enough to absorb the
    // cold-start double-trigger, short enough to still react promptly to a
    // genuine backgrounded-then-foregrounded transition.

    const runCheck = () => {
      const now = Date.now();
      if (now - lastHealthCheckAtRef.current < HEALTH_CHECK_COOLDOWN_MS) {
        console.log(
          "⏩ ensureTrackingHealthy skipped — last check was",
          Math.round((now - lastHealthCheckAtRef.current) / 1000),
          "s ago (cooldown)"
        );
        return;
      }
      lastHealthCheckAtRef.current = now;

      if (currentUserIdRef.current) {
        ensureTrackingHealthy(currentUserIdRef.current);
      }
    };

    // Check once as soon as we know the user is a "user" role
    runCheck();

    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        const cameToForeground =
          appStateRef.current.match(/inactive|background/) &&
          nextState === "active";

        if (cameToForeground) {
          runCheck();
        }

        appStateRef.current = nextState;
      }
    );

    return () => subscription.remove();
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