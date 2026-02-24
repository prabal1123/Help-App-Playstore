
// import { useEffect } from "react";
// import { View, ActivityIndicator } from "react-native";
// import { useRouter } from "expo-router";

// // replace later with real auth + onboarding state
// const useAuth = () => {
//   return {
//     user: null,              // null = not logged in
//     hasGuardian: false,
//     hasHome: false,
//   };
// };

// export default function ProfileGate() {
//   const router = useRouter();
//   const { user, hasGuardian, hasHome } = useAuth();

//   useEffect(() => {
//     // 1. Not logged in → start auth
//     if (!user) {
//       router.replace("/auth/email");
//       return;
//     }

//     // 2. Logged in but guardian not added
//     if (!hasGuardian) {
//       router.replace("/auth/add-guardian");
//       return;
//     }

//     // 3. Guardian done but home not set
//     if (!hasHome) {
//       router.replace("/auth/set-home");
//       return;
//     }

//     // 4. All good → profile
//     router.replace("/profile/home");
//   }, [user, hasGuardian, hasHome]);

//   return (
//     <View style={{ flex: 1, justifyContent: "center" }}>
//       <ActivityIndicator />
//     </View>
//   );
// }

// import { useEffect } from "react";
// import { View, ActivityIndicator } from "react-native";
// import { useRouter } from "expo-router";
// import { supabase } from "@/supabase/supabase";

// export default function ProfileGate() {
//   const router = useRouter();

//   useEffect(() => {
//     checkUserState();
//   }, []);

//   const checkUserState = async () => {
//     try {
//       // 1️⃣ Check Auth
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();

//       if (!user) {
//         router.replace("/auth/email");
//         return;
//       }

//       // 2️⃣ Get role
//       const { data: profile, error } = await supabase
//         .from("help_app_profiles")
//         .select("role")
//         .eq("id", user.id)
//         .single();

//       if (error || !profile) {
//         router.replace("/auth/email");
//         return;
//       }

//       // 3️⃣ Guardian → go to dashboard
//       if (profile.role === "guardian") {
//         router.replace("/auth/add-guardian");
//         return;
//       }

//       // 4️⃣ If user → check pending requests
//       const { data: requests } = await supabase
//         .from("help_app_guardian_links")
//         .select("id")
//         .eq("user_id", user.id)
//         .eq("status", "pending");

//       if (requests && requests.length > 0) {
//         router.replace("/auth/guardian-requests");
//       } else {
//         router.replace("/");
//       }

//     } catch (error) {
//       console.log("Gate Error:", error);
//       router.replace("/auth/email");
//     }
//   };

//   return (
//     <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//       <ActivityIndicator size="large" />
//     </View>
//   );
// }

// import { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   ActivityIndicator,
//   ScrollView,
//   Image,
// } from "react-native";
// import { useRouter } from "expo-router";
// import { supabase } from "@/supabase/supabase";
// import { profileStyles as styles } from "@/styles/profile";

// type ConnectionStatus = "none" | "pending" | "approved";

// export default function ProfileScreen() {
//   const router = useRouter();

//   const [loading, setLoading] = useState(true);
//   const [profile, setProfile] = useState<any>(null);
//   const [connectionStatus, setConnectionStatus] =
//     useState<ConnectionStatus>("none");

//   const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
//   const [editing, setEditing] = useState(false);

//   const [name, setName] = useState("");
//   const [dob, setDob] = useState("");
//   const [gender, setGender] = useState("");
//   const [hometown, setHometown] = useState("");

//   // Guardian-specific state
//   const [connectedUsers, setConnectedUsers] = useState<any[]>([]);
//   const [pendingRequests, setPendingRequests] = useState<any[]>([]);

//   // ---------------- INIT ----------------
//   useEffect(() => {
//     initialize();

//     const { data: listener } = supabase.auth.onAuthStateChange(
//       (_event, session) => {
//         if (!session) {
//           console.log("🔐 Logged out");
//           router.replace("/auth/email");
//         }
//       }
//     );

