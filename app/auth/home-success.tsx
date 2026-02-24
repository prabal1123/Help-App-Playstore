import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { authStyles as styles } from "@/styles/auth";

export default function HomeSuccessScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Step info */}
      <Text style={styles.sub}>Step 3 of 3</Text>

      {/* Success content */}
      <View style={styles.center}>
        <Text style={{ fontSize: 72 }}>✅</Text>

        <Text style={styles.heading}>All Set!</Text>

        <Text style={[styles.sub, { textAlign: "center", marginTop: 8 }]}>
          Your home location has been saved.{"\n"}
          Your guardian has been notified.
        </Text>
      </View>

      {/* Go to Home */}
      <Pressable
        style={[styles.button, { marginTop: 40 }]}
        onPress={() => router.replace("/")}
      >
        <Text style={styles.buttonText}>Go to Home Screen</Text>
      </Pressable>
    </View>
  );
}
