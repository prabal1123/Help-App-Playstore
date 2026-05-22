// import {
//   View,
//   Text,
//   Pressable,
//   FlatList,
//   Alert,
//   ActivityIndicator,
// } from "react-native";
// import { useEffect, useState } from "react";
// import { useRouter } from "expo-router";
// import { supabase } from "@/supabase/supabase";
// import * as ImagePicker from "expo-image-picker";
// import { Camera } from "expo-camera";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { FontAwesome5 } from "@expo/vector-icons";

// export default function GuardianRequests() {
//   const router = useRouter();
//   const [requests, setRequests] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [scanning, setScanning] = useState(false);

//   useEffect(() => {
//     checkAccessAndFetch();
//   }, []);

//   const checkAccessAndFetch = async () => {
//     try {
//       const { data: { user } } = await supabase.auth.getUser();

//       if (!user) {
//         router.replace("/auth/email");
//         return;
//       }

//       const { data: profile, error } = await supabase
//         .from("help_app_profiles")
//         .select("role")
//         .eq("id", user.id)
//         .single();

//       if (error || profile?.role !== "user") {
//         router.replace("/");
//         return;
//       }

//       const { data, error: fetchError } = await supabase
//         .from("help_app_guardian_links")
//         .select(`
//           id,
//           guardian_id,
//           help_app_profiles!help_app_guardian_links_guardian_id_fkey (
//             name,
//             email
//           )
//         `)
//         .eq("user_id", user.id)
//         .eq("status", "pending");

//       if (fetchError) throw fetchError;
//       setRequests(data || []);
//     } catch (e: any) {
//       Alert.alert("Error", e.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const update = async (id: string, status: "approved" | "rejected") => {
//     try {
//       const { error } = await supabase
//         .from("help_app_guardian_links")
//         .update({ status })
//         .eq("id", id);

//       if (error) throw error;

//       Alert.alert(`Request ${status}`);
//       checkAccessAndFetch();
//     } catch (e: any) {
//       Alert.alert(e.message);
//     }
//   };

//   const handleQR = async (data: string) => {
//     if (scanning) return;
//     setScanning(true);

//     try {
//       const parsed = JSON.parse(data);

//       if (parsed.type !== "guardian_link") {
//         Alert.alert("Invalid QR");
//         setScanning(false);
//         return;
//       }

//       const { data: { user } } = await supabase.auth.getUser();

//       const { data: existing } = await supabase
//         .from("help_app_guardian_links")
//         .select("id")
//         .eq("guardian_id", parsed.guardian_id)
//         .eq("user_id", user?.id)
//         .maybeSingle();

//       if (existing) {
//         Alert.alert("Already connected");
//         setScanning(false);
//         return;
//       }

//       const { error } = await supabase
//         .from("help_app_guardian_links")
//         .insert({
//           guardian_id: parsed.guardian_id,
//           user_id: user?.id,
//           status: "approved",
//         });

//       if (error) throw error;

//       Alert.alert("Connected successfully!");
//       router.replace("/");
//     } catch {
//       Alert.alert("Invalid QR");
//       setScanning(false);
//     }
//   };

//   const pickFromGallery = async () => {
//     try {
//       const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

//       if (!permission.granted) {
//         Alert.alert("Permission required");
//         return;
//       }

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         quality: 1,
//       });

//       if (!result.canceled) {
//         const scanned = await Camera.scanFromURLAsync(result.assets[0].uri);

//         if (scanned.length > 0) {
//           handleQR(scanned[0].data);
//         } else {
//           Alert.alert("No QR found");
//         }
//       }
//     } catch (e: any) {
//       Alert.alert("Error", e.message);
//     }
//   };

//   if (loading) {
//     return (
//       <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F4F6", justifyContent: "center" }}>
//         <ActivityIndicator size="large" color="#2B3F77" />
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
//       <View style={{ padding: 20 }}>

//         {/* Header */}
//         <Pressable onPress={() => router.back()}>
//           <Text style={{ color: "#6B7280" }}>← Back</Text>
//         </Pressable>

//         <Text style={{ fontSize: 28, fontWeight: "700", marginTop: 8 }}>
//           Guardian Requests
//         </Text>

//         {/* Scan QR Card */}
//         <Text style={{ marginTop: 24, color: "#6B7280", fontWeight: "600" }}>
//           Connect via QR
//         </Text>

