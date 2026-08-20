import { Platform, StyleSheet } from "react-native";

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
    paddingHorizontal: 19,
    paddingTop: Platform.OS === "ios" ? 54 : 38,
    paddingBottom: 20,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  brandText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    letterSpacing: 1.2,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontFamily: "serif",
    fontSize: 28,
    marginTop: 2,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 19,
    paddingTop: 18,
  },
  centerState: {
    alignItems: "center",
    gap: 12,
    justifyContent: "center",
    minHeight: 280,
    paddingHorizontal: 24,
  },
  stateText: {
    color: "#7A6F68",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(58,51,48,0.08)",
    borderRadius: 18,
    borderTopColor: "#C9A86A",
    borderTopWidth: 3,
    borderWidth: 1,
    marginBottom: 16,
    padding: 18,
  },
  summaryLabel: {
    color: "#7A6F68",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  summaryAmount: {
    color: "#3A3330",
    fontFamily: "serif",
    fontSize: 34,
    marginTop: 8,
  },
  summaryMeta: {
    color: "#7A6F68",
    fontSize: 12,
    marginTop: 6,
  },
  sectionTitle: {
    color: "#3A3330",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  methodCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(58,51,48,0.08)",
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  methodCardPressed: {
    borderColor: "rgba(201,168,106,0.45)",
  },
  methodCardTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    padding: 16,
  },
  methodIconWrap: {
    alignItems: "center",
    borderRadius: 14,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  methodIconSePay: {
    backgroundColor: "rgba(201,168,106,0.16)",
  },
  methodIconPayOs: {
    backgroundColor: "rgba(37,99,235,0.12)",
  },
  methodTextWrap: {
    flex: 1,
  },
  methodTitle: {
    color: "#3A3330",
    fontSize: 15,
    fontWeight: "700",
  },
  methodDescription: {
    color: "#7A6F68",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  methodBadge: {
    backgroundColor: "#F5F2ED",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  methodBadgeText: {
    color: "#7A6F68",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  methodFooter: {
    backgroundColor: "#FAF8F5",
    borderTopColor: "rgba(58,51,48,0.06)",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  methodFooterText: {
    color: "#A8843E",
    fontSize: 11,
    fontWeight: "600",
  },
});
