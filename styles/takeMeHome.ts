
import { StyleSheet } from "react-native";
import { COLORS } from "./colors";

export const takeMeHomeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    marginBottom: 10,
  },

  back: {
    fontSize: 22,
    color: COLORS.textDark,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textDark,
  },

  voice: {
    fontSize: 22,
  },

  map: {
    height: 300,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 14,
    backgroundColor: "#ddd",
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  direction: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 4,
  },

  sub: {
    fontSize: 14,
    color: COLORS.muted,
  },

  navBtn: {
    backgroundColor: "#1A73E8",
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 14,
  },

  navBtnDisabled: {
    backgroundColor: "#93B8F5",
    opacity: 0.7,
  },

  navBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },

  navBtnSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    marginTop: 3,
  },

  alertBtn: {
    backgroundColor: COLORS.red,
    paddingVertical: 20,
    borderRadius: 18,
    alignItems: "center",
  },

  alertText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "800",
  },
});