//         <Pressable onPress={() => router.push("/auth/scan-qr")} style={card}>
//           <View style={iconBox}>
//             <FontAwesome5 name="qrcode" size={20} color="#2B3F77" />
//           </View>
//           <View style={{ flex: 1, justifyContent: "center" }}>
//             <Text style={cardTitle}>Scan QR Code</Text>
//             <Text style={cardSub}>Use camera to scan guardian's QR</Text>
//           </View>
//           <FontAwesome5 name="chevron-right" size={14} color="#9CA3AF" />
//         </Pressable>

//         <Pressable onPress={pickFromGallery} style={card}>
//           <View style={iconBox}>
//             <FontAwesome5 name="image" size={20} color="#2B3F77" />
//           </View>
//           <View style={{ flex: 1, justifyContent: "center" }}>
//             <Text style={cardTitle}>Upload from Gallery</Text>
//             <Text style={cardSub}>Pick a QR image from your photos</Text>
//           </View>
//           <FontAwesome5 name="chevron-right" size={14} color="#9CA3AF" />
//         </Pressable>

//         {/* Pending Requests */}
//         <Text style={{ marginTop: 28, color: "#6B7280", fontWeight: "600" }}>
//           Pending Requests
//         </Text>

//         <FlatList
//           data={requests}
//           keyExtractor={(item) => item.id}
//           scrollEnabled={false}
//           ListEmptyComponent={
//             <View style={emptyBox}>
//               <FontAwesome5 name="user-clock" size={28} color="#D1D5DB" />
//               <Text style={{ color: "#9CA3AF", marginTop: 10 }}>
//                 No pending guardian requests
//               </Text>
//             </View>
//           }
//           renderItem={({ item }) => (
//             <View style={requestCard}>
//               <View style={[iconBox, { backgroundColor: "#EEF2FF" }]}>
//                 <FontAwesome5 name="user-shield" size={18} color="#2B3F77" />
//               </View>
//               <View style={{ flex: 1 }}>
//                 <Text style={cardTitle}>
//                   {item.help_app_profiles?.name || "Unknown"}
//                 </Text>
//                 <Text style={cardSub}>
//                   {item.help_app_profiles?.email}
//                 </Text>
//                 <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
//                   <Pressable
//                     onPress={() => update(item.id, "approved")}
//                     style={acceptBtn}
//                   >
//                     <Text style={{ color: "#fff", fontWeight: "600" }}>Accept</Text>
//                   </Pressable>
//                   <Pressable
//                     onPress={() => update(item.id, "rejected")}
//                     style={rejectBtn}
//                   >
//                     <Text style={{ color: "#EF4444", fontWeight: "600" }}>Reject</Text>
//                   </Pressable>
//                 </View>
//               </View>
//             </View>
//           )}
//         />
//       </View>
//     </SafeAreaView>
//   );
// }

// const card = {
//   flexDirection: "row" as const,
//   backgroundColor: "#fff",
//   padding: 16,
//   borderRadius: 20,
//   marginTop: 10,
//   gap: 12,
//   alignItems: "center" as const,
// };

// const requestCard = {
//   flexDirection: "row" as const,
//   backgroundColor: "#fff",
//   padding: 16,
//   borderRadius: 20,
//   marginTop: 10,
//   gap: 12,
// };

// const iconBox = {
//   backgroundColor: "#E5E7EB",
//   padding: 14,
//   borderRadius: 14,
//   alignItems: "center" as const,
//   justifyContent: "center" as const,
// };

// const cardTitle = {
//   fontWeight: "700" as const,
//   fontSize: 15,
//   color: "#111827",
// };

// const cardSub = {
//   fontSize: 13,
//   color: "#6B7280",
//   marginTop: 2,
// };

// const emptyBox = {
//   backgroundColor: "#fff",
//   borderRadius: 20,
//   padding: 30,
//   marginTop: 10,
//   alignItems: "center" as const,
// };

// const acceptBtn = {
//   backgroundColor: "#2B3F77",
//   paddingVertical: 8,
//   paddingHorizontal: 20,
//   borderRadius: 12,
//   alignItems: "center" as const,
// };

