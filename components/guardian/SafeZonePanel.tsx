

// import React from "react";
// import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
// import { MapMode, SafeZone } from "./useGuardianState";

// type LatLng = { latitude: number; longitude: number };

// interface Props {
//   // Add mode
//   mapMode: MapMode;
//   radius: number;
//   selectedCenter: LatLng | null;
//   onSetRadius: (r: number) => void;
//   onStartSafeZone: () => void;
//   onConfirmSafeZone: () => void;
//   onCancel: () => void;

//   // Safe zone list
//   safeZones: SafeZone[];
//   onEditZone: (zone: SafeZone) => void;
//   onDeleteZone: (zone: SafeZone) => void;

//   // Edit mode
//   editingZone: SafeZone | null;
//   editRadius: number;
//   editCenter: LatLng | null;
//   savingZone: boolean;
//   onSetEditRadius: (r: number) => void;
//   onSaveEdit: () => void;
//   onCancelEdit: () => void;
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
//   safeZones,
//   onEditZone,
//   onDeleteZone,
//   editingZone,
//   editRadius,
//   editCenter,
//   savingZone,
//   onSetEditRadius,
//   onSaveEdit,
//   onCancelEdit,
// }: Props) {

//   // ─── Edit mode UI ──────────────────────────────────────────────────────────
//   if (mapMode === "editSafeZone" && editingZone) {
//     return (
//       <View style={styles.container}>
//         <Text style={styles.sectionTitle}>✏️ Edit Safe Zone</Text>
//         <Text style={styles.hint}>Tap the map to move the center</Text>

//         <Text style={styles.label}>Radius:</Text>
//         <View style={styles.radiusButtons}>
//           {RADIUS_OPTIONS.map((r) => (
//             <Pressable
//               key={r}
//               onPress={() => onSetEditRadius(r)}
//               style={[styles.radiusBtn, editRadius === r && styles.radiusBtnActive]}
//             >
//               <Text style={[styles.radiusBtnText, editRadius === r && styles.radiusBtnTextActive]}>
//                 {r}m
//               </Text>
//             </Pressable>
//           ))}
//         </View>

//         {!editCenter && (
//           <Text style={styles.hint}>👆 Tap map to reposition zone center</Text>
//         )}

//         <Pressable
//           style={[styles.confirmBtn, (!editCenter || savingZone) && { opacity: 0.5 }]}
//           onPress={onSaveEdit}
//           disabled={!editCenter || savingZone}
//         >
//           {savingZone
//             ? <ActivityIndicator color="#fff" />
//             : <Text style={styles.btnText}>💾 Save Changes</Text>
//           }
//         </Pressable>
//         <Pressable style={styles.cancelBtn} onPress={onCancelEdit}>
//           <Text style={styles.btnText}>Cancel</Text>
//         </Pressable>
//       </View>
//     );
//   }

//   // ─── Add mode UI ───────────────────────────────────────────────────────────
//   return (
//     <View style={styles.container}>
//       <Text style={styles.sectionTitle}>🔵 Safe Zones</Text>
//       <Text style={styles.subtext}>
//         Guardian is notified when user exits a zone
//       </Text>

//       {/* ── Existing safe zones list ── */}
//       {safeZones.length > 0 && (
//         <View style={styles.zoneList}>
//           {safeZones.map((zone, index) => (
//             <View key={zone.id} style={styles.zoneRow}>
//               <View style={styles.zoneInfo}>
//                 <Text style={styles.zoneName}>Zone {index + 1}</Text>
//                 <Text style={styles.zoneMeta}>
//                   📍 {Number(zone.center_lat).toFixed(4)}, {Number(zone.center_lng).toFixed(4)}
//                 </Text>
//                 <Text style={styles.zoneMeta}>⭕ {zone.radius_meters}m radius</Text>
//               </View>
//               <View style={styles.zoneActions}>
//                 <Pressable
//                   style={styles.editBtn}
//                   onPress={() => onEditZone(zone)}
//                 >
//                   <Text style={styles.editBtnText}>✏️</Text>
//                 </Pressable>
//                 <Pressable
//                   style={styles.deleteBtn}
//                   onPress={() => onDeleteZone(zone)}
//                 >
//                   <Text style={styles.deleteBtnText}>🗑️</Text>
//                 </Pressable>
//               </View>
//             </View>
//           ))}
//         </View>
//       )}