//     return () => {
//       listener.subscription.unsubscribe();
//     };
//   }, []);

//   const initialize = async () => {
//     console.log("🚀 Initializing profile");

//     const {
//       data: { user },
//     } = await supabase.auth.getUser();

//     if (!user) {
//       router.replace("/auth/email");
//       return;
//     }

//     const { data: profileData } = await supabase
//       .from("help_app_profiles")
//       .select("*")
//       .eq("id", user.id)
//       .maybeSingle();

//     if (!profileData) return;

//     console.log("👤 Loaded profile:", profileData.role);

//     setProfile(profileData);
//     setName(profileData.name || "");
//     setDob(profileData.dob || "");
//     setGender(profileData.gender || "");
//     setHometown(profileData.hometown || "");

//     if (profileData.role === "user") {
//       // First fetch incoming requests
//       await fetchIncomingRequests(user.id);
//       // Then check for approved connection
//       await checkConnection(user.id);
//       // Setup realtime last
//       setupUserRealtime(user.id);
//     } else if (profileData.role === "guardian") {
//       await fetchGuardianConnections(user.id);
//       setupGuardianRealtime(user.id);
//     }

//     setLoading(false);
//   };

//   const [linkedGuardian, setLinkedGuardian] = useState<any>(null);

//   // DEBUG: Check all links for this user
//   const debugCheckAllLinks = async (userId: string) => {
//     console.log("🐛 DEBUG: Checking ALL links for user:", userId);
    
//     const { data, error } = await supabase
//       .from("help_app_guardian_links")
//       .select("*")
//       .eq("user_id", userId);
    
//     console.log("🐛 ALL LINKS:", JSON.stringify(data, null, 2));
//     console.log("🐛 Error:", error);
//   };

//   // ---------------- USER: CHECK CONNECTION ----------------
//   const checkConnection = async (userId: string) => {
//     console.log("🔍 Checking connection for user ID:", userId);

//     const { data, error } = await supabase
//       .from("help_app_guardian_links")
//       .select(`
//         id,
//         status,
//         guardian:help_app_profiles!help_app_guardian_links_guardian_id_fkey (
//           id,
//           name,
//           email
//         )
//       `)
//       .eq("user_id", userId)
//       .eq("status", "approved")
//       .maybeSingle();

//     if (error) {
//       console.log("❌ Connection check error:", error);
//     }

//     console.log("🔗 Connection query result:", JSON.stringify(data, null, 2));

//     if (data) {
//       console.log("✅ Found approved connection with guardian:", data.guardian?.name);
//       setConnectionStatus("approved");
//       setLinkedGuardian(data.guardian);
//       setIncomingRequests([]); // clear all pending requests
//     } else {
//       console.log("❌ No approved connection found.");
//       // Don't set to 'none' here - let fetchIncomingRequests handle pending state
//       // Only clear if we previously had an approved connection
//       if (linkedGuardian) {
//         setLinkedGuardian(null);
//       }
//     }
//   };

//   // ---------------- USER: FETCH INCOMING REQUESTS ----------------
//   const fetchIncomingRequests = async (userId: string) => {
//     console.log("📥 Fetching incoming requests");

//     const { data, error } = await supabase
//       .from("help_app_guardian_links")
//       .select(`
//         id,
//         status,
//         guardian:help_app_profiles!help_app_guardian_links_guardian_id_fkey (
//           id,
//           name,
//           email
//         )
//       `)
//       .eq("user_id", userId)
//       .eq("status", "pending");

//     if (error) {
//       console.log("❌ Fetch error:", error);
//       return;
//     }

//     console.log("📨 Incoming requests:", data);

//     setIncomingRequests(data || []);

//     // Set status based on what we found
//     if (data && data.length > 0) {
//       console.log("✅ Setting status to PENDING - found", data.length, "requests");
//       setConnectionStatus("pending");
//     } else {
//       console.log("ℹ️ No pending requests found");
//       // Only set to 'none' if we don't have an approved connection
//       // checkConnection will handle the approved case
//       // if (!linkedGuardian) {
//       //   setConnectionStatus("none");
//       // }
//     }
//   };

