import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";

export default function GetStarted() {
  const router = useRouter();
  const [role, setRole] = useState<"user" | "guardian" | null>("guardian");

  const handleContinue = () => {
    if (!role) return;

    router.replace({
      pathname: "/auth/email",
      params: { role },
    });
  };

  return (
    <View style={styles.container}>
      {/* Icon */}
      <View style={styles.iconBox}>
        <Text style={{ fontSize: 28 }}>🛡️</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>
        How would you like to use this app?
      </Text>

      {/* Guardian Card */}
      <Pressable
        style={[
          styles.card,
          role === "guardian" && styles.cardActive,
        ]}
        onPress={() => setRole("guardian")}
      >
        <View style={styles.cardIcon}>
          <Text style={{ fontSize: 22 }}>👤</Text>
        </View>
        <View>
          <Text
            style={[
              styles.cardTitle,
              role === "guardian" && styles.cardTitleActive,
            ]}
          >
            I am a Guardian
          </Text>
          <Text
            style={[
              styles.cardSub,
              role === "guardian" && styles.cardSubActive,
            ]}
          >
            I want to protect someone I care about
          </Text>
        </View>
      </Pressable>

      {/* User Card */}
      <Pressable
        style={[
          styles.card,
          role === "user" && styles.cardActive,
        ]}
        onPress={() => setRole("user")}
      >
        <View style={styles.cardIcon}>
          <Text style={{ fontSize: 22 }}>🧑</Text>
        </View>
        <View>
          <Text
            style={[
              styles.cardTitle,
              role === "user" && styles.cardTitleActive,
            ]}
          >
            I need assistance
          </Text>
          <Text
            style={[
              styles.cardSub,
              role === "user" && styles.cardSubActive,
            ]}
          >
            I'd like help staying safe and connected
          </Text>
        </View>
      </Pressable>

      {/* Continue Button */}
      <Pressable
        style={[
          styles.button,
          { opacity: role ? 1 : 0.5 },
        ]}
        disabled={!role}
        onPress={handleContinue}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 20,
    justifyContent: "center",
  },

  iconBox: {
    alignSelf: "center",
    backgroundColor: "#E5E7EB",
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
    color: "#111827",
  },

  subtitle: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 16,
    marginBottom: 30,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },

  cardActive: {
    backgroundColor: "#2B3F77",
    borderColor: "#2B3F77",
  },

  cardIcon: {
    backgroundColor: "#E5E7EB",
    padding: 14,
    borderRadius: 14,
    marginRight: 14,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  cardSub: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },

  cardTitleActive: {
    color: "#fff",
  },

  cardSubActive: {
    color: "#E5E7EB",
  },

  button: {
    marginTop: 10,
    backgroundColor: "#2B3F77",
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});