//       {safeZones.length === 0 && (
//         <Text style={styles.emptyText}>No safe zones set yet</Text>
//       )}

//       {/* ── Add new zone section ── */}
//       <View style={styles.divider} />
//       <Text style={styles.label}>New Zone Radius:</Text>
//       <View style={styles.radiusButtons}>
//         {RADIUS_OPTIONS.map((r) => (
//           <Pressable
//             key={r}
//             onPress={() => onSetRadius(r)}
//             style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]}
//           >
//             <Text style={[styles.radiusBtnText, radius === r && styles.radiusBtnTextActive]}>
//               {r}m
//             </Text>
//           </Pressable>
//         ))}
//       </View>

//       {mapMode !== "safeZone" ? (
//         <Pressable style={styles.activateBtn} onPress={onStartSafeZone}>
//           <Text style={styles.btnText}>+ Add Safe Zone</Text>
//         </Pressable>
//       ) : (
//         <>
//           <Text style={styles.hint}>👆 Tap the map to place zone center</Text>
//           <Pressable
//             style={[styles.confirmBtn, !selectedCenter && { opacity: 0.5 }]}
//             onPress={onConfirmSafeZone}
//             disabled={!selectedCenter}
//           >
//             <Text style={styles.btnText}>✅ Confirm Safe Zone</Text>
//           </Pressable>
//           <Pressable style={styles.cancelBtn} onPress={onCancel}>
//             <Text style={styles.btnText}>Cancel</Text>
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
//   sectionTitle: {
//     fontWeight: "700",
//     fontSize: 15,
//     color: "#111827",
//     marginBottom: 2,
//   },
//   subtext: {
//     fontSize: 12,
//     color: "#6b7280",
//     marginBottom: 10,
//   },
//   label: {
//     fontWeight: "600",
//     fontSize: 13,
//     color: "#374151",
//     marginBottom: 6,
//   },
//   hint: {
//     fontSize: 12,
//     color: "#3b82f6",
//     marginBottom: 8,
//     fontStyle: "italic",
//   },
//   emptyText: {
//     fontSize: 13,
//     color: "#9ca3af",
//     marginBottom: 8,
//     fontStyle: "italic",
//   },
//   divider: {
//     height: 1,
//     backgroundColor: "#e5e7eb",
//     marginVertical: 12,
//   },

//   // ── Zone list ──
//   zoneList: {
//     gap: 8,
//     marginBottom: 4,
//   },
//   zoneRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#fff",
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: "#dbeafe",
//     padding: 10,
//     gap: 8,
//   },
//   zoneInfo: {
//     flex: 1,
//     gap: 2,
//   },
//   zoneName: {
//     fontWeight: "700",
//     fontSize: 13,
//     color: "#1e40af",
//   },
//   zoneMeta: {
//     fontSize: 11,
//     color: "#6b7280",
//   },
//   zoneActions: {
//     flexDirection: "row",
//     gap: 8,
//   },
//   editBtn: {
//     backgroundColor: "#dbeafe",
//     padding: 8,
//     borderRadius: 8,
//   },
//   editBtnText: {
//     fontSize: 16,
//   },
//   deleteBtn: {
//     backgroundColor: "#fee2e2",
//     padding: 8,
//     borderRadius: 8,
//   },
//   deleteBtnText: {
//     fontSize: 16,
//   },

//   // ── Radius buttons ──
//   radiusButtons: {
//     flexDirection: "row",
//     gap: 8,
//     marginBottom: 10,
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
//   radiusBtnText: {
//     fontSize: 13,
//     color: "#374151",
//     fontWeight: "600",
//   },
//   radiusBtnTextActive: {
//     color: "#fff",
//   },

