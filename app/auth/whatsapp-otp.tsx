import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { authStyles as styles } from "@/styles/auth";
import { supabase } from "@/supabase/supabase";

export default function WhatsAppOtpScreen() {
  const router = useRouter();
  const { phone, role } = useLocalSearchParams<{
    phone: string;
    role: "user" | "guardian";
  }>();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidOtp = otp.length === 6;

  if (!phone || !role) {
    Alert.alert("Error", "Missing login data. Please try again.");
    router.replace("/auth/email");
    return null;
  }

  const handleVerify = async () => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: "sms",
      });

      if (error) throw error;

      // Get session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error("Session not created.");

      const user = session.user;

      // Check profile
      const { data: profile } = await supabase
        .from("help_app_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      // First login — create profile
      if (!profile) {
        const { error: insertError } = await supabase
          .from("help_app_profiles")
          .upsert({
            id: user.id,
            email: user.email,
            phone: user.phone,
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

      // Role mismatch
      if (profile.role !== role) {
        await supabase.auth.signOut();
        Alert.alert(
          "Wrong Role",
          `This account is registered as ${profile.role}`
        );
        return;
      }

      // Guardian
      if (role === "guardian") {
        const { data: hasUser, error: rpcError } = await supabase.rpc(
          "has_guardian_user",
          { guardian_uuid: user.id }
        );
        if (rpcError) throw rpcError;
        router.replace(hasUser ? "/" : "/auth/add-guardian");
        return;
      }

      // User
      const isProfileComplete =
        profile.name &&
        profile.phone &&
        profile.dob &&
        profile.gender &&
        profile.hometown;

      router.replace(isProfileComplete ? "/" : "/profile");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { justifyContent: "center", flex: 1 }]}>
      {/* Logo */}
      <View style={styles.center}>
        <View style={[styles.logo, { backgroundColor: "#25D366" }]}>
          <Text style={styles.logoIcon}>💬</Text>
        </View>
        <Text style={styles.title}>SafeWalk</Text>
        <Text style={styles.subtitle}>Your safety companion</Text>
      </View>

      <Text style={styles.heading}>Enter the code</Text>
      <Text style={styles.sub}>Sent to {phone} via WhatsApp</Text>

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
        style={[
          styles.button,
          {
            backgroundColor: "#25D366",
            opacity: isValidOtp && !loading ? 1 : 0.5,
          },
        ]}
        disabled={!isValidOtp || loading}
        onPress={handleVerify}
      >
        <Text style={styles.buttonText}>
          {loading ? "Verifying..." : "Verify →"}
        </Text>
      </Pressable>

      <Pressable onPress={() => router.replace("/auth/phone")}>
        <Text
          style={{
            textAlign: "center",
            marginTop: 20,
            color: "#6B7280",
            fontWeight: "600",
          }}
        >
          Change phone number
        </Text>
      </Pressable>
    </View>
  );
}