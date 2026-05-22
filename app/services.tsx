import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function ServicesScreen() {
  const router = useRouter();

  const ServiceCard = ({
    title,
    color,
    route,
  }: {
    title: string;
    color: string;
    route: string;
  }) => (
    <Pressable
      onPress={() => router.push(route)}
      style={{
        flex: 1,
        backgroundColor: color,
        paddingVertical: 30,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
      }}
    >
      <Text
        style={{
          color: "white",
          fontSize: 18,
          fontWeight: "600",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );

  return (
    <LinearGradient
      colors={["#e2eeee", "#c7dddd"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ marginTop: 30 }}>
            <Text
              style={{
                fontSize: 32,
                fontWeight: "700",
                color: "#0f2f2f",
              }}
            >
              Other Services
            </Text>

            <Text
              style={{
                marginTop: 8,
                fontSize: 15,
                color: "#3e6b6b",
              }}
            >
              Choose the service you need
            </Text>
          </View>

          {/* Grid */}
          <View style={{ marginTop: 40, gap: 18 }}>
            {/* Row 1 */}
            <View style={{ flexDirection: "row", gap: 18 }}>
              <ServiceCard
                title="⚡ Electrician"
                color="#f59e0b"
                route="/auth/electrician"
              />

              <ServiceCard
                title="🪚 Carpenter"
                color="#3b82f6"
                route="/auth/carpenter"
              />
            </View>

            {/* Row 2 */}
            <View style={{ flexDirection: "row", gap: 18 }}>
              <ServiceCard
                title="🚰 Plumber"
                color="#0f766e"
                route="/auth/plumber"
              />

              <ServiceCard
                title="🏥 Medical Help"
                color="#dc2626"
                route="/auth/medical"
              />
            </View>
          </View>

          {/* Back Button */}
          <Pressable
            onPress={() => router.back()}
            style={{
              marginTop: 40,
              paddingVertical: 14,
              borderRadius: 16,
              alignItems: "center",
              backgroundColor: "#f1f5f9",
              borderWidth: 1,
              borderColor: "#94a3b8",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#1e293b",
              }}
            >
              ← Back to Home
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}