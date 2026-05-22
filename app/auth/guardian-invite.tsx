// import { useState, useEffect, useRef } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   Pressable,
//   ActivityIndicator,
//   Alert,
// } from "react-native";
// import { useRouter } from "expo-router";
// import { supabase } from "@/supabase/supabase";
// import { SafeAreaView } from "react-native-safe-area-context";
// import QRCode from "react-native-qrcode-svg";
// import * as MediaLibrary from "expo-media-library";
// import { captureRef } from "react-native-view-shot";
// import { FontAwesome5 } from "@expo/vector-icons";

// export default function GuardianInviteScreen() {
//   const router = useRouter();

//   const [email, setEmail] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [guardianId, setGuardianId] = useState("");

//   const qrRef = useRef<any>(null);

//   useEffect(() => {
//     const getUser = async () => {
//       try {
//         const { data: { user }, error } = await supabase.auth.getUser();
//         if (error || !user) return;
//         setGuardianId(user.id);
//       } catch (err) {
//         console.error("Failed to get user:", err);
//       }
//     };
//     getUser();
//   }, []);

//   const qrData = JSON.stringify({
//     type: "guardian_link",
//     guardian_id: guardianId,
//   });

//   const downloadQR = async () => {
//     try {
//       const permission = await MediaLibrary.requestPermissionsAsync();
//       if (!permission.granted) {
//         Alert.alert("Permission required");
//         return;
//       }

//       const uri = await captureRef(qrRef, { format: "png", quality: 1 });
//       await MediaLibrary.saveToLibraryAsync(uri);

//       Alert.alert("QR saved to gallery!");
//     } catch {
//       Alert.alert("Error saving QR");
//     }
//   };

//   const sendInvite = async () => {
//     const cleanEmail = email.trim().toLowerCase();
//     if (!cleanEmail) return Alert.alert("Enter email");

//     setLoading(true);

//     try {
//       const { data: { user }, error: userError } = await supabase.auth.getUser();
//       if (userError || !user) {
//         Alert.alert("Session error", "Please try again.");
//         setLoading(false); // ✅ fixed — spinner stops on early return
//         return;
//       }

//       const { data: users } = await supabase
//         .from("help_app_profiles")
//         .select("id") // ✅ fixed — only fetch id, not full profile
//         .ilike("email", cleanEmail);

//       if (!users || users.length === 0) {
//         Alert.alert("User not found");
//         setLoading(false); // ✅ fixed — spinner stops on early return
//         return;
//       }

//       const target = users[0];

//       const { error } = await supabase
//         .from("help_app_guardian_links")
//         .insert({
//           guardian_id: user.id,
//           user_id: target.id,
//           status: "pending",
//         });

//       if (error) throw error;

//       Alert.alert("Invite sent");
//       router.replace("/auth/guardian-success");

//     } catch (e: any) {
//       Alert.alert(e.message);
//     } finally {
//       setLoading(false); // ✅ always runs for non-early-return paths
//     }
//   };

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
//       <View style={{ padding: 20 }}>

//         <Pressable onPress={() => router.back()}>
//           <Text style={{ color: "#6B7280" }}>← Back</Text>
//         </Pressable>

//         <Text style={{ fontSize: 28, fontWeight: "700" }}>
//           Add person to protect
//         </Text>

//         {/* QR */}
//         <Text style={{ marginTop: 30 }}>Pair their device</Text>

//         <View ref={qrRef} collapsable={false} style={card}>
//           <View style={iconBox}>
//             <FontAwesome5 name="qrcode" size={20} />
//           </View>

//           <View style={{ flex: 1 }}>
//             <Text style={title}>Scan QR Code</Text>

//             <View style={{ marginTop: 10 }}>
//               {guardianId ? (
//                 <QRCode value={qrData} size={120} />
//               ) : (
//                 <ActivityIndicator /> // ✅ fixed — show loader while guardianId loads
//               )}
//             </View>

//             <Pressable onPress={downloadQR}>
//               <Text style={{ color: "#2B3F77", marginTop: 6 }}>
//                 Download QR
//               </Text>
//             </Pressable>
//           </View>
//         </View>

//         {/* EMAIL */}
//         <Text style={{ marginTop: 20 }}>OR CONNECT VIA</Text>

//         <TextInput
//           placeholder="Enter email"
//           value={email}
//           onChangeText={setEmail}
//           keyboardType="email-address"
//           autoCapitalize="none"
//           style={input}
//         />

//         <Pressable
//           onPress={sendInvite}
//           disabled={!email || loading}
//           style={[
//             button,
//             { opacity: email ? 1 : 0.5 }
//           ]}
//         >
//           {loading ? (
//             <ActivityIndicator color="#fff" />
//           ) : (
//             <Text style={{ color: "#fff" }}>Send Invite</Text>
//           )}
//         </Pressable>

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
// };

// const iconBox = {
//   backgroundColor: "#E5E7EB",
//   padding: 14,
//   borderRadius: 14,
// };

// const title = {
//   fontWeight: "700" as const,
//   fontSize: 16,
// };

// const input = {
//   backgroundColor: "#fff",
//   padding: 16,
//   borderRadius: 16,
//   borderWidth: 1,
//   borderColor: "#E5E7EB",
//   marginTop: 10,
// };

// const button = {
//   backgroundColor: "#2B3F77",
//   padding: 16,
//   borderRadius: 20,
//   marginTop: 20,
//   alignItems: "center" as const,
// };


import { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/supabase/supabase";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import * as MediaLibrary from "expo-media-library";
import { captureRef } from "react-native-view-shot";
import { FontAwesome5 } from "@expo/vector-icons";

// Simple RFC-compliant email check
const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function GuardianInviteScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [guardianId, setGuardianId] = useState("");

  const qrRef = useRef<any>(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error || !user) return;
        setGuardianId(user.id);
      } catch (err) {
        console.error("Failed to get user:", err);
      }
    };
    getUser();
  }, []);

  // ✅ Fix 3 & 6: Only compute qrData once guardianId is ready, and memoize it
  const qrData = useMemo(() => {
    if (!guardianId) return null;
    return JSON.stringify({ type: "guardian_link", guardian_id: guardianId });
  }, [guardianId]);

  const downloadQR = async () => {
    // ✅ Fix 7: Guard against downloading a blank QR
    if (!guardianId) {
      Alert.alert("Please wait", "QR code is not ready yet.");
      return;
    }

    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission required", "Allow access to save the QR code.");
        return;
      }

      const uri = await captureRef(qrRef, { format: "png", quality: 1 });
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert("Saved!", "QR code saved to your gallery.");
    } catch {
      Alert.alert("Error", "Could not save the QR code.");
    }
  };

  const sendInvite = async () => {
    const cleanEmail = email.trim().toLowerCase();

    // ✅ Fix 4 & 8: Validate email format before hitting the DB
    if (!cleanEmail) return Alert.alert("Enter an email address.");
    if (!isValidEmail(cleanEmail)) return Alert.alert("Enter a valid email address.");
    if (cleanEmail.length > 254) return Alert.alert("Email address is too long.");

    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert("Session error", "Please log in again.");
        return;
      }

      // ✅ Fix 2: Prevent self-invite
      if (user.email?.toLowerCase() === cleanEmail) {
        Alert.alert("Invalid", "You cannot invite yourself.");
        return;
      }

      const { data: users, error: lookupError } = await supabase
        .from("help_app_profiles")
        .select("id")
        .ilike("email", cleanEmail)
        .limit(1); // no need to fetch more than one

      if (lookupError) throw lookupError;

      if (!users || users.length === 0) {
        Alert.alert("Not found", "No account found with that email.");
        return;
      }

      const target = users[0];

      // ✅ Fix 1: Check for an existing pending/accepted link before inserting
      const { data: existing, error: checkError } = await supabase
        .from("help_app_guardian_links")
        .select("id, status")
        .eq("guardian_id", user.id)
        .eq("user_id", target.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        const msg =
          existing.status === "accepted"
            ? "You are already linked with this person."
            : "An invite to this person is already pending.";
        Alert.alert("Already exists", msg);
        return;
      }

      const { error: insertError } = await supabase
        .from("help_app_guardian_links")
        .insert({
          guardian_id: user.id,
          user_id: target.id,
          status: "pending",
        });

      // ✅ Fix 9: Catch duplicate constraint errors gracefully
      if (insertError) {
        if (insertError.code === "23505") {
          Alert.alert("Already exists", "An invite for this person already exists.");
        } else {
          throw insertError;
        }
        return;
      }

      router.replace("/auth/guardian-success");
    } catch (e: any) {
      console.error("sendInvite error:", e);
      Alert.alert("Something went wrong", "Please try again.");
    } finally {
      // ✅ Fix 5: Single finally block handles ALL paths
      setLoading(false);
    }
  };

  const canSubmit = email.trim().length > 0 && !loading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <View style={{ padding: 20 }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: "#6B7280" }}>← Back</Text>
        </Pressable>

        <Text style={{ fontSize: 28, fontWeight: "700" }}>
          Add person to protect
        </Text>

        {/* QR */}
        <Text style={{ marginTop: 30 }}>Pair their device</Text>

        <View ref={qrRef} collapsable={false} style={card}>
          <View style={iconBox}>
            <FontAwesome5 name="qrcode" size={20} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={title}>Scan QR Code</Text>

            <View style={{ marginTop: 10 }}>
              {qrData ? (
                <QRCode value={qrData} size={120} />
              ) : (
                <ActivityIndicator />
              )}
            </View>

            <Pressable onPress={downloadQR}>
              <Text style={{ color: "#2B3F77", marginTop: 6 }}>
                Download QR
              </Text>
<View style={infoBox}>
  <Text style={infoTitle}>How to connect</Text>

  <Text style={infoText}>1. Install the app on the other phone</Text>
  <Text style={infoText}>2. Open Profile → Add Guardian</Text>
  <Text style={infoText}>3. Tap "Scan QR" and scan this code</Text>
</View>
              
            </Pressable>
          </View>
        </View>

        {/* EMAIL */}
        <Text style={{ marginTop: 20 }}>OR CONNECT VIA</Text>

        <TextInput
          placeholder="Enter email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={input}
        />

        <Pressable
          onPress={sendInvite}
          disabled={!canSubmit}
          style={[button, { opacity: canSubmit ? 1 : 0.5 }]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff" }}>Send Invite</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const card = {
  flexDirection: "row" as const,
  backgroundColor: "#fff",
  padding: 16,
  borderRadius: 20,
  marginTop: 10,
  gap: 12,
};

const iconBox = {
  backgroundColor: "#E5E7EB",
  padding: 14,
  borderRadius: 14,
};

const title = {
  fontWeight: "700" as const,
  fontSize: 16,
};

const input = {
  backgroundColor: "#fff",
  padding: 16,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: "#E5E7EB",
  marginTop: 10,
};

const infoBox = {
  marginTop: 12,
  backgroundColor: "#F9FAFB",
  padding: 12,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#E5E7EB",
};

const infoTitle = {
  fontWeight: "600" as const,
  marginBottom: 6,
  fontSize: 13,
};

const infoText = {
  fontSize: 12,
  color: "#6B7280",
  lineHeight: 18,
};
const button = {
  backgroundColor: "#2B3F77",
  padding: 16,
  borderRadius: 20,
  marginTop: 20,
  alignItems: "center" as const,
  

};