//   // ---------------- USER: REALTIME ----------------
//   const setupUserRealtime = (userId: string) => {
//     console.log("🔄 Setting up user realtime");

//     let realtimeTimeout: NodeJS.Timeout;

//     supabase
//       .channel("user-guardian-realtime")
//       .on(
//         "postgres_changes",
//         {
//           event: "*",
//           schema: "public",
//           table: "help_app_guardian_links",
//           filter: `user_id=eq.${userId}`,
//         },
//         async (payload) => {
//           console.log("⚡ User realtime update received:", payload.eventType);
          
//           // Clear any pending update
//           if (realtimeTimeout) {
//             clearTimeout(realtimeTimeout);
//           }

//           // Debounce updates to avoid race conditions
//           realtimeTimeout = setTimeout(async () => {
//             await checkConnection(userId);
//             await fetchIncomingRequests(userId);
//           }, 500);
//         }
//       )
//       .subscribe();
//   };

//   // ---------------- GUARDIAN: FETCH CONNECTIONS ----------------
//   const fetchGuardianConnections = async (guardianId: string) => {
//     console.log("🔍 Fetching guardian connections");

//     // Fetch approved connections
//     const { data: approved, error: approvedError } = await supabase
//       .from("help_app_guardian_links")
//       .select(`
//         id,
//         status,
//         created_at,
//         user:help_app_profiles!help_app_guardian_links_user_id_fkey (
//           id,
//           name,
//           email,
//           dob,
//           gender,
//           hometown
//         )
//       `)
//       .eq("guardian_id", guardianId)
//       .eq("status", "approved")
//       .order("created_at", { ascending: false });

//     if (approvedError) {
//       console.log("❌ Approved fetch error:", approvedError);
//     } else {
//       console.log("✅ Connected users:", approved);
//       setConnectedUsers(approved || []);
//     }

//     // Fetch pending requests
//     const { data: pending, error: pendingError } = await supabase
//       .from("help_app_guardian_links")
//       .select(`
//         id,
//         status,
//         created_at,
//         retry_count,
//         user:help_app_profiles!help_app_guardian_links_user_id_fkey (
//           id,
//           name,
//           email
//         )
//       `)
//       .eq("guardian_id", guardianId)
//       .eq("status", "pending")
//       .order("created_at", { ascending: false });

//     if (pendingError) {
//       console.log("❌ Pending fetch error:", pendingError);
//     } else {
//       console.log("⏳ Pending requests:", pending);
//       setPendingRequests(pending || []);
//     }
//   };

//   // ---------------- GUARDIAN: REALTIME ----------------
//   const setupGuardianRealtime = (guardianId: string) => {
//     console.log("🔄 Setting up guardian realtime");

//     supabase
//       .channel("guardian-links-realtime")
//       .on(
//         "postgres_changes",
//         {
//           event: "*",
//           schema: "public",
//           table: "help_app_guardian_links",
//           filter: `guardian_id=eq.${guardianId}`,
//         },
//         async () => {
//           console.log("⚡ Guardian realtime update received");
//           await fetchGuardianConnections(guardianId);
//         }
//       )
//       .subscribe();
//   };

//   // ---------------- USER: APPROVE / REJECT ----------------
//   const updateRequestStatus = async (
//     requestId: string,
//     status: "approved" | "rejected"
//   ) => {
//     console.log("📝 Updating status:", status, "for request ID:", requestId);

//     const { data: updateData, error } = await supabase
//       .from("help_app_guardian_links")
//       .update({ status })
//       .eq("id", requestId)
//       .select(); // Add select to see what was updated

//     if (error) {
//       console.log("❌ Update error:", error);
//       return;
//     }

//     console.log("✅ Status updated successfully. Updated row:", updateData);

