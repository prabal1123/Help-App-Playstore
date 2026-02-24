// import { View, Text, TextInput, Pressable, Alert } from "react-native";
// import { useRouter } from "expo-router";
// import { useState } from "react";
// import { authStyles as styles } from "@/styles/auth";
// import { supabase } from "@/supabase/supabase";

// export default function AddGuardian() {
//   const router = useRouter();
//   const [guardianEmail, setGuardianEmail] = useState("");
//   const [loading, setLoading] = useState(false);

//   const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianEmail);

//   const handleAddGuardian = async () => {
//     try {
//       setLoading(true);

//       const {
//         data: { user },
//       } = await supabase.auth.getUser();

//       if (!user) throw new Error("User not authenticated");

//       // Save guardian in DB
//       const { error } = await supabase.from("help_app_guardians").insert({
//         user_id: user.id,
//         guardian_email: guardianEmail,
//       });

//       if (error) throw error;

//       // Call Edge Function to send invite
//       await supabase.functions.invoke("send-guardian-invite", {
//         body: {
//           guardianEmail,
//           userId: user.id,
//         },
//       });

//       Alert.alert("Invite Sent", "Guardian has received an invite link.");
//       router.push("/auth/guardian-success");

//     } catch (error: any) {
//       Alert.alert("Error", error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.sub}>Step 2 of 3</Text>

//       <Text style={styles.heading}>Add Guardian</Text>
//       <Text style={styles.sub}>
//         Your guardian will receive an invite link
//       </Text>

//       <TextInput
//         placeholder="Guardian's email address"
//         keyboardType="email-address"
//         autoCapitalize="none"
//         value={guardianEmail}
//         onChangeText={setGuardianEmail}
//         style={styles.input}
//       />

//       <Pressable
//         style={[styles.button, { opacity: isValidEmail ? 1 : 0.5 }]}
//         disabled={!isValidEmail || loading}
//         onPress={handleAddGuardian}
//       >
//         <Text style={styles.buttonText}>
//           {loading ? "Sending..." : "Send Invite →"}
//         </Text>
//       </Pressable>
//     </View>
//   );
// }

import { View, Text, Pressable, FlatList, Alert } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { supabase } from "@/supabase/supabase";
import { authStyles as styles } from "@/styles/auth";

export default function GuardianDashboard() {
  const router = useRouter();
  const [approvedUsers, setApprovedUsers] = useState<any[]>([]);

  const fetchApprovedUsers = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("help_app_guardian_links")
      .select(`
        id,
        user_id,
        help_app_profiles!help_app_guardian_links_user_id_fkey (
          id,
          email,
          full_name
        )
      `)
      .eq("guardian_id", user.id)
      .eq("status", "approved");

    if (!error && data) {
      setApprovedUsers(data);
    }
  };

  useEffect(() => {
    fetchApprovedUsers();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Your Users</Text>

      <FlatList
        data={approvedUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 15 }}>
            <Text style={{ fontSize: 16 }}>
              {item.help_app_profiles?.email}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ marginVertical: 20 }}>
            No approved users yet.
          </Text>
        }
      />

      <Pressable
        style={styles.button}
        onPress={() => router.push("/auth/guardian-invite")}
      >
        <Text style={styles.buttonText}>+ Add User</Text>
      </Pressable>
    </View>
  );
}
