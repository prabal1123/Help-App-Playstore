// import { useEffect, useState, useCallback } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   ActivityIndicator,
//   ScrollView,
//   Alert,
//   Pressable,
//   Modal,
//   Animated,
//   Easing
// } from "react-native";
// import { useRouter } from "expo-router";
// import { supabase } from "@/supabase/supabase";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// import DateTimePicker from "@react-native-community/datetimepicker";
// import RNPickerSelect from "react-native-picker-select";
// import { useRef } from "react";
// import CountryPicker from "react-native-country-picker-modal";
// const COLORS = {
//   primary: "#0f766e",
//   accent: "#14b8a6",
//   danger: "#dc2626",
//   bg: "#f8fafc",
//   card: "#ffffff",
//   textMain: "#0f172a",
//   textSub: "#64748b",
//   border: "#e2e8f0",
// };

// function InitialsAvatar({ name }: { name: string }) {
//   const safeName = name?.trim() || "?";
//   const initials =
//     safeName
//       .split(" ")
//       .map((n) => n[0] ?? "")
//       .join("")
//       .toUpperCase()
//       .slice(0, 2) || "?";

//   return (
//     <View
//       style={{
//         width: 90,
//         height: 90,
//         borderRadius: 45,
//         backgroundColor: COLORS.primary,
//         alignItems: "center",
//         justifyContent: "center",
//       }}
//     >
//       <Text style={{ color: "#fff", fontSize: 32, fontWeight: "700" }}>
//         {initials}
//       </Text>
//     </View>
//   );
// }

// type UserProfile = {
//   id: string;
//   email: string;
//   name: string | null;
//   phone: string | null;
//   dob: string | null;
//   gender: string | null;
//   hometown: string | null;
//   role: "user" | "guardian";
// };

// type ConnectedUser = {
//   id: string;
//   user: { id: string; name: string | null; email: string | null } | null;
// };

// type LinkedGuardian = {
//   id: string;
//   guardian: { id: string; name: string | null; email: string | null } | null;
// };

// export default function ProfileScreen() {
//   const router = useRouter();
// const [countryCode, setCountryCode] = useState("IN");
// const [callingCode, setCallingCode] = useState("91");
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [profile, setProfile] = useState<UserProfile | null>(null);
//   const [editing, setEditing] = useState(false);
//   const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

//   const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
//   const [linkedGuardians, setLinkedGuardians] = useState<LinkedGuardian[]>([]);

//   const [errors, setErrors] = useState<any>({});
//   const [showDatePicker, setShowDatePicker] = useState(false);


  
//   const [name, setName] = useState("");
//   const [phone, setPhone] = useState("");
//   const [dob, setDob] = useState("");
//   const [gender, setGender] = useState("");
//   const [hometown, setHometown] = useState("");

//   // ─── Connection manage modal state ────────────────────────────────────────
//   const [manageTarget, setManageTarget] = useState<ConnectedUser | null>(null);
//   const [manageModalVisible, setManageModalVisible] = useState(false);

//   // ─── Role switching state ──────────────────────────────────────────────────
//   const [changingRole, setChangingRole] = useState(false);

//   const fetchGuardianConnections = useCallback(async (guardianId: string) => {
//     try {
//       const { data, error } = await supabase
//         .from("help_app_guardian_links")
//         .select(`
//           id,
//           user:help_app_profiles!help_app_guardian_links_user_id_fkey (
//             id, name, email
//           )
//         `)
//         .eq("guardian_id", guardianId)
//         .eq("status", "approved");

//       if (error) console.error("fetchGuardianConnections error:", error.message);

//       const normalized: ConnectedUser[] = (data || []).map((item: any) => ({
//         id: item.id,
//         user: Array.isArray(item.user)
//           ? item.user[0] ?? null
//           : item.user ?? null,
//       }));

//       setConnectedUsers(normalized);
//     } catch (err) {
//       console.error("fetchGuardianConnections error:", err);
//     }
//   }, []);

//   const fetchLinkedGuardians = useCallback(async (userId: string) => {
//     try {
//       const { data, error } = await supabase
//         .from("help_app_guardian_links")
//         .select(`
//           id,
//           guardian:help_app_profiles!help_app_guardian_links_guardian_id_fkey (
//             id, name, email
//           )
//         `)
//         .eq("user_id", userId)
//         .eq("status", "approved");

//       if (error) console.error("fetchLinkedGuardians error:", error.message);

//       const normalized: LinkedGuardian[] = (data || []).map((item: any) => ({
//         id: item.id,
//         guardian: Array.isArray(item.guardian)
//           ? item.guardian[0] ?? null
//           : item.guardian ?? null,
//       }));

//       setLinkedGuardians(normalized);
//     } catch (err) {
//       console.error("fetchLinkedGuardians error:", err);
//     }
//   }, []);

//   const initialize = useCallback(async () => {
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();

//       if (sessionError || !session) {
//         router.replace("/auth/get-started");
//         return;
//       }

//       const user = session.user;

//       const { data: profileData, error: profileError } = await supabase
//         .from("help_app_profiles")
//         .select("id, email, name, phone, dob, gender, hometown, role")
//         .eq("id", user.id)
//         .maybeSingle();

//       if (profileError) {
//         console.error("Profile fetch error:", profileError.message);
//         return;
//       }

//       if (!profileData) return;

//       setProfile(profileData as UserProfile);
//       setName(profileData.name || "");
//       setPhone(profileData.phone || "");
//       setDob(profileData.dob || "");
//       setGender(profileData.gender || "");
//       setHometown(profileData.hometown || "");

//       if (profileData.role === "guardian") {
//         fetchGuardianConnections(user.id);
//       } else {
//         fetchLinkedGuardians(user.id);
//       }
//     } catch (err) {
//       console.error("Profile init error:", err);
//     } finally {
//       setLoading(false);
//     }
//   }, [router, fetchGuardianConnections, fetchLinkedGuardians]);

//   useEffect(() => {
//   initialize();

//   let channel: any;

//   if (profile?.id) {
//     channel = supabase
//       .channel("guardian-links-changes")
//       .on(
//         "postgres_changes",
//         {
//           event: "*",
//           schema: "public",
//           table: "help_app_guardian_links",
//         },
//         (payload) => {
//           console.log("Realtime update:", payload);

//           if (!profile) return;

//           if (profile.role === "guardian") {
//             fetchGuardianConnections(profile.id);
//           } else {
//             fetchLinkedGuardians(profile.id);
//           }
//         }
//       )
//       .subscribe();
//   }

//   const { data: listener } = supabase.auth.onAuthStateChange(
//     (_event, session) => {
//       if (!session) router.replace("/auth/get-started");
//     }
//   );

//   return () => {
//     listener.subscription.unsubscribe();
//     if (channel) supabase.removeChannel(channel);
//   };
// }, [profile]);

//   // ─── Save profile ──────────────────────────────────────────────────────────
  
//   const saveProfile = async () => {
//     if (!profile) return;

//     if (!validate()) return;
//     if (!phone.trim()) return Alert.alert("Missing field", "Please enter your phone number.");
//     if (!dob.trim()) return Alert.alert("Missing field", "Please enter your date of birth.");
//     if (!gender.trim()) return Alert.alert("Missing field", "Please enter your gender.");
//     if (!hometown.trim()) return Alert.alert("Missing field", "Please enter your hometown.");

//     setSaving(true);
//     try {
//       const {
//         data: { user },
//         error: userError,
//       } = await supabase.auth.getUser();

//       if (userError || !user) {
//         Alert.alert("Session error", "Please log in again.");
//         return;
//       }

//       const { error } = await supabase
//         .from("help_app_profiles")
//         .update({name,phone: `+${callingCode}${phone}`,dob,gender,hometown})
//         .eq("id", user.id);

//       if (error) {
//         Alert.alert("Error", "Could not save profile. Please try again.");
//         return;
//       }

//       setProfile((prev) =>
//         prev ? { ...prev, name, phone, dob, gender, hometown } : prev
//       );
//       setEditing(false);
//       setHasUnsavedChanges(false);
//       Alert.alert("Success", "Profile updated successfully.");
//     } catch (err) {
//       console.error("saveProfile error:", err);
//       Alert.alert("Error", "Something went wrong. Please try again.");
//     } finally {
//       setSaving(false);
//     }
//   };
// const nameAnim = useRef(new Animated.Value(name ? 1 : 0)).current;
// const hometownAnim = useRef(new Animated.Value(hometown ? 1 : 0)).current;

