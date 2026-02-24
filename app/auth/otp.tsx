
// import { View, Text, TextInput, Pressable, Alert } from "react-native";
// import { useRouter, useLocalSearchParams } from "expo-router";
// import { useState } from "react";
// import { authStyles as styles } from "@/styles/auth";
// import { supabase } from "@/supabase/supabase";

// export default function OtpScreen() {
//   const router = useRouter();
//   const { email, role } = useLocalSearchParams<{
//     email: string;
//     role: "user" | "guardian";
//   }>();

//   const [otp, setOtp] = useState("");
//   const [loading, setLoading] = useState(false);

//   const isValidOtp = otp.length === 6;

// const handleVerify = async () => {
//   try {
//     setLoading(true);

//     // 1️⃣ Verify OTP
//     const { error } = await supabase.auth.verifyOtp({
//       email: email!,
//       token: otp,
//       type: "email",
//     });

//     if (error) throw error;

//     // 2️⃣ Wait and fetch session properly
//     const {
//       data: { session },
//     } = await supabase.auth.getSession();

//     if (!session) {
//       throw new Error("Session not created. Try again.");
//     }

//     const user = session.user;

//     // 3️⃣ Save role in profile
//     const { error: profileError } = await supabase
//       .from("help_app_profiles")
//       .upsert({
//         id: user.id,
//         email: user.email,
//         role: role,
//       });

//     if (profileError) throw profileError;

//     // 4️⃣ Route
//     if (role === "guardian") {
//       router.replace("/auth/add-guardian");
//     } else {
//       router.replace("/");
//     }

//   } catch (error: any) {
//     Alert.alert("Error", error.message);
//   } finally {
//     setLoading(false);
//   }
// };


//   return (
//     <View style={styles.container}>
//       {/* App Name */}
//       <Text style={styles.title}>SafeWalk</Text>
//       <Text style={styles.subtitle}>Your safety companion</Text>

//       {/* Heading */}
//       <Text style={styles.heading}>Enter the code</Text>
//       <Text style={styles.sub}>Sent to {email}</Text>

//       {/* OTP Input */}
//       <TextInput
//         style={styles.input}
//         keyboardType="number-pad"
//         maxLength={6}
//         value={otp}
//         onChangeText={setOtp}
//         placeholder="••••••"
//       />

//       {/* Verify Button */}
//       <Pressable
//         style={[
//           styles.button,
//           { opacity: isValidOtp ? 1 : 0.5 },
//         ]}
//         disabled={!isValidOtp || loading}
//         onPress={handleVerify}
        
//       >

//         <Text style={styles.buttonText}>
//           {loading ? "Verifying..." : "Verify →"}
//         </Text>
//       </Pressable>

//       {/* Change Email */}
//       <Pressable onPress={() => router.replace("/auth/email")}>
//         <Text
//           style={{
//             textAlign: "center",
//             marginTop: 20,
//             color: "#6B7280",
//             fontWeight: "600",
//           }}
//         >
//           Change email
//         </Text>
//       </Pressable>
//     </View>
//   );
// }

import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { authStyles as styles } from "@/styles/auth";
import { supabase } from "@/supabase/supabase";

export default function OtpScreen() {
  const router = useRouter();

  const { email, role } = useLocalSearchParams<{
    email: string;
    role: "user" | "guardian";
  }>();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidOtp = otp.length === 6;

  if (!email || !role) {
    Alert.alert("Error", "Missing login data. Please try again.");
    router.replace("/auth/email");
    return null;
  }

  const handleVerify = async () => {
    try {
      setLoading(true);

      // 1️⃣ Verify OTP
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (error) throw error;

      // 2️⃣ Get session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error("Session not created.");

      const user = session.user;

      // 3️⃣ Fetch profile
      const { data: profile } = await supabase
        .from("help_app_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      // ---------- FIRST TIME LOGIN ----------
      if (!profile) {
        const { error: insertError } = await supabase
          .from("help_app_profiles")
          .insert({
            id: user.id,
            email: user.email,
            role,
          });

        if (insertError) throw insertError;

        if (role === "guardian") {
          router.replace("/auth/add-guardian");
        } else {
          router.replace("/profile");
        }

        return;
      }

      // ---------- ROLE MISMATCH ----------
      if (profile.role !== role) {
        await supabase.auth.signOut();
        Alert.alert(
          "Wrong Role",
          `This account is registered as ${profile.role}`
        );
        return;
      }

      // ---------- GUARDIAN ----------
      if (role === "guardian") {
        const { data: hasUser, error: rpcError } = await supabase.rpc(
          "has_guardian_user",
          { guardian_uuid: user.id }
        );

        if (rpcError) throw rpcError;

        if (hasUser) {
          // 🔥 Force Home tab
          router.replace("/");
        } else {
          router.replace("/auth/add-guardian");
        }

        return;
      }

      // ---------- USER ----------
      const isProfileComplete =
        profile.name &&
        profile.phone &&
        profile.dob &&
        profile.gender &&
        profile.hometown;

      if (!isProfileComplete) {
        router.replace("/profile");
      } else {
        // 🔥 Force Home tab
        router.replace("/");
      }

    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SafeWalk</Text>
      <Text style={styles.subtitle}>Your safety companion</Text>

      <Text style={styles.heading}>Enter the code</Text>
      <Text style={styles.sub}>Sent to {email}</Text>

      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
        placeholder="••••••"
        placeholderTextColor="#9CA3AF"
        autoFocus
      />

      <Pressable
        style={[styles.button, { opacity: isValidOtp && !loading ? 1 : 0.5 }]}
        disabled={!isValidOtp || loading}
        onPress={handleVerify}
      >
        <Text style={styles.buttonText}>
          {loading ? "Verifying..." : "Verify →"}
        </Text>
      </Pressable>

      <Pressable onPress={() => router.replace("/auth/email")}>
        <Text
          style={{
            textAlign: "center",
            marginTop: 20,
            color: "#6B7280",
            fontWeight: "600",
          }}
        >
          Change email
        </Text>
      </Pressable>
    </View>
  );
}
