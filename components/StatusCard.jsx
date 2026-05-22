import React from "react";
import { View, Text, StyleSheet } from "react-native";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface StatusCardProps {
  userName: string;
  isOutside: boolean;
  isAwayFromHome: boolean;
  homeLocation: Coordinate | null;
  safeZonesCount: number;
  lastUpdated: string | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function StatusCard({
  userName,
  isOutside,
  isAwayFromHome,
  homeLocation,
  safeZonesCount,
  lastUpdated,
}: StatusCardProps) {
  return (
    <View style={styles.card}>
      {/* Name */}
      <Text style={styles.userName}>{userName}</Text>

      {/* Safe Zone Status */}
      <View style={styles.row}>
        {safeZonesCount === 0 ? (
          <>
            <Text style={styles.icon}>⚠️</Text>
            <Text style={styles.noSafeZone}>No Safe Zone Set</Text>
          </>
        ) : isOutside ? (
          <>
            <Text style={styles.icon}>🚨</Text>
            <Text style={styles.outsideText}>Outside Safe Zone</Text>
          </>
        ) : (
          <>
            <Text style={styles.icon}>✅</Text>
            <Text style={styles.insideText}>Inside Safe Zone</Text>
          </>
        )}
      </View>

      {/* Home Status */}
      <View style={styles.row}>
        {isAwayFromHome ? (
          <>
            <Text style={styles.icon}>🏠</Text>
            <Text style={styles.awayText}>Away from Home</Text>
          </>
        ) : (
          <>
            <Text style={styles.icon}>🏠</Text>
            <Text style={styles.atHomeText}>At Home</Text>
          </>
        )}
      </View>

      {/* Home Coordinates */}
      {homeLocation && (
        <View style={styles.row}>
          <Text style={styles.icon}>📍</Text>
          <Text style={styles.meta}>
            Home: {homeLocation.latitude.toFixed(4)},{" "}
            {homeLocation.longitude.toFixed(4)}
          </Text>
        </View>
      )}

      {/* Last Updated */}
      {lastUpdated && (
        <Text style={styles.lastUpdated}>Last Updated: {lastUpdated}</Text>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  icon: {
    fontSize: 14,
    marginRight: 6,
  },
  noSafeZone: {
    fontSize: 14,
    color: "#92400e",
  },
  outsideText: {
    fontSize: 14,
    color: "#dc2626",
    fontWeight: "600",
  },
  insideText: {
    fontSize: 14,
    color: "#16a34a",
    fontWeight: "600",
  },
  awayText: {
    fontSize: 14,
    color: "#ea580c",
    fontWeight: "600",
  },
  atHomeText: {
    fontSize: 14,
    color: "#16a34a",
    fontWeight: "600",
  },
  meta: {
    fontSize: 13,
    color: "#475569",
  },
  lastUpdated: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 6,
  },
});