// import React from "react";
// import { View, Text, Pressable, StyleSheet } from "react-native";
// import { MapMode } from "./useGuardianState";

// type LatLng = { latitude: number; longitude: number };

// interface Props {
//   mapMode: MapMode;
//   radius: number;
//   selectedCenter: LatLng | null;
//   onSetRadius: (r: number) => void;
//   onStartSafeZone: () => void;
//   onConfirmSafeZone: () => void;
//   onCancel: () => void;
// }

// const RADIUS_OPTIONS = [100, 300, 500, 1000];

// export function SafeZonePanel({
//   mapMode,
//   radius,
//   selectedCenter,
//   onSetRadius,
//   onStartSafeZone,
//   onConfirmSafeZone,
//   onCancel,
// }: Props) {
//   return (
//     <View style={styles.container}>
//       <Text style={{ fontWeight: "600" }}>Set Radius:</Text>
//       <Text style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
//         Guardian is notified when user exits this zone
//       </Text>
//       <View style={styles.radiusButtons}>
//         {RADIUS_OPTIONS.map((r) => (
//           <Pressable
//             key={r}
//             onPress={() => onSetRadius(r)}
//             style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]}
//           >
//             <Text>{r}m</Text>
//           </Pressable>
//         ))}
//       </View>

//       {mapMode !== "safeZone" ? (
//         <Pressable style={styles.activateBtn} onPress={onStartSafeZone}>
//           <Text style={{ color: "#fff" }}>Start Adding Safe Zone</Text>
//         </Pressable>
//       ) : (
//         <>
//           <Pressable
//             style={[styles.activateBtn, !selectedCenter && { opacity: 0.5 }]}
//             onPress={onConfirmSafeZone}
//             disabled={!selectedCenter}
//           >
//             <Text style={{ color: "#fff" }}>Confirm Safe Zone</Text>
//           </Pressable>
//           <Pressable
//             style={[styles.activateBtn, { backgroundColor: "gray", marginTop: 8 }]}
//             onPress={onCancel}
//           >
//             <Text style={{ color: "#fff" }}>Cancel</Text>
//           </Pressable>
//         </>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     marginHorizontal: 16,
//     marginTop: 12,
//     padding: 16,
//     backgroundColor: "#f9fafb",
//     borderRadius: 14,
//     borderWidth: 1,
//     borderColor: "#e5e7eb",
//   },
//   radiusButtons: {
//     flexDirection: "row",
//     gap: 8,
//     marginVertical: 8,
//   },
//   radiusBtn: {
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 8,
//     backgroundColor: "#e5e7eb",
//   },
//   radiusBtnActive: {
//     backgroundColor: "#16a34a",
//   },
//   activateBtn: {
//     marginTop: 8,
//     backgroundColor: "#16a34a",
//     paddingVertical: 12,
//     borderRadius: 12,
//     alignItems: "center",
//   },
// });


import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { MapMode, SafeZone } from "./useGuardianState";

type LatLng = { latitude: number; longitude: number };

interface Props {
  // Add mode
  mapMode: MapMode;
  radius: number;
  selectedCenter: LatLng | null;
  onSetRadius: (r: number) => void;
  onStartSafeZone: () => void;
  onConfirmSafeZone: () => void;
  onCancel: () => void;

  // Safe zone list
  safeZones: SafeZone[];
  onEditZone: (zone: SafeZone) => void;
  onDeleteZone: (zone: SafeZone) => void;

