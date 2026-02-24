import { StyleSheet } from "react-native";
import { COLORS } from "./colors";

export const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    //  justifyContent: "center",
    padding: 24,
  },
  center: {
    alignItems: "center",
    marginTop: 40,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.muted,
    marginBottom: 40,
  },
  heading: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 6,
  },
  sub: {
    fontSize: 16,
    color: COLORS.muted,
    marginBottom: 24,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 20,
  },
  button: {
    backgroundColor: COLORS.green,
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "800",
  },
  roleContainer: {
  marginVertical: 20,
},

roleButton: {
  padding: 14,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#ddd",
  marginBottom: 10,
  alignItems: "center",
},

roleButtonActive: {
  backgroundColor: "#007bff",
  borderColor: "#007bff",
},

roleText: {
  fontSize: 16,
  fontWeight: "600",
  color: "#000",
},

logoIcon: {
  color: "#fff",
  fontSize: 40,
},

});
