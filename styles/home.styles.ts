// import { StyleSheet } from "react-native";
// import { COLORS } from "./colors";

// export const homeStyles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.bg,
//     padding: 16,
//   },
//   header: {
//     marginBottom: 12,
//   },
//   hello: {
//     color: COLORS.muted,
//     fontSize: 16,
//   },
//   safe: {
//     color: COLORS.textDark,
//     fontSize: 28,
//     fontWeight: "800",
//   },
//   section: {
//     fontSize: 20,
//     fontWeight: "700",
//     marginVertical: 12,
//     color: COLORS.textDark,
//   },
//   bigCard: {
//     height: 110,
//     borderRadius: 24,
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 12,
//   },
//   bigText: {
//     color: COLORS.white,
//     fontSize: 20,
//     fontWeight: "800",
//   },
//   row: {
//     flexDirection: "row",
//   },
//   status: {
//     backgroundColor: COLORS.successBg,
//     padding: 14,
//     borderRadius: 14,
//     marginTop: 16,
//   },
//   statusText: {
//     color: COLORS.textDark,
//     fontWeight: "600",
//   },
// });

import { StyleSheet } from "react-native";
import { COLORS } from "./colors";

export const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 20,   // better side spacing
    paddingTop: 40,          // spacing from top
    paddingBottom: 24,       // bottom breathing space
  },

  header: {
    marginBottom: 18,
  },

  hello: {
    color: COLORS.muted,
    fontSize: 15,
    marginBottom: 4,
  },

  safe: {
    color: COLORS.textDark,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  section: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 12,
    color: COLORS.textDark,
  },

  bigCard: {
    height: 110,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  bigText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "800",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12, // cleaner spacing between cards (if using RN 0.71+)
  },

  status: {
    backgroundColor: COLORS.successBg,
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
  },

  statusText: {
    color: COLORS.textDark,
    fontWeight: "600",
    fontSize: 14,
  },
});