  // Edit mode
  editingZone: SafeZone | null;
  editRadius: number;
  editCenter: LatLng | null;
  savingZone: boolean;
  onSetEditRadius: (r: number) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

const RADIUS_OPTIONS = [100, 300, 500, 1000];

export function SafeZonePanel({
  mapMode,
  radius,
  selectedCenter,
  onSetRadius,
  onStartSafeZone,
  onConfirmSafeZone,
  onCancel,
  safeZones,
  onEditZone,
  onDeleteZone,
  editingZone,
  editRadius,
  editCenter,
  savingZone,
  onSetEditRadius,
  onSaveEdit,
  onCancelEdit,
}: Props) {

  // ─── Edit mode UI ──────────────────────────────────────────────────────────
  if (mapMode === "editSafeZone" && editingZone) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>✏️ Edit Safe Zone</Text>
        <Text style={styles.hint}>Tap the map to move the center</Text>

        <Text style={styles.label}>Radius:</Text>
        <View style={styles.radiusButtons}>
          {RADIUS_OPTIONS.map((r) => (
            <Pressable
              key={r}
              onPress={() => onSetEditRadius(r)}
              style={[styles.radiusBtn, editRadius === r && styles.radiusBtnActive]}
            >
              <Text style={[styles.radiusBtnText, editRadius === r && styles.radiusBtnTextActive]}>
                {r}m
              </Text>
            </Pressable>
          ))}
        </View>

        {!editCenter && (
          <Text style={styles.hint}>👆 Tap map to reposition zone center</Text>
        )}

        <Pressable
          style={[styles.confirmBtn, (!editCenter || savingZone) && { opacity: 0.5 }]}
          onPress={onSaveEdit}
          disabled={!editCenter || savingZone}
        >
          {savingZone
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>💾 Save Changes</Text>
          }
        </Pressable>
        <Pressable style={styles.cancelBtn} onPress={onCancelEdit}>
          <Text style={styles.btnText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  // ─── Add mode UI ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>🔵 Safe Zones</Text>
      <Text style={styles.subtext}>
        Guardian is notified when user exits a zone
      </Text>

      {/* ── Existing safe zones list ── */}
      {safeZones.length > 0 && (
        <View style={styles.zoneList}>
          {safeZones.map((zone, index) => (
            <View key={zone.id} style={styles.zoneRow}>
              <View style={styles.zoneInfo}>
                <Text style={styles.zoneName}>Zone {index + 1}</Text>
                <Text style={styles.zoneMeta}>
                  📍 {Number(zone.center_lat).toFixed(4)}, {Number(zone.center_lng).toFixed(4)}
                </Text>
                <Text style={styles.zoneMeta}>⭕ {zone.radius_meters}m radius</Text>
              </View>
              <View style={styles.zoneActions}>
                <Pressable
                  style={styles.editBtn}
                  onPress={() => onEditZone(zone)}
                >
                  <Text style={styles.editBtnText}>✏️</Text>
                </Pressable>
                <Pressable
                  style={styles.deleteBtn}
                  onPress={() => onDeleteZone(zone)}
                >
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {safeZones.length === 0 && (
        <Text style={styles.emptyText}>No safe zones set yet</Text>
      )}

      {/* ── Add new zone section ── */}
      <View style={styles.divider} />
      <Text style={styles.label}>New Zone Radius:</Text>
      <View style={styles.radiusButtons}>
        {RADIUS_OPTIONS.map((r) => (
          <Pressable
            key={r}
            onPress={() => onSetRadius(r)}
            style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]}
          >
            <Text style={[styles.radiusBtnText, radius === r && styles.radiusBtnTextActive]}>
              {r}m
            </Text>
          </Pressable>
        ))}
      </View>

      {mapMode !== "safeZone" ? (
        <Pressable style={styles.activateBtn} onPress={onStartSafeZone}>
          <Text style={styles.btnText}>+ Add Safe Zone</Text>
        </Pressable>
      ) : (
        <>
          <Text style={styles.hint}>👆 Tap the map to place zone center</Text>
          <Pressable
            style={[styles.confirmBtn, !selectedCenter && { opacity: 0.5 }]}
            onPress={onConfirmSafeZone}
            disabled={!selectedCenter}
          >
            <Text style={styles.btnText}>✅ Confirm Safe Zone</Text>
          </Pressable>
          <Pressable style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.btnText}>Cancel</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 15,
    color: "#111827",
    marginBottom: 2,
  },
  subtext: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 10,
  },
  label: {
    fontWeight: "600",
    fontSize: 13,
    color: "#374151",
    marginBottom: 6,
  },
  hint: {
    fontSize: 12,
    color: "#3b82f6",
    marginBottom: 8,
    fontStyle: "italic",
  },
  emptyText: {
    fontSize: 13,
    color: "#9ca3af",
    marginBottom: 8,
    fontStyle: "italic",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 12,
  },

  // ── Zone list ──
  zoneList: {
    gap: 8,
    marginBottom: 4,
  },
  zoneRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dbeafe",
    padding: 10,
    gap: 8,
  },
  zoneInfo: {
    flex: 1,
    gap: 2,
  },
  zoneName: {
    fontWeight: "700",
    fontSize: 13,
    color: "#1e40af",
  },
  zoneMeta: {
    fontSize: 11,
    color: "#6b7280",
  },
  zoneActions: {
    flexDirection: "row",
    gap: 8,
  },
  editBtn: {
    backgroundColor: "#dbeafe",
    padding: 8,
    borderRadius: 8,
  },
  editBtnText: {
    fontSize: 16,
  },
  deleteBtn: {
    backgroundColor: "#fee2e2",
    padding: 8,
    borderRadius: 8,
  },
  deleteBtnText: {
    fontSize: 16,
  },

  // ── Radius buttons ──
  radiusButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  radiusBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
  },
  radiusBtnActive: {
    backgroundColor: "#16a34a",
  },
  radiusBtnText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
  },
  radiusBtnTextActive: {
    color: "#fff",
  },

  // ── Action buttons ──
  activateBtn: {
    backgroundColor: "#16a34a",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmBtn: {
    backgroundColor: "#16a34a",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  cancelBtn: {
    backgroundColor: "#6b7280",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});