// const validate = () => {
//   let e: any = {};

//   if (!name.trim()) e.name = "Full name is required";

//   if (!phone.trim()) e.phone = "Phone required";
//   else if (phone.length < 6) e.phone = "Invalid number";

//   if (!dob.trim()) e.dob = "DOB required";
//   if (!gender.trim()) e.gender = "Select gender";
//   if (!hometown.trim()) e.hometown = "Hometown required";

//   setErrors(e);
//   return Object.keys(e).length === 0;
// };
//   // ─── Cancel edit ───────────────────────────────────────────────────────────
//   const handleCancelEdit = () => {
//     if (hasUnsavedChanges) {
//       Alert.alert(
//         "Discard changes?",
//         "You have unsaved changes. Are you sure you want to cancel?",
//         [
//           { text: "Keep editing", style: "cancel" },
//           {
//             text: "Discard",
//             style: "destructive",
//             onPress: () => {
//               setName(profile?.name || "");
//               setPhone(profile?.phone || "");
//               setDob(profile?.dob || "");
//               setGender(profile?.gender || "");
//               setHometown(profile?.hometown || "");
//               setEditing(false);
//               setHasUnsavedChanges(false);
//             },
//           },
//         ]
//       );
//     } else {
//       setEditing(false);
//     }
//   };

//   // ─── Logout ────────────────────────────────────────────────────────────────
//   const handleLogout = async () => {
//     Alert.alert("Logout", "Are you sure?", [
//       { text: "Cancel", style: "cancel" },
//       {
//         text: "Logout",
//         style: "destructive",
//         onPress: async () => {
//           try {
//             await AsyncStorage.removeItem("terms_accepted");
//             await supabase.auth.signOut();
//             router.replace("/auth/get-started");
//           } catch (err) {
//             console.error("Logout error:", err);
//             router.replace("/auth/get-started");
//           }
//         },
//       },
//     ]);
//   };

//   // ─── Change role ───────────────────────────────────────────────────────────
//   const handleChangeRole = () => {
//     if (!profile) return;

//     const newRole = profile.role === "guardian" ? "user" : "guardian";
//     const label = newRole === "guardian" ? "Guardian" : "User";

//     Alert.alert(
//       "Switch Role",
//       `Switch your role to "${label}"? This will update your account type.`,
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: `Switch to ${label}`,
//           onPress: async () => {
//             setChangingRole(true);
//             try {
//               const {
//                 data: { user },
//                 error: userError,
//               } = await supabase.auth.getUser();

//               if (userError || !user) {
//                 Alert.alert("Session error", "Please log in again.");
//                 return;
//               }

//               const { error } = await supabase
//                 .from("help_app_profiles")
//                 .update({ role: newRole })
//                 .eq("id", user.id);

//               if (error) {
//                 Alert.alert("Error", "Could not update role. Please try again.");
//                 return;
//               }

//               setProfile((prev) => prev ? { ...prev, role: newRole } : prev);

//               // Refresh connections for the new role
//               if (newRole === "guardian") {
//                 setLinkedGuardians([]);
//                 fetchGuardianConnections(user.id);
//               } else {
//                 setConnectedUsers([]);
//                 fetchLinkedGuardians(user.id);
//               }

//               Alert.alert("Done", `Your role has been switched to ${label}.`);
//             } catch (err) {
//               console.error("changeRole error:", err);
//               Alert.alert("Error", "Something went wrong.");
//             } finally {
//               setChangingRole(false);
//             }
//           },
//         },
//       ]
//     );
//   };

//   // ─── Delete home location ──────────────────────────────────────────────────
//   const deleteHomeLocation = async (userId: string, userName: string) => {
//     if (!userId || !userName) {
//       Alert.alert("Error", "User information is missing.");
//       return;
//     }

//     Alert.alert("Delete Home", `Remove ${userName}'s home location?`, [
//       { text: "Cancel", style: "cancel" },
//       {
//         text: "Delete",
//         style: "destructive",
//         onPress: async () => {
//           try {
//             const { error } = await supabase
//               .from("help_app_user_locations")
//               .delete()
//               .eq("user_id", userId)
//               .eq("is_home", true);

//             if (error) {
//               Alert.alert("Error", "Could not remove home location.");
//               return;
//             }

//             setManageModalVisible(false);
//             setManageTarget(null);
//             Alert.alert("Done", "Home location removed.");
//           } catch (err) {
//             console.error("deleteHomeLocation error:", err);
//             Alert.alert("Error", "Something went wrong.");
//           }
//         },
//       },
//     ]);
//   };

//   // ─── Remove user connection ────────────────────────────────────────────────
//   const removeUserConnection = async (linkId: string, userName: string) => {
//     Alert.alert(
//       "Remove Connection",
//       `Remove ${userName} from your connected users? They will no longer be linked to you.`,
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Remove",
//           style: "destructive",
//           onPress: async () => {
//             try {
//               const { error } = await supabase
//                 .from("help_app_guardian_links")
//                 .delete()
//                 .eq("id", linkId);

//               if (error) {
//                 Alert.alert("Error", "Could not remove connection.");
//                 return;
//               }

//               setConnectedUsers((prev) => prev.filter((c) => c.id !== linkId));
//               setManageModalVisible(false);
//               setManageTarget(null);
//               Alert.alert("Done", `${userName} has been disconnected.`);
//             } catch (err) {
//               console.error("removeUserConnection error:", err);
//               Alert.alert("Error", "Something went wrong.");
//             }
//           },
//         },
//       ]
//     );
//   };

//   // ─── Loading UI ────────────────────────────────────────────────────────────
//   if (loading) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <ActivityIndicator size="large" color={COLORS.primary} />
//       </View>
//     );
//   }

//   // ─── Main UI ───────────────────────────────────────────────────────────────
//   return (
//     <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }}>

//       {/* HEADER */}
//       <View
//         style={{
//           backgroundColor: COLORS.card,
//           paddingTop: 60,
//           paddingBottom: 25,
//           alignItems: "center",
//           borderBottomLeftRadius: 24,
//           borderBottomRightRadius: 24,
//           elevation: 3,
//         }}
//       >
//         <InitialsAvatar name={profile?.name || ""} />
//         <Text
//           style={{
//             fontSize: 20,
//             fontWeight: "700",
//             color: COLORS.textMain,
//             marginTop: 10,
//           }}
//         >
//           {profile?.name || "No Name"}
//         </Text>
//         <Text style={{ color: COLORS.textSub }}>{profile?.email}</Text>
//         <Text style={{ color: COLORS.textSub }}>📞 {profile?.phone || "—"}</Text>

//         {/* Role badge */}
//         <View
//           style={{
//             marginTop: 8,
//             backgroundColor: profile?.role === "guardian" ? "#f0fdfa" : "#f0f9ff",
//             paddingVertical: 4,
//             paddingHorizontal: 14,
//             borderRadius: 999,
//             borderWidth: 1,
//             borderColor: profile?.role === "guardian" ? COLORS.accent : "#7dd3fc",
//           }}
//         >
//           <Text
//             style={{
//               fontSize: 13,
//               fontWeight: "600",
//               color: profile?.role === "guardian" ? COLORS.primary : "#0369a1",
//             }}
//           >
//             {profile?.role === "guardian" ? "🛡 Guardian" : "👤 User"}
//           </Text>
//         </View>

//         <View style={{ flexDirection: "row", gap: 10, marginTop: 15 }}>
//           <TouchableOpacity
//             onPress={() => setEditing(true)}
//             style={{
//               backgroundColor: COLORS.accent,
//               paddingVertical: 10,
//               paddingHorizontal: 18,
//               borderRadius: 999,
//             }}
//           >
//             <Text style={{ color: "#fff", fontWeight: "600" }}>Edit Profile</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             onPress={handleLogout}
//             style={{
//               backgroundColor: "#1e293b",
//               paddingVertical: 10,
//               paddingHorizontal: 18,
//               borderRadius: 999,
//             }}
//           >
//             <Text style={{ color: "#fff", fontWeight: "600" }}>Logout</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Switch Role button */}
//         <TouchableOpacity
//           onPress={handleChangeRole}
//           disabled={changingRole}
//           style={{
//             marginTop: 10,
//             borderWidth: 1.5,
//             borderColor: COLORS.primary,
//             paddingVertical: 8,
//             paddingHorizontal: 20,
//             borderRadius: 999,
//             flexDirection: "row",
//             alignItems: "center",
//             gap: 6,
//           }}
//         >
//           {changingRole ? (
//             <ActivityIndicator size="small" color={COLORS.primary} />
//           ) : (
//             <Text style={{ color: COLORS.primary, fontWeight: "600", fontSize: 13 }}>
//               🔄 Switch to {profile?.role === "guardian" ? "User" : "Guardian"}
//             </Text>
//           )}
//         </TouchableOpacity>
//       </View>