//     // Immediately update local state to prevent showing stale data
//     if (status === "approved") {
//       setIncomingRequests([]);
//       setConnectionStatus("approved");
//     } else if (status === "rejected") {
//       setIncomingRequests((prev) => prev.filter((req) => req.id !== requestId));
//       if (incomingRequests.length === 1) {
//         setConnectionStatus("none");
//       }
//     }

//     // Then fetch fresh data from DB
//     if (profile?.id) {
//       // Add small delay to ensure DB has committed the change
//       setTimeout(async () => {
//         console.log("🔄 Refetching after status update...");
//         await debugCheckAllLinks(profile.id); // DEBUG
//         await checkConnection(profile.id);
//         await fetchIncomingRequests(profile.id);
//       }, 300);
//     }
//   };

//   // ---------------- GUARDIAN: CANCEL REQUEST ----------------
//   const cancelRequest = async (requestId: string) => {
//     console.log("🗑️ Canceling request:", requestId);

//     const { error } = await supabase
//       .from("help_app_guardian_links")
//       .delete()
//       .eq("id", requestId);

//     if (error) {
//       console.log("❌ Cancel error:", error);
//       return;
//     }

//     if (profile?.id) {
//       await fetchGuardianConnections(profile.id);
//     }
//   };

//   // ---------------- SAVE PROFILE ----------------
//   const saveProfile = async () => {
//     if (!profile) return;

//     await supabase
//       .from("help_app_profiles")
//       .update({
//         name,
//         dob,
//         gender,
//         hometown,
//       })
//       .eq("id", profile.id);

//     setEditing(false);
//   };

//   // ---------------- LOGOUT ----------------
//   const handleLogout = async () => {
//     console.log("🚪 Logging out");
//     await supabase.auth.signOut();
//   };

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" />
//       </View>
//     );
//   }

//   const isUser = profile?.role === "user";

//   return (
//     <ScrollView style={styles.container}>
//       {/* HEADER */}
//       <View style={styles.header}>
//         <Image
//           source={{ uri: "https://i.pravatar.cc/300" }}
//           style={styles.avatar}
//         />

//         {editing ? (
//           <>
//             <TextInput
//               value={name}
//               onChangeText={setName}
//               style={styles.input}
//               placeholder="Full Name"
//             />
//             <TextInput
//               value={dob}
//               onChangeText={setDob}
//               style={styles.input}
//               placeholder="YYYY-MM-DD"
//             />
//             <TextInput
//               value={gender}
//               onChangeText={setGender}
//               style={styles.input}
//               placeholder="Gender"
//             />
//             <TextInput
//               value={hometown}
//               onChangeText={setHometown}
//               style={styles.input}
//               placeholder="Hometown"
//             />

//             <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
//               <Text style={styles.saveText}>Save</Text>
//             </TouchableOpacity>
//           </>
//         ) : (
//           <>
//             <Text style={styles.name}>{profile?.name}</Text>
//             <Text style={styles.sub}>{profile?.email}</Text>

//             <TouchableOpacity
//               style={styles.editBtn}
//               onPress={() => setEditing(true)}
//             >
//               <Text style={styles.editText}>Edit Profile</Text>
//             </TouchableOpacity>

//             <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
//               <Text style={styles.logoutText}>Logout</Text>
//             </TouchableOpacity>
//           </>
//         )}
//       </View>

//       {/* USER CONNECTION SECTION */}
//       {isUser && !editing && (
//         <View style={styles.card}>
//           <Text style={styles.sectionTitle}>Guardian Connection</Text>

//           {connectionStatus === "approved" && linkedGuardian && (
//             <View>
//               <Text style={styles.connectedText}>Guardian Connected ✅</Text>
//               <Text style={{ fontWeight: "600" }}>{linkedGuardian.name}</Text>
//               <Text style={{ color: "#666" }}>{linkedGuardian.email}</Text>
//             </View>
//           )}

