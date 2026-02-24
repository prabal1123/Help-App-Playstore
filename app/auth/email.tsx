import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { authStyles as styles } from "@/styles/auth";
import { supabase } from "@/supabase/supabase";

export default function EmailScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"user" | "guardian" | null>(null);
  const [loading, setLoading] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleContinue = async () => {
    if (!role) {
      Alert.alert("Select Role", "Please choose User or Guardian.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: "exp://localhost:8081",
        },
      });

      if (error) throw error;

      Alert.alert("OTP Sent", "Check your email for verification code.");

      router.push({
        pathname: "/auth/otp",
        params: { email, role },
      });

    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo Section */}
      <View style={styles.center}>
        <View style={styles.logo}>
          <Text style={styles.logoIcon}>🛡️</Text>
        </View>
        <Text style={styles.title}>SafeWalk</Text>
        <Text style={styles.subtitle}>Your safety companion</Text>
      </View>

      {/* Role Selection */}
      <View style={styles.roleContainer}>
        <Pressable
          style={[
            styles.roleButton,
            role === "user" && styles.roleButtonActive,
          ]}
          onPress={() => setRole("user")}
        >
          <Text style={styles.roleText}>🔵 I am a User</Text>
        </Pressable>

        <Pressable
          style={[
            styles.roleButton,
            role === "guardian" && styles.roleButtonActive,
          ]}
          onPress={() => setRole("guardian")}
        >
          <Text style={styles.roleText}>🟣 I am a Guardian</Text>
        </Pressable>
      </View>

      {/* Heading */}
      <Text style={styles.heading}>Enter your email</Text>
      <Text style={styles.sub}>
        We'll send you a verification code
      </Text>

      {/* Email Input */}
      <TextInput
        placeholder="Email address"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      {/* Continue Button */}
      <Pressable
        style={[
          styles.button,
          { opacity: isValidEmail && role ? 1 : 0.5 },
        ]}
        disabled={!isValidEmail || !role || loading}
        onPress={handleContinue}
      >
        <Text style={styles.buttonText}>
          {loading ? "Sending..." : "Continue →"}
        </Text>
      </Pressable>
    </View>
  );
}