//       {/* EDIT FORM */}
//       {editing && (
//   <View style={{ padding: 20 }}>

//     {/* NAME */}
//     <Text style={{ fontSize: 12 }}>Full Name *</Text>
//     <TextInput
//       value={name}
//       onChangeText={(v) => {
//         setName(v);
//         setErrors((e: any) => ({ ...e, name: "" }));
//       }}
//       style={{
//         borderWidth: 1,
//         borderColor: errors.name ? "red" : COLORS.border,
//         padding: 14,
//         borderRadius: 12,
//         marginBottom: 6,
//       }}
//     />
//     {errors.name && <Text style={{ color: "red" }}>{errors.name}</Text>}

//     {/* PHONE */}
//     <Text style={{ fontSize: 12, marginTop: 10 }}>Phone *</Text>

// <View style={{ flexDirection: "row", alignItems: "center" }}>

//   <CountryPicker
//     countryCode={countryCode}
//     withFilter
//     withFlag
//     withCallingCode
//      withSafeAreaView 
//     withEmoji
//     onSelect={(country) => {
//       setCountryCode(country.cca2);
//       setCallingCode(country.callingCode[0]);
//     }}
//   />

//   <Text style={{ marginHorizontal: 6, fontWeight: "600" }}>
//     +{callingCode}
//   </Text>

//   <TextInput
//     value={phone}
//     onChangeText={(v) => {
//       setPhone(v);
//       setErrors((e: any) => ({ ...e, phone: "" }));
//     }}
//     keyboardType="number-pad"
//     style={{
//       flex: 1,
//       borderWidth: 1,
//       borderColor: errors.phone ? "red" : COLORS.border,
//       padding: 14,
//       borderRadius: 12,
//     }}
//   />
// </View>

// {errors.phone && (
//   <Text style={{ color: "red", fontSize: 12 }}>{errors.phone}</Text>
// )}

//     {/* DOB */}
//     <Text style={{ fontSize: 12, marginTop: 10 }}>DOB *</Text>
//     <Pressable onPress={() => setShowDatePicker(true)}>
//       <View style={{
//         borderWidth: 1,
//         borderColor: errors.dob ? "red" : COLORS.border,
//         padding: 14,
//         borderRadius: 12
//       }}>
//         <Text>{dob || "Select DOB"}</Text>
//       </View>
//     </Pressable>
//     {errors.dob && <Text style={{ color: "red" }}>{errors.dob}</Text>}

//     {showDatePicker && (
//       <DateTimePicker
//         value={dob ? new Date(dob) : new Date()}
//         mode="date"
//         maximumDate={new Date()}
//         onChange={(e, d) => {
//           setShowDatePicker(false);
//           if (d) {
//             setDob(d.toISOString().split("T")[0]);
//             setErrors((e: any) => ({ ...e, dob: "" }));
//           }
//         }}
//       />
//     )}

//     {/* GENDER */}
//     <Text style={{ fontSize: 12, marginTop: 10 }}>Gender *</Text>
//     <RNPickerSelect
//       onValueChange={(v) => {
//         setGender(v);
//         setErrors((e: any) => ({ ...e, gender: "" }));
//       }}
//       value={gender}
//       placeholder={{ label: "Select gender", value: null }}
//       items={[
//         { label: "Male", value: "Male" },
//         { label: "Female", value: "Female" },
//         { label: "Other", value: "Other" },
//       ]}
//     />
//     {errors.gender && <Text style={{ color: "red" }}>{errors.gender}</Text>}

//     {/* HOMETOWN */}
//     <Text style={{ fontSize: 12, marginTop: 10 }}>Hometown *</Text>
//     <TextInput
//       value={hometown}
//       onChangeText={(v) => {
//         setHometown(v);
//         setErrors((e: any) => ({ ...e, hometown: "" }));
//       }}
//       style={{
//         borderWidth: 1,
//         borderColor: errors.hometown ? "red" : COLORS.border,
//         padding: 14,
//         borderRadius: 12,
//       }}
//     />
//     {errors.hometown && <Text style={{ color: "red" }}>{errors.hometown}</Text>}

//     {/* SAVE */}
//     <TouchableOpacity
//       onPress={saveProfile}
//       style={{
//         backgroundColor: COLORS.primary,
//         padding: 16,
//         borderRadius: 12,
//         alignItems: "center",
//         marginTop: 16,
//       }}
//     >
//       <Text style={{ color: "#fff", fontWeight: "700" }}>Save</Text>
//     </TouchableOpacity>

//   </View>
// )}

//       {/* GUARDIAN VIEW */}
//       {profile?.role === "guardian" && !editing && (
//         <View style={{ padding: 20 }}>
//           <Pressable
//             onPress={() => router.push("/auth/guardian-invite")}
//             style={{
//               backgroundColor: COLORS.primary,
//               padding: 16,
//               borderRadius: 16,
//               alignItems: "center",
//               marginBottom: 20,
//             }}
//           >
//             <Text style={{ color: "#fff", fontWeight: "700" }}>➕ Add User</Text>
//           </Pressable>

//           <Text
//             style={{
//               fontSize: 18,
//               fontWeight: "700",
//               color: COLORS.textMain,
//               marginBottom: 12,
//             }}
//           >
//             Connected Users ({connectedUsers.length})
//           </Text>

//           {connectedUsers.length === 0 && (
//             <Text
//               style={{
//                 color: COLORS.textSub,
//                 textAlign: "center",
//                 marginBottom: 12,
//               }}
//             >
//               No connected users yet.
//             </Text>
//           )}

//           {connectedUsers.map((c) => (
//             <View
//               key={c.id}
//               style={{
//                 backgroundColor: "#fff",
//                 padding: 16,
//                 borderRadius: 16,
//                 marginBottom: 12,
//                 borderWidth: 1,
//                 borderColor: COLORS.border,
//               }}
//             >
//               {/* User info row with Manage button */}
//               <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
//                 <View style={{ flex: 1 }}>
//                   <Text style={{ fontWeight: "700", color: COLORS.textMain }}>
//                     {c.user?.name || "No Name"}
//                   </Text>
//                   <Text style={{ color: COLORS.textSub }}>
//                     {c.user?.email || "No Email"}
//                   </Text>
//                 </View>

//                 {/* Manage button */}
//                 <Pressable
//                   onPress={() => {
//                     setManageTarget(c);
//                     setManageModalVisible(true);
//                   }}
//                   style={{
//                     backgroundColor: "#f1f5f9",
//                     paddingVertical: 7,
//                     paddingHorizontal: 14,
//                     borderRadius: 10,
//                     borderWidth: 1,
//                     borderColor: COLORS.border,
//                   }}
//                 >
//                   <Text style={{ color: COLORS.textMain, fontWeight: "600", fontSize: 13 }}>
//                      Manage
//                   </Text>
//                 </Pressable>
//               </View>
//             </View>
//           ))}
//         </View>
//       )}

//       {/* USER VIEW */}
//       {profile?.role === "user" && !editing && (
//         <View style={{ padding: 20 }}>
//           <Pressable
//             onPress={() => router.push("/auth/guardian-requests")}
//             style={{
//               backgroundColor: COLORS.primary,
//               padding: 16,
//               borderRadius: 16,
//               alignItems: "center",
//               marginBottom: 20,
//             }}
//           >
//             <Text style={{ color: "#fff", fontWeight: "700" }}>
//               🛡 Add / View Guardians
//             </Text>
//           </Pressable>

