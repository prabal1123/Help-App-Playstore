import { StyleSheet } from "react-native";
import { COLORS } from "./colors";

export const electricianStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: 50,
    padding: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
  },

  iconContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  icon: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: "#F2B84B",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  iconText: {
    fontSize: 36,
  },

  card: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  cardSub: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 2,
  },

  callButton: {
    marginTop: 20,
    backgroundColor: "#F2B84B",
    borderRadius: 22,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  callText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
});
