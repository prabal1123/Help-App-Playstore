import { View, Text, SafeAreaView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { takeMeHomeStyles as styles } from "@/styles/takeMeHome";

export default function TakeMeHomeScreen() {

  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <Text style={styles.title}>Take Me Home</Text>
        <Pressable>
          <Text style={styles.voice}>🔊</Text>
        </Pressable>
      </View>

      {/* Map Placeholder */}
      <View style={styles.map}>
        <Text style={styles.mapText}>Map / Route Preview</Text>
      </View>

      {/* Direction Card */}
      <View style={styles.card}>
        <Text style={styles.direction}>↑ Walk straight</Text>
        <Text style={styles.sub}>for 200 meters</Text>

        <View style={styles.progressRow}>
          <View style={styles.progressBar} />
        </View>

        <View style={styles.meta}>
          <Text>1.2 km left</Text>
          <Text>~15 min</Text>
        </View>
      </View>

      {/* Alert Guardian */}
      <Pressable style={styles.alertBtn}>
        <Text style={styles.alertText}>🚨 Alert Guardian</Text>
      </Pressable>
    </SafeAreaView>
  );
}
