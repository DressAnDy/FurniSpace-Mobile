import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF8F5",
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: {
    color: "#2C2420",
    fontFamily: "serif",
    fontSize: 28,
  },
  subtitle: {
    color: "#7A6F68",
    fontSize: 13,
    marginTop: 6,
  },
  field: {
    marginTop: 16,
  },
  label: {
    color: "#7A6F68",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(60,51,48,0.12)",
    borderRadius: 12,
    borderWidth: 1,
    color: "#2C2420",
    fontSize: 14,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#3A3330",
    borderRadius: 12,
    marginTop: 20,
    paddingVertical: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  linkButton: {
    alignItems: "center",
    marginTop: 14,
  },
  linkText: {
    color: "#C9A86A",
    fontSize: 13,
    fontWeight: "600",
  },
});
