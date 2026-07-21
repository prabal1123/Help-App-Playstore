// import React from "react";
// import { View, Text, StyleSheet } from "react-native";

// type LatLng = { latitude: number; longitude: number };

// interface Props {
//   userName: string;
//   isOutside: boolean;
//   isAwayFromHome: boolean;
//   homeLocation: LatLng | null;
//   safeZonesCount: number;
//   lastUpdated: string;
// }

// export function StatusCard({
//   userName,
//   isOutside,
//   isAwayFromHome,
//   homeLocation,
//   safeZonesCount,
//   lastUpdated,
// }: Props) {
//   return (
//     <View style={styles.card}>
//       <Text style={styles.userName}>{userName}</Text>

//       {safeZonesCount === 0 ? (
//         <Text style={styles.noZone}>⚠️ No Safe Zone Set</Text>
//       ) : (
//         <Text style={[styles.zoneStatus, { color: isOutside ? "red" : "green" }]}>
//           {isOutside ? "🚨 Outside Safe Zones" : "✅ Inside Safe Zone"}
//         </Text>
//       )}

//       {homeLocation && (
//         <Text
//           style={[
//             styles.homeStatus,
//             { color: isAwayFromHome ? "#ff8c00" : "#16a34a" },
//           ]}
//         >
//           {isAwayFromHome ? "🏠 Away from Home" : "🏠 At Home"}
//         </Text>
//       )}

//       {homeLocation && (
//         <Text style={styles.coords}>
//           🏠 Home: {homeLocation.latitude.toFixed(4)},{" "}
//           {homeLocation.longitude.toFixed(4)}
//         </Text>
//       )}

//       {lastUpdated ? (
//         <Text style={styles.updated}>Last Updated: {lastUpdated}</Text>
//       ) : null}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   card: {
//     marginHorizontal: 16,
//     marginVertical: 8,
//     padding: 14,
//     backgroundColor: "#fff",
//     borderRadius: 14,
//     borderWidth: 1,
//     borderColor: "#e5e7eb",
//     elevation: 2,
//   },
//   userName: { fontWeight: "800", fontSize: 17, color: "#111", marginBottom: 4 },
//   noZone: { color: "#888", fontWeight: "600" },
//   zoneStatus: { fontWeight: "600" },
//   homeStatus: { fontWeight: "600", marginTop: 2 },
//   coords: { fontSize: 12, color: "#666", marginTop: 2 },
//   updated: { fontSize: 12, color: "#999", marginTop: 4 },
// });


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
  batteryLevel?: number | null;   // 0–100
  batteryCharging?: boolean;
}

function BatteryIcon({ level, charging }: { level: number; charging?: boolean }) {
  const color =
    charging ? "#16a34a" :
    level <= 15 ? "#ef4444" :
    level <= 35 ? "#f59e0b" :
    "#16a34a";

  const fillWidth = Math.max(2, Math.round((level / 100) * 18));

  return (
    <View style={batteryStyles.wrapper}>
      {/* Body */}
      <View style={batteryStyles.body}>
        <View style={[batteryStyles.fill, { width: fillWidth, backgroundColor: color }]} />
      </View>
      {/* Terminal nub */}
      <View style={[batteryStyles.nub, { backgroundColor: color }]} />
      {/* Charging bolt */}
      {charging && <Text style={batteryStyles.bolt}>⚡</Text>}
    </View>
  );
}

function StatusPill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={[pillStyles.pill, { backgroundColor: bg }]}>
      <Text style={[pillStyles.text, { color }]}>{label}</Text>
    </View>
  );
}

export function StatusCard({
  userName,
  isOutside,
  isAwayFromHome,
  homeLocation,
  safeZonesCount,
  lastUpdated,
  batteryLevel,
  batteryCharging,
}: Props) {
  const hasBattery = batteryLevel != null;
  const batteryColor =
    batteryCharging ? "#16a34a" :
    (batteryLevel ?? 100) <= 15 ? "#ef4444" :
    (batteryLevel ?? 100) <= 35 ? "#f59e0b" :
    "#4b5563";

  return (
    <View style={styles.card}>
      {/* ── Top row: name + battery ── */}
      <View style={styles.topRow}>
        <Text style={styles.userName}>{userName}</Text>
        {hasBattery && (
          <View style={styles.batteryGroup}>
            <BatteryIcon level={batteryLevel!} charging={batteryCharging} />
            <Text style={[styles.batteryLabel, { color: batteryColor }]}>
              {batteryCharging ? "Charging" : `${batteryLevel}%`}
            </Text>
          </View>
        )}
      </View>

      {/* ── Status pills ── */}
      <View style={styles.pillsRow}>
        {safeZonesCount === 0 ? (
          <StatusPill label="No Safe Zone" color="#92400e" bg="#fef3c7" />
        ) : (
          <StatusPill
            label={isOutside ? "Outside Zone" : "Inside Zone"}
            color={isOutside ? "#991b1b" : "#14532d"}
            bg={isOutside ? "#fef2f2" : "#f0fdf4"}
          />
        )}
        {homeLocation && (
          <StatusPill
            label={isAwayFromHome ? "Away from Home" : "At Home"}
            color={isAwayFromHome ? "#92400e" : "#14532d"}
            bg={isAwayFromHome ? "#fff7ed" : "#f0fdf4"}
          />
        )}
      </View>

      {/* ── Last seen ── */}
      {lastUpdated ? (
        <View style={styles.lastSeenRow}>
          <View style={styles.lastSeenDot} />
          <Text style={styles.lastSeenText}>Last seen {lastUpdated}</Text>
        </View>
      ) : (
        <View style={styles.lastSeenRow}>
          <View style={[styles.lastSeenDot, { backgroundColor: "#d1d5db" }]} />
          <Text style={[styles.lastSeenText, { color: "#d1d5db" }]}>Waiting for location…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  userName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.3,
  },
  batteryGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  batteryLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  lastSeenRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  lastSeenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22c55e",
  },
  lastSeenText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
});

const pillStyles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});

const batteryStyles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  body: {
    width: 22,
    height: 11,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: "#9ca3af",
    padding: 1.5,
    justifyContent: "center",
  },
  fill: {
    height: "100%",
    borderRadius: 1.5,
  },
  nub: {
    width: 2.5,
    height: 5,
    borderRadius: 1,
    marginLeft: 1,
  },
  bolt: {
    position: "absolute",
    fontSize: 7,
    left: 5,
    top: -1,
  },
});