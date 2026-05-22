// import {
//   View,
//   Text,
//   Pressable,
//   FlatList,
//   StyleSheet,
//   ActivityIndicator,
//   RefreshControl,
// } from "react-native";
// import { useEffect, useState, useCallback } from "react";
// import { useRouter } from "expo-router";
// import { supabase } from "@/supabase/supabase";
// import {
//   SafeAreaView,
//   useSafeAreaInsets,
// } from "react-native-safe-area-context";

// export default function GuardianDashboard() {
//   const router = useRouter();
//   const insets = useSafeAreaInsets();

//   const [approvedUsers, setApprovedUsers] = useState<any[]>([]);
//   // ✅ FIX: loading state so list doesn't flash empty on mount
//   const [loading, setLoading] = useState(true);
//   // ✅ FIX: separate refreshing state for pull-to-refresh
//   const [refreshing, setRefreshing] = useState(false);
//   // ✅ FIX: error state so user knows if something went wrong
//   const [fetchError, setFetchError] = useState<string | null>(null);

//   // ─── Fetch approved users ─────────────────────────────────────────────────
//   // ✅ FIX: wrapped in useCallback so useEffect dep array is stable
//   const fetchApprovedUsers = useCallback(async () => {
//     try {
//       setFetchError(null);

//       // ✅ FIX: handle getUser error
//       const { data: { user }, error: userError } = await supabase.auth.getUser();
//       if (userError || !user) {
//         setFetchError("Could not verify your session. Please log in again.");
//         return;
//       }

//       const { data, error } = await supabase
//         .from("help_app_guardian_links")
//         .select(`
//           id,
//           user_id,
//           help_app_profiles!help_app_guardian_links_user_id_fkey (
//             id,
//             email,
//             name
//           )
//         `)
//         .eq("guardian_id", user.id)
//         .eq("status", "approved");

//       // ✅ FIX: handle DB query error — was silently staying empty before
//       if (error) {
//         console.error("fetchApprovedUsers error:", error.message);
//         setFetchError("Could not load users. Please try again.");
//         return;
//       }

//       setApprovedUsers(data || []);
//     } catch (err) {
//       console.error("fetchApprovedUsers error:", err);
//       setFetchError("Something went wrong. Please try again.");
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, []);

//   // ✅ FIX: fetchApprovedUsers in deps array
//   useEffect(() => {
//     fetchApprovedUsers();
//   }, [fetchApprovedUsers]);

//   // ─── Pull to refresh ──────────────────────────────────────────────────────
//   const handleRefresh = () => {
//     setRefreshing(true);
//     fetchApprovedUsers();
//   };

//   // ─── Loading UI ───────────────────────────────────────────────────────────
//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <Text style={styles.heading}>Your Users</Text>
//         <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//           <ActivityIndicator size="large" color="#2e9e8f" />
//         </View>
//       </SafeAreaView>
//     );
//   }

//   // ─── Main UI ──────────────────────────────────────────────────────────────
//   return (
//     <SafeAreaView style={styles.container}>
//       <Text style={styles.heading}>Your Users</Text>

//       {/* ✅ FIX: error banner */}
//       {fetchError && (
//         <View style={styles.errorBanner}>
//           <Text style={styles.errorText}>{fetchError}</Text>
//           <Pressable onPress={fetchApprovedUsers}>
//             <Text style={styles.retryText}>Retry</Text>
//           </Pressable>
//         </View>
//       )}

//       <FlatList
//         data={approvedUsers}
//         keyExtractor={(item) => item.id}
//         contentContainerStyle={{ paddingBottom: 140 }}
//         // ✅ FIX: pull-to-refresh
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={handleRefresh}
//             colors={["#2e9e8f"]}
//             tintColor="#2e9e8f"
//           />
//         }
//         renderItem={({ item }) => (
//           <View style={styles.card}>
//             <Text style={styles.userName}>
//               {/* ✅ FIX: use `name` not `full_name` — matches rest of codebase */}
//               {item.help_app_profiles?.name || "No Name"}
//             </Text>
//             <Text style={styles.userEmail}>
//               {item.help_app_profiles?.email}
//             </Text>
//           </View>
//         )}
//         ListEmptyComponent={
//           !fetchError ? (
//             <View style={styles.emptyContainer}>
//               <Text style={styles.emptyText}>No approved users yet.</Text>
//               <Text style={styles.emptySubText}>
//                 Add users to start tracking and managing them.
//               </Text>
//             </View>
//           ) : null
//         }
//       />