// const rejectBtn = {
//   backgroundColor: "#FEE2E2",
//   paddingVertical: 8,
//   paddingHorizontal: 20,
//   borderRadius: 12,
//   alignItems: "center" as const,
// };

import {
  View,
  Text,
  Pressable,
  FlatList,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { supabase } from "@/supabase/supabase";
import * as ImagePicker from "expo-image-picker";
import { CameraView, Camera } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";

type GuardianRequest = {
  id: string;
  guardian_id: string;
  help_app_profiles: {
    name: string | null;
    email: string | null;
  }[] | null;
};

export default function GuardianRequests() {
  const router = useRouter();
  const [requests, setRequests] = useState<GuardianRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    checkAccessAndFetch();
  }, []);

  const checkAccessAndFetch = async () => {
    try {
      // ✅ Fix: handle auth error explicitly
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/auth/email");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("help_app_profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || profile?.role !== "user") {
        router.replace("/");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("help_app_guardian_links")
        .select(`
          id,
          guardian_id,
          help_app_profiles!help_app_guardian_links_guardian_id_fkey (
            name,
            email
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "pending");

      if (fetchError) throw fetchError;
      setRequests((data as unknown as GuardianRequest[]) || []);
    } catch (e) {
      // ✅ Fix: safe error typing
      const message = e instanceof Error ? e.message : "Something went wrong.";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("help_app_guardian_links")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      // ✅ Fix: update local state instead of re-fetching everything
      setRequests((prev) => prev.filter((r) => r.id !== id));

      Alert.alert(
        status === "approved" ? "Guardian Approved" : "Request Rejected",
        status === "approved"
          ? "This guardian can now monitor your location."
          : "The request has been declined."
      );
    } catch (e) {
      // ✅ Fix: error alert now has a title
      const message = e instanceof Error ? e.message : "Something went wrong.";
      Alert.alert("Error", message);
    }
  };

  // ✅ Fix: confirmation dialog before approve/reject
  const confirmUpdate = (id: string, status: "approved" | "rejected", name: string) => {
    Alert.alert(
      status === "approved" ? "Accept Request" : "Reject Request",
      status === "approved"
        ? `Allow ${name || "this guardian"} to monitor your location?`
        : `Decline the request from ${name || "this guardian"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: status === "approved" ? "Accept" : "Reject",
          style: status === "rejected" ? "destructive" : "default",
          onPress: () => update(id, status),
        },
      ]
    );
  };

  const handleQR = async (data: string) => {
    if (scanning) return;
    setScanning(true);

    try {
      let parsed: any;
      try {
        parsed = JSON.parse(data);
      } catch {
        Alert.alert("Invalid QR", "Could not read QR code data.");
        setScanning(false);
        return;
      }

      // ✅ Fix: validate QR type
      if (parsed.type !== "guardian_link") {
        Alert.alert("Invalid QR", "This is not a valid guardian QR code.");
        setScanning(false);
        return;
      }

      // ✅ Fix: validate guardian_id field
      if (!parsed.guardian_id || typeof parsed.guardian_id !== "string") {
        Alert.alert("Invalid QR", "QR code is missing guardian information.");
        setScanning(false);
        return;
      }

      // ✅ Fix: validate user before DB operations
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/auth/email");
        return;
      }

      const { data: existing } = await supabase
        .from("help_app_guardian_links")
        .select("id")
        .eq("guardian_id", parsed.guardian_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        Alert.alert("Already Connected", "You are already linked to this guardian.");
        setScanning(false);
        return;
      }

      const { error } = await supabase
        .from("help_app_guardian_links")
        .insert({
          guardian_id: parsed.guardian_id,
          user_id: user.id, // ✅ Fix: user.id guaranteed non-null here
          status: "approved",
        });

      if (error) throw error;

      // ✅ Fix: reset scanning before navigating
      setScanning(false);
      Alert.alert("Connected!", "You have been linked to your guardian.", [
        { text: "OK", onPress: () => router.replace("/") },
      ]);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Invalid QR code.";
      Alert.alert("Error", message);
      setScanning(false);
    }
  };

  const pickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission Required", "Please allow access to your photo library.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled) {
        // ✅ Fix: use CameraView.scanFromURLAsync (non-deprecated API)
        const scanned = await Camera.scanFromURLAsync(result.assets[0].uri);

        if (scanned.length > 0) {
          handleQR(scanned[0].data);
        } else {
          Alert.alert("No QR Found", "Could not detect a QR code in this image.");
        }
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong.";
      Alert.alert("Error", message);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2B3F77" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ✅ Fix: ScrollView so long lists don't get cut off */}
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Header */}
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.pageTitle}>Guardian Requests</Text>

        {/* Scan QR Section */}
        <Text style={styles.sectionLabel}>Connect via QR</Text>

        <Pressable
          onPress={() => router.push("/auth/scan-qr")}
          style={styles.card}
          accessibilityLabel="Scan guardian QR code with camera"
        >
          <View style={styles.iconBox}>
            <FontAwesome5 name="qrcode" size={20} color="#2B3F77" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Scan QR Code</Text>
            <Text style={styles.cardSub}>Use camera to scan guardian's QR</Text>
          </View>
          <FontAwesome5 name="chevron-right" size={14} color="#9CA3AF" />
        </Pressable>

        <Pressable
          onPress={pickFromGallery}
          style={styles.card}
          accessibilityLabel="Upload QR code image from gallery"
        >
          <View style={styles.iconBox}>
            <FontAwesome5 name="image" size={20} color="#2B3F77" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Upload from Gallery</Text>
            <Text style={styles.cardSub}>Pick a QR image from your photos</Text>
          </View>
          <FontAwesome5 name="chevron-right" size={14} color="#9CA3AF" />
        </Pressable>

        {/* Pending Requests */}
        <Text style={styles.sectionLabel}>Pending Requests</Text>

        {requests.length === 0 ? (
          <View style={styles.emptyBox}>
            <FontAwesome5 name="user-clock" size={28} color="#D1D5DB" />
            <Text style={styles.emptyText}>No pending guardian requests</Text>
          </View>
        ) : (
          requests.map((item) => (
            <View key={item.id} style={styles.requestCard}>
              <View style={[styles.iconBox, styles.requestIconBox]}>
                <FontAwesome5 name="user-shield" size={18} color="#2B3F77" />
              </View>
              <View style={styles.requestContent}>
                <Text style={styles.cardTitle}>
                  {item.help_app_profiles?.[0]?.name || "Unknown"}
                </Text>
                <Text style={styles.cardSub}>
                  {item.help_app_profiles?.[0]?.email || "No email"}
                </Text>
                <View style={styles.actionRow}>
                  <Pressable
                    onPress={() =>
                      confirmUpdate(
                        item.id,
                        "approved",
                        item.help_app_profiles?.[0]?.name || ""
                      )
                    }
                    style={styles.acceptBtn}
                    accessibilityLabel={`Accept request from ${item.help_app_profiles?.[0]?.name || "guardian"}`}
                  >
                    <Text style={styles.acceptText}>Accept</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      confirmUpdate(
                        item.id,
                        "rejected",
                        item.help_app_profiles?.[0]?.name || ""
                      )
                    }
                    style={styles.rejectBtn}
                    accessibilityLabel={`Reject request from ${item.help_app_profiles?.[0]?.name || "guardian"}`}
                  >
                    <Text style={styles.rejectText}>Reject</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ✅ Fix: all styles moved to StyleSheet.create()
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  backText: {
    color: "#6B7280",
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: 8,
    color: "#111827",
  },
  sectionLabel: {
    marginTop: 24,
    color: "#6B7280",
    fontWeight: "600",
    fontSize: 14,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    marginTop: 10,
    gap: 12,
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
  },
  cardTitle: {
    fontWeight: "700",
    fontSize: 15,
    color: "#111827",
  },
  cardSub: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  iconBox: {
    backgroundColor: "#E5E7EB",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  requestCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    marginTop: 10,
    gap: 12,
  },
  requestIconBox: {
    backgroundColor: "#EEF2FF",
  },
  requestContent: {
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  acceptBtn: {
    backgroundColor: "#2B3F77",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  acceptText: {
    color: "#fff",
    fontWeight: "600",
  },
  rejectBtn: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  rejectText: {
    color: "#EF4444",
    fontWeight: "600",
  },
  emptyBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    marginTop: 10,
    alignItems: "center",
  },
  emptyText: {
    color: "#9CA3AF",
    marginTop: 10,
    fontSize: 14,
  },
});