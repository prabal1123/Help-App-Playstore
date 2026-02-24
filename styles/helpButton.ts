import { StyleSheet } from "react-native";
import { COLORS } from "./colors";

export const helpButtonStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.red,
    borderRadius: 24,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  sos: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 8,
  },
  text: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "800",
  },
});
