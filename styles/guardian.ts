import { StyleSheet } from "react-native";
import { COLORS } from "./colors";

export const guardianStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: 50, 
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  icon: {
    fontSize: 22,
  },

  userCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EAF4EF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 26,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "800",
  },
  status: {
    color: "#4CAF50",
    fontWeight: "600",
    marginTop: 2,
  },
  updated: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },
  battery: {
    backgroundColor: "#EAF8EE",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  batteryText: {
    color: "#4CAF50",
    fontWeight: "700",
  },

  // map: {
  //   height: 220,
  //   borderRadius: 24,
  //   backgroundColor: "#EEF2F1",
  //   alignItems: "center",
  //   justifyContent: "center",
  //   marginBottom: 16,
  // },
  map: {
  height: 220,
  borderRadius: 24,
  overflow: "hidden",   // ✅ important for rounded corners
  marginBottom: 16,
},

  safeCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#A7D7B5",
    alignItems: "center",
    justifyContent: "center",
  },
  homeMarker: {
    position: "absolute",
    left: 48,
  },
  userMarker: {
    position: "absolute",
    right: 36,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
  },
  cardSub: {
    color: COLORS.muted,
    fontSize: 15,
  },
  edit: {
    color: COLORS.green,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  alertDot: {
    fontSize: 18,
    marginRight: 10,
  },
  alertText: {
    fontWeight: "700",
    fontSize: 15,
  },
  alertTime: {
    color: COLORS.muted,
    fontSize: 13,
  },
  infoCard: {
  padding: 16,
  backgroundColor: "#fff",
  marginHorizontal: 16,
  marginTop: 10,
  borderRadius: 12,
},

userName: {
  fontSize: 18,
  fontWeight: "600",
},

updateText: {
  marginTop: 6,
  fontSize: 12,
  color: "gray",
},

radiusContainer: {
  marginTop: 15,
  paddingHorizontal: 16,
},

radiusButtons: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginTop: 10,
},

radiusBtn: {
  padding: 10,
  backgroundColor: "#eee",
  borderRadius: 8,
},

radiusBtnActive: {
  backgroundColor: "#cce5ff",
},

activateBtn: {
  marginTop: 15,
  backgroundColor: "#007bff",
  padding: 12,
  borderRadius: 10,
  alignItems: "center",
},

});
