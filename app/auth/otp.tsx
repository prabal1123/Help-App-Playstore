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

//   if (!email || !role) {
//     Alert.alert("Error", "Missing login data. Please try again.");
//     router.replace("/auth/email");
//     return null;
//   }

//   const handleVerify = async () => {
//     try {
//       setLoading(true);

//       // Verify OTP
//       const { error } = await supabase.auth.verifyOtp({
//         email,
//         token: otp,
//         type: "email",
//       });

//       if (error) throw error;

//       // Get session
//       const {
//         data: { session },
//       } = await supabase.auth.getSession();

//       if (!session) throw new Error("Session not created.");

//       const user = session.user;

//       // Check profile
//       const { data: profile } = await supabase
//         .from("help_app_profiles")
//         .select("*")
//         .eq("id", user.id)
//         .maybeSingle();

//       // ---------- FIRST LOGIN ----------
//       if (!profile) {
//         const { error: insertError } = await supabase
//           .from("help_app_profiles")
//           .upsert({
//             id: user.id,
//             email: user.email,
//             role,
//           });

//         if (insertError) throw insertError;

//         if (role === "guardian") {
//           router.replace("/auth/add-guardian");
//         } else {
//           router.replace("/(tabs)/profile");
//         }

//         return;
//       }

//       // ---------- ROLE MISMATCH ----------
//       if (profile.role !== role) {
//         await supabase.auth.signOut();
//         Alert.alert(
//           "Wrong Role",
//           `This account is registered as ${profile.role}`
//         );
//         return;
//       }

//       // ---------- GUARDIAN ----------
//       if (role === "guardian") {
//         const { data: hasUser, error: rpcError } = await supabase.rpc(
//           "has_guardian_user",
//           { guardian_uuid: user.id }
//         );

//         if (rpcError) throw rpcError;

//         if (hasUser) {
//           router.replace("/");
//         } else {
//           router.replace("/auth/add-guardian");
//         }

//         return;
//       }

//       // ---------- USER ----------
//       const isProfileComplete =
//         profile.name &&
//         profile.phone &&
//         profile.dob &&
//         profile.gender &&
//         profile.hometown;

//       if (!isProfileComplete) {
//         router.replace("/(tabs)/profile");
//       } else {
//         router.replace("/");
//       }

//     } catch (error: any) {
//       Alert.alert("Error", error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>SafeWalk</Text>
//       <Text style={styles.subtitle}>Your safety companion</Text>

//       <Text style={styles.heading}>Enter the code</Text>
//       <Text style={styles.sub}>Sent to {email}</Text>

//       <TextInput
//         style={styles.input}
//         keyboardType="number-pad"
//         maxLength={6}
//         value={otp}
//         onChangeText={setOtp}
//         placeholder="••••••"
//         placeholderTextColor="#9CA3AF"
//         autoFocus
//       />

//       <Pressable
//         style={[styles.button, { opacity: isValidOtp && !loading ? 1 : 0.5 }]}
//         disabled={!isValidOtp || loading}
//         onPress={handleVerify}
//       >
//         <Text style={styles.buttonText}>
//           {loading ? "Verifying..." : "Verify →"}
//         </Text>
//       </Pressable>

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
import { View, Text, TextInput, Pressable, Alert, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
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
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const isValidOtp = otp.length === 6;

  // ✅ Fix: guard check in useEffect, not during render
  useEffect(() => {
    if (!email || !role) {
      Alert.alert("Error", "Missing login data. Please try again.");
      router.replace("/auth/email");
    }
  }, []);

  // ✅ Countdown timer for OTP expiry awareness
  useEffect(() => {
    if (countdown === 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  if (!email || !role) return null;

  // ✅ Resend OTP handler
  const handleResend = async () => {
    try {
      setResending(true);
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      Alert.alert("Code Resent", "A new code has been sent to your email.");
      setOtp("");
      setCountdown(60);
      setCanResend(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not resend code.";
      Alert.alert("Error", message);
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async () => {
    try {
      setLoading(true);

      // Verify OTP
      const { error: otpError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (otpError) throw otpError;

      // ✅ Fix: check session fetch error
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session) throw new Error("Session not created. Please try again.");

      const user = session.user;

      // ✅ Fix: select only needed fields, not select("*")
      const { data: profile, error: profileError } = await supabase
        .from("help_app_profiles")
        .select("id, role, name, phone, dob, gender, hometown")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      // ---------- FIRST LOGIN ----------
      if (!profile) {
        // ✅ Fix: use insert instead of upsert to avoid silent overwrites
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
          router.replace("/(tabs)/profile");
        }

        return;
      }

      // ---------- ROLE MISMATCH ----------
      if (profile.role !== role) {
        await supabase.auth.signOut();
        Alert.alert(
          "Wrong Role",
          `This account is registered as "${profile.role}". Please log in with the correct role.`
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

        router.replace(hasUser ? "/" : "/auth/add-guardian");
        return;
      }

      // ---------- USER ----------
      const isProfileComplete =
        profile.name &&
        profile.phone &&
        profile.dob &&
        profile.gender &&
        profile.hometown;

      router.replace(isProfileComplete ? "/" : "/profile");

    } catch (error) {
      // ✅ Fix: safe error typing, no more `any`
      const message = error instanceof Error ? error.message : "Something went wrong.";
      Alert.alert("Verification Failed", message);
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
        accessibilityLabel="Enter 6-digit OTP code"
      />

      {/* ✅ OTP expiry countdown */}
      <Text style={localStyles.countdown}>
        {canResend
          ? "Code may have expired."
          : `Code expires in ${countdown}s`}
      </Text>

      <Pressable
        style={[styles.button, { opacity: isValidOtp && !loading ? 1 : 0.5 }]}
        disabled={!isValidOtp || loading}
        onPress={handleVerify}
        accessibilityLabel="Verify OTP code"
      >
        <Text style={styles.buttonText}>
          {loading ? "Verifying..." : "Verify →"}
        </Text>
      </Pressable>

      {/* ✅ Resend OTP button */}
      <Pressable
        onPress={handleResend}
        disabled={!canResend || resending}
        accessibilityLabel="Resend OTP code"
        style={{ opacity: canResend && !resending ? 1 : 0.4 }}
      >
        <Text style={localStyles.resendText}>
          {resending ? "Resending..." : "Resend code"}
        </Text>
      </Pressable>

      {/* ✅ Fix: moved inline style to StyleSheet */}
      <Pressable
        onPress={() => router.replace("/auth/email")}
        accessibilityLabel="Change email address"
      >
        <Text style={localStyles.changeEmail}>Change email</Text>
      </Pressable>
    </View>
  );
}

const localStyles = StyleSheet.create({
  countdown: {
    textAlign: "center",
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 8,
    marginBottom: 4,
  },
  resendText: {
    textAlign: "center",
    marginTop: 14,
    color: "#5BA89C",
    fontWeight: "600",
    fontSize: 15,
  },
  changeEmail: {
    textAlign: "center",
    marginTop: 12,
    color: "#6B7280",
    fontWeight: "600",
    fontSize: 15,
  },
});