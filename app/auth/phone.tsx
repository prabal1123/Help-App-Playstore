import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { authStyles as styles } from "@/styles/auth";
import { supabase } from "@/supabase/supabase";

export default function PhoneScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: "user" | "guardian" }>();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // Basic phone validation — at least 10 digits
  const isValidPhone = /^\+?[1-9]\d{9,14}$/.test(phone.replace(/\s/g, ""));

  const handleSendOTP = async () => {
    try {
      setLoading(true);

      // Format phone — ensure it starts with +
      const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;

      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) throw error;

      Alert.alert("OTP Sent", "Check your WhatsApp for the verification code.");

      router.push({
        pathname: "/auth/whatsapp-otp",
        params: { phone: formattedPhone, role },
      });
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.container, { justifyContent: "center", flex: 1 }]}>
          {/* Logo */}
          <View style={styles.center}>
            <View style={[styles.logo, { backgroundColor: "#25D366" }]}>
              <Text style={styles.logoIcon}>💬</Text>
            </View>
            <Text style={styles.title}>SafeWalk</Text>
            <Text style={styles.subtitle}>Your safety companion</Text>
          </View>

          <Text style={styles.heading}>Enter your phone</Text>
          <Text style={styles.sub}>
            We'll send a verification code via WhatsApp
          </Text>

          {/* Phone Input */}
          <TextInput
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
            autoCapitalize="none"
            returnKeyType="done"
            value={phone}
            onChangeText={setPhone}
            onSubmitEditing={handleSendOTP}
            style={styles.input}
          />

          <Text
            style={{ color: "#6B7280", fontSize: 13, marginBottom: 16, marginTop: -10 }}
          >
            Include country code e.g. +91 for India
          </Text>

          <Pressable
            style={[
              styles.button,
              { backgroundColor: "#25D366", opacity: isValidPhone && !loading ? 1 : 0.5 },
            ]}
            disabled={!isValidPhone || loading}
            onPress={handleSendOTP}
          >
            <Text style={styles.buttonText}>
              {loading ? "Sending..." : "Send via WhatsApp →"}
            </Text>
          </Pressable>

          {/* Back */}
          <Pressable onPress={() => router.back()}>
            <Text
              style={{
                textAlign: "center",
                marginTop: 20,
                color: "#6B7280",
                fontWeight: "600",
              }}
            >
              ← Use email instead
            </Text>
          </Pressable>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}