//           {/* Show incoming requests if we have any */}
//           {incomingRequests.length > 0 && (
//             <View style={{ marginTop: connectionStatus === "approved" ? 20 : 0 }}>
//               <Text style={{ fontWeight: "600", marginBottom: 10 }}>
//                 Incoming Requests ({incomingRequests.length})
//               </Text>

//               {incomingRequests.map((req) => (
//                 <View key={req.id} style={{ marginBottom: 15 }}>
//                   <Text style={{ fontWeight: "600" }}>
//                     {req.guardian?.name}
//                   </Text>
//                   <Text style={{ color: "#666", marginBottom: 8 }}>
//                     {req.guardian?.email}
//                   </Text>

//                   <View style={{ flexDirection: "row", gap: 10 }}>
//                     <TouchableOpacity
//                       style={[styles.primaryBtn, { flex: 1 }]}
//                       onPress={() => updateRequestStatus(req.id, "approved")}
//                     >
//                       <Text style={styles.primaryBtnText}>Approve</Text>
//                     </TouchableOpacity>

//                     <TouchableOpacity
//                       style={[
//                         styles.primaryBtn,
//                         { flex: 1, backgroundColor: "#D9534F" },
//                       ]}
//                       onPress={() => updateRequestStatus(req.id, "rejected")}
//                     >
//                       <Text style={styles.primaryBtnText}>Reject</Text>
//                     </TouchableOpacity>
//                   </View>
//                 </View>
//               ))}
//             </View>
//           )}

//           {/* Show "Add Guardian" button only if no connection AND no pending requests */}
//           {connectionStatus === "none" && incomingRequests.length === 0 && (
//             <>
//               <Text style={styles.notConnectedText}>
//                 No Guardian Connected ❌
//               </Text>

//               <TouchableOpacity
//                 style={styles.primaryBtn}
//                 onPress={() => router.push("/auth/add-guardian")}
//               >
//                 <Text style={styles.primaryBtnText}>Add Guardian</Text>
//               </TouchableOpacity>
//             </>
//           )}
//         </View>
//       )}

//       {/* GUARDIAN DASHBOARD SECTION */}
//       {profile?.role === "guardian" && !editing && (
//         <View style={styles.card}>
//           <Text style={styles.sectionTitle}>Guardian Dashboard</Text>

//           <TouchableOpacity
//             style={styles.primaryBtn}
//             onPress={() => router.push("/auth/guardian-invite")}
//           >
//             <Text style={styles.primaryBtnText}>Add User</Text>
//           </TouchableOpacity>

//           {/* CONNECTED USERS */}
//           {connectedUsers.length > 0 && (
//             <View style={{ marginTop: 20 }}>
//               <Text style={{ fontWeight: "600", fontSize: 16, marginBottom: 10 }}>
//                 Connected Users ({connectedUsers.length})
//               </Text>

//               {connectedUsers.map((connection) => (
//                 <View
//                   key={connection.id}
//                   style={{
//                     backgroundColor: "#E8F5E9",
//                     padding: 12,
//                     borderRadius: 8,
//                     marginBottom: 10,
//                   }}
//                 >
//                   <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
//                     <View style={{ flex: 1 }}>
//                       <Text style={{ fontWeight: "600", fontSize: 15 }}>
//                         {connection.user?.name || "No Name"}
//                       </Text>
//                       <Text style={{ color: "#666", fontSize: 13 }}>
//                         {connection.user?.email}
//                       </Text>
//                       {connection.user?.dob && (
//                         <Text style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
//                           DOB: {connection.user.dob}
//                         </Text>
//                       )}
//                       {connection.user?.hometown && (
//                         <Text style={{ color: "#666", fontSize: 12 }}>
//                           From: {connection.user.hometown}
//                         </Text>
//                       )}
//                     </View>
//                     <Text style={{ fontSize: 20 }}>✅</Text>
//                   </View>
//                 </View>
//               ))}
//             </View>
//           )}

