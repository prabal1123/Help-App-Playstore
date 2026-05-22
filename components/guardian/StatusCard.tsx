import React from "react";
import { View, Text, StyleSheet } from "react-native";

type LatLng = { latitude: number; longitude: number };

interface Props {
  userName: string;
  isOutside: boolean;
  isAwayFromHome: boolean;
  homeLocation: LatLng | null;
  safeZonesCount: number;
  lastUpdated: string;
}

export function StatusCard({
  userName,
  isOutside,
  isAwayFromHome,
  homeLocation,
  safeZonesCount,
  lastUpdated,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.userName}>{userName}</Text>

      {safeZonesCount === 0 ? (
        <Text style={styles.noZone}>⚠️ No Safe Zone Set</Text>
      ) : (
        <Text style={[styles.zoneStatus, { color: isOutside ? "red" : "green" }]}>
          {isOutside ? "🚨 Outside Safe Zones" : "✅ Inside Safe Zone"}
        </Text>
      )}

      {homeLocation && (
        <Text
          style={[
            styles.homeStatus,
            { color: isAwayFromHome ? "#ff8c00" : "#16a34a" },
          ]}
        >
          {isAwayFromHome ? "🏠 Away from Home" : "🏠 At Home"}
        </Text>
      )}

      {homeLocation && (
        <Text style={styles.coords}>
          🏠 Home: {homeLocation.latitude.toFixed(4)},{" "}
          {homeLocation.longitude.toFixed(4)}
        </Text>
      )}

      {lastUpdated ? (
        <Text style={styles.updated}>Last Updated: {lastUpdated}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 14,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    elevation: 2,
  },
  userName: { fontWeight: "800", fontSize: 17, color: "#111", marginBottom: 4 },
  noZone: { color: "#888", fontWeight: "600" },
  zoneStatus: { fontWeight: "600" },
  homeStatus: { fontWeight: "600", marginTop: 2 },
  coords: { fontSize: 12, color: "#666", marginTop: 2 },
  updated: { fontSize: 12, color: "#999", marginTop: 4 },
});