//   // ── Action buttons ──
//   activateBtn: {
//     backgroundColor: "#16a34a",
//     paddingVertical: 12,
//     borderRadius: 12,
//     alignItems: "center",
//   },
//   confirmBtn: {
//     backgroundColor: "#16a34a",
//     paddingVertical: 12,
//     borderRadius: 12,
//     alignItems: "center",
//     marginBottom: 8,
//   },
//   cancelBtn: {
//     backgroundColor: "#6b7280",
//     paddingVertical: 12,
//     borderRadius: 12,
//     alignItems: "center",
//   },
//   btnText: {
//     color: "#fff",
//     fontWeight: "700",
//     fontSize: 14,
//   },
// });




import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { MapMode, SafeZone } from "./useGuardianState";

type LatLng = { latitude: number; longitude: number };

interface Props {
  mapMode: MapMode;
  radius: number;
  selectedCenter: LatLng | null;
  onSetRadius: (r: number) => void;
  onStartSafeZone: () => void;
  onConfirmSafeZone: () => void;
  onCancel: () => void;
  safeZones: SafeZone[];
  onEditZone: (zone: SafeZone) => void;
  onDeleteZone: (zone: SafeZone) => void;
  editingZone: SafeZone | null;
  editRadius: number;
  editCenter: LatLng | null;
  savingZone: boolean;
  onSetEditRadius: (r: number) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  // ── Name fields ──
  zoneName: string;
  onSetZoneName: (name: string) => void;
  editZoneName: string;
  onSetEditZoneName: (name: string) => void;
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
  zoneName,
  onSetZoneName,
  editZoneName,
  onSetEditZoneName,
}: Props) {

  // ─── Edit mode ─────────────────────────────────────────────────────────────
  if (mapMode === "editSafeZone" && editingZone) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Edit Safe Zone</Text>
        <Text style={styles.subtext}>Tap the map to reposition the center</Text>

        <Text style={styles.label}>Zone Name</Text>
        <TextInput
          style={styles.nameInput}
          placeholder="e.g. School, Park, Grandma's"
          placeholderTextColor="#9ca3af"
          value={editZoneName}
          onChangeText={onSetEditZoneName}
          maxLength={40}
        />

        <Text style={styles.label}>Radius</Text>
        <View style={styles.radiusButtons}>
          {RADIUS_OPTIONS.map((r) => (
            <Pressable
              key={r}
              onPress={() => onSetEditRadius(r)}
              style={[styles.radiusBtn, editRadius === r && styles.radiusBtnActive]}
            >
              <Text style={[styles.radiusBtnText, editRadius === r && styles.radiusBtnTextActive]}>
                {r >= 1000 ? `${r / 1000}km` : `${r}m`}
              </Text>
            </Pressable>
          ))}
        </View>

        {!editCenter && (
          <View style={styles.hintRow}>
            <Text style={styles.hintDot}>●</Text>
            <Text style={styles.hint}>Tap map to reposition zone center</Text>
          </View>
        )}

        <Pressable
          style={[styles.confirmBtn, (!editCenter || savingZone) && styles.btnDisabled]}
          onPress={onSaveEdit}
          disabled={!editCenter || savingZone}
        >
          {savingZone
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.btnText}>Save Changes</Text>
          }
        </Pressable>
        <Pressable style={styles.cancelBtn} onPress={onCancelEdit}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  // ─── Default / Add mode ────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerDot} />
        <View>
          <Text style={styles.sectionTitle}>Safe Zones</Text>
          <Text style={styles.subtext}>
            You're notified when {safeZones.length > 0 ? "they leave" : "no zones are set"}
          </Text>
        </View>
      </View>

      {/* Zone list */}
      {safeZones.length > 0 && (
        <View style={styles.zoneList}>
          {safeZones.map((zone, index) => (
            <View key={zone.id} style={styles.zoneRow}>
              <View style={styles.zoneIndex}>
                <Text style={styles.zoneIndexText}>{index + 1}</Text>
              </View>
              <View style={styles.zoneInfo}>
                <Text style={styles.zoneName}>
                  {zone.name?.trim() ? zone.name : `Zone ${index + 1}`}
                </Text>
                <Text style={styles.zoneMeta}>
                  {zone.radius_meters >= 1000
                    ? `${zone.radius_meters / 1000}km radius`
                    : `${zone.radius_meters}m radius`}
                </Text>
              </View>
              <View style={styles.zoneActions}>
                <Pressable style={styles.iconBtn} onPress={() => onEditZone(zone)}>
                  <Text style={styles.iconBtnText}>✏️</Text>
                </Pressable>
                <Pressable style={[styles.iconBtn, styles.iconBtnDanger]} onPress={() => onDeleteZone(zone)}>
                  <Text style={styles.iconBtnText}>🗑️</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {safeZones.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No zones added yet</Text>
        </View>
      )}

      <View style={styles.divider} />

      {/* Add new zone */}
      {mapMode !== "safeZone" ? (
        <>
          <Text style={styles.label}>Radius for new zone</Text>
          <View style={styles.radiusButtons}>
            {RADIUS_OPTIONS.map((r) => (
              <Pressable
                key={r}
                onPress={() => onSetRadius(r)}
                style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]}
              >
                <Text style={[styles.radiusBtnText, radius === r && styles.radiusBtnTextActive]}>
                  {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.activateBtn} onPress={onStartSafeZone}>
            <Text style={styles.btnText}>+ Add Safe Zone</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.label}>Zone Name <Text style={styles.optionalTag}>(optional)</Text></Text>
          <TextInput
            style={styles.nameInput}
            placeholder="e.g. School, Park, Grandma's"
            placeholderTextColor="#9ca3af"
            value={zoneName}
            onChangeText={onSetZoneName}
            maxLength={40}
          />

          <Text style={styles.label}>Radius</Text>
          <View style={styles.radiusButtons}>
            {RADIUS_OPTIONS.map((r) => (
              <Pressable
                key={r}
                onPress={() => onSetRadius(r)}
                style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]}
              >
                <Text style={[styles.radiusBtnText, radius === r && styles.radiusBtnTextActive]}>
                  {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.hintRow}>
            <Text style={styles.hintDot}>●</Text>
            <Text style={styles.hint}>Tap the map to place zone center</Text>
          </View>

          <Pressable
            style={[styles.confirmBtn, !selectedCenter && styles.btnDisabled]}
            onPress={onConfirmSafeZone}
            disabled={!selectedCenter}
          >
            <Text style={styles.btnText}>Confirm Safe Zone</Text>
          </Pressable>
          <Pressable style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  // ── Header ──
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  headerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3b82f6",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.2,
  },
  subtext: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 1,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dbeafe",
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  zoneIndex: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  zoneIndexText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3b82f6",
  },
  zoneInfo: {
    flex: 1,
  },
  zoneName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e3a5f",
    letterSpacing: -0.1,
  },
  zoneMeta: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 1,
  },
  zoneActions: {
    flexDirection: "row",
    gap: 6,
  },
  iconBtn: {
    backgroundColor: "#f3f4f6",
    padding: 7,
    borderRadius: 8,
  },
  iconBtnDanger: {
    backgroundColor: "#fef2f2",
  },
  iconBtnText: {
    fontSize: 14,
  },

  // ── Empty ──
  emptyState: {
    paddingVertical: 8,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: "#d1d5db",
    fontStyle: "italic",
  },

  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginVertical: 14,
  },

  // ── Labels & inputs ──
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  optionalTag: {
    fontWeight: "400",
    color: "#9ca3af",
    textTransform: "none",
    letterSpacing: 0,
  },
  nameInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    marginBottom: 14,
  },

  // ── Radius pills ──
  radiusButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  radiusBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#e5e7eb",
  },
  radiusBtnActive: {
    backgroundColor: "#16a34a",
  },
  radiusBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  radiusBtnTextActive: {
    color: "#fff",
  },

  // ── Hint ──
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  hintDot: {
    fontSize: 7,
    color: "#3b82f6",
  },
  hint: {
    fontSize: 12,
    color: "#3b82f6",
    fontWeight: "500",
  },

  // ── Buttons ──
  activateBtn: {
    backgroundColor: "#16a34a",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmBtn: {
    backgroundColor: "#16a34a",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  cancelBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  cancelBtnText: {
    color: "#6b7280",
    fontWeight: "600",
    fontSize: 14,
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.1,
  },
});