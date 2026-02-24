import { StyleSheet } from "react-native";
import { COLORS } from "./colors";

export const serviceCardStyles = StyleSheet.create({
  card: {
    flex: 1,
    height: 110,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    margin: 6,
  },
  text: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "700",
  },
});
