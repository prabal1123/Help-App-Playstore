// import { StyleSheet } from "react-native";
// import { COLORS } from "./colors";

// export const profileStyles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.bg,
//     padding: 16,
//   },
//   header: {
//     marginBottom: 16,
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: "800",
//     color: COLORS.textDark,
//   },

//   userCard: {
//     backgroundColor: COLORS.white,
//     borderRadius: 20,
//     padding: 16,
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 24,
//   },
//   avatar: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: "#EAF4EF",
//     alignItems: "center",
//     justifyContent: "center",
//     marginRight: 14,
//   },
//   avatarText: {
//     fontSize: 26,
//   },
//   name: {
//     fontSize: 18,
//     fontWeight: "800",
//     color: COLORS.textDark,
//   },
//   phone: {
//     fontSize: 14,
//     color: COLORS.muted,
//     marginTop: 2,
//   },

//   section: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: COLORS.muted,
//     marginBottom: 8,
//     marginTop: 8,
//   },

//   card: {
//     backgroundColor: COLORS.white,
//     borderRadius: 20,
//     marginBottom: 16,
//     overflow: "hidden",
//   },
//   row: {
//     paddingVertical: 16,
//     paddingHorizontal: 16,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     borderBottomWidth: 1,
//     borderBottomColor: "#EEF2F1",
//   },
//   rowText: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: COLORS.textDark,
//   },
//   arrow: {
//     fontSize: 22,
//     color: COLORS.muted,
//   },

//   logoutBtn: {
//     marginTop: 12,
//     backgroundColor: "#FEE2E2",
//     padding: 16,
//     borderRadius: 18,
//     alignItems: "center",
//   },
//   logoutText: {
//     color: "#DC2626",
//     fontSize: 16,
//     fontWeight: "800",
//   },
// });

// styles/profile.ts
import { StyleSheet } from "react-native";

export const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    backgroundColor: "#FFFFFF",
    padding: 25,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 15,
  },

  name: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 5,
  },

  sub: {
    color: "#888",
    marginBottom: 15,
  },

  editBtn: {
    backgroundColor: "#FF5A5F",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 10,
  },

  editText: {
    color: "#fff",
    fontWeight: "600",
  },

  logoutBtn: {
    backgroundColor: "#333",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
  },

  logoutText: {
    color: "#fff",
    fontWeight: "600",
  },

  saveBtn: {
    backgroundColor: "#28A745",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
  },

  saveText: {
    color: "#fff",
    fontWeight: "600",
  },

  input: {
    backgroundColor: "#F1F1F1",
    width: "100%",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#FFFFFF",
    margin: 15,
    padding: 20,
    borderRadius: 16,
  },

  cardItem: {
    fontSize: 15,
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 15,
  },

  connectedText: {
    fontSize: 15,
    color: "#28A745",
  },

  pendingText: {
    fontSize: 15,
    color: "#F0AD4E",
  },

  notConnectedText: {
    fontSize: 15,
    color: "#D9534F",
    marginBottom: 12,
  },

  primaryBtn: {
    backgroundColor: "#FF5A5F",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  primaryBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
});
