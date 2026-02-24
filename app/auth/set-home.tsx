import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  primary: "#5BA89C",
  mapBg: "#EEF2F3",
  text: "#1F2937",
  muted: "#9CA3AF",
  border: "#E5E7EB",
};

export default function SetHomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <View style={{ padding: 20 }}>
        <Pressable onPress={() => router.back()}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "#F3F4F6",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="chevron-back" size={22} />
          </View>
        </Pressable>

        <Text style={{ color: COLORS.muted, marginTop: 14 }}>
          Step 3 of 3
        </Text>

        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
            color: COLORS.text,
            marginTop: 6,
          }}
        >
          Set Home Location
        </Text>
      </View>

      {/* Map Card */}
      <View
        style={{
          marginHorizontal: 20,
          backgroundColor: COLORS.mapBg,
          borderRadius: 28,
          height: 360,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Pin */}
        <View
          style={{
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: COLORS.primary,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="location-outline" size={28} color="#fff" />
        </View>

        <View
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: COLORS.primary,
            opacity: 0.35,
            marginTop: 6,
          }}
        />

        {/* Floating hint */}
        <View
          style={{
            position: "absolute",
            bottom: 22,
            backgroundColor: "#fff",
            paddingVertical: 14,
            paddingHorizontal: 26,
            borderRadius: 22,
          }}
        >
          <Text style={{ fontWeight: "600", fontSize: 15 }}>
            Drag the map to set your home
          </Text>
        </View>
      </View>

      {/* Landmark Input */}
      <View style={{ padding: 20 }}>
        <View
          style={{
            height: 60,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: COLORS.border,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            backgroundColor: "#fff",
          }}
        >
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={COLORS.muted}
          />
          <TextInput
            placeholder="Nearby landmark (optional)"
            placeholderTextColor={COLORS.muted}
            style={{
              flex: 1,
              marginLeft: 12,
              fontSize: 16,
            }}
          />
        </View>
      </View>

      {/* CTA */}
      <View style={{ padding: 20 }}>
        <Pressable
          onPress={() => router.replace("/auth/home-success")}
          style={{
            height: 64,
            borderRadius: 22,
            backgroundColor: COLORS.primary,
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "row",
          }}
        >
          <Ionicons name="location-outline" size={22} color="#fff" />
          <Text
            style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: "700",
              marginLeft: 10,
            }}
          >
            Confirm Home Location
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