//       <Pressable
//         style={[styles.button, { bottom: insets.bottom + 10 }]}
//         onPress={() => router.push("/auth/guardian-invite")}
//       >
//         <Text style={styles.buttonText}>+ Add User</Text>
//       </Pressable>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingHorizontal: 20,
//     paddingTop: 10,
//     backgroundColor: "#f8fafc",
//   },
//   heading: {
//     fontSize: 26,
//     fontWeight: "700",
//     marginBottom: 20,
//   },
//   card: {
//     backgroundColor: "#fff",
//     padding: 16,
//     borderRadius: 14,
//     marginBottom: 12,
//     shadowColor: "#000",
//     shadowOpacity: 0.05,
//     shadowRadius: 6,
//     elevation: 3,
//   },
//   userName: {
//     fontSize: 16,
//     fontWeight: "600",
//     marginBottom: 4,
//   },
//   userEmail: {
//     fontSize: 14,
//     color: "#666",
//   },
//   emptyContainer: {
//     marginTop: 80,
//     alignItems: "center",
//   },
//   emptyText: {
//     fontSize: 16,
//     fontWeight: "600",
//     marginBottom: 6,
//   },
//   emptySubText: {
//     fontSize: 14,
//     color: "#777",
//     textAlign: "center",
//     paddingHorizontal: 20,
//   },
//   errorBanner: {
//     backgroundColor: "#fff5f5",
//     borderColor: "#dc2626",
//     borderWidth: 1,
//     borderRadius: 12,
//     padding: 14,
//     marginBottom: 16,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   errorText: {
//     color: "#dc2626",
//     fontSize: 13,
//     flex: 1,
//     marginRight: 10,
//   },
//   retryText: {
//     color: "#dc2626",
//     fontWeight: "700",
//     fontSize: 13,
//   },
//   button: {
//     position: "absolute",
//     left: 20,
//     right: 20,
//     backgroundColor: "#2e9e8f",
//     paddingVertical: 16,
//     borderRadius: 16,
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   buttonText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "600",
//   },
// });


import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "expo-router";
import { supabase } from "@/supabase/supabase";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

// ✅ Fix 1: Proper types instead of any[]
type UserProfile = {
  id: string;
  email: string;
  name: string | null;
};

type GuardianLink = {
  id: string;
  user_id: string;
  help_app_profiles: UserProfile | null;
};

export default function GuardianDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [approvedUsers, setApprovedUsers] = useState<GuardianLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ✅ Fix 3: Track in-flight requests to prevent race conditions
  const fetchingRef = useRef(false);

  const fetchApprovedUsers = useCallback(async (isRefresh = false) => {
    // ✅ Fix 3: Bail if a fetch is already running
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      setFetchError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setFetchError("Could not verify your session. Please log in again.");
        return;
      }

      const { data, error } = await supabase
        .from("help_app_guardian_links")
        .select(`
          id,
          user_id,
          help_app_profiles!help_app_guardian_links_user_id_fkey (
            id,
            email,
            name
          )
        `)
        .eq("guardian_id", user.id)
        .eq("status", "approved");

      if (error) {
        console.error("fetchApprovedUsers error:", error.message);
        // ✅ Fix 7: On refresh failure, keep old data — only show error, don't wipe list
        if (!isRefresh) setApprovedUsers([]);
        setFetchError("Could not load users. Pull down to retry.");
        return;
      }

      // ✅ Fix 5: Normalize profile — Supabase can return relation as array or object
      const normalized: GuardianLink[] = (data || []).map((item: any) => ({
        ...item,
        help_app_profiles: Array.isArray(item.help_app_profiles)
          ? item.help_app_profiles[0] ?? null
          : item.help_app_profiles ?? null,
      }));

      setApprovedUsers(normalized);
    } catch (err) {
      console.error("fetchApprovedUsers error:", err);
      setFetchError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchApprovedUsers(false);
  }, [fetchApprovedUsers]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchApprovedUsers(true);
  }, [fetchApprovedUsers]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.heading}>Your Users</Text>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          {/* ✅ Fix 4: Consistent brand color */}
          <ActivityIndicator size="large" color="#2B3F77" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Your Users</Text>

      {/* ✅ Fix 7: Only show error banner when list is empty (no stale data to show) */}
      {fetchError && approvedUsers.length === 0 && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{fetchError}</Text>
          <Pressable onPress={() => fetchApprovedUsers(false)}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Show subtle inline error on refresh failure when data already exists */}
      {fetchError && approvedUsers.length > 0 && (
        <Text style={styles.inlineError}>
          ⚠ Refresh failed — showing last loaded data
        </Text>
      )}

      <FlatList
        data={approvedUsers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#2B3F77"]}
            tintColor="#2B3F77"
          />
        }
        renderItem={({ item }) => (
          // ✅ Fix 6: Card is now tappable — navigate to user detail
          <Pressable
            style={({ pressed }) => [
              styles.card,
              pressed && { opacity: 0.75 },
            ]}
            onPress={() =>
              router.push({
                pathname: "/auth/guardian-invite",
                params: { userId: item.user_id },
              })
            }
          >
            <Text style={styles.userName}>
              {/* ✅ Fix 5: Safe access after normalization */}
              {item.help_app_profiles?.name || "No Name"}
            </Text>
            <Text style={styles.userEmail}>
              {item.help_app_profiles?.email || "No Email"}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          !fetchError ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No approved users yet.</Text>
              <Text style={styles.emptySubText}>
                Add users to start tracking and managing them.
              </Text>
            </View>
          ) : null
        }
      />

      <Pressable
        style={[styles.button, { bottom: insets.bottom + 10 }]}
        onPress={() => router.push("/auth/guardian-invite")}
      >
        <Text style={styles.buttonText}>+ Add User</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: "#f8fafc",
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
  emptyContainer: {
    marginTop: 80,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  emptySubText: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  errorBanner: {
    backgroundColor: "#fff5f5",
    borderColor: "#dc2626",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 13,
    flex: 1,
    marginRight: 10,
  },
  retryText: {
    color: "#dc2626",
    fontWeight: "700",
    fontSize: 13,
  },
  inlineError: {
    color: "#92400e",
    backgroundColor: "#fffbeb",
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    marginBottom: 12,
    textAlign: "center",
  },
  button: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: "#2B3F77",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});