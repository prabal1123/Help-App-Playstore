import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import { supabase } from "@/supabase/supabase";

export default function RoleScreen() {
  const [selected, setSelected] = useState<"guardian" | "user" | null>(null);
  const router = useRouter();

  const handleContinue = async () => {
    if (!selected) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // ✅ Save role in DB
      const { error } = await supabase
        .from("help_app_profiles")
        .update({ role: selected })
        .eq("id", user.id);

      if (error) {
        console.log("Role save error:", error);
        return;
      }

      // ✅ Navigate based on role
      if (selected === "guardian") {
        router.replace("/guardian");
      } else {
        router.replace("/auth/phone");
      }
    } catch (err) {
      console.log("Unexpected error:", err);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.icon}>🛡️</Text>
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>
              How would you like to use this app?
            </Text>
          </View>

          {/* Guardian Card */}
          <Pressable
            onPress={() => setSelected("guardian")}
            style={[
              styles.card,
              selected === "guardian" && styles.selectedCard,
            ]}
          >
            <Text style={styles.cardTitle}>I am a Guardian</Text>
            <Text style={styles.cardText}>
              I want to protect someone I care about
            </Text>
          </Pressable>

          {/* User Card */}
          <Pressable
            onPress={() => setSelected("user")}
            style={[
              styles.card,
              selected === "user" && styles.selectedCard,
            ]}
          >
            <Text style={styles.cardTitle}>I need assistance</Text>
            <Text style={styles.cardText}>
              I'd like help staying safe and connected
            </Text>
          </Pressable>

          {/* Continue Button */}
          <Pressable
            onPress={handleContinue}
            disabled={!selected}
            style={[
              styles.button,
              !selected && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  icon: {
    fontSize: 40,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  card: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "white",
  },
  selectedCard: {
    backgroundColor: "#2c3e75",
    borderColor: "#2c3e75",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  cardText: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748b",
  },
  button: {
    marginTop: 20,
    backgroundColor: "#2c3e75",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});