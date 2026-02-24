// import { View, Text, TextInput, Pressable, Alert } from "react-native";
// import { useState } from "react";
// import { supabase } from "@/supabase/supabase";
// import { authStyles as styles } from "@/styles/auth";

// export default function GuardianInviteScreen() {
//   const [email, setEmail] = useState("");
//   const [loading, setLoading] = useState(false);

//   const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

//   const handleSendInvite = async () => {
//     try {
//       setLoading(true);

//       // 1️⃣ Get current guardian session
//       const {
//         data: { session },
//       } = await supabase.auth.getSession();

//       if (!session) {
//         Alert.alert("Error", "Not authenticated");
//         return;
//       }

//       const guardianId = session.user.id;

//       // 2️⃣ Find user by email
// const { data: userProfile, error: userError } = await supabase
//   .from("help_app_profiles")
//   .select("id")
//   .eq("email", email.trim().toLowerCase())
//   .maybeSingle();


// if (userError) {
//   throw userError;
// }

// if (!userProfile) {
//   Alert.alert("User not found", "This email is not registered.");
//   return;
// }


//       // 3️⃣ Insert invite
//       const { error: insertError } = await supabase
//         .from("help_app_guardian_links")
//         .insert({
//           guardian_id: guardianId,
//           user_id: userProfile.id,
//           status: "pending",
//         });

//       if (insertError) {
//         if (insertError.code === "23505") {
//           Alert.alert("Already Sent", "Invite already exists.");
//         } else {
//           throw insertError;
//         }
//         return;
//       }

//       Alert.alert("Success", "Invite sent successfully!");
//       setEmail("");

//     } catch (error: any) {
//       Alert.alert("Error", error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.heading}>Send Invite</Text>
//       <Text style={styles.sub}>
//         Enter the email of the user you want to monitor
//       </Text>

//       <TextInput
//         placeholder="User email"
//         keyboardType="email-address"
//         autoCapitalize="none"
//         value={email}
//         onChangeText={setEmail}
//         style={styles.input}
//       />

//       <Pressable
//         style={[
//           styles.button,
//           { opacity: isValidEmail ? 1 : 0.5 },
//         ]}
//         disabled={!isValidEmail || loading}
//         onPress={handleSendInvite}
//       >
//         <Text style={styles.buttonText}>
//           {loading ? "Sending..." : "Send Invite"}
//         </Text>
//       </Pressable>
//     </View>
//   );
// }

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/supabase/supabase";

export default function GuardianInviteScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const sendInvite = async () => {
    const cleanEmail = email.trim().toLowerCase();

    console.log("📨 Attempting invite to:", cleanEmail);

    if (!cleanEmail) {
      Alert.alert("Error", "Please enter an email.");
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Get logged in guardian
      const {
        data: { user: currentUser },
        error: authError,
      } = await supabase.auth.getUser();

      console.log("👤 Current guardian:", currentUser?.id);
      console.log("🔐 Auth error:", authError);

      if (!currentUser) {
        Alert.alert("Error", "Not authenticated.");
        return;
      }

      // 2️⃣ Find user by email
      const { data: users, error: findError } = await supabase
        .from("help_app_profiles")
        .select("*")
        .ilike("email", cleanEmail);

      console.log("🔎 User search result:", users);
      console.log("🔎 User search error:", findError);

      if (findError) {
        Alert.alert("Error", "Failed to find user.");
        return;
      }

      if (!users || users.length === 0) {
        Alert.alert("Not Found", "No user with this email.");
        return;
      }

      const userProfile = users[0];
      console.log("✅ Found user ID:", userProfile.id);

      // 3️⃣ Prevent self invite
      if (userProfile.id === currentUser.id) {
        console.log("❌ Attempted self invite");
        Alert.alert("Error", "You cannot send request to yourself.");
        return;
      }

      // 4️⃣ Check existing link
      const { data: existingLink, error: linkError } = await supabase
        .from("help_app_guardian_links")
        .select("*")
        .eq("user_id", userProfile.id)
        .maybeSingle();

      console.log("🔗 Existing link:", existingLink);
      console.log("🔗 Link fetch error:", linkError);

      if (linkError) {
        Alert.alert("Error checking existing request.");
        return;
      }

      if (existingLink) {
        console.log("📌 Existing link status:", existingLink.status);

        // Different guardian already owns it
        if (existingLink.guardian_id !== currentUser.id) {
          console.log("🚫 Different guardian owns this link");
          Alert.alert(
            "Already Assigned",
            "This user already has a guardian."
          );
          return;
        }

        // Approved
        if (existingLink.status === "approved") {
          console.log("✅ Already approved");
          Alert.alert("Already Connected");
          router.replace("/auth/guardian-success");
          return;
        }

        // Pending
        if (existingLink.status === "pending") {
          console.log("⏳ Already pending");
          Alert.alert("Already Pending");
          router.replace("/auth/guardian-success");
          return;
        }

        // Rejected → retry logic
        if (existingLink.status === "rejected") {
          const retries = existingLink.retry_count || 0;
          console.log("🔁 Current retries:", retries);

          if (retries >= 3) {
            console.log("🚫 Retry limit reached");
            Alert.alert("Limit Reached (3 attempts max)");
            return;
          }

          const { error: updateError } = await supabase
            .from("help_app_guardian_links")
            .update({
              status: "pending",
              retry_count: retries + 1,
            })
            .eq("user_id", userProfile.id);

          console.log("🔄 Update error:", updateError);

          if (updateError) {
            Alert.alert("Failed to resend request.");
            return;
          }

          Alert.alert(`Request resent (${retries + 1}/3)`);
          setEmail("");
          router.replace("/auth/guardian-success");

          return;
        }
      }

      // 5️⃣ No row exists → insert
      console.log("➕ Inserting new guardian link");

      const { error: insertError } = await supabase
        .from("help_app_guardian_links")
        .insert({
          guardian_id: currentUser.id,
          user_id: userProfile.id,
          status: "pending",
          retry_count: 0,
        });

      console.log("📝 Insert error:", insertError);

      if (insertError) {
        Alert.alert("Failed to send invite.");
        return;
      }

      Alert.alert("Request sent successfully.");
      setEmail("");
      router.back();

    } catch (err) {
      console.log("🔥 Unexpected error:", err);
      Alert.alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add User</Text>

      <TextInput
        placeholder="Enter user email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={sendInvite}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send Invite</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#F7F7F7",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#FF5A5F",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