//           <Text
//             style={{
//               fontSize: 18,
//               fontWeight: "700",
//               color: COLORS.textMain,
//               marginBottom: 12,
//             }}
//           >
//             My Guardians ({linkedGuardians.length})
//           </Text>

//           {linkedGuardians.length === 0 && (
//             <Text
//               style={{
//                 color: COLORS.textSub,
//                 textAlign: "center",
//                 marginBottom: 12,
//               }}
//             >
//               No guardians linked yet.
//             </Text>
//           )}

//           {linkedGuardians.map((g) => (
//             <View
//               key={g.id}
//               style={{
//                 backgroundColor: "#fff",
//                 padding: 16,
//                 borderRadius: 16,
//                 marginBottom: 12,
//                 borderWidth: 1,
//                 borderColor: COLORS.border,
//               }}
//             >
//               <Text style={{ fontWeight: "700" }}>
//                 🛡 {g.guardian?.name || "No Name"}
//               </Text>
//               <Text style={{ color: COLORS.textSub }}>
//                 {g.guardian?.email || "No Email"}
//               </Text>
//             </View>
//           ))}
//         </View>
//       )}

//       {/* ─── MANAGE USER MODAL ──────────────────────────────────────────────── */}
//       <Modal
//         visible={manageModalVisible}
//         transparent
//         animationType="slide"
//         onRequestClose={() => {
//           setManageModalVisible(false);
//           setManageTarget(null);
//         }}
//       >
//         <Pressable
//           style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
//           onPress={() => {
//             setManageModalVisible(false);
//             setManageTarget(null);
//           }}
//         >
//           {/* Prevent tap inside sheet from closing */}
//           <Pressable onPress={(e) => e.stopPropagation()}>
//             <View
//               style={{
//                 backgroundColor: "#fff",
//                 borderTopLeftRadius: 24,
//                 borderTopRightRadius: 24,
//                 padding: 24,
//                 paddingBottom: 40,
//               }}
//             >
//               {/* Handle bar */}
//               <View
//                 style={{
//                   width: 40,
//                   height: 4,
//                   backgroundColor: "#e2e8f0",
//                   borderRadius: 2,
//                   alignSelf: "center",
//                   marginBottom: 20,
//                 }}
//               />

//               <Text style={{ fontSize: 17, fontWeight: "700", color: COLORS.textMain, marginBottom: 4 }}>
//                 Manage User
//               </Text>
//               <Text style={{ color: COLORS.textSub, marginBottom: 20 }}>
//                 {manageTarget?.user?.name || "No Name"} · {manageTarget?.user?.email || ""}
//               </Text>

//               {/* Remove Home Location */}
//               <Pressable
//                 onPress={() => {
//                   if (manageTarget?.user) {
//                     deleteHomeLocation(
//                       manageTarget.user.id,
//                       manageTarget.user.name || "this user"
//                     );
//                   }
//                 }}
//                 style={{
//                   flexDirection: "row",
//                   alignItems: "center",
//                   padding: 16,
//                   backgroundColor: "#fff5f5",
//                   borderRadius: 14,
//                   marginBottom: 12,
//                   borderWidth: 1,
//                   borderColor: "#fecaca",
//                   gap: 10,
//                 }}
//               >
//                 <Text style={{ fontSize: 20 }}>🏠</Text>
//                 <View>
//                   <Text style={{ fontWeight: "700", color: COLORS.danger }}>Remove Home Location</Text>
//                   <Text style={{ fontSize: 12, color: COLORS.textSub }}>
//                     Clears the saved home address for this user
//                   </Text>
//                 </View>
//               </Pressable>

//               {/* Remove Connection */}
//               <Pressable
//                 onPress={() => {
//                   if (manageTarget) {
//                     removeUserConnection(
//                       manageTarget.id,
//                       manageTarget.user?.name || "this user"
//                     );
//                   }
//                 }}
//                 style={{
//                   flexDirection: "row",
//                   alignItems: "center",
//                   padding: 16,
//                   backgroundColor: "#fff5f5",
//                   borderRadius: 14,
//                   marginBottom: 12,
//                   borderWidth: 1,
//                   borderColor: "#fecaca",
//                   gap: 10,
//                 }}
//               >
//                 <Text style={{ fontSize: 20 }}>🔗</Text>
//                 <View>
//                   <Text style={{ fontWeight: "700", color: COLORS.danger }}>Remove Connection</Text>
//                   <Text style={{ fontSize: 12, color: COLORS.textSub }}>
//                     Unlinks this user from your guardian account
//                   </Text>
//                 </View>
//               </Pressable>

//               {/* Cancel */}
//               <Pressable
//                 onPress={() => {
//                   setManageModalVisible(false);
//                   setManageTarget(null);
//                 }}
//                 style={{
//                   padding: 14,
//                   borderRadius: 14,
//                   alignItems: "center",
//                   marginTop: 4,
//                 }}
//               >
//                 <Text style={{ color: COLORS.textSub, fontWeight: "600" }}>Cancel</Text>
//               </Pressable>
//             </View>
//           </Pressable>
//         </Pressable>
//       </Modal>

//     </ScrollView>
//   );
// }


import { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Pressable,
  Modal,
  FlatList,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/supabase/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import RNPickerSelect from "react-native-picker-select";

const COLORS = {
  primary: "#0f766e",
  accent: "#14b8a6",
  danger: "#dc2626",
  bg: "#f8fafc",
  card: "#ffffff",
  textMain: "#0f172a",
  textSub: "#64748b",
  border: "#e2e8f0",
};

// ─── Country list ─────────────────────────────────────────────────────────────
const COUNTRIES = [
  { code: "AF", name: "Afghanistan", calling: "93" },
  { code: "AL", name: "Albania", calling: "355" },
  { code: "DZ", name: "Algeria", calling: "213" },
  { code: "AD", name: "Andorra", calling: "376" },
  { code: "AO", name: "Angola", calling: "244" },
  { code: "AG", name: "Antigua and Barbuda", calling: "1" },
  { code: "AR", name: "Argentina", calling: "54" },
  { code: "AM", name: "Armenia", calling: "374" },
  { code: "AU", name: "Australia", calling: "61" },
  { code: "AT", name: "Austria", calling: "43" },
  { code: "AZ", name: "Azerbaijan", calling: "994" },
  { code: "BS", name: "Bahamas", calling: "1" },
  { code: "BH", name: "Bahrain", calling: "973" },
  { code: "BD", name: "Bangladesh", calling: "880" },
  { code: "BB", name: "Barbados", calling: "1" },
  { code: "BY", name: "Belarus", calling: "375" },
  { code: "BE", name: "Belgium", calling: "32" },
  { code: "BZ", name: "Belize", calling: "501" },
  { code: "BJ", name: "Benin", calling: "229" },
  { code: "BT", name: "Bhutan", calling: "975" },
  { code: "BO", name: "Bolivia", calling: "591" },
  { code: "BA", name: "Bosnia and Herzegovina", calling: "387" },
  { code: "BW", name: "Botswana", calling: "267" },
  { code: "BR", name: "Brazil", calling: "55" },
  { code: "BN", name: "Brunei", calling: "673" },
  { code: "BG", name: "Bulgaria", calling: "359" },
  { code: "BF", name: "Burkina Faso", calling: "226" },
  { code: "BI", name: "Burundi", calling: "257" },
  { code: "CV", name: "Cabo Verde", calling: "238" },
  { code: "KH", name: "Cambodia", calling: "855" },
  { code: "CM", name: "Cameroon", calling: "237" },
  { code: "CA", name: "Canada", calling: "1" },
  { code: "CF", name: "Central African Republic", calling: "236" },
  { code: "TD", name: "Chad", calling: "235" },
  { code: "CL", name: "Chile", calling: "56" },
  { code: "CN", name: "China", calling: "86" },
  { code: "CO", name: "Colombia", calling: "57" },
  { code: "KM", name: "Comoros", calling: "269" },
  { code: "CG", name: "Congo", calling: "242" },
  { code: "CR", name: "Costa Rica", calling: "506" },
  { code: "HR", name: "Croatia", calling: "385" },
  { code: "CU", name: "Cuba", calling: "53" },
  { code: "CY", name: "Cyprus", calling: "357" },
  { code: "CZ", name: "Czech Republic", calling: "420" },
  { code: "DK", name: "Denmark", calling: "45" },
  { code: "DJ", name: "Djibouti", calling: "253" },
  { code: "DM", name: "Dominica", calling: "1" },
  { code: "DO", name: "Dominican Republic", calling: "1" },
  { code: "EC", name: "Ecuador", calling: "593" },
  { code: "EG", name: "Egypt", calling: "20" },
  { code: "SV", name: "El Salvador", calling: "503" },
  { code: "GQ", name: "Equatorial Guinea", calling: "240" },
  { code: "ER", name: "Eritrea", calling: "291" },
  { code: "EE", name: "Estonia", calling: "372" },
  { code: "SZ", name: "Eswatini", calling: "268" },
  { code: "ET", name: "Ethiopia", calling: "251" },
  { code: "FJ", name: "Fiji", calling: "679" },
  { code: "FI", name: "Finland", calling: "358" },
  { code: "FR", name: "France", calling: "33" },
  { code: "GA", name: "Gabon", calling: "241" },
  { code: "GM", name: "Gambia", calling: "220" },
  { code: "GE", name: "Georgia", calling: "995" },
  { code: "DE", name: "Germany", calling: "49" },
  { code: "GH", name: "Ghana", calling: "233" },
  { code: "GR", name: "Greece", calling: "30" },
  { code: "GD", name: "Grenada", calling: "1" },
  { code: "GT", name: "Guatemala", calling: "502" },
  { code: "GN", name: "Guinea", calling: "224" },
  { code: "GW", name: "Guinea-Bissau", calling: "245" },
  { code: "GY", name: "Guyana", calling: "592" },
  { code: "HT", name: "Haiti", calling: "509" },
  { code: "HN", name: "Honduras", calling: "504" },
  { code: "HU", name: "Hungary", calling: "36" },
  { code: "IS", name: "Iceland", calling: "354" },
  { code: "IN", name: "India", calling: "91" },
  { code: "ID", name: "Indonesia", calling: "62" },
  { code: "IR", name: "Iran", calling: "98" },
  { code: "IQ", name: "Iraq", calling: "964" },
  { code: "IE", name: "Ireland", calling: "353" },
  { code: "IL", name: "Israel", calling: "972" },
  { code: "IT", name: "Italy", calling: "39" },
  { code: "JM", name: "Jamaica", calling: "1" },
  { code: "JP", name: "Japan", calling: "81" },
  { code: "JO", name: "Jordan", calling: "962" },
  { code: "KZ", name: "Kazakhstan", calling: "7" },
  { code: "KE", name: "Kenya", calling: "254" },
  { code: "KI", name: "Kiribati", calling: "686" },
  { code: "KW", name: "Kuwait", calling: "965" },
  { code: "KG", name: "Kyrgyzstan", calling: "996" },
  { code: "LA", name: "Laos", calling: "856" },
  { code: "LV", name: "Latvia", calling: "371" },
  { code: "LB", name: "Lebanon", calling: "961" },
  { code: "LS", name: "Lesotho", calling: "266" },
  { code: "LR", name: "Liberia", calling: "231" },
  { code: "LY", name: "Libya", calling: "218" },
  { code: "LI", name: "Liechtenstein", calling: "423" },
  { code: "LT", name: "Lithuania", calling: "370" },
  { code: "LU", name: "Luxembourg", calling: "352" },
  { code: "MG", name: "Madagascar", calling: "261" },
  { code: "MW", name: "Malawi", calling: "265" },
  { code: "MY", name: "Malaysia", calling: "60" },
  { code: "MV", name: "Maldives", calling: "960" },
  { code: "ML", name: "Mali", calling: "223" },
  { code: "MT", name: "Malta", calling: "356" },
  { code: "MH", name: "Marshall Islands", calling: "692" },
  { code: "MR", name: "Mauritania", calling: "222" },
  { code: "MU", name: "Mauritius", calling: "230" },
  { code: "MX", name: "Mexico", calling: "52" },
  { code: "FM", name: "Micronesia", calling: "691" },
  { code: "MD", name: "Moldova", calling: "373" },
  { code: "MC", name: "Monaco", calling: "377" },
  { code: "MN", name: "Mongolia", calling: "976" },
  { code: "ME", name: "Montenegro", calling: "382" },
  { code: "MA", name: "Morocco", calling: "212" },
  { code: "MZ", name: "Mozambique", calling: "258" },
  { code: "MM", name: "Myanmar", calling: "95" },
  { code: "NA", name: "Namibia", calling: "264" },
  { code: "NR", name: "Nauru", calling: "674" },
  { code: "NP", name: "Nepal", calling: "977" },
  { code: "NL", name: "Netherlands", calling: "31" },
  { code: "NZ", name: "New Zealand", calling: "64" },
  { code: "NI", name: "Nicaragua", calling: "505" },
  { code: "NE", name: "Niger", calling: "227" },
  { code: "NG", name: "Nigeria", calling: "234" },
  { code: "NO", name: "Norway", calling: "47" },
  { code: "OM", name: "Oman", calling: "968" },
  { code: "PK", name: "Pakistan", calling: "92" },
  { code: "PW", name: "Palau", calling: "680" },
  { code: "PA", name: "Panama", calling: "507" },
  { code: "PG", name: "Papua New Guinea", calling: "675" },
  { code: "PY", name: "Paraguay", calling: "595" },
  { code: "PE", name: "Peru", calling: "51" },
  { code: "PH", name: "Philippines", calling: "63" },
  { code: "PL", name: "Poland", calling: "48" },
  { code: "PT", name: "Portugal", calling: "351" },
  { code: "QA", name: "Qatar", calling: "974" },
  { code: "RO", name: "Romania", calling: "40" },
  { code: "RU", name: "Russia", calling: "7" },
  { code: "RW", name: "Rwanda", calling: "250" },
  { code: "KN", name: "Saint Kitts and Nevis", calling: "1" },
  { code: "LC", name: "Saint Lucia", calling: "1" },
  { code: "VC", name: "Saint Vincent and the Grenadines", calling: "1" },
  { code: "WS", name: "Samoa", calling: "685" },
  { code: "SM", name: "San Marino", calling: "378" },
  { code: "ST", name: "Sao Tome and Principe", calling: "239" },
  { code: "SA", name: "Saudi Arabia", calling: "966" },
  { code: "SN", name: "Senegal", calling: "221" },
  { code: "RS", name: "Serbia", calling: "381" },
  { code: "SC", name: "Seychelles", calling: "248" },
  { code: "SL", name: "Sierra Leone", calling: "232" },
  { code: "SG", name: "Singapore", calling: "65" },
  { code: "SK", name: "Slovakia", calling: "421" },
  { code: "SI", name: "Slovenia", calling: "386" },
  { code: "SB", name: "Solomon Islands", calling: "677" },
  { code: "SO", name: "Somalia", calling: "252" },
  { code: "ZA", name: "South Africa", calling: "27" },
  { code: "SS", name: "South Sudan", calling: "211" },
  { code: "ES", name: "Spain", calling: "34" },
  { code: "LK", name: "Sri Lanka", calling: "94" },
  { code: "SD", name: "Sudan", calling: "249" },
  { code: "SR", name: "Suriname", calling: "597" },
  { code: "SE", name: "Sweden", calling: "46" },
  { code: "CH", name: "Switzerland", calling: "41" },
  { code: "SY", name: "Syria", calling: "963" },
  { code: "TW", name: "Taiwan", calling: "886" },
  { code: "TJ", name: "Tajikistan", calling: "992" },
  { code: "TZ", name: "Tanzania", calling: "255" },
  { code: "TH", name: "Thailand", calling: "66" },
  { code: "TL", name: "Timor-Leste", calling: "670" },
  { code: "TG", name: "Togo", calling: "228" },
  { code: "TO", name: "Tonga", calling: "676" },
  { code: "TT", name: "Trinidad and Tobago", calling: "1" },
  { code: "TN", name: "Tunisia", calling: "216" },
  { code: "TR", name: "Turkey", calling: "90" },
  { code: "TM", name: "Turkmenistan", calling: "993" },
  { code: "TV", name: "Tuvalu", calling: "688" },
  { code: "UG", name: "Uganda", calling: "256" },
  { code: "UA", name: "Ukraine", calling: "380" },
  { code: "AE", name: "United Arab Emirates", calling: "971" },
  { code: "GB", name: "United Kingdom", calling: "44" },
  { code: "US", name: "United States", calling: "1" },
  { code: "UY", name: "Uruguay", calling: "598" },
  { code: "UZ", name: "Uzbekistan", calling: "998" },
  { code: "VU", name: "Vanuatu", calling: "678" },
  { code: "VE", name: "Venezuela", calling: "58" },
  { code: "VN", name: "Vietnam", calling: "84" },
  { code: "YE", name: "Yemen", calling: "967" },
  { code: "ZM", name: "Zambia", calling: "260" },
  { code: "ZW", name: "Zimbabwe", calling: "263" },
];

function getFlag(code: string) {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

// ─── Initials Avatar ──────────────────────────────────────────────────────────
function InitialsAvatar({ name }: { name: string }) {
  const safeName = name?.trim() || "?";
  const initials =
    safeName
      .split(" ")
      .map((n) => n[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  return (
    <View
      style={{
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#fff", fontSize: 32, fontWeight: "700" }}>
        {initials}
      </Text>
    </View>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  dob: string | null;
  gender: string | null;
  hometown: string | null;
  role: "user" | "guardian";
};

type ConnectedUser = {
  id: string;
  user: { id: string; name: string | null; email: string | null } | null;
};

type LinkedGuardian = {
  id: string;
  guardian: { id: string; name: string | null; email: string | null } | null;
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();

  const [countryCode, setCountryCode] = useState("IN");
  const [callingCode, setCallingCode] = useState("91");
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [linkedGuardians, setLinkedGuardians] = useState<LinkedGuardian[]>([]);

  const [errors, setErrors] = useState<any>({});
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [hometown, setHometown] = useState("");

  const [manageTarget, setManageTarget] = useState<ConnectedUser | null>(null);
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [changingRole, setChangingRole] = useState(false);

  const profileIdRef = useRef<string | null>(null);
  const profileRoleRef = useRef<string | null>(null);

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.calling.includes(countrySearch)
  );

  // ─── Fetch connections ────────────────────────────────────────────────────
  const fetchGuardianConnections = useCallback(async (guardianId: string) => {
    try {
      const { data, error } = await supabase
        .from("help_app_guardian_links")
        .select(`
          id,
          user:help_app_profiles!help_app_guardian_links_user_id_fkey (
            id, name, email
          )
        `)
        .eq("guardian_id", guardianId)
        .eq("status", "approved");

      if (error) console.error("fetchGuardianConnections error:", error.message);

      const normalized: ConnectedUser[] = (data || []).map((item: any) => ({
        id: item.id,
        user: Array.isArray(item.user) ? item.user[0] ?? null : item.user ?? null,
      }));
      setConnectedUsers(normalized);
    } catch (err) {
      console.error("fetchGuardianConnections error:", err);
    }
  }, []);

  const fetchLinkedGuardians = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("help_app_guardian_links")
        .select(`
          id,
          guardian:help_app_profiles!help_app_guardian_links_guardian_id_fkey (
            id, name, email
          )
        `)
        .eq("user_id", userId)
        .eq("status", "approved");

      if (error) console.error("fetchLinkedGuardians error:", error.message);

      const normalized: LinkedGuardian[] = (data || []).map((item: any) => ({
        id: item.id,
        guardian: Array.isArray(item.guardian)
          ? item.guardian[0] ?? null
          : item.guardian ?? null,
      }));
      setLinkedGuardians(normalized);
    } catch (err) {
      console.error("fetchLinkedGuardians error:", err);
    }
  }, []);

  // ─── Initialize ───────────────────────────────────────────────────────────
  const initialize = useCallback(async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        router.replace("/auth/get-started");
        return;
      }

      const user = session.user;

      const { data: profileData, error: profileError } = await supabase
        .from("help_app_profiles")
        .select("id, email, name, phone, dob, gender, hometown, role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile fetch error:", profileError.message);
        return;
      }
      if (!profileData) return;

      setProfile(profileData as UserProfile);
      profileIdRef.current = profileData.id;
      profileRoleRef.current = profileData.role;

      setName(profileData.name || "");

      // Strip country code from stored phone for display
      const rawPhone = profileData.phone || "";
      const stripped = rawPhone.startsWith("+")
        ? rawPhone.replace(/^\+\d+\s?/, "")
        : rawPhone;
      setPhone(stripped);

      setDob(profileData.dob || "");
      setGender(profileData.gender || "");
      setHometown(profileData.hometown || "");

      if (profileData.role === "guardian") {
        fetchGuardianConnections(user.id);
      } else {
        fetchLinkedGuardians(user.id);
      }
    } catch (err) {
      console.error("Profile init error:", err);
    } finally {
      setLoading(false);
    }
  }, [router, fetchGuardianConnections, fetchLinkedGuardians]);

  // ─── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    initialize();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) router.replace("/auth/get-started");
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [initialize]);

  useEffect(() => {
    if (!profileIdRef.current) return;

    const channel = supabase
      .channel(`guardian-links-${profileIdRef.current}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "help_app_guardian_links" },
        () => {
          if (!profileIdRef.current) return;
          if (profileRoleRef.current === "guardian") {
            fetchGuardianConnections(profileIdRef.current);
          } else {
            fetchLinkedGuardians(profileIdRef.current);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, fetchGuardianConnections, fetchLinkedGuardians]);

  // ─── Validation ───────────────────────────────────────────────────────────
  const validate = () => {
    const e: any = {};
    if (!name.trim()) e.name = "Full name is required";
    if (!phone.trim()) e.phone = "Phone required";
    else if (phone.replace(/\D/g, "").length < 6) e.phone = "Invalid number";
    if (!dob.trim()) e.dob = "DOB required";
    if (!gender.trim()) e.gender = "Select gender";
    if (!hometown.trim()) e.hometown = "Hometown required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Save profile ─────────────────────────────────────────────────────────
  const saveProfile = async () => {
    if (!profile) return;
    if (!validate()) return;

    setSaving(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert("Session error", "Please log in again.");
        return;
      }

      const fullPhone = `+${callingCode}${phone.replace(/\D/g, "")}`;

      const { error } = await supabase
        .from("help_app_profiles")
        .update({ name, phone: fullPhone, dob, gender, hometown })
        .eq("id", user.id);

      if (error) {
        Alert.alert("Error", "Could not save profile. Please try again.");
        return;
      }

      setProfile((prev) =>
        prev ? { ...prev, name, phone: fullPhone, dob, gender, hometown } : prev
      );
      setEditing(false);
      setHasUnsavedChanges(false);
      Alert.alert("Success", "Profile updated successfully.");
    } catch (err) {
      console.error("saveProfile error:", err);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ─── Cancel edit ──────────────────────────────────────────────────────────
  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        "Discard changes?",
        "You have unsaved changes. Are you sure you want to cancel?",
        [
          { text: "Keep editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              setName(profile?.name || "");
              const rawPhone = profile?.phone || "";
              const stripped = rawPhone.startsWith("+")
                ? rawPhone.replace(/^\+\d+\s?/, "")
                : rawPhone;
              setPhone(stripped);
              setDob(profile?.dob || "");
              setGender(profile?.gender || "");
              setHometown(profile?.hometown || "");
              setEditing(false);
              setHasUnsavedChanges(false);
            },
          },
        ]
      );
    } else {
      setEditing(false);
    }
  };

  // ─── Logout ───────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("terms_accepted");
            await supabase.auth.signOut();
            router.replace("/auth/get-started");
          } catch (err) {
            console.error("Logout error:", err);
            router.replace("/auth/get-started");
          }
        },
      },
    ]);
  };

  // ─── Change role ──────────────────────────────────────────────────────────
  const handleChangeRole = () => {
    if (!profile) return;
    const newRole = profile.role === "guardian" ? "user" : "guardian";
    const label = newRole === "guardian" ? "Guardian" : "User";

    Alert.alert(
      "Switch Role",
      `Switch your role to "${label}"? This will update your account type.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: `Switch to ${label}`,
          onPress: async () => {
            setChangingRole(true);
            try {
              const {
                data: { user },
                error: userError,
              } = await supabase.auth.getUser();

              if (userError || !user) {
                Alert.alert("Session error", "Please log in again.");
                return;
              }

              const { error } = await supabase
                .from("help_app_profiles")
                .update({ role: newRole })
                .eq("id", user.id);

              if (error) {
                Alert.alert("Error", "Could not update role.");
                return;
              }

              profileRoleRef.current = newRole;
              setProfile((prev) => (prev ? { ...prev, role: newRole } : prev));

              if (newRole === "guardian") {
                setLinkedGuardians([]);
                fetchGuardianConnections(user.id);
              } else {
                setConnectedUsers([]);
                fetchLinkedGuardians(user.id);
              }

              Alert.alert("Done", `Role switched to ${label}.`);
            } catch (err) {
              console.error("changeRole error:", err);
              Alert.alert("Error", "Something went wrong.");
            } finally {
              setChangingRole(false);
            }
          },
        },
      ]
    );
  };

  // ─── Delete home location ─────────────────────────────────────────────────
  const deleteHomeLocation = async (userId: string, userName: string) => {
    if (!userId || !userName) {
      Alert.alert("Error", "User information is missing.");
      return;
    }
    Alert.alert("Delete Home", `Remove ${userName}'s home location?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("help_app_user_locations")
              .delete()
              .eq("user_id", userId)
              .eq("is_home", true);

            if (error) {
              Alert.alert("Error", "Could not remove home location.");
              return;
            }
            setManageModalVisible(false);
            setManageTarget(null);
            Alert.alert("Done", "Home location removed.");
          } catch (err) {
            console.error("deleteHomeLocation error:", err);
            Alert.alert("Error", "Something went wrong.");
          }
        },
      },
    ]);
  };

  // ─── Remove user connection ───────────────────────────────────────────────
  const removeUserConnection = async (linkId: string, userName: string) => {
    Alert.alert(
      "Remove Connection",
      `Remove ${userName} from your connected users?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("help_app_guardian_links")
                .delete()
                .eq("id", linkId);

              if (error) {
                Alert.alert("Error", "Could not remove connection.");
                return;
              }
              setConnectedUsers((prev) => prev.filter((c) => c.id !== linkId));
              setManageModalVisible(false);
              setManageTarget(null);
              Alert.alert("Done", `${userName} has been disconnected.`);
            } catch (err) {
              console.error("removeUserConnection error:", err);
              Alert.alert("Error", "Something went wrong.");
            }
          },
        },
      ]
    );
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }}>

      {/* ── HEADER ── */}
      <View
        style={{
          backgroundColor: COLORS.card,
          paddingTop: 60,
          paddingBottom: 25,
          alignItems: "center",
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          elevation: 3,
        }}
      >
        <InitialsAvatar name={profile?.name || ""} />
        <Text style={{ fontSize: 20, fontWeight: "700", color: COLORS.textMain, marginTop: 10 }}>
          {profile?.name || "No Name"}
        </Text>
        <Text style={{ color: COLORS.textSub }}>{profile?.email}</Text>
        <Text style={{ color: COLORS.textSub }}>📞 {profile?.phone || "—"}</Text>

        <View
          style={{
            marginTop: 8,
            backgroundColor: profile?.role === "guardian" ? "#f0fdfa" : "#f0f9ff",
            paddingVertical: 4,
            paddingHorizontal: 14,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: profile?.role === "guardian" ? COLORS.accent : "#7dd3fc",
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: profile?.role === "guardian" ? COLORS.primary : "#0369a1",
            }}
          >
            {profile?.role === "guardian" ? "🛡 Guardian" : "👤 User"}
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 15 }}>
          <TouchableOpacity
            onPress={() => setEditing(true)}
            style={{
              backgroundColor: COLORS.accent,
              paddingVertical: 10,
              paddingHorizontal: 18,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            style={{
              backgroundColor: "#1e293b",
              paddingVertical: 10,
              paddingHorizontal: 18,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Logout</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleChangeRole}
          disabled={changingRole}
          style={{
            marginTop: 10,
            borderWidth: 1.5,
            borderColor: COLORS.primary,
            paddingVertical: 8,
            paddingHorizontal: 20,
            borderRadius: 999,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          {changingRole ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={{ color: COLORS.primary, fontWeight: "600", fontSize: 13 }}>
              🔄 Switch to {profile?.role === "guardian" ? "User" : "Guardian"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── EDIT FORM ── */}
      {editing && (
        <View style={{ padding: 20 }}>

          <TouchableOpacity
            onPress={handleCancelEdit}
            style={{ alignSelf: "flex-end", marginBottom: 12 }}
          >
            <Text style={{ color: COLORS.textSub, fontWeight: "600" }}>✕ Cancel</Text>
          </TouchableOpacity>

          {/* NAME */}
          <Text style={{ fontSize: 12, color: COLORS.textSub, marginBottom: 4 }}>Full Name *</Text>
          <TextInput
            value={name}
            onChangeText={(v) => {
              setName(v);
              setHasUnsavedChanges(true);
              setErrors((e: any) => ({ ...e, name: "" }));
            }}
            style={{
              borderWidth: 1,
              borderColor: errors.name ? "red" : COLORS.border,
              padding: 14,
              borderRadius: 12,
              backgroundColor: "#fff",
              marginBottom: 4,
            }}
          />
          {errors.name ? (
            <Text style={{ color: "red", fontSize: 12, marginBottom: 6 }}>{errors.name}</Text>
          ) : null}

          {/* PHONE */}
          <Text style={{ fontSize: 12, color: COLORS.textSub, marginTop: 10, marginBottom: 4 }}>
            Phone *
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: errors.phone ? "red" : COLORS.border,
              borderRadius: 12,
              backgroundColor: "#fff",
              overflow: "hidden",
            }}
          >
            {/* Country selector button */}
            <Pressable
              onPress={() => {
                setCountrySearch("");
                setShowCountryModal(true);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 12,
                paddingVertical: 14,
                gap: 4,
              }}
            >
              <Text style={{ fontSize: 20 }}>{getFlag(countryCode)}</Text>
              <Text style={{ fontWeight: "600", color: COLORS.textMain, fontSize: 14 }}>
                +{callingCode}
              </Text>
              <Text style={{ color: COLORS.textSub, fontSize: 11 }}>▾</Text>
            </Pressable>

            {/* Divider */}
            <View style={{ width: 1, height: 24, backgroundColor: COLORS.border }} />

            {/* Phone input */}
            <TextInput
              value={phone}
              onChangeText={(v) => {
                setPhone(v);
                setHasUnsavedChanges(true);
                setErrors((e: any) => ({ ...e, phone: "" }));
              }}
              keyboardType="number-pad"
              placeholder="Phone number"
              placeholderTextColor={COLORS.textSub}
              style={{ flex: 1, padding: 14, color: COLORS.textMain }}
            />
          </View>
          {errors.phone ? (
            <Text style={{ color: "red", fontSize: 12, marginTop: 4 }}>{errors.phone}</Text>
          ) : null}

          {/* DOB */}
          <Text style={{ fontSize: 12, color: COLORS.textSub, marginTop: 12, marginBottom: 4 }}>
            Date of Birth *
          </Text>
          <Pressable onPress={() => setShowDatePicker(true)}>
            <View
              style={{
                borderWidth: 1,
                borderColor: errors.dob ? "red" : COLORS.border,
                padding: 14,
                borderRadius: 12,
                backgroundColor: "#fff",
              }}
            >
              <Text style={{ color: dob ? COLORS.textMain : COLORS.textSub }}>
                {dob || "Select date of birth"}
              </Text>
            </View>
          </Pressable>
          {errors.dob ? (
            <Text style={{ color: "red", fontSize: 12, marginTop: 4 }}>{errors.dob}</Text>
          ) : null}

          {showDatePicker && (
            <DateTimePicker
              value={dob ? new Date(dob) : new Date()}
              mode="date"
              maximumDate={new Date()}
              onChange={(_e, d) => {
                setShowDatePicker(false);
                if (d) {
                  setDob(d.toISOString().split("T")[0]);
                  setHasUnsavedChanges(true);
                  setErrors((e: any) => ({ ...e, dob: "" }));
                }
              }}
            />
          )}

          {/* GENDER */}
          <Text style={{ fontSize: 12, color: COLORS.textSub, marginTop: 12, marginBottom: 4 }}>
            Gender *
          </Text>
          <View
            style={{
              borderWidth: 1,
              borderColor: errors.gender ? "red" : COLORS.border,
              borderRadius: 12,
              backgroundColor: "#fff",
              paddingHorizontal: 4,
            }}
          >
            <RNPickerSelect
              onValueChange={(v) => {
                setGender(v);
                setHasUnsavedChanges(true);
                setErrors((e: any) => ({ ...e, gender: "" }));
              }}
              value={gender}
              placeholder={{ label: "Select gender…", value: null }}
              items={[
                { label: "Male", value: "Male" },
                { label: "Female", value: "Female" },
                { label: "Other", value: "Other" },
              ]}
              style={{
                inputIOS: { padding: 14, color: COLORS.textMain },
                inputAndroid: { padding: 14, color: COLORS.textMain },
              }}
            />
          </View>
          {errors.gender ? (
            <Text style={{ color: "red", fontSize: 12, marginTop: 4 }}>{errors.gender}</Text>
          ) : null}

          {/* HOMETOWN */}
          <Text style={{ fontSize: 12, color: COLORS.textSub, marginTop: 12, marginBottom: 4 }}>
            Hometown *
          </Text>
          <TextInput
            value={hometown}
            onChangeText={(v) => {
              setHometown(v);
              setHasUnsavedChanges(true);
              setErrors((e: any) => ({ ...e, hometown: "" }));
            }}
            style={{
              borderWidth: 1,
              borderColor: errors.hometown ? "red" : COLORS.border,
              padding: 14,
              borderRadius: 12,
              backgroundColor: "#fff",
            }}
          />
          {errors.hometown ? (
            <Text style={{ color: "red", fontSize: 12, marginTop: 4 }}>{errors.hometown}</Text>
          ) : null}

          {/* SAVE */}
          <TouchableOpacity
            onPress={saveProfile}
            disabled={saving}
            style={{
              backgroundColor: saving ? COLORS.accent : COLORS.primary,
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
              marginTop: 20,
              marginBottom: 40,
            }}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                Save Changes
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ── GUARDIAN VIEW ── */}
      {profile?.role === "guardian" && !editing && (
        <View style={{ padding: 20 }}>
          <Pressable
            onPress={() => router.push("/auth/guardian-invite")}
            style={{
              backgroundColor: COLORS.primary,
              padding: 16,
              borderRadius: 16,
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>➕ Add User</Text>
          </Pressable>

          <Text style={{ fontSize: 18, fontWeight: "700", color: COLORS.textMain, marginBottom: 12 }}>
            Connected Users ({connectedUsers.length})
          </Text>

          {connectedUsers.length === 0 && (
            <Text style={{ color: COLORS.textSub, textAlign: "center", marginBottom: 12 }}>
              No connected users yet.
            </Text>
          )}

          {connectedUsers.map((c) => (
            <View
              key={c.id}
              style={{
                backgroundColor: "#fff",
                padding: 16,
                borderRadius: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", color: COLORS.textMain }}>
                    {c.user?.name || "No Name"}
                  </Text>
                  <Text style={{ color: COLORS.textSub }}>{c.user?.email || "No Email"}</Text>
                </View>
                <Pressable
                  onPress={() => {
                    setManageTarget(c);
                    setManageModalVisible(true);
                  }}
                  style={{
                    backgroundColor: "#f1f5f9",
                    paddingVertical: 7,
                    paddingHorizontal: 14,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                >
                  <Text style={{ color: COLORS.textMain, fontWeight: "600", fontSize: 13 }}>
                    Manage
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ── USER VIEW ── */}
      {profile?.role === "user" && !editing && (
        <View style={{ padding: 20 }}>
          <Pressable
            onPress={() => router.push("/auth/guardian-requests")}
            style={{
              backgroundColor: COLORS.primary,
              padding: 16,
              borderRadius: 16,
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>🛡 Add / View Guardians</Text>
          </Pressable>

          <Text style={{ fontSize: 18, fontWeight: "700", color: COLORS.textMain, marginBottom: 12 }}>
            My Guardians ({linkedGuardians.length})
          </Text>

          {linkedGuardians.length === 0 && (
            <Text style={{ color: COLORS.textSub, textAlign: "center", marginBottom: 12 }}>
              No guardians linked yet.
            </Text>
          )}

          {linkedGuardians.map((g) => (
            <View
              key={g.id}
              style={{
                backgroundColor: "#fff",
                padding: 16,
                borderRadius: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text style={{ fontWeight: "700" }}>🛡 {g.guardian?.name || "No Name"}</Text>
              <Text style={{ color: COLORS.textSub }}>{g.guardian?.email || "No Email"}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── COUNTRY PICKER MODAL ── */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowCountryModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text style={{ flex: 1, fontSize: 17, fontWeight: "700", color: COLORS.textMain }}>
              Select Country
            </Text>
            <Pressable
              onPress={() => setShowCountryModal(false)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                backgroundColor: "#f1f5f9",
                borderRadius: 8,
              }}
            >
              <Text style={{ color: COLORS.textMain, fontWeight: "600" }}>✕ Close</Text>
            </Pressable>
          </View>

          {/* Search */}
          <TextInput
            value={countrySearch}
            onChangeText={setCountrySearch}
            placeholder="Search country or dial code…"
            placeholderTextColor={COLORS.textSub}
            autoFocus
            style={{
              margin: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 10,
              padding: 12,
              color: COLORS.textMain,
              backgroundColor: "#f8fafc",
            }}
          />

          {/* List */}
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  setCountryCode(item.code);
                  setCallingCode(item.calling);
                  setHasUnsavedChanges(true);
                  setShowCountryModal(false);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 13,
                  paddingHorizontal: 16,
                  borderBottomWidth: 1,
                  borderColor: COLORS.border,
                  gap: 12,
                  backgroundColor: countryCode === item.code ? "#f0fdfa" : "#fff",
                }}
              >
                <Text style={{ fontSize: 26 }}>{getFlag(item.code)}</Text>
                <Text style={{ flex: 1, color: COLORS.textMain, fontSize: 15 }}>{item.name}</Text>
                <Text style={{ color: COLORS.textSub, fontWeight: "600", fontSize: 14 }}>
                  +{item.calling}
                </Text>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* ── MANAGE USER MODAL ── */}
      <Modal
        visible={manageModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setManageModalVisible(false);
          setManageTarget(null);
        }}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
          onPress={() => {
            setManageModalVisible(false);
            setManageTarget(null);
          }}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              style={{
                backgroundColor: "#fff",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 24,
                paddingBottom: 40,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  backgroundColor: "#e2e8f0",
                  borderRadius: 2,
                  alignSelf: "center",
                  marginBottom: 20,
                }}
              />
              <Text style={{ fontSize: 17, fontWeight: "700", color: COLORS.textMain, marginBottom: 4 }}>
                Manage User
              </Text>
              <Text style={{ color: COLORS.textSub, marginBottom: 20 }}>
                {manageTarget?.user?.name || "No Name"} · {manageTarget?.user?.email || ""}
              </Text>

              <Pressable
                onPress={() => {
                  if (manageTarget?.user) {
                    deleteHomeLocation(
                      manageTarget.user.id,
                      manageTarget.user.name || "this user"
                    );
                  }
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  backgroundColor: "#fff5f5",
                  borderRadius: 14,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "#fecaca",
                  gap: 10,
                }}
              >
                <Text style={{ fontSize: 20 }}>🏠</Text>
                <View>
                  <Text style={{ fontWeight: "700", color: COLORS.danger }}>
                    Remove Home Location
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.textSub }}>
                    Clears the saved home address for this user
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (manageTarget) {
                    removeUserConnection(
                      manageTarget.id,
                      manageTarget.user?.name || "this user"
                    );
                  }
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  backgroundColor: "#fff5f5",
                  borderRadius: 14,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "#fecaca",
                  gap: 10,
                }}
              >
                <Text style={{ fontSize: 20 }}>🔗</Text>
                <View>
                  <Text style={{ fontWeight: "700", color: COLORS.danger }}>
                    Remove Connection
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.textSub }}>
                    Unlinks this user from your guardian account
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => {
                  setManageModalVisible(false);
                  setManageTarget(null);
                }}
                style={{ padding: 14, borderRadius: 14, alignItems: "center", marginTop: 4 }}
              >
                <Text style={{ color: COLORS.textSub, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </ScrollView>
  );
}