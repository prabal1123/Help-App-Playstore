import { View, Text, SafeAreaView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
// import { plumberStyles as styles } from "@/styles/plumber";
import { plumberStyles as styles } from "../../styles/plumber";

export default function PlumberScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Need Plumber</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Icon */}
      <View style={styles.iconContainer}>
        <View style={styles.icon}>
          <Text style={styles.iconText}>🚰</Text>
        </View>
      </View>

      {/* Info cards */}
      <View style={styles.card}>
        <Ionicons name="location-outline" size={22} color="#4FA89A" />
        <View>
          <Text style={styles.cardTitle}>Your location</Text>
          <Text style={styles.cardSub}>
            Will be shared with the service provider
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Ionicons name="time-outline" size={22} color="#F2B84B" />
        <View>
          <Text style={styles.cardTitle}>Estimated arrival</Text>
          <Text style={styles.cardSub}>15–30 minutes</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Ionicons name="call-outline" size={22} color="#4CAF50" />
        <View>
          <Text style={styles.cardTitle}>Guardian notified</Text>
          <Text style={styles.cardSub}>
            Your guardian will be informed
          </Text>
        </View>
      </View>

      {/* CTA */}
      <Pressable style={styles.callButton}>
        <Ionicons name="call" size={22} color="#fff" />
        <Text style={styles.callText}>Call Plumber Now</Text>
      </Pressable>
    </SafeAreaView>
  );
}