//           {/* PENDING REQUESTS */}
//           {pendingRequests.length > 0 && (
//             <View style={{ marginTop: 20 }}>
//               <Text style={{ fontWeight: "600", fontSize: 16, marginBottom: 10 }}>
//                 Pending Requests ({pendingRequests.length})
//               </Text>

//               {pendingRequests.map((request) => (
//                 <View
//                   key={request.id}
//                   style={{
//                     backgroundColor: "#FFF3E0",
//                     padding: 12,
//                     borderRadius: 8,
//                     marginBottom: 10,
//                   }}
//                 >
//                   <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
//                     <View style={{ flex: 1 }}>
//                       <Text style={{ fontWeight: "600", fontSize: 15 }}>
//                         {request.user?.name || "No Name"}
//                       </Text>
//                       <Text style={{ color: "#666", fontSize: 13 }}>
//                         {request.user?.email}
//                       </Text>
//                       <Text style={{ color: "#999", fontSize: 12, marginTop: 4 }}>
//                         Sent: {new Date(request.created_at).toLocaleDateString()}
//                       </Text>
//                       {request.retry_count > 0 && (
//                         <Text style={{ color: "#F57C00", fontSize: 12 }}>
//                           Retry {request.retry_count}/3
//                         </Text>
//                       )}
//                     </View>
//                     <View>
//                       <Text style={{ fontSize: 20 }}>⏳</Text>
//                       <TouchableOpacity
//                         style={{
//                           marginTop: 8,
//                           paddingVertical: 4,
//                           paddingHorizontal: 8,
//                           backgroundColor: "#D9534F",
//                           borderRadius: 4,
//                         }}
//                         onPress={() => cancelRequest(request.id)}
//                       >
//                         <Text style={{ color: "#fff", fontSize: 11 }}>Cancel</Text>
//                       </TouchableOpacity>
//                     </View>
//                   </View>
//                 </View>
//               ))}
//             </View>
//           )}

//           {/* EMPTY STATE */}
//           {connectedUsers.length === 0 && pendingRequests.length === 0 && (
//             <View style={{ marginTop: 20, alignItems: "center", padding: 20 }}>
//               <Text style={{ color: "#999", textAlign: "center" }}>
//                 No users connected yet.{"\n"}
//                 Click "Add User" to send an invite.
//               </Text>
//             </View>
//           )}
//         </View>
//       )}
//     </ScrollView>
//   );
// }

import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/supabase/supabase";
import { profileStyles as styles } from "@/styles/profile";

type ConnectionStatus = "none" | "pending" | "approved";

