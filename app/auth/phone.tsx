import { View, Text, TextInput, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { authStyles as styles } from "@/styles/auth";

export default function PhoneScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");

  const isValidPhone = phone.length === 10;

  return (
    <View style={styles.container}>
      {/* Logo & App Name */}
      <View style={styles.center}>
        <View style={styles.logo}>
          <Text style={{ color: "#fff", fontSize: 40 }}>🛡️</Text>
        </View>
        <Text style={styles.title}>SafeWalk</Text>
        <Text style={styles.subtitle}>Your safety companion</Text>
      </View>

      {/* Heading */}
      <Text style={styles.heading}>Enter your number</Text>
      <Text style={styles.sub}>
        We'll send you a verification code
      </Text>

      {/* Phone Input */}
      <TextInput
        placeholder="Phone number"
        keyboardType="phone-pad"
        maxLength={10}
        value={phone}
        onChangeText={setPhone}
        style={styles.input}
      />

      {/* Continue Button */}
      <Pressable
        style={[
          styles.button,
          { opacity: isValidPhone ? 1 : 0.5 },
        ]}
        disabled={!isValidPhone}
        onPress={() => router.push("/auth/otp")}
      >
        <Text style={styles.buttonText}>Continue →</Text>
      </Pressable>
    </View>
  );
}
