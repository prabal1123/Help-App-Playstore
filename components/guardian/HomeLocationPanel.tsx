import React from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { HOME_RADIUS_METERS } from "./distanceUtils";
import { MapMode } from "./useGuardianState";

type LatLng = { latitude: number; longitude: number };
const hasHome = true;

interface Props {
  userName: string;
  mapMode: MapMode;
  pendingHome: LatLng | null;
  savingHome: boolean;
  onStartSetHome: () => void;
  onConfirmHome: () => void;
  onCancel: () => void;
}

export function HomeLocationPanel({
  userName,
  mapMode,
  pendingHome,
  savingHome,
  onStartSetHome,
  onConfirmHome,
  onCancel,
}: Props) {
  return (
    <View style={{ marginHorizontal: 16, marginTop: 12 }}>
      {mapMode !== "setHome" ? (
        <Pressable
          style={{
            backgroundColor: "#fff3e0",
            borderColor: "#e67e22",
            borderWidth: 1,
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: "center",
            marginBottom: 8,
          }}
          onPress={onStartSetHome}
        >
<Text>
  📍 {hasHome ? "Tap here to update home" : "Tap map to set home"}
</Text>
        </Pressable>
      ) : (
        <View style={{ gap: 8, marginBottom: 8 }}>
          <Pressable
            style={{
              backgroundColor: pendingHome ? "#e67e22" : "#ccc",
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: "center",
            }}
            onPress={onConfirmHome}
            disabled={!pendingHome || savingHome}
          >
            {savingHome ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                ✅ Confirm Home Location
              </Text>
            )}
          </Pressable>
          <Pressable
            style={{
              backgroundColor: "#f5f5f5",
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: "center",
            }}
            onPress={onCancel}
          >
            <Text style={{ color: "#666", fontWeight: "600" }}>Cancel</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}