export default function ProfileScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);

  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("none");

  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [linkedGuardian, setLinkedGuardian] = useState<any>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [hometown, setHometown] = useState("");

  useEffect(() => {
    initialize();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) router.replace("/auth/email");
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const initialize = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/auth/email");
      return;
    }

    const { data: profileData } = await supabase
      .from("help_app_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!profileData) {
      setLoading(false);
      return;
    }

    setProfile(profileData);

    setName(profileData.name || "");
    setPhone(profileData.phone || "");
    setDob(profileData.dob || "");
    setGender(profileData.gender || "");
    setHometown(profileData.hometown || "");

    if (profileData.role === "user") {
      await fetchIncomingRequests(user.id);
      await checkConnection(user.id);
      setupUserRealtime(user.id);
    } else {
      await fetchGuardianConnections(user.id);
      setupGuardianRealtime(user.id);
    }

    setLoading(false);
  };

  // ---------------- USER ----------------

  const checkConnection = async (userId: string) => {
    const { data } = await supabase
      .from("help_app_guardian_links")
      .select(
        `
        id,
        status,
        guardian:help_app_profiles!help_app_guardian_links_guardian_id_fkey (
          id,
          name,
          email
        )
      `
      )
      .eq("user_id", userId)
      .eq("status", "approved")
      .maybeSingle();

    if (data) {
      setConnectionStatus("approved");
      setLinkedGuardian(data.guardian);
      setIncomingRequests([]);
    } else {
      setLinkedGuardian(null);
    }
  };

  const fetchIncomingRequests = async (userId: string) => {
    const { data } = await supabase
      .from("help_app_guardian_links")
      .select(
        `
        id,
        status,
        guardian:help_app_profiles!help_app_guardian_links_guardian_id_fkey (
          id,
          name,
          email
        )
      `
      )
      .eq("user_id", userId)
      .eq("status", "pending");

    setIncomingRequests(data || []);
    setConnectionStatus(data && data.length > 0 ? "pending" : "none");
  };

  const setupUserRealtime = (userId: string) => {
    supabase
      .channel("user-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "help_app_guardian_links",
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          await checkConnection(userId);
          await fetchIncomingRequests(userId);
        }
      )
      .subscribe();
  };

  // ---------------- GUARDIAN ----------------

  const fetchGuardianConnections = async (guardianId: string) => {
    const { data: approved } = await supabase
      .from("help_app_guardian_links")
      .select(
        `
        id,
        status,
        created_at,
        user:help_app_profiles!help_app_guardian_links_user_id_fkey (
          id,
          name,
          email,
          dob,
          gender,
          hometown
        )
      `
      )
      .eq("guardian_id", guardianId)
      .eq("status", "approved");

    setConnectedUsers(approved || []);

    const { data: pending } = await supabase
      .from("help_app_guardian_links")
      .select(
        `
        id,
        status,
        created_at,
        user:help_app_profiles!help_app_guardian_links_user_id_fkey (
          id,
          name,
          email
        )
      `
      )
      .eq("guardian_id", guardianId)
      .eq("status", "pending");

    setPendingRequests(pending || []);
  };

  const setupGuardianRealtime = (guardianId: string) => {
    supabase
      .channel("guardian-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "help_app_guardian_links",
          filter: `guardian_id=eq.${guardianId}`,
        },
        async () => {
          await fetchGuardianConnections(guardianId);
        }
      )
      .subscribe();
  };

  // ---------------- SAVE PROFILE ----------------

  const saveProfile = async () => {
    if (!profile) return;

    if (
      !name.trim() ||
      !phone.trim() ||
      !dob.trim() ||
      !gender.trim() ||
      !hometown.trim()
    ) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }

    const { error } = await supabase
      .from("help_app_profiles")
      .update({
        name: name.trim(),
        phone: phone.trim(),
        dob,
        gender,
        hometown,
      })
      .eq("id", profile.id);

    if (error) {
      Alert.alert("Error", "Failed to save profile.");
      return;
    }

    await initialize();
    setEditing(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={{ uri: "https://i.pravatar.cc/300" }}
          style={styles.avatar}
        />

        {editing ? (
          <>
            <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Full Name" />
            <TextInput value={phone} onChangeText={setPhone} style={styles.input} placeholder="Phone Number" keyboardType="phone-pad" />
            <TextInput value={dob} onChangeText={setDob} style={styles.input} placeholder="YYYY-MM-DD" />
            <TextInput value={gender} onChangeText={setGender} style={styles.input} placeholder="Gender" />
            <TextInput value={hometown} onChangeText={setHometown} style={styles.input} placeholder="Hometown" />

            <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.name}>{profile?.name}</Text>
            <Text style={styles.sub}>{profile?.email}</Text>
            <Text style={styles.sub}>📞 {profile?.phone}</Text>

            <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
              <Text style={styles.editText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* GUARDIAN DASHBOARD */}
      {profile?.role === "guardian" && !editing && (
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 15 }}>
            Your Users
          </Text>

          {connectedUsers.length > 0 ? (
            connectedUsers.map((connection) => (
              <View
                key={connection.id}
                style={{
                  backgroundColor: "#E8F5E9",
                  padding: 15,
                  borderRadius: 8,
                  marginBottom: 10,
                }}
              >
                <Text style={{ fontWeight: "600" }}>
                  {connection.user?.name}
                </Text>
                <Text style={{ color: "#666" }}>
                  {connection.user?.email}
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ color: "#999" }}>
              No approved users yet.
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}
