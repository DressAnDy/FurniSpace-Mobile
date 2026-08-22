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
  header: {
    backgroundColor: "#3A3330",
    paddingBottom: 20,
    paddingHorizontal: 19,
    paddingTop: 12,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 11,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 15,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  brandText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    letterSpacing: 1,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontFamily: "serif",
    fontSize: 22,
    marginTop: 2,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },
  content: {
    padding: 19,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    color: "#7A6F68",
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  requiredMark: {
    color: "#C9A86A",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(60,51,48,0.08)",
    borderRadius: 12,
    borderWidth: 1,
    color: "#2C2420",
    fontSize: 14,
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: "#E24B4A",
  },
  errorText: {
    color: "#E24B4A",
    fontSize: 11,
    marginTop: 4,
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: "#3A3330",
    borderRadius: 14,
    marginTop: 8,
    paddingVertical: 14,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  hintText: {
    color: "#7A6F68",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  dateField: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(60,51,48,0.08)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateFieldMain: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 10,
  },
  dateFieldText: {
    color: "#2C2420",
    flex: 1,
    fontSize: 14,
  },
  dateFieldPlaceholder: {
    color: "#B8ADA4",
  },
  dateClearText: {
    color: "#C9A86A",
    fontSize: 12,
    fontWeight: "600",
  },
  datePickerDoneButton: {
    alignItems: "flex-end",
    marginBottom: 8,
    marginTop: 4,
  },
  datePickerDoneText: {
    color: "#C9A86A",
    fontSize: 14,
    fontWeight: "600",
  },
});
