import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#FAF8F5",
    flex: 1,
  },
  heroSection: {
    height: 240,
    overflow: "hidden",
    position: "relative",
  },
  heroBackground: {
    backgroundColor: "#3A3330",
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(44,36,32,0.68)",
  },
  heroContent: {
    alignItems: "center",
    bottom: 14,
    left: 0,
    position: "absolute",
    right: 0,
  },
  heroLogoBox: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 15,
    borderWidth: 1,
    height: 45,
    justifyContent: "center",
    width: 45,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontFamily: "serif",
    fontSize: 42,
    letterSpacing: 1.2,
    marginTop: 8,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 9,
    letterSpacing: 1.8,
    marginTop: 4,
  },
  title: {
    color: "#2C2420",
    fontFamily: "serif",
    fontSize: 31,
  },
  subtitle: {
    color: "#7A6F68",
    fontSize: 13,
    marginTop: 4,
  },
  formSection: {
    paddingHorizontal: 19,
    paddingTop: 22,
  },
  fieldSection: {
    marginTop: 15,
  },
  label: {
    color: "#7A6F68",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
  },
  inputWrap: {
    alignItems: "center",
    backgroundColor: "#F5F2ED",
    borderRadius: 15,
    flexDirection: "row",
    height: 45,
    marginTop: 7,
    paddingHorizontal: 15,
  },
  input: {
    color: "#2C2420",
    flex: 1,
    fontSize: 13,
    marginLeft: 11,
  },
  passwordRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  forgotText: {
    color: "#C9A86A",
    fontSize: 11,
    fontWeight: "500",
  },
  button: {
    alignItems: "center",
    backgroundColor: "#3A3330",
    borderRadius: 15,
    flexDirection: "row",
    gap: 8,
    height: 45,
    justifyContent: "center",
    marginTop: 15,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },
  contactRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  contactText: {
    color: "#7A6F68",
    fontSize: 11,
  },
  contactAction: {
    color: "#C9A86A",
    fontSize: 15,
    fontWeight: "500",
  },
  copyright: {
    color: "rgba(122,111,104,0.4)",
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 22,
    textAlign: "center",
  },
});
