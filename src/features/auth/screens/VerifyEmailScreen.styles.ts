import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#FAF8F5",
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  heroSection: {
    height: 180,
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
    bottom: 18,
    left: 0,
    position: "absolute",
    right: 0,
  },
  heroLogoBox: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 13,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontFamily: "serif",
    fontSize: 28,
    letterSpacing: 0.8,
    marginTop: 8,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 9,
    letterSpacing: 1.4,
    marginTop: 4,
  },
  formSection: {
    paddingHorizontal: 19,
    paddingTop: 20,
  },
  title: {
    color: "#2C2420",
    fontFamily: "serif",
    fontSize: 28,
  },
  subtitle: {
    color: "#7A6F68",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  fieldSection: {
    marginTop: 14,
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
    borderColor: "rgba(60,51,48,0.06)",
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    height: 45,
    marginTop: 7,
    paddingHorizontal: 15,
  },
  inputWrapReadOnly: {
    backgroundColor: "rgba(245,242,237,0.55)",
    borderColor: "rgba(201,168,106,0.25)",
  },
  input: {
    color: "#2C2420",
    flex: 1,
    fontSize: 13,
    marginLeft: 11,
    paddingVertical: 0,
  },
  inputReadOnly: {
    color: "#7A6F68",
  },
  inputOtp: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 6,
    textAlign: "center",
    marginLeft: 0,
  },
  otpHint: {
    color: "rgba(122,111,104,0.65)",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6,
    textAlign: "center",
  },
  button: {
    alignItems: "center",
    backgroundColor: "#3A3330",
    borderRadius: 15,
    flexDirection: "row",
    gap: 8,
    height: 45,
    justifyContent: "center",
    marginTop: 18,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },
  linkButton: {
    alignItems: "center",
    marginTop: 18,
  },
  linkText: {
    color: "#C9A86A",
    fontSize: 13,
    fontWeight: "600",
  },
});
